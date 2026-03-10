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
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">
            {editEvent ? "Editar Evento" : "Novo Evento"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
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
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-center">
        <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <h3 className="font-bold text-lg mb-1">Remover evento?</h3>
        <p className="text-sm text-neutral-500 mb-5">
          Essa ação é irreversível.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onConfirm(id)}
            className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            Remover
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-sm font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
