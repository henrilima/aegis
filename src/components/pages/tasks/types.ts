export interface Task {
  id?: number;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  created_at: string;
}
