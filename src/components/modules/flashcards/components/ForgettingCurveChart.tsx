"use client";

import { Brain, Info, Layers } from "lucide-react";
import { useMemo } from "react";
import { getSystemIcon } from "@/components/global/IconSelect";
import { cn, getColorTheme, type ThemeColorKey } from "@/lib/utils";
import type { Flashcard, FlashcardDeck } from "../types";

interface ForgettingCurveChartProps {
  decks: (FlashcardDeck & { cards: Flashcard[] })[];
}

function getMemoryStability(card: Flashcard): number {
  const success = card.successCount || 0;
  const review = card.reviewCount || 1;
  return Math.round(1 + success * 2 * (success / Math.max(1, review)));
}

function getDaysSince(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const lastDate = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function calculateRetention(t: number, S: number): number {
  return Math.round(100 * Math.exp(-t / S));
}

export function ForgettingCurveChart({ decks }: ForgettingCurveChartProps) {
  // Lista de todos os cartões que já foram revisados ao menos uma vez
  const reviewedCardsList = useMemo(() => {
    return decks.flatMap((d) =>
      (d.cards || [])
        .filter((c) => Boolean(c.lastReviewed))
        .map((c) => ({
          ...c,
          deckName: d.name,
          deckColor: d.color,
        })),
    );
  }, [decks]);

  // Estatísticas de retenção calculadas por Baralho
  const deckRetentionStats = useMemo(() => {
    return decks.map((deck) => {
      const cards = deck.cards || [];
      const reviewedCards = cards.filter((c) => Boolean(c.lastReviewed));

      if (reviewedCards.length === 0) {
        return {
          id: deck.id,
          name: deck.name,
          color: deck.color,
          icon: deck.icon,
          totalCards: cards.length,
          reviewedCount: 0,
          retention: null as number | null,
        };
      }

      let sumRetention = 0;
      reviewedCards.forEach((c) => {
        const days = getDaysSince(c.lastReviewed) || 0;
        const S = getMemoryStability(c);
        sumRetention += calculateRetention(days, S);
      });

      const avgRetention = Math.round(sumRetention / reviewedCards.length);

      return {
        id: deck.id,
        name: deck.name,
        color: deck.color,
        icon: deck.icon,
        totalCards: cards.length,
        reviewedCount: reviewedCards.length,
        retention: avgRetention,
      };
    });
  }, [decks]);

  // Curva de retenção global projetada nos próximos 7 dias (com base em cartões revisados)
  const projectionData = useMemo(() => {
    if (reviewedCardsList.length === 0) return [];

    return Array.from({ length: 8 }).map((_, dayIndex) => {
      let totalRetention = 0;

      reviewedCardsList.forEach((card) => {
        const S = getMemoryStability(card);
        const daysSince = getDaysSince(card.lastReviewed) || 0;
        const projectedDays = daysSince + dayIndex;
        totalRetention += calculateRetention(projectedDays, S);
      });

      return {
        day: dayIndex === 0 ? "Hoje" : `+${dayIndex}d`,
        retention: Math.round(totalRetention / reviewedCardsList.length),
      };
    });
  }, [reviewedCardsList]);

  // Baralhos prioritários para revisão (ordenados pela menor retenção dos baralhos iniciados)
  const priorityDecks = useMemo(() => {
    return [...deckRetentionStats]
      .filter((d) => d.totalCards > 0)
      .sort((a, b) => {
        if (a.retention !== null && b.retention !== null) {
          return a.retention - b.retention;
        }
        if (a.retention !== null) return -1;
        if (b.retention !== null) return 1;
        return 0;
      })
      .slice(0, 4);
  }, [deckRetentionStats]);

  const currentAverageRetention = useMemo(() => {
    if (projectionData.length === 0) return 0;
    return projectionData[0].retention;
  }, [projectionData]);

  if (decks.length === 0 || reviewedCardsList.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[240px]">
        <Brain className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm font-bold text-foreground">
          Sem dados de retenção
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
          Realize sessões de estudo nos seus baralhos para visualizar a projeção
          da curva de retenção por baralho.
        </p>
      </div>
    );
  }

  // Desenhar os pontos do gráfico em SVG
  const width = 500;
  const height = 150;
  const padding = 25;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = projectionData.map((d, index) => {
    const x = padding + (index / (projectionData.length - 1)) * chartWidth;
    const y = height - padding - (d.retention / 100) * chartHeight;
    return { x, y, label: d.day, val: d.retention };
  });

  const pathD = points.reduce((acc, p, index) => {
    return index === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Projeção de retenção por baralho
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Retenção média estimada da memória com base nos baralhos já
            estudados
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1 rounded-lg text-xs font-bold shrink-0 self-start sm:self-auto">
          <span>Retenção média: {currentAverageRetention}%</span>
        </div>
      </div>

      {/* Gráfico SVG */}
      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <title>Projeção de retenção de memória</title>
          {[0, 25, 50, 75, 100].map((level) => {
            const y = height - padding - (level / 100) * chartHeight;
            return (
              <g key={level} className="opacity-20">
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  className="text-muted-foreground"
                />
                <text
                  x={padding - 5}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="8"
                  className="fill-muted-foreground font-bold"
                >
                  {level}%
                </text>
              </g>
            );
          })}

          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-blue-500"
          />

          {points.map((p) => (
            <g key={p.label} className="group/node cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="currentColor"
                className="text-blue-500 transition-all group-hover/node:r-6"
              />
              <text
                x={p.x}
                y={height - 5}
                textAnchor="middle"
                fontSize="8"
                className="fill-muted-foreground font-bold"
              >
                {p.label}
              </text>
              <text
                x={p.x}
                y={p.y - 8}
                textAnchor="middle"
                fontSize="9"
                className="fill-foreground font-bold opacity-0 group-hover/node:opacity-100 transition-opacity"
              >
                {p.val}%
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Informativo */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/50">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-normal font-medium">
          A retenção projeta a estabilidade de memória dos baralhos que você já
          estudou. Baralhos com retenção abaixo de 60% são prioritários para
          revisão.
        </p>
      </div>

      {/* Baralhos com menor retenção (Prioritários) */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            Baralhos prioritários para revisão
          </span>
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {priorityDecks.map((deck) => {
            const DeckIcon = getSystemIcon(deck.icon || "book-open");
            const deckTheme = getColorTheme(
              (deck.color || "blue") as ThemeColorKey,
            );

            return (
              <div
                key={deck.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      "p-2 rounded-lg border shrink-0",
                      deckTheme.bg,
                      deckTheme.text,
                      deckTheme.border,
                    )}
                  >
                    <DeckIcon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-foreground truncate">
                      {deck.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {deck.reviewedCount > 0
                        ? `${deck.reviewedCount} de ${deck.totalCards} cartões revisados`
                        : `${deck.totalCards} cartões`}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {deck.retention !== null ? (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                        deck.retention < 50
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : deck.retention < 75
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                      )}
                    >
                      {deck.retention}% retenção
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-muted/40 text-muted-foreground border-border/40">
                      Não iniciado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
