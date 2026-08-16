import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Car, Heart, MapPinned, Plane } from 'lucide-react-native';

import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import type { ExploreStackParamList } from '../navigation/types';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeProvider';
import { useThemedStyles } from '../theme/useThemedStyles';
import { radius, spacing } from '../theme/spacing';

const TILES = [
  {
    key: 'Fleet' as const,
    title: 'Fleet',
    copy: 'Scorpios, sedans, HiAce vans, and tourist buses with local drivers.',
    icon: Car,
  },
  {
    key: 'Rates' as const,
    title: 'Official rates',
    copy: 'Search the full Nepal fare chart for city, airport, and outstation trips.',
    icon: MapPinned,
  },
  {
    key: 'Airport' as const,
    title: 'Airport transfer',
    copy: '24/7 TIA pickup and drop with nameboard greeting and fixed fares.',
    icon: Plane,
  },
  {
    key: 'Wedding' as const,
    title: 'Wedding cars',
    copy: 'Decorated luxury cars and SUVs with suited chauffeurs.',
    icon: Heart,
  },
];

export function ExploreScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <SectionHeader
            tag="SERVICES"
            title="Explore Drive Kendra"
            subtitle="Fleet, official rates, airport transfers, and wedding cars — the same pages as the website."
          />
        </View>
        <ThemeToggle variant="onSurface" />
      </View>
      {TILES.map((tile) => {
        const Icon = tile.icon;
        return (
          <Pressable key={tile.key} onPress={() => navigation.navigate(tile.key)}>
            <Card style={styles.tile}>
              <View style={styles.iconWrap}>
                <Icon color={colors.accent} size={22} />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{tile.title}</Text>
                <Text style={styles.copy}>{tile.copy}</Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    headerCopy: {
      flex: 1,
    },
    tile: {
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'center',
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
    },
    copy: {
      color: colors.muted,
      marginTop: 4,
      lineHeight: 20,
    },
  });
}
