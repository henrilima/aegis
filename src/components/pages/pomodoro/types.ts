export interface PomodoroState {
  is_running: boolean;
  start_time: string | null;
  work_minutes: number;
  break_minutes: number;
  cycle_type: string;
  cycles_completed: number;
  accumulated_seconds: number;
}

export interface PomodoroHistory {
  id?: number;
  user_id: string;
  work_minutes: number;
  break_minutes: number;
  cycles_done: number;
  start_time: string;
  end_time: string;
}
