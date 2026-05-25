"use client";

import { BarChart3, Brain, Gauge, Sparkles } from "lucide-react";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import { getModuleColor } from "@/modules.config";

interface StatisticsInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function StatisticsInfoModal({
  show,
  onClose,
}: StatisticsInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("statistics")}
      title="Leitura de Performance"
      subtitle="Como interpretar os sinais cruzados do Aegis"
      closeLabel="Entendido"
    >
      <InfoSection icon={Sparkles} title="Painel do periodo">
        <p className="text-sm text-muted-foreground leading-relaxed">
          A primeira area resume o ciclo selecionado: dias com atividade, carga
          total de estudo, leitura, melhor dia de acerto e sinais que ajudam a
          escolher a proxima prioridade.
        </p>
      </InfoSection>

      <InfoSection icon={Gauge} title="Indicadores-chave">
        <StatRow
          label="Precisao media"
          value="Taxa de acerto e eficiencia por hora de estudo"
        />
        <StatRow
          label="Consistencia"
          value="Frequencia de registros uteis no periodo"
        />
        <StatRow
          label="Sono e foco"
          value="Media, sequencias e impacto no rendimento"
        />
      </InfoSection>

      <InfoSection icon={Brain} title="Sinais comparativos">
        <FeatureGrid
          items={[
            {
              label: "Sono descansado",
              desc: "Compara acertos apos noites longas e noites curtas",
            },
            {
              label: "Foco alto",
              desc: "Compara dias com foco forte contra dias de foco baixo",
            },
            {
              label: "Materias",
              desc: "Mostra onde seu tempo esta concentrado e o acerto medio",
            },
            {
              label: "Mapa temporal",
              desc: "Normaliza sono, estudo, leitura e acerto na mesma linha do tempo",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={BarChart3} title="Dados brutos">
        <p className="text-sm text-muted-foreground leading-relaxed">
          O diario de metricas preserva os ultimos registros do periodo para
          auditoria rapida. Use essa tabela quando quiser confirmar de onde um
          insight veio.
        </p>
      </InfoSection>

      <ProTip title="Melhor uso">
        Alterne entre 14, 30 e 60 dias. Periodos curtos mostram mudancas de
        rotina; periodos longos revelam padroes mais estaveis.
      </ProTip>
    </ModuleInfoModal>
  );
}
