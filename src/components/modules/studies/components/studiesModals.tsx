"use client";

import { BookOpen, X } from "lucide-react";
import { SessionForm } from "@/components/modules/studies/components/modals/sessionForm";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { StudySession } from "../types";

interface SessionModalProps {
  show: boolean;
  userId: string;
  editSession?: StudySession;
  existingSubjects: string[];
  onSave: (s: StudySession) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

export function SessionModal({
  show,
  userId,
  editSession,
  existingSubjects,
  onSave,
  onClose,
  isSaving = false,
}: SessionModalProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  return (
    <ModalShell isOpen={show} onClose={onClose} size="xl">
      <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-4">
          <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
            <BookOpen className={cn("w-5 h-5", theme.text)} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {editSession
                ? "Editar sessão de estudos"
                : "Registrar novos estudos"}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Capture seu progresso e métricas de desempenho
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-xl hover:bg-card text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <SessionForm
          userId={userId}
          initial={editSession}
          existingSubjects={existingSubjects}
          onSave={onSave}
          onCancel={onClose}
        />
      </div>

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
          form="studies-form"
          disabled={isSaving}
          className={cn(
            "flex-2 px-4 py-3 rounded-xl text-white font-bold text-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
            theme.solid,
            theme.solidHover,
          )}
        >
          {isSaving
            ? "Salvando..."
            : editSession
              ? "Salvar alterações"
              : "Registrar sessão"}
        </button>
      </div>
    </ModalShell>
  );
}
