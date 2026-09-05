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
  rejectionReason: string | null;
  createdAt: string;
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
