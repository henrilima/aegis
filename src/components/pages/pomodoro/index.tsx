"use client";

import { Timer } from "lucide-react";
import { PomoHistory } from "./pomoHistory";
import { TimerControls } from "./timerControls";
import { TimerDisplay } from "./timerDisplay";
import { TimerSettings } from "./timerSettings";
import { usePomodoroLogic } from "./usePomodoroLogic";

/**
 * Módulo Pomodoro: Gestão de ciclos de foco e pausas para produtividade
 */
export default function PomodoroPage() {
  const { state, history, timeLeft, formattedTime, loading, actions } =
    usePomodoroLogic();

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center font-bold">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <Timer className="w-4 h-4" /> Sincronizando cronômetros...
        </div>
      </div>
    );

  const isWork = state?.cycle_type === "Work";

  return (
    <div className="h-full w-full flex justify-center overflow-auto animate-in fade-in duration-700">
      <div className="w-full max-w-4xl flex flex-col gap-6 pb-12">
        {/* Cabeçalho de Status do Ciclo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border transition-colors shadow-lg ${
                isWork
                  ? "bg-red-500/10 border-red-500/20 shadow-red-500/5"
                  : "bg-teal-500/10 border-teal-500/20 shadow-teal-500/5"
              }`}
            >
              <Timer
                className={`w-5 h-5 ${isWork ? "text-red-400" : "text-teal-400"}`}
              />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-none">
                Focus Engine
              </h1>
              <p
                className={`text-[10px] font-black uppercase mt-1.5 ${isWork ? "text-red-500" : "text-teal-500"}`}
              >
                {isWork
                  ? "Fase Provedora de Foco"
                  : "Fase de Recuperação Neutra"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 shadow-sm">
            <div
              className={`w-1.5 h-1.5 rounded-full ${isWork ? "bg-red-500 animate-pulse" : "bg-teal-500"}`}
            />
            <span className="text-[10px] font-black text-neutral-400 uppercase">
              {state?.cycles_completed || 0} Ciclo
              {(state?.cycles_completed || 0) !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Unidade Principal de Tempo */}
          <div className="md:col-span-2 bg-neutral-900/50 border border-neutral-800 rounded-3xl p-10 flex flex-col items-center gap-8 shadow-2xl shadow-black/40">
            <TimerDisplay
              timeLeft={timeLeft}
              state={state}
              formatTime={() => formattedTime}
            />

            <TimerControls
              state={state}
              onToggle={actions.toggleTimer}
              onStop={actions.stopTimer}
              isWork={isWork}
            />

            {/* Painel de Calibração */}
            <div className="w-full pt-8 border-t border-neutral-800/50">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="h-px bg-neutral-800 flex-1" />
                <p className="text-[10px] font-black uppercase text-neutral-600">
                  Ajustar Calibração
                </p>
                <span className="h-px bg-neutral-800 flex-1" />
              </div>
              <TimerSettings
                state={state}
                onUpdateConfig={actions.updateConfig}
              />
            </div>
          </div>

          {/* Histórico de Atividade Sincronizado */}
          <div className="sticky top-0">
            <PomoHistory history={history} onClear={actions.clearHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
