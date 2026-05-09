export interface Task {
  id?: number;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
  parentId?: number;
  priority?: number;
  category?: string;
  color?: string;
}
