"use client";

import { AlarmClock, Bell, Clock, Plus } from "lucide-react";
import type React from "react";
import {
  getNextAlarmSummary,
  sortByNextTrigger,
} from "@/components/modules/alarms/alarmSchedule";
import { AlarmFormModal } from "@/components/modules/alarms/components/AlarmFormModal";
import {
  type AlarmFormState,
  useAlarmsLogic,
} from "@/components/modules/alarms/hooks/useAlarmsLogic";
import { Button } from "@/components/ui/button";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { AppAlarm } from "../../../alarms/types";
import { BaseWidget } from "../BaseWidget";

interface AlarmsWidgetProps {
  alarms: AppAlarm[];
  onAddAlarm?: (alarm: AlarmFormState) => void;
  limit?: number;
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

export function AlarmsWidget({
  alarms: _propsAlarms, // Usamos os alarmes vindos do hook para consistência
  onAddAlarm,
  limit,
  isEditMode,
  isInteractive,
  onToggleInteractive,
}: AlarmsWidgetProps) {
  const color = getModuleColor("alarms");
  const theme = getColorTheme(color);

  // Reutilizamos a lógica do módulo de alarmes
  const {
    alarms,
    isModalOpen,
    setIsModalOpen,
    isSaving,
    form,
    availableSounds,
    setTitle,
    setAlarmType,
    setTime,
    setIntervalMinutes,
    setSoundFile,
    setIconName,
    setColor,
    playPreview,
    resetForm,
  } = useAlarmsLogic();

  const enabledCount = alarms.filter((a) => a.enabled).length;

  const sortedAlarms = sortByNextTrigger(alarms);
  const nextAlarm = sortedAlarms.find((a) => a.enabled);
  const nextAlarmSummary = nextAlarm ? getNextAlarmSummary(nextAlarm) : null;

  return (
    <>
      <BaseWidget
        title="Alarmes"
        icon={AlarmClock}
        color={color}
        route="alarms"
        isEditMode={isEditMode}
        isInteractive={isInteractive}
        onToggleInteractive={onToggleInteractive}
      >
        <div className="flex flex-col gap-[6cqw] @sm:gap-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-[4cqw] @sm:gap-4">
              <div className="text-left">
                <p className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                  {enabledCount}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                  Ativos
                </p>
              </div>
              <div className="w-px h-8 bg-muted" />
              <div className="text-left">
                <p className="text-2xl @sm:text-3xl font-bold text-foreground leading-none">
                  {alarms.length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">
                  Total
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
                <span className="hidden @sm:inline">Novo</span>
              </Button>
            )}
          </div>

          <div className="space-y-[2cqw] @sm:space-y-2">
            {nextAlarm ? (
              <div className="p-[2.5cqw] @sm:p-2.5 rounded-xl border border-border/40 bg-neutral-900/10 hover:bg-neutral-900/20 transition-all text-left animate-pulse-subtle flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 p-2 rounded-xl bg-neutral-900/40 border border-border/30 text-rose-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-foreground truncate">
                      {nextAlarm.title}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                      Próximo alerta
                    </span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-900/30 border border-border/30 min-w-[72px] text-left">
                  <span
                    className={cn(
                      "block text-xs font-bold leading-none",
                      theme.text,
                    )}
                  >
                    {nextAlarmSummary?.shortLabel}
                  </span>
                  <span className="text-[9px] font-semibold text-neutral-500 block mt-1">
                    {nextAlarmSummary?.label.startsWith("Hoje")
                      ? "Hoje"
                      : "Amanha"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-600 italic px-1">
                Nenhum alarme ativo no momento
              </p>
            )}

            <div className="mt-2 space-y-1.5">
              {alarms
                .filter((a) => a.id !== nextAlarm?.id)
                .slice(0, limit ?? 2)
                .map((a) => (
                  <div
                    key={`a-key${a.id}`}
                    className={cn(
                      "flex items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-border/40 bg-neutral-900/10 hover:bg-neutral-900/20 hover:border-border/60 transition-all gap-4 text-left",
                      !a.enabled && "opacity-50",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="shrink-0 p-2 rounded-xl bg-neutral-900/40 border border-border/30 text-rose-400">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-bold text-foreground truncate">
                          {a.title}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                          {a.enabled ? "Alarme ativo" : "Desativado"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-900/30 border border-border/30 min-w-[72px] text-left">
                      <span
                        className={cn(
                          "block text-xs font-bold leading-none",
                          a.enabled ? theme.text : "text-zinc-500",
                        )}
                      >
                        {a.alarmType === "fixed"
                          ? a.time
                          : `${a.intervalMinutes}m`}
                      </span>
                      <span className="text-[9px] font-semibold text-neutral-500 block mt-1">
                        {a.alarmType === "fixed" ? "Horário" : "Intervalo"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </BaseWidget>

      <AlarmFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        form={form}
        availableSounds={availableSounds}
        isSaving={isSaving}
        onSave={() => {
          onAddAlarm?.(form);
          resetForm();
        }}
        onCancel={resetForm}
        setTitle={setTitle}
        setAlarmType={setAlarmType}
        setTime={setTime}
        setIntervalMinutes={setIntervalMinutes}
        setSoundFile={setSoundFile}
        setIconName={setIconName}
        setColor={setColor}
        playPreview={playPreview}
      />
    </>
  );
}
