import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { VehicleCard } from '../components/ui/VehicleCard';
import { FLEET_CATEGORIES, vehiclesByCategory, type FleetCategory } from '../content/vehicles';
import { navigateToBook } from '../navigation/booking';
import type { RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';

export function FleetScreen() {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const [category, setCategory] = useState<FleetCategory>('all');
  const vehicles = vehiclesByCategory(category);

  return (
    <Screen>
      <SectionHeader tag="OUR FLEET" title="Select a vehicle" subtitle="Well-maintained cars with experienced hill drivers." />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {FLEET_CATEGORIES.map((item) => {
          const active = item.value === category;
          return (
            <Pressable key={item.value} onPress={() => setCategory(item.value)} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onBook={() =>
            navigateToBook(navigation, {
              vehicleTypeId: vehicle.vehicleTypeId,
              additionalDetails: `Requested fleet: ${vehicle.name}`,
            })
          }
        />
      ))}
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tabs: {
      gap: spacing.sm,
      paddingBottom: spacing.lg,
    },
    tab: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    tabActive: {
      backgroundColor: colors.navy,
      borderColor: colors.navy,
    },
    tabText: {
      color: colors.muted,
      fontWeight: '700',
      fontSize: 13,
    },
    tabTextActive: {
      color: colors.onNavy,
    },
  });
}
