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

export type HomeStackParamList = {
  HomeMain: undefined;
};

export type ExploreStackParamList = {
  ExploreHome: undefined;
  Fleet: undefined;
  Rates: undefined;
  Airport: undefined;
  Wedding: undefined;
};

export type ToursStackParamList = {
  ToursHome: undefined;
  TourDetail: { tourId: 'manakamana' | 'muktinath' | 'kalinchowk' };
};

export type RootTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Explore: NavigatorScreenParams<ExploreStackParamList> | undefined;
  Book: BookParams | undefined;
  Tours: NavigatorScreenParams<ToursStackParamList> | undefined;
  Contact: undefined;
};
