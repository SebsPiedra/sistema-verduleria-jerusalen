import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Task } from '../types/todo';

export default function TaskItem({ task, onToggle, onEdit, onDelete }: { task: Task; onToggle: (id: string) => void; onEdit: (task: Task) => void; onDelete: (task: Task) => void }) {
  return <View style={[styles.card, task.completed && styles.completedCard]}>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} accessibilityLabel={task.completed ? `Marcar ${task.title} como pendiente` : `Completar ${task.title}`} onPress={() => onToggle(task.id)} style={[styles.check, task.completed && styles.checked]}>
      <Text style={styles.checkText}>{task.completed ? 'OK' : ''}</Text>
    </Pressable>
    <View style={styles.content}>
      <View style={styles.top}><Text style={[styles.title, task.completed && styles.completedText]}>{task.title}</Text><Text style={styles.category}>{task.category}</Text></View>
      {task.description ? <Text style={[styles.description, task.completed && styles.completedText]}>{task.description}</Text> : null}
      <Text style={styles.date}>{new Date(task.createdAt).toLocaleDateString('es-CR')}</Text>
    </View>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${task.title}`} onPress={() => onEdit(task)} style={styles.edit}><Text style={styles.editText}>Editar</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Eliminar ${task.title}`} onPress={() => onDelete(task)} style={styles.delete}><Text style={styles.deleteText}>Eliminar</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d7e5e4' },
  completedCard: { backgroundColor: '#f2f7f6' },
  check: { width: 30, height: 30, borderRadius: 9, borderWidth: 2, borderColor: '#79a3a0', alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: '#087f73', borderColor: '#087f73' },
  checkText: { color: '#ffffff', fontWeight: '900', fontSize: 18 },
  content: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  title: { flexShrink: 1, color: '#153f41', fontWeight: '800', fontSize: 16 },
  completedText: { textDecorationLine: 'line-through', color: '#7e9293' },
  category: { color: '#087f73', backgroundColor: '#dff2ec', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, fontSize: 11, fontWeight: '700' },
  description: { color: '#5c7476', marginTop: 5, lineHeight: 19 },
  date: { color: '#8a9b9c', fontSize: 11, marginTop: 7 },
  actions: { gap: 7 },
  edit: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: '#e6f1ef' },
  editText: { color: '#17665f', fontWeight: '700', fontSize: 12 },
  delete: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: '#fff0ee' },
  deleteText: { color: '#b3261e', fontWeight: '700', fontSize: 12 },
});
