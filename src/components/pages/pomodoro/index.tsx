"use client";

import { Timer } from "lucide-react";
import { PomoHistory } from "./pomo-history";
import { TimerControls } from "./timer-controls";
import { TimerDisplay } from "./timer-display";
import { TimerSettings } from "./timer-settings";
import { usePomodoroLogic } from "./use-pomodoro-logic";

export default function PomodoroPage() {
  const { state, history, timeLeft, formattedTime, loading, actions } =
    usePomodoroLogic();

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <Timer className="w-4 h-4" /> Carregando...
        </div>
      </div>
    );

  const isWork = state?.cycle_type === "Work";

  return (
    <div className="h-full w-full flex justify-center overflow-auto">
      <div className="w-full max-w-4xl flex flex-col gap-6 pb-10 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${isWork ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"}`}
            >
              <Timer
                className={`w-5 h-5 ${isWork ? "text-red-400" : "text-green-400"}`}
              />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none">Pomodoro</h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                {isWork ? "Modo Foco" : "Modo Pausa"}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-neutral-600 bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-full">
            {/* Lida com a pluralização básica dos ciclos completados */}
            {state?.cycles_completed || 0} ciclo
            {(state?.cycles_completed || 0) !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col items-center gap-6">
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
            <div className="w-full pt-4 border-t border-neutral-800">
              <p className="text-[10px] font-black uppercase  text-neutral-500 mb-3 text-center">
                Configurações (min)
              </p>
              <TimerSettings
                state={state}
                onUpdateConfig={actions.updateConfig}
              />
            </div>
          </div>

          <div>
            <PomoHistory history={history} onClear={actions.clearHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
