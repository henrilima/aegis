"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface DictionaryTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DictionaryTranslationModal({
  isOpen,
  onClose,
}: DictionaryTranslationModalProps) {
  const color = getModuleColor("dictionary");
  const theme = getColorTheme(color);
  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-400 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-background border border-border rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-amber-500/5">
          <div className="flex items-center gap-3 text-amber-500">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Aviso de Tradução</h2>
          </div>
          <ToolTip content="Fechar">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </ToolTip>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-amber-500">Tradução Automática</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Como os dados vêm de uma API internacional, as definições e
                exemplos são traduzidos automaticamente. É possível encontrar
                erros sutis ou exemplos que não fazem sentido literal em
                português.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div
              className={cn(
                "p-4 rounded-xl border flex items-center gap-3",
                theme.bg,
                theme.border,
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  theme.solid,
                )}
              />
              <p className="text-xs text-foreground/70 leading-relaxed font-medium">
                <span className={cn("font-bold", theme.text)}>
                  Dica de Precisão:
                </span>{" "}
                Para resultados ainda mais precisos, experimente pesquisar o
                termo diretamente em inglês (caso saiba).
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed italic">
              Utilizamos motores de tradução avançados para garantir a melhor
              precisão possível, mas recomendamos sempre verificar o contexto
              original se houver dúvida.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-600 transition-all active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
