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
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import {
  Compass,
  MapPin,
  Search,
  ShieldCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TourCard } from '../components/ui/TourCard';
import { TOUR_PACKAGES, type TourPackage } from '../content/tours';
import type { RootStackParamList, RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';
import { hapticFeedback } from '../utils/haptics';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

const TOUR_FILTERS = [
  { id: 'all', label: 'All Tours' },
  { id: 'pilgrimage', label: '🛕 Pilgrimage' },
  { id: 'snow', label: '❄️ Snow & Views' },
  { id: 'family', label: '👨‍👩‍👧 Family Trip' },
];

export function ToursScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTours = useMemo(() => {
    return TOUR_PACKAGES.filter((tour) => {
      const matchesSearch =
        !searchQuery ||
        tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.route.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === 'all') return true;
      if (activeFilter === 'pilgrimage') return tour.title.includes('Muktinath') || tour.title.includes('Manakamana');
      if (activeFilter === 'snow') return tour.title.includes('Kalinchowk');
      return true;
    });
  }, [activeFilter, searchQuery]);

  const handleTourPress = useCallback(
    (tour: TourPackage) => {
      if (tour.detailId) {
        navigation.navigate('TourDetail', { tourId: tour.detailId });
        return;
      }
      if (tour.exploreTarget === 'airport') {
        navigation.navigate('Airport');
        return;
      }
      navigation.navigate('Rates');
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: TourPackage }) => (
      <TourCard tour={item} onPress={() => handleTourPress(item)} />
    ),
    [handleTourPress],
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* Header with Title */}
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.badgeTag}>CURATED EXPEDITIONS</Text>
            <Text style={styles.pageTitle}>Tour Packages</Text>
            <Text style={styles.pageSubtitle}>
              All-inclusive private vehicles, fuel & mountain chauffeurs.
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.muted} style={{ marginRight: spacing.xs }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Muktinath, Manakamana, Kalinchowk..."
            placeholderTextColor={colors.subtle}
            style={styles.searchInput}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {TOUR_FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  hapticFeedback.selection();
                  setActiveFilter(f.id);
                }}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    ),
    [activeFilter, colors.muted, colors.subtle, searchQuery, styles],
  );

  const renderFooter = useCallback(
    () => (
      <View style={styles.safetyBox}>
        <ShieldCheck size={20} color={colors.accent} />
        <View style={styles.safetyContent}>
          <Text style={styles.safetyTitle}>Safety & Comfort Guaranteed</Text>
          <Text style={styles.safetySubtitle}>
            Oxygen cylinders, snow chains, and emergency hill-assist protocols in all 4x4 vehicles.
          </Text>
        </View>
      </View>
    ),
    [colors.accent, styles],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <FlashList
        data={filteredTours}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
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
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    headerCopy: {
      flex: 1,
    },
    badgeTag: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 2,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.text,
    },
    pageSubtitle: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
      lineHeight: 18,
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
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    filterRow: {
      gap: spacing.xs,
      paddingBottom: spacing.md,
    },
    filterChip: {
      backgroundColor: colors.surface,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.navy,
      borderColor: colors.navy,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    filterTextActive: {
      color: colors.onNavy,
    },
    safetyBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
    },
    safetyContent: {
      flex: 1,
    },
    safetyTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    safetySubtitle: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
      lineHeight: 16,
    },
  });
}
