"use client";

import { BedDouble, Target } from "lucide-react";
import { ModuleGuideContainer } from "@/components/global/ModuleGuideContainer";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  Highlight,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import { getModuleColor } from "@/modules.config";

interface SleepInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function SleepInfoModal({ show, onClose }: SleepInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("sleep")}
      icon={BedDouble}
      title="Monitoramento de Sono"
      subtitle="Guia para otimizar seu descanso"
      closeLabel="Entendido, bons sonhos!"
    >
      <SleepGuideContent />
    </ModuleInfoModal>
  );
}

export function SleepGuidePanel() {
  return (
    <ModuleGuideContainer
      color={getModuleColor("sleep")}
      icon={BedDouble}
      title="Monitoramento de Sono"
      subtitle="Guia para otimizar seu descanso"
    >
      <SleepGuideContent />
    </ModuleGuideContainer>
  );
}

function SleepGuideContent() {
  return (
    <>
      <InfoSection icon={BedDouble} title="Registrando seus Ciclos">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Clique no botão <Highlight>"Registrar Sono"</Highlight> sempre que
          acordar para documentar seu ciclo de repouso:
        </p>
        <FeatureGrid
          items={[
            { label: "Horário", desc: "Quando deitou e quando levantou" },
            {
              label: "Qualidade",
              desc: "Avalie de 1 a 5 estrelas o seu vigor",
            },
            { label: "Notas", desc: "Descreva sonhos ou interrupções" },
            { label: "Sonecas", desc: "Registre breves descansos diurnos" },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Target} title="Objetivos e Consistência">
        <p className="text-sm text-muted-foreground leading-relaxed">
          No ícone de engrenagem, você define seu{" "}
          <Highlight>horário ideal</Highlight> de dormir e as{" "}
          <Highlight>horas desejadas</Highlight>. O sistema monitora:
        </p>
        <StatRow
          label="Déficit de Sono"
          value="Acúmulo de horas não dormidas na semana"
        />
        <StatRow
          label="Frequência"
          value="Consistência dos horários de deitar/acordar"
        />
        <StatRow
          label="Qualidade Média"
          value="Avaliação subjetiva do seu vigor matinal"
        />
      </InfoSection>

      <ProTip title="Débito de Sono">
        O Aegis calcula seu{" "}
        <span className="text-foreground font-medium">Débito de Sono</span>{" "}
        semanal. Dormir pouco durante a semana e tentar "compensar" no final de
        semana não elimina os efeitos biológicos da privação; a constância
        diária é a chave para o alto desempenho cognitivo.
      </ProTip>
    </>
  );
}
