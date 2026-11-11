import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import AdminLayout from '../components/AdminLayout';
import TaskFilter from '../components/TaskFilter';
import TaskInput from '../components/TaskInput';
import TaskItem from '../components/TaskItem';
import { useTodoList } from '../hooks/useTodoList';
import type { Task, TaskDraft } from '../types/todo';

export default function TareasScreen() {
  const todo = useTodoList();
  const [editing, setEditing] = useState<Task | null>(null);
  const phone = useWindowDimensions().width < 800;

  const save = async (draft: TaskDraft) => {
    if (editing) await todo.updateTask(editing.id, draft);
    else await todo.addTask(draft);
    setEditing(null);
  };

  const remove = (task: Task) => {
    const execute = () => void todo.deleteTask(task.id);
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Eliminar la tarea "${task.title}"?`)) execute();
      return;
    }
    Alert.alert('Eliminar tarea', `¿Desea eliminar "${task.title}"?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: execute }]);
  };

  return <AdminLayout titulo="Tareas" scroll={false}>
    <View style={styles.hero}>
      <View><Text style={styles.eyebrow}>ORGANIZACIÓN LOCAL</Text><Text style={styles.title}>Tareas de la verdulería</Text><Text style={styles.subtitle}>Planifique actividades aunque el dispositivo no tenga conexión.</Text></View>
      <View style={styles.stats}><View style={styles.stat}><Text style={styles.statNumber}>{todo.stats.total}</Text><Text style={styles.statLabel}>Todas</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{todo.stats.pending}</Text><Text style={styles.statLabel}>Pendientes</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{todo.stats.completed}</Text><Text style={styles.statLabel}>Completadas</Text></View></View>
    </View>
    {todo.storageError ? <Text accessibilityRole="alert" style={styles.error}>{todo.storageError}</Text> : null}
    <View style={[styles.layout, phone && styles.layoutPhone]}>
      <View style={styles.form}><TaskInput editing={editing} onSave={save} onCancel={() => setEditing(null)} /></View>
      <View style={styles.listArea}>
        <TaskFilter value={todo.filter} onChange={todo.setFilter} />
        {todo.loading ? <ActivityIndicator style={styles.loader} color="#087f73" /> : (
          <FlatList style={styles.list} data={todo.tasks} keyExtractor={item => item.id} renderItem={({ item }) => <TaskItem task={item} onToggle={id => void todo.toggleTask(id)} onEdit={setEditing} onDelete={remove} />} ItemSeparatorComponent={() => <View style={styles.separator} />} ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyIcon}>OK</Text><Text style={styles.emptyTitle}>No hay tareas en este filtro</Text><Text style={styles.emptyText}>Agregue una actividad para comenzar.</Text></View>} contentContainerStyle={todo.tasks.length === 0 ? styles.emptyList : styles.listContent} />
        )}
      </View>
    </View>
  </AdminLayout>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginBottom: 22 },
  eyebrow: { color: '#087f73', fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  title: { color: '#103f3c', fontSize: 34, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#607a7c', marginTop: 6 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { minWidth: 82, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#d7e5e4', borderRadius: 15, padding: 12, alignItems: 'center' },
  statNumber: { color: '#087f73', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#6b8183', fontSize: 10, marginTop: 2 },
  error: { color: '#a12a22', backgroundColor: '#fff0ee', padding: 12, borderRadius: 10, marginBottom: 14 },
  layout: { flex: 1, minHeight: 0, flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  layoutPhone: { flexDirection: 'column' },
  form: { width: '100%', maxWidth: 420 },
  listArea: { flex: 1, width: '100%', gap: 14 },
  list: { flex: 1, minHeight: 0 },
  listContent: { paddingBottom: 20 },
  loader: { marginTop: 50 },
  separator: { height: 10 },
  emptyList: { flexGrow: 1 },
  empty: { minHeight: 240, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: '#b9cfcd', alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { fontSize: 34, color: '#78a5a1' },
  emptyTitle: { color: '#315b5d', fontSize: 17, fontWeight: '800', marginTop: 8 },
  emptyText: { color: '#789092', marginTop: 4 },
});
