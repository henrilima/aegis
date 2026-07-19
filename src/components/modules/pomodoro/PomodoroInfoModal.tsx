"use client";

import { History, Settings, Timer } from "lucide-react";
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

interface PomodoroInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function PomodoroInfoModal({ show, onClose }: PomodoroInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("pomodoro")}
      title="Técnica Pomodoro"
      subtitle="Guia para produtividade e foco extremo"
      closeLabel="Entendido, hora de focar!"
    >
      <PomodoroGuideContent />
    </ModuleInfoModal>
  );
}

export function PomodoroGuidePanel({ onBack }: { onBack?: () => void }) {
  return (
    <ModuleGuideContainer
      color={getModuleColor("pomodoro") as ThemeColorKey}
      icon={Timer}
      title="Técnica Pomodoro"
      subtitle="Guia para produtividade e foco extremo"
      onBack={onBack}
    >
      <PomodoroGuideContent />
    </ModuleGuideContainer>
  );
}

function PomodoroGuideContent() {
  return (
    <>
      <InfoSection icon={Timer} title="Ciclos de Trabalho e Pausa">
        <p className="text-sm text-muted-foreground leading-relaxed">
          O método Pomodoro consiste em dividir o trabalho em blocos de foco
          total seguidos por breves intervalos:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Foco (Work)",
              desc: "Tempo dedicado à execução sem interrupções",
            },
            {
              label: "Pausa (Break)",
              desc: "Intervalo para descanso mental e físico",
            },
            {
              label: "Persistência",
              desc: "O timer continua rodando mesmo ao mudar de página",
            },
            {
              label: "Notificações",
              desc: "Avisos críticos ao concluir cada ciclo",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Settings} title="Personalização">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ajuste o tempo ideal para o seu ritmo de trabalho:
        </p>
        <StatRow label="Padrão Clássico" value="25 min foco / 5 min pausa" />
        <StatRow label="Deep Work" value="50 min foco / 10 min pausa" />
      </InfoSection>

      <InfoSection icon={History} title="Histórico de Sessões">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cada ciclo concluído é registrado automaticamente, permitindo que você
          acompanhe seu volume de trabalho diário.
        </p>
      </InfoSection>

      <ProTip title="Foco Absoluto">
        Ao iniciar o timer, tente se desconectar de redes sociais e distrações.
        O objetivo do Pomodoro é o estado de fluxo (flow).
      </ProTip>
    </>
  );
}
