"use client";

import { Edit3, FolderOpen } from "lucide-react";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";

import { getModuleColor } from "@/modules.config";

interface NotesInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function NotesInfoModal({ show, onClose }: NotesInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("notes")}
      title="Guia de Anotações"
      subtitle="Organize suas ideias e conhecimentos com Markdown"
      closeLabel="Entendido, mãos à obra!"
    >
      <InfoSection icon={FolderOpen} title="Estrutura de Arquivos">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Mantenha suas notas organizadas em pastas. Você pode mover itens
          arrastando e soltando no gerenciador:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Pastas Ilimitadas",
              desc: "Crie hierarquias personalizadas",
            },
            { label: "Drag & Drop", desc: "Mova notas e pastas livremente" },
            { label: "Localização", desc: "Veja o caminho real dos arquivos" },
            { label: "Acesso Rápido", desc: "Abra a pasta local no sistema" },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Edit3} title="Escrita e Formatação">
        <p className="text-sm text-muted-foreground leading-relaxed">
          As notas suportam Markdown, permitindo formatação rica de forma
          simples:
        </p>
        <StatRow label="Suporte a Markdown" value="Títulos, listas e links" />
        <StatRow label="Fixação de Notas" value="Até 3 notas fixas no topo" />
      </InfoSection>

      <ProTip title="Poder da Pesquisa">
        Use a barra de pesquisa para filtrar instantaneamente notas em{" "}
        <span className="text-foreground font-medium">qualquer pasta</span>. O
        Aegis busca no título e no conteúdo para você nunca perder uma ideia.
      </ProTip>
    </ModuleInfoModal>
  );
}
