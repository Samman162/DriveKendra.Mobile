export const NEPAL_PHONE_DIGITS = /^(?:977)?(9[78]\d{8}|0[1-9]\d{7})$/;
export const NEPAL_PHONE_ERROR = 'Enter a valid Nepal mobile (97/98) or landline number.';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function readString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function readOptionalString(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function readNumber(body: Record<string, unknown>, key: string): number | null {
  const value = body[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normalizeNepalPhone(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function isValidNepalPhone(value: string): boolean {
  return NEPAL_PHONE_DIGITS.test(normalizeNepalPhone(value));
}

export function isHoneypotTriggered(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function parseDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export type BookingInput = {
  full_name: string;
  phone_number: string;
  email: string | null;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: Date;
  return_date: Date | null;
  passenger_count: number;
  trip_type: 'One Way' | 'Round Trip';
  vehicle_type_id: number;
  additional_details: string | null;
};

export function parseBooking(body: unknown): BookingInput {
  const record = asRecord(body);
  if (isHoneypotTriggered(record.website_hp)) {
    throw new HttpError(400, 'Invalid submission.');
  }

  const fullName = readString(record, 'full_name');
  const phone = normalizeNepalPhone(readString(record, 'phone_number'));
  const email = readOptionalString(record, 'email');
  const pickupLocation = readString(record, 'pickup_location');
  const dropoffLocation = readString(record, 'dropoff_location');
  const additionalDetails = readOptionalString(record, 'additional_details');
  const tripTypeRaw = readString(record, 'trip_type');
  const passengerCount = readNumber(record, 'passenger_count') ?? 1;
  const vehicleTypeId = readNumber(record, 'vehicle_type_id');
  const pickupDate = parseDateOnly(readOptionalString(record, 'pickup_date'));
  const returnDate = parseDateOnly(readOptionalString(record, 'return_date'));

  if (!fullName || fullName.length > 100) {
    throw new HttpError(400, 'Full name is required.');
  }
  if (!isValidNepalPhone(phone)) {
    throw new HttpError(400, NEPAL_PHONE_ERROR);
  }
  if (email && (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new HttpError(400, 'Please enter a valid email address.');
  }
  if (!pickupLocation || pickupLocation.length > 255) {
    throw new HttpError(400, 'Pickup location is required.');
  }
  if (!dropoffLocation || dropoffLocation.length > 255) {
    throw new HttpError(400, 'Dropoff location is required.');
  }
  if (!pickupDate) {
    throw new HttpError(400, 'Pickup date is required.');
  }

  const yesterdayUtc = startOfUtcDay(new Date()) - 24 * 60 * 60 * 1000;
  if (startOfUtcDay(pickupDate) < yesterdayUtc) {
    throw new HttpError(400, 'Pickup date must be today or a future date.');
  }

  const tripType = tripTypeRaw.toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const isRound = tripType === 'round trip' || tripType === 'roundtrip';
  const isOneWay = tripType === 'one way' || tripType === 'oneway';
  if (!isRound && !isOneWay) {
    throw new HttpError(400, 'Trip type must be One Way or Round Trip.');
  }
  if (isRound && !returnDate) {
    throw new HttpError(400, 'Return date is required for a round trip.');
  }
  if (returnDate && startOfUtcDay(returnDate) < startOfUtcDay(pickupDate)) {
    throw new HttpError(400, 'Return date must be on or after the pickup date.');
  }
  if (passengerCount < 1 || passengerCount > 50) {
    throw new HttpError(400, 'Passenger count must be between 1 and 50.');
  }
  if (!vehicleTypeId || vehicleTypeId < 1 || vehicleTypeId > 4) {
    throw new HttpError(400, 'Select a valid vehicle type.');
  }
  if (additionalDetails && additionalDetails.length > 2000) {
    throw new HttpError(400, 'Additional details are too long.');
  }

  return {
    full_name: fullName,
    phone_number: phone,
    email,
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,
    pickup_date: pickupDate,
    return_date: isRound ? returnDate : null,
    passenger_count: Math.round(passengerCount),
    trip_type: isRound ? 'Round Trip' : 'One Way',
    vehicle_type_id: Math.round(vehicleTypeId),
    additional_details: additionalDetails,
  };
}

export type ReviewInput = {
  customer_name: string;
  rating: number;
  comment: string;
  trip_title: string | null;
};

export function parseReview(body: unknown): ReviewInput {
  const record = asRecord(body);
  if (isHoneypotTriggered(record.website_hp)) {
    throw new HttpError(400, 'Invalid submission.');
  }

  const customerName = readString(record, 'customer_name');
  const comment = readString(record, 'comment');
  const tripTitle = readOptionalString(record, 'trip_title');
  const rating = readNumber(record, 'rating');

  if (!customerName || customerName.length > 100) {
    throw new HttpError(400, 'Your name is required.');
  }
  if (!comment || comment.length > 2000) {
    throw new HttpError(400, 'Review comment is required.');
  }
  if (tripTitle && tripTitle.length > 150) {
    throw new HttpError(400, 'Trip title is too long.');
  }
  if (!rating || rating < 1 || rating > 5) {
    throw new HttpError(400, 'Rating must be between 1 and 5.');
  }

  return {
    customer_name: customerName,
    rating: Math.round(rating),
    comment,
    trip_title: tripTitle,
  };
}
