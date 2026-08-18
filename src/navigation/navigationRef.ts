import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootTabParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootTabParamList>();

/**
 * Global navigation helper to redirect user directly to MyTrips screen
 * from notifications or external deep links.
 */
export function navigateToMyTrips(bookingId?: string | number) {
  if (navigationRef.isReady()) {
    // Navigate to Account tab -> MyTrips stack screen with optional booking ID
    navigationRef.navigate('Account', {
      screen: 'MyTrips',
      params: bookingId ? { bookingId } : undefined,
    });
  } else {
    // Retry once when container becomes ready
    const timer = setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('Account', {
          screen: 'MyTrips',
          params: bookingId ? { bookingId } : undefined,
        });
      }
      clearTimeout(timer);
    }, 500);
  }
}
