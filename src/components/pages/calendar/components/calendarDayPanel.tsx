"use client";

import {
  AlertTriangle,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CalendarEvent, DeadlineCategory } from "../types";
import {
  DEADLINE_COLORS,
  DEADLINE_LABELS,
  daysUntil,
  formatDaysUntil,
} from "../types";

interface CalendarDayPanelProps {
  date: string;
  events: CalendarEvent[];
  onEdit: (ev: CalendarEvent) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

/**
 * Painel Lateral de Agenda: Detalhamento de compromissos para a data selecionada
 */
export function CalendarDayPanel({
  date,
  events,
  onEdit,
  onDelete,
  onClose,
}: CalendarDayPanelProps) {
  const [y, m, d] = date.split("-").map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-6 sticky top-4 shadow-2xl animate-in slide-in-from-right-4 duration-500 overflow-hidden">
      {/* Cabeçalho do Painel */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-950 rounded-xl border border-neutral-800">
            <Calendar className="w-4 h-4 text-neutral-400" />
          </div>
          <span className="text-[10px] font-black text-white uppercase truncate max-w-[180px]">
            {label}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="w-8 h-8 p-0 rounded-lg text-neutral-600 hover:text-white hover:bg-neutral-800 transition-all border-none"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-30">
          <Clock className="w-10 h-10 text-neutral-600" />
          <p className="text-[10px] font-black uppercase text-neutral-600 text-center">
            Sem Registros Cronológicos
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((ev) => {
            const isDeadline = ev.event_type === "deadline";
            const color = isDeadline
              ? DEADLINE_COLORS[
                  (ev.deadline_category ?? "prova") as DeadlineCategory
                ]
              : (ev.color ?? "#6366f1");
            const days = daysUntil(ev.date);

            return (
              <div
                key={ev.id}
                className="group relative rounded-2xl p-4 flex flex-col gap-3 border transition-all hover:translate-x-1 duration-300"
                style={{
                  backgroundColor: `${color}08`,
                  borderColor: `${color}20`,
                }}
              >
                {/* Indicador de Tipo */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isDeadline && (
                        <AlertTriangle
                          className="w-3.5 h-3.5"
                          style={{ color }}
                        />
                      )}
                      <span
                        className="text-sm font-black text-white truncate"
                        style={{ textShadow: `0 0 10px ${color}20` }}
                      >
                        {ev.title}
                      </span>
                    </div>
                    {isDeadline && ev.deadline_category && (
                      <span
                        className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md inline-block"
                        style={{ backgroundColor: `${color}15`, color }}
                      >
                        {
                          DEADLINE_LABELS[
                            ev.deadline_category as DeadlineCategory
                          ]
                        }
                      </span>
                    )}
                  </div>

                  {/* Ações do Registro */}
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onEdit(ev)}
                      className="w-7 h-7 p-0 rounded-lg text-neutral-600 hover:text-white hover:bg-neutral-800 transition-all border-none"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => ev.id != null && onDelete(ev.id)}
                      className="w-7 h-7 p-0 rounded-lg text-neutral-700 hover:text-red-500 hover:bg-red-500/10 transition-all border-none"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Metadados do Registro */}
                <div className="space-y-2">
                  {(ev.time || ev.description) && (
                    <div className="flex flex-col gap-1.5">
                      {ev.time && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-500">
                          <Clock className="w-3 h-3 opacity-50" />
                          <span className="uppercase">{ev.time}</span>
                        </div>
                      )}
                      {ev.description && (
                        <p className="text-[11px] font-bold text-neutral-500 leading-relaxed italic border-l-2 border-neutral-800 pl-3">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  )}

                  {isDeadline && (
                    <div className="pt-2 border-t border-neutral-800/30 flex items-center justify-between">
                      <span
                        className="text-[9px] font-black uppercase"
                        style={{ color }}
                      >
                        Vetor Temporal: {formatDaysUntil(days)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
