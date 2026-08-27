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
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { AppSplashScreen } from './src/components/ui/AppSplashScreen';
import { hasCompletedOnboarding } from './src/utils/onboardingStorage';

// Keep native splash screen visible while app initializes JS engine & assets
SplashScreen.preventAutoHideAsync().catch(() => {});

function ThemedApp() {
  const { colors, isDark } = useTheme();
  const { isLoading } = useAuth();
  const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(true);

  // Initialize push notification listener & token lifecycle
  usePushNotifications();

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

    return () => {
      isMounted = false;
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

  const isAppReady = !isLoading && isOnboardingChecked;

  return (
    <>
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {isOnboardingChecked && (
          <AppNavigator
            initialRouteName={isOnboardingCompleted ? 'MainTabs' : 'Onboarding'}
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
            <BottomSheetModalProvider>
              <ThemedApp />
            </BottomSheetModalProvider>
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
