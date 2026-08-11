"use client";

import { invoke } from "@tauri-apps/api/core";
import { CalendarDays, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { EventModal } from "@/components/modules/calendar/components/modals/calendarModals";
import { Button } from "@/components/ui/button";
import { HEX_COLORS, type ThemeColorKey } from "@/config/colors.config";
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

function getEventColorHex(
  ev: CalendarEvent,
  fallbackColorKey: ThemeColorKey,
): string {
  // 1. Cor temática explícita do evento (ex: "purple", "blue", "emerald", "amber", "red")
  if (ev.color && ev.color in HEX_COLORS) {
    return HEX_COLORS[ev.color as keyof typeof HEX_COLORS];
  }
  // 2. Cor da categoria de prazo/deadline (ex: prova = vermelho, trabalho = laranja)
  if (
    ev.eventType === "deadline" &&
    ev.deadlineCategory &&
    ev.deadlineCategory in DEADLINE_COLORS
  ) {
    return DEADLINE_COLORS[ev.deadlineCategory as DeadlineCategory];
  }
  // 3. Feriado nacional (âmbar)
  if (ev.isHoliday) {
    return HEX_COLORS.amber;
  }
  // 4. Cor do módulo de calendário por padrão
  return HEX_COLORS[fallbackColorKey] || HEX_COLORS.purple;
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
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-foreground font-bold">
                  Sem compromissos
                </p>
                <p className="text-[10px] text-muted-foreground font-normal max-w-[180px] mt-1">
                  Não há eventos ou prazos agendados para as próximas semanas.
                </p>
              </div>
            ) : (
              items.map((ev) => {
                const isDeadline = ev.eventType === "deadline";
                const days = daysUntil(ev.date, time);
                const eventColorHex = getEventColorHex(ev, color);

                return (
                  <div
                    key={ev.id}
                    className="group relative flex items-center justify-between p-3 rounded-xl border border-border bg-card transition-all hover:bg-muted/30 gap-4 overflow-hidden text-left"
                  >
                    {/* Faixa de cor lateral se definida */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                      style={{ backgroundColor: eventColorHex }}
                    />

                    <div className="flex flex-col min-w-0 flex-1 gap-0.5 text-left pl-1">
                      <span className="text-sm font-bold text-foreground truncate">
                        {ev.title}
                      </span>
                      {ev.isHoliday ? (
                        <span className="text-[10px] font-bold text-amber-500">
                          Feriado nacional
                        </span>
                      ) : isDeadline && ev.deadlineCategory ? (
                        <span
                          className="text-[10px] font-bold opacity-95"
                          style={{ color: eventColorHex }}
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
                          "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold shrink-0",
                          days === 0
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            : days === 1
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : `${theme.bg} ${theme.text} ${theme.border}`,
                        )}
                      >
                        {days === 0 ? (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                          </span>
                        ) : null}
                        <span>
                          {days === 0
                            ? "Hoje"
                            : days === 1
                              ? "Amanhã"
                              : `Em ${days} dias`}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-foreground min-w-[42px] text-right">
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
