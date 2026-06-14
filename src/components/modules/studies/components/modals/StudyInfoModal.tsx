"use client";

import { BookOpen, GraduationCap, Target } from "lucide-react";
import { ModuleGuideContainer } from "@/components/global/ModuleGuideContainer";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  Highlight,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";

interface StudyInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function StudyInfoModal({ show, onClose }: StudyInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color="violet"
      title="Guia do Módulo de Estudos"
      subtitle="Como gerenciar seu desempenho acadêmico"
      closeLabel="Entendido, vamos lá!"
    >
      <StudyGuideContent />
    </ModuleInfoModal>
  );
}

export function StudyGuidePanel() {
  return (
    <ModuleGuideContainer
      color="violet"
      icon={GraduationCap}
      title="Guia do Módulo de Estudos"
      subtitle="Como gerenciar seu desempenho acadêmico"
    >
      <StudyGuideContent />
    </ModuleGuideContainer>
  );
}

function StudyGuideContent() {
  return (
    <>
      <InfoSection icon={GraduationCap} title="Registrando Sessões">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Clique no botão <Highlight>"Nova Sessão"</Highlight> para registrar
          seu tempo de estudo. Crie sessões separadas para teoria e questões.
        </p>
        <FeatureGrid
          items={[
            { label: "Questões", desc: "Acertos em inéditas e revisões" },
            { label: "Páginas", desc: "Quantidade de leitura realizada" },
            { label: "Tempo", desc: "Duração total da sessão" },
            {
              label: "Extra",
              desc: "Crie sua própria métrica (ex: Flashcards)",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Target} title="Configurando Metas">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Acesse o ícone de engrenagem para definir suas metas semanais e
          mensais. O sistema calculará automaticamente seu progresso em relação
          a:
        </p>
        <StatRow label="Horas de estudo" value="Consistência temporal" />
        <StatRow label="Questões resolvidas" value="Volume de prática" />
      </InfoSection>

      <ProTip title="Dica de Performance" icon={BookOpen}>
        Use o <span className="text-foreground font-medium">Heatmap</span> para
        visualizar sua constância. Dias mais escuros representam maior volume de
        estudo, ajudando a identificar padrões de produtividade.
      </ProTip>
    </>
  );
}
