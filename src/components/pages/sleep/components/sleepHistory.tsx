"use client";

import { Pencil, Trash2 } from "lucide-react";
import {
  formatDuration,
  parseDate,
  qualityColor,
  qualityLabel,
} from "../sleepUtils";
import type { SleepEntry } from "../types";
import { SleepStars } from "./sleepStars";

interface SleepHistoryProps {
  entries: SleepEntry[];
  targetMinutes: number;
  onEdit: (e: SleepEntry) => void;
  onDelete: (id: number) => void;
  title?: string;
}

/**
 * Listagem dos registros históricos de sono com ações de edição e exclusão
 */
export function SleepHistory({
  entries,
  targetMinutes,
  onEdit,
  onDelete,
  title = "Registros de sono",
}: SleepHistoryProps) {
  if (entries.length === 0) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
      <h2 className=" font-black uppercase text-neutral-400 mb-3">{title}</h2>
      <div className="flex flex-col gap-2">
        {entries.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-3 py-2 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/10 transition-colors"
          >
            {/* Indicador visual simples de meta batida (ou não) */}
            <div
              className={`w-1 self-stretch rounded-full ${
                e.duration_minutes >= targetMinutes
                  ? "bg-blue-500"
                  : "bg-orange-500/50"
              }`}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className=" font-semibold text-white">
                  {parseDate(e.date).toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">
                  {e.bedtime} → {e.wake_time}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-blue-400 font-bold">
                  {formatDuration(e.duration_minutes)}
                </span>
                <SleepStars quality={e.quality} />
                <span
                  className={`text-[11px] font-semibold ${qualityColor(e.quality)}`}
                >
                  {qualityLabel(e.quality)}
                </span>
              </div>
              {e.note && (
                <p className="text-[11px] text-neutral-600 truncate mt-0.5">
                  {e.note}
                </p>
              )}
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(e)}
                className="p-1.5 rounded-lg text-neutral-600 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => e.id && onDelete(e.id)}
                className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
