"use client";

import { Film, Heart, Search } from "lucide-react";
import { ModuleGuideContainer } from "@/components/global/ModuleGuideContainer";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  FeatureGrid,
  InfoSection,
  ProTip,
  StatRow,
} from "@/components/global/ModuleInfoParts";
import { getModuleColor } from "@/modules.config";

interface MoviesInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function MoviesInfoModal({ show, onClose }: MoviesInfoModalProps) {
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={getModuleColor("movies")}
      title="Catálogo de Filmes"
      subtitle="Organize sua jornada cinematográfica e watchlist"
      closeLabel="Entendido, luz, câmera, ação!"
    >
      <MoviesGuideContent />
    </ModuleInfoModal>
  );
}

export function MoviesGuidePanel({ onBack }: { onBack?: () => void }) {
  return (
    <ModuleGuideContainer
      color={getModuleColor("movies")}
      icon={Film}
      title="Catálogo de Filmes"
      subtitle="Organize sua jornada cinematográfica e watchlist"
      onBack={onBack}
    >
      <MoviesGuideContent />
    </ModuleGuideContainer>
  );
}

function MoviesGuideContent() {
  return (
    <>
      <InfoSection icon={Search} title="Busca Inteligente (TMDb)">
        <p className="text-sm text-muted-foreground leading-relaxed">
          O Aegis integra-se ao TMDb para buscar informações oficiais de filmes
          al redor do mundo:
        </p>
        <FeatureGrid
          items={[
            {
              label: "Dados Oficiais",
              desc: "Título, diretor, ano e sinopse automáticos",
            },
            {
              label: "Pôsteres Reais",
              desc: "Carregue as artes oficiais dos filmes",
            },
            {
              label: "Multi-idioma",
              desc: "Resultados em português do Brasil",
            },
            {
              label: "Fácil Adição",
              desc: "Um clique para salvar em sua biblioteca",
            },
          ]}
        />
      </InfoSection>

      <InfoSection icon={Film} title="Sua Biblioteca Digital">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Organize seus filmes entre o que você já viu e o que ainda deseja
          assistir:
        </p>
        <StatRow label="Assistidos" value="Mantenha seu histórico de sessões" />
        <StatRow
          label="Quero Assistir"
          value="Sua lista de desejos (Watchlist)"
        />
        <StatRow label="Avaliações" value="Dê notas de 0.5 a 5 estrelas" />
      </InfoSection>

      <InfoSection icon={Heart} title="Favoritos">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Destaque as obras que mais te marcaram para acesso rápido na aba de
          favoritos.
        </p>
      </InfoSection>

      <ProTip title="Integração de API">
        Para usar a busca online, você deve configurar sua própria chave da API
        do TMDb nas configurações de Integrações do app.
      </ProTip>
    </>
  );
}
