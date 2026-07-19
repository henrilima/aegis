"use client";

import { Moon, Plus, Star } from "lucide-react";
import { useState } from "react";
import { SleepEntryModal } from "@/components/modules/sleep/components/modals/sleepModals";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { formatDateShort, formatDurationMin } from "../../helpers";
import type { SleepEntry } from "../../types";
import { BaseWidget } from "../BaseWidget";

interface SonoWidgetProps {
  recentSleep: SleepEntry[];
  avgSleepMin: number;
  avgQuality: number;
  goalSleepMin: number | null;
  sleepPct: number;
  sleepDebt?: number;
  onAddSleep?: (entry: SleepEntry) => void;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

export function SonoWidget({
  recentSleep,
  avgSleepMin,
  avgQuality,
  goalSleepMin,
  sleepPct,
  sleepDebt = 0,
  onAddSleep,
  isEditMode,
  isInteractive,
  onToggleInteractive,
}: SonoWidgetProps) {
  const { user } = useAuth();
  const color = getModuleColor("sleep");
  const theme = getColorTheme(color);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <BaseWidget
        title="Sono"
        icon={Moon}
        color={color}
        route="sleep"
        isEditMode={isEditMode}
        isInteractive={isInteractive}
        onToggleInteractive={onToggleInteractive}
      >
        <div className="flex flex-col gap-[4cqw] @sm:gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[6cqw] @sm:gap-6">
              <div className="flex-1 text-left">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                    {avgSleepMin > 0 ? formatDurationMin(avgSleepMin) : "-"}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                  Média
                </p>
              </div>
              <div className="w-px h-8 bg-muted" />
              <div className="flex-1 text-left">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                    {avgQuality}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    /5
                  </span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                  Qualidade
                </p>
              </div>
            </div>

            {isInteractive && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className={cn(
                  "h-7 px-2.5 text-xs font-bold rounded-lg border-none gap-1 active:scale-95 transition-all text-white",
                  theme.solid,
                  theme.solidHover,
                )}
              >
                <Plus className="w-3 h-3" />
                <span className="hidden @sm:inline">Registrar</span>
              </Button>
            )}
          </div>

          {goalSleepMin !== null && avgSleepMin > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-muted-foreground">
                  <span className={theme.text}>
                    {formatDurationMin(avgSleepMin)}
                  </span>{" "}
                  de{" "}
                  <span className={theme.text}>
                    {formatDurationMin(goalSleepMin)}
                  </span>
                </span>
                <span className={theme.text}>{sleepPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    sleepPct >= 90
                      ? "bg-emerald-500"
                      : sleepPct >= 70
                        ? theme.solid
                        : "bg-rose-500 dark:bg-red-500",
                  )}
                  style={{ width: `${sleepPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Alerta de débito acumulado */}
          {sleepDebt > 60 && avgSleepMin > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-rose-500/8 border border-rose-500/20">
              <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400">
                Débito semanal
              </span>
              <span className="text-[10px] font-bold text-rose-500 dark:text-rose-400">
                {formatDurationMin(sleepDebt)}
              </span>
            </div>
          )}

          <div className="space-y-[1.5cqw] @sm:space-y-1.5 mt-1">
            {" "}
            {recentSleep.slice(0, 3).map((e, i) => (
              <div
                key={e.id ?? i}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      "shrink-0 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20",
                      theme.text,
                    )}
                  >
                    <Moon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                    <span className="text-sm font-bold text-foreground truncate">
                      Registro de sono
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {formatDateShort(e.date)}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <Star
                          className={cn(
                            "w-2.5 h-2.5 fill-current",
                            e.quality >= 4
                              ? "text-emerald-500"
                              : e.quality >= 3
                                ? "text-amber-500"
                                : "text-rose-500",
                          )}
                        />
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {e.quality}/5
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <div
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0",
                      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
                    )}
                  >
                    <span>{formatDurationMin(e.durationMinutes)}</span>
                  </div>
                </div>
              </div>
            ))}
            {recentSleep.length === 0 && (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-neutral-600 font-bold">
                  Sem Noites Registradas
                </p>
                <p className="text-[10px] text-neutral-600 font-medium max-w-[180px] mt-1">
                  Adicione seus registros de sono para acompanhar sua qualidade
                  de descanso.
                </p>
              </div>
            )}
          </div>
        </div>
      </BaseWidget>

      <SleepEntryModal
        show={isModalOpen}
        userId={String(user?.id)}
        onSave={async (entry) => {
          onAddSleep?.(entry);
          setIsModalOpen(false);
        }}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
