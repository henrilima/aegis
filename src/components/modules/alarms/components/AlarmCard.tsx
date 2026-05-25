"use client";

import {
  Bell,
  Check,
  Clock,
  Settings2,
  Timer,
  Trash2,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import {
  cn,
  getColorTheme,
  HEX_COLORS,
  type ThemeColorKey,
  toHoverClass,
} from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { getNextAlarmSummary } from "../alarmSchedule";
import { type AppAlarm, AVAILABLE_ICONS } from "../types";

interface AlarmCardProps {
  alarm: AppAlarm;
  onEdit: (alarm: AppAlarm) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number, enabled: boolean) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
}

export function AlarmCard({
  alarm: a,
  onEdit,
  onDelete,
  onToggle,
  selectionMode,
  selected,
  onSelect,
}: AlarmCardProps) {
  const moduleColor = getModuleColor("alarms");
  const moduleTheme = getColorTheme(moduleColor);
  const IconComp = AVAILABLE_ICONS.find((i) => i.name === a.icon)?.icon || Bell;
  const colors = getColorTheme(a.color || moduleColor);
  const nextTrigger = a.enabled ? getNextAlarmSummary(a) : null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: bulk select
    // biome-ignore lint/a11y/noStaticElementInteractions: bulk select
    <div
      onClick={() => {
        if (selectionMode && a.id && onSelect) {
          onSelect(a.id);
        }
      }}
      className={cn(
        "group bg-card border rounded-2xl p-5 transition-all relative overflow-hidden",
        a.enabled ? colors.border : "border-border",
        selectionMode ? "cursor-pointer" : "",
        selected && selectionMode ? cn(moduleTheme.border, moduleTheme.bg) : "",
        !a.enabled && "opacity-75",
        a.enabled && !selectionMode && colors.borderHover,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "p-3 rounded-2xl border transition-all",
              a.enabled
                ? `${colors.bg} ${colors.border} ${colors.text}`
                : "bg-accent border-border text-muted-foreground",
            )}
          >
            <IconComp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-base font-medium leading-tight">{a.title}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {a.alarmType === "fixed" ? (
                <Clock className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Timer className={cn("w-3 h-3", colors.text)} />
              )}
              <span className="text-xs text-muted-foreground font-medium">
                {a.alarmType === "fixed"
                  ? a.time
                  : `A cada ${a.intervalMinutes}m (a partir das ${a.time})`}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
              <Clock className={cn("w-3 h-3", a.enabled && colors.text)} />
              <span>
                {nextTrigger
                  ? `Proximo disparo: ${nextTrigger.label}`
                  : "Sem proximo disparo enquanto desativado"}
              </span>
            </div>
          </div>
        </div>
        {selectionMode ? (
          <div
            className={cn(
              "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
              selected
                ? cn(moduleTheme.solid, moduleTheme.border, "text-white")
                : "border-border bg-background",
            )}
          >
            {selected && <Check className="w-3.5 h-3.5" />}
          </div>
        ) : (
          <Switch
            checked={a.enabled}
            onCheckedChange={(val) => a.id && onToggle(a.id, val)}
            style={
              {
                "--switch-checked-bg":
                  HEX_COLORS[(a.color || moduleColor) as ThemeColorKey],
              } as React.CSSProperties
            }
          />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
          <Volume2 className="w-3 h-3" />
          {a.soundFile.replace(".mp3", "")}
        </div>
        {!selectionMode && (
          <div className="flex bg-background/50 rounded-xl border border-border overflow-hidden shrink-0">
            <ToolTip content="Editar">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "p-2.5 text-neutral-600 transition-all border-r border-border active:scale-95",
                  colors.bgHover,
                  toHoverClass(colors.text),
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(a);
                }}
              >
                <Settings2 className="w-3.5 h-3.5" />
              </Button>
            </ToolTip>
            <ToolTip content="Excluir">
              <Button
                variant="ghost"
                size="icon"
                className="p-2.5 hover:bg-rose-600/10 hover:text-rose-500 text-neutral-600 transition-all active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  a.id && onDelete(a.id);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </ToolTip>
          </div>
        )}
      </div>
    </div>
  );
}
