"use client";

import { AlertTriangle } from "lucide-react";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
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

  return (
    <ModuleInfoModal
      show={isOpen}
      onClose={onClose}
      color="amber"
      icon={AlertTriangle}
      title="Aviso de Tradução"
      subtitle="Definições e termos traduzidos automaticamente"
      closeLabel="Entendido"
    >
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-amber-500">Tradução Automática</h3>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Como os dados vêm de uma API internacional, as definições e exemplos
            são traduzidos automaticamente. É possível encontrar erros sutis ou
            exemplos que não fazem sentido literal em português.
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
            className={cn("w-2 h-2 rounded-full animate-pulse", theme.solid)}
          />
          <p className="text-xs text-foreground/70 leading-relaxed font-medium">
            <span className={cn("font-bold", theme.text)}>
              Dica de Precisão:
            </span>{" "}
            Para resultados ainda mais precisos, experimente pesquisar o termo
            diretamente em inglês (caso saiba).
          </p>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed italic">
          Utilizamos motores de tradução avançados para garantir a melhor
          precisão possível, mas recomendamos sempre verificar o contexto
          original se houver dúvida.
        </p>
      </div>
    </ModuleInfoModal>
  );
}
