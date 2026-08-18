import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Car, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionHeader } from '../components/ui/SectionHeader';
import { VehicleCard } from '../components/ui/VehicleCard';
import { FLEET_CATEGORIES, FLEET_VEHICLES, type FleetCategory, type FleetVehicle } from '../content/vehicles';
import { navigateToBook } from '../navigation/booking';
import type { RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { hapticFeedback } from '../utils/haptics';

export function FleetScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();

  const [category, setCategory] = useState<FleetCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVehicles = useMemo(() => {
    return FLEET_VEHICLES.filter((vehicle) => {
      const matchesCategory =
        category === 'all' ||
        (category === 'suv' && (vehicle.tag.includes('SUV') || vehicle.tag.includes('4x4') || vehicle.name.includes('Scorpio'))) ||
        (category === 'van' && (vehicle.tag.includes('Van') || vehicle.name.includes('HiAce'))) ||
        (category === 'sedan' && (vehicle.tag.includes('Sedan') || vehicle.tag.includes('Car'))) ||
        (category === 'bus' && vehicle.tag.includes('Bus'));

      const matchesSearch =
        !searchQuery ||
        vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.fuel.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [category, searchQuery]);

  const handleBook = useCallback(
    (vehicle: FleetVehicle) => {
      navigateToBook(navigation, {
        vehicleTypeId: vehicle.vehicleTypeId,
        additionalDetails: `Requested fleet: ${vehicle.name}`,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: FleetVehicle }) => (
      <VehicleCard vehicle={item} onBook={() => handleBook(item)} />
    ),
    [handleBook],
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        <SectionHeader
          tag="PREMIER FLEET"
          title="Vehicles & Chauffeurs"
          subtitle="Well-maintained 4x4 Scorpios, HiAce vans, luxury sedans & tourist coaches."
        />

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.muted} style={{ marginRight: spacing.xs }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Scorpio, EV Van, Coaster, Sedan..."
            placeholderTextColor={colors.subtle}
            style={styles.searchInput}
          />
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {FLEET_CATEGORIES.map((item) => {
            const active = item.value === category;
            return (
              <Pressable
                key={item.value}
                onPress={() => {
                  hapticFeedback.selection();
                  setCategory(item.value);
                }}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    ),
    [category, colors.muted, colors.subtle, searchQuery, styles],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyWrap}>
        <Car size={36} color={colors.subtle} />
        <Text style={styles.emptyTitle}>No vehicles matched your search</Text>
        <Text style={styles.emptySubtitle}>Try changing your filter category or search keywords.</Text>
      </View>
    ),
    [colors.subtle, styles],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <FlashList
        data={filteredVehicles}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xxl,
    },
    headerContainer: {
      marginBottom: spacing.xs,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    tabs: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
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
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.xs,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginTop: spacing.sm,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
    },
  });
}
