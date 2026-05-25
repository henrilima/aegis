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
                    className="flex flex-col p-[2.5cqw] @sm:p-2.5 rounded-xl border border-neutral-200/60 dark:border-border/40 bg-neutral-100 dark:bg-neutral-900/10 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/20 hover:border-neutral-300/60 dark:hover:border-border/60 transition-all gap-2"
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 p-2 rounded-xl bg-neutral-200 dark:bg-neutral-900/40 border border-neutral-300/40 dark:border-border/30 text-indigo-500">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-foreground truncate">
                            {book.title}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                            Lendo atualmente
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-200/70 dark:bg-neutral-900/30 border border-neutral-300/40 dark:border-border/30 min-w-[72px] text-left">
                        <span
                          className={cn(
                            "block text-xs font-bold leading-none",
                            theme.text,
                          )}
                        >
                          {progress}%
                        </span>
                        <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 block mt-1">
                          {book.currentPage}/{book.totalPages} p.
                        </span>
                      </div>
                    </div>
                    {/* Mini barra de progresso do livro */}
                    <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          progress >= 80
                            ? "bg-emerald-500"
                            : progress >= 40
                              ? theme.solid
                              : "bg-neutral-500 dark:bg-neutral-600",
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
                  className="flex items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-neutral-200/60 dark:border-border/40 bg-neutral-100 dark:bg-neutral-900/10 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/20 hover:border-neutral-300/60 dark:hover:border-border/60 transition-all gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 p-2 rounded-xl bg-neutral-200 dark:bg-neutral-900/40 border border-neutral-300/40 dark:border-border/30 text-indigo-500">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-foreground truncate">
                        Sessão de Leitura
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                        {s.date}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-200/70 dark:bg-neutral-900/30 border border-neutral-300/40 dark:border-border/30 min-w-[72px] text-left">
                    <span
                      className={cn(
                        "block text-xs font-bold leading-none",
                        theme.text,
                      )}
                    >
                      {s.pagesRead}
                    </span>
                    <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 block mt-1">
                      Páginas
                    </span>
                  </div>
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
