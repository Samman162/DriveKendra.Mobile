import React from 'react';
import renderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';

import { ThemeProvider } from '../src/theme/ThemeProvider';
import { AuthProvider } from '../src/context/AuthContext';
import { AdminAuthProvider } from '../src/context/AdminAuthContext';
import { AdminPinScreen } from '../src/screens/admin/AdminPinScreen';
import { AdminDashboardScreen } from '../src/screens/admin/AdminDashboardScreen';
import { AdminNavigator } from '../src/navigation/AdminNavigator';
import { AppNavigator } from '../src/navigation/AppNavigator';
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
    SafeAreaView: ({ children, style }: any) => React.createElement('View', { style }, children),
  };
});

// Mock admin API functions
jest.mock('../src/api/admin', () => ({
  setOnAdminSessionExpired: jest.fn(),
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
  getAdminDrivers: jest.fn().mockResolvedValue([
    {
      id: 1,
      ownerId: 1,
      fullName: 'Pasang Dorje Sherpa',
      phoneNumber: '+977 9851011223',
      whatsappNumber: '+977 9851011223',
      email: 'pasang.sherpa@drivekendra.com',
      citizenshipOrIdNo: '27-01-72-04512',
      status: 'active',
      citizenshipDocId: 'DOC-CTZ-0891',
      licenseDocId: 'LIC-EXP-9921',
      vehicle: {
        id: 1,
        vehicleId: 1,
        ownerId: 1,
        makeModel: 'Mahindra Scorpio S11 4x4',
        licensePlate: 'BA 2 PA 4521',
        category: 'SUV',
        seatingCapacity: 7,
      },
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    {
      id: 2,
      ownerId: 2,
      fullName: 'Birat Thapa',
      phoneNumber: '+977 9841334455',
      whatsappNumber: '+977 9841334455',
      email: 'birat.thapa@gmail.com',
      citizenshipOrIdNo: '12-02-68-11234',
      status: 'active',
      citizenshipDocId: 'DOC-CTZ-1022',
      licenseDocId: 'LIC-EXP-8843',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
  ]),
  createAdminDriver: jest.fn().mockResolvedValue({
    id: 3,
    ownerId: 3,
    fullName: 'Pemba Lama',
    phoneNumber: '+977 9811002233',
    status: 'active',
    licenseDocId: 'LIC-999',
    citizenshipOrIdNo: '99-00-11',
    createdAt: '2026-09-01T00:00:00.000Z',
  }),
  updateAdminDriver: jest.fn().mockResolvedValue({ success: true }),
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
    clearAuthCredentials: jest.fn().mockResolvedValue(undefined),
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

    it('does not render back button during PIN entry (integral part of auth)', () => {
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
      expect(root.findAllByProps({ accessibilityLabel: 'Back to Admin Login' })).toHaveLength(0);

      renderer.act(() => {
        tree?.unmount();
      });
    });

    it('locks out and triggers return to login after 3 failed PIN attempts', async () => {
      const { verifyAdminPin } = require('../src/api/admin');
      (verifyAdminPin as jest.Mock).mockRejectedValue(new Error('Incorrect security PIN. Access denied.'));

      const mockOnMaxAttemptsExceeded = jest.fn();
      let tree: any = null;

      await renderer.act(async () => {
        tree = renderer.create(
          <ThemeProvider>
            <AdminAuthProvider>
              <AdminPinScreen
                challengeToken="adm_chal_mock"
                onMaxAttemptsExceeded={mockOnMaxAttemptsExceeded}
              />
            </AdminAuthProvider>
          </ThemeProvider>,
        );
      });

      const root = tree.root;
      const digit1 = root.findByProps({ accessibilityLabel: 'Digit 1' });

      // Attempt 1: enter 1111
      for (let i = 0; i < 4; i++) {
        await renderer.act(async () => {
          digit1.props.onPress();
        });
      }
      expect(mockOnMaxAttemptsExceeded).not.toHaveBeenCalled();

      // Attempt 2: enter 1111
      for (let i = 0; i < 4; i++) {
        await renderer.act(async () => {
          digit1.props.onPress();
        });
      }
      expect(mockOnMaxAttemptsExceeded).not.toHaveBeenCalled();

      // Attempt 3: enter 1111 -> should trigger lockout and return to login screen
      for (let i = 0; i < 4; i++) {
        await renderer.act(async () => {
          digit1.props.onPress();
        });
      }
      expect(mockOnMaxAttemptsExceeded).toHaveBeenCalled();

      renderer.act(() => {
        tree?.unmount();
      });
    });
  });

  describe('3. AdminDashboardScreen (Operations Desk, Fleet, Users & Profile Tabs)', () => {
    it('renders overview metrics cards and 4 bottom navigation tabs', async () => {
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

      // Find bottom navigation tabs by finding Text components
      const textNodes = root.findAllByType('Text' as any);
      const textContents = textNodes.map((t: any) => t.props.children).flat().join(' ');
      expect(textContents).toContain('Dispatch Desk');
      expect(textContents).toContain('Drivers');
      expect(textContents).toContain('Users Directory');
      expect(textContents).toContain('Profile');
      // Himalayan Road Bulletins is removed as requested
      expect(textContents).not.toContain('Himalayan Road Bulletins');

      // Verify bottom tab accessibility labels
      expect(root.findByProps({ accessibilityLabel: 'Dispatch Desk', accessibilityRole: 'tab' })).toBeTruthy();
      expect(root.findByProps({ accessibilityLabel: 'Drivers Directory', accessibilityRole: 'tab' })).toBeTruthy();
      expect(root.findByProps({ accessibilityLabel: 'Users Directory', accessibilityRole: 'tab' })).toBeTruthy();
      expect(root.findByProps({ accessibilityLabel: 'Profile', accessibilityRole: 'tab' })).toBeTruthy();

      // Switch to Drivers tab
      const driversTab = root.findByProps({ accessibilityLabel: 'Drivers Directory', accessibilityRole: 'tab' });
      await renderer.act(async () => {
        driversTab.props.onPress();
      });

      const driversTextNodes = root.findAllByType('Text' as any);
      const driversTextContents = driversTextNodes.map((t: any) => t.props.children).flat().join(' ');
      expect(driversTextContents).toContain('Add Driver');

      // Switch to Profile tab
      const profileTab = root.findByProps({ accessibilityLabel: 'Profile', accessibilityRole: 'tab' });
      await renderer.act(async () => {
        profileTab.props.onPress();
      });

      const profileTextNodes = root.findAllByType('Text' as any);
      const profileTextContents = profileTextNodes.map((t: any) => t.props.children).flat().join(' ');
      expect(profileTextContents).toContain('SYSTEM ADMINISTRATOR');
      expect(profileTextContents).toContain('PostgreSQL Row Level Security (RLS)');
      expect(profileTextContents).toContain('Display Theme');

      renderer.act(() => {
        tree?.unmount();
      });
    });

    it('allows selecting driver only and shows their registered vehicle details during trip dispatch', async () => {
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
      // Inspect pending trip
      const inspectBtn = root.findByProps({ accessibilityLabel: 'Inspect and dispatch', accessibilityRole: 'button' });
      await renderer.act(async () => {
        inspectBtn.props.onPress();
      });

      // Find driver selector chip
      const driverChip = root.findByProps({ accessibilityLabel: 'Select driver Pasang Dorje Sherpa', accessibilityRole: 'button' });
      expect(driverChip).toBeTruthy();

      // Select driver
      await renderer.act(async () => {
        driverChip.props.onPress();
      });

      // Verify driver's vehicle details appear
      const textNodes = root.findAllByType('Text' as any);
      const textContents = textNodes.map((t: any) => t.props.children).flat().join(' ');
      expect(textContents).toContain('VEHICLE DETAILS');
      expect(textContents).toContain('Mahindra Scorpio S11 4x4');
      expect(textContents).toContain('BA 2 PA 4521');

      // Confirm dispatch
      const confirmDispatchBtn = root.findByProps({ accessibilityLabel: 'Confirm and dispatch to user', accessibilityRole: 'button' });
      await renderer.act(async () => {
        confirmDispatchBtn.props.onPress();
      });

      const { approveAdminTrip } = require('../src/api/admin');
      expect(approveAdminTrip).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          driverId: 1,
          driverName: 'Pasang Dorje Sherpa',
          vehicleId: 1,
        }),
      );

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

  describe('5. Admin Role Isolation & Screen Separation', () => {
    it('AppNavigator renders exclusively AdminNavigator and omits customer tabs for admin user', async () => {
      (secureStorage.getUserData as jest.Mock).mockResolvedValue({
        id: '2',
        name: 'Drive Kendra Admin',
        phone: '+977 9800000000',
        role: 'admin',
      });
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('admin_token_jwt');
      (secureStorage.getAdminAccessToken as jest.Mock).mockResolvedValue('admin_token_jwt');
      (secureStorage.getAdminUserData as jest.Mock).mockResolvedValue({
        id: '2',
        name: 'Drive Kendra Admin',
        phone: '+977 9800000000',
        role: 'admin',
      });

      let tree: any = null;
      await renderer.act(async () => {
        tree = renderer.create(
          <NavigationContainer>
            <ThemeProvider>
              <AuthProvider>
                <AdminAuthProvider>
                  <AppNavigator />
                </AdminAuthProvider>
              </AuthProvider>
            </ThemeProvider>
          </NavigationContainer>,
        );
      });

      const root = tree.root;
      // Admin dashboard metrics / elements must be present
      expect(root.findByProps({ accessibilityLabel: 'Sign out of Admin Portal' })).toBeTruthy();

      // Customer bottom tab elements must NOT exist
      const textNodes = root.findAllByType('Text' as any);
      const texts = textNodes.map((t: any) => t.props.children).flat().join(' ');
      expect(texts).toContain('Dispatch Desk');
      expect(texts).not.toContain('Book Ride');

      renderer.act(() => {
        tree?.unmount();
      });
    });

    it('AppNavigator renders customer screens when user is a customer', async () => {
      (secureStorage.getUserData as jest.Mock).mockResolvedValue({
        id: '1',
        name: 'Samman Chhetri',
        phone: '+977 9851363783',
        role: 'customer',
      });
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('cust_jwt_token');
      (secureStorage.getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (secureStorage.getAdminUserData as jest.Mock).mockResolvedValue(null);

      let tree: any = null;
      await renderer.act(async () => {
        tree = renderer.create(
          <NavigationContainer>
            <ThemeProvider>
              <AuthProvider>
                <AdminAuthProvider>
                  <AppNavigator />
                </AdminAuthProvider>
              </AuthProvider>
            </ThemeProvider>
          </NavigationContainer>,
        );
        await new Promise((r) => setTimeout(r, 100));
      });

      const root = tree.root;
      // Customer tabs should be present
      const textNodes = root.findAllByType('Text' as any);
      const texts = textNodes.map((t: any) => t.props.children).flat().join(' ');
      expect(texts).toContain('Home');
      expect(texts).toContain('Book Ride');
      expect(texts).toContain('My Trips');

      // Admin portal controls must NOT be present
      expect(texts).not.toContain('Dispatch Desk');
      expect(texts).not.toContain('Drivers');

      renderer.act(() => {
        tree?.unmount();
      });
    });

    it('AppNavigator renders AdminNavigator when user logged in with 9800000000 even if role was omitted in storage', async () => {
      (secureStorage.getUserData as jest.Mock).mockResolvedValue({
        id: '11',
        name: 'Admin User',
        phone: '9800000000',
      });
      (secureStorage.getAccessToken as jest.Mock).mockResolvedValue('jwt_token_123');
      (secureStorage.getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (secureStorage.getAdminUserData as jest.Mock).mockResolvedValue(null);

      let tree: any = null;
      await renderer.act(async () => {
        tree = renderer.create(
          <NavigationContainer>
            <ThemeProvider>
              <AuthProvider>
                <AdminAuthProvider>
                  <AppNavigator />
                </AdminAuthProvider>
              </AuthProvider>
            </ThemeProvider>
          </NavigationContainer>,
        );
        await new Promise((r) => setTimeout(r, 100));
      });

      const root = tree.root;
      // Must render AdminPinScreen (part of AdminNavigator) rather than MainTabs customer screens
      const textNodes = root.findAllByType('Text' as any);
      const texts = textNodes.map((t: any) => t.props.children).flat().join(' ');
      expect(texts).toContain('Security PIN');
      expect(texts).not.toContain('Book Ride');

      renderer.act(() => {
        tree?.unmount();
      });
    });

    it('AdminPinScreen renders Exit button and cancel link to safely return to login', async () => {
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
      const exitBtn = root.findByProps({ accessibilityLabel: 'Exit to Login' });
      const cancelLink = root.findByProps({ accessibilityLabel: 'Cancel & Return to Login' });
      expect(exitBtn).toBeTruthy();
      expect(cancelLink).toBeTruthy();

      await renderer.act(async () => {
        exitBtn.props.onPress();
      });
      expect(mockGoBack).toHaveBeenCalled();

      renderer.act(() => {
        tree?.unmount();
      });
    });

    it('AdminDashboardScreen sign out invokes logout and clears credentials', async () => {
      const { Alert } = require('react-native');
      const alertSpy = jest.spyOn(Alert, 'alert');

      let tree: any = null;
      await renderer.act(async () => {
        tree = renderer.create(
          <ThemeProvider>
            <AuthProvider>
              <AdminAuthProvider>
                <AdminDashboardScreen />
              </AdminAuthProvider>
            </AuthProvider>
          </ThemeProvider>,
        );
      });

      const root = tree.root;
      const logoutBtn = root.findByProps({ accessibilityLabel: 'Sign out of Admin Portal' });
      expect(logoutBtn).toBeTruthy();

      await renderer.act(async () => {
        logoutBtn.props.onPress();
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'Lock Admin Session',
        'Are you sure you want to sign out of the Admin Portal?',
        expect.any(Array),
      );

      const buttons = alertSpy.mock.calls[0][2] as any[];
      const confirmBtn = buttons.find((b: any) => b.text === 'Lock & Exit');
      expect(confirmBtn).toBeTruthy();

      await renderer.act(async () => {
        await confirmBtn.onPress();
      });

      expect(secureStorage.clearAdminCredentials).toHaveBeenCalled();

      alertSpy.mockRestore();
      renderer.act(() => {
        tree?.unmount();
      });
    });
  });
});
