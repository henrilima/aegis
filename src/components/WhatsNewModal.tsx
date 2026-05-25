"use client";

import { CheckCircle2, PartyPopper, Sparkles, X } from "lucide-react";
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

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
      {/* Backdrop com desfoque mais suave - Transformado em button para Acessibilidade */}
      <button
        type="button"
        aria-label="Fechar modal"
        className={cn(
          "absolute inset-0 w-full h-full border-none bg-background/40 backdrop-blur-md transition-opacity duration-500 cursor-default",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      {/* Container do Modal - Design Minimalista e Integrado */}
      <div
        className={cn(
          "relative w-full max-w-[580px] max-h-[85vh] bg-background border border-border rounded-[28px] overflow-hidden flex flex-col transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)",
          isOpen
            ? "scale-100 opacity-100 translate-y-0 rotate-0"
            : "scale-95 opacity-0 translate-y-8 rotate-1",
        )}
      >
        {/* Cabeçalho Minimalista */}
        <div className="relative p-8 md:p-10 pb-0 flex flex-col items-center text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-all text-muted-foreground hover:text-foreground z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center border-2 mb-6 animate-in zoom-in-50 duration-500",
              themeStyles.border,
              themeStyles.bg,
            )}
          >
            <PartyPopper className={cn("w-8 h-8", themeStyles.text)} />
          </div>

          <div className="space-y-1.5 animate-in slide-in-from-top-4 duration-700 delay-100">
            <h2 className="text-2xl md:text-3xl font-black">
              Aegis <span className={themeStyles.text}>{version}</span>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-[80%] mx-auto">
              Sua central de produtividade acaba de ficar ainda mais poderosa.
            </p>
          </div>
        </div>

        {/* Área de Conteúdo - Duas Colunas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna de Novidades */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1 mb-2">
                <Sparkles className={cn("w-4 h-4", themeStyles.text)} />
                <h3 className="text-[10px] font-bold text-muted-foreground">
                  Novidades
                </h3>
              </div>
              <div className="space-y-3">
                {highlights
                  .filter((h) => h.title === "Novidade")
                  .map((h, i) => (
                    <div
                      key={`new-${i + 1}`}
                      style={{ animationDelay: `${i * 40 + 300}ms` }}
                      className="group p-3.5 bg-muted/30 border border-border/50 rounded-2xl flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3" />
                      </div>
                      <p className="text-[11px] text-muted-foreground/90 leading-relaxed font-medium">
                        {h.description}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Coluna de Correções */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-[10px] font-bold text-muted-foreground">
                  Estabilidade
                </h3>
              </div>
              <div className="space-y-3">
                {highlights
                  .filter((h) => h.title === "Correção")
                  .map((h, i) => (
                    <div
                      key={`fix-${i + 1}`}
                      style={{ animationDelay: `${i * 40 + 500}ms` }}
                      className="group p-3.5 bg-muted/20 border border-border/40 rounded-2xl flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-3 fill-mode-both"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                        {h.description}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé - Ações em Duas Colunas conforme o Padrão */}
        <div className="p-8 pt-6 border-t border-border/10 flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 w-full justify-center">
            <a
              href="https://github.com/henrilima/aegis/blob/main/changelog.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 max-w-[180px] py-3 rounded-xl border border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 text-[11px] font-bold transition-all text-center"
            >
              Ver todas as mudanças
            </a>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "flex-1 max-w-[180px] py-3 rounded-xl text-black dark:text-white font-bold text-[11px] transition-all active:scale-95",
                themeStyles.solid,
                themeStyles.solidHover,
              )}
            >
              Descobrir
            </button>
          </div>
          <span className="text-[9px] text-foreground font-medium opacity-30">
            Aegis Prisma • Release Update
          </span>
        </div>
      </div>
    </div>
  );
}
