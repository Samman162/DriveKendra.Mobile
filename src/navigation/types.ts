import type { NavigatorScreenParams } from '@react-navigation/native';
import type { TripType } from '../types/api';

export type BookParams = {
  intentId?: number;
  vehicleTypeId?: number;
  pickupLocation?: string;
  dropoffLocation?: string;
  tripType?: TripType;
  additionalDetails?: string;
  passengerCount?: number;
};

export type AuthParams = {
  initialMode?: 'signin' | 'signup' | 'forgot';
  redirectTo?: string;
};

/**
 * Primary 3-Tab Bottom Navigation: Home, My Bookings, Profile
 */
export type RootTabParamList = {
  Home: undefined;
  MyBookings: { bookingId?: string | number; openBookingModal?: boolean; initialParams?: BookParams } | undefined;
  Profile: undefined;
};

/**
 * Root Stack Navigation: Encapsulates MainTabs and all full-screen & modal routes
 */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<RootTabParamList> | undefined;
  BookingModal: BookParams | undefined;
  Fleet: undefined;
  Rates: undefined;
  Airport: undefined;
  Wedding: undefined;
  Tours: undefined;
  TourDetail: { tourId: 'manakamana' | 'muktinath' | 'kalinchowk' };
  Contact: undefined;
  Onboarding: undefined;
  Auth: AuthParams | undefined;
  MyTrips: { bookingId?: string | number } | undefined;
  Profile: undefined;
};
