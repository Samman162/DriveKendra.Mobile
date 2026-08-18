import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Car, Compass, Map, PhoneCall, Sparkles, User as UserIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggle } from '../components/ui/ThemeToggle';
import { hapticFeedback } from '../utils/haptics';
import { AirportScreen } from '../screens/AirportScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { FleetScreen } from '../screens/FleetScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MyTripsScreen } from '../screens/MyTripsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RatesScreen } from '../screens/RatesScreen';
import { TourDetailScreen } from '../screens/TourDetailScreen';
import { ToursScreen } from '../screens/ToursScreen';
import { WeddingScreen } from '../screens/WeddingScreen';
import { useTheme } from '../theme/ThemeProvider';
import type {
  AccountStackParamList,
  ExploreStackParamList,
  HomeStackParamList,
  RootTabParamList,
  ToursStackParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const ToursStack = createNativeStackNavigator<ToursStackParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();

function stackScreenOptions(colors: ReturnType<typeof useTheme>['colors']) {
  return {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '800' as const },
    headerShadowVisible: false,
    headerRight: () => <ThemeToggle variant="onSurface" />,
  };
}

function HomeStackNavigator() {
  const { colors } = useTheme();
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <HomeStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={stackScreenOptions(colors)}
      />
      <HomeStack.Screen
        name="MyTrips"
        component={MyTripsScreen}
        options={stackScreenOptions(colors)}
      />
    </HomeStack.Navigator>
  );
}

function ExploreStackNavigator() {
  const { colors } = useTheme();
  return (
    <ExploreStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <ExploreStack.Screen name="ExploreHome" component={ExploreScreen} options={{ headerShown: false }} />
      <ExploreStack.Screen name="Fleet" component={FleetScreen} options={{ title: 'Fleet' }} />
      <ExploreStack.Screen name="Rates" component={RatesScreen} options={{ title: 'Official rates' }} />
      <ExploreStack.Screen name="Airport" component={AirportScreen} options={{ title: 'Airport transfer' }} />
      <ExploreStack.Screen name="Wedding" component={WeddingScreen} options={{ title: 'Wedding cars' }} />
      <ExploreStack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </ExploreStack.Navigator>
  );
}

function ToursStackNavigator() {
  const { colors } = useTheme();
  return (
    <ToursStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <ToursStack.Screen name="ToursHome" component={ToursScreen} options={{ headerShown: false }} />
      <ToursStack.Screen name="TourDetail" component={TourDetailScreen} options={{ title: 'Tour package' }} />
      <ToursStack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </ToursStack.Navigator>
  );
}

function AccountStackNavigator() {
  const { colors } = useTheme();
  return (
    <AccountStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <AccountStack.Screen
        name="AccountHome"
        component={ProfileScreen}
        options={{ title: 'My Account' }}
      />
      <AccountStack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <AccountStack.Screen
        name="MyTrips"
        component={MyTripsScreen}
        options={{ title: 'My Reservations' }}
      />
    </AccountStack.Navigator>
  );
}

export function AppNavigator() {
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
        component={HomeStackNavigator}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreStackNavigator}
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Book"
        component={BookingScreen}
        options={{
          title: 'Book',
          tabBarIcon: ({ color, size }) => <Car color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Tours"
        component={ToursStackNavigator}
        options={{
          title: 'Tours',
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountStackNavigator}
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          title: 'Contact',
          tabBarIcon: ({ color, size }) => <PhoneCall color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
