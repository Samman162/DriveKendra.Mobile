import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext';
import { AdminPinScreen } from '../screens/admin/AdminPinScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import type { ThemeColors } from '../theme/colors';
import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

function AdminNavigatorContent() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { isAdminAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {isAdminAuthenticated ? (
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      ) : (
        <Stack.Screen
          name="AdminPin"
          component={AdminPinScreen}
          options={{ animation: 'slide_from_right' }}
        />
      )}
    </Stack.Navigator>
  );
}

export function AdminNavigator() {
  return (
    <AdminAuthProvider>
      <AdminNavigatorContent />
    </AdminAuthProvider>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
  });
}
