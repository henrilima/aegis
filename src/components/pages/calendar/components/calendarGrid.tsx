"use client";

import { useMemo } from "react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { formatDateLocal } from "@/lib/utils";
import type { CalendarEvent, DeadlineCategory } from "../types";
import { DEADLINE_COLORS } from "../types";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface CalendarGridProps {
  month: number;
  year: number;
  events: CalendarEvent[];
  selectedDate: string | null;
  onDayClick: (date: string) => void;
  onDayDoubleClick: (date: string) => void;
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
  onDayDoubleClick,
}: CalendarGridProps) {
  const today = useMemo(() => formatDateLocal(), []);

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
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-in fade-in duration-700 shadow-xl shadow-black/20">
      {/* Cabeçalho de Dias da Semana */}
      <div className="grid grid-cols-7 bg-neutral-950/50 border-b border-neutral-800">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-4 text-center text-[11px] font-bold text-neutral-500 bg-neutral-950/20"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid de Dias */}
      <div className="grid grid-cols-7 bg-neutral-950/10">
        {cells.map((cell, index) => {
          const dayEvents = eventMap[cell.date] ?? [];
          const isCellToday = cell.date === today;
          const isSelected = cell.date === selectedDate;
          const isSunday = index % 7 === 6;
          const deadlines = dayEvents.filter(
            (e) => e.event_type === "deadline",
          );
          const normalEvents = dayEvents.filter(
            (e) => e.event_type === "event",
          );

          return (
            <ToolTip
              key={cell.date}
              content={
                dayEvents.length > 0 ? (
                  <div className="flex flex-col gap-1.5 p-1 max-w-[200px]">
                    <p className="text-[10px] font-black uppercase text-neutral-400 border-b border-neutral-800 pb-1 mb-1">
                      {new Date(
                        cell.date.split("-").map(Number)[0],
                        cell.date.split("-").map(Number)[1] - 1,
                        cell.date.split("-").map(Number)[2],
                      ).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        weekday: "short",
                      })}
                    </p>
                    {dayEvents.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              ev.event_type === "deadline"
                                ? DEADLINE_COLORS[
                                    ev.deadline_category as DeadlineCategory
                                  ]
                                : ev.color || "#6b7280",
                          }}
                        />
                        <span className="text-[10px] font-bold text-neutral-200 truncate">
                          {ev.title}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null
              }
            >
              <button
                type="button"
                onClick={() => onDayClick(cell.date)}
                onDoubleClick={() => onDayDoubleClick(cell.date)}
                className={`min-h-[110px] p-2.5 border-b border-r border-neutral-800/40 text-left transition-all cursor-pointer group relative overflow-hidden w-full ${
                  isSelected
                    ? "bg-green-500/5 ring-1 ring-inset ring-green-500/10 z-10"
                    : "hover:bg-white/2"
                } ${cell.isCurrentMonth ? "" : "opacity-15 grayscale-[0.8]"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-bold inline-flex items-center justify-center w-7 h-7 rounded-xl transition-all ${
                      isCellToday
                        ? "bg-green-500 text-white shadow-lg shadow-green-600/20 scale-105"
                        : isSelected
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : isSunday
                            ? "text-red-500 group-hover:text-red-400"
                            : "text-neutral-500 group-hover:text-neutral-300"
                    }`}
                  >
                    {cell.day}
                  </span>

                  {/* Pot indicators for density */}
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
                                : ev.color || "#6b7280",
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
                      ? DEADLINE_COLORS[
                          ev.deadline_category as DeadlineCategory
                        ]
                      : "#ef4444";
                    return (
                      <div
                        key={ev.id}
                        className="text-[9px] font-bold px-2 py-1 rounded-lg truncate border animate-in slide-in-from-left-2"
                        style={{
                          backgroundColor: `${color}10`,
                          color,
                          borderColor: `${color}20`,
                        }}
                      >
                        {ev.title}
                      </div>
                    );
                  })}
                  {normalEvents
                    .slice(0, 2 - deadlines.slice(0, 2).length)
                    .map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[9px] font-semibold px-2 py-1 rounded-lg truncate border animate-in slide-in-from-left-2"
                        style={{
                          backgroundColor: `${ev.color ?? "#d4d4d4"}10`,
                          color: ev.color ?? "#a3a3a3",
                          borderColor: `${ev.color ?? "#d4d4d4"}15`,
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[9px] font-medium text-neutral-600 pl-1 mt-0.5">
                      + {dayEvents.length - 2} mais
                    </span>
                  )}
                </div>
              </button>
            </ToolTip>
          );
        })}
      </div>
    </div>
  );
}
