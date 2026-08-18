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

export type HomeStackParamList = {
  HomeMain: undefined;
  Auth: AuthParams | undefined;
  Profile: undefined;
  MyTrips: { bookingId?: string | number } | undefined;
};

export type ExploreStackParamList = {
  ExploreHome: undefined;
  Fleet: undefined;
  Rates: undefined;
  Airport: undefined;
  Wedding: undefined;
  Auth: AuthParams | undefined;
};

export type ToursStackParamList = {
  ToursHome: undefined;
  TourDetail: { tourId: 'manakamana' | 'muktinath' | 'kalinchowk' };
  Auth: AuthParams | undefined;
};

export type AccountStackParamList = {
  AccountHome: undefined;
  Auth: AuthParams | undefined;
  MyTrips: { bookingId?: string | number } | undefined;
};

export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Explore: NavigatorScreenParams<ExploreStackParamList> | undefined;
  Book: BookParams | undefined;
  Tours: NavigatorScreenParams<ToursStackParamList> | undefined;
  Account: NavigatorScreenParams<AccountStackParamList> | undefined;
  Contact: undefined;
};

