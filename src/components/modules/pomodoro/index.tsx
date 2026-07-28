"use client";

import { invoke } from "@tauri-apps/api/core";
import { BookOpen, Pause, Play, Square, Timer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/input";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { PomodoroGuidePanel } from "./PomodoroInfoModal";
import { PomodoroLinkStudyModal } from "./PomodoroLinkStudyModal";
import { PomoHeader } from "./pomoHeader";
import { PomoHistory } from "./pomoHistory";
import { usePomodoroLogic } from "./usePomodoroLogic";

export default function PomodoroPage() {
  const { state, history, formattedTime, loading, actions } =
    usePomodoroLogic();
  const color = getModuleColor("pomodoro");
  const theme = getColorTheme(color);
  const [showInfo, setShowInfo] = useState(false);
  const [promptLinkData, setPromptLinkData] = useState<{
    cyclesCompleted: number;
    workMinutes: number;
  } | null>(null);
  const [linkData, setLinkData] = useState<{
    cyclesCompleted: number;
    workMinutes: number;
  } | null>(null);

  const handleDetach = async () => {
    try {
      await invoke("pomodoro_open_widget");
    } catch (err) {
      console.error("Erro ao destacar widget:", err);
    }
  };

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center font-bold">
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse font-outfit">
          <Timer className="w-4 h-4" /> Sincronizando...
        </div>
      </div>
    );

  const isWork = state?.cycleType === "Work";

  if (showInfo) {
    return (
      <div className="w-full flex flex-col gap-6 pb-12 text-foreground">
        {/* Cabeçalho */}
        <PomoHeader
          cyclesCompleted={state?.cyclesCompleted || 0}
          isWork={isWork}
          onTitleClick={() => setShowInfo(true)}
          onDetach={handleDetach}
        />
        <PomodoroGuidePanel onBack={() => setShowInfo(false)} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 pb-12 text-foreground">
      {/* Cabeçalho */}
      <PomoHeader
        cyclesCompleted={state?.cyclesCompleted || 0}
        isWork={isWork}
        onTitleClick={() => setShowInfo(true)}
        onDetach={handleDetach}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Unidade Principal */}
        <div className="md:col-span-2 bg-card border border-border rounded-3xl p-12 flex flex-col items-center gap-10">
          {/* Timer */}
          <div className="flex flex-col items-center gap-4">
            <div
              className={cn(
                "text-8xl font-black font-outfit tabular-nums transition-all",
                isWork ? theme.text : "text-muted-foreground",
              )}
            >
              {formattedTime}
            </div>
            <span
              className={cn(
                "text-[10px] font-bold px-4 py-1.5 rounded-full border",
                isWork
                  ? cn(theme.bg, theme.border, theme.text)
                  : "bg-muted border-border text-muted-foreground",
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
                "px-6 h-11 font-black transition-all rounded-xl text-sm font-outfit",
                isWork
                  ? cn(theme.solid, theme.solidHover, "text-white")
                  : "bg-muted hover:bg-muted/80 text-foreground",
              )}
            >
              {state?.isRunning ? (
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
              onClick={() =>
                actions.stopTimer((cycles, workMins) => {
                  setPromptLinkData({
                    cyclesCompleted: cycles,
                    workMinutes: workMins,
                  });
                })
              }
              disabled={!state?.isRunning && state?.cyclesCompleted === 0}
              className="h-11 border border-border hover:bg-accent/50 font-bold px-6 rounded-xl transition-all text-muted-foreground disabled:opacity-30 text-sm"
            >
              <Square className="w-4 h-4 mr-2 fill-current" /> Parar
            </Button>
          </div>

          {/* Calibração */}
          <div className="w-full pt-10 border-t border-border/50">
            <div className="flex gap-6 w-full max-w-sm mx-auto">
              <div className="flex-1 space-y-2.5">
                <p className="text-[10px] font-bold text-neutral-600 text-centerer">
                  Minutos de Foco
                </p>
                <div className="relative group">
                  <Input
                    type="number"
                    value={state?.workMinutes || 25}
                    onChange={(e) =>
                      actions.updateConfig("workMinutes", e.target.value)
                    }
                    disabled={state?.isRunning}
                    className={cn(
                      "bg-background h-11 border border-border text-lg font-black text-center rounded-xl transition-all font-outfit disabled:opacity-50",
                      theme.borderHover.replace("hover:", "focus:"),
                    )}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2.5">
                <p className="text-[10px] font-bold text-neutral-600 text-centerer">
                  Minutos de Pausa
                </p>
                <div className="relative group">
                  <Input
                    type="number"
                    value={state?.breakMinutes || 5}
                    onChange={(e) =>
                      actions.updateConfig("breakMinutes", e.target.value)
                    }
                    disabled={state?.isRunning}
                    className={cn(
                      "bg-background h-11 border border-border text-lg font-black text-center rounded-xl transition-all font-outfit disabled:opacity-50",
                      theme.borderHover.replace("hover:", "focus:"),
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div className="sticky top-0 h-fit overflow-hidden">
          <PomoHistory
            history={history}
            onClear={actions.clearHistory}
            onLinkToStudies={(cycles, workMins) =>
              setLinkData({
                cyclesCompleted: cycles,
                workMinutes: workMins,
              })
            }
          />
        </div>
      </div>

      {/* Confirmação antes de abrir o modal de vinculação */}
      {promptLinkData && (
        <ConfirmModal
          title="Vincular ciclos aos estudos?"
          description={`Você concluiu ${promptLinkData.cyclesCompleted} ${
            promptLinkData.cyclesCompleted === 1 ? "ciclo" : "ciclos"
          } de foco (${
            promptLinkData.cyclesCompleted * promptLinkData.workMinutes
          } min). Gostaria de vincular este tempo a uma matéria de estudos cadastrada?`}
          confirmLabel="Sim, vincular"
          cancelLabel="Agora não"
          variant="default"
          icon={BookOpen}
          onConfirm={() => {
            setLinkData(promptLinkData);
            setPromptLinkData(null);
          }}
          onCancel={() => setPromptLinkData(null)}
        />
      )}

      {/* Modal para vincular a sessão de Pomodoro aos Estudos */}
      {linkData && (
        <PomodoroLinkStudyModal
          isOpen={!!linkData}
          onClose={() => setLinkData(null)}
          cyclesCompleted={linkData.cyclesCompleted}
          workMinutes={linkData.workMinutes}
        />
      )}
    </div>
  );
}
