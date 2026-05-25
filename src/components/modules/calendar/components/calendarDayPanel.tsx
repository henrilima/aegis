"use client";

import {
  AlertTriangle,
  Calendar,
  Clock,
  Flag,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { resolveColor } from "@/colors.config";
import { Button } from "@/components/ui/button";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { CalendarEvent, DeadlineCategory } from "../types";
import { DEADLINE_COLORS, DEADLINE_LABELS, daysUntil } from "../types";

interface CalendarDayPanelProps {
  date: string;
  onClose: () => void;
  dayEvents?: CalendarEvent[];
  onEdit: (ev: CalendarEvent) => void;
  onDelete: (id: number) => void;
}

/**
 * Painel lateral que exibe os detalhes de um dia específico
 */
export function CalendarDayPanel({
  date,
  onClose,
  dayEvents = [],
  onEdit,
  onDelete,
}: CalendarDayPanelProps) {
  const color = getModuleColor("calendar");
  const themeStyles = getColorTheme(color);
  const { user } = useAuth();
  const _uid = user ? String(user.id) : "";

  const displayDate = new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-500">
      {/* Header do Painel */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-2">
          <div
            className={`p-3 rounded-2xl ${themeStyles.bg} border ${themeStyles.border}`}
          >
            <Calendar className={`w-5 h-5 ${themeStyles.textSub}`} />
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-8 h-8 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all border-none"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <h2 className="text-xl font-bold text-foreground capitalize">
          {displayDate}
        </h2>
        <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">
          {dayEvents.length === 0
            ? "Nenhum compromisso registrado"
            : dayEvents.length === 1
              ? "1 compromisso registrado"
              : `${dayEvents.length} compromissos registrados`}
        </p>
      </div>

      {/* Lista de Registros */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {dayEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-neutral-600" />
            </div>
            <p className="text-sm font-medium text-muted-foreground max-w-[200px]">
              Tudo limpo por aqui. Aproveite seu dia!
            </p>
          </div>
        ) : (
          [...dayEvents]
            .sort((a, b) =>
              (a.time || "00:00").localeCompare(b.time || "00:00"),
            )
            .map((ev) => {
              const isDeadline = ev.eventType === "deadline";
              const color = isDeadline
                ? DEADLINE_COLORS[
                    (ev.deadlineCategory ?? "prova") as DeadlineCategory
                  ]
                : resolveColor(ev.color || "green");
              const days = daysUntil(ev.date);

              return (
                <div
                  key={ev.id}
                  className="group relative rounded-xl p-4 flex flex-col gap-3 border transition-all hover:translate-x-1 duration-300"
                  style={{
                    backgroundColor:
                      ev.isHoliday || ev.eventType === "holiday"
                        ? "#71717a08"
                        : `${color}08`,
                    borderColor:
                      ev.isHoliday || ev.eventType === "holiday"
                        ? "#71717a20"
                        : `${color}20`,
                  }}
                >
                  {/* Indicador de Tipo */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {ev.isHoliday || ev.eventType === "holiday" ? (
                          <Flag className="w-3.5 h-3.5 text-zinc-500" />
                        ) : (
                          isDeadline && (
                            <AlertTriangle
                              className="w-3.5 h-3.5"
                              style={{ color }}
                            />
                          )
                        )}
                        <span className="font-black text-foreground truncate">
                          {ev.title}
                        </span>
                      </div>
                      {ev.isHoliday || ev.eventType === "holiday" ? (
                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-md inline-block bg-zinc-500/15 text-zinc-500">
                          Feriado Nacional
                        </span>
                      ) : (
                        isDeadline &&
                        ev.deadlineCategory && (
                          <span
                            className="text-[8px] font-bold px-2 py-0.5 rounded-md inline-block"
                            style={{ backgroundColor: `${color}15`, color }}
                          >
                            {
                              DEADLINE_LABELS[
                                ev.deadlineCategory as DeadlineCategory
                              ]
                            }
                          </span>
                        )
                      )}
                    </div>

                    {/* Ações do Registro */}
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!ev.isHoliday && (
                        <ToolTip content="Editar registro">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onEdit(ev)}
                            className="w-7 h-7 p-0 rounded-lg text-neutral-600 hover:text-foreground hover:bg-accent/50 transition-all border-none"
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </ToolTip>
                      )}
                      {!ev.isHoliday && (
                        <ToolTip content="Remover registro">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => ev.id && onDelete(ev.id as number)}
                            className="w-7 h-7 p-0 rounded-lg text-neutral-600 hover:text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all border-none"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </ToolTip>
                      )}
                    </div>
                  </div>

                  {/* Descrição e Hora */}
                  {ev.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {ev.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-1 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {ev.time || "Dia todo"}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-neutral-800" />
                    <div
                      className={cn(
                        "text-[10px] font-bold",
                        days === 0
                          ? themeStyles.textSub
                          : days > 0
                            ? "text-muted-foreground"
                            : "text-amber-600 dark:text-amber-500",
                      )}
                    >
                      {days === 0
                        ? "Hoje"
                        : days === 1
                          ? "Amanhã"
                          : days > 1
                            ? `Em ${days} dias`
                            : "Concluído"}
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
