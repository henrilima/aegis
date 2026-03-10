"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNew: () => void;
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
}: CalendarHeaderProps) {
  const label = new Date(year, month).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20">
          <CalendarDays className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none">Cronograma</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gestão de eventos e prazos
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Controles de Navegação Mensal */}
        <div className="flex items-center bg-neutral-800 border border-neutral-700 rounded-xl p-1 gap-1">
          <Button
            type="button"
            variant="ghost"
            onClick={onPrev}
            className="w-8 h-8 p-0 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all border-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold text-neutral-300 capitalize min-w-[130px] text-center px-2">
            {label}
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={onNext}
            className="w-8 h-8 p-0 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all border-none"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onToday}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition-all text-xs font-bold h-auto"
        >
          Hoje
        </Button>

        <Button
          type="button"
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors border-none h-auto"
        >
          <Plus className="w-4 h-4" /> Novo Evento
        </Button>
      </div>
    </div>
  );
}
