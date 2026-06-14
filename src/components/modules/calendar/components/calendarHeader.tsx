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
  onShowInfo: () => void;
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
  onShowInfo,
}: CalendarHeaderProps) {
  const color = getModuleColor("calendar");
  const theme = getColorTheme(color);
  const label = new Date(year, month).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-4">
      <ModuleHeader
        color={color}
        title="Calendário"
        subtitle="Gestão de eventos e feriados"
        icon={CalendarDays}
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
            id: "info",
            icon: HelpCircle,
            onClick: onShowInfo,
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

      <div className="flex items-center justify-between bg-card/30 border border-border/50 rounded-2xl p-2 shrink-0">
        <div className="flex items-center gap-1.5 bg-background/50 border border-border/40 rounded-xl p-1">
          <Button
            type="button"
            variant="ghost"
            onClick={onPrev}
            className="w-9 h-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 flex items-center justify-center min-w-[140px]">
            <span className="text-xs font-black text-foreground uppercase">
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
  );
}
