export type TripType = 'One Way' | 'Return' | 'Round Trip';

export interface BookingEntryDto {
  user_id?: number | string | null;
  full_name: string;
  phone_number: string;
  email?: string | null;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  return_date?: string | null;
  passenger_count: number;
  trip_type: TripType;
  vehicle_type_id: number;
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
  returnDate: string | null;
  passengerCount: number;
  tripType: 'One Way' | 'Return' | 'Round Trip';
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  assignedDriverName: string | null;
  assignedDriverPhone: string | null;
  assignedVehiclePlate: string | null;
  flightNumber: string | null;
  flightDelayMinutes: number;
  createdAt: string;
}

export interface PublicStatsDto {
  fleet_count: number;
  completed_trips: number;
  cities_covered: number;
  review_count: number;
  average_rating: number;
}

export interface PublicReviewDto {
  id?: number | string;
  user_id?: number | string | null;
  customer_name: string;
  rating: number;
  comment: string;
  trip_title?: string | null;
  created_at?: string;
}

export interface CreateReviewDto {
  user_id?: number | string | null;
  customer_name: string;
  rating: number;
  comment: string;
  trip_title?: string | null;
  website_hp?: string;
}

export interface InAppNotificationDto {
  id: number;
  userId: number;
  title: string;
  message: string;
  relatedEntityId: number | null;
  type: string;
  pushStatus: string;
  payload?: any;
  isRead: boolean;
  createdAt: string;
}

export interface ApiMessageResponse {
  message: string;
}
