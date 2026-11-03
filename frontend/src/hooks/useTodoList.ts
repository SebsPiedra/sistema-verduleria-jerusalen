import { useCallback, useEffect, useMemo, useState } from 'react';
import { todoStorage } from '../services/todoStorage';
import type { Task, TaskDraft, TaskFilter } from '../types/todo';

const createId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function useTodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>('Todas');
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    let active = true;
    void todoStorage.getTasks()
      .then(stored => { if (active) setTasks(stored); })
      .catch(() => { if (active) setStorageError('No se pudieron recuperar las tareas guardadas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const persist = useCallback(async (next: Task[]) => {
    setTasks(next);
    try {
      await todoStorage.saveTasks(next);
      setStorageError('');
    } catch {
      setStorageError('No se pudo guardar el cambio en el dispositivo.');
    }
  }, []);

  const addTask = useCallback(async (draft: TaskDraft) => {
    const now = new Date().toISOString();
    const task: Task = { id: createId(), ...draft, completed: false, createdAt: now, updatedAt: now };
    await persist([task, ...tasks]);
  }, [persist, tasks]);

  const updateTask = useCallback(async (id: string, draft: TaskDraft) => {
    await persist(tasks.map(task => task.id === id ? { ...task, ...draft, updatedAt: new Date().toISOString() } : task));
  }, [persist, tasks]);

  const toggleTask = useCallback(async (id: string) => {
    await persist(tasks.map(task => task.id === id ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() } : task));
  }, [persist, tasks]);

  const deleteTask = useCallback(async (id: string) => {
    await persist(tasks.filter(task => task.id !== id));
  }, [persist, tasks]);

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (filter === 'Pendientes') return !task.completed;
    if (filter === 'Completadas') return task.completed;
    return true;
  }), [filter, tasks]);

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(task => !task.completed).length,
    completed: tasks.filter(task => task.completed).length,
  }), [tasks]);

  return { tasks: filteredTasks, filter, setFilter, loading, storageError, stats, addTask, updateTask, toggleTask, deleteTask };
}
