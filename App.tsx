import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as SplashScreen from 'expo-splash-screen';

import { AppNavigator } from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './src/context/AdminAuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AppSplashScreen } from './src/components/ui/AppSplashScreen';
import { hasCompletedOnboarding, subscribeOnboarding } from './src/utils/onboardingStorage';
import { useTripNotificationsWatcher } from './src/hooks/useTripNotificationsWatcher';

// Keep native splash screen visible while app initializes JS engine & assets
SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedApp() {
  const { colors, isDark } = useTheme();
  const { isLoading: isAuthLoading } = useAuth();
  const { isLoading: isAdminAuthLoading } = useAdminAuth();
  const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(true);

  // Real-time Trip Notifications & Permissions Watcher
  useTripNotificationsWatcher();

  // Check if first-launch onboarding walkthrough has been completed
  useEffect(() => {
    let isMounted = true;
    hasCompletedOnboarding()
      .then((completed) => {
        if (isMounted) {
          setIsOnboardingCompleted(completed);
          setIsOnboardingChecked(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsOnboardingChecked(true);
        }
      });

    const unsubscribe = subscribeOnboarding((completed) => {
      if (isMounted) {
        setIsOnboardingCompleted(completed);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.background,
      primary: colors.accent,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };

  const isAppReady = !isAuthLoading && !isAdminAuthLoading && isOnboardingChecked;

  return (
    <>
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {isOnboardingChecked && (
          <AppNavigator
            isOnboardingCompleted={isOnboardingCompleted}
          />
        )}
      </NavigationContainer>
      <AppSplashScreen isReady={isAppReady} />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <BottomSheetModalProvider>
                <ThemedApp />
              </BottomSheetModalProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
