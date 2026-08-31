export type TripType = 'One Way' | 'Return' | 'Round Trip';

export interface BookingEntryDto {
  user_id?: number | string | null;
  full_name: string;
  phone_number: string;
  email?: string | null;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  pickup_time?: string | null;
  return_date?: string | null;
  passenger_count: number;
  trip_type: TripType;
  vehicle_type_id: number;
  estimated_fare?: string | null;
  additional_details?: string | null;
  website_hp?: string;
}

export interface BookingRecordDto {
  bookingId: number;
  bookingRef: string;
  userId: number;
  vehicleTypeId: number | null;
  vehicleTypeName: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime?: string | null;
  returnDate: string | null;
  passengerCount: number;
  tripType: 'One Way' | 'Return' | 'Round Trip';
  estimatedFare?: string | null;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  assignedDriverName: string | null;
  assignedDriverPhone: string | null;
  assignedDriverRating?: number | null;
  assignedVehiclePlate: string | null;
  assignedVehicleModel?: string | null;
  createdAt: string;
}

export interface ApiMessageResponse {
  message: string;
}
