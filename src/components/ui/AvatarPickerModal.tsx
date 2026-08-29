import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Award,
  Camera,
  Check,
  Compass,
  Mountain,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from 'lucide-react-native';

import { Button } from './Button';
import { SlideDrawerModal } from './SlideDrawerModal';
import { radius, spacing } from '../../theme/spacing';
import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { hapticFeedback } from '../../utils/haptics';

export type AvatarOption = {
  id: string;
  label: string;
  subLabel: string;
  badgeType: 'icon' | 'initials';
  bgColor: string;
  icon?: typeof Mountain;
};

export const PRESET_AVATARS: AvatarOption[] = [
  {
    id: 'sherpa_guide',
    label: 'Sherpa Guide',
    subLabel: 'High Altitude Guide',
    badgeType: 'icon',
    bgColor: '#059669',
    icon: Mountain,
  },
  {
    id: 'alpine_nomad',
    label: 'Alpine Nomad',
    subLabel: 'Himalayan Explorer',
    badgeType: 'icon',
    bgColor: '#D97706',
    icon: Compass,
  },
  {
    id: 'summit_pioneer',
    label: 'Summit Pioneer',
    subLabel: 'Peak Expeditionist',
    badgeType: 'icon',
    bgColor: '#4F46E5',
    icon: Award,
  },
  {
    id: 'himalayan_ace',
    label: 'Himalayan Ace',
    subLabel: 'VIP Rover',
    badgeType: 'icon',
    bgColor: '#7C3AED',
    icon: Sparkles,
  },
  {
    id: 'road_captain',
    label: 'Road Captain',
    subLabel: 'Verified Chauffeur',
    badgeType: 'icon',
    bgColor: '#0F172A',
    icon: ShieldCheck,
  },
  {
    id: 'classic_user',
    label: 'Classic Traveler',
    subLabel: 'Account Initials',
    badgeType: 'initials',
    bgColor: '#EA580C',
    icon: UserIcon,
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  currentAvatarId?: string;
  userName: string;
  onSelectAvatar: (avatar: AvatarOption) => void;
};

export function AvatarPickerModal({
  visible,
  onClose,
  currentAvatarId = 'classic_user',
  userName,
  onSelectAvatar,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [selectedId, setSelectedId] = useState<string>(currentAvatarId);

  const initials = userName
    ? userName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : 'DK';

  const handleApply = () => {
    const chosen = PRESET_AVATARS.find((a) => a.id === selectedId) || PRESET_AVATARS[0];
    hapticFeedback.success();
    onSelectAvatar(chosen);
    onClose();
  };

  return (
    <SlideDrawerModal visible={visible} onClose={onClose} title="Choose Avatar Persona">
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          Select your Himalayan Explorer badge to personalize your Drive Kendra travel profile.
        </Text>

        <View style={styles.grid}>
          {PRESET_AVATARS.map((item) => {
            const isSelected = selectedId === item.id;
            const Icon = item.icon || UserIcon;

            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  hapticFeedback.selection();
                  setSelectedId(item.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} avatar`}
                style={({ pressed }) => [
                  styles.card,
                  isSelected && styles.cardSelected,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={[styles.avatarCircle, { backgroundColor: item.bgColor }]}>
                  {item.badgeType === 'initials' ? (
                    <Text style={styles.initialsText}>{initials}</Text>
                  ) : (
                    <Icon size={26} color="#FFFFFF" />
                  )}
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </View>

                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                  {item.label}
                </Text>
                <Text style={styles.cardSub}>{item.subLabel}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Action Button */}
        <View style={styles.actionRow}>
          <Button
            label="Save Avatar"
            onPress={handleApply}
            variant="primary"
            icon={<Check size={18} color={colors.onAccent} />}
          />
        </View>
      </View>
    </SlideDrawerModal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      paddingTop: spacing.xs,
    },
    subtitle: {
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      justifyContent: 'space-between',
    },
    card: {
      width: '48%',
      backgroundColor: colors.elevated,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: spacing.xs,
    },
    cardSelected: {
      backgroundColor: colors.surface,
      borderColor: colors.accent,
    },
    cardPressed: {
      opacity: 0.8,
    },
    avatarCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    initialsText: {
      fontSize: 20,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    checkBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    cardLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
    },
    cardLabelSelected: {
      color: colors.accent,
    },
    cardSub: {
      fontSize: 10,
      color: colors.muted,
      marginTop: 2,
      textAlign: 'center',
    },
    actionRow: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
  });
}
