export interface RateItem {
  trip: string;
  km?: string | number;
  car: string | number;
  van: string | number;
  hiaceJeep: string | number;
  coaster: string | number;
  bus: string | number;
}

export interface RateCategory {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  items: RateItem[];
}

export const VEHICLE_CAPACITIES = [
  { type: 'Car (Sedan/Hatchback)', capacity: '1 – 3 Pax', basis: '1.0x Base Rate' },
  { type: 'Tourist Van', capacity: '4 – 6 Pax', basis: '1.5x Base Rate' },
  { type: '4WD Scorpio / Jeep', capacity: '4 – 6 Pax', basis: '1.75x Base Rate' },
  { type: 'Toyota HiAce Van', capacity: '7 – 14 Pax', basis: '1.75x Base Rate' },
  { type: 'Mini Coaster', capacity: '15 – 20 Pax', basis: '2.25x Base Rate' },
  { type: 'Large Tourist Bus', capacity: '25 – 35 Pax', basis: '2.75x Base Rate' },
];

export const RENTAL_POLICIES = [
  { title: 'Disposal Minimum', desc: 'Disposal time minimum half day charge (4 Hours).' },
  { title: 'Night Charges', desc: 'After 8 PM: 1.5x rate multiplier. After 12 AM Midnight: 2x rate multiplier.' },
  { title: 'Amenities Included', desc: 'All rates include Air Conditioning (A/C) and available onboard facilities.' },
  { title: 'VAT Terms', desc: '13% Government Value Added Tax (VAT) will be added to total bill.' },
  { title: 'Certified Drivers', desc: 'Includes professional, hill-experienced certified driver and full vehicle insurance.' },
];

import { RATE_CATEGORIES as RAW_RATE_CATEGORIES } from './rateCategories.generated';

export const RATE_CATEGORIES: RateCategory[] = RAW_RATE_CATEGORIES;

export function formatNpr(val: string | number): string {
  if (typeof val === 'number') {
    return `Rs. ${val.toLocaleString('en-IN')}`;
  }
  return String(val);
}

export function filterRateCategories(
  categories: RateCategory[],
  query: string,
  categoryId: string,
): RateCategory[] {
  let result = categories;
  if (categoryId !== 'all') {
    result = result.filter((cat) => cat.id === categoryId);
  }
  const q = query.toLowerCase().trim();
  if (!q) {
    return result;
  }
  return result
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) => item.trip.toLowerCase().includes(q) || cat.title.toLowerCase().includes(q),
      ),
    }))
    .filter((cat) => cat.items.length > 0);
}

export function tripPackageLink(
  tripName: string,
): { target: 'manakamana' | 'muktinath' | 'kalinchowk' | 'airport'; label: string } | null {
  const t = tripName.toLowerCase();
  if (t.includes('manakamana')) {
    return { target: 'manakamana', label: 'View Manakamana Package' };
  }
  if (t.includes('muktinath') || t.includes('jomsom')) {
    return { target: 'muktinath', label: 'View Muktinath Package' };
  }
  if (t.includes('kalinchowk') || t.includes('charikot') || t.includes('jiri')) {
    return { target: 'kalinchowk', label: 'View Kalinchowk Package' };
  }
  if (t.includes('airport') || t.includes('arrival/departure')) {
    return { target: 'airport', label: 'Airport Taxi Estimator' };
  }
  return null;
}

export function rateToVehicleType(column: 'car' | 'van' | 'hiaceJeep' | 'coaster' | 'bus'): 1 | 2 | 3 | 4 {
  if (column === 'car') return 1;
  if (column === 'hiaceJeep') return 2;
  if (column === 'van' || column === 'coaster') return 3;
  return 4;
}
