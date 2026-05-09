"use client";

import { BookOpen } from "lucide-react";
import type {
  ReadingBook,
  ReadingSession,
} from "@/components/modules/reading/types";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { BaseWidget } from "../BaseWidget";

interface ReadingWidgetProps {
  books: ReadingBook[];
  recentSessions: ReadingSession[];
  weekPages: number;
  goalWeekPages: number | null;
  onLogSession?: (bookId: number, pages: number) => void;
  isEditMode?: boolean;
}

export function ReadingWidget({
  books,
  recentSessions,
  weekPages,
  goalWeekPages,
  isEditMode,
}: ReadingWidgetProps) {
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);
  const readingBooks = books.filter((b) => b.status === "Reading");
  const completedBooks = books.filter((b) => b.status === "Completed").length;

  const weekProgress =
    goalWeekPages && goalWeekPages > 0
      ? Math.min(100, Math.round((weekPages / goalWeekPages) * 100))
      : null;

  return (
    <BaseWidget
      title="Leitura"
      icon={BookOpen}
      color={color}
      route="reading"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-[4cqw] @sm:gap-4">
        {/* Stats principais */}
        <div className="flex items-center gap-[6cqw] @sm:gap-6">
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl @sm:text-3xl font-black text-foreground tabular-nums">
                {weekPages}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase">
                pág.
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
              Esta semana
            </p>
          </div>
          <div className="w-px h-8 bg-muted" />
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl @sm:text-3xl font-black text-foreground tabular-nums">
                {completedBooks}
              </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
              Concluídos
            </p>
          </div>
        </div>

        {/* Barra de meta semanal */}
        {weekProgress !== null && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-muted-foreground">
                <span className={theme.text}>{weekPages}</span> de{" "}
                <span className={theme.text}>{goalWeekPages} pág.</span>
              </span>
              <span className={theme.text}>{weekProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  theme.bgHover.replace("hover:bg", "bg").replace("/20", ""),
                )}
                style={{ width: `${weekProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Livros atuais em leitura (máximo 2) */}
        {readingBooks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {readingBooks.slice(0, 2).map((book) => {
              const progress =
                book.totalPages > 0
                  ? Math.min(
                      100,
                      Math.round((book.currentPage / book.totalPages) * 100),
                    )
                  : 0;
              return (
                <div
                  key={book.id}
                  className="p-[2.5cqw] @sm:p-2.5 rounded-xl bg-muted border border-border/50 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0 mt-1.5",
                        theme.bgHover
                          .replace("hover:bg", "bg")
                          .replace("/20", "/70"),
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[3cqw] @sm:text-xs font-semibold text-foreground truncate">
                        {book.title}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-[2.5cqw] @sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0",
                        theme.text,
                        theme.bg,
                      )}
                    >
                      {progress}%
                    </span>
                  </div>
                  {/* Mini barra de progresso do livro */}
                  <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        progress >= 80
                          ? "bg-emerald-500"
                          : progress >= 40
                            ? theme.text.replace("text-", "bg-")
                            : "bg-neutral-600",
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Sessões recentes caso não haja livro atual */
          <div className="space-y-[1.5cqw] @sm:space-y-1.5">
            {recentSessions.slice(0, 3).map((s, i) => (
              <div
                key={s.id ?? i}
                className="flex items-center gap-[2cqw] @sm:gap-2 p-[2cqw] @sm:p-2 rounded-xl bg-muted border border-border/50"
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    theme.bgHover
                      .replace("hover:bg", "bg")
                      .replace("/20", "/60"),
                  )}
                />
                <span className="text-[3cqw] @sm:text-xs font-medium text-muted-foreground truncate flex-1">
                  {s.date}
                </span>
                <span
                  className={cn(
                    "text-[2.5cqw] @sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap",
                    theme.text,
                    theme.bg,
                  )}
                >
                  {s.pagesRead} pág.
                </span>
              </div>
            ))}
            {recentSessions.length === 0 && (
              <p className="text-xs text-neutral-600 italic">
                Nenhuma sessão registrada
              </p>
            )}
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
