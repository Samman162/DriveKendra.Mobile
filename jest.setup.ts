/* eslint-disable no-undef */
import '@testing-library/jest-native/extend-expect';
import { TurboModuleRegistry } from 'react-native';

// Ensure TurboModuleRegistry and globalThis.expo.modules exist in Jest test environment
if (typeof globalThis !== 'undefined') {
  (globalThis as any).expo = (globalThis as any).expo || {};
  (globalThis as any).expo.modules = (globalThis as any).expo.modules || {};
  (globalThis as any).expo.modules.ExpoModulesCoreJSLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  if (!(globalThis as any).dispatchEvent) {
    (globalThis as any).dispatchEvent = jest.fn();
  }
}

if (typeof window !== 'undefined' && !(window as any).dispatchEvent) {
  (window as any).dispatchEvent = jest.fn();
}

if (TurboModuleRegistry && typeof (TurboModuleRegistry as any).get !== 'function') {
  (TurboModuleRegistry as any).get = () => null;
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock Safe Area Context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, style }: any) => React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiUrl: 'http://localhost:8787/api',
    },
  },
}));

// Mock Expo Splash Screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

// Mock Navigation
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }: any) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn(() => true),
      reset: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: (cb: any) => cb(),
    DefaultTheme: { colors: {} },
    DarkTheme: { colors: {} },
  };
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const SvgElementMock = (props: any) => React.createElement(View, props);
  return {
    __esModule: true,
    default: SvgElementMock,
    Svg: SvgElementMock,
    Circle: SvgElementMock,
    Path: SvgElementMock,
    Rect: SvgElementMock,
    G: SvgElementMock,
    Defs: SvgElementMock,
    LinearGradient: SvgElementMock,
    Stop: SvgElementMock,
    Line: SvgElementMock,
    Text: SvgElementMock,
  };
});

// Mock Lucide icons
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const IconMock = (props: any) => React.createElement(View, props);
  return new Proxy(
    {},
    {
      get: () => IconMock,
    },
  );
});

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key: string) => Promise.resolve(store[key] || null)),
    deleteItemAsync: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  };
});

// Mock Expo LocalAuthentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

// Mock Expo Haptics
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock Expo Linking
jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  createURL: jest.fn((path: string) => `drivekendra://${path}`),
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock BottomSheet
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => React.createElement(View, null, children),
    BottomSheetModal: React.forwardRef(({ children }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        present: jest.fn(),
        dismiss: jest.fn(),
      }));
      return React.createElement(View, null, children);
    }),
    BottomSheetModalProvider: ({ children }: any) => React.createElement(View, { style: { flex: 1 } }, children),
    BottomSheetView: ({ children }: any) => React.createElement(View, null, children),
    BottomSheetBackdrop: () => null,
  };
});

// Mock FlashList
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { FlatList } = require('react-native');
  return {
    FlashList: React.forwardRef((props: any, ref: any) => React.createElement(FlatList, { ...props, ref })),
  };
});
