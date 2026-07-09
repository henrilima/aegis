"use client";

import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import { SessionModal } from "@/components/modules/reading/components/SessionModal";
import type {
  ReadingBook,
  ReadingSession,
} from "@/components/modules/reading/types";
import { Button } from "@/components/ui/button";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { BaseWidget } from "../BaseWidget";

interface ReadingWidgetProps {
  books: ReadingBook[];
  recentSessions: ReadingSession[];
  weekPages: number;
  goalWeekPages: number | null;
  onLogSession?: (session: ReadingSession) => void;
  limit?: number;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

export function ReadingWidget({
  books,
  recentSessions,
  weekPages,
  goalWeekPages,
  isEditMode,
  isInteractive,
  onToggleInteractive,
  onLogSession,
  limit,
}: ReadingWidgetProps) {
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const readingBooks = books.filter((b) => b.status === "Reading");
  const completedBooks = books.filter((b) => b.status === "Completed").length;

  const weekProgress =
    goalWeekPages && goalWeekPages > 0
      ? Math.min(100, Math.round((weekPages / goalWeekPages) * 100))
      : null;

  return (
    <>
      <BaseWidget
        title="Leitura"
        icon={BookOpen}
        color={color}
        route="reading"
        isEditMode={isEditMode}
        isInteractive={isInteractive}
        onToggleInteractive={onToggleInteractive}
      >
        <div className="flex flex-col gap-[4cqw] @sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[6cqw] @sm:gap-6">
              <div className="flex-1 text-left">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                    {weekPages}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    pág.
                  </span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                  Semana
                </p>
              </div>
              <div className="w-px h-8 bg-muted" />
              <div className="flex-1 text-left">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                    {completedBooks}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                  Lidos
                </p>
              </div>
            </div>

            {isInteractive && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className={cn(
                  "h-7 px-2.5 text-xs font-bold rounded-lg border-none gap-1 active:scale-95 transition-all text-white",
                  theme.solid,
                  theme.solidHover,
                )}
              >
                <Plus className="w-3 h-3" />
                <span className="hidden @sm:inline">Log</span>
              </Button>
            )}
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
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    theme.solid,
                  )}
                  style={{ width: `${weekProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Livros atuais em leitura */}
          {readingBooks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {readingBooks.slice(0, limit ?? 2).map((book) => {
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
                    className="flex flex-col p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-2"
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            "shrink-0 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20",
                            theme.text,
                          )}
                        >
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                          <span className="text-sm font-bold text-foreground truncate">
                            {book.title}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            Lendo atualmente · {book.currentPage}/
                            {book.totalPages} pág.
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <div
                          className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0",
                            progress >= 100
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-muted/40 text-muted-foreground border-border/40",
                          )}
                        >
                          <span>{progress}%</span>
                        </div>
                      </div>
                    </div>
                    {/* Mini barra de progresso do livro */}
                    <div className="w-full h-1 bg-muted/40 rounded-full overflow-hidden mt-1">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          progress >= 80
                            ? "bg-emerald-500"
                            : progress >= 40
                              ? theme.solid
                              : "bg-muted-foreground/40",
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
            <div className="space-y-2">
              {recentSessions
                .slice(0, limit !== undefined ? limit + 1 : 3)
                .map((s, i) => (
                  <div
                    key={s.id ?? i}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "shrink-0 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20",
                          theme.text,
                        )}
                      >
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                        <span className="text-sm font-bold text-foreground truncate">
                          Sessão de leitura
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {s.date}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <div
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0",
                          "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
                        )}
                      >
                        <span>{s.pagesRead} pág.</span>
                      </div>
                    </div>
                  </div>
                ))}
              {recentSessions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-border/60 rounded-xl bg-muted/10">
                  <BookOpen className="w-5 h-5 text-muted-foreground/30 mb-1.5 stroke-[1.5]" />
                  <p className="text-[11px] font-medium text-muted-foreground/60">
                    Nenhuma sessão registrada
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </BaseWidget>

      <SessionModal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        books={books}
        onSave={(session) => {
          onLogSession?.(session);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
