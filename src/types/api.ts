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

export interface CreateOwnerRequestDto {
  full_name: string;
  phone_number: string;
  whatsapp_number: string;
  email?: string | null;
  citizenship_or_id_no: string;
  vehicle_type_id: number;
  make_model: string;
  license_plate: string;
  seating_capacity: number;
  manufacture_year?: number | null;
  color?: string | null;
  citizenship_doc_id?: string | null;
  bluebook_doc_id?: string | null;
  license_doc_id?: string | null;
  website_hp?: string;
}

export interface PublicStatsDto {
  fleet_count: number;
  completed_trips: number;
  cities_covered: number;
  review_count: number;
  average_rating: number;
}

export interface NotificationDto {
  notificationId: number;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: number | null;
  notificationType?: string | null;
  createdAt: string;
}

export interface ApiMessageResponse {
  message: string;
}
