import { formatNpr, rateToVehicleType } from '../src/content/rates';
import { airportFare, AIRPORT_ROUTES } from '../src/content/airport';
import { weddingEstimate, WEDDING_TIERS, WEDDING_DURATIONS, DECOR_PACKAGES } from '../src/content/wedding';

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
});
