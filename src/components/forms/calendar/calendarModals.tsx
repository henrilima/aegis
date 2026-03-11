"use client";

import { Calendar, Trash2, X } from "lucide-react";
import type { CalendarEvent } from "@/components/pages/calendar/types";
import { EventForm } from "@/components/forms/calendar/eventForm";

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
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 w-full h-full cursor-default border-none bg-transparent"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-[28px] animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                {editEvent ? "Editar evento" : "Novo evento"}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">Gestão de horários</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <EventForm
            userId={userId}
            initial={editEvent}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

interface DeleteEventModalProps {
  id: number | null;
  onConfirm: (id: number) => Promise<void>;
  onCancel: () => void;
}

export function DeleteEventModal({
  id,
  onConfirm,
  onCancel,
}: DeleteEventModalProps) {
  if (id === null) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 w-full h-full cursor-default border-none bg-transparent"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-[28px] overflow-hidden animate-in zoom-in-95 duration-200 text-center">
        {/* Ícone centralizado */}
        <div className="flex flex-col items-center gap-3 pt-8 pb-5 px-8">
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
            <Trash2 className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Remover evento?</h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed px-2">
              Essa ação é irreversível e removerá o item do seu calendário.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-5 pt-3">
          <button
            type="button"
            onClick={() => void onConfirm(id)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 hover:border-red-400 text-red-300 hover:text-red-200 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Remover
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm font-medium cursor-pointer transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
