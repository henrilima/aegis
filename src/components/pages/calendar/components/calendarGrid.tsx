"use client";

import { useMemo } from "react";
import type { CalendarEvent, DeadlineCategory } from "../types";
import { DEADLINE_COLORS } from "../types";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface CalendarGridProps {
  month: number;
  year: number;
  events: CalendarEvent[];
  selectedDate: string | null;
  onDayClick: (date: string) => void;
}

/**
 * Malha Cronológica: Representação visual do mês com indicadores de densidade de compromissos
 */
export function CalendarGrid({
  month,
  year,
  events,
  selectedDate,
  onDayClick,
}: CalendarGridProps) {
  const today = new Date().toISOString().slice(0, 10);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const startDow = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const grid: Array<{
      date: string;
      day: number;
      isCurrentMonth: boolean;
    }> = [];

    // Dias do mês anterior
    for (let i = startDow - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const mm = String(prevMonth + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      grid.push({
        date: `${prevYear}-${mm}-${dd}`,
        day: d,
        isCurrentMonth: false,
      });
    }

    // Dias do mês atual
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      grid.push({ date: `${year}-${mm}-${dd}`, day: d, isCurrentMonth: true });
    }

    // Dias do próximo mês
    const remaining = 42 - grid.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let d = 1; d <= remaining; d++) {
      const mm = String(nextMonth + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      grid.push({
        date: `${nextYear}-${mm}-${dd}`,
        day: d,
        isCurrentMonth: false,
      });
    }

    return grid;
  }, [month, year]);

  const eventMap = useMemo(() => {
    const m: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!m[ev.date]) m[ev.date] = [];
      m[ev.date].push(ev);
    }
    return m;
  }, [events]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-700">
      {/* Cabeçalho de Dias da Semana */}
      <div className="grid grid-cols-7 bg-neutral-950/50 border-b border-neutral-800">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-4 text-center text-[10px] font-black uppercase text-neutral-600 bg-neutral-950/30"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid de Dias */}
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const dayEvents = eventMap[cell.date] ?? [];
          const isCellToday = cell.date === today;
          const isSelected = cell.date === selectedDate;
          const deadlines = dayEvents.filter(
            (e) => e.event_type === "deadline",
          );
          const normalEvents = dayEvents.filter(
            (e) => e.event_type === "event",
          );

          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onDayClick(cell.date)}
              className={`min-h-[110px] p-2.5 border-b border-r border-neutral-800/40 text-left transition-all cursor-pointer group relative overflow-hidden ${
                isSelected
                  ? "bg-green-500/5 ring-1 ring-inset ring-green-500/20 z-10"
                  : "hover:bg-white/2"
              } ${cell.isCurrentMonth ? "" : "opacity-15 grayscale-[0.5]"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[11px] font-black inline-flex items-center justify-center w-7 h-7 rounded-xl transition-all shadow-sm ${
                    isCellToday
                      ? "bg-green-600 text-white shadow-green-600/20 scale-105"
                      : isSelected
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "text-neutral-500 group-hover:text-neutral-300 group-hover:bg-neutral-800/50"
                  }`}
                >
                  {cell.day}
                </span>

                {/* Dot indicators for quick density check */}
                {dayEvents.length > 0 && !isSelected && (
                  <div className="flex gap-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className="w-1 h-1 rounded-full"
                        style={{
                          backgroundColor:
                            ev.event_type === "deadline"
                              ? DEADLINE_COLORS[
                                  ev.deadline_category as DeadlineCategory
                                ]
                              : ev.color || "#6366f1",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Event Tags */}
              <div className="flex flex-col gap-1">
                {deadlines.slice(0, 2).map((ev) => {
                  const color = ev.deadline_category
                    ? DEADLINE_COLORS[ev.deadline_category as DeadlineCategory]
                    : "#ef4444";
                  return (
                    <div
                      key={ev.id}
                      className="text-[8px] font-black px-2 py-1 rounded-lg truncate border animate-in slide-in-from-left-2"
                      style={{
                        backgroundColor: `${color}15`,
                        color,
                        borderColor: `${color}25`,
                      }}
                    >
                      <span className="opacity-60 mr-1">⚠️</span> {ev.title}
                    </div>
                  );
                })}
                {normalEvents
                  .slice(0, 2 - deadlines.slice(0, 2).length)
                  .map((ev) => (
                    <div
                      key={ev.id}
                      className="text-[8px] font-bold px-2 py-1 rounded-lg truncate border animate-in slide-in-from-left-2"
                      style={{
                        backgroundColor: `${ev.color ?? "#6366f1"}12`,
                        color: ev.color ?? "#6366f1",
                        borderColor: `${ev.color ?? "#6366f1"}20`,
                      }}
                    >
                      {ev.title}
                    </div>
                  ))}
                {dayEvents.length > 2 && (
                  <span className="text-[7px] font-black uppercase text-neutral-700 pl-1 mt-0.5">
                    + {dayEvents.length - 2} Operações
                  </span>
                )}
              </div>

              {/* Subtle background glow for today or selected */}
              {(isCellToday || isSelected) && (
                <div
                  className={`absolute -bottom-1 -right-1 w-12 h-12 blur-2xl opacity-20 pointer-events-none rounded-full ${isCellToday ? "bg-green-500" : "bg-green-400/50"}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
