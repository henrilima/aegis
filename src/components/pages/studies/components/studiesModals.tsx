"use client";

import { BookOpen, X } from "lucide-react";
import { SessionForm } from "@/components/forms/studies/sessionForm";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import type { StudySession } from "../types";

interface SessionModalProps {
  show: boolean;
  userId: string;
  editSession?: StudySession;
  existingSubjects: string[];
  onSave: (s: StudySession) => Promise<void>;
  onClose: () => void;
}

export function SessionModal({
  show,
  userId,
  editSession,
  existingSubjects,
  onSave,
  onClose,
}: SessionModalProps) {
  useLockBodyScroll(show);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-background border border-border rounded-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-4">
            <div
              className={`p-2 bg-violet-600/10 rounded-xl border border-violet-600/20`}
            >
              <BookOpen className={`w-5 h-5 text-violet-500`} />
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

        {/* Container rolável para o formulário de duas colunas */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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
