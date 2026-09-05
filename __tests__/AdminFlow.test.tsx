import React from 'react';
import renderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';

import { ThemeProvider } from '../src/theme/ThemeProvider';
import { AdminAuthProvider } from '../src/context/AdminAuthContext';
import { AdminPinScreen } from '../src/screens/admin/AdminPinScreen';
import { AdminDashboardScreen } from '../src/screens/admin/AdminDashboardScreen';
import { AdminNavigator } from '../src/navigation/AdminNavigator';
import { secureStorage } from '../src/utils/secureStorage';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      replace: mockReplace,
      canGoBack: () => true,
    }),
  };
});

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaConsumer: ({ children }: any) => children({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaInsetsContext: {
      Consumer: ({ children }: any) => children({ top: 0, bottom: 0, left: 0, right: 0 }),
      Provider: ({ children }: any) => children,
    },
  };
});

// Mock admin API functions
jest.mock('../src/api/admin', () => ({
  loginAdmin: jest.fn().mockResolvedValue({
    success: true,
    pinRequired: true,
    challengeToken: 'adm_chal_mock',
    message: 'Primary credentials verified. Please enter 4-digit PIN.',
  }),
  verifyAdminPin: jest.fn().mockResolvedValue({
    success: true,
    token: 'admin_jwt_mock_token_12345',
    admin: {
      id: '1',
      name: 'Drive Kendra Admin',
      phone: '+977 9800000000',
      role: 'admin',
    },
    message: 'PIN verified successfully.',
  }),
  getAdminStats: jest.fn().mockResolvedValue({
    pendingRequests: 2,
    activeFleet: 4,
    totalUsers: 4,
    totalTrips: 3,
    totalRevenue: 'NPR 148,500',
  }),
  getAdminTrips: jest.fn().mockResolvedValue([
    {
      id: 101,
      bookingRef: 'DK-2026-0101',
      userId: 1,
      customerName: 'Samman Chhetri',
      customerPhone: '+977 9851363783',
      customerEmail: 'samman@drivekendra.com',
      pickupLocation: 'Kathmandu Airport',
      dropoffLocation: 'Lakeside, Pokhara',
      pickupDate: '2026-09-06T08:00:00.000Z',
      pickupTime: '08:00 AM',
      returnDate: null,
      passengerCount: 4,
      tripType: 'One Way',
      vehicleCategory: 'SUV / Scorpio 4x4',
      estimatedFare: 'NPR 34,500',
      status: 'Pending',
      assignedVehicleId: null,
      assignedVehiclePlate: null,
      assignedVehicleModel: null,
      rejectionReason: null,
      createdAt: '2026-09-05T12:00:00.000Z',
    },
  ]),
  getAdminVehicles: jest.fn().mockResolvedValue([
    {
      id: 1,
      vehicleTypeId: 2,
      model: 'Mahindra Scorpio S11 4x4',
      registrationPlate: 'BA 2 PA 4521',
      category: 'SUV',
      seats: 7,
      fuelType: 'Diesel',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf',
      status: 'available',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
  ]),
  getAdminUsers: jest.fn().mockResolvedValue([
    {
      id: 1,
      fullName: 'Samman Chhetri',
      phone: '+977 9851363783',
      email: 'samman@drivekendra.com',
      role: 'customer',
      createdAt: '2026-07-01T00:00:00.000Z',
      totalBookings: 3,
      lifetimeSpend: 'NPR 82,500',
    },
  ]),
  getCustomerTrips: jest.fn().mockResolvedValue([]),
  approveAdminTrip: jest.fn().mockResolvedValue({ success: true }),
  rejectAdminTrip: jest.fn().mockResolvedValue({ success: true }),
  completeAdminTrip: jest.fn().mockResolvedValue({ success: true, message: 'Trip marked as completed.' }),
  getAdminRoadAdvisories: jest.fn().mockResolvedValue([
    {
      id: 1,
      routeName: 'BP Highway (Sindhuli Corridor)',
      status: 'caution',
      conditionSummary: 'Single lane near Golanjor',
      severity: 'moderate',
      createdAt: '2026-09-05T00:00:00.000Z',
    },
  ]),
  createAdminRoadAdvisory: jest.fn().mockResolvedValue({
    id: 2,
    routeName: 'Prithvi Highway',
    status: 'open',
    conditionSummary: 'All clear',
    severity: 'info',
    createdAt: '2026-09-05T00:00:00.000Z',
  }),
  deleteAdminRoadAdvisory: jest.fn().mockResolvedValue({ success: true }),
  createAdminVehicle: jest.fn().mockResolvedValue({
    id: 10,
    model: 'Toyota Land Cruiser',
    registrationPlate: 'BA 5 PA 1234',
    category: 'SUV',
    seats: 7,
    fuelType: 'Diesel',
    status: 'available',
  }),
  updateAdminVehicle: jest.fn().mockResolvedValue({
    id: 1,
    status: 'maintenance',
  }),
}));

// Mock secure storage
jest.mock('../src/utils/secureStorage', () => ({
  secureStorage: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
    getAdminAccessToken: jest.fn().mockResolvedValue(null),
    setAdminAccessToken: jest.fn().mockResolvedValue(undefined),
    getAdminUserData: jest.fn().mockResolvedValue(null),
    setAdminUserData: jest.fn().mockResolvedValue(undefined),
    clearAdminCredentials: jest.fn().mockResolvedValue(undefined),
    getUserData: jest.fn().mockResolvedValue(null),
    getAccessToken: jest.fn().mockResolvedValue(null),
    getRefreshToken: jest.fn().mockResolvedValue(null),
    getBiometricEnabled: jest.fn().mockResolvedValue(false),
  },
  SECURE_STORAGE_KEYS: {
    ACCESS_TOKEN: 'drivekendra_jwt_access_token',
    REFRESH_TOKEN: 'drivekendra_jwt_refresh_token',
    USER_META: 'drivekendra_user_meta',
    BIOMETRIC_ENABLED: 'drivekendra_biometric_enabled',
    ADMIN_ACCESS_TOKEN: 'drivekendra_admin_jwt_access_token',
    ADMIN_SESSION_META: 'drivekendra_admin_session_meta',
  },
}));

// Mock haptics
jest.mock('../src/utils/haptics', () => ({
  hapticFeedback: {
    light: jest.fn(),
    medium: jest.fn(),
    heavy: jest.fn(),
    selection: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Admin Portal Subsystem Flow & Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. AdminPinScreen (4-Digit PIN Gate)', () => {
    it('renders 4 indicator circles and numeric keypad buttons', () => {
      let tree: any = null;
      renderer.act(() => {
        tree = renderer.create(
          <ThemeProvider>
            <AdminAuthProvider>
              <AdminPinScreen challengeToken="adm_chal_mock" />
            </AdminAuthProvider>
          </ThemeProvider>,
        );
      });

      const root = tree.root;
      // Numeric keys 1-9, 0, clear, delete
      expect(root.findByProps({ accessibilityLabel: 'Digit 1' })).toBeTruthy();
      expect(root.findByProps({ accessibilityLabel: 'Digit 6' })).toBeTruthy();
      expect(root.findByProps({ accessibilityLabel: 'Digit 7' })).toBeTruthy();
      expect(root.findByProps({ accessibilityLabel: 'Digit 0' })).toBeTruthy();
      expect(root.findByProps({ accessibilityLabel: 'Clear PIN input' })).toBeTruthy();
      expect(root.findByProps({ accessibilityLabel: 'Delete last digit' })).toBeTruthy();

      renderer.act(() => {
        tree?.unmount();
      });
    });

    it('registers digit taps and triggers haptic selection', async () => {
      const { hapticFeedback } = require('../src/utils/haptics');
      let tree: any = null;

      await renderer.act(async () => {
        tree = renderer.create(
          <ThemeProvider>
            <AdminAuthProvider>
              <AdminPinScreen challengeToken="adm_chal_mock" />
            </AdminAuthProvider>
          </ThemeProvider>,
        );
      });

      const root = tree.root;
      const digit6 = root.findByProps({ accessibilityLabel: 'Digit 6' });
      const digit7 = root.findByProps({ accessibilityLabel: 'Digit 7' });

      await renderer.act(async () => {
        digit6.props.onPress();
      });
      expect(hapticFeedback.selection).toHaveBeenCalled();

      await renderer.act(async () => {
        digit7.props.onPress();
      });
      expect(hapticFeedback.selection).toHaveBeenCalledTimes(2);

      renderer.act(() => {
        tree?.unmount();
      });
    });
  });

  describe('3. AdminDashboardScreen (Operations Desk, Fleet & Users)', () => {
    it('renders overview metrics cards and 3-way segment navigation tabs', async () => {
      let tree: any = null;
      await renderer.act(async () => {
        tree = renderer.create(
          <ThemeProvider>
            <AdminAuthProvider>
              <AdminDashboardScreen />
            </AdminAuthProvider>
          </ThemeProvider>,
        );
      });

      const root = tree.root;
      // Check RLS badge and logout button
      expect(root.findByProps({ accessibilityLabel: 'Sign out of Admin Portal' })).toBeTruthy();

      // Find segment tabs by finding Text components
      const textNodes = root.findAllByType('Text' as any);
      const textContents = textNodes.map((t: any) => t.props.children).flat().join(' ');
      expect(textContents).toContain('Dispatch Desk');
      expect(textContents).toContain('Fleet Manager');
      expect(textContents).toContain('Users Directory');
      expect(textContents).toContain('Himalayan Road Bulletins');
      expect(textContents).toContain('BP Highway (Sindhuli Corridor)');
      expect(root.findByProps({ accessibilityLabel: 'Post Himalayan Road Advisory' })).toBeTruthy();

      renderer.act(() => {
        tree?.unmount();
      });
    });
  });

  describe('4. AdminNavigator Route Guarding', () => {
    it('renders PIN screen when unauthenticated admin', async () => {
      (secureStorage.getAdminAccessToken as jest.Mock).mockResolvedValueOnce(null);

      let tree: any = null;
      await renderer.act(async () => {
        tree = renderer.create(
          <NavigationContainer>
            <ThemeProvider>
              <AdminNavigator />
            </ThemeProvider>
          </NavigationContainer>,
        );
      });

      const root = tree.root;
      expect(root.findByProps({ accessibilityLabel: 'Digit 6' })).toBeTruthy();
      expect(root.findByProps({ accessibilityLabel: 'Digit 7' })).toBeTruthy();

      renderer.act(() => {
        tree?.unmount();
      });
    });
  });
});
