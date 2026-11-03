export type TaskCategory = 'Inventario' | 'Pedidos' | 'Proveedores' | 'General';
export type TaskFilter = 'Todas' | 'Pendientes' | 'Completadas';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDraft {
  title: string;
  description: string;
  category: TaskCategory;
}
