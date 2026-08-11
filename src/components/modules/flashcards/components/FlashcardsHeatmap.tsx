"use client";

import { Flame } from "lucide-react";
import { useMemo } from "react";
import {
  ActivityHeatmap,
  type HeatmapItem,
} from "@/components/global/ActivityHeatmap";
import { formatDateLocal, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Flashcard, FlashcardDeck } from "../types";

interface RichDeck extends FlashcardDeck {
  cards: Flashcard[];
}

interface FlashcardsHeatmapProps {
  decks: RichDeck[];
}

export function FlashcardsHeatmap({ decks }: FlashcardsHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const moduleColor = getModuleColor("flashcards");
  const theme = getColorTheme(moduleColor);

  const allCards = useMemo(() => decks.flatMap((d) => d.cards), [decks]);

  const { activityData, totalCards, activeDays, accuracyRate } = useMemo(() => {
    const data: Record<string, HeatmapItem> = {};
    let totalCardsReviewed = 0;
    let totalSuccess = 0;
    const activeDaysSet = new Set<string>();

    for (const card of allCards) {
      if (card.lastReviewed) {
        const dateStr = formatDateLocal(card.lastReviewed);
        if (!dateStr) continue;

        if (dateStr.startsWith(String(currentYear))) {
          activeDaysSet.add(dateStr);
        }

        if (!data[dateStr]) {
          data[dateStr] = { count: 0, details: "" };
        }
        const reviews = card.reviewCount || 1;
        const success = card.successCount || 0;

        data[dateStr].count += reviews;
        totalCardsReviewed += reviews;
        totalSuccess += success;
      }
    }

    // Gerar detalhes amigáveis para o tooltip
    for (const [_dateStr, item] of Object.entries(data)) {
      item.details = `${item.count} ${item.count === 1 ? "cartão revisado" : "cartões revisados"}`;
    }

    const accuracyRateVal =
      totalCardsReviewed > 0
        ? Math.round((totalSuccess / totalCardsReviewed) * 100)
        : 0;

    return {
      activityData: data,
      totalCards: totalCardsReviewed,
      activeDays: activeDaysSet.size,
      accuracyRate: accuracyRateVal,
    };
  }, [allCards, currentYear]);

  return (
    <ActivityHeatmap
      color={moduleColor}
      title="Mapa de Constância"
      subtitle="Frequência de revisões de flashcards por ano"
      icon={Flame}
      data={activityData}
      unitLabel="cartões"
      stats={[
        { label: "CARTÕES", value: totalCards, colorClass: theme.text },
        { label: "DIAS ATIVOS", value: activeDays },
        {
          label: "PRECISÃO",
          value: `${accuracyRate}%`,
          colorClass: "text-emerald-400",
        },
      ]}
    />
  );
}
