export type WeddingDuration = 'half_day' | 'full_day' | 'multi_day';

export interface WeddingTier {
  id: string;
  name: string;
  badge: string;
  basePrice: number;
  priceLabel: string;
  cars: string[];
  highlight: string;
  isPopular?: boolean;
  vehicleTypeId: 1 | 2;
}

export interface DecorPackage {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  badge?: string;
}

export const WEDDING_TIERS: WeddingTier[] = [
  {
    id: 'bronze',
    name: 'Economy Tier',
    badge: 'Budget Friendly',
    basePrice: 7000,
    priceLabel: 'Rs 7,000',
    cars: [
      'BYD Dolphin',
      'Hyundai i10',
      'Ford Figo',
      'Tata Tiago',
      'Renault Kwid',
      'Maruti Swift',
      'Celerio',
      'VW Polo',
    ],
    highlight: 'Compact & elegant rides for bridal entourage, relatives & local transfers.',
    vehicleTypeId: 1,
  },
  {
    id: 'silver',
    name: 'Standard Sedan',
    badge: 'Classic Comfort',
    basePrice: 8000,
    priceLabel: 'Rs 8,000',
    cars: ['Hyundai Xcent', 'Honda City', 'Nissan Sunny', 'Maruti Dzire', 'Skoda Superb', 'Toyota Etios'],
    highlight: 'Spacious sedans offering timeless elegance and smooth city cruising.',
    vehicleTypeId: 1,
  },
  {
    id: 'gold',
    name: 'Premium SUV',
    badge: 'Most Popular',
    basePrice: 10000,
    priceLabel: 'Rs 10,000',
    cars: [
      'Hyundai Creta',
      'Maruti Brezza',
      'Tata Nexon',
      'BYD Atto-3',
      'Hyundai Venue',
      'Suzuki Vitara',
      'VW Tiguan',
    ],
    highlight: 'Commanding SUVs perfect for grand arrivals and mountainous procession routes.',
    isPopular: true,
    vehicleTypeId: 2,
  },
  {
    id: 'platinum',
    name: 'Royal Luxury',
    badge: 'VIP Executive',
    basePrice: 12000,
    priceLabel: 'Rs 12,000',
    cars: ['Mahindra Scorpio', 'Toyota Hilux', 'Mitsubishi Pajero', 'Toyota Fortuner', 'Vintage Classic Cars'],
    highlight: 'Ultimate luxury and rugged prestige for unforgettable bride & groom escort.',
    vehicleTypeId: 2,
  },
];

export const DECOR_PACKAGES: DecorPackage[] = [
  {
    id: 'none',
    name: 'Vehicle Only (No Decor)',
    price: 0,
    priceLabel: 'Included Free',
    description: 'Clean, sanitized vehicle with professional chauffeur. You can arrange your own decorator.',
    features: ['Spotless Interior & Exterior', 'Uniformed Chauffeur', 'Red Carpet Ready', 'Self Decor Allowed'],
  },
  {
    id: 'classic_ribbon',
    name: 'Classic Ribbon & Bouquet',
    price: 3000,
    priceLabel: '+Rs 3,000',
    description: 'Elegant satin ribbons across hood with front bonnet bouquet and side door handle bows.',
    features: ['Satin Ribbon V-Shape', 'Front Bonnet Flower Cluster', 'Door Handle Ribbons', 'Color Matched Theme'],
  },
  {
    id: 'rose_wrap',
    name: 'Royal Fresh Rose Wrap',
    price: 5000,
    priceLabel: '+Rs 5,000',
    description: 'Premium fresh red/pink roses and carnation arrangement with lush floral garland borders.',
    features: ['100% Fresh Roses & Carnations', 'Full Hood & Trunk Garland', 'Rear Window Floral Arc', 'Custom Color Matching'],
    badge: 'Best Value',
  },
  {
    id: 'nepali_marigold',
    name: 'Traditional Nepalese Royal Theme',
    price: 8000,
    priceLabel: '+Rs 8,000',
    description: 'Traditional Nepalese Sayapatri (Marigold) and Orchid arrangement with red silk drapery.',
    features: ['Sayapatri & Godawari Flowers', 'Red Silk Fabrics & Tassels', 'Bride & Groom Initials Monogram', 'Vip Groom Convoy Styling'],
  },
];

export const WEDDING_DURATIONS: { id: WeddingDuration; label: string; multiplier: number }[] = [
  { id: 'half_day', label: 'Half day', multiplier: 0.75 },
  { id: 'full_day', label: 'Full day', multiplier: 1 },
  { id: 'multi_day', label: 'Multi day', multiplier: 1.8 },
];

export function weddingEstimate(tier: WeddingTier, duration: WeddingDuration, decor: DecorPackage): number {
  const multiplier = WEDDING_DURATIONS.find((item) => item.id === duration)?.multiplier ?? 1;
  return Math.round(tier.basePrice * multiplier) + decor.price;
}
