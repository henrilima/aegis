"use client";

import {
  AlertTriangle,
  HelpCircle,
  type LucideIcon,
  RotateCcw,
  Trash2,
} from "lucide-react";

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
    btnColor: string;
  }
> = {
  danger: {
    icon: Trash2,
    iconColor: "text-red-400",
    btnColor: "bg-red-600 hover:bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    btnColor: "bg-amber-600 hover:bg-amber-500",
  },
  default: {
    icon: HelpCircle,
    iconColor: "text-blue-400",
    btnColor: "bg-blue-600 hover:bg-blue-500",
  },
};

export function ConfirmModal({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = icon ?? cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl text-center flex flex-col items-center">
        <Icon className={`w-10 h-10 ${cfg.iconColor} mb-4`} />

        <h3 className="font-bold text-lg text-white mb-1">{title}</h3>
        <p className="text-sm text-neutral-500 mb-6">{description}</p>

        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all cursor-pointer ${cfg.btnColor}`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 text-sm font-bold transition-all cursor-pointer border border-neutral-700/50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export const CONFIRM_PRESETS = {
  resetStreak: {
    title: "Resetar Sequência?",
    description:
      "Você está prestes a registrar um deslize. Sua sequência atual será zerada.",
    confirmLabel: "Sim, Resetar",
    variant: "warning" as ConfirmVariant,
    icon: RotateCcw,
  },
  hardReset: {
    title: "Zerar Tudo?",
    description:
      "Esta ação é irreversível. Você irá zerar recordes deste hábito.",
    confirmLabel: "Sim, Zerar",
    variant: "danger" as ConfirmVariant,
  },
  deleteHabit: {
    title: "Excluir Hábito?",
    description: "Este hábito será removido permanentemente.",
    confirmLabel: "Excluir",
    variant: "danger" as ConfirmVariant,
  },
  deleteNote: {
    title: "Excluir Nota?",
    description: "Esta nota será removida permanentemente.",
    confirmLabel: "Excluir",
    variant: "danger" as ConfirmVariant,
  },
  deletePassword: {
    title: "Excluir Credencial?",
    description: "Esta senha será removida permanentemente.",
    confirmLabel: "Excluir",
    variant: "danger" as ConfirmVariant,
  },
} as const;
