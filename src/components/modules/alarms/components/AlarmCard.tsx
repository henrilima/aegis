"use client";

import {
  Bell,
  Check,
  Clock,
  MessageSquare,
  Monitor,
  Pencil,
  Timer,
  Trash2,
  Volume2,
} from "lucide-react";
import { getSystemIcon } from "@/components/global/IconSelect";
import { Switch } from "@/components/ui/switch";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { soundLabel } from "@/lib/sounds";
import { cn, getColorTheme, HEX_COLORS, type ThemeColorKey } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { getNextAlarmSummary } from "../alarmSchedule";
import type { AppAlarm } from "../types";

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
  const IconComp = getSystemIcon(a.icon);
  const colors = getColorTheme(a.color || moduleColor);
  const nextTrigger = a.enabled ? getNextAlarmSummary(a) : null;

  const modesStr = a.triggerMode || "widget";
  const activeModes = modesStr.split(",").map((s) => s.trim());
  const modeLabels = [
    { id: "widget", label: "Widget", icon: Monitor },
    { id: "system", label: "Sistema", icon: Bell },
    { id: "in_app", label: "In-App", icon: MessageSquare },
  ].filter((m) => activeModes.includes(m.id));

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
        "group bg-card/60 border border-border rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 hover:bg-card",
        a.enabled ? colors.border : "border-border",
        selectionMode && "cursor-pointer",
        selected && selectionMode && cn(moduleTheme.border, moduleTheme.bg),
        !a.enabled && "opacity-75",
        a.enabled && !selectionMode && colors.borderHover,
      )}
    >
      {/* Nível 1: Cabeçalho com Ícone, Título, Modo de Disparo e Switch */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
          <div
            className={cn(
              "p-2 rounded-lg border transition-colors shrink-0",
              a.enabled
                ? `${colors.bg} ${colors.border} ${colors.text}`
                : "bg-muted/40 border-border text-muted-foreground",
            )}
          >
            <IconComp className="w-4 h-4" />
          </div>

          <h3 className="text-sm font-bold text-foreground truncate max-w-45">
            {a.title}
          </h3>

          <div className="flex items-center gap-1 flex-wrap">
            {modeLabels.map((m) => (
              <span
                key={m.id}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 whitespace-nowrap",
                  colors.bg,
                  colors.text,
                  colors.border,
                )}
              >
                <m.icon className="w-3 h-3" />
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Ações / Switch */}
        <div className="flex items-center gap-2 shrink-0">
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
      </div>

      {/* Barra Integrada de Métricas (Horário, Frequência, Som) */}
      <div className="flex items-center justify-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs flex-wrap">
        {/* Horário / Frequência */}
        <div className="flex items-center gap-1.5 shrink-0">
          {a.alarmType === "fixed" ? (
            <Clock
              className={cn(
                "w-3.5 h-3.5",
                a.enabled ? colors.text : "text-muted-foreground",
              )}
            />
          ) : (
            <Timer
              className={cn(
                "w-3.5 h-3.5",
                a.enabled ? colors.text : "text-muted-foreground",
              )}
            />
          )}
          <span
            className={cn(
              "font-bold",
              a.enabled ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {a.alarmType === "fixed"
              ? a.time
              : `${a.time} (${a.intervalMinutes}m)`}
          </span>
        </div>

        {/* Próximo Disparo */}
        <div className="flex items-center gap-1.5 shrink-0 border-l border-border/40 pl-3 text-muted-foreground font-medium">
          <span>{nextTrigger ? nextTrigger.label : "Desativado"}</span>
        </div>

        {/* Som de Alarme */}
        <div className="flex items-center gap-1.5 shrink-0 border-l border-border/40 pl-3 text-muted-foreground font-medium">
          <Volume2 className="w-3 h-3 text-muted-foreground/70" />
          <span>{soundLabel(a.soundFile)}</span>
        </div>
      </div>

      {/* Linha de Ações no Rodapé (Edição e Exclusão) */}
      {!selectionMode && (
        <div className="flex items-center justify-end gap-1 border-t border-border/40 pt-2">
          <ToolTip content="Editar alarme">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(a);
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </ToolTip>
          <ToolTip content="Excluir alarme">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                a.id && onDelete(a.id);
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </ToolTip>
        </div>
      )}
    </div>
  );
}
