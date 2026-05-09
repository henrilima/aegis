"use client";

import {
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  History as HistoryIcon,
  Plus,
  Target,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type {
  ReadingBook,
  ReadingGoal,
  ReadingSession,
  ReadingStats,
} from "../types";
import { calculateProgress, formatMinutes } from "../utils";

interface OverviewTabProps {
  stats: ReadingStats;
  books: ReadingBook[];
  sessions: ReadingSession[];
  goals: ReadingGoal[];
  onNewSession: () => void;
  onConfigGoals: () => void;
}

export function OverviewTab({
  stats,
  books,
  sessions,
  goals,
  onNewSession,
  onConfigGoals,
}: OverviewTabProps) {
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);
  const currentBooks = books.filter((b) => b.status === "Reading");

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Páginas Lidas",
            value: stats.totalPages,
            icon: BookOpen,
            color: theme.text,
            bg: theme.bg,
          },
          {
            label: "Tempo Total",
            value: formatMinutes(stats.totalMinutes),
            icon: Clock,
            color: theme.textSub,
            bg: theme.bg,
          },
          {
            label: "Livros Lidos",
            value: stats.booksCompleted,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Sessões",
            value: stats.sessionsCount,
            icon: Flame,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={cn(
              "bg-card border border-border rounded-xl p-4 flex flex-col gap-2 transition-all",
              theme.borderHover.replace("hover:", "hover:"),
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground">
                {card.label}
              </span>
              <div className={cn("p-1.5 rounded-xl", card.bg)}>
                <card.icon className={cn("w-3.5 h-3.5", card.color)} />
              </div>
            </div>
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {card.value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Leitura atual */}
        <div className="md:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
              <BookOpen className={cn("w-4 h-4", theme.text)} />
              Lendo agora
            </h2>
            <button
              type="button"
              onClick={() => {
                if (books.length === 0) {
                  toast.error("Adicione um livro primeiro!");
                } else {
                  onNewSession();
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-bold transition-all",
                theme.bg,
                theme.border,
                theme.text,
              )}
            >
              <Plus className="w-3 h-3" strokeWidth={3} /> Registrar leitura
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentBooks.length > 0 ? (
              currentBooks.map((book) => {
                const progress = calculateProgress(
                  book.currentPage,
                  book.totalPages,
                );
                return (
                  <div
                    key={book.id}
                    className={cn(
                      "bg-card/50 border border-border rounded-xl p-5 flex flex-col gap-4 group hover:bg-card transition-all border-b-2 border-b-neutral-800",
                      theme.borderHover.replace("hover:", "hover:border-b-"),
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-24 bg-muted rounded-xl overflow-hidden shrink-0 border border-border/50 transform group-hover:scale-105 transition-transform">
                        {book.thumbnail ? (
                          <Image
                            src={book.thumbnail}
                            alt={book.title}
                            width={64}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-neutral-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground leading-tight truncate text-sm">
                          {book.title}
                        </h3>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {book.author}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[9px] font-semibold px-2 py-0.5 rounded-xl border",
                              theme.bg,
                              theme.text,
                              theme.border,
                            )}
                          >
                            {book.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-bold">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className={theme.text}>{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-neutral-800 rounded-xl overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-xl transition-all duration-1000",
                            theme.solid,
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-medium text-neutral-600">
                        <span>{book.currentPage} pág.</span>
                        <span>{book.totalPages} pág.</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full h-48 flex flex-col items-center justify-center bg-card/30 border-2 border-dashed border-border rounded-xl p-6 text-center">
                <div className="p-3 rounded-xl bg-neutral-800/50 mb-3 text-neutral-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <p className="text-muted-foreground font-medium text-sm">
                  Nenhum livro sendo lido no momento.
                </p>
                <p className="text-neutral-700 text-[10px] mt-1 font-bold">
                  Adicione ou atualize um livro para começar!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Barra lateral */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Metas semanais */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                <Target className={cn("w-4 h-4", theme.text)} />
                Metas semanais
              </h2>
              <button
                type="button"
                onClick={onConfigGoals}
                className={cn(
                  "text-[9px] font-bold transition-colors",
                  theme.text,
                )}
              >
                Configurar
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-5">
              {(() => {
                // Mostra apenas os tipos de metas semanais para evitar duplicatas/fantasmas
                const targetTypes = ["PagesPerWeek", "TimePerWeek"];
                const weeklyGoals = targetTypes
                  .map((type) => goals.find((g) => g.goalType === type))
                  .filter(Boolean) as ReadingGoal[];

                if (weeklyGoals.length === 0)
                  return (
                    <div className="py-4 flex flex-col items-center justify-center gap-2 opacity-50">
                      <Target className="w-5 h-5 text-neutral-600" />
                      <p className="text-[9px] text-muted-foreground font-bold">
                        Nenhuma meta definida
                      </p>
                    </div>
                  );

                return weeklyGoals.map((goal) => {
                  const isPages = goal.goalType === "PagesPerWeek";
                  const current = isPages
                    ? stats.totalPages
                    : Math.round(stats.totalMinutes);
                  const progress =
                    goal.targetValue > 0
                      ? Math.min(
                          100,
                          Math.round((current / goal.targetValue) * 100),
                        )
                      : 0;

                  return (
                    <div key={goal.goalType} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[9px] font-medium text-muted-foreground">
                          {isPages ? "Páginas/Semana" : "Minutos/Semana"}
                        </span>
                        <span className="text-[10px] font-bold text-foreground tabular-nums">
                          {current} / {Math.round(goal.targetValue)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-border/50">
                        <div
                          className={cn(
                            "h-full transition-all duration-1000",
                            theme.solid,
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Atividade recente */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold text-muted-foreground flex items-center gap-2 px-1">
              <HistoryIcon className={cn("w-4 h-4", theme.text)} />
              Últimas sessões
            </h2>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 min-h-[200px]">
              {sessions.slice(0, 5).map((s) => {
                const book = books.find((b) => b.id === s.bookId);
                return (
                  <div
                    key={s.id}
                    className="flex flex-col gap-1 p-3 rounded-xl bg-background/40 border border-border/50 hover:bg-background/60 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-foreground truncate max-w-[120px]">
                        {book?.title || "Leitura avulsa"}
                      </span>
                      <span className="text-[9px] font-bold text-neutral-600">
                        {new Date(s.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <BookOpen className={cn("w-3 h-3", theme.text)} />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                          {s.pagesRead} pág.
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className={cn("w-3 h-3", theme.textSub)} />
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                          {s.durationMinutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {sessions.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 grayscale opacity-40">
                  <Flame className="w-8 h-8 mb-2" />
                  <p className="text-[10px] font-bold">
                    Nenhum registro ainda.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
