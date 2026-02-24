"use client";

import { Activity, CheckCircle2, Circle, Flame } from "lucide-react";
import type { Habit } from "@/components/pages/habits/types";
import { useNavigation } from "@/context/NavigationContext";
import { Ring } from "./ui";

interface HabitsWidgetProps {
  positiveHabits: Habit[];
  doneToday: Habit[];
  progressPct: number;
  maxStreak: number;
  isToday: (iso: string) => boolean;
}

export function HabitsWidget({
  positiveHabits,
  doneToday,
  progressPct,
  maxStreak,
  isToday,
}: HabitsWidgetProps) {
  const { navigate } = useNavigation();
  return (
    <button
      type="button"
      onClick={() => navigate("habits")}
      className="group bg-neutral-900 border border-neutral-800 hover:border-teal-500/30 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 text-left w-full cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <span className="text-sm font-bold text-neutral-200">Hábitos</span>
        </div>
        <span className="text-[10px] font-black uppercase  text-neutral-600">
          Hoje
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <Ring pct={progressPct} color="#2dd4bf" size={80} stroke={8} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-teal-400 leading-none">
              {progressPct}%
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div>
            <span className="text-3xl font-black font-mono text-teal-400 leading-none">
              {doneToday.length}
            </span>
            <span className="text-lg font-black text-neutral-700">
              /{positiveHabits.length}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase text-neutral-600 ">
            Concluídos
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Flame className="w-3 h-3 text-cyan-400" />
            <span className="text-xs text-neutral-500">
              {/* Exibe o recorde de sequência do usuário */}
              Maior sequência: <b className="text-cyan-400">{maxStreak}d</b>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-auto">
        {positiveHabits.slice(0, 3).map((h) => {
          // Verifica se o hábito foi concluído na data atual
          const done = h.last_done && isToday(h.last_done);
          return (
            <div
              key={h.id}
              className="flex items-center gap-2 py-1 border-b border-neutral-800/60 last:border-0"
            >
              {done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-neutral-700 shrink-0" />
              )}
              <span
                className={`text-xs flex-1 truncate ${done ? "text-neutral-400 line-through" : "text-neutral-300"}`}
              >
                {h.name}
              </span>
              <span className="text-[10px] font-mono text-neutral-700">
                {h.max_streak ?? 0}d
              </span>
            </div>
          );
        })}
        {positiveHabits.length === 0 && (
          <p className="text-xs text-neutral-700">
            Nenhum hábito positivo ainda
          </p>
        )}
      </div>
    </button>
  );
}
