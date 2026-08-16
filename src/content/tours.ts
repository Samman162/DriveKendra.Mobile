export type TourId = 'pokhara' | 'manakamana' | 'muktinath' | 'kalinchowk' | 'heritage' | 'airport';

export interface TourPackage {
  id: TourId;
  title: string;
  subtitle: string;
  route: string;
  duration: string;
  price: string;
  image: string;
  badge: string;
  detailId?: 'manakamana' | 'muktinath' | 'kalinchowk';
  exploreTarget?: 'rates' | 'airport';
  vehicleTypeId: 1 | 2 | 3 | 4;
  pickupLocation: string;
  dropoffLocation: string;
}

export const TOUR_PACKAGES: TourPackage[] = [
  {
    id: 'pokhara',
    title: 'Pokhara Scenic Valley Tour',
    subtitle: 'Phewa Lake, Sarangkot Sunrise, World Peace Pagoda & Caves.',
    route: 'Kathmandu ⇄ Pokhara',
    duration: '2 Days / 1 Night',
    price: 'NPR 14,999',
    badge: 'Most Popular',
    image:
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80',
    exploreTarget: 'rates',
    vehicleTypeId: 2,
    pickupLocation: 'Kathmandu',
    dropoffLocation: 'Pokhara',
  },
  {
    id: 'manakamana',
    title: 'Manakamana Cable Car Pilgrimage',
    subtitle: 'Comfortable day trip with direct cable car station pickup & drop.',
    route: 'Kathmandu ⇄ Kurintar',
    duration: 'Same Day Trip',
    price: 'NPR 7,999',
    badge: 'Pilgrimage Special',
    image:
      'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=900&q=80',
    detailId: 'manakamana',
    vehicleTypeId: 2,
    pickupLocation: 'Kathmandu',
    dropoffLocation: 'Kurintar / Manakamana',
  },
  {
    id: 'muktinath',
    title: 'Muktinath Sacred Yatra',
    subtitle: 'Adventure SUV tour through Mustang valleys to Muktinath Dham.',
    route: 'Pokhara ⇄ Jomsom ⇄ Muktinath',
    duration: '3 Days / 2 Nights',
    price: 'NPR 32,500',
    badge: 'Adventure 4x4',
    image:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
    detailId: 'muktinath',
    vehicleTypeId: 2,
    pickupLocation: 'Pokhara',
    dropoffLocation: 'Muktinath',
  },
  {
    id: 'kalinchowk',
    title: 'Kalinchowk Snow Trip',
    subtitle: 'Scenic winter snow adventure, Kuri village & Bhagwati Temple.',
    route: 'Kathmandu ⇄ Kuri ⇄ Kalinchowk',
    duration: '2 Days / 1 Night',
    price: 'NPR 16,500',
    badge: 'Winter Special',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
    detailId: 'kalinchowk',
    vehicleTypeId: 2,
    pickupLocation: 'Kathmandu',
    dropoffLocation: 'Kalinchowk / Kuri Village',
  },
  {
    id: 'heritage',
    title: 'Kathmandu Heritage & Sightseeing',
    subtitle: 'Full day city tour covering Pashupatinath, Boudha, Swayambhu & Patan.',
    route: 'Kathmandu Valley Full Day',
    duration: '8 Hours City Tour',
    price: 'NPR 4,500',
    badge: 'City Tour',
    image:
      'https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?auto=format&fit=crop&w=900&q=80',
    exploreTarget: 'rates',
    vehicleTypeId: 1,
    pickupLocation: 'Kathmandu',
    dropoffLocation: 'Kathmandu Valley sightseeing',
  },
  {
    id: 'airport',
    title: 'TIA Airport Pick & Drop',
    subtitle: '24/7 punctual Tribhuvan International Airport transfer services.',
    route: 'Airport ⇄ City Anywhere',
    duration: 'Instant Pick & Drop',
    price: 'NPR 1,500',
    badge: '24/7 Available',
    image:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80',
    exploreTarget: 'airport',
    vehicleTypeId: 1,
    pickupLocation: 'Tribhuvan International Airport (TIA)',
    dropoffLocation: 'Kathmandu city',
  },
];
