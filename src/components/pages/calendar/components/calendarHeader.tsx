"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Milestone,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getColorTheme } from "@/lib/utils";

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
}: CalendarHeaderProps) {
  const themeStyles = getColorTheme("green");
  const label = new Date(year, month).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl ${themeStyles.bg} border ${themeStyles.border}`}
        >
          <CalendarDays className={`w-5 h-5 ${themeStyles.textSub}`} />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground leading-none">
            Calendário
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">
            Gestão de eventos e feriados
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSyncHolidays}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:${themeStyles.bg} text-muted-foreground hover:${themeStyles.textSub} border border-border transition-all text-xs font-bold h-10 cursor-pointer`}
        >
          <RefreshCw className="w-4 h-4" /> Sincronizar
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onToggleHolidays}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-bold h-10 cursor-pointer ${
            showHolidays
              ? `${themeStyles.bg} ${themeStyles.textSub} ${themeStyles.border.replace("20", "40")}`
              : `bg-card text-muted-foreground border-border hover:${themeStyles.textSub}`
          }`}
        >
          <Milestone className="w-4 h-4" /> Feriados
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onToday}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:${themeStyles.bg} text-muted-foreground hover:${themeStyles.textSub} border border-border transition-all text-xs font-bold h-10 cursor-pointer`}
        >
          Hoje
        </Button>

        {/* Controles de Navegação Mensal */}
        <div className="flex items-center bg-background border border-border rounded-xl p-1 gap-1 h-10">
          <Button
            type="button"
            variant="ghost"
            onClick={onPrev}
            className="w-8 h-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all border-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold text-muted-foreground capitalize min-w-[130px] text-center px-2">
            {label}
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={onNext}
            className="w-8 h-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all border-none"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Button
          type="button"
          onClick={onNew}
          className={`flex items-center gap-2 px-4 rounded-xl text-white text-xs font-bold transition-all border-none h-10 cursor-pointer active:scale-95 ${themeStyles.solid} ${themeStyles.solidHover}`}
        >
          <Plus className="w-4 h-4" /> Novo Evento
        </Button>
      </div>
    </div>
  );
}
