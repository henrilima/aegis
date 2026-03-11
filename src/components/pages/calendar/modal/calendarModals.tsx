"use client";

import { Trash2, X } from "lucide-react";
import type { CalendarEvent } from "../types";
import { EventForm } from "./eventForm";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-xl text-neutral-100">
            {editEvent ? "Editar Evento" : "Novo Evento"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <EventForm
          userId={userId}
          initial={editEvent}
          onSave={onSave}
          onCancel={onClose}
        />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl w-fit mx-auto mb-5">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="font-black text-xl mb-2 text-neutral-100 uppercase tracking-tight">Remover evento?</h3>
        <p className="text-xs text-neutral-500 mb-8 font-medium">
          Essa ação é irreversível e os dados serão perdidos.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void onConfirm(id)}
            className="flex-1 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase transition-all hover:bg-red-500/20 cursor-pointer active:scale-95"
          >
            Excluir Agora
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 rounded-xl bg-neutral-800/50 border border-neutral-700 text-neutral-400 text-[10px] font-black uppercase transition-all hover:bg-neutral-800 cursor-pointer"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
