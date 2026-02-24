"use client";

import { Moon } from "lucide-react";
import { useNavigation } from "@/context/NavigationContext";
import { formatDurationMin } from "../helpers";
import type { SleepEntry } from "../types";

interface SonoWidgetProps {
  recentSleep: SleepEntry[];
  avgSleepMin: number;
  avgQuality: string;
  todaySleep: SleepEntry | undefined;
  goalSleepMin: number | null;
  sleepPct: number;
}

export function SonoWidget({
  recentSleep,
  avgSleepMin,
  avgQuality,
  todaySleep,
  goalSleepMin,
  sleepPct,
}: SonoWidgetProps) {
  const { navigate } = useNavigation();
  return (
    <button
      type="button"
      onClick={() => navigate("sleep")}
      className="group bg-neutral-900 border border-neutral-800 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 text-left w-full cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Moon className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm font-bold text-neutral-200">Sono</span>
        </div>
        <span className="text-[10px] font-black uppercase  text-neutral-600">
          Últimos 7 dias
        </span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col gap-0.5">
          <span className="text-4xl font-black font-mono text-blue-400 leading-none">
            {avgSleepMin > 0 ? formatDurationMin(avgSleepMin) : "—"}
          </span>
          <span className="text-[10px] font-black uppercase text-neutral-600 ">
            Média de sono
          </span>
          {goalSleepMin !== null && (
            <span className="text-[10px] text-blue-500/70">
              Meta: {formatDurationMin(goalSleepMin)}
            </span>
          )}
        </div>
        <div className="w-px h-12 bg-neutral-800" />
        <div className="flex flex-col gap-0.5">
          <span className="text-4xl font-black font-mono text-blue-400 leading-none">
            {avgQuality}
            <span className="text-lg text-neutral-600">/5</span>
          </span>
          <span className="text-[10px] font-black uppercase text-neutral-600 ">
            Qualidade média
          </span>
        </div>
      </div>

      {goalSleepMin !== null && avgSleepMin > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>{formatDurationMin(avgSleepMin)} em média</span>
            <span>{sleepPct}% da meta</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            {/* Barra de progresso com cores dinâmicas baseadas na meta */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                sleepPct >= 100
                  ? "bg-green-500"
                  : sleepPct >= 75
                    ? "bg-blue-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${sleepPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <div className="flex flex-col gap-0.5 p-2.5 bg-neutral-800/40 rounded-xl border border-neutral-800">
          <span className="text-lg font-black font-mono text-blue-400 leading-none">
            {recentSleep.length}
          </span>
          <span className="text-[9px] font-black uppercase  text-neutral-600">
            Noites registradas
          </span>
        </div>
        <div className="flex flex-col gap-0.5 p-2.5 bg-neutral-800/40 rounded-xl border border-neutral-800">
          <span className="text-lg font-black font-mono text-blue-400 leading-none">
            {todaySleep ? formatDurationMin(todaySleep.duration_minutes) : "—"}
          </span>
          <span className="text-[9px] font-black uppercase  text-neutral-600">
            Ontem à noite
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {recentSleep.slice(0, 3).map((e, i) => {
          // Define a cor da estrela conforme a qualidade (1 a 5)
          const qColor =
            e.quality >= 4
              ? "text-green-400"
              : e.quality === 3
                ? "text-yellow-400"
                : "text-red-400";
          return (
            <div
              key={e.id ?? i}
              className="flex items-center gap-2 py-1 border-b border-neutral-800/60 last:border-0"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60 shrink-0" />
              <span className="text-xs text-neutral-500 w-24 shrink-0">
                {e.date}
              </span>
              <span className="text-xs text-neutral-400 flex-1">
                {formatDurationMin(e.duration_minutes)}
              </span>
              <span className={`text-[10px] font-bold ${qColor}`}>
                ★{e.quality}
              </span>
            </div>
          );
        })}
        {recentSleep.length === 0 && (
          <p className="text-xs text-neutral-700">Nenhum registro de sono</p>
        )}
      </div>
    </button>
  );
}
