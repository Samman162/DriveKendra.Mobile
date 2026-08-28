import { formatNpr, rateToVehicleType } from '../src/content/rates';
import { airportFare, AIRPORT_ROUTES } from '../src/content/airport';
import { weddingEstimate, WEDDING_TIERS, WEDDING_DURATIONS, DECOR_PACKAGES } from '../src/content/wedding';
import { generateIdempotencyKey } from '../src/api/bookings';
import { toLocalDateOnly } from '../src/utils/dates';
import { formatToOfflineVoucher } from '../src/utils/offlineVoucherStorage';

describe('Booking & Pricing Engine Calculations', () => {
  describe('Official Rate Calculation & Vehicle Mappings', () => {
    it('maps rate columns to accurate vehicle type IDs', () => {
      expect(rateToVehicleType('car')).toBe(1);
      expect(rateToVehicleType('hiaceJeep')).toBe(2);
      expect(rateToVehicleType('van')).toBe(3);
      expect(rateToVehicleType('bus')).toBe(4);
    });

    it('formats NPR currency amounts cleanly with comma separation', () => {
      expect(formatNpr(12000)).toBe('Rs. 12,000');
      expect(formatNpr(1500)).toBe('Rs. 1,500');
      expect(formatNpr('-')).toBe('-');
    });
  });

  describe('TIA Airport Transfer Pricing', () => {
    it('computes upfront airport transfer fare by vehicle and zone', () => {
      const thamelRoute = AIRPORT_ROUTES[0]; // Thamel / Durbar Marg
      expect(airportFare(thamelRoute, 'sedan')).toBe(1200);
      expect(airportFare(thamelRoute, 'suv')).toBe(1500);
      expect(airportFare(thamelRoute, 'hiace')).toBe(2000);
    });
  });

  describe('Wedding & VIP Luxury Fleet Calculator', () => {
    it('calculates total ceremonial wedding package price dynamically', () => {
      const goldTier = WEDDING_TIERS[2]; // Gold (Rs 10,000)
      const fullDay = 'full_day'; // 1.0x
      const roseDecor = DECOR_PACKAGES[2]; // +Rs 5,000

      const total = weddingEstimate(goldTier, fullDay, roseDecor);
      expect(total).toBe(15000);
      expect(typeof total).toBe('number');
    });
  });

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
