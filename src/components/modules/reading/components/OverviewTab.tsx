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
import { ToolTip } from "@/components/ui/ToolTipHelper";
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
  onNewBook: () => void;
  onStartBook: (book: ReadingBook) => Promise<void>;
}

export function OverviewTab({
  stats,
  books,
  sessions,
  goals,
  onNewSession,
  onConfigGoals,
  onNewBook,
  onStartBook,
}: OverviewTabProps) {
  const color = getModuleColor("reading");
  const theme = getColorTheme(color);
  const currentBooks = books.filter((b) => b.status === "Reading");
  const _wantToReadBooks = books.filter((b) => b.status === "WantToRead");
  const _completedBooks = books.filter((b) => b.status === "Completed");

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
            sub: `${stats.booksReading || 0} ${stats.booksReading === 1 ? "livro ativo" : "livros ativos"}`,
            tooltip: "Total de páginas lidas em todos os seus livros.",
          },
          {
            label: "Tempo Total",
            value: formatMinutes(stats.totalMinutes),
            icon: Clock,
            color: theme.textSub,
            sub:
              stats.sessionsCount > 0
                ? `Média de ${formatMinutes(Math.round(stats.totalMinutes / stats.sessionsCount))} / sessão`
                : "Sem sessões registradas",
            tooltip: "Tempo total acumulado dedicado à leitura.",
          },
          {
            label: "Livros Lidos",
            value: stats.booksCompleted,
            icon: CheckCircle2,
            color: "text-emerald-500",
            sub: "Leituras finalizadas",
            tooltip: "Quantidade total de livros que você já concluiu.",
          },
          {
            label: "Sessões",
            value: stats.sessionsCount,
            icon: Flame,
            color: "text-rose-500",
            sub: "Sessões registradas",
            tooltip:
              "Número total de sessões de leitura registradas no aplicativo.",
          },
        ].map((card) => {
          const cardEl = (
            <div
              key={card.label}
              className="bg-card border border-border rounded-xl p-5 flex flex-col gap-2 transition-all hover:border-border/80"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 capitalize">
                  {card.label}
                </span>
                <card.icon className={cn("w-4 h-4", card.color)} />
              </div>
              <span className="text-3xl font-bold text-foreground leading-none tabular-nums">
                {card.value}
              </span>
              <span className="text-xs text-neutral-500 font-medium mt-0.5">
                {card.sub}
              </span>
            </div>
          );

          return (
            <ToolTip key={card.label} content={card.tooltip}>
              {cardEl}
            </ToolTip>
          );
        })}
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card text-foreground text-[9px] font-bold transition-all hover:bg-muted/10"
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
                    className="bg-card border border-border rounded-xl p-5 flex flex-row gap-4 items-stretch group transition-all hover:border-border/80"
                  >
                    <div className="w-20 h-28 bg-muted rounded-lg overflow-hidden shrink-0 border border-border/50">
                      {book.thumbnail ? (
                        <Image
                          src={book.thumbnail}
                          alt={book.title}
                          width={80}
                          height={112}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-neutral-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-bold text-foreground leading-tight truncate text-sm">
                          {book.title}
                        </h3>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {book.author}
                        </p>
                        <span
                          className={cn(
                            "inline-block mt-2 text-[9px] font-semibold px-2 py-0.5 rounded-full border",
                            theme.bg,
                            theme.text,
                            theme.border,
                          )}
                        >
                          {book.category}
                        </span>
                      </div>

                      <div className="space-y-1.5 mt-2">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-neutral-500 capitalize">
                            Progresso
                          </span>
                          <span className={theme.text}>{progress}%</span>
                        </div>
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-1000",
                              theme.solid,
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-neutral-500 font-medium">
                          <span>
                            {book.currentPage}/{book.totalPages} pág.
                          </span>
                          <button
                            type="button"
                            onClick={() => onNewSession()}
                            className={cn(
                              "px-2 py-0.5 rounded border text-[9px] font-bold transition-all",
                              theme.bg,
                              theme.border,
                              theme.text,
                              theme.bgHover,
                            )}
                          >
                            Ler
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : books.length > 0 ? (
              <div className="col-span-full flex flex-col gap-4">
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className={cn("w-4 h-4", theme.text)} />
                    <span className="text-sm font-bold text-foreground">
                      Sua lista de leituras
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                    Você não tem nenhuma leitura ativa no momento. Escolha um
                    livro da sua biblioteca para iniciar:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    {books.slice(0, 4).map((book) => (
                      <div
                        key={book.id}
                        className="bg-muted/30 border border-border/70 p-3 rounded-lg flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {book.title}
                          </p>
                          <p className="text-[10px] text-neutral-500 truncate">
                            {book.author}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onStartBook(book)}
                          className={cn(
                            "px-2.5 py-1 rounded text-[9px] font-bold border shrink-0 transition-all",
                            theme.solid,
                            theme.solidHover,
                            "text-white border-transparent",
                          )}
                        >
                          Começar a Ler
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="col-span-full h-48 flex flex-col items-center justify-center bg-card border border-dashed border-border rounded-xl p-6 text-center">
                <div className="p-3 rounded-xl bg-neutral-800/50 mb-3 text-neutral-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <p className="text-muted-foreground font-medium text-sm">
                  Sua biblioteca está vazia.
                </p>
                <p className="text-neutral-500 text-[10px] mt-1 font-bold">
                  Adicione seu primeiro livro para começar a gerenciar suas
                  leituras!
                </p>
                <button
                  type="button"
                  onClick={onNewBook}
                  className={cn(
                    "mt-4 px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-all",
                    theme.solid,
                    theme.solidHover,
                    "text-white border-transparent",
                  )}
                >
                  Adicionar Primeiro Livro
                </button>
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
                  "text-[9px] font-bold transition-colors hover:opacity-85",
                  theme.text,
                )}
              >
                Configurar
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-5">
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
                        <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 capitalize">
                          {isPages ? "Páginas/Semana" : "Minutos/Semana"}
                        </span>
                        <span className="text-[10px] font-bold text-foreground tabular-nums">
                          {current} / {Math.round(goal.targetValue)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
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

          {/* Atividade recente em Timeline Vertical */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold text-muted-foreground flex items-center gap-2 px-1">
              <HistoryIcon className={cn("w-4 h-4", theme.text)} />
              Últimas sessões
            </h2>
            <div className="bg-card border border-border rounded-xl p-5 min-h-[220px]">
              {sessions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 grayscale opacity-40">
                  <Flame className="w-8 h-8 mb-2" />
                  <p className="text-[10px] font-bold">
                    Nenhum registro ainda.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 border-l border-border flex flex-col gap-6 my-2">
                  {sessions.slice(0, 4).map((s) => {
                    const book = books.find((b) => b.id === s.bookId);
                    return (
                      <div
                        key={s.id}
                        className="relative flex flex-col gap-1.5"
                      >
                        <div
                          className={cn(
                            "absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-card flex items-center justify-center",
                            theme.solid,
                          )}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground truncate max-w-[140px]">
                            {book?.title || "Leitura avulsa"}
                          </span>
                          <span className="text-[10px] font-medium text-neutral-500 tabular-nums">
                            {new Date(s.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-medium">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {s.pagesRead} pág.
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {s.durationMinutes} min
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
