import React from 'react';
import {
  Image,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import type { ThemeColors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero' | number;
export type BrandLogoVariant = 'card' | 'plain' | 'badge' | 'withText';

export interface BrandLogoProps {
  size?: BrandLogoSize;
  variant?: BrandLogoVariant;
  showTagline?: boolean;
  taglineText?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  testID?: string;
}

const BRAND_IMAGE = require('../../../assets/favicon.png');

function resolveDimensions(size: BrandLogoSize) {
  if (typeof size === 'number') {
    return {
      cardSize: Math.round(size * 1.45),
      imageSize: size,
      cardRadius: Math.round(size * 0.38),
    };
  }

  switch (size) {
    case 'xs':
      return { cardSize: 32, imageSize: 22, cardRadius: radius.sm };
    case 'sm':
      return { cardSize: 42, imageSize: 28, cardRadius: radius.md };
    case 'md':
      return { cardSize: 60, imageSize: 40, cardRadius: 18 };
    case 'lg':
      return { cardSize: 84, imageSize: 56, cardRadius: 24 };
    case 'xl':
      return { cardSize: 112, imageSize: 76, cardRadius: 30 };
    case 'hero':
      return { cardSize: 140, imageSize: 96, cardRadius: 36 };
    default:
      return { cardSize: 60, imageSize: 40, cardRadius: 18 };
  }
}

export function BrandLogo({
  size = 'md',
  variant = 'card',
  showTagline = false,
  taglineText = 'Travel & Logistics Nepal',
  style,
  imageStyle,
  testID = 'brand-logo',
}: BrandLogoProps) {
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { cardSize, imageSize, cardRadius } = resolveDimensions(size);

  const imageElement = (
    <Image
      source={BRAND_IMAGE}
      style={[
        {
          width: imageSize,
          height: imageSize,
        },
        variant === 'plain' && { borderRadius: cardRadius / 2 },
        imageStyle,
      ]}
      resizeMode="contain"
      accessibilityLabel="Drive Kendra Logo"
    />
  );

  if (variant === 'plain') {
    return (
      <View testID={testID} style={[styles.plainContainer, style]}>
        {imageElement}
      </View>
    );
  }

  if (variant === 'badge') {
    return (
      <View
        testID={testID}
        style={[
          styles.badgeContainer,
          {
            width: cardSize,
            height: cardSize,
            borderRadius: cardRadius,
          },
          style,
        ]}
      >
        {imageElement}
      </View>
    );
  }

  const cardElement = (
    <View
      testID={testID}
      style={[
        styles.cardContainer,
        {
          width: cardSize,
          height: cardSize,
          borderRadius: cardRadius,
        },
        isDark && styles.cardContainerDark,
        style,
      ]}
    >
      {imageElement}
    </View>
  );

  if (variant === 'withText') {
    return (
      <View style={[styles.withTextRow, style]}>
        {cardElement}
        <View style={styles.textWrap}>
          <Text style={styles.brandTitle}>Drive Kendra</Text>
          {showTagline && <Text style={styles.taglineText}>{taglineText}</Text>}
        </View>
      </View>
    );
  }

  return cardElement;
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth * 1.5,
      borderColor: '#E2E8F0',
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 14,
      elevation: 6,
    },
    cardContainerDark: {
      backgroundColor: '#1E293B',
      borderColor: theme.border,
      shadowColor: '#000000',
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    badgeContainer: {
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    plainContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    withTextRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    textWrap: {
      flexShrink: 1,
    },
    brandTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.3,
    },
    taglineText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.subtle,
      marginTop: 2,
    },
  });
