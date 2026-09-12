import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { registerPushToken } from '../api/users';

// Configure foreground notification presentation handler for real-time mobile banner & sound
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

let isInitialized = false;

/**
 * Configure high-priority Android notification channel for Trip Updates & Dispatch
 */
export async function configureNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('trip_updates', {
        name: 'Trip Updates & Dispatch',
        description: 'Real-time notifications for vehicle dispatch, driver assignments, and trip status updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E65100',
        sound: 'default',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });
    } catch (err) {
      console.warn('[Notifications] Failed to configure Android channel:', err);
    }
  }
}

/**
 * Request notification permissions from the user.
 * Prompts user on newly installed app / first launch.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          return true;
        }
        if (Notification.permission !== 'denied') {
          const res = await Notification.requestPermission();
          return res === 'granted';
        }
      }
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[Notifications] Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Initialize notification service:
 * 1. Sets up Android channel
 * 2. Prompts user for notification permission if not yet granted
 * 3. Registers Expo push token with backend if granted
 */
export async function initNotificationService(userId?: number): Promise<string | null> {
  if (isInitialized && !userId) {
    return null;
  }
  isInitialized = true;

  try {
    await configureNotificationChannels();
    const granted = await requestNotificationPermissions();

    if (!granted) {
      console.info('[Notifications] Notification permissions not granted by user.');
      return null;
    }

    // On native mobile devices, retrieve Expo push token
    if (Platform.OS !== 'web') {
      try {
        const pushTokenData = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID || undefined,
        });

        const token = pushTokenData.data;
        if (token) {
          await registerPushToken({
            userId,
            pushToken: token,
            deviceType: Platform.OS,
          });
          return token;
        }
      } catch (tokenErr) {
        // Can happen in simulator / non-Expo Go standalone without EAS project ID
        console.info('[Notifications] Remote push token unavailable in this environment, local notifications active:', tokenErr);
      }
    } else {
      // Web registration with dummy/web indicator
      if (userId) {
        await registerPushToken({
          userId,
          pushToken: `web_token_${userId}_${Date.now()}`,
          deviceType: 'web',
        });
      }
    }
  } catch (err) {
    console.warn('[Notifications] Initialization error:', err);
  }

  return null;
}

/**
 * Triggers an immediate local mobile notification that appears
 * as a normal system tray notification banner with sound and vibration.
 */
export async function presentLocalTripNotification(params: {
  title: string;
  body: string;
  data?: Record<string, any>;
}): Promise<void> {
  const { title, body, data } = params;

  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
        return;
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: data || {},
      },
      trigger: Platform.OS === 'android' ? ({ channelId: 'trip_updates' } as any) : null,
    });
  } catch (err) {
    console.warn('[Notifications] Failed to present local notification:', err);
  }
}
