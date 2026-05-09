export interface PomodoroState {
  isRunning: boolean;
  startTime: string | null;
  workMinutes: number;
  breakMinutes: number;
  cycleType: string;
  cyclesCompleted: number;
  accumulatedSeconds: number;
}

export interface PomodoroHistory {
  id?: number;
  userId: string;
  workMinutes: number;
  breakMinutes: number;
  cyclesDone: number;
  startTime: string;
  endTime: string;
}
