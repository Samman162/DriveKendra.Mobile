import React from 'react';
import renderer from 'react-test-renderer';

import { ThemeProvider } from '../src/theme/ThemeProvider';
import { AuthProvider } from '../src/context/AuthContext';
import { HomeScreen } from '../src/screens/HomeScreen';
import * as offlineStorage from '../src/utils/offlineVoucherStorage';
import * as Linking from 'expo-linking';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
    useFocusEffect: (cb: any) => cb(),
  };
});

describe('HomeScreen Clean Professional UI & Interactivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders brand identity, clean header, and sections correctly', async () => {
    let tree: any = null;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <AuthProvider>
            <HomeScreen />
          </AuthProvider>
        </ThemeProvider>
      );
    });

    const root = tree.root;
    const textNodes = root.findAllByType('Text' as any);
    const textContents = textNodes.map((t: any) => t.props.children).flat();

    expect(textContents).toContain('Drive Kendra');
    expect(textContents).toContain('Plan Your Trip');
    expect(textContents).toContain('Select Vehicle');
    expect(textContents).toContain('Popular Routes');
    expect(textContents).toContain('24/7 Roadside Assistance');

    renderer.act(() => {
      tree?.unmount();
    });
  });

  it('allows switching trip type between One Way and Round Trip', async () => {
    let tree: any = null;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <AuthProvider>
            <HomeScreen />
          </AuthProvider>
        </ThemeProvider>
      );
    });

    const root = tree.root;
    const roundTripBtn = root.findByProps({ accessibilityLabel: 'Round Trip' });
    expect(roundTripBtn).toBeTruthy();

    await renderer.act(async () => {
      roundTripBtn.props.onPress();
    });

    renderer.act(() => {
      tree?.unmount();
    });
  });

  it('navigates to Booking when "Find Vehicles & Fares" is pressed', async () => {
    let tree: any = null;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <AuthProvider>
            <HomeScreen />
          </AuthProvider>
        </ThemeProvider>
      );
    });

    const root = tree.root;
    const searchBtn = root.findByProps({ accessibilityLabel: 'Find Vehicles & Fares' });
    expect(searchBtn).toBeTruthy();

    await renderer.act(async () => {
      searchBtn.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      'Booking',
      expect.objectContaining({
        pickupLocation: 'Kathmandu Valley, Nepal',
        tripType: 'One Way',
      })
    );

    renderer.act(() => {
      tree?.unmount();
    });
  });

  it('navigates to Booking with vehicleTypeId when a fleet card is selected', async () => {
    let tree: any = null;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <AuthProvider>
            <HomeScreen />
          </AuthProvider>
        </ThemeProvider>
      );
    });

    const root = tree.root;
    const scorpioCard = root.findByProps({
      accessibilityLabel: 'Book Scorpio 4x4',
    });
    expect(scorpioCard).toBeTruthy();

    await renderer.act(async () => {
      scorpioCard.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      'Booking',
      expect.objectContaining({
        vehicleTypeId: 2,
        pickupLocation: 'Kathmandu Valley, Nepal',
      })
    );

    renderer.act(() => {
      tree?.unmount();
    });
  });

  it('pre-fills route and navigates to Booking when a curated expedition is selected', async () => {
    let tree: any = null;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <AuthProvider>
            <HomeScreen />
          </AuthProvider>
        </ThemeProvider>
      );
    });

    const root = tree.root;
    const routeCard = root.findByProps({
      accessibilityLabel: 'Book expedition: Kathmandu ⇄ Pokhara',
    });
    expect(routeCard).toBeTruthy();

    await renderer.act(async () => {
      routeCard.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Booking', {
      vehicleTypeId: 1,
      pickupLocation: 'Kathmandu Valley, Nepal',
      dropoffLocation: 'Pokhara, Nepal',
      tripType: 'One Way',
    });

    renderer.act(() => {
      tree?.unmount();
    });
  });

  it('opens phone dialer when Call Hotline button is pressed', async () => {
    let tree: any = null;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <AuthProvider>
            <HomeScreen />
          </AuthProvider>
        </ThemeProvider>
      );
    });

    const root = tree.root;
    const callBtn = root.findByProps({ accessibilityLabel: 'Call Hotline' });
    expect(callBtn).toBeTruthy();

    await renderer.act(async () => {
      callBtn.props.onPress();
    });

    expect(Linking.openURL).toHaveBeenCalledWith(
      expect.stringContaining('tel:')
    );

    renderer.act(() => {
      tree?.unmount();
    });
  });

  it('renders active upcoming trip card when offline voucher exists', async () => {
    const mockVoucher = {
      id: 'trip_101',
      bookingRef: 'DK-2026-9999',
      pickup: 'Kathmandu Airport (TIA)',
      dropoff: 'Pokhara Lakeside',
      date: '2026-09-10',
      time: '08:00 AM',
      tripType: 'One Way',
      vehicleName: 'Mahindra Scorpio 4x4',
      vehiclePlate: 'Ba 2 Cha 9999',
      fare: 'NPR 14,000',
      status: 'confirmed' as const,
      cachedAt: new Date().toISOString(),
      verificationCode: 'DK-VERIFY-9999',
      emergencyHotline: '+9779851363783',
      policeEmergency: '100',
      touristPolice: '1144',
    };

    jest.spyOn(offlineStorage, 'getActiveOfflineVoucher').mockResolvedValue(mockVoucher);

    let tree: any = null;
    await renderer.act(async () => {
      tree = renderer.create(
        <ThemeProvider>
          <AuthProvider>
            <HomeScreen />
          </AuthProvider>
        </ThemeProvider>
      );
    });

    const root = tree.root;
    const textNodes = root.findAllByType('Text' as any);
    const textContents = textNodes.map((t: any) => t.props.children).flat();

    expect(textContents).toContain('UPCOMING RESERVATION');
    expect(textContents).toContain('Mahindra Scorpio 4x4');
    expect(textContents).toContain('2026-09-10');

    renderer.act(() => {
      tree?.unmount();
    });
  });
});
