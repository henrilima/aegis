"use client";

import { Moon, X } from "lucide-react";
import { SleepEntryForm as EntryForm } from "@/components/forms/sleep/sleepEntryForm";
import type { SleepEntry } from "@/components/pages/sleep/types";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

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
  useLockBodyScroll(show);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Moon className="w-5 h-5 text-blue-400" />
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
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <EntryForm
            userId={userId}
            initial={editEntry}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
