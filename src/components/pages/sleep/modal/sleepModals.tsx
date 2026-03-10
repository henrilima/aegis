"use client";

import { Trash2, X } from "lucide-react";
import { SleepEntryForm as EntryForm } from "@/components/forms/sleep/sleepEntryForm";
import type { SleepEntry } from "../types";

interface SleepEntryModalProps {
  show: boolean;
  userId: string;
  editEntry?: SleepEntry;
  onSave: (e: SleepEntry) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal dinâmico para criação ou edição de entradas de sono
 */
export function SleepEntryModal({
  show,
  userId,
  editEntry,
  onSave,
  onClose,
}: SleepEntryModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-white">
            {editEntry ? "Editar Registro" : "Registrar Sono"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <EntryForm
          userId={userId}
          initial={editEntry}
          onSave={onSave}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}

interface DeleteSleepModalProps {
  id: number | null;
  onConfirm: (id: number) => Promise<void>;
  onCancel: () => void;
}

/**
 * Modal de confirmação para exclusão de registros
 */
export function DeleteSleepModal({
  id,
  onConfirm,
  onCancel,
}: DeleteSleepModalProps) {
  if (id === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <Trash2 className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="font-bold text-lg text-white mb-1">Remover registro?</h3>
        <p className="text-sm text-neutral-500 mb-5">
          Essa ação é irreversível e afetará suas estatísticas.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onConfirm(id)}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all shadow-lg shadow-red-600/10 cursor-pointer"
          >
            Remover
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-sm font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
