"use client";

import { AlertTriangle, Clock } from "lucide-react";
import type { CalendarEvent, DeadlineCategory } from "../types";
import { DEADLINE_COLORS, DEADLINE_LABELS, daysUntil } from "../types";

interface CalendarUpcomingDeadlinesProps {
  events: CalendarEvent[];
}

/**
 * Radar de Prazos: Identifica compromissos críticos no horizonte temporal imediato
 */
export function CalendarUpcomingDeadlines({
  events,
}: CalendarUpcomingDeadlinesProps) {
  const deadlines = events
    .filter((e) => e.event_type === "deadline" && daysUntil(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  if (deadlines.length === 0) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-6 shadow-xl animate-in slide-in-from-left-4 duration-500 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
        <div className="p-2 bg-red-600/10 rounded-xl border border-red-600/20">
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <h2 className="text-[10px] font-black uppercase text-white leading-none">
            Fronteiras Críticas
          </h2>
          <p className="text-[8px] font-black text-neutral-600 uppercase mt-1">
            Lembretes de Prazo Fatal
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {deadlines.map((ev) => {
          const color =
            DEADLINE_COLORS[
              (ev.deadline_category ?? "prova") as DeadlineCategory
            ];
          const days = daysUntil(ev.date);
          return (
            <div
              key={ev.id}
              className="group relative flex items-center gap-4 p-3 rounded-2xl bg-neutral-950/40 border border-neutral-800/40 hover:border-neutral-700 transition-all duration-300"
            >
              <div
                className="w-1.5 h-10 rounded-full shrink-0 shadow-lg"
                style={{
                  backgroundColor: color,
                  boxShadow: `0 0 12px ${color}30`,
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-white truncate uppercase">
                  {ev.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {DEADLINE_LABELS[ev.deadline_category as DeadlineCategory]}
                  </span>
                  <span className="text-[9px] font-bold text-neutral-600 uppercase">
                    {new Date(`${ev.date}T12:00:00`).toLocaleDateString(
                      "pt-BR",
                      { day: "2-digit", month: "short" },
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className="text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl border"
                  style={{
                    backgroundColor: days === 0 ? `${color}15` : "transparent",
                    borderColor:
                      days === 0 ? `${color}30` : "rgba(255,255,255,0.05)",
                    color: days === 0 ? color : "rgba(255,255,255,0.2)",
                  }}
                >
                  {days === 0
                    ? "Crítico"
                    : days === 1
                      ? "Amanhã"
                      : `${days} Dias`}
                </span>
                {ev.time && (
                  <div className="flex items-center gap-1 text-[8px] font-bold text-neutral-700">
                    <Clock className="w-2.5 h-2.5" />
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
