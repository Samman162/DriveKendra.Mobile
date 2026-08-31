import { generateIdempotencyKey } from '../src/api/bookings';
import { toLocalDateOnly } from '../src/utils/dates';
import { formatToOfflineVoucher } from '../src/utils/offlineVoucherStorage';

describe('Booking & Pricing Engine Calculations', () => {

  describe('Idempotency & Date Utilities', () => {
    it('generates standard RFC4122 v4 UUID format for idempotency', () => {
      const key = generateIdempotencyKey();
      expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('formats local date correctly (YYYY-MM-DD)', () => {
      const d = new Date(2026, 7, 27); // August 27, 2026
      expect(toLocalDateOnly(d)).toBe('2026-08-27');
    });

    it('formats trip into offline voucher structure', () => {
      const trip = {
        id: 'trip_1',
        bookingRef: 'DK-2026-8492',
        pickup: 'Kathmandu',
        dropoff: 'Muktinath',
        date: '2026-08-28',
        time: '07:00 AM',
        fare: 'NPR 12,000',
        status: 'confirmed',
      };
      const voucher = formatToOfflineVoucher(trip);
      expect(voucher.bookingRef).toBe('DK-2026-8492');
      expect(voucher.altitudeNote).toContain('High Altitude Zone');
      expect(voucher.emergencyHotline).toBe('+9779851363783');
    });
  });
});
