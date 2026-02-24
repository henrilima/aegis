import {
  AlertTriangle,
  HelpCircle,
  type LucideIcon,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    bgColor: string;
    borderColor: string;
    btnColor: string;
  }
> = {
  danger: {
    icon: Trash2,
    iconColor: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    btnColor: "bg-red-600 hover:bg-red-500 text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    btnColor: "bg-amber-600 hover:bg-amber-500 text-white",
  },
  default: {
    icon: HelpCircle,
    iconColor: "text-neutral-400",
    bgColor: "bg-neutral-800",
    borderColor: "border-neutral-700",
    btnColor: "bg-neutral-700 hover:bg-neutral-600 text-white",
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onCancel}
        className="absolute inset-0 w-full h-full cursor-default"
      />

      <div
        className={`relative w-full max-w-sm bg-neutral-950 border ${cfg.borderColor} rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200`}
      >
        <div className="flex items-center gap-3 p-5 border-b border-neutral-800">
          <div
            className={`p-2 rounded-xl ${cfg.bgColor} border ${cfg.borderColor}`}
          >
            <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
          </div>
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-neutral-400 leading-relaxed">
            {description}
          </p>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={onConfirm}
              className={`w-full font-bold cursor-pointer ${cfg.btnColor}`}
            >
              {confirmLabel}
            </Button>
            <Button
              onClick={() => {
                // Executa a confirmação e fecha o modal
                onConfirm();
                onCancel();
              }}
              type="button"
              variant="ghost"
              className="w-full text-neutral-500 hover:text-white hover:bg-neutral-800 cursor-pointer"
            >
              {cancelLabel}
            </Button>
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
      "Você está prestes a registrar um deslize. Sua sequência atual será zerada e o contador de deslizes totais será incrementado.",
    confirmLabel: "Sim, Resetar Sequência",
    variant: "warning" as ConfirmVariant,
    icon: RotateCcw,
  },
  hardReset: {
    title: "Zerar Tudo?",
    description:
      "Esta ação é irreversível. Você irá zerar suas conclusões totais, sequência atual e todos os seus recordes deste hábito.",
    confirmLabel: "Sim, Zerar Hábito",
    variant: "danger" as ConfirmVariant,
  },
  deleteHabit: {
    title: "Excluir Hábito?",
    description:
      "Este hábito e todo o seu histórico serão removidos permanentemente.",
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
    description:
      "Esta senha e todos os seus dados serão removidos permanentemente.",
    confirmLabel: "Excluir",
    variant: "danger" as ConfirmVariant,
  },
} as const;
