"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Texto do botão de ação principal (opcional) */
  actionLabel?: string;
  /** Callback do botão de ação (requer actionLabel) */
  onAction?: () => void;
  /** Ícone opcional para o botão de ação */
  actionIcon?: LucideIcon;
  className?: string;
}

/**
 * Componente padronizado para estados vazios (Empty States) em toda a aplicação.
 * Projetado para ser limpo, acessível e alinhado ao design system sem sombras.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in duration-300",
        className,
      )}
    >
      <div className="mb-4 p-4 rounded-2xl bg-muted/20 border border-border/60 text-muted-foreground flex items-center justify-center">
        <Icon className="w-8 h-8 opacity-80" />
      </div>

      <h3 className="text-base font-bold text-foreground mb-1.5 leading-snug">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-muted-foreground max-w-70 leading-relaxed font-medium">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-accent/50 transition-all active:scale-95 cursor-pointer shadow-none"
        >
          {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
