"use client";

import { Calendar, X } from "lucide-react";
import { EventForm } from "@/components/modules/calendar/components/modals/eventForm";
import type { CalendarEvent } from "@/components/modules/calendar/types";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface EventModalProps {
  show: boolean;
  userId: string;
  editEvent?: CalendarEvent;
  onSave: (ev: CalendarEvent) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

export function EventModal({
  show,
  userId,
  editEvent,
  onSave,
  onClose,
  isSaving = false,
}: EventModalProps) {
  const color = getModuleColor("calendar");
  const theme = getColorTheme(color);

  return (
    <ModalShell isOpen={show} onClose={onClose} size="xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
            <Calendar className={cn("w-5 h-5", theme.text)} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-none">
              {editEvent ? "Editar compromisso" : "Agendar evento"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestão de horários e prazos
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <EventForm
          userId={userId}
          initial={editEvent}
          onSave={onSave}
          onCancel={onClose}
        />
      </div>

      {/* Rodapé Fixo */}
      <div className="flex flex-col sm:flex-row gap-2 p-6 border-t border-border/60 bg-muted/10 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 flex items-center justify-center p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 text-muted-foreground text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          form="calendar-form"
          disabled={isSaving}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50",
            theme.solid,
            theme.solidHover,
          )}
        >
          {isSaving
            ? "Salvando..."
            : editEvent
              ? "Salvar alterações"
              : "Agendar evento"}
        </button>
      </div>
    </ModalShell>
  );
}
