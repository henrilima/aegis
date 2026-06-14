"use client";

import { ShieldOff, TrendingUp } from "lucide-react";
import { ModuleGuideContainer } from "@/components/global/ModuleGuideContainer";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  Highlight,
  InfoCard,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import { getModuleColor } from "@/modules.config";

interface HabitsInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function HabitsInfoModal({ show, onClose }: HabitsInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("habits")}
      title="Hábitos & Disciplina"
      subtitle="Guia para construção de rotina e autocontrole"
      closeLabel="Entendido, foco total!"
    >
      <HabitsGuideContent />
    </ModuleInfoModal>
  );
}

export function HabitsGuidePanel() {
  return (
    <ModuleGuideContainer
      color={getModuleColor("habits")}
      icon={TrendingUp}
      title="Hábitos & Disciplina"
      subtitle="Guia para construção de rotina e autocontrole"
    >
      <HabitsGuideContent />
    </ModuleGuideContainer>
  );
}

function HabitsGuideContent() {
  return (
    <>
      <InfoSection icon={TrendingUp} title="Hábitos Positivos">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Fortaleça seus comportamentos produtivos acompanhando sua frequência e
          mantendo sequências (streaks):
        </p>
        <InfoCard title="Entenda as Cargas" variant="accent">
          As <Highlight>Cargas</Highlight> funcionam como uma proteção para sua
          constância:
          <div className="mt-3 space-y-3">
            <p className="text-[13px] leading-relaxed">
              <strong>Nos hábitos positivos:</strong> Atuam como uma segurança.
              Caso você falhe em um dia, pode consumir uma carga para{" "}
              <Highlight>não perder sua sequência (streak)</Highlight> e manter
              o ritmo.
            </p>
            <p className="text-[13px] leading-relaxed border-t border-border/50 pt-2">
              <strong>Nos hábitos negativos:</strong> Are a "permissão para
              falhar". Ajudam a controlar vícios gradualmente, permitindo um
              limite de deslizes para evitar a abstinência súbita sem zerar seu
              progresso total.
            </p>
          </div>
        </InfoCard>
        <FeatureGrid
          items={[
            {
              label: "Cargas de Uso",
              desc: "Proteção contra quebra de sequência",
            },
            { label: "Streaks", desc: "Acompanhe sua sequência de dias" },
            { label: "Histórico", desc: "Visualize sua evolução no tempo" },
            { label: "Max Streak", desc: "Bata seus próprios recordes" },
          ]}
        />
      </InfoSection>

      <InfoSection icon={ShieldOff} title="Controle de Vícios">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Rastreie comportamentos negativos para eliminá-los. O sistema ajuda a
          monitorar o tempo desde o último deslize:
        </p>
        <StatRow
          label="Tempo de Abstinência"
          value="Contagem progressiva de dias"
        />
        <StatRow
          label="Botão de Reset"
          value="Reinicia o contador em caso de falha"
        />
      </InfoSection>

      <ProTip title="Lembretes Inteligentes">
        Ative as <Highlight>Notificações de Hábito</Highlight> nas
        configurações. O Aegis avisará no final do dia caso você tenha esquecido
        de marcar uma tarefa importante.
      </ProTip>
    </>
  );
}
