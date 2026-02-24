export interface Habit {
  id?: number;
  user_id: string;
  name: string;
  habit_type: string;
  last_slip: string;
  created_at: string;
  max_streak: number;
  cooldown_days: number;
  last_done: string | null;
  charges_used: number;
}
