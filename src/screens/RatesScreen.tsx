import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  Compass,
  Filter,
  Info,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RateRowItem, type FlatRateItem } from '../components/rates/RateRowItem';
import { RegionFilterChip } from '../components/rates/RegionFilterChip';
import { Card } from '../components/ui/Card';
import { FaqList } from '../components/ui/FaqList';
import { SectionHeader } from '../components/ui/SectionHeader';
import { RATE_FAQS } from '../content/faqs';
import {
  RATE_CATEGORIES,
  RENTAL_POLICIES,
  formatNpr,
  type RateCategory,
} from '../content/rates';
import { navigateToBook } from '../navigation/booking';
import type { ExploreStackParamList, RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { hapticFeedback } from '../utils/haptics';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

// 1. Flatten all categories into high-performance flat items
function flattenAllRateCategories(categories: RateCategory[]): FlatRateItem[] {
  const flattened: FlatRateItem[] = [];
  categories.forEach((cat) => {
    cat.items.forEach((item, index) => {
      flattened.push({
        ...item,
        id: `${cat.id}-${index}-${item.trip}`,
        categoryId: cat.id,
        categoryTitle: cat.title,
        categoryNumber: cat.number,
      });
    });
  });
  return flattened;
}

const ALL_FLATTENED_ROUTES = flattenAllRateCategories(RATE_CATEGORIES);

// 2. Region / Province filter presets
const REGION_PRESETS = [
  { id: 'all', label: 'All Nepal' },
  { id: 'ktm', label: 'Kathmandu Valley', keywords: ['kathmandu', 'pashupati', 'patan', 'bhaktapur', 'nagarkot', 'dhulikhel', 'airport'] },
  { id: 'gandaki', label: 'Pokhara & Gandaki', keywords: ['pokhara', 'gandaki', 'gorkha', 'manakamana', 'bandipur', 'baglung', 'kusma'] },
  { id: 'himalayan', label: 'Himalayan 4WD', keywords: ['muktinath', 'jomsom', 'kalinchowk', 'langtang', 'manang', 'mustang', 'rasuwa', 'tatopani'] },
  { id: 'chitwan_lumbini', label: 'Chitwan & Lumbini', keywords: ['chitwan', 'sauraha', 'lumbini', 'bhairahawa', 'butwal', 'hetauda'] },
  { id: 'eastern', label: 'Eastern (Koshi/Madhesh)', keywords: ['biratnagar', 'dharan', 'janakpur', 'jhapa', 'kakarbhitta', 'damak', 'ilam'] },
  { id: 'western', label: 'Western & Karnali', keywords: ['nepalgunj', 'surkhet', 'dhangadhi', 'mahendranagar', 'kohalpur'] },
];

export function RatesScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const [query, setQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Compute filtered route catalog with memoization
  const filteredRoutes = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = ALL_FLATTENED_ROUTES;

    // Apply Region filter
    if (selectedRegion !== 'all') {
      const preset = REGION_PRESETS.find((p) => p.id === selectedRegion);
      if (preset?.keywords) {
        list = list.filter((route) => {
          const tripLower = route.trip.toLowerCase();
          const catLower = route.categoryTitle.toLowerCase();
          return preset.keywords.some((kw) => tripLower.includes(kw) || catLower.includes(kw));
        });
      }
    }

    // Apply Search Query
    if (q) {
      list = list.filter(
        (route) =>
          route.trip.toLowerCase().includes(q) ||
          route.categoryTitle.toLowerCase().includes(q) ||
          (route.km && String(route.km).includes(q)),
      );
    }

    return list;
  }, [query, selectedRegion]);

  // Compute category counts for region filter chips
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALL_FLATTENED_ROUTES.length };
    REGION_PRESETS.slice(1).forEach((preset) => {
      if (preset.keywords) {
        counts[preset.id] = ALL_FLATTENED_ROUTES.filter((route) => {
          const tripLower = route.trip.toLowerCase();
          const catLower = route.categoryTitle.toLowerCase();
          return preset.keywords.some((kw) => tripLower.includes(kw) || catLower.includes(kw));
        }).length;
      }
    });
    return counts;
  }, []);

  // One-tap Direct Booking Navigation Handler
  const handleSelectVehicleFare = useCallback(
    (
      item: FlatRateItem,
      vehicleTypeId: 1 | 2 | 3 | 4,
      vehicleLabel: string,
      fare: string,
    ) => {
      hapticFeedback.light();
      navigateToBook(navigation, {
        pickupLocation: 'Kathmandu',
        dropoffLocation: item.trip,
        vehicleTypeId,
        tripType: 'One Way',
        additionalDetails: `Official Government Catalog Rate: ${item.trip} (${vehicleLabel}) - ${fare}`,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: FlatRateItem }) => (
      <RateRowItem
        item={item}
        onSelectVehicleFare={handleSelectVehicleFare}
      />
    ),
    [handleSelectVehicleFare],
  );

  const renderHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <SectionHeader
          tag="OFFICIAL TRANSPORT FARE CATALOG"
          title="Inter-District Rates"
          subtitle="Standard government & tourism association vehicle charter rates with driver and fuel included."
        />

        {/* Real-Time Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.accent} style={{ marginRight: spacing.xs }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search Pokhara, Muktinath, Chitwan, Dharan..."
            placeholderTextColor={colors.subtle}
            style={styles.searchInput}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => {
                hapticFeedback.selection();
                setQuery('');
              }}
              style={styles.clearBtn}
            >
              <X size={16} color={colors.subtle} />
            </Pressable>
          )}
        </View>

        {/* Region & Province Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
          style={styles.filterScrollView}
        >
          {REGION_PRESETS.map((preset) => (
            <RegionFilterChip
              key={preset.id}
              id={preset.id}
              label={preset.label}
              count={regionCounts[preset.id]}
              selected={selectedRegion === preset.id}
              onSelect={setSelectedRegion}
            />
          ))}
        </ScrollView>

        {/* Results Counter Bar */}
        <View style={styles.counterRow}>
          <Text style={styles.counterText}>
            Showing <Text style={styles.counterHighlight}>{filteredRoutes.length}</Text> verified route rates
          </Text>
          <Text style={styles.allInclusiveBadge}>✓ Fuel & Driver Included</Text>
        </View>
      </View>
    ),
    [
      colors.accent,
      colors.subtle,
      filteredRoutes.length,
      query,
      regionCounts,
      selectedRegion,
      styles,
    ],
  );

  const renderFooter = useMemo(
    () => (
      <View style={styles.footerContainer}>
        {/* Rental Policies & Transparency Card */}
        <Card style={styles.policyCard}>
          <View style={styles.policyHeader}>
            <Info size={18} color={colors.accent} />
            <Text style={styles.policyTitle}>Rental Policies & Terms</Text>
          </View>
          {RENTAL_POLICIES.map((p, idx) => (
            <View key={idx} style={styles.policyItemRow}>
              <Text style={styles.policyBullet}>•</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.policyItemTitle}>{p.title}</Text>
                <Text style={styles.policyItemDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Rate FAQ Accordion */}
        <View style={styles.faqSection}>
          <SectionHeader
            tag="RATE FAQ"
            title="Pricing & Inclusions"
            subtitle="Details on highway tolls, hill multipliers & night overtime."
          />
          <FaqList items={RATE_FAQS} />
        </View>
      </View>
    ),
    [colors.accent, styles],
  );

  const renderEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Compass size={40} color={colors.subtle} style={{ marginBottom: spacing.sm }} />
        <Text style={styles.emptyTitle}>No Matching Routes Found</Text>
        <Text style={styles.emptySubtitle}>
          We could not find transport rates matching &quot;{query}&quot;. Try searching another city, or book a custom route directly.
        </Text>
        <Pressable
          style={styles.emptyResetBtn}
          onPress={() => {
            hapticFeedback.selection();
            setQuery('');
            setSelectedRegion('all');
          }}
        >
          <Text style={styles.emptyResetText}>Reset All Filters</Text>
        </Pressable>
      </View>
    ),
    [colors.subtle, query, styles],
  );

  const getItemType = useCallback((item: FlatRateItem) => {
    return item.categoryId || 'standard_rate';
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xs }]}>
      <FlashList
        data={filteredRoutes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        getItemType={getItemType}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
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
      marginBottom: spacing.sm,
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
      marginBottom: spacing.sm,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    clearBtn: {
      padding: 6,
    },
    filterScrollView: {
      marginBottom: spacing.sm,
    },
    filterScrollContent: {
      paddingVertical: 2,
    },
    counterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 2,
      marginBottom: spacing.xs,
    },
    counterText: {
      fontSize: 12,
      color: colors.subtle,
      fontWeight: '600',
    },
    counterHighlight: {
      fontWeight: '800',
      color: colors.text,
    },
    allInclusiveBadge: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.success,
      backgroundColor: colors.successSoft,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    footerContainer: {
      marginTop: spacing.md,
    },
    policyCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    policyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingBottom: spacing.xs,
      marginBottom: 2,
    },
    policyTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },
    policyItemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    policyBullet: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: '900',
    },
    policyItemTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.text,
    },
    policyItemDesc: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 1,
    },
    faqSection: {
      marginTop: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 12,
      color: colors.subtle,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    emptyResetBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.lg,
      paddingVertical: 9,
      borderRadius: radius.md,
    },
    emptyResetText: {
      color: colors.onAccent,
      fontSize: 12,
      fontWeight: '800',
    },
  });
}
