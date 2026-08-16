export const NEPAL_PHONE_ERROR =
  'Enter a valid Nepal mobile (97/98) or landline number.';

export const NEPAL_PHONE_DIGITS = /^(?:977)?(9[78]\d{8}|0[1-9]\d{7})$/;

export const ALLOWED_DOC_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;
export const ALLOWED_DOC_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const LIMITS = {
  bookingName: 100,
  ownerName: 150,
  phone: 20,
  bookingEmail: 100,
  ownerEmail: 150,
  location: 255,
  additionalDetails: 2000,
  citizenshipId: 50,
  passengersMin: 1,
  passengersMax: 50,
  seatingMin: 1,
} as const;
