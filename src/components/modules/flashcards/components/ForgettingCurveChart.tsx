"use client";

import { Brain, Calendar, Info } from "lucide-react";
import { useMemo } from "react";
import { cn, getColorTheme } from "@/lib/utils";
import type { Flashcard, FlashcardDeck } from "../types";

interface ForgettingCurveChartProps {
  decks: (FlashcardDeck & { cards: Flashcard[] })[];
}

// Algoritmo de repetição espaçada existente para calcular a estabilidade (S) em dias
function getMemoryStability(card: Flashcard): number {
  const success = card.successCount || 0;
  const review = card.reviewCount || 1;
  return Math.round(1 + success * 2 * (success / Math.max(1, review)));
}

// Retorna quantos dias se passaram desde a data fornecida até hoje
function getDaysSince(dateStr?: string | null): number {
  if (!dateStr) return 999; // Se nunca revisado, consideramos muito tempo atrás
  const lastDate = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Calcula a retenção baseada no tempo decorrido t e estabilidade S
function calculateRetention(t: number, S: number): number {
  if (t === 999) return 0;
  return Math.round(100 * Math.exp(-t / S));
}

export function ForgettingCurveChart({ decks }: ForgettingCurveChartProps) {
  const theme = getColorTheme("cyan");

  const allCards = useMemo(() => {
    return decks.flatMap((d) =>
      (d.cards || []).map((c) => ({
        ...c,
        deckName: d.name,
        deckColor: d.color,
      }))
    );
  }, [decks]);

  // Projeta a curva de retenção global média nos próximos 7 dias (0 a 7)
  const projectionData = useMemo(() => {
    if (allCards.length === 0) return [];
    
    return Array.from({ length: 8 }).map((_, dayIndex) => {
      let totalRetention = 0;
      
      allCards.forEach((card) => {
        const S = getMemoryStability(card);
        const daysSince = getDaysSince(card.lastReviewed);
        const projectedDays = daysSince + dayIndex;
        totalRetention += calculateRetention(projectedDays, S);
      });

      return {
        day: dayIndex === 0 ? "Hoje" : `+${dayIndex}d`,
        retention: Math.round(totalRetention / allCards.length),
      };
    });
  }, [allCards]);

  // Encontra os cartões com menor retenção atual
  const urgentCards = useMemo(() => {
    return allCards
      .map((card) => {
        const S = getMemoryStability(card);
        const t = getDaysSince(card.lastReviewed);
        const currentRetention = calculateRetention(t, S);
        return {
          ...card,
          retention: currentRetention,
        };
      })
      .sort((a, b) => a.retention - b.retention)
      .slice(0, 3);
  }, [allCards]);

  const currentAverageRetention = useMemo(() => {
    if (projectionData.length === 0) return 0;
    return projectionData[0].retention;
  }, [projectionData]);

  if (allCards.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Brain className="w-8 h-8 text-neutral-500 mb-3" />
        <p className="text-sm font-bold text-foreground">Sem dados de retenção</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Adicione cartões aos seus baralhos para começar a ver a projeção da curva de esquecimento.
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Projeção de Retenção (Ebbinghaus)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Retenção de memória projetada nos próximos 7 dias sem novas revisões
          </p>
        </div>
        <div className="flex items-center gap-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0">
          <span>Retenção média: {currentAverageRetention}%</span>
        </div>
      </div>

      {/* Gráfico SVG minimalista e flat */}
      <div className="w-full relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Linhas de Grade de fundo */}
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
                  className="text-neutral-500"
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

          {/* Curva de Retenção */}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-cyan-500"
          />

          {/* Pontos interativos */}
          {points.map((p, idx) => (
            <g key={idx} className="group/node cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="currentColor"
                className="text-cyan-500 transition-all group-hover/node:r-6"
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
                className="fill-foreground font-black opacity-0 group-hover/node:opacity-100 transition-opacity bg-neutral-900"
              >
                {p.val}%
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Informativo */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/20 border border-border/50">
        <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-normal">
          A curva projeta como a estabilidade da sua memória (com base nas revisões bem-sucedidas) decai ao longo do tempo. 
          Revisar cartões antes de atingirem 50% de retenção garante melhor memorização no longo prazo.
        </p>
      </div>

      {/* Cartões que precisam de revisão urgente */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">Prioridade de Revisão</span>
          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          {urgentCards.map((card) => {
            const mDeck = getColorTheme(card.deckColor || "cyan");
            return (
              <div
                key={card.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 hover:bg-muted/10 transition-colors gap-4"
              >
                <div className="flex flex-col min-w-0 flex-1 gap-1">
                  <span className="text-xs font-bold text-foreground truncate">
                    {card.front}
                  </span>
                  <span className="text-[9px] font-medium text-neutral-500 uppercase leading-none">
                    Baralho: {card.deckName}
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-neutral-500">
                    Retenção:
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
                      card.retention < 30
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : card.retention < 60
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    )}
                  >
                    {card.retention}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
