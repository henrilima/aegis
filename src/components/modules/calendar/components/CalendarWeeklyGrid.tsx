"use client";

import { AlertTriangle, Flag } from "lucide-react";
import { useMemo } from "react";
import { resolveColor } from "@/colors.config";
import { cn, formatDateLocal, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { CalendarEvent, DeadlineCategory } from "../types";
import { DEADLINE_COLORS } from "../types";

const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface CalendarWeeklyGridProps {
  currentWeekStart: Date;
  events: CalendarEvent[];
  selectedDate: string | null;
  onDayClick: (date: string) => void;
  onDayDoubleClick: (date: string) => void;
  now: Date;
  isEventRecurringOnDate: (event: CalendarEvent, dateStr: string) => boolean;
}

export function CalendarWeeklyGrid({
  currentWeekStart,
  events,
  selectedDate,
  onDayClick,
  onDayDoubleClick,
  now,
  isEventRecurringOnDate,
}: CalendarWeeklyGridProps) {
  const color = getModuleColor("calendar");
  const themeStyles = getColorTheme(color);
  const todayStr = formatDateLocal(now);

  const weekDays = useMemo(() => {
    const days = [];
    const base = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      days.push({
        date: `${d.getFullYear()}-${mm}-${dd}`,
        label: `${WEEKDAYS_SHORT[d.getDay()]}, ${dd}/${mm}`,
        isToday: `${d.getFullYear()}-${mm}-${dd}` === todayStr,
      });
    }
    return days;
  }, [currentWeekStart, todayStr]);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-7 gap-4 p-4 min-h-[480px]">
      {weekDays.map((day) => {
        const dayEvents = events.filter((e) =>
          isEventRecurringOnDate(e, day.date),
        );
        const isSelected = selectedDate === day.date;

        return (
          // biome-ignore lint/a11y/useSemanticElements: using div for layout
          <div
            key={day.date}
            role="button"
            tabIndex={0}
            onClick={() => onDayClick(day.date)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onDayClick(day.date);
              }
            }}
            onDoubleClick={() => onDayDoubleClick(day.date)}
            className={cn(
              "flex flex-col rounded-xl border p-3 min-h-[150px] md:min-h-[400px] transition-all cursor-pointer select-none",
              day.isToday
                ? "bg-muted/30 border-muted-foreground/30"
                : isSelected
                  ? "bg-muted/10 border-border/80"
                  : "bg-card/50 border-border/40 hover:border-border/80",
            )}
          >
            {/* Cabeçalho do Dia */}
            <div className="flex items-center justify-between pb-2 border-b border-border/40 mb-2 shrink-0">
              <span
                className={cn(
                  "text-xs font-bold",
                  day.isToday ? themeStyles.text : "text-foreground",
                )}
              >
                {day.label}
              </span>
              {day.isToday && (
                <span
                  className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white",
                    themeStyles.solid,
                  )}
                >
                  Hoje
                </span>
              )}
            </div>

            {/* Lista de Eventos */}
            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-0.5 max-h-[350px]">
              {dayEvents.length > 0 ? (
                dayEvents
                  .sort((a, b) =>
                    (a.time || "00:00").localeCompare(b.time || "00:00"),
                  )
                  .map((ev) => {
                    const isDeadline = ev.eventType === "deadline";
                    const evColor = isDeadline
                      ? DEADLINE_COLORS[
                          (ev.deadlineCategory ?? "prova") as DeadlineCategory
                        ]
                      : resolveColor(ev.color || "green");

                    return (
                      // biome-ignore lint/a11y/useSemanticElements: using div for layout
                      <div
                        key={ev.id}
                        role="button"
                        tabIndex={0}
                        onDoubleClick={(e) => {
                          e.stopPropagation(); // Evita acionar duplo clique no dia
                          onDayDoubleClick(day.date);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            onDayDoubleClick(day.date);
                          }
                        }}
                        className="p-2 rounded-lg border text-[10px] leading-tight flex flex-col gap-1 transition-all"
                        style={{
                          backgroundColor:
                            ev.isHoliday || ev.eventType === "holiday"
                              ? "#71717a08"
                              : `${evColor}08`,
                          borderColor:
                            ev.isHoliday || ev.eventType === "holiday"
                              ? "#71717a20"
                              : `${evColor}20`,
                        }}
                      >
                        <div className="flex items-center gap-1 font-bold text-foreground">
                          {ev.isHoliday || ev.eventType === "holiday" ? (
                            <Flag className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                          ) : (
                            isDeadline && (
                              <AlertTriangle
                                className="w-2.5 h-2.5 shrink-0"
                                style={{ color: evColor }}
                              />
                            )
                          )}
                          <span className="truncate">{ev.title}</span>
                        </div>
                        {ev.time && (
                          <span className="text-[9px] text-muted-foreground font-semibold">
                            {ev.time}
                          </span>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="flex-1 flex items-center justify-center py-8">
                  <span className="text-[9px] text-muted-foreground/30 font-semibold uppercase tracking-wider">
                    Livre
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
