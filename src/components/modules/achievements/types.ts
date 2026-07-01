export interface UserProgressState {
  xp: number;
  level: number;
  treeXp: number;
  treeLevel: number;
  unlockedAchievements: { achievementId: string; unlockedAt: string }[];
  completedChallengesToday: string[];
  last3DaysCompletedCount: number;
  lastCompletedDate?: string | null;
}

export interface XPHistoryEntry {
  id: number;
  userId: string;
  amount: number;
  source: string;
  xpType: string;
  timestamp: string;
  referenceTable?: string;
  referenceId?: string;
  isLost?: boolean;
}
