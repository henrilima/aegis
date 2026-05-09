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
 * Projetado para ser visualmente agradável sem ser excessivamente opaco ou invisível.
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
        "flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in duration-700",
        className,
      )}
    >
      <div className="relative mb-6">
        {/* Efeito de brilho sutil no fundo */}
        <div className="absolute inset-0 bg-neutral-500/5 blur-3xl rounded-full scale-150" />

        <div className="relative p-6 rounded-xl bg-card/30 border border-border group-hover:border-border transition-colors">
          <Icon className="w-12 h-12 text-neutral-600/60" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-muted-foreground mb-2">{title}</h3>

      {description && (
        <p className="text-xs text-neutral-600 max-w-[240px] leading-relaxed font-medium">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-accent/50 transition-all active:scale-95 cursor-pointer"
        >
          {ActionIcon && <ActionIcon className="w-3.5 h-3.5" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
