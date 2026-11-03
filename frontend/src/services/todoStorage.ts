import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Task } from '../types/todo';

const STORAGE_KEY = '@verduleria_tareas_v1';

const isTask = (value: unknown): value is Task => {
  if (typeof value !== 'object' || value === null) return false;
  const task = value as Record<string, unknown>;
  return typeof task.id === 'string' && typeof task.title === 'string' && typeof task.completed === 'boolean';
};

export const todoStorage = {
  async saveTasks(tasks: Task[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  },

  async getTasks(): Promise<Task[]> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isTask) : [];
  },

  async clearTasks(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
