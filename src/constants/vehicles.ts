export const VEHICLE_TYPES = [
  { id: 1, name: 'Car / Sedan' },
  { id: 2, name: 'Scorpio / Jeep (4WD)' },
  { id: 3, name: 'Hiace (14-Seater)' },
  { id: 4, name: 'Coaster / Tourist Bus' },
] as const;

export type VehicleTypeId = (typeof VEHICLE_TYPES)[number]['id'];
