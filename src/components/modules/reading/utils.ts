import type { ReadingBook, ReadingSession, ReadingStats } from "./types";

export function formatMinutes(m: number) {
  const hrs = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  if (hrs === 0) return `${mins}min`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}min`;
}

export function computeReadingStats(
  sessions: ReadingSession[],
  books: ReadingBook[],
): ReadingStats {
  return {
    totalPages: sessions.reduce((acc, s) => acc + s.pagesRead, 0),
    totalMinutes: sessions.reduce((acc, s) => acc + s.durationMinutes, 0),
    booksCompleted: books.filter((b) => b.status === "Completed").length,
    booksReading: books.filter((b) => b.status === "Reading").length,
    sessionsCount: sessions.length,
  };
}

export function calculateProgress(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

export function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
