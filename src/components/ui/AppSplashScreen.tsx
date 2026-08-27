import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import type { ThemeColors } from '../../theme/colors';

const BRAND_IMAGE = require('../../../assets/favicon.png');

interface AppSplashScreenProps {
  isReady: boolean;
  onFinish?: () => void;
  minDurationMs?: number;
}

export function AppSplashScreen({
  isReady,
  onFinish,
  minDurationMs = 1100,
}: AppSplashScreenProps) {
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  // Animations
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Enforce minimum splash display duration for smooth UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs]);

  // Entrance and pulse animations
  useEffect(() => {
    let isMounted = true;
    let pulseLoop: Animated.CompositeAnimation | null = null;

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!isMounted) return;
      // Subtle pulse while waiting
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseLoop.start();
    });

    return () => {
      isMounted = false;
      if (pulseLoop) {
        pulseLoop.stop();
      }
    };
  }, [cardOpacity, cardScale, pulseAnim]);

  // Trigger smooth exit transition when app is ready AND min display time has elapsed
  useEffect(() => {
    if (isReady && minTimeElapsed) {
      // Hide the native OS splash screen cleanly
      SplashScreen.hideAsync().catch(() => {});

      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1.06,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
        onFinish?.();
      });
    }
  }, [containerOpacity, cardScale, isReady, minTimeElapsed, onFinish]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
        },
      ]}
      pointerEvents="none"
      testID="app-splash-screen"
    >
      <Animated.View
        style={[
          styles.card,
          isDark && styles.cardDark,
          {
            opacity: cardOpacity,
            transform: [{ scale: Animated.multiply(cardScale, pulseAnim) }],
          },
        ]}
      >
        <Image
          source={BRAND_IMAGE}
          style={styles.logoImage}
          resizeMode="contain"
          accessibilityLabel="Drive Kendra Logo"
        />
      </Animated.View>
    </Animated.View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.background === '#F1F5F9' ? '#FFFFFF' : theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      elevation: 99999,
    },
    card: {
      width: 124,
      height: 124,
      borderRadius: 28,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E8ECF2',
      // Multi-layer drop shadow for realistic squircle depth
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
      elevation: 10,
    },
    cardDark: {
      backgroundColor: '#1E293B',
      borderColor: theme.border,
      shadowColor: '#000000',
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
    },
    logoImage: {
      width: 82,
      height: 82,
    },
  });
