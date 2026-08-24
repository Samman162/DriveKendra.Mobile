import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import {
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  Plane,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FaqList } from '../components/ui/FaqList';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { AIRPORT_FAQS } from '../content/faqs';
import {
  AIRPORT_ROUTES,
  AIRPORT_VEHICLES,
  airportFare,
  type AirportTransferType,
  type AirportVehicle,
} from '../content/airport';
import { formatNprAmount, navigateToBook } from '../navigation/booking';
import type { RootStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { hapticFeedback } from '../utils/haptics';

export function AirportScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const [type, setType] = useState<AirportTransferType>('pickup');
  const [routeId, setRouteId] = useState('thamel');
  const [vehicle, setVehicle] = useState<AirportVehicle>('sedan');

  const route = AIRPORT_ROUTES.find((item) => item.id === routeId) ?? AIRPORT_ROUTES[0];
  const fare = useMemo(() => airportFare(route, vehicle), [route, vehicle]);
  const selectedVehicle = AIRPORT_VEHICLES.find((item) => item.id === vehicle) ?? AIRPORT_VEHICLES[0];

  const pickup = type === 'pickup' ? 'Tribhuvan International Airport (TIA)' : route.name;
  const dropoff = type === 'pickup' ? route.name : 'Tribhuvan International Airport (TIA)';

  return (
    <Screen>
      <SectionHeader
        tag="24/7 TIA TRANSFERS"
        title="Airport Taxi & Chauffeur"
        subtitle="Fixed upfront rates with nameboard greeting & live flight tracking."
      />

      {/* Pickup vs Drop Segmented Toggle */}
      <SegmentedControl<AirportTransferType>
        label="Transfer Direction"
        value={type}
        options={[
          { label: '✈️ Airport Pickup (TIA ➔ City)', value: 'pickup' },
          { label: '🏨 Airport Drop (City ➔ TIA)', value: 'drop' },
        ]}
        onChange={(val) => {
          hapticFeedback.selection();
          setType(val);
        }}
      />

      {/* Destination Selector */}
      <Card style={styles.sectionCard}>
        <Text style={styles.cardHeading}>Select Area in Kathmandu Valley</Text>
        <View style={styles.chipsWrap}>
          {AIRPORT_ROUTES.map((item) => {
            const isSelected = item.id === routeId;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  hapticFeedback.selection();
                  setRouteId(item.id);
                }}
                style={[styles.routeChip, isSelected && styles.routeChipActive]}
              >
                <MapPin size={12} color={isSelected ? colors.onNavy : colors.accent} />
                <Text style={[styles.routeChipText, isSelected && styles.routeChipTextActive]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Vehicle Type Selector */}
      <Card style={styles.sectionCard}>
        <Text style={styles.cardHeading}>Select Vehicle Type</Text>
        <View style={styles.vehicleGrid}>
          {AIRPORT_VEHICLES.map((v) => {
            const isSelected = v.id === vehicle;
            return (
              <Pressable
                key={v.id}
                onPress={() => {
                  hapticFeedback.selection();
                  setVehicle(v.id);
                }}
                style={[styles.vehicleCard, isSelected && styles.vehicleCardActive]}
              >
                <Car size={20} color={isSelected ? colors.accent : colors.muted} />
                <Text style={[styles.vehicleName, isSelected && styles.vehicleNameActive]}>
                  {v.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Live Quote & Booking Trigger Card */}
      <Card style={styles.quoteCard}>
        <View style={styles.quoteHeader}>
          <View>
            <Text style={styles.quoteDirection}>
              {type === 'pickup' ? 'Airport Pickup ➔ ' + route.name : route.name + ' ➔ Airport Drop'}
            </Text>
            <Text style={styles.quoteVehicle}>{selectedVehicle.label}</Text>
          </View>
          <Text style={styles.quoteFare}>{formatNprAmount(fare)}</Text>
        </View>

        <View style={styles.quotePerks}>
          <View style={styles.perk}>
            <CheckCircle2 size={14} color={colors.success} />
            <Text style={styles.perkText}>60 Mins free waiting time after flight touchdown</Text>
          </View>
          <View style={styles.perk}>
            <CheckCircle2 size={14} color={colors.success} />
            <Text style={styles.perkText}>Nameboard meet & greet outside arrival terminal</Text>
          </View>
        </View>

        <Button
          label="Book Airport Transfer"
          onPress={() => {
            hapticFeedback.light();
            navigateToBook(navigation, {
              pickupLocation: pickup,
              dropoffLocation: dropoff,
              vehicleTypeId: selectedVehicle.vehicleTypeId,
              additionalDetails: `Airport ${type === 'pickup' ? 'Pickup' : 'Drop'} - ${
                selectedVehicle.label
              } (Estimated: ${formatNprAmount(fare)})`,
            });
          }}
          variant="primary"
        />
      </Card>

      {/* Airport Transfer FAQ */}
      <View style={{ marginTop: spacing.md, paddingBottom: 40 }}>
        <SectionHeader tag="FAQ" title="Airport Guidelines" subtitle="Terminal greeting & delayed flight details" />
        <FaqList items={AIRPORT_FAQS} />
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    sectionCard: {
      marginBottom: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeading: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    routeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    routeChipActive: {
      backgroundColor: colors.navy,
      borderColor: colors.navy,
    },
    routeChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    routeChipTextActive: {
      color: colors.onNavy,
    },
    vehicleGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    vehicleCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    vehicleCardActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    vehicleName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      marginTop: 4,
      textAlign: 'center',
    },
    vehicleNameActive: {
      color: colors.accent,
    },
    vehicleCapacity: {
      fontSize: 10,
      color: colors.muted,
      marginTop: 2,
    },
    quoteCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.accent,
      padding: spacing.lg,
      marginBottom: spacing.md,
      gap: spacing.md,
    },
    quoteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    quoteDirection: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    quoteVehicle: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    quoteFare: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.accent,
    },
    quotePerks: {
      gap: 6,
    },
    perk: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    perkText: {
      fontSize: 12,
      color: colors.muted,
      fontWeight: '600',
    },
  });
}
