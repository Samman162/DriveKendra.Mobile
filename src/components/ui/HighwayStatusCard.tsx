import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mountain,
  Navigation,
} from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';

interface HighwayStatusItem {
  id: string;
  name: string;
  route: string;
  status: 'clear' | 'caution' | '4x4_only';
  statusLabel: string;
  note: string;
}

const HIGHWAY_CONDITIONS: HighwayStatusItem[] = [
  {
    id: 'prithvi',
    name: 'Prithvi Highway',
    route: 'Kathmandu ➔ Pokhara (200km)',
    status: 'caution',
    statusLabel: 'Widening Work',
    note: 'Expect 30m slowdown near Mugling-Abukhaireni section.',
  },
  {
    id: 'narayanghat',
    name: 'Mugling - Narayanghat',
    route: 'Chitwan Access (36km)',
    status: 'clear',
    statusLabel: 'All Clear',
    note: 'Double-lane asphalt clear with zero active landslide halts.',
  },
  {
    id: 'mustang',
    name: 'Beni - Jomsom Highway',
    route: 'Upper Mustang Circuit',
    status: '4x4_only',
    statusLabel: '4x4 Mandatory',
    note: 'Rugged terrain past Ghasa; high ground clearance SUV required.',
  },
  {
    id: 'bp_highway',
    name: 'BP Highway (Baneswor-Bardibas)',
    route: 'Eastern Nepal (160km)',
    status: 'clear',
    statusLabel: 'Operational',
    note: 'Scenic winding single-lane paved route; small/medium vehicles optimal.',
  },
];

export function HighwayStatusCard() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [expanded, setExpanded] = useState(false);

  const getStatusBadge = (status: HighwayStatusItem['status'], label: string) => {
    if (status === 'clear') {
      return (
        <View style={[styles.badge, styles.badgeClear]}>
          <CheckCircle2 size={12} color="#16A34A" />
          <Text style={styles.badgeTextClear}>{label}</Text>
        </View>
      );
    }
    if (status === '4x4_only') {
      return (
        <View style={[styles.badge, styles.badge4x4]}>
          <Mountain size={12} color="#D97706" />
          <Text style={styles.badgeText4x4}>{label}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeCaution]}>
        <AlertCircle size={12} color="#EA580C" />
        <Text style={styles.badgeTextCaution}>{label}</Text>
      </View>
    );
  };

  const displayedList = expanded ? HIGHWAY_CONDITIONS : HIGHWAY_CONDITIONS.slice(0, 2);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Navigation size={18} color={colors.accent} />
          <Text style={styles.title}>Live Mountain Highway Advisory</Text>
        </View>
        <View style={styles.liveTag}>
          <View style={styles.livePulseDot} />
          <Text style={styles.liveTagText}>LIVE</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Real-time road transit conditions reported across Nepal's major tourist corridors.
      </Text>

      {/* Conditions List */}
      <View style={styles.list}>
        {displayedList.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemMain}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemRoute}>{item.route}</Text>
              <Text style={styles.itemNote}>{item.note}</Text>
            </View>
            <View style={styles.badgeContainer}>
              {getStatusBadge(item.status, item.statusLabel)}
            </View>
          </View>
        ))}
      </View>

      {/* Toggle View More */}
      <Pressable
        style={styles.toggleBtn}
        onPress={() => {
          hapticFeedback.light();
          setExpanded(!expanded);
        }}
      >
        <Text style={styles.toggleText}>
          {expanded ? 'Show Less' : `View All ${HIGHWAY_CONDITIONS.length} Highway Conditions`}
        </Text>
        {expanded ? (
          <ChevronUp size={16} color={colors.accent} />
        ) : (
          <ChevronDown size={16} color={colors.accent} />
        )}
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    liveTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#22C55E15',
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: radius.pill,
      gap: 4,
    },
    livePulseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#22C55E',
    },
    liveTagText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#16A34A',
    },
    subtitle: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: spacing.xs,
    },
    list: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemMain: {
      flex: 1,
      paddingRight: spacing.sm,
    },
    itemName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    itemRoute: {
      fontSize: 11,
      color: colors.accent,
      fontWeight: '600',
      marginTop: 1,
    },
    itemNote: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
    },
    badgeContainer: {
      alignItems: 'flex-end',
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.xs,
      paddingVertical: 3,
      borderRadius: radius.pill,
      gap: 4,
    },
    badgeClear: {
      backgroundColor: '#22C55E20',
    },
    badgeTextClear: {
      fontSize: 11,
      fontWeight: '600',
      color: '#16A34A',
    },
    badgeCaution: {
      backgroundColor: '#F9731620',
    },
    badgeTextCaution: {
      fontSize: 11,
      fontWeight: '600',
      color: '#EA580C',
    },
    badge4x4: {
      backgroundColor: '#F59E0B20',
    },
    badgeText4x4: {
      fontSize: 11,
      fontWeight: '600',
      color: '#D97706',
    },
    toggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs,
      gap: 4,
      marginTop: 2,
    },
    toggleText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.accent,
    },
  });
}
