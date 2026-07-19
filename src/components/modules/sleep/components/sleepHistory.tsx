"use client";

import { Moon, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme, toHoverClass } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
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
  const color = getModuleColor("sleep");
  const theme = getColorTheme(color);
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Moon}
        title="Nenhum ciclo registrado"
        description="Seu histórico de sono aparecerá aqui. Comece registrando sua última noite de descanso."
        className="py-12 bg-card border border-border rounded-xl"
      />
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 transition-all hover:border-border/80">
      <h2 className="text-sm font-bold text-muted-foreground mb-4">{title}</h2>
      <div className="flex flex-col gap-3">
        {entries.map((e) => (
          <div
            key={e.id}
            className="flex items-center gap-3 py-3 border-b border-border last:border-0 hover:bg-accent/50/10 transition-colors"
          >
            {/* Indicador visual simples de meta batida (ou não) */}
            <div
              className={cn(
                "w-1 self-stretch rounded-full",
                e.durationMinutes >= targetMinutes
                  ? theme.solid
                  : "bg-muted-foreground/20",
              )}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {parseDate(e.date).toLocaleDateString("pt-BR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <span className="text-xs text-muted-foreground/80 font-medium">
                  {e.bedtime} → {e.wakeTime}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className={cn("text-sm font-bold", theme.text)}>
                  {formatDuration(e.durationMinutes)}
                  {e.nap_minutes && e.nap_minutes > 0 ? (
                    <span className="text-[11px] text-neutral-500 font-bold ml-1">
                      (+{formatDuration(e.nap_minutes)} soneca)
                    </span>
                  ) : null}
                </span>
                <SleepStars quality={e.quality} />
                <span
                  className={`text-xs font-bold ${qualityColor(e.quality)}`}
                >
                  {qualityLabel(e.quality)}
                </span>
              </div>
              {(e.caffeine || e.screens || e.alcohol || e.exercise) && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 select-none">
                  {e.caffeine && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      ☕ Cafeína
                    </span>
                  )}
                  {e.screens && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20">
                      📱 Telas
                    </span>
                  )}
                  {e.alcohol && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      🍺 Álcool
                    </span>
                  )}
                  {e.exercise && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      🏋️ Exercício
                    </span>
                  )}
                </div>
              )}
              {e.note && (
                <p className="text-xs text-muted-foreground mt-1.5">{e.note}</p>
              )}
            </div>

            {/* Ações Padronizadas */}
            <div className="flex bg-background/50 rounded-lg border border-border overflow-hidden shrink-0">
              <ToolTip content="Editar registro">
                <button
                  type="button"
                  onClick={() => onEdit(e)}
                  className={cn(
                    "p-2 transition-all border-r border-border active:scale-95 text-neutral-600",
                    theme.bgHover,
                    toHoverClass(theme.text),
                  )}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </ToolTip>
              <ToolTip content="Excluir registro">
                <button
                  type="button"
                  onClick={() => e.id && onDelete(e.id)}
                  className="p-2 hover:bg-rose-600/10 hover:text-rose-500 text-neutral-600 transition-all active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </ToolTip>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
