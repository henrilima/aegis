"use client";

import {
  AlertTriangle,
  HelpCircle,
  type LucideIcon,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";

export type ConfirmVariant = "danger" | "warning" | "default";

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: LucideIcon;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG: Record<
  ConfirmVariant,
  {
    icon: LucideIcon;
    iconColor: string;
    btnClass: string;
    bgColor: string;
    textColor: string;
  }
> = {
  danger: {
    icon: Trash2,
    iconColor: "text-red-500",
    btnClass:
      "bg-red-600 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400 text-white",
    bgColor: "bg-red-500/10",
    textColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-600 dark:text-amber-500",
    btnClass:
      "bg-amber-600 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400 text-white",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400",
  },
  default: {
    icon: HelpCircle,
    iconColor: "text-blue-500",
    btnClass:
      "bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 text-white",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
  },
};

export function ConfirmModal({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Agora não",
  variant = "default",
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = icon ?? cfg.icon;

  return (
    <ModalShell onClose={onCancel} size="xs" zIndex="z-[999]">
      <div
        className={`w-full py-10 flex justify-center ${cfg.bgColor} border-b border-border/50 shrink-0`}
      >
        <div
          className={`p-4 bg-background border border-border rounded-xl w-fit ${cfg.iconColor}`}
        >
          <Icon className="w-8 h-8" />
        </div>
      </div>

      <div className="p-8 w-full flex flex-col items-center overflow-y-auto custom-scrollbar">
        <h3 className="font-bold text-xl text-foreground mb-2 text-center">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mb-8 font-medium leading-relaxed px-4 text-center">
          {description}
        </p>

        <div className="flex flex-col gap-2 w-full mt-auto">
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] ${cfg.btnClass}`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-muted-foreground hover:text-muted-foreground text-sm font-medium transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export const CONFIRM_PRESETS = {
  resetStreak: {
    title: "Resetar sequência?",
    description:
      "Você está prestes a registrar um deslize. Sua sequência atual será zerada.",
    confirmLabel: "Sim, resetar",
    cancelLabel: "Agora não",
    variant: "warning" as ConfirmVariant,
    icon: RotateCcw,
  },
  hardReset: {
    title: "Zerar tudo?",
    description:
      "Esta ação é irreversível. Você irá zerar recordes deste hábito.",
    confirmLabel: "Sim, zerar",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  deleteHabit: {
    title: "Excluir hábito?",
    description: "Este hábito será removido permanentemente do sistema.",
    confirmLabel: "Excluir",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  deleteNote: {
    title: "Excluir nota?",
    description: "Esta nota será removida permanentemente de sua biblioteca.",
    confirmLabel: "Excluir",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  deletePassword: {
    title: "Excluir credencial?",
    description: "Esta senha será removida permanentemente do cofre.",
    confirmLabel: "Excluir",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  deleteEvent: {
    title: "Remover evento?",
    description:
      "Essa ação é irreversível e removerá permanentemente o item do seu calendário.",
    confirmLabel: "Remover",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  deleteSleep: {
    title: "Remover registro?",
    description:
      "Essa ação é irreversível e removerá permanentemente os dados deste ciclo do seu histórico.",
    confirmLabel: "Remover",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  deleteSession: {
    title: "Remover sessão?",
    description:
      "Essa ação é irreversível e afetará permanentemente suas estatísticas de estudos.",
    confirmLabel: "Remover",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  resetDashboard: {
    title: "Resetar Dashboard?",
    description:
      "Seu layout personalizado será substituído pela organização padrão. Esta ação não pode ser desfeita.",
    confirmLabel: "Resetar Agora",
    cancelLabel: "Manter como está",
    variant: "warning" as ConfirmVariant,
    icon: RotateCcw,
  },
  deleteGlossaryWord: {
    title: "Remover do Glossário?",
    description:
      "Esta palavra será removida permanentemente da sua lista salva.",
    confirmLabel: "Remover",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  deleteMovie: {
    title: "Excluir filme?",
    description: "Este filme será removido permanentemente do seu catálogo.",
    confirmLabel: "Excluir",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  deleteTask: {
    title: "Excluir tarefa?",
    description: "Esta tarefa será removida permanentemente da sua lista.",
    confirmLabel: "Excluir",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  deleteAlarm: {
    title: "Excluir alarme?",
    description: "Este alarme será removido e não irá mais disparar.",
    confirmLabel: "Excluir",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  deleteBook: {
    title: "Remover livro?",
    description:
      "Este livro e todo o seu histórico de sessões serão removidos permanentemente da biblioteca.",
    confirmLabel: "Remover",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
  deleteReadingSession: {
    title: "Remover sessão de leitura?",
    description:
      "Esta sessão será removida e afetará seu progresso registrado.",
    confirmLabel: "Remover",
    cancelLabel: "Agora não",
    variant: "danger" as ConfirmVariant,
  },
} as const;
