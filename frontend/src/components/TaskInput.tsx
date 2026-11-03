import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Task, TaskCategory, TaskDraft } from '../types/todo';

const CATEGORIES: TaskCategory[] = ['Inventario', 'Pedidos', 'General'];
const EMPTY: TaskDraft = { title: '', description: '', category: 'General' };

export default function TaskInput({ editing, onSave, onCancel }: { editing: Task | null; onSave: (draft: TaskDraft) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState<TaskDraft>(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(editing ? { title: editing.title, description: editing.description, category: editing.category } : EMPTY);
    setError('');
  }, [editing]);

  const submit = async () => {
    const title = draft.title.trim();
    if (title.length < 3) return setError('Escriba un título de al menos 3 caracteres.');
    await onSave({ ...draft, title, description: draft.description.trim() });
    setDraft(EMPTY);
    setError('');
  };

  return <View style={styles.card}>
    <Text style={styles.heading}>{editing ? 'Editar tarea' : 'Nueva tarea operativa'}</Text>
    <TextInput accessibilityLabel="Título de la tarea" value={draft.title} onChangeText={title => setDraft(current => ({ ...current, title }))} placeholder="Ejemplo: revisar productos con bajo stock" placeholderTextColor="#789092" style={styles.input} maxLength={80} />
    <TextInput accessibilityLabel="Descripción de la tarea" value={draft.description} onChangeText={description => setDraft(current => ({ ...current, description }))} placeholder="Agregue una indicación breve (opcional)" placeholderTextColor="#789092" style={[styles.input, styles.textarea]} multiline maxLength={240} />
    <Text style={styles.label}>Categoría</Text>
    <View style={styles.categories}>{CATEGORIES.map(category => (
      <Pressable key={category} onPress={() => setDraft(current => ({ ...current, category }))} style={[styles.category, draft.category === category && styles.categoryActive]}>
        <Text style={[styles.categoryText, draft.category === category && styles.categoryActiveText]}>{category}</Text>
      </Pressable>
    ))}</View>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <View style={styles.actions}>
      {editing ? <Pressable accessibilityRole="button" onPress={onCancel} style={styles.secondary}><Text style={styles.secondaryText}>Cancelar</Text></Pressable> : null}
      <Pressable accessibilityRole="button" onPress={() => void submit()} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>{editing ? 'Guardar cambios' : 'Agregar tarea'}</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#d7e5e4', gap: 12 },
  heading: { fontSize: 21, fontWeight: '800', color: '#123f40' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#b9cfcd', borderRadius: 12, paddingHorizontal: 14, color: '#183f41', backgroundColor: '#fbfdfd' },
  textarea: { minHeight: 82, paddingTop: 13, textAlignVertical: 'top' },
  label: { color: '#49696b', fontSize: 12, fontWeight: '700' },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  category: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#edf4f3' },
  categoryActive: { backgroundColor: '#c8f1dc' },
  categoryText: { color: '#527174', fontWeight: '600' },
  categoryActiveText: { color: '#075e58' },
  error: { color: '#b3261e', fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  primary: { minHeight: 46, borderRadius: 12, backgroundColor: '#087f73', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#ffffff', fontWeight: '800' },
  secondary: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#9bb3b4', paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#315b5d', fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
