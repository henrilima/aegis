"use client";

import {
  AlertTriangle,
  HelpCircle,
  type LucideIcon,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

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
      "bg-red-500/10 border-red-500/40 hover:border-red-400 text-red-300 hover:text-red-200",
    bgColor: "bg-red-500/5",
    textColor: "text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    btnClass:
      "bg-amber-500/10 border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200",
    bgColor: "bg-amber-500/5",
    textColor: "text-amber-400",
  },
  default: {
    icon: HelpCircle,
    iconColor: "text-blue-500",
    btnClass:
      "bg-blue-500/10 border-blue-500/40 hover:border-blue-400 text-blue-300 hover:text-blue-200",
    bgColor: "bg-blue-500/5",
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
  useLockBodyScroll();
  const cfg = VARIANT_CONFIG[variant];
  const Icon = icon ?? cfg.icon;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden animate-in zoom-in-95 duration-300 text-center flex flex-col items-center shadow-2xl max-h-[90vh]">
        <div
          className={`w-full py-10 flex justify-center ${cfg.bgColor} border-b border-neutral-800/50 shrink-0`}
        >
          <div
            className={`p-4 bg-neutral-950 border border-neutral-800 rounded-xl w-fit ${cfg.iconColor}`}
          >
            <Icon className="w-8 h-8" />
          </div>
        </div>

        <div className="p-8 w-full flex flex-col items-center overflow-y-auto custom-scrollbar">
          <h3 className="font-bold text-xl text-neutral-100 mb-2">{title}</h3>
          <p className="text-xs text-neutral-500 mb-8 font-medium leading-relaxed px-4">
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
              className="w-full py-2 text-neutral-500 hover:text-neutral-300 text-sm font-medium transition-all cursor-pointer"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
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
} as const;
