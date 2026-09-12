import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getUserNotifications } from '../api/users';
import { getAdminNotifications } from '../api/admin';
import { initNotificationService, presentLocalTripNotification } from '../services/notificationService';
import { hapticFeedback } from '../utils/haptics';

export function useTripNotificationsWatcher() {
  const { user, isAuthenticated } = useAuth();
  const { isAdminAuthenticated } = useAdminAuth();

  const seenIdsRef = useRef<Set<number>>(new Set());
  const isFirstCheckRef = useRef<boolean>(true);

  const numericUserId = user?.id ? Number(user.id) : undefined;
  const userPhone = user?.phone;

  // Initialize notifications service & ask permissions on app startup or user login
  useEffect(() => {
    void initNotificationService(numericUserId);
  }, [numericUserId, isAuthenticated, isAdminAuthenticated]);

  // Trip Notification Poller & Local Alert Presenter
  useEffect(() => {
    let isCancelled = false;

    const checkNewNotifications = async () => {
      try {
        if (isAdminAuthenticated) {
          // Admin POV: Watch for new trip requests & trip updates
          const notifs = await getAdminNotifications();
          if (isCancelled) return;

          if (isFirstCheckRef.current) {
            notifs.forEach((n) => seenIdsRef.current.add(n.id));
            isFirstCheckRef.current = false;
            return;
          }

          for (const notif of notifs) {
            if (!seenIdsRef.current.has(notif.id)) {
              seenIdsRef.current.add(notif.id);
              // Only trigger for trip events
              if (
                notif.bookingId ||
                notif.type.startsWith('trip_') ||
                notif.type.startsWith('booking_') ||
                notif.type === 'driver_assigned'
              ) {
                hapticFeedback.medium();
                await presentLocalTripNotification({
                  title: notif.title,
                  body: notif.message,
                  data: {
                    bookingId: notif.bookingId,
                    type: notif.type,
                  },
                });
              }
            }
          }
        } else if (isAuthenticated && (numericUserId || userPhone)) {
          // Customer POV: Watch for trip request updates, driver assigned, trip completed
          const notifs = await getUserNotifications({
            userId: numericUserId,
            phoneNumber: userPhone,
          });
          if (isCancelled) return;

          if (isFirstCheckRef.current) {
            notifs.forEach((n) => seenIdsRef.current.add(n.id));
            isFirstCheckRef.current = false;
            return;
          }

          for (const notif of notifs) {
            if (!seenIdsRef.current.has(notif.id)) {
              seenIdsRef.current.add(notif.id);
              if (
                notif.bookingId ||
                notif.type.startsWith('trip_') ||
                notif.type.startsWith('booking_') ||
                notif.type === 'driver_assigned'
              ) {
                hapticFeedback.medium();
                await presentLocalTripNotification({
                  title: notif.title,
                  body: notif.message,
                  data: {
                    bookingId: notif.bookingId,
                    type: notif.type,
                  },
                });
              }
            }
          }
        }
      } catch (err) {
        // Silently catch to avoid interrupting user flows during network changes
      }
    };

    // Initial check
    void checkNewNotifications();

    // Poll every 10 seconds for real-time reactivity
    const interval = setInterval(() => {
      void checkNewNotifications();
    }, 10000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [isAdminAuthenticated, isAuthenticated, numericUserId, userPhone]);
}
