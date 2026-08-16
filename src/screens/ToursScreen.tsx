import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { TourCard } from '../components/ui/TourCard';
import { TOUR_PACKAGES } from '../content/tours';
import type { RootTabParamList, ToursStackParamList } from '../navigation/types';
import { spacing } from '../theme/spacing';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ToursStackParamList>,
  BottomTabNavigationProp<RootTabParamList>
>;

export function ToursScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <SectionHeader
            tag="CURATED EXPERIENCES"
            title="Tour & pilgrimage packages"
            subtitle="All-inclusive rental packages with expert hill drivers."
          />
        </View>
        <ThemeToggle variant="onSurface" />
      </View>
      {TOUR_PACKAGES.map((tour) => (
        <TourCard
          key={tour.id}
          tour={tour}
          onPress={() => {
            if (tour.detailId) {
              navigation.navigate('TourDetail', { tourId: tour.detailId });
              return;
            }
            if (tour.exploreTarget === 'airport') {
              navigation.navigate('Explore', { screen: 'Airport' });
              return;
            }
            navigation.navigate('Explore', { screen: 'Rates' });
          }}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
});
