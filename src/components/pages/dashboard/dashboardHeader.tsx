"use client";

import type { User } from "@/context/AuthContext";

interface DashboardHeaderProps {
  time: Date;
  greeting: string;
  user: User | null;
  doneTodayCount: number;
  positiveHabitsCount: number;
  pendingNotesCount: number;
}

/**
 * Cabeçalho do Dashboard: Exibe saudação personalizada, data e hora em tempo real
 */
export function DashboardHeader({
  time,
  greeting,
  user,
  doneTodayCount,
  positiveHabitsCount,
  pendingNotesCount,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-1">
        {/* Data formatada por extenso */}
        <p className="text-[10px] font-black uppercase text-neutral-600">
          {time.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="text-4xl font-black text-neutral-200 leading-none">
          {greeting},{" "}
          <span className="text-amber-500">{user?.username ?? "Viajante"}</span>
          !
        </h1>
        {/* Resumo rápido de atividades pendentes */}
        <p className=" text-neutral-500 mt-2 font-medium">
          {positiveHabitsCount > 0
            ? `${doneTodayCount} de ${positiveHabitsCount} hábitos concluídos · ${pendingNotesCount} nota${pendingNotesCount !== 1 ? "s" : ""} pendente${pendingNotesCount !== 1 ? "s" : ""}`
            : `${pendingNotesCount} nota${pendingNotesCount !== 1 ? "s" : ""} pendente${pendingNotesCount !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-end">
        {/* Relógio digital principal */}
        <span className="text-5xl font-black font-mono text-neutral-200 tabular-nums leading-none">
          {time.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className=" font-bold text-amber-500 mt-1 tabular-nums">
          {time.getSeconds().toString().padStart(2, "0")}s
        </span>
      </div>
    </div>
  );
}
