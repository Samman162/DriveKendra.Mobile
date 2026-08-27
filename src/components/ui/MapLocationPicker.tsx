import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Car,
  Clock,
  Compass,
  Layers,
  MapPin,
  Milestone,
  Mountain,
  Navigation,
  Sparkles,
} from 'lucide-react-native';

import type { ThemeColors } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { radius, spacing } from '../../theme/spacing';
import { hapticFeedback } from '../../utils/haptics';

export interface MapHub {
  id: string;
  name: string;
  category: 'Airport' | 'City' | 'Mountain' | 'Heritage' | 'Resort';
  distanceFromKtm: string;
  estDriveTime: string;
  roadNote: string;
  icon: string;
}

export const NEPAL_MAP_HUBS: MapHub[] = [
  {
    id: 'tia',
    name: 'TIA Airport Kathmandu (TIA)',
    category: 'Airport',
    distanceFromKtm: '6 KM',
    estDriveTime: '25 Mins',
    roadNote: 'Ring Road Express • Direct terminal pickup',
    icon: '✈️',
  },
  {
    id: 'thamel',
    name: 'Thamel Tourist Hub (Kathmandu)',
    category: 'City',
    distanceFromKtm: '0 KM',
    estDriveTime: 'Local',
    roadNote: 'City Center • Hotel direct door-to-door',
    icon: '🏨',
  },
  {
    id: 'pokhara',
    name: 'Pokhara Lakeside (Muktinath Hwy)',
    category: 'Resort',
    distanceFromKtm: '200 KM',
    estDriveTime: '5.5 Hours',
    roadNote: 'Prithvi Highway • 4x4 or AC Sedan optimal',
    icon: '🌊',
  },
  {
    id: 'chitwan',
    name: 'Chitwan National Park (Sauraha)',
    category: 'Resort',
    distanceFromKtm: '165 KM',
    estDriveTime: '4.5 Hours',
    roadNote: 'Mugling-Narayanghat 4-lane expressway',
    icon: '🦏',
  },
  {
    id: 'manakamana',
    name: 'Manakamana Cable Car (Kurintar)',
    category: 'Heritage',
    distanceFromKtm: '104 KM',
    estDriveTime: '3 Hours',
    roadNote: 'Trishuli Riverside scenic asphalt highway',
    icon: '🚡',
  },
  {
    id: 'nagarkot',
    name: 'Nagarkot Sunrise Viewpoint',
    category: 'Mountain',
    distanceFromKtm: '32 KM',
    estDriveTime: '1.2 Hours',
    roadNote: 'Scenic hill climb • Himalayan sunrise',
    icon: '🏔️',
  },
  {
    id: 'bhaktapur',
    name: 'Bhaktapur Durbar Square',
    category: 'Heritage',
    distanceFromKtm: '15 KM',
    estDriveTime: '40 Mins',
    roadNote: 'Araniko 6-Lane highway',
    icon: '🏛️',
  },
  {
    id: 'lumbini',
    name: 'Lumbini (Birthplace of Buddha)',
    category: 'Heritage',
    distanceFromKtm: '280 KM',
    estDriveTime: '7.5 Hours',
    roadNote: 'East-West Mahendra Highway',
    icon: '☸️',
  },
];

interface MapLocationPickerProps {
  pickup: string;
  dropoff: string;
  onSelectPickup: (loc: string) => void;
  onSelectDropoff: (loc: string) => void;
}

export function MapLocationPicker({
  pickup,
  dropoff,
  onSelectPickup,
  onSelectDropoff,
}: MapLocationPickerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [activePinTarget, setActivePinTarget] = useState<'pickup' | 'dropoff'>('dropoff');

  const handlePinPress = (hub: MapHub) => {
    hapticFeedback.selection();
    if (activePinTarget === 'pickup') {
      onSelectPickup(hub.name);
      setActivePinTarget('dropoff');
    } else {
      onSelectDropoff(hub.name);
    }
  };

  const selectedDestinationHub = NEPAL_MAP_HUBS.find((h) => dropoff.includes(h.name) || h.name.includes(dropoff));

  return (
    <View style={styles.container}>
      {/* Map Header & Target Pin Switcher */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Layers size={16} color={colors.accent} />
          <Text style={styles.title}>Interactive Nepal Map Selector</Text>
        </View>

        <View style={styles.targetToggle}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActivePinTarget('pickup');
            }}
            style={[styles.targetBtn, activePinTarget === 'pickup' && styles.targetBtnActive]}
          >
            <MapPin size={12} color={activePinTarget === 'pickup' ? colors.onAccent : colors.accent} />
            <Text style={[styles.targetBtnText, activePinTarget === 'pickup' && styles.targetBtnTextActive]}>
              Set Pickup
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActivePinTarget('dropoff');
            }}
            style={[styles.targetBtn, activePinTarget === 'dropoff' && styles.targetBtnActive]}
          >
            <Navigation size={12} color={activePinTarget === 'dropoff' ? colors.onAccent : colors.accent} />
            <Text style={[styles.targetBtnText, activePinTarget === 'dropoff' && styles.targetBtnTextActive]}>
              Set Destination
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Simulated Visual Interactive Google Map Canvas */}
      <View style={styles.mapCanvas}>
        {/* Map Grid Watermark */}
        <View style={styles.gridOverlay} />

        {/* Live Route Connecting Line */}
        <View style={styles.routeTrack}>
          <View style={styles.roadDash} />
          <View style={styles.roadDash} />
          <View style={styles.roadDash} />
        </View>

        {/* Active Selection Indicator */}
        <View style={styles.activePromptBanner}>
          <Text style={styles.activePromptText}>
            👉 Tap any Nepal landmark pin below to set{' '}
            <Text style={styles.activePromptHighlight}>
              {activePinTarget === 'pickup' ? 'PICKUP 📍' : 'DROP-OFF DESTINATION 🎯'}
            </Text>
          </Text>
        </View>

        {/* Current Origin / Destination Pins in Canvas */}
        <View style={styles.waypointsContainer}>
          <View style={styles.waypointBox}>
            <View style={styles.pickupDot}>
              <View style={styles.innerPickupDot} />
            </View>
            <View style={styles.waypointTextWrap}>
              <Text style={styles.waypointTag}>ORIGIN PICKUP</Text>
              <Text style={styles.waypointName} numberOfLines={1}>
                {pickup || 'Select Pickup point...'}
              </Text>
            </View>
          </View>

          <View style={styles.waypointBox}>
            <View style={styles.dropoffDot}>
              <MapPin size={13} color="#FFF" />
            </View>
            <View style={styles.waypointTextWrap}>
              <Text style={styles.waypointTag}>DESTINATION</Text>
              <Text style={styles.waypointName} numberOfLines={1}>
                {dropoff || 'Select Destination...'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Interactive Hubs Pin Selector Carousel */}
      <View style={styles.pinsSection}>
        <Text style={styles.pinsSectionLabel}>Popular Nepal Tourist & Transit Hubs (Tap to select):</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pinsScroll}
        >
          {NEPAL_MAP_HUBS.map((hub) => {
            const isPickup = pickup.includes(hub.name);
            const isDropoff = dropoff.includes(hub.name);
            const isSelected = isPickup || isDropoff;

            return (
              <Pressable
                key={hub.id}
                onPress={() => handlePinPress(hub)}
                style={[
                  styles.hubCard,
                  isSelected && styles.hubCardSelected,
                ]}
              >
                <View style={styles.hubCardHeader}>
                  <Text style={styles.hubIcon}>{hub.icon}</Text>
                  {isPickup && <View style={[styles.roleBadge, { backgroundColor: colors.accent }]}><Text style={styles.roleBadgeText}>Pickup</Text></View>}
                  {isDropoff && <View style={[styles.roleBadge, { backgroundColor: colors.success }]}><Text style={styles.roleBadgeText}>Dropoff</Text></View>}
                </View>
                <Text style={styles.hubName} numberOfLines={1}>
                  {hub.name.split(' (')[0]}
                </Text>
                <Text style={styles.hubDistance}>
                  {hub.distanceFromKtm} • {hub.estDriveTime}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Real-time Distance & Highway Advisory Bar */}
      {selectedDestinationHub && (
        <View style={styles.metricsBar}>
          <View style={styles.metricItem}>
            <Milestone size={13} color={colors.accent} />
            <Text style={styles.metricVal}>{selectedDestinationHub.distanceFromKtm}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Clock size={13} color={colors.accent} />
            <Text style={styles.metricVal}>{selectedDestinationHub.estDriveTime}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={[styles.metricItem, { flex: 1.5 }]}>
            <Mountain size={13} color={colors.success} />
            <Text style={styles.metricNote} numberOfLines={1}>
              {selectedDestinationHub.roadNote}
            </Text>
          </View>
        </View>
      )}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    targetToggle: {
      flexDirection: 'row',
      backgroundColor: colors.elevated,
      borderRadius: radius.pill,
      padding: 2,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 2,
    },
    targetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    targetBtnActive: {
      backgroundColor: colors.accent,
    },
    targetBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.muted,
    },
    targetBtnTextActive: {
      color: colors.onAccent,
    },
    mapCanvas: {
      backgroundColor: colors.navy,
      minHeight: 125,
      padding: spacing.md,
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
    },
    gridOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      opacity: 0.1,
      borderWidth: 1,
      borderColor: '#FFF',
    },
    routeTrack: {
      position: 'absolute',
      left: 27,
      top: 36,
      bottom: 36,
      width: 2,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: colors.highlight,
      zIndex: 1,
    },
    roadDash: {
      height: 5,
      backgroundColor: colors.accent,
      marginVertical: 3,
      width: 2,
    },
    activePromptBanner: {
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
      zIndex: 2,
    },
    activePromptText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#CBD5E1',
    },
    activePromptHighlight: {
      color: colors.highlight,
      fontWeight: '800',
    },
    waypointsContainer: {
      gap: spacing.xs,
      zIndex: 2,
      marginTop: spacing.xs,
    },
    waypointBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    pickupDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(217, 119, 6, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerPickupDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    dropoffDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    waypointTextWrap: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    waypointTag: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.highlight,
      letterSpacing: 0.5,
    },
    waypointName: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFF',
    },
    pinsSection: {
      padding: spacing.sm,
      gap: 4,
    },
    pinsSectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.muted,
      marginLeft: 4,
    },
    pinsScroll: {
      gap: spacing.xs,
      paddingVertical: 4,
    },
    hubCard: {
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      width: 140,
      gap: 2,
    },
    hubCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    hubCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    hubIcon: {
      fontSize: 16,
    },
    roleBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: radius.pill,
    },
    roleBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: '#FFF',
    },
    hubName: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      marginTop: 2,
    },
    hubDistance: {
      fontSize: 10,
      color: colors.muted,
    },
    metricsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.elevated,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    metricItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metricVal: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.text,
    },
    metricNote: {
      fontSize: 10,
      color: colors.muted,
    },
    metricDivider: {
      width: 1,
      height: 12,
      backgroundColor: colors.border,
    },
  });
}
