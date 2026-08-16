import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  LogLevel,
} from '@microsoft/signalr';
import * as Haptics from 'expo-haptics';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { getExtra } from '../api/config';
import {
  getRecentNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications';
import type { NotificationDto } from '../types/api';

type ConnectionState = 'disconnected' | 'connecting' | 'connected';

type NotificationContextValue = {
  connectionState: ConnectionState;
  notifications: NotificationDto[];
  unreadCount: number;
  loadHistory: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function mergeNotifications(
  incoming: NotificationDto[],
  existing: NotificationDto[],
): NotificationDto[] {
  const byId = new Map<number, NotificationDto>();
  for (const item of existing) {
    byId.set(item.notificationId, item);
  }
  for (const item of incoming) {
    const previous = byId.get(item.notificationId);
    byId.set(item.notificationId, previous ? { ...item, isRead: previous.isRead || item.isRead } : item);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function toConnectionState(state: HubConnectionState): ConnectionState {
  if (state === HubConnectionState.Connected) return 'connected';
  if (state === HubConnectionState.Connecting || state === HubConnectionState.Reconnecting) {
    return 'connecting';
  }
  return 'disconnected';
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const connectionRef = useRef<HubConnection | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const loadHistory = useCallback(async () => {
    try {
      const history = await getRecentNotifications(20);
      setNotifications((current) => mergeNotifications(history, current));
    } catch {
      // Historical feed requires X-Api-Key; live SignalR still works without it.
    }
  }, []);

  const markRead = useCallback(async (id: number) => {
    setNotifications((current) =>
      current.map((item) => (item.notificationId === id ? { ...item, isRead: true } : item)),
    );
    try {
      await markNotificationRead(id);
    } catch {
      // Local badge still updates even if the REST call is unauthorized.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      // Local-only fallback.
    }
  }, []);

  useEffect(() => {
    const { hubUrl } = getExtra();
    let disposed = false;

    const startConnection = async () => {
      // Browsers hit the production CORS allowlist; native Expo Go does not.
      if (Platform.OS === 'web') {
        setConnectionState('disconnected');
        return;
      }

      const build = (skipNegotiation: boolean) =>
        new HubConnectionBuilder()
          .withUrl(
            hubUrl,
            skipNegotiation
              ? { skipNegotiation: true, transport: HttpTransportType.WebSockets }
              : {},
          )
          .withAutomaticReconnect()
          .configureLogging(LogLevel.None)
          .build();

      let connection = build(false);
      connectionRef.current = connection;

      const handleNotification = (payload: NotificationDto) => {
        if (!payload || typeof payload.notificationId !== 'number') {
          return;
        }
        setNotifications((current) => mergeNotifications([payload], current));
        if (Platform.OS !== 'web') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
        }
      };

      const bind = (hub: HubConnection) => {
        hub.on('ReceiveNotification', handleNotification);
        hub.onreconnecting(() => setConnectionState('connecting'));
        hub.onreconnected(() => setConnectionState('connected'));
        hub.onclose(() => setConnectionState('disconnected'));
      };

      bind(connection);
      setConnectionState('connecting');

      try {
        await connection.start();
        if (!disposed) {
          setConnectionState(toConnectionState(connection.state));
        }
      } catch {
        try {
          await connection.stop();
        } catch {
          // Ignore stop errors from the first attempt.
        }
        if (disposed) {
          return;
        }
        connection = build(true);
        connectionRef.current = connection;
        bind(connection);
        try {
          await connection.start();
          if (!disposed) {
            setConnectionState(toConnectionState(connection.state));
          }
        } catch {
          if (!disposed) {
            setConnectionState('disconnected');
          }
        }
      }
    };

    void startConnection();
    void loadHistory();

    return () => {
      disposed = true;
      const connection = connectionRef.current;
      connectionRef.current = null;
      if (connection) {
        connection.off('ReceiveNotification');
        void connection.stop();
      }
    };
  }, [loadHistory]);

  const value = useMemo(
    () => ({
      connectionState,
      notifications,
      unreadCount,
      loadHistory,
      markRead,
      markAllRead,
    }),
    [connectionState, notifications, unreadCount, loadHistory, markRead, markAllRead],
  );

  return createElement(NotificationContext.Provider, { value }, children);
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export function useSignalR(): NotificationContextValue {
  return useNotifications();
}
