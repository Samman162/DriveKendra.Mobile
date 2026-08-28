import React from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import type { ThemeColors } from '../../theme/colors';

const BRAND_IMAGE = require('../../../assets/favicon.png');

interface MapPinBrandBadgeProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Top ambient peach/orange background organic blobs
 */
export function TopAmbientBlobs() {
  const { isDark } = useTheme();
  return (
    <View style={styles.blobsContainer} pointerEvents="none">
      <Svg width="260" height="240" viewBox="0 0 260 240">
        <Circle cx="40" cy="30" r="130" fill={isDark ? '#3B2416' : '#FFE5D0'} opacity={isDark ? 0.45 : 0.85} />
        <Circle cx="120" cy="10" r="100" fill={isDark ? '#4A2A1A' : '#FFD5B8'} opacity={isDark ? 0.35 : 0.6} />
        <Circle cx="0" cy="110" r="85" fill={isDark ? '#2E1D12' : '#FFEFE2'} opacity={isDark ? 0.4 : 0.9} />
      </Svg>
    </View>
  );
}

/**
 * Teardrop Map Pin Badge containing the TK Logo
 */
export function MapPinBrandBadge({
  size = 110,
  style,
  testID = 'map-pin-brand-badge',
}: MapPinBrandBadgeProps) {
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);

  const pinWidth = size;
  const pinHeight = Math.round(size * 1.32);
  const logoCircleSize = Math.round(size * 0.62);
  const logoImageSize = Math.round(logoCircleSize * 0.72);

  return (
    <View testID={testID} style={[styles.wrapper, { width: pinWidth, height: pinHeight }, style]}>
      {/* Teardrop Pin Shape */}
      <Svg width={pinWidth} height={pinHeight} viewBox="0 0 100 132">
        <Path
          d="M 50 0 C 22.38 0, 0 22.38, 0 50 C 0 76, 32 112, 50 130 C 68 112, 100 76, 100 50 C 100 22.38, 77.62 0, 50 0 Z"
          fill={isDark ? '#1E293B' : '#FFF7F2'}
          stroke={isDark ? '#334155' : '#FFECD9'}
          strokeWidth="2"
        />
      </Svg>

      {/* Centered Circular TK Logo */}
      <View
        style={[
          styles.logoCircle,
          {
            width: logoCircleSize,
            height: logoCircleSize,
            borderRadius: logoCircleSize / 2,
            top: Math.round(pinHeight * 0.15),
          },
          isDark && styles.logoCircleDark,
        ]}
      >
        <Image
          source={BRAND_IMAGE}
          style={{ width: logoImageSize, height: logoImageSize }}
          resizeMode="contain"
          accessibilityLabel="Drive Kendra Brand Logo"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blobsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
  },
});

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
      elevation: 8,
    },
    logoCircle: {
      position: 'absolute',
      backgroundColor: '#FFFFFF',
      borderWidth: 2.5,
      borderColor: '#FF6B00',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#FF6B00',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    logoCircleDark: {
      backgroundColor: '#0F172A',
      borderColor: '#FF7A1A',
    },
  });
