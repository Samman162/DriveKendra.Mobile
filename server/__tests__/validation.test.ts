import { describe, expect, it } from '@jest/globals';
import {
  bookingZodSchema,
  isValidNepalPhone,
  isValidPhone,
  loginZodSchema,
  normalizeNepalPhone,
  normalizePhone,
  parseBooking,
  registerZodSchema,
} from '../src/validation.js';

describe('Phone Validation & Normalization', () => {
  describe('Nepal Phone Specifics', () => {
    it('validates mobile numbers (98XXXXXXXX and 97XXXXXXXX)', () => {
      expect(isValidNepalPhone('9851363783')).toBe(true);
      expect(isValidNepalPhone('9779851363783')).toBe(true);
      expect(isValidNepalPhone('+977 985-1363783')).toBe(true);
      expect(isValidNepalPhone('9741234567')).toBe(true);
    });

    it('validates Kathmandu landline numbers (01XXXXXXX)', () => {
      expect(isValidNepalPhone('014412345')).toBe(true);
      expect(isValidNepalPhone('977014412345')).toBe(true);
    });

    it('rejects invalid or too-short phone numbers', () => {
      expect(isValidNepalPhone('12345')).toBe(false);
      expect(isValidNepalPhone('8881234567')).toBe(false);
      expect(isValidNepalPhone('985136378')).toBe(false); // only 9 digits
    });

    it('normalizes formatting characters', () => {
      expect(normalizeNepalPhone('+977 (985) 136-3783')).toBe('9779851363783');
    });
  });

  describe('International Phone Validation', () => {
    it('validates international phone numbers from different countries', () => {
      expect(isValidPhone('+1 415 555 2671')).toBe(true); // USA
      expect(isValidPhone('+91 9876543210')).toBe(true); // India
      expect(isValidPhone('+44 7911 123456')).toBe(true); // UK
      expect(isValidPhone('+61 412 345 678')).toBe(true); // Australia
      expect(isValidPhone('+81 90 1234 5678')).toBe(true); // Japan
      expect(isValidPhone('+977 9851363783')).toBe(true); // Nepal
      expect(isValidPhone('9851363783')).toBe(true); // Local Nepal
      expect(isValidPhone('014412345')).toBe(true); // Nepal landline
    });

    it('rejects numbers that are too short or invalid', () => {
      expect(isValidPhone('12345')).toBe(false);
      expect(isValidPhone('+1')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });

    it('normalizes international numbers preserving leading plus', () => {
      expect(normalizePhone('+1 (415) 555-2671')).toBe('+14155552671');
      expect(normalizePhone('+977 985-1363783')).toBe('+9779851363783');
      expect(normalizePhone('9851363783')).toBe('9851363783');
    });
  });
});

describe('Booking Zod Validation & Honeypot', () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);

  it('successfully parses valid one-way booking', () => {
    const raw = {
      full_name: 'Samman Chhetri',
      phone_number: '9851363783',
      email: 'samman@drivekendra.com',
      pickup_location: 'Kathmandu',
      dropoff_location: 'Pokhara',
      pickup_date: tomorrow,
      passenger_count: 3,
      trip_type: 'One Way',
      vehicle_type_id: 2,
      additional_details: 'Need infant seat',
    };

    const parsed = parseBooking(raw);
    expect(parsed.full_name).toBe('Samman Chhetri');
    expect(parsed.trip_type).toBe('One Way');
    expect(parsed.vehicle_type_id).toBe(2);
    expect(parsed.return_date).toBeNull();
  });

  it('successfully parses pickup date containing departure time (e.g. 07:00 AM)', () => {
    const raw = {
      full_name: 'Samman Chhetri',
      phone_number: '9851363783',
      pickup_location: 'Kathmandu',
      dropoff_location: 'Pokhara',
      pickup_date: `${tomorrow} 07:30 AM`,
      passenger_count: 2,
      trip_type: 'One Way',
      vehicle_type_id: 2,
    };

    const parsed = parseBooking(raw);
    expect(parsed.pickup_date.getUTCHours()).toBe(7);
    expect(parsed.pickup_date.getUTCMinutes()).toBe(30);
  });

  it('successfully parses valid round-trip booking', () => {
    const raw = {
      full_name: 'Rajesh KC',
      phone_number: '9841234567',
      pickup_location: 'Kathmandu',
      dropoff_location: 'Chitwan',
      pickup_date: tomorrow,
      return_date: dayAfter,
      passenger_count: 5,
      trip_type: 'Round Trip',
      vehicle_type_id: 3,
    };

    const parsed = parseBooking(raw);
    expect(parsed.trip_type).toBe('Round Trip');
    expect(parsed.return_date).not.toBeNull();
  });

  it('successfully parses booking with international phone number', () => {
    const raw = {
      full_name: 'John Doe',
      phone_number: '+1 (415) 555-2671',
      pickup_location: 'Tribhuvan International Airport',
      dropoff_location: 'Thamel, Kathmandu',
      pickup_date: tomorrow,
      passenger_count: 2,
      trip_type: 'One Way',
      vehicle_type_id: 1,
    };

    const parsed = parseBooking(raw);
    expect(parsed.phone_number).toBe('+14155552671');
    expect(parsed.full_name).toBe('John Doe');
  });

  it('rejects submissions with filled honeypot', () => {
    const spam = {
      full_name: 'Bot Spammer',
      phone_number: '9851363783',
      pickup_location: 'Kathmandu',
      dropoff_location: 'Pokhara',
      pickup_date: tomorrow,
      passenger_count: 1,
      trip_type: 'One Way',
      vehicle_type_id: 1,
      website_hp: 'http://spam-link.ru',
    };

    expect(() => parseBooking(spam)).toThrow('Invalid');
  });

  it('rejects round trip missing return date', () => {
    const invalidRound = {
      full_name: 'Samman',
      phone_number: '9851363783',
      pickup_location: 'Kathmandu',
      dropoff_location: 'Pokhara',
      pickup_date: tomorrow,
      return_date: '',
      passenger_count: 1,
      trip_type: 'Round Trip',
      vehicle_type_id: 1,
    };

    expect(() => parseBooking(invalidRound)).toThrow('Return date is required');
  });
});



describe('User Schema Validation in Booking', () => {
  it('safely parses booking with non-numeric demo user ID', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const booking = {
      user_id: 'usr_demo_test',
      full_name: 'Demo Traveler',
      phone_number: '9851363783',
      pickup_location: 'Kathmandu',
      dropoff_location: 'Pokhara',
      pickup_date: tomorrow,
      passenger_count: 2,
      trip_type: 'One Way',
      vehicle_type_id: 1,
    };

    const parsed = parseBooking(booking);
    expect(parsed.user_id).toBeUndefined();
    expect(parsed.full_name).toBe('Demo Traveler');
  });

  it('safely parses booking with numeric user ID', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const booking = {
      user_id: 42,
      full_name: 'Demo Traveler',
      phone_number: '9851363783',
      pickup_location: 'Kathmandu',
      dropoff_location: 'Pokhara',
      pickup_date: tomorrow,
      passenger_count: 2,
      trip_type: 'One Way',
      vehicle_type_id: 1,
    };

    const parsed = parseBooking(booking);
    expect(parsed.user_id).toBe(42);
  });

  describe('User Registration & Login Validation', () => {
    it('accepts valid registration with email', () => {
      const result = registerZodSchema.safeParse({
        name: 'Samman Chhetri',
        email: 'samman@example.com',
        phone: '+977 9851363783',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid registration with empty string email', () => {
      const result = registerZodSchema.safeParse({
        name: 'Samman Chhetri',
        email: '',
        phone: '+977 9851363783',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects registration with invalid email format', () => {
      const result = registerZodSchema.safeParse({
        name: 'Samman Chhetri',
        email: 'not-an-email',
        phone: '+977 9851363783',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects registration with short password', () => {
      const result = registerZodSchema.safeParse({
        name: 'Samman Chhetri',
        phone: '+977 9851363783',
        password: '123',
      });
      expect(result.success).toBe(false);
    });

    it('validates login schema credentials', () => {
      const valid = loginZodSchema.safeParse({
        identifier: '+977 9851363783',
        password: 'password123',
      });
      expect(valid.success).toBe(true);

      const invalid = loginZodSchema.safeParse({
        identifier: '',
        password: '123',
      });
      expect(invalid.success).toBe(false);
    });
  });
});
