"use client";

import { BookOpen, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { PomodoroHistory } from "./types";

interface PomoHistoryProps {
  history: PomodoroHistory[];
  onClear: () => void;
  onLinkToStudies?: (cyclesCompleted: number, workMinutes: number) => void;
}

export function PomoHistory({
  history,
  onClear,
  onLinkToStudies,
}: PomoHistoryProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const color = getModuleColor("pomodoro");
  const theme = getColorTheme(color);

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-muted-foreground">Histórico</p>
        {history.length > 0 && (
          <ToolTip content="Limpar histórico">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </ToolTip>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-8 text-neutral-500 text-xs font-medium">
          <p>Nenhum registro no histórico</p>
        </div>
      ) : (
        <ul className="space-y-3 overflow-auto max-h-72 custom-scrollbar pr-1">
          {history.map((h) => (
            <li
              key={h.id}
              className={cn(
                "flex flex-col gap-2 p-3 bg-card/60 border border-border/70 rounded-xl transition-all",
                theme.borderHover,
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {h.cyclesDone} {h.cyclesDone === 1 ? "ciclo" : "ciclos"}{" "}
                  <span className="text-[10px] text-muted-foreground font-normal">
                    ({h.workMinutes * h.cyclesDone} min foco)
                  </span>
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">
                  {new Date(h.endTime).toLocaleDateString("pt-BR")}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <span className="text-[10px] text-neutral-500 font-medium">
                  Config: {h.workMinutes}/{h.breakMinutes}m
                </span>

                {onLinkToStudies && (
                  <button
                    type="button"
                    onClick={() => onLinkToStudies(h.cyclesDone, h.workMinutes)}
                    className={cn(
                      "px-2 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer",
                      theme.bg,
                      theme.text,
                      theme.border,
                      theme.bgHover,
                    )}
                  >
                    <BookOpen className="w-3 h-3" />
                    Vincular aos estudos
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showClearConfirm && (
        <ConfirmModal
          title="Limpar histórico do Pomodoro?"
          description="Todo o histórico de ciclos de foco registrados será removido permanentemente."
          confirmLabel="Limpar histórico"
          cancelLabel="Agora não"
          variant="danger"
          icon={Trash2}
          onConfirm={() => {
            onClear();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}
