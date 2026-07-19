"use client";

import { Moon, X } from "lucide-react";
import { SleepEntryForm as EntryForm } from "@/components/modules/sleep/components/modals/sleepEntryForm";
import type { SleepEntry } from "@/components/modules/sleep/types";
import { ModalShell } from "@/components/ui/ModalShell";

interface SleepEntryModalProps {
  show: boolean;
  userId: string;
  editEntry?: SleepEntry;
  onSave: (e: SleepEntry) => Promise<void>;
  onClose: () => void;
}

export function SleepEntryModal({
  show,
  userId,
  editEntry,
  onSave,
  onClose,
}: SleepEntryModalProps) {
  return (
    <ModalShell isOpen={show} onClose={onClose} size="2xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-xl border border-sky-500/20">
            <Moon className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-none">
              {editEntry ? "Editar registro" : "Registrar sono"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitoramento de ciclos circadianos
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
        <EntryForm
          userId={userId}
          initial={editEntry}
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
          form="sleep-form"
          className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {editEntry ? "Salvar alterações" : "Confirmar registro"}
        </button>
      </div>
    </ModalShell>
  );
}
