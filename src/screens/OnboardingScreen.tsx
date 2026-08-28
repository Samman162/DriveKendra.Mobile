import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  BookingIllustration,
  LogisticsIllustration,
  MountainTourIllustration,
  TariffVoucherIllustration,
} from '../components/onboarding/OnboardingIllustrations';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { setCompletedOnboarding } from '../utils/onboardingStorage';
import { hapticFeedback } from '../utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  description: string;
  renderIllustration: (size: number) => React.ReactNode;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'slide-booking',
    titlePrefix: 'Welcome to ',
    titleHighlight: 'Travel ',
    titleSuffix: 'Kendra',
    description:
      'Welcome to Travel Kendra, You can rent vehicle and delivery / dhuwani service as per your requirement and budget.',
    renderIllustration: (size) => <BookingIllustration size={size} />,
  },
  {
    id: 'slide-tours',
    titlePrefix: 'Explore ',
    titleHighlight: 'Himalayan ',
    titleSuffix: 'Tours',
    description:
      'Plan scenic expeditions to Muktinath, Manakamana, and Pokhara with certified mountain driving experts.',
    renderIllustration: (size) => <MountainTourIllustration size={size} />,
  },
  {
    id: 'slide-tariffs',
    titlePrefix: '100% ',
    titleHighlight: 'Transparent ',
    titleSuffix: 'Tariffs',
    description:
      'Official government-compliant rates with zero hidden surcharges and offline digital vouchers for off-grid travel.',
    renderIllustration: (size) => <TariffVoucherIllustration size={size} />,
  },
  {
    id: 'slide-logistics',
    titlePrefix: 'Express ',
    titleHighlight: 'Dhuwani & ',
    titleSuffix: 'Logistics',
    description:
      'Reliable goods transportation, parcel delivery, and commercial fleet rentals across all 7 provinces of Nepal.',
    renderIllustration: (size) => <LogisticsIllustration size={size} />,
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const isLastSlide = activeIndex === ONBOARDING_SLIDES.length - 1;
  const illustrationSize = Math.min(Math.round(SCREEN_WIDTH * 0.72), 290);

  const handleFinish = async () => {
    hapticFeedback.success();
    await setCompletedOnboarding();
    navigation.reset({
      index: 1,
      routes: [
        { name: 'MainTabs' },
        { name: 'Auth', params: { initialMode: 'signin' } },
      ],
    });
  };

  const handleNext = () => {
    if (isLastSlide) {
      handleFinish();
    } else {
      hapticFeedback.selection();
      const nextIndex = activeIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < ONBOARDING_SLIDES.length) {
      setActiveIndex(index);
      hapticFeedback.light();
    }
  };

  const renderSlideItem = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={[styles.slideContainer, { width: SCREEN_WIDTH }]}>
        {/* Top Circular Illustration */}
        <View style={styles.illustrationWrapper}>
          {item.renderIllustration(illustrationSize)}
        </View>

        {/* Content Body */}
        <View style={styles.contentWrapper}>
          <Text style={styles.titleText}>
            {item.titlePrefix}
            <Text style={styles.titleHighlight}>{item.titleHighlight}</Text>
            {item.titleSuffix}
          </Text>

          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
      testID="onboarding-screen"
    >
      {/* Horizontal Carousel */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlideItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.flatList}
      />

      {/* Bottom Bar: Skip / Pagination Dots / Next */}
      <View style={styles.bottomBar}>
        {/* Left Action: Skip */}
        <Pressable
          onPress={handleSkip}
          hitSlop={12}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          testID="onboarding-skip-btn"
        >
          <Text style={styles.skipButtonText}>
            {isLastSlide ? '' : 'Skip'}
          </Text>
        </Pressable>

        {/* Center: Pagination Dots */}
        <View style={styles.paginationDotsWrap} testID="onboarding-dots">
          {ONBOARDING_SLIDES.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={slide.id}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Right Action: Next / Get Started */}
        <Pressable
          onPress={handleNext}
          hitSlop={12}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Get Started' : 'Next slide'}
          testID="onboarding-next-btn"
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.surface,
    },
    flatList: {
      flex: 1,
    },
    slideContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
    illustrationWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xxl,
    },
    contentWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    titleText: {
      fontSize: 26,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
      letterSpacing: -0.4,
      marginBottom: spacing.md,
    },
    titleHighlight: {
      color: theme.accent,
      fontWeight: '800',
    },
    descriptionText: {
      fontSize: 15,
      lineHeight: 23,
      fontWeight: '400',
      color: theme.subtle,
      textAlign: 'center',
      maxWidth: 320,
    },
    bottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      minHeight: 48,
    },
    navButton: {
      minWidth: 70,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skipButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.accent,
    },
    nextButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.accent,
    },
    paginationDotsWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    dot: {
      height: 8,
      borderRadius: radius.pill,
    },
    dotActive: {
      width: 22,
      backgroundColor: theme.accent,
    },
    dotInactive: {
      width: 8,
      backgroundColor: theme.border,
    },
    pressed: {
      opacity: 0.6,
    },
  });
