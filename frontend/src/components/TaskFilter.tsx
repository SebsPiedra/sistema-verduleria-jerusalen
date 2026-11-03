import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TaskFilter as Filter } from '../types/todo';

const FILTERS: Filter[] = ['Todas', 'Pendientes', 'Completadas'];

export default function TaskFilter({ value, onChange }: { value: Filter; onChange: (filter: Filter) => void }) {
  return <View style={styles.row}>{FILTERS.map(filter => (
    <Pressable key={filter} accessibilityRole="button" accessibilityState={{ selected: value === filter }} onPress={() => onChange(filter)} style={({ pressed }) => [styles.button, value === filter && styles.active, pressed && styles.pressed]}>
      <Text style={[styles.text, value === filter && styles.activeText]}>{filter}</Text>
    </Pressable>
  ))}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 22, backgroundColor: '#e5efed', borderWidth: 1, borderColor: '#c9dcda' },
  active: { backgroundColor: '#087f73', borderColor: '#087f73' },
  pressed: { opacity: 0.72 },
  text: { color: '#315b5d', fontWeight: '700' },
  activeText: { color: '#ffffff' },
});
