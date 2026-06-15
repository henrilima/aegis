"use client";

import { BarChart2, Settings } from "lucide-react";
import { ModuleGuideContainer } from "@/components/global/ModuleGuideContainer";
import {
  FeatureGrid,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import { getModuleColor } from "@/modules.config";

export function GradesGuidePanel() {
  return (
    <ModuleGuideContainer
      color={getModuleColor("grades")}
      icon={BarChart2}
      title="Simulados & Notas"
      subtitle="Guia de acompanhamento e cálculo de médias"
    >
      <GradesGuideContent />
    </ModuleGuideContainer>
  );
}

function GradesGuideContent() {
  return (
    <>
      <InfoSection icon={BarChart2} title="Acompanhamento Acadêmico">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Registre e gerencie suas avaliações, provas e simulados no Aegis para
          monitorar seu desempenho e progresso nas disciplinas:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Tipos",
              desc: "Suporta Prova, Simulado, Atividade, Trabalho e Quiz",
            },
            { label: "Pesos", desc: "Defina pesos individuais para cada nota" },
            {
              label: "Corte",
              desc: "Opção de dividir notas pela metade para cálculos específicos",
            },
            {
              label: "Questões",
              desc: "Registre número de acertos para estatísticas de taxa de acerto",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Settings} title="Fórmulas e Métodos de Média">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Você pode configurar um cálculo de média personalizado para cada
          matéria:
        </p>
        <StatRow
          label="Média Simples"
          value="Soma de todas as notas dividida pela quantidade total."
        />
        <StatRow
          label="Média Ponderada"
          value="Calcula a média multiplicando cada nota pelo seu respectivo peso."
        />
        <StatRow
          label="Modo Meta"
          value="Soma acumulada de pontos brutos. Útil para verificar quanto falta para aprovação."
        />
        <StatRow
          label="Personalizada"
          value="Escreva sua própria fórmula matemática (ex: N1*0.4 + N2*0.6)."
        />
      </InfoSection>

      <ProTip title="Comunicação Positiva">
        Se o seu rendimento em uma matéria ainda estiver abaixo da média
        configurada, o Aegis exibirá o status{" "}
        <span className="text-foreground font-medium">
          "Ainda não aprovado"
        </span>{" "}
        com a projeção exata de pontos que faltam para você atingir seu
        objetivo. Acompanhe a aba de Metas para se manter no caminho!
      </ProTip>
    </>
  );
}
