import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Card } from '../components/ui/Card';
import { FaqList } from '../components/ui/FaqList';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { TextField } from '../components/ui/TextField';
import { RATE_FAQS } from '../content/faqs';
import {
  RATE_CATEGORIES,
  RATE_COLUMNS,
  RENTAL_POLICIES,
  VEHICLE_CAPACITIES,
  filterRateCategories,
  formatNpr,
  rateToVehicleType,
  tripPackageLink,
  type RateColumn,
  type RateItem,
} from '../content/rates';
import { navigateToBook } from '../navigation/booking';
import type { ExploreStackParamList, RootTabParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ExploreStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

function RateRow({
  item,
  onSelectFare,
}: {
  item: RateItem;
  onSelectFare: (column: RateColumn) => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Text style={styles.trip}>{item.trip}</Text>
      {item.km && item.km !== '-' ? <Text style={styles.km}>{item.km} km</Text> : null}
      <View style={styles.grid}>
        {RATE_COLUMNS.map((column) => (
          <Pressable key={column.key} onPress={() => onSelectFare(column.key)} style={styles.cell}>
            <Text style={styles.cellText}>
              {column.label} {formatNpr(item[column.key])}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function RatesScreen() {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>('airport-night');

  const categories = useMemo(() => filterRateCategories(RATE_CATEGORIES, query, 'all'), [query]);

  return (
    <Screen>
      <SectionHeader
        tag="FARE CHART"
        title="Official car rental rates"
        subtitle="Search any destination. Tap a trip to prefill your booking."
      />
      <TextField label="Search destination" value={query} onChangeText={setQuery} placeholder="Pokhara, airport, Nagarkot…" />

      <View style={styles.caps}>
        {VEHICLE_CAPACITIES.map((item) => (
          <View key={item.type} style={styles.cap}>
            <Text style={styles.capType}>{item.type}</Text>
            <Text style={styles.capMeta}>{item.capacity}</Text>
          </View>
        ))}
      </View>

      {categories.map((category) => {
        const open = openId === category.id;
        return (
          <Card key={category.id} style={styles.cat}>
            <Pressable onPress={() => setOpenId(open ? null : category.id)}>
              <Text style={styles.catTitle}>
                {category.number}. {category.title}
              </Text>
              <Text style={styles.catMeta}>{category.items.length} trips</Text>
            </Pressable>
            {open
              ? category.items.map((item) => (
                  <RateRow
                    key={item.trip}
                    item={item}
                    onSelectFare={(column) => {
                      const link = tripPackageLink(item.trip);
                      if (link?.target === 'airport') {
                        navigation.navigate('Airport');
                        return;
                      }
                      if (link?.target === 'manakamana' || link?.target === 'muktinath' || link?.target === 'kalinchowk') {
                        navigation.navigate('Tours', { screen: 'TourDetail', params: { tourId: link.target } });
                        return;
                      }
                      const fare = formatNpr(item[column]);
                      const vehicleLabel = RATE_COLUMNS.find((itemColumn) => itemColumn.key === column)?.label;
                      navigateToBook(navigation, {
                        pickupLocation: 'Kathmandu',
                        dropoffLocation: item.trip,
                        vehicleTypeId: rateToVehicleType(column),
                        additionalDetails: `Rate chart: ${item.trip} · ${vehicleLabel} · ${fare}`,
                      });
                    }}
                  />
                ))
              : null}
          </Card>
        );
      })}

      <SectionHeader tag="POLICIES" title="What the fare includes" />
      {RENTAL_POLICIES.map((policy) => (
        <Card key={policy.title} style={styles.policy}>
          <Text style={styles.policyTitle}>{policy.title}</Text>
          <Text style={styles.policyDesc}>{policy.desc}</Text>
        </Card>
      ))}

      <SectionHeader tag="FAQ" title="Rate questions" />
      <FaqList items={RATE_FAQS} />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  caps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cap: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    width: '48%',
  },
  capType: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 12,
  },
  capMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  cat: {
    marginBottom: spacing.md,
  },
  catTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 15,
  },
  catMeta: {
    color: colors.subtle,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  trip: {
    color: colors.text,
    fontWeight: '700',
  },
  km: {
    color: colors.subtle,
    marginTop: 2,
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cell: {
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  cellText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  policy: {
    marginBottom: spacing.md,
  },
  policyTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  policyDesc: {
    color: colors.muted,
    marginTop: 4,
    lineHeight: 20,
  },
  });
}
