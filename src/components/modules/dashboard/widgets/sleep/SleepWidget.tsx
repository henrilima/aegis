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

          <div className="space-y-[1.5cqw] @sm:space-y-1.5 mt-1">
            {recentSleep.slice(0, 3).map((e, i) => (
              <div
                key={e.id ?? i}
                className="flex items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-neutral-200/60 dark:border-border/40 bg-neutral-100 dark:bg-neutral-900/10 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/20 hover:border-neutral-300/60 dark:hover:border-border/60 transition-all gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 p-2 rounded-xl bg-neutral-200 dark:bg-neutral-900/40 border border-neutral-300/40 dark:border-border/30 text-cyan-500">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-foreground truncate">
                      Registro de Sono
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                      {formatDateShort(e.date)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-200/70 dark:bg-neutral-900/30 border border-neutral-300/40 dark:border-border/30 min-w-[72px] text-left">
                  <span
                    className={cn(
                      "block text-xs font-bold leading-none",
                      theme.text,
                    )}
                  >
                    {formatDurationMin(e.durationMinutes)}
                  </span>
                  <div className="flex items-center gap-0.5 mt-1">
                    <Star
                      className={cn(
                        "w-2.5 h-2.5 fill-current",
                        e.quality >= 4
                          ? "text-emerald-600 dark:text-emerald-500"
                          : e.quality >= 3
                            ? "text-amber-600 dark:text-amber-500"
                            : "text-rose-500 dark:text-rose-450",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[9px] font-semibold",
                        e.quality >= 4
                          ? "text-emerald-600 dark:text-emerald-500"
                          : e.quality >= 3
                            ? "text-amber-600 dark:text-amber-500"
                            : "text-rose-500 dark:text-rose-450",
                      )}
                    >
                      {e.quality}/5 Q.
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentSleep.length === 0 && (
              <p className="text-xs text-neutral-600 italic">
                Sem registros recentes
              </p>
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
