"use client";

import { Timer } from "lucide-react";
import { useNavigation } from "@/context/NavigationContext";
import type { PomodoroState } from "../types";
import { PomodoroLive } from "./ui";

interface PomodoroWidgetProps {
  pomodoro: PomodoroState | null;
}

export function PomodoroWidget({ pomodoro }: PomodoroWidgetProps) {
  const { navigate } = useNavigation();
  return (
    <button
      type="button"
      onClick={() => navigate("pomodoro")}
      className="group bg-neutral-900 border border-neutral-800 hover:border-red-500/30 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 text-left w-full cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <Timer className="w-4 h-4 text-red-400" />
          </div>
          <span className="text-sm font-bold text-neutral-200">Pomodoro</span>
        </div>
        {pomodoro?.is_running && (
          <span className="flex items-center gap-1.5 text-[10px] font-black text-red-400 uppercase ">
            {/* Indicador visual pulsante de timer ativo */}
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Ativo
          </span>
        )}
      </div>

      <PomodoroLive p={pomodoro} />

      <div className="grid grid-cols-2 gap-2 mt-auto">
        {[
          {
            label: "Duração foco",
            value: `${pomodoro?.work_minutes ?? 25}min`,
            color: "text-red-400",
          },
          {
            label: "Pausa",
            value: `${pomodoro?.break_minutes ?? 5}min`,
            color: "text-neutral-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-0.5 p-2.5 bg-neutral-800/40 rounded-xl border border-neutral-800"
          >
            <span
              className={`text-lg font-black font-mono leading-none ${s.color}`}
            >
              {s.value}
            </span>
            <span className="text-[9px] font-black uppercase  text-neutral-600">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-neutral-600 font-bold uppercase ">
        <span>Fase atual</span>
        <span
          className={pomodoro?.is_running ? "text-red-400" : "text-neutral-600"}
        >
          {/* Alterna entre as fases de foco e descanso do Pomodoro */}
          {pomodoro ? (pomodoro.cycle_type === "Work" ? "Foco" : "Pausa") : "—"}
        </span>
      </div>
    </button>
  );
}
