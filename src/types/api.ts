export type TripType = 'One Way' | 'Round Trip';

export interface BookingEntryDto {
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

export interface PublicStatsDto {
  fleet_count: number;
  completed_trips: number;
  cities_covered: number;
  review_count: number;
  average_rating: number;
}

export interface PublicReviewDto {
  customer_name: string;
  rating: number;
  comment: string;
  trip_title?: string | null;
  created_at?: string;
}

export interface CreateReviewDto {
  customer_name: string;
  rating: number;
  comment: string;
  trip_title?: string | null;
  website_hp?: string;
}

export interface ApiMessageResponse {
  message: string;
}
