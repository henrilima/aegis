"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import type { StudySession } from "../types";

interface EstudosWidgetProps {
  weekSessions: StudySession[];
  weekHours: number;
  weekQuestions: number;
  totalSessions: number;
  goalWeekHours: number | null;
  goalWeekQuestions: number | null;
}

export function EstudosWidget({
  weekSessions,
  weekHours,
  weekQuestions,
  totalSessions,
  goalWeekHours,
  goalWeekQuestions,
}: EstudosWidgetProps) {
  return (
    <Link
      href="/dashboard/estudos"
      className="group bg-neutral-900 border border-neutral-800 hover:border-violet-500/30 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <BookOpen className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-sm font-bold text-neutral-200">Estudos</span>
        </div>
        <span className="text-[10px] font-black uppercase  text-neutral-600">
          Esta semana
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-0.5">
          <span className="text-4xl font-black font-mono text-violet-400 leading-none tabular-nums">
            {weekHours.toFixed(1)}
            <span className="text-xl text-neutral-600">h</span>
          </span>
          <span className="text-[10px] font-black uppercase text-neutral-600 ">
            Horas estudadas
          </span>
          {goalWeekHours !== null && (
            <span className="text-[10px] text-violet-500/70">
              Meta: {goalWeekHours}h
            </span>
          )}
        </div>
        <div className="w-px h-12 bg-neutral-800" />
        <div className="flex flex-col gap-0.5">
          <span className="text-4xl font-black font-mono text-violet-400 leading-none tabular-nums">
            {weekQuestions}
          </span>
          <span className="text-[10px] font-black uppercase text-neutral-600 ">
            Questões
          </span>
          {goalWeekQuestions !== null && (
            <span className="text-[10px] text-violet-500/70">
              Meta: {goalWeekQuestions}
            </span>
          )}
        </div>
      </div>

      {goalWeekHours !== null && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>{weekHours.toFixed(1)}h concluídas</span>
            <span>
              {/* Calcula o percentual da meta semanal atingido */}
              {Math.min(100, Math.round((weekHours / goalWeekHours) * 100))}% da
              meta
            </span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (weekHours / goalWeekHours) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <div className="flex flex-col gap-0.5 p-2.5 bg-neutral-800/40 rounded-xl border border-neutral-800">
          <span className="text-lg font-black font-mono text-violet-400 leading-none">
            {weekSessions.length}
          </span>
          <span className="text-[9px] font-black uppercase  text-neutral-600">
            Sessões esta semana
          </span>
        </div>
        <div className="flex flex-col gap-0.5 p-2.5 bg-neutral-800/40 rounded-xl border border-neutral-800">
          <span className="text-lg font-black font-mono text-violet-400 leading-none">
            {totalSessions}
          </span>
          <span className="text-[9px] font-black uppercase  text-neutral-600">
            Total (30 dias)
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {weekSessions.slice(0, 3).map((s, i) => (
          <div
            key={s.id ?? i}
            className="flex items-center gap-2 py-1 border-b border-neutral-800/60 last:border-0"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500/60 shrink-0" />
            <span className="text-xs text-neutral-400 flex-1 truncate">
              {s.subject}
            </span>
            <span className="text-[10px] font-mono text-violet-400">
              {s.hours}h
            </span>
          </div>
        ))}
        {weekSessions.length === 0 && (
          <p className="text-xs text-neutral-700">Nenhuma sessão esta semana</p>
        )}
      </div>
    </Link>
  );
}
