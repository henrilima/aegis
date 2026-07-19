export type ReadingStatus = "Reading" | "Completed" | "WantToRead" | "Dropped";

export interface ReadingBook {
  id?: number;
  userId: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: ReadingStatus;
  category: string;
  thumbnail?: string;
  stars: number;
  review?: string;
  createdAt?: string;
  isFavorite?: boolean;
}

export interface ReadingSession {
  id?: number;
  userId: string;
  bookId?: number;
  date: string;
  pagesRead: number;
  durationMinutes: number;
  note?: string;
  focus: number;
  createdAt?: string;
}

export interface ReadingGoal {
  id?: number;
  userId: string;
  goalType: string;
  targetValue: number;
}

export type TabId =
  | "overview"
  | "library"
  | "history"
  | "notes"
  | "goals"
  | "reports"
  | "guia";

export interface ReadingStats {
  totalPages: number;
  totalMinutes: number;
  booksCompleted: number;
  booksReading: number;
  sessionsCount: number;
}

export interface ReadingNote {
  id?: number;
  userId: string;
  bookId: number;
  pageNumber?: number;
  chapter?: string;
  content: string;
  isQuote: boolean;
  createdAt?: string;
}
