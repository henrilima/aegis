"use client";

import {
  AlertTriangle,
  HelpCircle,
  type LucideIcon,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { Kbd } from "@/components/ui/kbd";
import { ModalShell } from "@/components/ui/ModalShell";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn } from "@/lib/utils";

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
  disablePortal?: boolean;
  children?: React.ReactNode;
}

const VARIANT_CONFIG: Record<
  ConfirmVariant,
  {
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    confirmBtnClass: string;
  }
> = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400",
    iconColor: "text-red-500",
    confirmBtnClass:
      "bg-red-600 hover:bg-red-500 text-white dark:bg-red-500 dark:hover:bg-red-400 border-transparent",
  },
  warning: {
    icon: AlertTriangle,
    iconBg:
      "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-500",
    confirmBtnClass:
      "bg-amber-600 hover:bg-amber-500 text-white dark:bg-amber-500 dark:hover:bg-amber-400 border-transparent",
  },
  default: {
    icon: HelpCircle,
    iconBg: "bg-sky-500/10 border-sky-500/20 text-sky-500 dark:text-sky-400",
    iconColor: "text-sky-500",
    confirmBtnClass:
      "bg-sky-600 hover:bg-sky-500 text-white dark:bg-sky-500 dark:hover:bg-sky-400 border-transparent",
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
  disablePortal = false,
  children,
}: ConfirmModalProps) {
  const cfg = VARIANT_CONFIG[variant];
  const Icon = icon ?? cfg.icon;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onConfirm, onCancel]);

  return (
    <ModalShell
      onClose={onCancel}
      size="sm"
      zIndex="z-[999]"
      disablePortal={disablePortal}
    >
      {/* Header com ícone sutil e ação de fechar */}
      <div className="p-6 pb-0 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-2xl border shrink-0", cfg.iconBg)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1 pr-2">
            <h3 className="font-bold text-base text-foreground leading-snug">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              {description}
            </p>
          </div>
        </div>
        <ToolTip content="Cancelar">
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </ToolTip>
      </div>

      {/* Conteúdo adicional e botões de ação horizontais */}
      <div className="p-6 flex flex-col gap-4">
        {children && <div className="w-full">{children}</div>}

        <div className="flex items-center gap-2.5 w-full pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-card hover:bg-accent/50 text-foreground text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{cancelLabel}</span>
            <Kbd className="bg-muted/60 text-muted-foreground border-border text-[9px] px-1 py-0.5">
              Esc
            </Kbd>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-none",
              cfg.confirmBtnClass,
            )}
          >
            <span>{confirmLabel}</span>
            <Kbd className="bg-white/20 text-white border-white/30 text-[9px] px-1 py-0.5">
              Enter
            </Kbd>
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
    cancelLabel: "Cancelar",
    variant: "warning" as ConfirmVariant,
    icon: RotateCcw,
  },
  hardReset: {
    title: "Zerar tudo?",
    description:
      "Esta ação é irreversível. Você irá zerar os recordes deste hábito.",
    confirmLabel: "Sim, zerar",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  deleteHabit: {
    title: "Excluir hábito?",
    description: "Este hábito será removido permanentemente do sistema.",
    confirmLabel: "Excluir",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  deleteNote: {
    title: "Excluir nota?",
    description: "Esta nota será removida permanentemente de sua biblioteca.",
    confirmLabel: "Excluir",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  deletePassword: {
    title: "Excluir credencial?",
    description: "Esta senha será removida permanentemente do cofre.",
    confirmLabel: "Excluir",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  deleteEvent: {
    title: "Remover evento?",
    description:
      "Essa ação é irreversível e removerá permanentemente o item do seu calendário.",
    confirmLabel: "Remover",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  deleteSleep: {
    title: "Remover registro?",
    description:
      "Essa ação é irreversível e removerá permanentemente os dados deste ciclo do seu histórico.",
    confirmLabel: "Remover",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  deleteSession: {
    title: "Remover sessão?",
    description:
      "Essa ação é irreversível e afetará permanentemente suas estatísticas de estudos.",
    confirmLabel: "Remover",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  resetDashboard: {
    title: "Resetar dashboard?",
    description:
      "Seu layout personalizado será substituído pela organização padrão. Esta ação não pode ser desfeita.",
    confirmLabel: "Resetar agora",
    cancelLabel: "Manter como está",
    variant: "warning" as ConfirmVariant,
    icon: RotateCcw,
  },
  deleteGlossaryWord: {
    title: "Remover do glossário?",
    description:
      "Esta palavra será removida permanentemente da sua lista salva.",
    confirmLabel: "Remover",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  deleteMovie: {
    title: "Excluir filme?",
    description: "Este filme será removido permanentemente do seu catálogo.",
    confirmLabel: "Excluir",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  deleteTask: {
    title: "Excluir tarefa?",
    description: "Esta tarefa será removida permanentemente da sua lista.",
    confirmLabel: "Excluir",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  deleteAlarm: {
    title: "Excluir alarme?",
    description: "Este alarme será removido e não irá mais disparar.",
    confirmLabel: "Excluir",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  deleteBook: {
    title: "Remover livro?",
    description:
      "Este livro e todo o seu histórico de sessões serão removidos permanentemente da biblioteca.",
    confirmLabel: "Remover",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
  deleteReadingSession: {
    title: "Remover sessão de leitura?",
    description:
      "Esta sessão será removida e afetará seu progresso registrado.",
    confirmLabel: "Remover",
    cancelLabel: "Cancelar",
    variant: "danger" as ConfirmVariant,
  },
} as const;
