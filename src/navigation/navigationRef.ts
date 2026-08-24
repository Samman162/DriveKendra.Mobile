import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Global navigation helper to redirect user directly to MyBookings tab
 * from notifications, quick actions, or external deep links.
 */
export function navigateToMyTrips(bookingId?: string | number) {
  if (navigationRef.isReady()) {
    // Navigate to MainTabs -> MyBookings tab with optional booking ID
    navigationRef.navigate('MainTabs', {
      screen: 'MyBookings',
      params: bookingId ? { bookingId } : undefined,
    });
  } else {
    // Retry once when container becomes ready
    const timer = setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('MainTabs', {
          screen: 'MyBookings',
          params: bookingId ? { bookingId } : undefined,
        });
      }
      clearTimeout(timer);
    }, 500);
  }
}
