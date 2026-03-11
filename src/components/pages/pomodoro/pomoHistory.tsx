import { Trash2 } from "lucide-react";
import type { PomodoroHistory } from "./types";

interface PomoHistoryProps {
  history: PomodoroHistory[];
  onClear: () => void;
}

export function PomoHistory({ history, onClear }: PomoHistoryProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black uppercase  text-neutral-500">
          Histórico
        </p>
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 rounded-lg text-neutral-700 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
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
              className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0"
            >
              <span className="text-xs font-semibold">
                {h.cycles_done} ciclo{h.cycles_done !== 1 ? "s" : ""} ·{" "}
                {h.work_minutes}/{h.break_minutes}m
              </span>
              <span className="text-[10px] text-neutral-600">
                {new Date(h.end_time).toLocaleDateString("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
