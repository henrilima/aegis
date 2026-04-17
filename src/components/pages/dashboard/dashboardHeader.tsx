"use client";

import { Clock, Layout } from "lucide-react";
import type { User } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  time: Date;
  greeting: string;
  user: User | null;
  doneTodayCount: number;
  positiveHabitsCount: number;
  pendingTasksCount: number;
  onOpenConfig: () => void;
  isSimulated?: boolean;
}

export function DashboardHeader({
  time,
  greeting,
  user,
  doneTodayCount,
  positiveHabitsCount,
  pendingTasksCount,
  onOpenConfig,
  isSimulated = false,
}: DashboardHeaderProps) {
  const { themeStyles: theme } = useTheme();

  return (
    <div className="flex flex-col gap-4 mb-4">
      {isSimulated && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl w-full animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase flex items-center gap-2">
            <span>TEMPO SIMULADO:</span>
            <span className="text-amber-200/80">
              {time.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="opacity-40">|</span>
            <span>HORA SIMULADA:</span>
            <span className="text-amber-200/80 font-mono">
              {time.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground ml-0.5 mb-2">
            {time
              .toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
              .split(",")
              .map((s) => {
                const trimmed = s.trim();
                return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
              })
              .join(", ")}
          </p>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-foreground leading-none">
              {greeting},{" "}
              <span className={theme.text}>{user?.username ?? "Viajante"}</span>
              !
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={onOpenConfig}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent/50 text-muted-foreground hover:text-foreground border border-border transition-all cursor-pointer text-xs font-bold h-auto"
            >
              <Layout className={cn("w-4 h-4", theme.text)} />
              Personalizar
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border">
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  doneTodayCount === positiveHabitsCount &&
                    positiveHabitsCount > 0
                    ? "bg-emerald-500"
                    : "bg-neutral-600",
                )}
              />
              <p className="text-[10px] font-bold text-muted-foreground">
                {positiveHabitsCount > 0
                  ? `${doneTodayCount} / ${positiveHabitsCount} Hábitos`
                  : "Aegis Dashboard"}
              </p>
            </div>
            {pendingTasksCount > 0 && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 transition-all hover:bg-orange-500/20"
              >
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                  {pendingTasksCount} Tarefa{pendingTasksCount !== 1 ? "s" : ""}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-stretch gap-3 bg-card/30 p-2 rounded-xl border border-border/50">
          <div className="flex flex-col items-end justify-center px-4 py-2 border-r border-border/50">
            <div className="flex items-center gap-2 mb-0.5">
              <Clock className="w-3.5 h-3.5 text-neutral-600" />
              <span className="text-[10px] font-bold text-neutral-600">
                Horário
              </span>
            </div>
            <span className="text-4xl font-black text-foreground tabular-nums leading-none">
              {time.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center bg-background/50 px-5 rounded-xl border border-border min-w-[64px]">
            <span
              className={cn("text-2xl font-black tabular-nums", theme.text)}
            >
              {time.getSeconds().toString().padStart(2, "0")}
            </span>
            <span className="text-[9px] font-bold text-neutral-600 uppercase mt-0.5">
              seg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
