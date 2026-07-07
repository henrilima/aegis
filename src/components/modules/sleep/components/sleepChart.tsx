"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDuration, qualityLabel } from "../sleepUtils";
import type { SleepEntry } from "../types";

interface SleepChartProps {
  weekDays: { date: string; label: string; entry?: SleepEntry }[];
  targetMinutes: number;
  title?: string;
  now: Date;
}

function getIsoDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const r = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${r}`;
}

/**
 * Gráfico de linha e pontos (SVG Area/Line dot chart) que compara o sono semanal
 */
export function SleepChart({
  weekDays,
  targetMinutes,
  title,
  now,
}: SleepChartProps) {
  // Encontra o valor máximo para escala do gráfico
  const maxMins = Math.max(
    targetMinutes * 1.3,
    ...weekDays.map((d) => d.entry?.durationMinutes ?? 0),
    12 * 60, // Escala máxima de pelo menos 12h
  );

  const todayStr = getIsoDateString(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getIsoDateString(yesterday);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getIsoDateString(tomorrow);

  // Geometria do SVG
  const width = 700;
  const height = 240;
  const margin = { top: 30, right: 30, bottom: 40, left: 45 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const getX = (index: number) => {
    return margin.left + (index / 6) * plotWidth;
  };

  const getY = (mins: number) => {
    const pct = Math.max(0, Math.min(1, mins / maxMins));
    return margin.top + plotHeight - pct * plotHeight;
  };

  const points = weekDays.map((d, i) => {
    const mins = d.entry?.durationMinutes ?? 0;
    return {
      x: getX(i),
      y: getY(mins),
      date: d.date,
      label: d.label,
      entry: d.entry,
      mins,
    };
  });

  // Caminhos de desenho
  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
  const areaD = `${lineD} L ${points[points.length - 1].x} ${margin.top + plotHeight} L ${points[0].x} ${margin.top + plotHeight} Z`;

  const targetY = getY(targetMinutes);

  const getDisplayLabel = (date: string, label: string) => {
    if (date === todayStr) return "Hoje";
    if (date === yesterdayStr) return "Ontem";
    if (date === tomorrowStr) return "Amanhã";
    return label;
  };

  // Níveis de linhas de grade
  const yTicks = [4 * 60, 8 * 60, 12 * 60];

  return (
    <div className="bg-card border border-border rounded-xl p-6 transition-all hover:border-border/80">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-bold text-muted-foreground">
          {title || "Sono por Dia"}
        </h2>
        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/80">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>Registrado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 border-t border-dashed border-neutral-400" />
            <span>Meta ({formatDuration(targetMinutes)})</span>
          </div>
        </div>
      </div>

      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none overflow-visible"
        >
          <title>Gráfico de Sono Semanal</title>
          <defs>
            <linearGradient id="sleep-chart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Linhas de Grade de Horas */}
          {yTicks.map((lvl) => (
            <g key={lvl}>
              <line
                x1={margin.left}
                y1={getY(lvl)}
                x2={margin.left + plotWidth}
                y2={getY(lvl)}
                stroke="currentColor"
                className="text-border/40"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={margin.left - 10}
                y={getY(lvl) + 4}
                textAnchor="end"
                className="text-[10px] font-bold fill-neutral-400 dark:fill-neutral-500"
              >
                {lvl / 60}h
              </text>
            </g>
          ))}

          {/* Linha de Meta de Sono */}
          <line
            x1={margin.left}
            y1={targetY}
            x2={margin.left + plotWidth}
            y2={targetY}
            stroke="#6b7280"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            className="opacity-60 dark:opacity-40"
          />

          {/* Área de Preenchimento Gradiente */}
          <path d={areaD} fill="url(#sleep-chart-grad)" />

          {/* Linha Conectora Principal */}
          <path
            d={lineD}
            fill="none"
            stroke="#06b6d4"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos de Dados */}
          {points.map((p) => {
            const isToday = p.date === todayStr;
            const displayLabel = getDisplayLabel(p.date, p.label);

            return (
              <g key={p.date} className="group">
                {/* Efeito de brilho pulsante no ponto de "Hoje" */}
                {isToday && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={11}
                    className="fill-cyan-500/20 animate-pulse pointer-events-none"
                  />
                )}

                {/* Bolinha Visual Estática */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isToday ? 6.5 : 4.5}
                  className={cn(
                    "transition-all duration-200 pointer-events-none",
                    p.mins > 0
                      ? "fill-cyan-500 stroke-card stroke-[2px] group-hover:fill-cyan-400"
                      : "fill-neutral-300 dark:fill-neutral-700 stroke-card stroke-[1.5px] group-hover:fill-neutral-400",
                  )}
                />

                {/* Área de Toque/Hover Invisível e Estável */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={16}
                      className="fill-transparent cursor-pointer outline-none focus:ring-0"
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    className="text-xs font-bold pointer-events-none"
                    side="top"
                    sideOffset={6}
                  >
                    {p.mins > 0 ? (
                      <span>
                        {displayLabel} · {formatDuration(p.mins)}{" "}
                        {p.entry?.quality
                          ? `· Qualidade: ${qualityLabel(p.entry.quality)}`
                          : ""}
                      </span>
                    ) : (
                      <span>{displayLabel} · Sem registro</span>
                    )}
                  </TooltipContent>
                </Tooltip>

                {/* Rótulo de texto do eixo X */}
                <text
                  x={p.x}
                  y={height - 10}
                  textAnchor="middle"
                  className={cn(
                    "text-[11px] font-bold fill-neutral-400 dark:fill-neutral-500 transition-all",
                    isToday && "fill-cyan-500 dark:fill-cyan-400 font-bold",
                  )}
                >
                  {displayLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
