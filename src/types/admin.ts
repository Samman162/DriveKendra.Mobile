export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  role: 'admin';
}

export interface AdminLoginResponse {
  success: boolean;
  pinRequired: boolean;
  challengeToken: string;
  message: string;
}

export interface AdminVerifyPinResponse {
  success: boolean;
  token: string;
  admin: AdminUser;
  message: string;
}

export interface AdminStats {
  pendingRequests: number;
  activeFleet: number;
  totalUsers: number;
  totalTrips: number;
  totalDrivers?: number;
  totalRevenue: string;
}

export interface AdminCustomer {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  role: string;
  createdAt: string;
  totalBookings: number;
  lifetimeSpend: string;
}

export interface CustomerTripHistory {
  bookingId: number;
  bookingRef: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string | null;
  passengerCount: number;
  tripType: string;
  estimatedFare: string;
  status: string;
  assignedVehiclePlate: string | null;
  assignedVehicleModel: string | null;
  createdAt: string;
}

export interface AdminTrip {
  id: number;
  bookingRef: string;
  userId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string | null;
  passengerCount: number;
  tripType: string;
  vehicleCategory: string;
  estimatedFare: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  assignedVehicleId: number | null;
  assignedVehiclePlate: string | null;
  assignedVehicleModel: string | null;
  assignedDriverId?: number | null;
  assignedDriverName?: string | null;
  assignedDriverPhone?: string | null;
  finalFare?: string | null;
  additionalDetails?: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface ApproveTripPayload {
  vehicleId?: number;
  driverId?: number | null;
  driverName?: string | null;
  driverPhone?: string | null;
  finalPrice?: string | null;
}

export interface AdminVehicle {
  id: number;
  vehicleTypeId: number;
  model: string;
  registrationPlate: string;
  category: 'SUV' | 'Sedan' | 'HiAce' | 'Bus';
  seats: number;
  fuelType: string;
  imageUrl: string;
  status: 'available' | 'assigned' | 'in_transit' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleDto {
  model: string;
  registrationPlate: string;
  category: 'SUV' | 'Sedan' | 'HiAce' | 'Bus';
  seats: number;
  fuelType: string;
  imageUrl?: string;
  status?: 'available' | 'assigned' | 'in_transit' | 'maintenance';
}

export interface UpdateVehicleDto {
  model?: string;
  registrationPlate?: string;
  category?: 'SUV' | 'Sedan' | 'HiAce' | 'Bus';
  seats?: number;
  fuelType?: string;
  imageUrl?: string;
  status?: 'available' | 'assigned' | 'in_transit' | 'maintenance';
}

export interface RoadAdvisory {
  id: number;
  routeName: string;
  status: 'open' | 'caution' | 'closed';
  conditionSummary: string;
  severity: 'info' | 'moderate' | 'severe';
  createdAt: string;
}

export interface CreateRoadAdvisoryDto {
  routeName: string;
  status: 'open' | 'caution' | 'closed';
  conditionSummary: string;
  severity: 'info' | 'moderate' | 'severe';
}

export interface AdminDriverVehicle {
  id: number;
  vehicleId: number;
  ownerId?: number;
  makeModel: string;
  licensePlate: string;
  vehicleTypeId?: number;
  category?: 'SUV' | 'Sedan' | 'HiAce' | 'Bus';
  seatingCapacity: number;
  manufactureYear?: number;
  color?: string;
  isActive?: boolean;
  bluebookDocId?: string;
}

export interface AdminDriver {
  id: number;
  ownerId: number;
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string | null;
  email?: string | null;
  citizenshipOrIdNo: string;
  status: 'active' | 'inactive' | 'pending';
  citizenshipDocId?: string | null;
  licenseDocId: string;
  vehicle?: AdminDriverVehicle | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDriverDto {
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email?: string;
  citizenshipOrIdNo: string;
  status?: 'active' | 'inactive' | 'pending';
  citizenshipDocId?: string;
  licenseDocId: string;
  // Vehicle Details (dka_vehicles / cr_vehicles)
  makeModel?: string;
  licensePlate?: string;
  vehicleTypeId?: number;
  category?: 'SUV' | 'Sedan' | 'HiAce' | 'Bus';
  seatingCapacity?: number;
  manufactureYear?: number;
  color?: string;
  bluebookDocId?: string;
  vehicle?: Partial<AdminDriverVehicle>;
}

export interface UpdateDriverDto {
  fullName?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  email?: string;
  citizenshipOrIdNo?: string;
  status?: 'active' | 'inactive' | 'pending';
  citizenshipDocId?: string;
  licenseDocId?: string;
}

export interface AdminNotification {
  id: number;
  userId?: number | null;
  bookingId?: number | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  userName?: string | null;
  userPhone?: string | null;
}

export interface BroadcastNotificationDto {
  userId?: number | null;
  bookingId?: number | null;
  title: string;
  message: string;
  type?: string;
}


