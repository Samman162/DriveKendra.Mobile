import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BarChart3, Bell, Car, PhoneCall, UserPlus } from 'lucide-react-native';

import { useNotifications } from '../hooks/useSignalR';
import { BookingScreen } from '../screens/BookingScreen';
import { ContactScreen } from '../screens/ContactScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { PartnerRegisterScreen } from '../screens/PartnerRegisterScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { colors } from '../theme/colors';

export type RootTabParamList = {
  Book: undefined;
  Partner: undefined;
  Stats: undefined;
  Alerts: undefined;
  Contact: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator() {
  const { unreadCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.highlight,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Book"
        component={BookingScreen}
        options={{
          title: 'Book Trip',
          tabBarIcon: ({ color, size }) => <Car color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Partner"
        component={PartnerRegisterScreen}
        options={{
          title: 'Partner Join',
          tabBarIcon: ({ color, size }) => <UserPlus color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: 'Stats & Fleet',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={NotificationsScreen}
        options={{
          title: 'Alerts',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
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
