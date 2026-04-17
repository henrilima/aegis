export type ReadingStatus = "Reading" | "Completed" | "WantToRead" | "Dropped";

export interface ReadingBook {
  id?: number;
  user_id: string;
  title: string;
  author: string;
  total_pages: number;
  current_page: number;
  status: ReadingStatus;
  category: string;
  thumbnail?: string;
  created_at?: string;
}

export interface ReadingSession {
  id?: number;
  user_id: string;
  book_id?: number;
  date: string;
  pages_read: number;
  duration_minutes: number;
  note?: string;
  created_at?: string;
}

export interface ReadingGoal {
  id?: number;
  user_id: string;
  goal_type: string;
  target_value: number;
}

export type TabId = "overview" | "library" | "history" | "goals" | "reports";

export interface ReadingStats {
  totalPages: number;
  totalMinutes: number;
  booksCompleted: number;
  booksReading: number;
  sessionsCount: number;
}
