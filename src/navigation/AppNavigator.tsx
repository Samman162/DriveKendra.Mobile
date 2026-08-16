import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Car, Compass, Map, PhoneCall, Sparkles } from 'lucide-react-native';

import { ThemeToggle } from '../components/ui/ThemeToggle';
import { AirportScreen } from '../screens/AirportScreen';
import { BookingScreen } from '../screens/BookingScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { FleetScreen } from '../screens/FleetScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RatesScreen } from '../screens/RatesScreen';
import { TourDetailScreen } from '../screens/TourDetailScreen';
import { ToursScreen } from '../screens/ToursScreen';
import { WeddingScreen } from '../screens/WeddingScreen';
import { useTheme } from '../theme/ThemeProvider';
import type { ExploreStackParamList, HomeStackParamList, RootTabParamList, ToursStackParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const ToursStack = createNativeStackNavigator<ToursStackParamList>();

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
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
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
    </ExploreStack.Navigator>
  );
}

function ToursStackNavigator() {
  const { colors } = useTheme();
  return (
    <ToursStack.Navigator screenOptions={stackScreenOptions(colors)}>
      <ToursStack.Screen name="ToursHome" component={ToursScreen} options={{ headerShown: false }} />
      <ToursStack.Screen name="TourDetail" component={TourDetailScreen} options={{ title: 'Tour package' }} />
    </ToursStack.Navigator>
  );
}

export function AppNavigator() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.navySoft,
          height: 64,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.highlight,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          paddingBottom: 6,
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
