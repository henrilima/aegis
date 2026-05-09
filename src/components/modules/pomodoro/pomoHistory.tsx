import { Trash2 } from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import type { PomodoroHistory } from "./types";

interface PomoHistoryProps {
  history: PomodoroHistory[];
  onClear: () => void;
}

export function PomoHistory({ history, onClear }: PomoHistoryProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold  text-muted-foreground">
          Histórico
        </p>
        <ToolTip content="Limpar histórico">
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 rounded-lg text-neutral-700 hover:text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </ToolTip>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-8 text-neutral-700">
          <p className="">Sem histórico</p>
        </div>
      ) : (
        <ul className="space-y-2 overflow-auto max-h-72">
          {history.map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-xs font-semibold">
                {h.cyclesDone} ciclo{h.cyclesDone !== 1 ? "s" : ""} ·{" "}
                {h.workMinutes}/{h.breakMinutes}m
              </span>
              <span className="text-[10px] text-neutral-600">
                {new Date(h.endTime).toLocaleDateString("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
