import { StyleSheet, TextInput, View } from 'react-native';

export function HoneypotField() {
  return (
    <View style={styles.hidden} accessibilityElementsHidden>
      <TextInput
        value=""
        editable={false}
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    left: -9999,
    height: 0,
    width: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
});
