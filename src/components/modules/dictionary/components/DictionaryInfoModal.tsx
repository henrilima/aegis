"use client";

import { AlertTriangle, Globe, Star } from "lucide-react";
import { ModuleGuideContainer } from "@/components/global/ModuleGuideContainer";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  InfoCard,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface DictionaryInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function DictionaryGuidePanel({ onBack }: { onBack?: () => void }) {
  const color = getModuleColor("dictionary");
  const theme = getColorTheme(color);

  return (
    <ModuleGuideContainer
      color={color}
      icon={Globe}
      title="Dicionário & Léxico"
      subtitle="Guia para consulta e expansão de vocabulário"
      onBack={onBack}
    >
      <InfoSection icon={Globe} title="Base de Dados Internacional">
        <p className="text-sm text-muted-foreground leading-relaxed">
          O Aegis utiliza uma API internacional de alto desempenho. Para
          oferecer a melhor experiência em português:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Tradução Dinâmica",
              desc: "Termos em inglês traduzidos para PT-BR",
            },
            {
              label: "In-Memory Cache",
              desc: "Buscas repetidas são instantâneas",
            },
            {
              label: "Sugestões de Escrita",
              desc: "Corrigimos palavras digitadas errado",
            },
            {
              label: "Múltiplos Sentidos",
              desc: "Exibimos substantivos, verbos e mais",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Star} title="Seu Glossário Pessoal">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Salve as palavras que deseja memorizar. Elas ficarão disponíveis para
          consulta offline e estudo posterior:
        </p>
        <StatRow label="Favoritos" value="Destaque palavras importantes" />
        <StatRow
          label="Organização"
          value="Filtre seu léxico por data ou favoritos"
        />
      </InfoSection>

      {/* Aviso de Tradução - usa amber fixo por ser um aviso, não identidade do módulo */}
      <InfoCard title="Aviso de Tradução Automática" variant="default">
        <div className="flex gap-3 items-start">
          <div className={cn("shrink-0 p-2 rounded-lg", theme.bg)}>
            <AlertTriangle className={cn("w-4 h-4", theme.text)} />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Como os dados vêm de uma API internacional, as definições e exemplos
            são traduzidos automaticamente. É possível encontrar erros sutis ou
            exemplos que não fazem sentido literal em português.
          </p>
        </div>
      </InfoCard>

      <ProTip title="Atalho de Busca Rápida">
        Pressione{" "}
        <ToolTip content="Alt + D abre o dicionário de qualquer lugar">
          <span className="text-foreground font-bold px-1.5 py-0.5 rounded bg-black/30 border border-white/10 cursor-help">
            Alt + D
          </span>
        </ToolTip>{" "}
        em qualquer lugar do app para pesquisar uma palavra instantaneamente.
      </ProTip>
    </ModuleGuideContainer>
  );
}

export function DictionaryInfoModal({
  show,
  onClose,
}: DictionaryInfoModalProps) {
  const theme = getColorTheme(getModuleColor("dictionary"));

  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("dictionary")}
      title="Dicionário & Léxico"
      subtitle="Guia para consulta e expansão de vocabulário"
      closeLabel="Entendido, vamos lá!"
    >
      <InfoSection icon={Globe} title="Base de Dados Internacional">
        <p className="text-sm text-muted-foreground leading-relaxed">
          O Aegis utiliza uma API internacional de alto desempenho. Para
          oferecer a melhor experiência em português:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Tradução Dinâmica",
              desc: "Termos em inglês traduzidos para PT-BR",
            },
            {
              label: "In-Memory Cache",
              desc: "Buscas repetidas são instantâneas",
            },
            {
              label: "Sugestões de Escrita",
              desc: "Corrigimos palavras digitadas errado",
            },
            {
              label: "Múltiplos Sentidos",
              desc: "Exibimos substantivos, verbos e mais",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Star} title="Seu Glossário Pessoal">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Salve as palavras que deseja memorizar. Elas ficarão disponíveis para
          consulta offline e estudo posterior:
        </p>
        <StatRow label="Favoritos" value="Destaque palavras importantes" />
        <StatRow
          label="Organização"
          value="Filtre seu léxico por data ou favoritos"
        />
      </InfoSection>

      {/* Aviso de Tradução - usa amber fixo por ser um aviso, não identidade do módulo */}
      <InfoCard title="Aviso de Tradução Automática" variant="default">
        <div className="flex gap-3 items-start">
          <div className={cn("shrink-0 p-2 rounded-lg", theme.bg)}>
            <AlertTriangle className={cn("w-4 h-4", theme.text)} />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Como os dados vêm de uma API internacional, as definições e exemplos
            são traduzidos automaticamente. É possível encontrar erros sutis ou
            exemplos que não fazem sentido literal em português.
          </p>
        </div>
      </InfoCard>

      <ProTip title="Atalho de Busca Rápida">
        Pressione{" "}
        <ToolTip content="Alt + D abre o dicionário de qualquer lugar">
          <span className="text-foreground font-bold px-1.5 py-0.5 rounded bg-black/30 border border-white/10 cursor-help">
            Alt + D
          </span>
        </ToolTip>{" "}
        em qualquer lugar do app para pesquisar uma palavra instantaneamente.
      </ProTip>
    </ModuleInfoModal>
  );
}
