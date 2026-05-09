"use client";

import { CalendarDays, Flag, Globe } from "lucide-react";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import { getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface CalendarInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function CalendarInfoModal({ show, onClose }: CalendarInfoModalProps) {
  const _theme = getColorTheme(getModuleColor("calendar"));

  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("calendar")}
      title="Agenda & Eventos"
      subtitle="Sua central de tempo e compromissos"
      closeLabel="Entendido, vamos planejar!"
    >
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
              label: "Navegação Rápida",
              desc: "Botão 'Hoje' para retorno instantâneo",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Globe} title="Feriados Nacionais (BR)">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Mantenha sua agenda atualizada com os feriados oficiais do Brasil de
          forma automática:
        </p>
        <StatRow
          label="Sincronização"
          value="Busca feriados do ano atual via API"
        />
        <StatRow
          label="Filtro Visual"
          hideDivider
          value="Oculte ou exiba feriados no grid"
        />
      </InfoSection>

      <InfoSection icon={Flag} title="Integração de Deadlines">
        <p className="text-sm text-muted-foreground leading-relaxed">
          O painel lateral de{" "}
          <span className="text-foreground font-medium">Próximos Prazos</span>{" "}
          monitora suas tarefas e sessões de leitura pendentes, garantindo que
          nada passe despercebido.
        </p>
      </InfoSection>

      <ProTip title="Atalho de Criação">
        Você pode criar um evento rapidamente clicando duas vezes em qualquer
        espaço vazio do grid do calendário.
      </ProTip>
    </ModuleInfoModal>
  );
}
