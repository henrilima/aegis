"use client";

import { Trash2, X } from "lucide-react";
import { SessionForm } from "@/components/forms/studies/sessionForm";
import { Button } from "@/components/ui/button";
import type { StudySession } from "../types";

interface SessionModalProps {
  show: boolean;
  userId: string;
  editSession?: StudySession;
  existingSubjects: string[];
  onSave: (s: StudySession) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal dinâmico para gerenciamento de sessões (Inclusão e Edição)
 */
export function SessionModal({
  show,
  userId,
  editSession,
  existingSubjects,
  onSave,
  onClose,
}: SessionModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h3 className="font-black text-xl text-white">
            {editSession ? "Editar Sessão" : "Registrar Novos Estudos"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Container rolável para o formulário longo */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <SessionForm
            userId={userId}
            initial={editSession}
            existingSubjects={existingSubjects}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

interface DeleteModalProps {
  id: number | null;
  onConfirm: (id: number) => Promise<void>;
  onCancel: () => void;
}

/**
 * Confirmação de exclusão destrutiva
 */
export function DeleteModal({ id, onConfirm, onCancel }: DeleteModalProps) {
  if (id === null) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-neutral-950 border border-red-500/20 rounded-3xl p-8 shadow-2xl text-center overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-lg shadow-red-500/5 rotate-3">
          <Trash2 className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-sm font-black text-white uppercase mb-1">
          Purga do Registro
        </h3>
        <p className="text-[10px] font-black text-neutral-500 uppercase mb-8">
          Esta operação desintegrará os dados permanentemente.
        </p>
        <div className="flex gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1 py-6 rounded-2xl text-[10px] font-black uppercase text-neutral-600 hover:text-white hover:bg-neutral-900 transition-all border-none"
          >
            Abortar
          </Button>
          <Button
            type="button"
            onClick={() => void onConfirm(id)}
            className="flex-2 py-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase shadow-xl shadow-red-600/20 active:scale-[0.98] transition-all border-none"
          >
            Confirmar Purga
          </Button>
        </div>
      </div>
    </div>
  );
}
