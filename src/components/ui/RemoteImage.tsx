import { useState } from 'react';
import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';

import type { ThemeColors } from '../../theme/colors';
import { useThemedStyles } from '../../theme/useThemedStyles';
import { spacing } from '../../theme/spacing';

export function RemoteImage({
  uri,
  fallback,
  style,
}: {
  uri: string;
  fallback: string;
  style?: StyleProp<ImageStyle>;
}) {
  const styles = useThemedStyles(createStyles);
  const [failed, setFailed] = useState(false);

  if (failed || !uri) {
    return (
      <View style={[style, styles.fallback]}>
        <Text style={styles.fallbackText} numberOfLines={2}>
          {fallback}
        </Text>
      </View>
    );
  }

  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} />;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fallback: {
      backgroundColor: colors.navySoft,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
    },
    fallbackText: {
      color: colors.onNavy,
      fontWeight: '800',
      textAlign: 'center',
    },
  });
}
