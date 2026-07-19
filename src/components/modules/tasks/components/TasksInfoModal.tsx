"use client";

import { Flag, Hash, ListTodo, Subtitles } from "lucide-react";
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

interface TasksInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function TasksInfoModal({ show, onClose }: TasksInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("tasks")}
      title="Gestão de Tarefas"
      subtitle="Organize seu fluxo de trabalho com hierarquia e prioridades"
      closeLabel="Entendido, vamos organizar!"
    >
      <TasksGuideContent />
    </ModuleInfoModal>
  );
}

export function TasksGuidePanel({ onBack }: { onBack?: () => void }) {
  return (
    <ModuleGuideContainer
      color={getModuleColor("tasks") as ThemeColorKey}
      icon={ListTodo}
      title="Gestão de Tarefas"
      subtitle="Organize seu fluxo de trabalho com hierarquia e prioridades"
      onBack={onBack}
    >
      <TasksGuideContent />
    </ModuleGuideContainer>
  );
}

function TasksGuideContent() {
  return (
    <>
      <InfoSection icon={Subtitles} title="Hierarquia de Subtarefas">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Divida grandes objetivos em passos menores. O Aegis permite criar um
          nível de subtarefas para manter tudo sob controle:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Passos Menores",
              desc: "Adicione subtarefas em qualquer item principal",
            },
            {
              label: "Conclusão em Cascata",
              desc: "Concluir o pai pode finalizar todos os filhos",
            },
            {
              label: "Recuperação de Órfãos",
              desc: "Subtarefas nunca somem, mesmo sem o pai",
            },
            {
              label: "Visão Clara",
              desc: "Indentação visual para facilitar a leitura",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Flag} title="Prioridades e Contexto">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Saiba exatamente o que fazer primeiro usando as cores e etiquetas de
          prioridade:
        </p>
        <StatRow label="Alta (Vermelho)" value="Urgente e Importante" />
        <StatRow label="Média (Amarelo)" value="Necessita atenção em breve" />
        <StatRow label="Baixa (Verde)" value="Pode ser feito depois" />
      </InfoSection>

      <InfoSection icon={Hash} title="Categorização">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Use hashtags ou categorias para separar trabalho, estudos e vida
          pessoal dentro da mesma lista.
        </p>
      </InfoSection>

      <ProTip title="Organização Rápida">
        A lista é ordenada automaticamente pelas tarefas de maior prioridade no
        topo, garantindo que você foque no que realmente importa.
      </ProTip>
    </>
  );
}
