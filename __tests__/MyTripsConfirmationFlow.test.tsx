import React from 'react';
import renderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';

import { ThemeProvider } from '../src/theme/ThemeProvider';
import { MyTripsScreen } from '../src/screens/MyTripsScreen';
import * as bookingsApi from '../src/api/bookings';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
      canGoBack: () => true,
    }),
    useFocusEffect: (cb: any) => {
      const ReactLib = require('react');
      ReactLib.useEffect(() => {
        cb();
      }, []);
    },
  };
});

// Mock AuthContext to return active logged-in user without hardware biometric calls
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Samman Chhetri',
      phone: '+977 9851363783',
      email: 'samman@drivekendra.com',
      role: 'customer',
    },
    token: 'mock_token_123',
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaConsumer: ({ children }: any) => children({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children, style }: any) => React.createElement('View', { style }, children),
  };
});

// Mock offline vouchers
jest.mock('../src/utils/offlineVoucherStorage', () => ({
  getOfflineVouchers: jest.fn().mockResolvedValue([]),
  saveOfflineVouchers: jest.fn().mockResolvedValue(undefined),
  getActiveOfflineVoucher: jest.fn().mockResolvedValue(null),
  clearOfflineVouchers: jest.fn().mockResolvedValue(undefined),
  formatToOfflineVoucher: jest.fn().mockReturnValue({}),
}));

// Mock PDF generator
jest.mock('../src/utils/pdfGenerator', () => ({
  generateAndShareVoucher: jest.fn().mockResolvedValue(undefined),
}));

describe('MyTrips Confirmation Flow & Driver/Fare Visibility', () => {
  jest.setTimeout(20000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Pending ride request: hides driver & vehicle details, shows dispatch review banner', async () => {
    // Return pending booking without driver or vehicle
    jest.spyOn(bookingsApi, 'getUserBookings').mockResolvedValue([
      {
        bookingId: 201,
        bookingRef: 'DK-2026-0201',
        userId: 1,
        vehicleTypeId: 2,
        vehicleTypeName: 'SUV / Scorpio 4x4',
        pickupLocation: 'Thamel, Kathmandu',
        dropoffLocation: 'Pokhara Lakeside',
        pickupDate: '2026-09-15T08:00:00.000Z',
        pickupTime: '08:00 AM',
        returnDate: null,
        passengerCount: 3,
        tripType: 'One Way',
        estimatedFare: 'NPR 14,000',
        finalFare: null,
        status: 'Pending',
        assignedVehiclePlate: null,
        assignedVehicleModel: null,
        assignedDriverName: null,
        assignedDriverPhone: null,
        additionalDetails: 'Need roof rack for luggage',
        createdAt: '2026-09-09T10:00:00.000Z',
      },
    ]);

    let tree: any;
    await renderer.act(async () => {
      tree = renderer.create(
        <NavigationContainer>
          <ThemeProvider>
            <MyTripsScreen />
          </ThemeProvider>
        </NavigationContainer>,
      );
    });

    const allText = tree.root
      .findAllByType('Text' as any)
      .map((t: any) => {
        const getChildren = (c: any): string => {
          if (!c) return '';
          if (typeof c === 'string') return c;
          if (typeof c === 'number') return String(c);
          if (Array.isArray(c)) return c.map(getChildren).join(' ');
          if (c.props?.children) return getChildren(c.props.children);
          return '';
        };
        return getChildren(t.props.children);
      })
      .join(' ');

    // Verify Pending Status & Dispatch Desk Banner are present
    expect(allText).toContain('Awaiting Dispatch');
    expect(allText).toContain('Driver & Vehicle: Pending Assignment');
    expect(allText).toContain('Est. Budget');
    expect(allText).toContain('14,000');

    // Verify that assigned driver & vehicle cards are NOT rendered
    expect(allText).not.toContain('ASSIGNED DRIVER');
    expect(allText).not.toContain('Assigned & Inspected Fleet');

    renderer.act(() => {
      tree?.unmount();
    });
  });

  it('Confirmed ride request: reveals assigned driver, vehicle plate/model, and agreed final fare', async () => {
    // Return confirmed booking with driver, vehicle, and final fare
    jest.spyOn(bookingsApi, 'getUserBookings').mockResolvedValue([
      {
        bookingId: 202,
        bookingRef: 'DK-2026-0202',
        userId: 1,
        vehicleTypeId: 2,
        vehicleTypeName: 'SUV / Scorpio 4x4',
        pickupLocation: 'Kathmandu Airport',
        dropoffLocation: 'Nagarkot Viewpoint',
        pickupDate: '2026-09-12T07:30:00.000Z',
        pickupTime: '07:30 AM',
        returnDate: null,
        passengerCount: 2,
        tripType: 'One Way',
        estimatedFare: 'NPR 4,500',
        finalFare: 'NPR 5,000',
        status: 'Confirmed',
        assignedVehiclePlate: 'BA 2 PA 4521',
        assignedVehicleModel: 'Mahindra Scorpio S11 4x4',
        assignedDriverName: 'Bikram Thapa',
        assignedDriverPhone: '+977 9851011223',
        additionalDetails: 'Sunset tour',
        createdAt: '2026-09-09T08:00:00.000Z',
      },
    ]);

    let tree: any;
    await renderer.act(async () => {
      tree = renderer.create(
        <NavigationContainer>
          <ThemeProvider>
            <MyTripsScreen />
          </ThemeProvider>
        </NavigationContainer>,
      );
    });

    const allText = tree.root
      .findAllByType('Text' as any)
      .map((t: any) => {
        const getChildren = (c: any): string => {
          if (!c) return '';
          if (typeof c === 'string') return c;
          if (typeof c === 'number') return String(c);
          if (Array.isArray(c)) return c.map(getChildren).join(' ');
          if (c.props?.children) return getChildren(c.props.children);
          return '';
        };
        return getChildren(t.props.children);
      })
      .join(' ');

    // Verify Confirmed Status
    expect(allText).toContain('Confirmed');

    // Verify Driver information is visible
    expect(allText).toContain('ASSIGNED DRIVER');
    expect(allText).toContain('Bikram Thapa');
    expect(allText).toContain('+977 9851011223');

    // Verify Vehicle information is visible
    expect(allText).toContain('Mahindra Scorpio S11 4x4');
    expect(allText).toContain('BA 2 PA 4521');
    expect(allText).toContain('Assigned & Inspected Fleet');

    // Verify Final Agreed Fare is visible
    expect(allText).toContain('Agreed Fare');
    expect(allText).toContain('5,000');

    renderer.act(() => {
      tree?.unmount();
    });
  });
});
