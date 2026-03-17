"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
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

        <div className="relative p-6 rounded-xl bg-neutral-900/30 border border-neutral-800 shadow-inner group-hover:border-neutral-700 transition-colors">
          <Icon className="w-12 h-12 text-neutral-600/60" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-neutral-400 mb-2">{title}</h3>

      {description && (
        <p className="text-xs text-neutral-600 max-w-[240px] leading-relaxed font-medium">
          {description}
        </p>
      )}
    </div>
  );
}
