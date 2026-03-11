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
    btnClass: string;
    bgColor: string;
  }
> = {
  danger: {
    icon: Trash2,
    iconColor: "text-red-500",
    btnClass: "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20",
    bgColor: "bg-red-500/5",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    btnClass: "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20",
    bgColor: "bg-amber-500/5",
  },
  default: {
    icon: HelpCircle,
    iconColor: "text-blue-500",
    btnClass: "bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20",
    bgColor: "bg-blue-500/5",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 text-center flex flex-col items-center">
        <div className={`w-full py-8 flex justify-center ${cfg.bgColor} border-b border-neutral-800/50`}>
          <div className={`p-4 bg-neutral-950/50 border border-neutral-800 rounded-2xl w-fit ${cfg.iconColor}`}>
            <Icon className="w-8 h-8" />
          </div>
        </div>

        <div className="p-8 w-full flex flex-col items-center">
          <h3 className="font-black text-xl text-neutral-100 mb-2 uppercase tracking-tight">{title}</h3>
          <p className="text-xs text-neutral-500 mb-8 font-medium leading-relaxed">{description}</p>

          <div className="flex flex-col gap-3 w-full">
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full py-4 rounded-xl border text-[10px] font-black uppercase transition-all cursor-pointer active:scale-95 ${cfg.btnClass}`}
            >
              {confirmLabel}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-3 rounded-xl text-neutral-500 hover:text-neutral-300 text-[10px] font-black uppercase transition-all hover:bg-neutral-800 cursor-pointer"
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
