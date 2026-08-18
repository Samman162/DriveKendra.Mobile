import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Clock, Compass, MapPin, Milestone, Mountain, Navigation, ShieldCheck } from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';

type MapRoutePreviewProps = {
  pickup: string;
  dropoff: string;
  distance?: string;
  duration?: string;
  elevationNote?: string;
};

export function MapRoutePreview({
  pickup,
  dropoff,
  distance = '200 KM',
  duration = '5.5 Hours',
  elevationNote = 'Scenic Hill Highway (Kathmandu ➔ Prithvi Highway)',
}: MapRoutePreviewProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {/* Route Graphic Simulation */}
      <View style={styles.mapCanvas}>
        {/* Highway road curve */}
        <View style={styles.roadTrack}>
          <View style={styles.roadDash} />
          <View style={styles.roadDash} />
          <View style={styles.roadDash} />
        </View>

        {/* Start Point */}
        <View style={styles.waypointStart}>
          <View style={styles.pulseDotStart}>
            <View style={styles.innerDotStart} />
          </View>
          <View style={styles.waypointInfo}>
            <Text style={styles.pointType}>ORIGIN PICKUP</Text>
            <Text style={styles.pointName} numberOfLines={1}>
              {pickup || 'Kathmandu City'}
            </Text>
          </View>
        </View>

        {/* Route Midpoint Indicator */}
        <View style={styles.midpointBadge}>
          <Mountain size={12} color={colors.accent} style={{ marginRight: 4 }} />
          <Text style={styles.midpointText}>Prithvi Hill Highway</Text>
        </View>

        {/* Destination Point */}
        <View style={styles.waypointEnd}>
          <View style={styles.pulseDotEnd}>
            <MapPin size={16} color={colors.onAccent} />
          </View>
          <View style={styles.waypointInfo}>
            <Text style={styles.pointType}>DESTINATION DROP-OFF</Text>
            <Text style={styles.pointName} numberOfLines={1}>
              {dropoff || 'Pokhara Lakeside'}
            </Text>
          </View>
        </View>
      </View>

      {/* Metrics Bar */}
      <View style={styles.metricsBar}>
        <View style={styles.metricItem}>
          <Milestone size={14} color={colors.accent} />
          <Text style={styles.metricLabel}>Distance:</Text>
          <Text style={styles.metricVal}>{distance}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Clock size={14} color={colors.accent} />
          <Text style={styles.metricLabel}>Est. Time:</Text>
          <Text style={styles.metricVal}>{duration}</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <ShieldCheck size={14} color={colors.success} />
          <Text style={styles.metricVal}>Hill Certified</Text>
        </View>
      </View>
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
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    mapCanvas: {
      backgroundColor: colors.navySoft,
      padding: spacing.md,
      minHeight: 140,
      justifyContent: 'space-between',
      position: 'relative',
    },
    roadTrack: {
      position: 'absolute',
      left: 31,
      top: 36,
      bottom: 36,
      width: 2,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: colors.highlight,
    },
    roadDash: {
      height: 6,
      backgroundColor: colors.accent,
      marginVertical: 4,
      width: 2,
    },
    waypointStart: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      zIndex: 2,
    },
    pulseDotStart: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(217, 119, 6, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerDotStart: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    waypointEnd: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      zIndex: 2,
    },
    pulseDotEnd: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    waypointInfo: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    pointType: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.highlight,
      letterSpacing: 0.5,
    },
    pointName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.onNavy,
    },
    midpointBadge: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    midpointText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#CBD5E1',
    },
    metricsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.elevated,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    metricItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metricLabel: {
      fontSize: 11,
      color: colors.muted,
      fontWeight: '600',
    },
    metricVal: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '800',
    },
    metricDivider: {
      width: 1,
      height: 14,
      backgroundColor: colors.border,
    },
  });
}
