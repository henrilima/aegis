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
        <Button
          type="button"
          variant="outline"
          onClick={onToday}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-green-400 border border-neutral-800 transition-all text-xs font-bold h-10 cursor-pointer"
        >
          Hoje
        </Button>

        {/* Controles de Navegação Mensal */}
        <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-1 gap-1 h-10">
          <Button
            type="button"
            variant="ghost"
            onClick={onPrev}
            className="w-8 h-8 p-0 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all border-none"
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
            className="w-8 h-8 p-0 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all border-none"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <Button
          type="button"
          onClick={onNew}
          className="flex items-center gap-2 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors border-none h-10 shadow-lg shadow-green-900/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Novo Evento
        </Button>
      </div>
    </div>
  );
}
