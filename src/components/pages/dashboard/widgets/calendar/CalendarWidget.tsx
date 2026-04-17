"use client";

import { invoke } from "@tauri-apps/api/core";
import { AlertCircle, CalendarDays, Flag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn, formatDateLocal } from "@/lib/utils";
import type { CalendarEvent, DeadlineCategory } from "../../../calendar/types";
import {
  DEADLINE_COLORS,
  DEADLINE_LABELS,
  daysUntil,
} from "../../../calendar/types";
import { BaseWidget } from "../BaseWidget";

interface CalendarWidgetProps {
  isEditMode?: boolean;
  time: Date;
  showHolidays?: boolean;
}

export function CalendarWidget({
  isEditMode,
  time,
  showHolidays = true,
}: CalendarWidgetProps) {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";
  const [items, setItems] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await invoke<CalendarEvent[]>("calendar_list_events", {
        userId: uid,
      });

      const now = time || new Date();
      const fourWeeksLater = new Date(now);
      fourWeeksLater.setDate(now.getDate() + 28);

      const todayStr = formatDateLocal(now);
      const limitStr = formatDateLocal(fourWeeksLater);

      // Pegar os próximos 6 itens (mistura de eventos e deadlines)
      const upcoming = data
        .filter((e) => e.date >= todayStr && e.date <= limitStr)
        .filter((e) => showHolidays || !e.is_holiday)
        .sort((a, b) => {
          // Prioridade para deadlines se forem no mesmo dia
          if (a.date === b.date) {
            if (a.event_type === "deadline" && b.event_type !== "deadline")
              return -1;
            if (b.event_type === "deadline" && a.event_type !== "deadline")
              return 1;
          }
          return a.date.localeCompare(b.date);
        })
        .slice(0, 6);

      setItems(upcoming);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [uid, time, showHolidays]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <BaseWidget
      title="Calendário e Prazos"
      icon={CalendarDays}
      iconColor="text-emerald-600 dark:text-emerald-400"
      route="calendar"
      isEditMode={isEditMode}
    >
      <div className="space-y-[1.5cqw] @sm:space-y-2">
        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-10 bg-muted rounded-xl w-full" />
            <div className="h-10 bg-muted rounded-xl w-full" />
            <div className="h-10 bg-muted rounded-xl w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-[3cqw] @sm:text-xs text-neutral-600 italic py-2">
            Nada agendado para as próximas semanas
          </p>
        ) : (
          items.map((ev) => {
            const isDeadline = ev.event_type === "deadline";
            const days = daysUntil(ev.date, time);
            const color =
              isDeadline && ev.deadline_category
                ? DEADLINE_COLORS[ev.deadline_category as DeadlineCategory]
                : null;

            return (
              <div
                key={ev.id}
                className={cn(
                  "flex items-center justify-between p-[2cqw] @sm:p-2 rounded-xl border transition-all",
                  ev.is_holiday
                    ? "bg-zinc-500/5 border-zinc-500/10 hover:border-zinc-500/20"
                    : isDeadline
                      ? "bg-amber-500/5 border-amber-500/10 hover:border-amber-500/20"
                      : "bg-muted border-border/50 hover:border-border/50",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {ev.is_holiday ? (
                    <div className="shrink-0 p-1.5 rounded-lg bg-zinc-500/10">
                      <Flag className="w-3 h-3 text-zinc-500" />
                    </div>
                  ) : isDeadline ? (
                    <div className="shrink-0 p-1.5 rounded-lg bg-amber-500/10">
                      <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-500" />
                    </div>
                  ) : (
                    <div className="shrink-0 p-1.5 rounded-lg bg-emerald-500/10">
                      <CalendarDays className="w-3 h-3 text-emerald-500" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-foreground truncate">
                      {ev.title}
                    </span>
                    {ev.is_holiday ? (
                      <span className="text-xs font-bold text-zinc-500/80">
                        Feriado Nacional
                      </span>
                    ) : isDeadline && ev.deadline_category ? (
                      <span
                        className="text-xs font-bold opacity-90"
                        style={{ color: color ?? "#f59e0b" }}
                      >
                        {
                          DEADLINE_LABELS[
                            ev.deadline_category as DeadlineCategory
                          ]
                        }
                      </span>
                    ) : ev.time ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        {ev.time}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        Dia todo
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-right shrink-0",
                    ev.is_holiday
                      ? "bg-zinc-500/5"
                      : isDeadline
                        ? "bg-amber-500/5"
                        : "bg-emerald-500/5",
                  )}
                >
                  <span
                    className={cn(
                      "block text-xs font-black leading-none",
                      ev.is_holiday
                        ? "text-zinc-500"
                        : isDeadline
                          ? "text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {days === 0 ? "Hoje" : days === 1 ? "Amanhã" : `${days}d`}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-600 block mt-0.5">
                    {new Date(`${ev.date}T12:00:00`).toLocaleDateString(
                      "pt-BR",
                      {
                        day: "2-digit",
                        month: "short",
                      },
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </BaseWidget>
  );
}
