"use client";

import { CalendarDays, Flag } from "lucide-react";
import { ModuleGuideContainer } from "@/components/global/ModuleGuideContainer";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import type { ThemeColorKey } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface CalendarInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function CalendarInfoModal({ show, onClose }: CalendarInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("calendar")}
      title="Agenda & Eventos"
      subtitle="Sua central de tempo e compromissos"
      closeLabel="Entendido, vamos planejar!"
    >
      <CalendarGuideContent />
    </ModuleInfoModal>
  );
}

export function CalendarGuidePanel({ onBack }: { onBack?: () => void }) {
  return (
    <ModuleGuideContainer
      color={getModuleColor("calendar") as ThemeColorKey}
      icon={CalendarDays}
      title="Agenda & Eventos"
      subtitle="Sua central de tempo e compromissos"
      onBack={onBack}
    >
      <CalendarGuideContent />
    </ModuleGuideContainer>
  );
}

function CalendarGuideContent() {
  return (
    <>
      <InfoSection icon={CalendarDays} title="Gestão de Compromissos">
        <p className="text-sm text-muted-foreground leading-relaxed">
          O Calendário do Aegis permite que você visualize seu tempo de forma
          estratégica, integrando eventos manuais e prazos automáticos:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Eventos Manuais",
              desc: "Clique duplo em qualquer dia para adicionar",
            },
            {
              label: "Prazos de Tarefas",
              desc: "Visualização automática de deadlines",
            },
            {
              label: "Painel Diário",
              desc: "Veja todos os detalhes ao selecionar um dia",
            },
            {
              label: "Arraste de Datas",
              desc: "Remarque datas arrastando elementos no grid",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Flag} title="Priorização Semanal">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Identifique eventos importantes através do nível de prioridade (Alta,
          Média, Baixa) com codificação por cores.
        </p>
        <StatRow label="Altas" value="Identificação visual vermelha" />
        <StatRow label="Prazos" value="Integração ativa com Lista de Tarefas" />
      </InfoSection>

      <ProTip title="Clique e Segure">
        Você pode selecionar vários dias ou arrastar eventos existentes para
        replanejar sua semana de forma intuitiva no modo mensal.
      </ProTip>
    </>
  );
}
