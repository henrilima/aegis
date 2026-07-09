"use client";

import { invoke } from "@tauri-apps/api/core";
import { CalendarDays, Plus } from "lucide-react";
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
              <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-border/60 rounded-xl bg-muted/10">
                <CalendarDays className="w-5 h-5 text-muted-foreground/30 mb-1.5 stroke-[1.5]" />
                <p className="text-[11px] font-medium text-muted-foreground/60">
                  Nada agendado para as próximas semanas
                </p>
              </div>
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
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-4"
                  >
                    <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left">
                      <span className="text-sm font-bold text-foreground truncate">
                        {ev.title}
                      </span>
                      {ev.isHoliday ? (
                        <span className="text-[10px] font-bold text-muted-foreground">
                          Feriado nacional
                        </span>
                      ) : isDeadline && ev.deadlineCategory ? (
                        <span
                          className="text-[10px] font-bold opacity-95"
                          style={{ color: deadlineColor ?? "#d97706" }}
                        >
                          {
                            DEADLINE_LABELS[
                              ev.deadlineCategory as DeadlineCategory
                            ]
                          }
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {ev.time || "Dia todo"}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <div
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize shrink-0",
                          days === 0
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            : days === 1
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-muted/40 text-muted-foreground border-border/40",
                        )}
                      >
                        <span>
                          {days === 0
                            ? "Hoje"
                            : days === 1
                              ? "Amanhã"
                              : `${days}d`}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground min-w-[42px] text-right">
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
