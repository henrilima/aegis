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
  // NOVOS CAMPOS
  charges_amount: number;
  charges_interval_days: number;
  accumulates: boolean;
  last_charge_refill: string;
  current_charges: number;
}
