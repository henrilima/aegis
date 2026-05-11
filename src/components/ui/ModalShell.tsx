"use client";

import { type ReactNode, useEffect } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/utils";

type ModalSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const SIZE_MAP: Record<ModalSize, string> = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
  full: "w-full h-full rounded-none",
};

interface ModalShellProps {
  /** Controla se o modal está visível */
  isOpen?: boolean;
  /** Fechar o modal (ESC dispara isso automaticamente) */
  onClose: () => void;
  /** Tamanho máximo do painel */
  size?: ModalSize;
  /** z-index (padrão: z-50) */
  zIndex?: string;
  /** Classes extras para o painel interno */
  className?: string;
  /** Impede o fechamento pelo ESC se true */
  disableClose?: boolean;
  children: ReactNode;
}

/**
 * ModalShell - Wrapper padronizado para todos os modais customizados do Aegis.
 *
 * Comportamento:
 *  - Fecha ao pressionar ESC
 *  - NÃO fecha ao clicar fora (para evitar perda de dados)
 *  - Aplica body scroll lock automaticamente
 *  - Animação padrão: fade-in + zoom-in-95
 *
 * Uso:
 *   <ModalShell isOpen={show} onClose={onClose} size="lg">
 *     <div>...conteúdo...</div>
 *   </ModalShell>
 */
export function ModalShell({
  isOpen = true,
  onClose,
  size = "lg",
  zIndex = "z-50",
  className,
  disableClose = false,
  children,
}: ModalShellProps) {
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disableClose) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose, disableClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200",
        zIndex,
        size === "full" ? "p-0" : "p-4"
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          "relative w-full bg-background border border-border rounded-xl",
          "animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col",
          size === "full" ? "h-full max-h-none rounded-none border-none" : "max-h-[90vh]",
          SIZE_MAP[size],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
