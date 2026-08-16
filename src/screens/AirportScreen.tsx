import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { Card } from '../components/ui/Card';
import { FaqList } from '../components/ui/FaqList';
import { QuoteCard } from '../components/ui/QuoteCard';
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
import type { RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';

export function AirportScreen() {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
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
        tag="TIA TRANSFER"
        title="Airport taxi in Kathmandu"
        subtitle="Cheapest, safest, fastest airport transfer. Nameboard greeting and live flight tracking."
      />

      <SegmentedControl
        label="Transfer type"
        value={type}
        options={[
          { label: 'Airport pickup', value: 'pickup' },
          { label: 'Airport drop', value: 'drop' },
        ]}
        onChange={setType}
      />

      <Text style={styles.label}>Destination</Text>
      <View style={styles.chips}>
        {AIRPORT_ROUTES.map((item) => {
          const active = item.id === routeId;
          return (
            <Pressable key={item.id} onPress={() => setRouteId(item.id)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.meta}>
        <Text style={styles.metaLine}>
          {route.distance} · {route.duration}
        </Text>
      </Card>

      <Text style={styles.label}>Vehicle</Text>
      <View style={styles.chips}>
        {AIRPORT_VEHICLES.map((item) => {
          const active = item.id === vehicle;
          return (
            <Pressable key={item.id} onPress={() => setVehicle(item.id)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <QuoteCard
        label={`${type === 'pickup' ? 'Pickup' : 'Drop'} · ${route.name}`}
        amount={formatNprAmount(fare)}
        note="All-inclusive: fuel, airport fees, parking, tolls, and luggage help."
        onBook={() =>
          navigateToBook(navigation, {
            vehicleTypeId: selectedVehicle.vehicleTypeId,
            pickupLocation: pickup,
            dropoffLocation: dropoff,
            tripType: 'One Way',
            additionalDetails: `Airport ${type} · ${route.name} · ${selectedVehicle.label} · ${formatNprAmount(fare)}`,
          })
        }
      />

      <SectionHeader tag="FAQ" title="Airport questions" />
      <FaqList items={AIRPORT_FAQS} />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    label: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
      marginBottom: spacing.sm,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    chip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.navy,
      borderColor: colors.navy,
    },
    chipText: {
      color: colors.muted,
      fontWeight: '700',
      fontSize: 13,
    },
    chipTextActive: {
      color: colors.onNavy,
    },
    meta: {
      marginBottom: spacing.lg,
    },
    metaLine: {
      color: colors.text,
      fontWeight: '700',
    },
  });
}
