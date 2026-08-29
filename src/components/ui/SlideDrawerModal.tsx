import React, { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';

export interface SlideDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  height?: DimensionValue;
  showCancelButton?: boolean;
}

export function SlideDrawerModal({
  visible,
  onClose,
  title,
  children,
  height,
  showCancelButton = true,
}: SlideDrawerModalProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return gesture.dy > 6 && Math.abs(gesture.dx) < 20;
      },
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 70 || gesture.vy > 0.4) {
          hapticFeedback.light();
          Animated.timing(translateY, {
            toValue: 500,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        {/* Backdrop Tap to Dismiss */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            hapticFeedback.light();
            onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss drawer"
        />

        {/* Sliding Drawer Card */}
        <Animated.View
          style={[
            styles.sheetCard,
            height ? { height } : undefined,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top Drag Handle & Gesture Header Area */}
          <View {...panResponder.panHandlers} style={styles.dragHandleZone}>
            <View style={styles.dragHandle} />

            <View style={styles.topHeaderRow}>
              <View style={{ width: 28 }} />

              <Text style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>

              <Pressable
                onPress={() => {
                  hapticFeedback.light();
                  onClose();
                }}
                hitSlop={12}
                style={styles.closeIconBtn}
                accessibilityRole="button"
                accessibilityLabel="Close drawer"
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Drawer Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
    },
    sheetCard: {
      width: '100%',
      maxHeight: '90%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 20,
    },
    dragHandleZone: {
      paddingTop: 10,
      paddingBottom: spacing.xs,
      backgroundColor: colors.surface,
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.xs,
    },
    topHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
    },
    titleText: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.accent,
      textAlign: 'center',
      flex: 1,
    },
    closeIconBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contentContainer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xl,
    },
  });
