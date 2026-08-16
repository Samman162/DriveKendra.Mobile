export type AirportTransferType = 'pickup' | 'drop';
export type AirportVehicle = 'sedan' | 'suv' | 'hiace';

export interface AirportRoute {
  id: string;
  name: string;
  distance: string;
  duration: string;
  sedanRate: number;
  suvRate: number;
  hiaceRate: number;
}

export const AIRPORT_ROUTES: AirportRoute[] = [
  {
    id: 'thamel',
    name: 'Thamel / Durbar Marg',
    distance: '6 km',
    duration: '20-30 min',
    sedanRate: 1200,
    suvRate: 1500,
    hiaceRate: 2000,
  },
  {
    id: 'patan',
    name: 'Patan / Lalitpur City',
    distance: '7 km',
    duration: '25-35 min',
    sedanRate: 1400,
    suvRate: 1800,
    hiaceRate: 2300,
  },
  {
    id: 'bhaktapur',
    name: 'Bhaktapur Durbar Square',
    distance: '12 km',
    duration: '35-45 min',
    sedanRate: 1800,
    suvRate: 2300,
    hiaceRate: 3000,
  },
  {
    id: 'boudha',
    name: 'Boudhanath / Pashupatinath',
    distance: '4 km',
    duration: '15-20 min',
    sedanRate: 1200,
    suvRate: 1500,
    hiaceRate: 2000,
  },
  {
    id: 'nagarkot',
    name: 'Nagarkot Hill Station',
    distance: '28 km',
    duration: '1.5 hours',
    sedanRate: 3500,
    suvRate: 4500,
    hiaceRate: 5500,
  },
  {
    id: 'dhulikhel',
    name: 'Dhulikhel / Panauti',
    distance: '30 km',
    duration: '1.5 hours',
    sedanRate: 3500,
    suvRate: 4500,
    hiaceRate: 5500,
  },
  {
    id: 'pokhara',
    name: 'Pokhara City Direct',
    distance: '200 km',
    duration: '6-7 hours',
    sedanRate: 12000,
    suvRate: 15000,
    hiaceRate: 18000,
  },
];

export const AIRPORT_VEHICLES: { id: AirportVehicle; label: string; vehicleTypeId: 1 | 2 | 3 }[] = [
  { id: 'sedan', label: 'Sedan', vehicleTypeId: 1 },
  { id: 'suv', label: 'SUV / Scorpio', vehicleTypeId: 2 },
  { id: 'hiace', label: 'HiAce Van', vehicleTypeId: 3 },
];

export function airportFare(route: AirportRoute, vehicle: AirportVehicle): number {
  if (vehicle === 'suv') return route.suvRate;
  if (vehicle === 'hiace') return route.hiaceRate;
  return route.sedanRate;
}
