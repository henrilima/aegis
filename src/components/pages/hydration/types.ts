export interface HydrationReminder {
  id?: number;
  user_id: string;
  reminder_type: string;
  value: string;
  start_time: string | null;
  enabled: boolean;
}
