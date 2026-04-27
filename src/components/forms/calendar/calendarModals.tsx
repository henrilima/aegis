"use client";

import { Calendar, X } from "lucide-react";
import { EventForm } from "@/components/forms/calendar/eventForm";
import type { CalendarEvent } from "@/components/pages/calendar/types";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface EventModalProps {
  show: boolean;
  userId: string;
  editEvent?: CalendarEvent;
  onSave: (ev: CalendarEvent) => Promise<void>;
  onClose: () => void;
}

export function EventModal({
  show,
  userId,
  editEvent,
  onSave,
  onClose,
}: EventModalProps) {
  useLockBodyScroll(show);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[850px]! bg-background border border-border rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
              <Calendar className="w-5 h-5 text-green-400" />
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
        <div className="p-6 border-t border-border shrink-0 bg-background/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="calendar-form"
            className="flex-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            {editEvent ? "Salvar alterações" : "Agendar evento"}
          </button>
        </div>
      </div>
    </div>
  );
}
