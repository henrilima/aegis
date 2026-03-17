"use client";

import { Pause, Play, Square, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PomoHeader } from "./pomoHeader";
import { PomoHistory } from "./pomoHistory";
import { usePomodoroLogic } from "./usePomodoroLogic";

/**
 * Módulo Pomodoro: Gestão de ciclos de foco e pausas para produtividade
 */
export default function PomodoroPage() {
  const { state, history, formattedTime, loading, actions } =
    usePomodoroLogic();

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center font-bold">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse font-outfit">
          <Timer className="w-4 h-4" /> Sincronizando...
        </div>
      </div>
    );

  const isWork = state?.cycle_type === "Work";

  return (
    <div className="h-full w-full flex justify-center overflow-auto animate-in fade-in duration-700">
      <div className="w-full max-w-5xl flex flex-col gap-8 pb-12">
        {/* Cabeçalho */}
        <PomoHeader
          cyclesCompleted={state?.cycles_completed || 0}
          isWork={isWork}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Unidade Principal */}
          <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-12 flex flex-col items-center gap-10">
            {/* Timer */}
            <div className="flex flex-col items-center gap-4">
              <div
                className={cn(
                  "text-8xl font-black font-outfit tabular-nums transition-all",
                  isWork ? "text-red-500" : "text-teal-500",
                )}
              >
                {formattedTime}
              </div>
              <span
                className={cn(
                  "text-[10px] font-black uppercase px-4 py-1.5 rounded-full border",
                  isWork
                    ? "bg-red-500/10 border-red-500/20 text-red-500"
                    : "bg-teal-500/10 border-teal-500/20 text-teal-500",
                )}
              >
                {isWork ? "Momento de Foco" : "Pausa para Descanso"}
              </span>
            </div>

            {/* Controles */}
            <div className="flex gap-4">
              <Button
                size="lg"
                onClick={actions.toggleTimer}
                className={cn(
                  "px-6 h-11 font-black transition-all rounded-xl text-sm font-outfit shadow-none",
                  isWork
                    ? "bg-red-500 hover:bg-red-400 text-black"
                    : "bg-teal-500 hover:bg-teal-400 text-black",
                )}
              >
                {state?.is_running ? (
                  <>
                    <Pause className="w-5 h-5 mr-2.5 stroke-3" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2.5 stroke-3" /> Iniciar
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={actions.stopTimer}
                disabled={!state?.is_running && state?.cycles_completed === 0}
                className="h-11 border border-neutral-800 hover:bg-neutral-800 font-bold px-6 rounded-xl transition-all text-neutral-400 disabled:opacity-30 text-sm"
              >
                <Square className="w-4 h-4 mr-2 fill-current" /> Parar
              </Button>
            </div>

            {/* Calibração */}
            <div className="w-full pt-10 border-t border-neutral-800/50">
              <div className="flex gap-6 w-full max-w-sm mx-auto">
                <div className="flex-1 space-y-2.5">
                  <p className="text-[10px] font-black uppercase text-neutral-600 text-centerer">
                    Minutos de Foco
                  </p>
                  <div className="relative group">
                    <Input
                      type="number"
                      value={state?.work_minutes || 25}
                      onChange={(e) =>
                        actions.updateConfig("work_minutes", e.target.value)
                      }
                      disabled={state?.is_running}
                      className="bg-neutral-950 h-11 border border-neutral-800 focus:border-red-500/50 text-lg font-black text-center rounded-xl transition-all font-outfit disabled:opacity-50 shadow-none"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-2.5">
                  <p className="text-[10px] font-black uppercase text-neutral-600 text-centerer">
                    Minutos de Pausa
                  </p>
                  <div className="relative group">
                    <Input
                      type="number"
                      value={state?.break_minutes || 5}
                      onChange={(e) =>
                        actions.updateConfig("break_minutes", e.target.value)
                      }
                      disabled={state?.is_running}
                      className="bg-neutral-950 h-11 border border-neutral-800 focus:border-teal-500/50 text-lg font-black text-center rounded-xl transition-all font-outfit disabled:opacity-50 shadow-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div className="sticky top-0 h-fit overflow-hidden">
            <PomoHistory history={history} onClear={actions.clearHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
