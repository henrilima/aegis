"use client";

import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { ModuleColorProvider } from "@/components/global/ModuleInfoParts";
import { ModalShell } from "@/components/ui/ModalShell";
import type { ThemeColorKey } from "@/lib/utils";
import { cn, getColorTheme } from "@/lib/utils";

interface ModuleInfoModalProps {
  /** Visibilidade */
  show: boolean;
  /** Fechar o modal */
  onClose: () => void;
  /** Cor de identidade do módulo (usa THEME_COLORS) */
  color: ThemeColorKey;
  /** Ícone exibido no header (padrão: HelpCircle) */
  icon?: LucideIcon;
  /** Título principal */
  title: string;
  /** Subtítulo/descrição */
  subtitle?: string;
  /** Texto do botão de fechar no rodapé */
  closeLabel?: string;
  /** Conteúdo do modal (seções, dicas, etc.) */
  children: ReactNode;
}

/**
 * ModuleInfoModal - Componente global de "Guia do Módulo".
 *
 * Substitui as 7 cópias quase idênticas de InfoModal espalhadas pelos módulos.
 * Utiliza ModalShell internamente (ESC fecha, overlay não fecha).
 *
 * @example
 *   <ModuleInfoModal
 *     show={showInfo}
 *     onClose={() => setShowInfo(false)}
 *     color="teal"
 *     title="Hábitos & Disciplina"
 *     subtitle="Guia para construção de rotina"
 *     closeLabel="Entendido, foco total!"
 *   >
 *     <InfoSection ... />
 *   </ModuleInfoModal>
 */
export function ModuleInfoModal({
  show,
  onClose,
  color,
  icon: Icon,
  title,
  subtitle,
  closeLabel = "Entendido!",
  children,
}: ModuleInfoModalProps) {
  const theme = getColorTheme(color);

  return (
    <ModalShell isOpen={show} onClose={onClose} size="lg">
      <ModuleColorProvider color={color}>
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0 bg-card/50">
          <div className="flex items-center gap-3">
            <div
              className={cn("p-2 rounded-xl border", theme.bg, theme.border)}
            >
              {Icon ? (
                <Icon className={cn("w-5 h-5", theme.text)} />
              ) : (
                // Fallback: ponto colorido
                <div className={cn("w-5 h-5 rounded-full", theme.solid)} />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-none">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo rolável */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          {children}
        </div>

        {/* Rodapé */}
        <div className="p-6 border-t border-border/60 bg-card/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "px-6 py-2 rounded-xl text-white text-xs font-bold transition-all active:scale-95 cursor-pointer",
              theme.solid,
              theme.solidHover,
            )}
          >
            {closeLabel}
          </button>
        </div>
      </ModuleColorProvider>
    </ModalShell>
  );
}
