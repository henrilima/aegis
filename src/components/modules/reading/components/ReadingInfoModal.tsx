"use client";

import { BookOpen, History } from "lucide-react";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  Highlight,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import { getModuleColor } from "@/modules.config";

interface ReadingInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function ReadingInfoModal({ show, onClose }: ReadingInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("reading")}
      title="Biblioteca & Progresso"
      subtitle="Guia para gestão literária e metas de leitura"
      closeLabel="Entendido, boa leitura!"
    >
      <InfoSection icon={BookOpen} title="Gestão de Biblioteca">
        <p className="text-sm text-muted-foreground leading-relaxed">
          O Aegis transforma sua leitura em dados acionáveis. Organize sua
          estante digital com precisão:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Busca Inteligente",
              desc: "Dados e capas automáticos via Open Library",
            },
            {
              label: "Status Dinâmico",
              desc: "Separe entre Lendo, Lido, Abandonado ou Quero Ler",
            },
            {
              label: "Controle de Páginas",
              desc: "Acompanhe exatamente onde você parou em cada obra",
            },
            {
              label: "Categorias",
              desc: "Classifique por gênero, autor ou etiquetas personalizadas",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={History} title="Análise de Desempenho">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cada sessão registrada alimenta nosso motor de inteligência:
        </p>
        <StatRow
          label="Ritmo (PPM)"
          value="Páginas por minuto calculadas em tempo real"
        />
        <StatRow
          label="Tempo Restante"
          value="Estimativa baseada no seu ritmo médio atual"
        />
        <StatRow
          label="Histórico"
          value="Log detalhado de todas as suas sessões"
        />
      </InfoSection>

      <ProTip title="Metas e Constância">
        Defina <Highlight>Metas Semanais</Highlight> nas configurações do
        módulo. O Aegis monitora seu progresso e ajuda você a manter o hábito de
        leitura ativo todos os dias.
      </ProTip>
    </ModuleInfoModal>
  );
}
