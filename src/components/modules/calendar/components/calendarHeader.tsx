"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Milestone,
  Plus,
  RefreshCw,
} from "lucide-react";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { Button } from "@/components/ui/button";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface CalendarHeaderProps {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNew: () => void;
  onSyncHolidays: () => void;
  showHolidays: boolean;
  onToggleHolidays: () => void;
  onTitleClick?: () => void;
  viewMode?: "month" | "week";
  onViewModeChange?: (mode: "month" | "week") => void;
  weekLabel?: string;
}

/**
 * Cabeçalho do Calendário: Navegação temporal e criação de eventos
 */
export function CalendarHeader({
  month,
  year,
  onPrev,
  onNext,
  onToday,
  onNew,
  onSyncHolidays,
  showHolidays,
  onToggleHolidays,
  onTitleClick,
  viewMode = "month",
  onViewModeChange,
  weekLabel,
}: CalendarHeaderProps) {
  const color = getModuleColor("calendar");
  const theme = getColorTheme(color);
  const label =
    viewMode === "week" && weekLabel
      ? weekLabel
      : new Date(year, month).toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        });

  return (
    <div className="flex flex-col gap-4">
      <ModuleHeader
        moduleId="calendar"
        color={color}
        title="Calendário"
        subtitle="Gestão de eventos e feriados"
        icon={CalendarDays}
        onTitleClick={onTitleClick}
        titleHoverIcon={HelpCircle}
        titleTooltip="Visualizar Guia de Agenda"
        actions={[
          {
            id: "sync",
            label: "Sincronizar",
            icon: RefreshCw,
            onClick: onSyncHolidays,
          },
          {
            id: "holidays",
            label: "Feriados",
            icon: Milestone,
            onClick: onToggleHolidays,
            tooltip: showHolidays ? "Ocultar Feriados" : "Mostrar Feriados",
          },
          {
            id: "new",
            label: "Novo Evento",
            icon: Plus,
            primary: true,
            onClick: onNew,
          },
        ]}
      />

      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-2 shrink-0">
        <div className="flex items-center gap-1.5 bg-background border border-border/60 rounded-xl p-1">
          <Button
            type="button"
            variant="ghost"
            onClick={onPrev}
            className="w-9 h-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 flex items-center justify-center min-w-35">
            <span className="text-xs font-black text-foreground capitalize">
              {label}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onNext}
            className="w-9 h-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternador de Visualização */}
          <div className="flex items-center gap-1 bg-background border border-border/60 rounded-xl p-1">
            <button
              type="button"
              onClick={() => onViewModeChange?.("month")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none",
                viewMode === "month"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/40",
              )}
            >
              Mês
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange?.("week")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none",
                viewMode === "week"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/40",
              )}
            >
              Semana
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onToday}
            className={cn(
              "px-4 h-9 rounded-xl border font-bold text-xs transition-all active:scale-95",
              theme.bg,
              theme.text,
              theme.border,
              theme.bgHover,
            )}
          >
            Hoje
          </Button>
        </div>
      </div>
    </div>
  );
}
