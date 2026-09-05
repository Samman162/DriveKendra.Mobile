import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarCheck, Car, Home as HomeIcon, User as UserIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthScreen } from '../screens/AuthScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MyTripsScreen } from '../screens/MyTripsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback } from '../utils/haptics';
import { AdminNavigator } from './AdminNavigator';
import type { RootStackParamList, RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  initialRouteName?: keyof RootStackParamList;
  isOnboardingCompleted?: boolean;
}

function stackScreenOptions(colors: ReturnType<typeof useTheme>['colors'], title?: string) {
  return {
    title,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '800' as const },
    headerShadowVisible: false,
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
        name="Booking"
        component={BookingScreen}
        options={{
          title: 'Book Ride',
          tabBarIcon: ({ color, size }) => <Car color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MyBookings"
        component={MyTripsScreen}
        options={{
          title: 'My Trips',
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

export function AppNavigator({
  initialRouteName,
  isOnboardingCompleted = true,
}: AppNavigatorProps) {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <RootStack.Navigator
      initialRouteName={
        isAuthenticated
          ? (initialRouteName || 'MainTabs')
          : (isOnboardingCompleted ? 'Auth' : 'Onboarding')
      }
    >
      {isAuthenticated ? (
        // ================= AUTHENTICATED ACCESS =================
        <>
          {/* 4-Tab Bottom Shell */}
          <RootStack.Screen
            name="MainTabs"
            component={MainTabsNavigator}
            options={{ headerShown: false }}
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

          {/* 24/7 Support Desk */}
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

          {/* Onboarding Replay Screen */}
          <RootStack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{
              headerShown: false,
              animation: 'fade',
            }}
          />

          {/* Authentication Screen Modal (Allows account switching) */}
          <RootStack.Screen
            name="Auth"
            component={AuthScreen}
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </>
      ) : (
        // ================= UNAUTHENTICATED AUTH GATE =================
        <>
          {!isOnboardingCompleted ? (
            <>
              <RootStack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{
                  headerShown: false,
                  animation: 'fade',
                }}
              />
              <RootStack.Screen
                name="Auth"
                component={AuthScreen}
                options={{
                  headerShown: false,
                  animation: 'fade',
                }}
              />
            </>
          ) : (
            <>
              <RootStack.Screen
                name="Auth"
                component={AuthScreen}
                options={{
                  headerShown: false,
                  animation: 'fade',
                }}
              />
              <RootStack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                options={{
                  headerShown: false,
                  animation: 'fade',
                }}
              />
            </>
          )}

          {/* 24/7 Support Desk */}
          <RootStack.Screen
            name="Contact"
            component={ContactScreen}
            options={stackScreenOptions(colors, '24/7 Support Desk')}
          />
        </>
      )}

      {/* ================= ADMIN 2FA PIN GATE ================= */}
      <RootStack.Screen
        name="AdminPinGate"
        component={AdminNavigator}
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
    </RootStack.Navigator>
  );
}
