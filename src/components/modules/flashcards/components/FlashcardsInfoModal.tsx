"use client";

import { Brain, Layers, Settings } from "lucide-react";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import { getModuleColor } from "@/modules.config";

interface FlashcardsInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function FlashcardsInfoModal({
  show,
  onClose,
}: FlashcardsInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("flashcards")}
      title="Guia do Módulo de Flashcards"
      subtitle="Memorização ativa e repetição espaçada para impulsionar seus estudos"
      closeLabel="Entendido, bons estudos!"
      icon={Brain}
    >
      <InfoSection icon={Layers} title="Organização em Baralhos">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Crie baralhos para separar seus tópicos de estudo. Personalize a cor
          de cada baralho para facilitar a identificação visual:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Frente e Verso",
              desc: "Adicione a pergunta na frente e a resposta no verso de cada cartão.",
            },
            {
              label: "Cores Customizadas",
              desc: "Associe cores aos seus baralhos para categorizá-los.",
            },
            {
              label: "Importação e Exportação",
              desc: "Faça backup ou compartilhe seus baralhos em formato JSON.",
            },
            {
              label: "Estatísticas Detalhadas",
              desc: "Acompanhe seu progresso e acertos em tempo real.",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Settings} title="Prática de Estudo">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Durante a sessão de estudos, tente lembrar a resposta antes de virar o
          cartão:
        </p>
        <StatRow
          label="Memorização Ativa"
          value="Esforce-se para recordar antes de ver a resposta"
        />
        <StatRow
          label="Autoavaliação Honesta"
          value="Classifique sua facilidade para agendar a próxima revisão"
        />
      </InfoSection>

      <ProTip title="Repetição Espaçada">
        Pratique diariamente para obter o melhor resultado. O algoritmo prioriza
        os cartões com menor taxa de acerto para ajudá-lo a fixar o conteúdo na
        memória de longo prazo.
      </ProTip>
    </ModuleInfoModal>
  );
}
