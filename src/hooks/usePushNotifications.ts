import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { registerPushToken } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { navigateToMyTrips } from '../navigation/navigationRef';

// Global notification presentation behavior when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  permissionStatus: Notifications.PermissionStatus | null;
  isRegistered: boolean;
  registerToken: () => Promise<string | null>;
}

/**
 * Custom hook to manage push notification permissions, token acquisition,
 * Android notification channels, backend registration, and navigation handling.
 */
export function usePushNotifications(): PushNotificationState {
  const { user, isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  /**
   * Configure Android Notification Channels for high importance and custom alerts
   */
  const setupAndroidChannels = useCallback(async () => {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Notifications',
      description: 'Standard notifications from Drive Kendra.',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D97706',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    await Notifications.setNotificationChannelAsync('trip_updates', {
      name: 'Trip Updates & Dispatch',
      description: 'Booking confirmations, driver assignments, and TIA flight delay alerts.',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#D97706',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }, []);

  /**
   * Request permissions and retrieve Expo Push Token
   */
  const registerForPushNotificationsAsync = useCallback(async (): Promise<string | null> => {
    try {
      await setupAndroidChannels();

      if (!Device.isDevice && Platform.OS !== 'web') {
        console.info('[PushNotifications] Running on simulator/emulator. Physical device required for remote notifications.');
      }

      // Check current permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);

      if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
        console.warn('[PushNotifications] Push notification permission was not granted.');
        return null;
      }

      // Get Expo Push Token
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        undefined;

      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );

      const token = tokenData.data;
      setExpoPushToken(token);
      return token;
    } catch (error) {
      console.warn('[PushNotifications] Error registering for push notifications:', error);
      return null;
    }
  }, [setupAndroidChannels]);

  /**
   * Register or update token on backend customer record
   */
  const syncTokenWithBackend = useCallback(
    async (token: string) => {
      try {
        const res = await registerPushToken({
          pushToken: token,
          phoneNumber: user?.phone,
          email: user?.email,
          devicePlatform: Platform.OS as 'ios' | 'android' | 'web',
          deviceName: Device.modelName ?? undefined,
        });

        if (res.success) {
          setIsRegistered(true);
        }
      } catch (err) {
        console.warn('[PushNotifications] Token synchronization failed:', err);
      }
    },
    [user?.phone, user?.email],
  );

  // Initial registration on mount
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        syncTokenWithBackend(token);
      }
    });
  }, [registerForPushNotificationsAsync, syncTokenWithBackend]);

  // Re-sync token whenever user logs in or user profile changes
  useEffect(() => {
    if (expoPushToken && isAuthenticated) {
      syncTokenWithBackend(expoPushToken);
    }
  }, [expoPushToken, isAuthenticated, syncTokenWithBackend]);

  // Setup Notification Listeners
  useEffect(() => {
    // 1. Foreground notification received listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (incoming: Notifications.Notification) => {
        setNotification(incoming);
      },
    );

    // 2. Notification response / tap interaction listener
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        const data = response.notification.request.content.data as {
          screen?: string;
          bookingId?: string | number;
          url?: string;
        } | undefined;

        const targetBookingId = data?.bookingId;
        // Navigate to MyTrips screen
        navigateToMyTrips(targetBookingId);
      },
    );

    // 3. Cold-start check (app opened directly by tapping a notification when closed)
    Notifications.getLastNotificationResponseAsync().then(
      (response: Notifications.NotificationResponse | null) => {
        if (response) {
          const data = response.notification.request.content.data as {
            screen?: string;
            bookingId?: string | number;
          } | undefined;
          navigateToMyTrips(data?.bookingId);
        }
      },
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    permissionStatus,
    isRegistered,
    registerToken: registerForPushNotificationsAsync,
  };
}
