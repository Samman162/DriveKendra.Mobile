export type FleetCategory = 'all' | 'suv' | 'sedan' | 'van' | 'bus';

export interface FleetVehicle {
  id: number;
  name: string;
  category: Exclude<FleetCategory, 'all'>;
  tag: string;
  image: string;
  seats: number;
  luggage: number;
  fuel: string;
  transmission: string;
  pricePerDay: string;
  rating: number;
  features: string[];
  vehicleTypeId: 1 | 2 | 3 | 4;
}

export const FLEET_CATEGORIES: { label: string; value: FleetCategory }[] = [
  { label: 'All Fleet', value: 'all' },
  { label: 'SUVs & 4x4', value: 'suv' },
  { label: 'Sedans & Cars', value: 'sedan' },
  { label: 'Hiace & Vans', value: 'van' },
  { label: 'Buses', value: 'bus' },
];

export const FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: 1,
    name: 'Mahindra Scorpio 4x4',
    category: 'suv',
    tag: 'Best for Offroad & Hills',
    image:
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80',
    seats: 7,
    luggage: 4,
    fuel: 'Diesel',
    transmission: 'Manual',
    pricePerDay: 'NPR 8,500',
    rating: 4.9,
    features: ['4WD Terrain', 'Dual AC', 'Bluetooth', 'Roof Rack'],
    vehicleTypeId: 2,
  },
  {
    id: 2,
    name: 'Toyota Hiace (Super GL)',
    category: 'van',
    tag: 'Popular Group Choice',
    image:
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=80',
    seats: 14,
    luggage: 8,
    fuel: 'Diesel',
    transmission: 'Manual',
    pricePerDay: 'NPR 11,000',
    rating: 4.8,
    features: ['Reclining Seats', 'High Roof AC', 'USB Chargers', 'Luggage Carrier'],
    vehicleTypeId: 3,
  },
  {
    id: 3,
    name: 'Hyundai Creta / Suzuki Brezza',
    category: 'sedan',
    tag: 'Comfort Sedan / Compact SUV',
    image:
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80',
    seats: 5,
    luggage: 3,
    fuel: 'Petrol / Hybrid',
    transmission: 'Automatic / Manual',
    pricePerDay: 'NPR 6,000',
    rating: 4.9,
    features: ['Climate Control', 'Infotainment Touchscreen', 'Leather Seats', 'Rear Camera'],
    vehicleTypeId: 1,
  },
  {
    id: 4,
    name: 'Toyota Prado / Fortuner Luxury',
    category: 'suv',
    tag: 'VIP & Executive Travel',
    image:
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80',
    seats: 7,
    luggage: 5,
    fuel: 'Diesel',
    transmission: 'Automatic 4x4',
    pricePerDay: 'NPR 18,000',
    rating: 5.0,
    features: ['VIP Comfort Seats', 'Sunroof', 'Premium Audio', 'Driver Included'],
    vehicleTypeId: 2,
  },
  {
    id: 5,
    name: 'Toyota Coaster Tourist Bus',
    category: 'bus',
    tag: 'Large Group / Tour Package',
    image:
      'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=900&q=80',
    seats: 25,
    luggage: 15,
    fuel: 'Diesel',
    transmission: 'Manual',
    pricePerDay: 'NPR 18,500',
    rating: 4.8,
    features: ['Air Suspension', 'PA Sound System', 'Spacious Legroom', 'Panoramic Windows'],
    vehicleTypeId: 4,
  },
  {
    id: 6,
    name: 'BYD Atto 3 (Electric SUV)',
    category: 'sedan',
    tag: '100% Eco-Friendly EV',
    image:
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=900&q=80',
    seats: 5,
    luggage: 3,
    fuel: 'Electric (EV)',
    transmission: 'Automatic',
    pricePerDay: 'NPR 7,500',
    rating: 4.9,
    features: ['Zero Emission', '420km Range', 'Silent Cabin', 'Fast Charging'],
    vehicleTypeId: 1,
  },
];

export function vehiclesByCategory(category: FleetCategory): FleetVehicle[] {
  if (category === 'all') {
    return FLEET_VEHICLES;
  }
  return FLEET_VEHICLES.filter((vehicle) => vehicle.category === category);
}
