import { createHash } from 'node:crypto';
import { z } from 'zod';

export const NEPAL_PHONE_DIGITS = /^(?:977)?(9[78]\d{8}|0[1-9]\d{7})$/;
export const NEPAL_PHONE_ERROR = 'Enter a valid Nepal mobile (97/98) or landline number.';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function computeRequestHash(data: unknown): string {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data || {});
  return createHash('sha256').update(serialized).digest('hex');
}

export const idempotencyHeaderSchema = z
  .string()
  .trim()
  .min(8, 'Idempotency key must be at least 8 characters.')
  .max(128, 'Idempotency key max 128 characters.')
  .optional()
  .nullable();

export function normalizeNepalPhone(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function isValidNepalPhone(value: string): boolean {
  return NEPAL_PHONE_DIGITS.test(normalizeNepalPhone(value));
}

export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?)?/.exec(trimmed);
  if (!match) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  let hour = match[4] ? Number(match[4]) : 0;
  const minute = match[5] ? Number(match[5]) : 0;
  const second = match[6] ? Number(match[6]) : 0;
  const meridiem = match[7]?.toUpperCase();

  if (meridiem === 'PM' && hour < 12) {
    hour += 12;
  } else if (meridiem === 'AM' && hour === 12) {
    hour = 0;
  }

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * ZOD SCHEMAS FOR STRICT REQUEST VALIDATION
 */

// Honeypot validator: must be undefined or empty string
const honeypotValidator = z
  .string()
  .optional()
  .refine((val) => !val || val.trim().length === 0, {
    message: 'Invalid submission.',
  });

export function normalizePhone(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

export function isValidPhone(value: string): boolean {
  if (!value) return false;
  const normalized = normalizePhone(value);
  const rawDigits = normalized.replace(/\D/g, '');
  if (rawDigits.length < 7 || rawDigits.length > 15) {
    return false;
  }
  return /^\+?[1-9]\d{6,14}$/.test(normalized) || NEPAL_PHONE_DIGITS.test(rawDigits);
}

// International & Nepal Phone Number Zod Validator
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required.')
  .transform(normalizePhone)
  .refine(isValidPhone, {
    message: 'Please enter a valid phone number with country code (e.g. +977 9851363783 or +1 415 555 2671).',
  });

export const nepalPhoneSchema = phoneSchema;

// Trip Booking Zod Schema
export const bookingZodSchema = z
  .object({
    user_id: z
      .preprocess((val) => (typeof val === 'string' && isNaN(Number(val)) ? undefined : val), z.coerce.number().int().positive().optional().nullable()),
    full_name: z.string().trim().min(1, 'Full name is required.').max(100, 'Full name is too long.'),
    phone_number: nepalPhoneSchema,
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address.')
      .max(100, 'Email is too long.')
      .optional()
      .nullable()
      .or(z.literal('')),
    pickup_location: z.string().trim().min(1, 'Pickup location is required.').max(255),
    dropoff_location: z.string().trim().min(1, 'Dropoff location is required.').max(255),
    pickup_date: z.string().min(1, 'Pickup date is required.'),
    pickup_time: z.string().max(20, 'Pickup time too long.').optional().nullable().or(z.literal('')),
    return_date: z.string().optional().nullable().or(z.literal('')),
    passenger_count: z.coerce.number().int().min(1, 'Passenger count must be at least 1.').max(50, 'Passenger count max 50.'),
    trip_type: z.enum(['One Way', 'Return', 'Round Trip', 'return', 'one way', 'round trip', 'One-Way', 'Round-Trip']),
    vehicle_type_id: z.coerce.number().int().min(1, 'Select a valid vehicle type.').max(4, 'Select a valid vehicle type.'),
    estimated_fare: z.string().max(50, 'Estimated fare too long.').optional().nullable().or(z.literal('')),
    additional_details: z.string().max(2000, 'Additional details too long.').optional().nullable(),
    website_hp: honeypotValidator,
  })
  .superRefine((data, ctx) => {
    const pickup = parseDateOnly(data.pickup_date);
    if (!pickup) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pickup_date'],
        message: 'Invalid pickup date.',
      });
      return;
    }

    const yesterdayUtc = startOfUtcDay(new Date()) - 24 * 60 * 60 * 1000;
    if (startOfUtcDay(pickup) < yesterdayUtc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pickup_date'],
        message: 'Pickup date must be today or a future date.',
      });
    }

    const isRound = data.trip_type.toLowerCase().includes('round') || data.trip_type.toLowerCase().includes('return');
    if (isRound) {
      if (!data.return_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['return_date'],
          message: 'Return date is required for a return trip.',
        });
      } else {
        const ret = parseDateOnly(data.return_date);
        if (!ret || startOfUtcDay(ret) < startOfUtcDay(pickup)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['return_date'],
            message: 'Return date must be on or after the pickup date.',
          });
        }
      }
    }
  });

export type BookingInput = {
  user_id?: number | null;
  full_name: string;
  phone_number: string;
  email: string | null;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: Date;
  pickup_time?: string | null;
  return_date: Date | null;
  passenger_count: number;
  trip_type: 'One Way' | 'Round Trip';
  vehicle_type_id: number;
  estimated_fare?: string | null;
  additional_details: string | null;
};

export function parseBooking(body: unknown): BookingInput {
  const result = bookingZodSchema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new HttpError(400, firstIssue?.message || 'Invalid booking submission.');
  }

  const valid = result.data;
  const isRound = valid.trip_type.toLowerCase().includes('round') || valid.trip_type.toLowerCase().includes('return');
  const pickupDate = parseDateOnly(valid.pickup_date)!;
  const returnDate = isRound && valid.return_date ? parseDateOnly(valid.return_date) : null;

  return {
    user_id: valid.user_id,
    full_name: valid.full_name,
    phone_number: valid.phone_number,
    email: valid.email ? valid.email.trim() : null,
    pickup_location: valid.pickup_location,
    dropoff_location: valid.dropoff_location,
    pickup_date: pickupDate,
    pickup_time: valid.pickup_time?.trim() || null,
    return_date: returnDate,
    passenger_count: valid.passenger_count,
    trip_type: isRound ? 'Round Trip' : 'One Way',
    vehicle_type_id: valid.vehicle_type_id,
    estimated_fare: valid.estimated_fare?.trim() || null,
    additional_details: valid.additional_details?.trim() || null,
  };
}



// Auth Schemas
export const loginZodSchema = z.object({
  identifier: z.string().trim().min(1, 'Phone number is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const registerZodSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required.').max(100),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .toLowerCase()
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required.')
    .transform(normalizePhone)
    .refine(isValidPhone, {
      message: 'Please enter a valid phone number with country code (e.g. +977 9851363783 or +1 415 555 2671).',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const forgotPasswordZodSchema = z.object({
  identifier: z.string().trim().min(1, 'Phone number is required.'),
});

export const resetPasswordZodSchema = z.object({
  identifier: z.string().trim().min(1, 'Identifier is required.'),
  code: z.string().trim().min(4, 'Verification code is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
});
