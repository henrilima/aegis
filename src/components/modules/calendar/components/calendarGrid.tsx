"use client";

import { Flag } from "lucide-react";
import { useMemo } from "react";
import { resolveColor } from "@/colors.config";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { formatDateLocal, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { CalendarEvent, DeadlineCategory } from "../types";
import { DEADLINE_COLORS } from "../types";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface CalendarGridProps {
  month: number;
  year: number;
  events: CalendarEvent[];
  selectedDate: string | null;
  onDayClick: (date: string) => void;
  onDayDoubleClick: (date: string) => void;
}

export function CalendarGrid({
  month,
  year,
  events,
  selectedDate,
  onDayClick,
  onDayDoubleClick,
}: CalendarGridProps) {
  const color = getModuleColor("calendar");
  const themeStyles = getColorTheme(color);
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const cells = [];

    // Anterior
    const startDow = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const mm = String(prevMonth + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      cells.push({
        date: `${prevYear}-${mm}-${dd}`,
        day: d,
        isCurrentMonth: false,
      });
    }

    // Atual
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      cells.push({ date: `${year}-${mm}-${dd}`, day: d, isCurrentMonth: true });
    }

    // Próximo
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const mm = String(nextMonth + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      cells.push({
        date: `${nextYear}-${mm}-${dd}`,
        day: d,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [month, year]);

  const today = formatDateLocal(new Date());

  return (
    <div className="w-full select-none">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-3 text-[10px] font-black text-muted-foreground uppercase text-center bg-card/50"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 bg-card/10">
        {cells.map((cell) => {
          const dayEvents = events.filter((e) => e.date === cell.date);
          const isSelected = selectedDate === cell.date;
          const isCellToday = cell.date === today;
          const isSunday = new Date(`${cell.date}T12:00:00`).getDay() === 0;

          // Separar tipos de eventos para UI compacta
          const deadlines = dayEvents.filter((e) => e.eventType === "deadline");
          const normalEvents = dayEvents.filter(
            (e) => e.eventType === "event" && !e.isHoliday,
          );
          const holidays = dayEvents.filter((e) => e.isHoliday);
          const isHoliday = holidays.length > 0;

          return (
            <ToolTip
              key={cell.date}
              content={
                dayEvents.length > 0 ? (
                  <div className="flex flex-col gap-1.5 min-w-[140px]">
                    {dayEvents.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: ev.isHoliday
                              ? "#a1a1aa"
                              : ev.eventType === "deadline"
                                ? DEADLINE_COLORS[
                                    ev.deadlineCategory as DeadlineCategory
                                  ]
                                : resolveColor(ev.color),
                          }}
                        />
                        <span className="text-[10px] font-bold text-foreground truncate">
                          {(ev.isHoliday || ev.eventType === "holiday") && (
                            <Flag className="w-2.5 h-2.5 inline-block mr-1 text-zinc-400" />
                          )}
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
                className={`min-h-[110px] p-2.5 border-b border-r border-border/40 text-left transition-all cursor-pointer group relative overflow-hidden w-full ${
                  isSelected
                    ? `${themeStyles.bg} ring-1 ring-inset ${themeStyles.border.replace("20", "40")} z-10`
                    : "hover:bg-white/2"
                } ${cell.isCurrentMonth ? "" : "opacity-15 grayscale-[0.8]"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-bold inline-flex items-center justify-center w-7 h-7 rounded-xl transition-all ${
                      isCellToday
                        ? `${themeStyles.solid} text-white scale-105`
                        : isSelected
                          ? `${themeStyles.bg} ${themeStyles.textSub} border ${themeStyles.border}`
                          : isHoliday
                            ? "text-zinc-500 group-hover:text-zinc-400 font-black"
                            : isSunday
                              ? "text-red-500 group-hover:text-red-600 dark:text-red-400"
                              : "text-muted-foreground group-hover:text-muted-foreground"
                    }`}
                  >
                    {cell.day}
                  </span>

                  {/* Pot indicators for density */}
                  {dayEvents.length > 0 && !isSelected && (
                    <div className="flex gap-0.5">
                      {dayEvents.slice(0, 4).map((ev) => (
                        <div
                          key={ev.id}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: ev.isHoliday
                              ? "#a1a1aa"
                              : ev.eventType === "deadline"
                                ? DEADLINE_COLORS[
                                    ev.deadlineCategory as DeadlineCategory
                                  ]
                                : resolveColor(ev.color),
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Event Tags */}
                <div className="flex flex-col gap-1">
                  {deadlines.slice(0, 2).map((ev) => {
                    const color = ev.deadlineCategory
                      ? DEADLINE_COLORS[ev.deadlineCategory as DeadlineCategory]
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
                          backgroundColor: `${resolveColor(ev.color)}10`,
                          color: resolveColor(ev.color),
                          borderColor: `${resolveColor(ev.color)}15`,
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                  {holidays.slice(0, 1).map((ev) => (
                    <div
                      key={ev.id}
                      className="text-[9px] font-bold px-2 py-1 rounded-lg bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 flex items-center gap-1.5 mt-0.5 truncate animate-in fade-in"
                    >
                      <Flag className="w-3 h-3 text-zinc-400 shrink-0" />{" "}
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
