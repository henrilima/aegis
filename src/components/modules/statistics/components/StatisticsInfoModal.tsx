"use client";

import { BarChart3, Brain, Zap } from "lucide-react";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import { getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface StatisticsInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function StatisticsInfoModal({
  show,
  onClose,
}: StatisticsInfoModalProps) {
  const _theme = getColorTheme(getModuleColor("statistics"));

  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("statistics")}
      title="Inteligência de Dados"
      subtitle="Guia para análise de performance e correlações"
      closeLabel="Entendido, vamos analisar!"
    >
      <InfoSection icon={BarChart3} title="Matriz de Cruzamento">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Este módulo consolida dados de múltiplos módulos para gerar insights
          que você não veria isoladamente:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Cruzamento Temporal",
              desc: "Compare Sono vs Estudo no mesmo gráfico",
            },
            {
              label: "Impacto do Sono",
              desc: "Veja como suas horas de descanso afetam o foco",
            },
            {
              label: "Distribuição",
              desc: "Gráfico de pizza com as matérias mais estudadas",
            },
            {
              label: "Log de Processamento",
              desc: "Tabela detalhada com métricas diárias brutas",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Zap} title="Métricas de Performance">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Entenda o que cada indicador significa:
        </p>
        <StatRow
          label="Eficiência"
          value="Quantidade de itens/questões por hora"
        />
        <StatRow
          label="Taxa de Precisão"
          value="Porcentagem de acertos nas sessões"
        />
        <StatRow
          label="Consistência"
          value="Frequência de uso do Aegis no período"
        />
      </InfoSection>

      <InfoSection icon={Brain} title="Insights de Correlação">
        <p className="text-sm text-muted-foreground leading-relaxed">
          O sistema analisa automaticamente se há tendências positivas ou
          negativas entre suas variáveis de estilo de vida e produtividade.
        </p>
      </InfoSection>

      <ProTip title="Volume de Dados">
        As estatísticas ficam mais precisas quanto mais dados você registra nos
        módulos de{" "}
        <span className="text-foreground font-medium">
          Estudos, Sono e Leitura
        </span>
        . Tente manter registros diários para melhores insights.
      </ProTip>
    </ModuleInfoModal>
  );
}
