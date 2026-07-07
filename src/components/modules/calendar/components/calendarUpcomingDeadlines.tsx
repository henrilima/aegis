"use client";

import { AlertTriangle, Clock } from "lucide-react";
import type { CalendarEvent, DeadlineCategory } from "../types";
import { DEADLINE_COLORS, DEADLINE_LABELS, daysUntil } from "../types";

interface CalendarUpcomingDeadlinesProps {
  events: CalendarEvent[];
  time: Date;
}

/**
 * Radar de Prazos: Identifica compromissos críticos no horizonte temporal imediato
 */
export function CalendarUpcomingDeadlines({
  events,
  time,
}: CalendarUpcomingDeadlinesProps) {
  const deadlines = events
    .filter((e) => e.eventType === "deadline" && daysUntil(e.date, time) >= 0)
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.time || "00:00").localeCompare(b.time || "00:00");
    })
    .slice(0, 5);

  if (deadlines.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5 animate-in slide-in-from-left-4 duration-500 overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground leading-none">
            Fronteiras críticas
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lembretes de prazo fatal
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {deadlines.map((ev) => {
          const color =
            DEADLINE_COLORS[
              (ev.deadlineCategory ?? "prova") as DeadlineCategory
            ];
          const days = daysUntil(ev.date, time);
          return (
            <div
              key={ev.id}
              className="group relative flex items-center gap-4 p-3 rounded-xl bg-background/40 border border-border/40 hover:border-border transition-all duration-300"
            >
              <div
                className="w-1.5 h-10 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {ev.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {DEADLINE_LABELS[ev.deadlineCategory as DeadlineCategory]}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {new Date(`${ev.date}T12:00:00`).toLocaleDateString(
                      "pt-BR",
                      { day: "2-digit", month: "short" },
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className="text-[10px] font-bold px-3 py-1.5 rounded-xl border"
                  style={{
                    backgroundColor: days === 0 ? `${color}15` : "transparent",
                    borderColor:
                      days === 0 ? `${color}30` : "rgba(255,255,255,0.05)",
                    color: days === 0 ? color : "rgba(255,255,255,0.3)",
                  }}
                >
                  {days === 0
                    ? "Crítico"
                    : days === 1
                      ? "Amanhã"
                      : `${days} dias`}
                </span>
                {ev.time && (
                  <div className="flex items-center gap-1 text-[10px] font-medium text-neutral-600">
                    <Clock className="w-3 h-3" />
                    {ev.time}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
