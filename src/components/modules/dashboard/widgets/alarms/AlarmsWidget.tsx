"use client";

import { AlarmClock, Bell, Clock, Plus } from "lucide-react";
import type React from "react";
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
  isEditMode?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
}

export function AlarmsWidget({
  alarms: _propsAlarms, // Usamos os alarmes vindos do hook para consistência
  onAddAlarm,
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

  // Encontra o próximo alarme
  const nextAlarm = [...alarms]
    .filter((a) => a.enabled)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

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
              <div className="text-center">
                <p className="text-2xl font-black text-foreground leading-none">
                  {enabledCount}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                  Ativos
                </p>
              </div>
              <div className="w-px h-6 bg-muted" />
              <div className="text-center">
                <p className="text-2xl font-black text-foreground leading-none">
                  {alarms.length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
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
              <div
                className={cn(
                  "p-4 rounded-xl border animate-pulse-subtle",
                  theme.bg,
                  theme.border,
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("text-[10px] font-bold", theme.text)}>
                    Próximo alerta
                  </span>
                  <Clock className={cn("w-3 h-3 opacity-50", theme.text)} />
                </div>
                <p className="text-sm font-bold text-foreground truncate">
                  {nextAlarm.title}
                </p>
                <p className={cn("text-lg font-black", theme.text)}>
                  {nextAlarm.alarmType === "fixed"
                    ? nextAlarm.time
                    : `A cada ${nextAlarm.intervalMinutes}m`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-neutral-600 italic px-1">
                Nenhum alarme ativo no momento
              </p>
            )}

            <div className="mt-2 space-y-1.5">
              {alarms
                .filter((a) => a.id !== nextAlarm?.id)
                .slice(0, 1)
                .map((a) => (
                  <div
                    key={`a-key${a.id}`}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg bg-neutral-800/20 border border-border/40",
                      !a.enabled && "opacity-50",
                    )}
                  >
                    <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground flex-1 truncate">
                      {a.title}
                    </span>
                    <span className="text-xs font-black text-foreground">
                      {a.alarmType === "fixed"
                        ? a.time
                        : `${a.intervalMinutes}m`}
                    </span>
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
