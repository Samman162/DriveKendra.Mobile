import { describe, expect, it } from '@jest/globals';
import {
  bookingZodSchema,
  isValidNepalPhone,
  normalizeNepalPhone,
  parseBooking,
  parseReview,
  reviewZodSchema,
} from '../src/validation.js';

describe('Nepal Phone Validation', () => {
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

describe('Booking Zod Validation & Honeypot', () => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);

  it('successfully parses valid one-way booking', () => {
    const raw = {
      full_name: 'Aarav Sharma',
      phone_number: '9851363783',
      email: 'aarav@drivekendra.com',
      pickup_location: 'Kathmandu',
      dropoff_location: 'Pokhara',
      pickup_date: tomorrow,
      passenger_count: 3,
      trip_type: 'One Way',
      vehicle_type_id: 2,
      additional_details: 'Need infant seat',
    };

    const parsed = parseBooking(raw);
    expect(parsed.full_name).toBe('Aarav Sharma');
    expect(parsed.trip_type).toBe('One Way');
    expect(parsed.vehicle_type_id).toBe(2);
    expect(parsed.return_date).toBeNull();
  });

  it('successfully parses pickup date containing departure time (e.g. 07:00 AM)', () => {
    const raw = {
      full_name: 'Aarav Sharma',
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
      full_name: 'Suman Shrestha',
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
      full_name: 'Aarav',
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

describe('Review Zod Validation', () => {
  it('parses valid 5-star customer review', () => {
    const review = {
      customer_name: 'Pooja Thapa',
      rating: 5,
      comment: 'Excellent Scorpio 4x4 ride to Muktinath. Highly recommended driver!',
      trip_title: 'Muktinath Expedition',
    };

    const parsed = parseReview(review);
    expect(parsed.customer_name).toBe('Pooja Thapa');
    expect(parsed.rating).toBe(5);
  });

  it('rejects invalid star ratings', () => {
    const invalid = {
      customer_name: 'Traveler',
      rating: 6,
      comment: 'Nice',
    };

    expect(() => parseReview(invalid)).toThrow('Rating must be between 1 and 5');
  });
});
