"use client";

import { invoke } from "@tauri-apps/api/core";
import { AlertCircle, CalendarDays, Flag, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EventModal } from "@/components/modules/calendar/components/modals/calendarModals";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn, formatDateLocal, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { useTime } from "../../../../../context/TimeContext";
import type { CalendarEvent, DeadlineCategory } from "../../../calendar/types";
import {
  DEADLINE_COLORS,
  DEADLINE_LABELS,
  daysUntil,
} from "../../../calendar/types";
import { BaseWidget } from "../BaseWidget";

interface CalendarWidgetProps {
  isEditMode?: boolean;
  showHolidays?: boolean;
  isInteractive?: boolean;
  onToggleInteractive?: () => void;
  onAddEvent?: (event: CalendarEvent) => void;
}

export function CalendarWidget({
  isEditMode,
  showHolidays = true,
  isInteractive,
  onToggleInteractive,
  onAddEvent,
}: CalendarWidgetProps) {
  const color = getModuleColor("calendar");
  const theme = getColorTheme(color);
  const { user } = useAuth();
  const { now: time } = useTime();
  const uid = user ? String(user.id) : "";
  const [items, setItems] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      const upcoming = data
        .filter((e) => e.date >= todayStr && e.date <= limitStr)
        .filter((e) => showHolidays || !e.isHoliday)
        .sort((a, b) => {
          if (a.date === b.date) {
            if (a.eventType === "deadline" && b.eventType !== "deadline")
              return -1;
            if (b.eventType === "deadline" && a.eventType !== "deadline")
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
    <>
      <BaseWidget
        title="Eventos"
        icon={CalendarDays}
        color={color}
        route="calendar"
        isEditMode={isEditMode}
        isInteractive={isInteractive}
        onToggleInteractive={onToggleInteractive}
      >
        <div className="flex flex-col gap-4">
          {isInteractive && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
                className={cn(
                  "h-7 px-2.5 text-xs font-bold rounded-lg border-none gap-1 active:scale-95 transition-all text-white",
                  theme.solid,
                  theme.solidHover,
                )}
              >
                <Plus className="w-3 h-3" />
                <span className="hidden @sm:inline">Novo Evento</span>
              </Button>
            </div>
          )}
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
                const isDeadline = ev.eventType === "deadline";
                const days = daysUntil(ev.date, time);
                const deadlineColor =
                  isDeadline && ev.deadlineCategory
                    ? DEADLINE_COLORS[ev.deadlineCategory as DeadlineCategory]
                    : null;

                return (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-[2.5cqw] @sm:p-2.5 rounded-xl border border-neutral-200/60 dark:border-border/40 bg-neutral-100 dark:bg-neutral-900/10 hover:bg-neutral-200/50 dark:hover:bg-neutral-900/20 hover:border-neutral-300/60 dark:hover:border-border/60 transition-all gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {ev.isHoliday ? (
                        <div className="shrink-0 p-2 rounded-xl bg-neutral-200 dark:bg-neutral-900/40 border border-neutral-300/40 dark:border-border/30 text-zinc-600 dark:text-zinc-450">
                          <Flag className="w-4 h-4" />
                        </div>
                      ) : isDeadline ? (
                        <div className="shrink-0 p-2 rounded-xl bg-neutral-200 dark:bg-neutral-900/40 border border-neutral-300/40 dark:border-border/30 text-amber-600 dark:text-amber-500">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "shrink-0 p-2 rounded-xl bg-neutral-200 dark:bg-neutral-900/40 border border-neutral-300/40 dark:border-border/30",
                            theme.text,
                          )}
                        >
                          <CalendarDays className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-foreground truncate">
                          {ev.title}
                        </span>
                        {ev.isHoliday ? (
                          <span className="text-[10px] font-bold text-zinc-650 dark:text-zinc-500/80 mt-0.5">
                            Feriado Nacional
                          </span>
                        ) : isDeadline && ev.deadlineCategory ? (
                          <span
                            className="text-[10px] font-bold mt-0.5 opacity-95"
                            style={{ color: deadlineColor ?? "#d97706" }}
                          >
                            {
                              DEADLINE_LABELS[
                                ev.deadlineCategory as DeadlineCategory
                              ]
                            }
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-zinc-500/80 mt-0.5">
                            {ev.time || "Dia todo"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-start justify-center px-3 py-1.5 rounded-xl bg-neutral-200/70 dark:bg-neutral-900/30 border border-neutral-300/40 dark:border-border/30 min-w-[72px] text-left">
                      <span
                        className={cn(
                          "block text-xs font-bold leading-none",
                          ev.isHoliday
                            ? "text-zinc-600 dark:text-zinc-400"
                            : isDeadline
                              ? "text-amber-700 dark:text-amber-400"
                              : theme.text,
                        )}
                      >
                        {days === 0
                          ? "Hoje"
                          : days === 1
                            ? "Amanhã"
                            : `${days}d`}
                      </span>
                      <span className="text-[9px] font-semibold text-neutral-500 dark:text-neutral-400 block mt-1">
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
        </div>
      </BaseWidget>

      <EventModal
        show={isModalOpen}
        userId={uid}
        onClose={() => setIsModalOpen(false)}
        onSave={async (ev) => {
          onAddEvent?.(ev);
          setIsModalOpen(false);
          load();
        }}
      />
    </>
  );
}
