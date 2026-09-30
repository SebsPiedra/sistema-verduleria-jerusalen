import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  value: number;
  max: number;
  unit?: string;
  disabled?: boolean;
  compact?: boolean;
  onChange: (value: number) => void;
};

const limitarCantidad = (value: number, max: number, unit: string) => {
  const esUnidadEntera = /unidad/i.test(unit);
  const normalizada = esUnidadEntera ? Math.round(value) : Math.round(value * 100) / 100;
  return Math.min(Math.max(normalizada || 1, 1), Math.max(max, 1));
};

export default function QuantitySelector({
  value,
  max,
  unit = 'unidad',
  disabled = false,
  compact = false,
  onChange,
}: Props) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const confirmar = () => {
    const parsed = Number(draft.replace(',', '.'));
    const next = limitarCantidad(Number.isFinite(parsed) ? parsed : value, max, unit);
    setDraft(String(next));
    onChange(next);
  };

  const cambiar = (next: number) => {
    const limitada = limitarCantidad(next, max, unit);
    setDraft(String(limitada));
    onChange(limitada);
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Disminuir cantidad"
        style={[styles.button, disabled && styles.disabled]}
        onPress={() => cambiar(value - 1)}
        disabled={disabled || value <= 1}
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <TextInput
        accessibilityLabel={`Cantidad en ${unit}`}
        style={[styles.input, compact && styles.inputCompact]}
        value={draft}
        onChangeText={(text) => setDraft(text.replace(/[^0-9.,]/g, ''))}
        onBlur={confirmar}
        onSubmitEditing={confirmar}
        keyboardType="decimal-pad"
        inputMode="decimal"
        selectTextOnFocus
        editable={!disabled}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Aumentar cantidad"
        style={[styles.button, disabled && styles.disabled]}
        onPress={() => cambiar(value + 1)}
        disabled={disabled || value >= max}
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9dc8c2',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  containerCompact: { flex: 1 },
  button: {
    width: 34,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6f3f1',
  },
  buttonText: { color: '#006c63', fontSize: 20, fontWeight: '800' },
  input: {
    width: 54,
    height: 38,
    paddingHorizontal: 4,
    textAlign: 'center',
    color: '#153d3a',
    fontWeight: '700',
  },
  inputCompact: { flex: 1, minWidth: 42 },
  disabled: { opacity: 0.45 },
});
