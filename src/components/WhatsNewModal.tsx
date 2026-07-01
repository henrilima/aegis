"use client";

import {
  CheckCircle2,
  ExternalLink,
  PartyPopper,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export function WhatsNewModal({
  isOpen,
  onClose,
  version,
  highlights,
}: {
  isOpen: boolean;
  onClose: () => void;
  version: string;
  highlights: { title: string; description: string }[];
}) {
  const [mounted, setMounted] = useState(false);
  const { themeStyles } = useTheme();

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !mounted) return null;

  const updates = highlights.filter((h) => h.title === "Novidade");
  const fixes = highlights.filter((h) => h.title === "Correção");

  return (
    <div className="fixed inset-0 z-9990 flex items-center justify-center p-4">
      {/* Fundo escuro com desfoque de tela */}
      <button
        type="button"
        aria-label="Fechar"
        className={cn(
          "absolute inset-0 w-full h-full border-none bg-black/40 backdrop-blur-md transition-opacity duration-500 cursor-default",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      {/* Janela do Modal */}
      <div
        className={cn(
          "relative w-full max-w-[620px] max-h-[82vh] bg-background border border-border/80 rounded-[32px] overflow-hidden flex flex-col transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)",
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-8",
        )}
      >
        {/* Cabeçalho Premium com Efeito de Luz Linear superior */}
        <div className="relative pt-10 pb-6 px-8 flex flex-col items-center text-center border-b border-border/20">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-muted/40 hover:bg-muted/80 rounded-full transition-all text-muted-foreground hover:text-foreground z-10"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Ícone de Festa Animado */}
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center border-2 mb-4 bg-linear-to-b",
              themeStyles.border,
              "from-background to-muted",
            )}
          >
            <PartyPopper
              className={cn("w-6 h-6 animate-pulse", themeStyles.text)}
            />
          </div>

          <div className="space-y-2">
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-wide border bg-muted/50",
                themeStyles.text,
                themeStyles.border,
              )}
            >
              Versão {version}
            </span>
            <h2 className="text-2xl font-black text-foreground">
              Novidades do <span className={themeStyles.text}>Aegis</span>
            </h2>
            <p className="text-xs text-muted-foreground max-w-[85%] mx-auto leading-relaxed">
              Explore os novos recursos criados para otimizar sua consistência,
              produtividade e foco.
            </p>
          </div>
        </div>

        {/* Corpo do Modal - Grid com scroll otimizado */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-6">
          {/* Seção de Novidades e Melhorias */}
          {updates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 px-1">
                <Sparkles className={cn("w-4 h-4", themeStyles.text)} />
                <h3 className="text-xs font-bold text-foreground">
                  Recursos & Melhorias
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {updates.map((h, i) => (
                  <div
                    key={`new-${i + 1}`}
                    className="p-4 bg-muted/20 hover:bg-muted/30 border border-border/40 hover:border-amber-500/20 rounded-2xl flex gap-3.5 text-left transition-all duration-300 group"
                  >
                    <div className="p-2 h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/10 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-bold mb-1">
                        {h.description.split(":")[0]}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                        {h.description.split(":").slice(1).join(":") ||
                          h.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção de Estabilidade */}
          {fixes.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-1.5 px-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-foreground">
                  Estabilidade & Correções
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {fixes.map((h, i) => (
                  <div
                    key={`fix-${i + 1}`}
                    className="p-4 bg-muted/10 hover:bg-muted/20 border border-border/40 rounded-2xl flex gap-3.5 text-left transition-all duration-300"
                  >
                    <div className="p-2 h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/10 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground font-bold mb-1">
                        {h.description.split(":")[0]}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                        {h.description.split(":").slice(1).join(":") ||
                          h.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Premium */}
        <div className="p-6 bg-muted/20 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href="https://github.com/henrilima/aegis/blob/main/changelog.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver histórico completo
          </a>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              "w-full sm:w-auto px-6 py-2.5 rounded-xl text-black dark:text-white font-bold text-[11px] transition-all duration-300 cursor-pointer active:scale-97 select-none border-none",
              themeStyles.solid,
              themeStyles.solidHover,
            )}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
