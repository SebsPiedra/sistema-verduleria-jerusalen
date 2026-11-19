import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type IconTone = 'teal' | 'green' | 'amber' | 'red' | 'blue' | 'neutral';

const tones: Record<IconTone, { background: string; foreground: string }> = {
  teal: { background: '#e2f4ee', foreground: '#087f73' },
  green: { background: '#eaf6e5', foreground: '#2e8b3c' },
  amber: { background: '#fff0dc', foreground: '#c15a08' },
  red: { background: '#ffe7e9', foreground: '#e32937' },
  blue: { background: '#e5f0ff', foreground: '#1768c5' },
  neutral: { background: '#edf2f1', foreground: '#4d6662' },
};

type MetricIconProps = {
  name: IconName;
  tone?: IconTone;
  compact?: boolean;
};

export default function MetricIcon({ name, tone = 'teal', compact = false }: MetricIconProps) {
  const palette = tones[tone];

  return (
    <View
      accessible={false}
      style={[
        styles.circle,
        compact && styles.circleCompact,
        { backgroundColor: palette.background },
      ]}
    >
      <MaterialCommunityIcons
        name={name}
        size={compact ? 22 : 28}
        color={palette.foreground}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  circleCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
});
