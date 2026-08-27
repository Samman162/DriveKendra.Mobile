import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarCheck, Home as HomeIcon, User as UserIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AirportScreen } from '../screens/AirportScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { FleetScreen } from '../screens/FleetScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MyTripsScreen } from '../screens/MyTripsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RatesScreen } from '../screens/RatesScreen';
import { TourDetailScreen } from '../screens/TourDetailScreen';
import { ToursScreen } from '../screens/ToursScreen';
import { WeddingScreen } from '../screens/WeddingScreen';
import { useTheme } from '../theme/ThemeProvider';
import { hapticFeedback } from '../utils/haptics';
import type { RootStackParamList, RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  initialRouteName?: keyof RootStackParamList;
}

function stackScreenOptions(colors: ReturnType<typeof useTheme>['colors'], title?: string) {
  return {
    title,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '800' as const },
    headerShadowVisible: false,
    headerRight: () => <ThemeToggle variant="onSurface" />,
  };
}

function MainTabsNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 58 + Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenListeners={{
        tabPress: () => {
          hapticFeedback.selection();
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 10),
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          paddingBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MyBookings"
        component={MyTripsScreen}
        options={{
          title: 'My Bookings',
          tabBarIcon: ({ color, size }) => <CalendarCheck color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator({ initialRouteName = 'MainTabs' }: AppNavigatorProps) {
  const { colors } = useTheme();

  return (
    <RootStack.Navigator initialRouteName={initialRouteName}>
      {/* 3-Tab Bottom Shell */}
      <RootStack.Screen
        name="MainTabs"
        component={MainTabsNavigator}
        options={{ headerShown: false }}
      />

      {/* First-Launch Onboarding Walkthrough */}
      <RootStack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />

      {/* Booking Form Presented as Animated Full Modal Dialog */}
      <RootStack.Screen
        name="BookingModal"
        component={BookingScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />

      {/* Authentication Modal */}
      <RootStack.Screen
        name="Auth"
        component={AuthScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

      {/* Secondary Service & Exploration Screens */}
      <RootStack.Screen
        name="Fleet"
        component={FleetScreen}
        options={stackScreenOptions(colors, 'Our Fleet')}
      />
      <RootStack.Screen
        name="Rates"
        component={RatesScreen}
        options={stackScreenOptions(colors, 'Official Tariff Rates')}
      />
      <RootStack.Screen
        name="Airport"
        component={AirportScreen}
        options={stackScreenOptions(colors, 'TIA Airport Transfer')}
      />
      <RootStack.Screen
        name="Wedding"
        component={WeddingScreen}
        options={stackScreenOptions(colors, 'Wedding & VIP Luxury')}
      />
      <RootStack.Screen
        name="Tours"
        component={ToursScreen}
        options={stackScreenOptions(colors, 'Himalayan Expeditions')}
      />
      <RootStack.Screen
        name="TourDetail"
        component={TourDetailScreen}
        options={stackScreenOptions(colors, 'Tour Package')}
      />
      <RootStack.Screen
        name="Contact"
        component={ContactScreen}
        options={stackScreenOptions(colors, '24/7 Support Desk')}
      />
      <RootStack.Screen
        name="MyTrips"
        component={MyTripsScreen}
        options={stackScreenOptions(colors, 'My Reservations')}
      />
      <RootStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={stackScreenOptions(colors, 'Profile')}
      />
    </RootStack.Navigator>
  );
}
