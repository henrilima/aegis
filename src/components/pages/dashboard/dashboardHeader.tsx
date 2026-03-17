"use client";

import { Clock, Layout } from "lucide-react";
import type { User } from "@/context/AuthContext";
import { cn, getThemeColor } from "@/lib/utils";

interface DashboardHeaderProps {
  time: Date;
  greeting: string;
  user: User | null;
  doneTodayCount: number;
  positiveHabitsCount: number;
  pendingNotesCount: number;
  onOpenConfig: () => void;
  isSimulated?: boolean;
}

export function DashboardHeader({
  time,
  greeting,
  user,
  doneTodayCount,
  positiveHabitsCount,
  pendingNotesCount,
  onOpenConfig,
  isSimulated = false,
}: DashboardHeaderProps) {
  const theme = getThemeColor();

  return (
    <div className="flex flex-col gap-4 mb-4">
      {isSimulated && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl w-full animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
          <span className="text-[11px] font-black text-amber-500 uppercase flex items-center gap-2">
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
          <p className="text-xs font-medium text-neutral-400 ml-0.5 mb-2">
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
            <h1 className="text-4xl font-black text-white leading-none">
              {greeting},{" "}
              <span className={theme.text}>{user?.username ?? "Viajante"}</span>
              !
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={onOpenConfig}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition-all cursor-pointer text-xs font-bold h-auto"
            >
              <Layout className={cn("w-4 h-4", theme.text)} />
              Personalizar
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800">
              <div
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  doneTodayCount === positiveHabitsCount &&
                    positiveHabitsCount > 0
                    ? "bg-emerald-500"
                    : "bg-neutral-600",
                )}
              />
              <p className="text-[10px] font-bold text-neutral-400">
                {positiveHabitsCount > 0
                  ? `${doneTodayCount} / ${positiveHabitsCount} Hábitos`
                  : "Aegis Dashboard"}
              </p>
            </div>
            {pendingNotesCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                <span className="text-[10px] font-bold text-orange-400">
                  {pendingNotesCount} Pendência
                  {pendingNotesCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-stretch gap-3 bg-neutral-900/30 p-2 rounded-[1.2rem] border border-neutral-800/50 shadow-sm">
          <div className="flex flex-col items-end justify-center px-4 py-2 border-r border-neutral-800/50">
            <div className="flex items-center gap-2 mb-0.5">
              <Clock className="w-3.5 h-3.5 text-neutral-600" />
              <span className="text-[10px] font-bold text-neutral-600">
                Horário
              </span>
            </div>
            <span className="text-4xl font-black text-white tabular-nums leading-none">
              {time.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center bg-neutral-950/50 px-5 rounded-xl border border-neutral-800 min-w-[64px]">
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
