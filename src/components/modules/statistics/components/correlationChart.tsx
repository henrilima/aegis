"use client";

import { useState } from "react";
import type { CrossMetric } from "../types";

interface CorrelationChartProps {
  metrics: CrossMetric[];
  activeSources: string[];
}

const formatDatePT = (dateStr: string) => {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const formatted = date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return dateStr;
  }
};

type LegendKey = "sleep" | "study" | "reading" | "hit" | "focus";

const ALL_SERIES = [
  {
    key: "study" as const,
    source: "estudos",
    label: "Estudo",
    color: "#8b5cf6",
    title:
      "Horas de estudo registradas no dia, normalizadas pelo maior dia do período.",
  },
  {
    key: "sleep" as const,
    source: "sono",
    label: "Sono",
    color: "#3b82f6",
    title:
      "Horas de sono registradas no dia, normalizadas pelo maior dia do período.",
  },
  {
    key: "hit" as const,
    source: "estudos",
    label: "Acertos",
    color: "#22c55e",
    title: "Taxa de acerto do dia. Esta linha já usa escala percentual real.",
  },
  {
    key: "reading" as const,
    source: "leitura",
    label: "Leitura",
    color: "#f97316",
    title: "Páginas lidas no dia, normalizadas pelo maior dia do período.",
  },
  {
    key: "focus" as const,
    source: "foco",
    label: "Foco",
    color: "#f43f5e",
    title:
      "Foco médio do dia na escala de 0 a 5, normalizado pelo máximo (5.0).",
  },
];

export function CorrelationChart({
  metrics,
  activeSources,
}: CorrelationChartProps) {
  const [activeLegend, setActiveLegend] = useState<LegendKey | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const displayedMetrics = metrics.slice(-30);

  if (displayedMetrics.length === 0) {
    return (
      <p className="text-neutral-600 text-center py-12 italic font-medium">
        Dados insuficientes para gerar visualização temporal.
      </p>
    );
  }

  // Filtrar as séries a serem renderizadas com base nas fontes ativas
  const activeSeries = ALL_SERIES.filter((s) =>
    activeSources.includes(s.source),
  );

  const maxStudy = Math.max(...displayedMetrics.map((m) => m.studyHours), 1);
  const maxSleep = Math.max(...displayedMetrics.map((m) => m.sleepHours), 1);
  const maxReading = Math.max(
    ...displayedMetrics.map((m) => m.readingPages),
    1,
  );
  const maxFocus = 5;

  const width = 1000;
  const height = 320;
  const margin = { top: 24, right: 12, bottom: 36, left: 12 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const getX = (index: number) => {
    if (displayedMetrics.length <= 1) return margin.left + plotWidth / 2;
    return margin.left + (index / (displayedMetrics.length - 1)) * plotWidth;
  };

  const getY = (val: number, max: number) => {
    const pct = Math.max(0, Math.min(1, val / max));
    return margin.top + plotHeight - pct * plotHeight;
  };

  const pointsFor = (type: LegendKey) =>
    displayedMetrics.map((m, i) => {
      const value =
        type === "study"
          ? m.studyHours
          : type === "sleep"
            ? m.sleepHours
            : type === "reading"
              ? m.readingPages
              : type === "focus"
                ? (m.focusScore ?? 0)
                : m.studyHitRate;
      const max =
        type === "study"
          ? maxStudy
          : type === "sleep"
            ? maxSleep
            : type === "reading"
              ? maxReading
              : type === "focus"
                ? maxFocus
                : 100;
      return { x: getX(i), y: getY(value, max) };
    });

  const getPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    const clamped = Math.max(
      margin.left,
      Math.min(mouseX, margin.left + plotWidth),
    );
    const ratio = (clamped - margin.left) / plotWidth;
    const index = Math.round(ratio * (displayedMetrics.length - 1));
    setHoveredIndex(index);
  };

  const activeMetric =
    hoveredIndex !== null ? displayedMetrics[hoveredIndex] : null;
  const tooltipLeft =
    hoveredIndex !== null ? (getX(hoveredIndex) / width) * 100 : 0;
  const tooltipSide = tooltipLeft > 72 ? "-100%" : "0";

  const getOpacity = (type: LegendKey) => {
    if (!activeLegend) return 1;
    return activeLegend === type ? 1 : 0.22;
  };

  return (
    <div className="flex flex-col gap-5 w-full relative select-none">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
        {activeSeries.map((item) => (
          <button
            key={item.key}
            type="button"
            onMouseEnter={() => setActiveLegend(item.key)}
            onMouseLeave={() => setActiveLegend(null)}
            className={`flex items-center gap-2 transition-all duration-200 py-1.5 px-3 rounded-lg hover:bg-accent border ${
              activeLegend === item.key
                ? "border-border bg-accent text-foreground"
                : "border-transparent"
            }`}
            title={item.title}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="relative w-full h-80 border border-border/40 rounded-xl overflow-hidden bg-background/30">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full block"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
          role="img"
          aria-label="Gráfico temporal de métricas"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = margin.top + plotHeight - tick * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  className="stroke-border/40"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <text
                  x={margin.left + 4}
                  y={y - 5}
                  className="fill-muted-foreground/60 text-[9px] font-bold"
                >
                  {`${Math.round(tick * 100)}%`}
                </text>
              </g>
            );
          })}

          {activeSeries.map((item) => (
            <path
              key={item.key}
              d={getPath(pointsFor(item.key))}
              fill="none"
              stroke={item.color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ opacity: getOpacity(item.key) }}
            />
          ))}

          {displayedMetrics.map((m, i) => {
            const shouldShowLabel =
              displayedMetrics.length <= 15 ? true : i % 3 === 0;
            if (!shouldShowLabel) return null;
            return (
              <text
                key={m.date}
                x={getX(i)}
                y={margin.top + plotHeight + 22}
                textAnchor="middle"
                className="fill-muted-foreground/75 text-[10px] font-bold"
              >
                {`${m.date.slice(8, 10)}/${m.date.slice(5, 7)}`}
              </text>
            );
          })}

          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={margin.top}
                x2={getX(hoveredIndex)}
                y2={margin.top + plotHeight}
                className="stroke-muted-foreground/50"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
              {activeSeries.map((item) => {
                const point = pointsFor(item.key)[hoveredIndex];
                return (
                  <circle
                    key={item.key}
                    cx={point.x}
                    cy={point.y}
                    r={5}
                    fill={item.color}
                    stroke="var(--background)"
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    style={{ opacity: getOpacity(item.key) }}
                  />
                );
              })}
            </g>
          )}

          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
          />
        </svg>

        {activeMetric && (
          <div
            className="absolute z-30 pointer-events-none rounded-xl p-3 min-w-[210px] flex flex-col gap-2 border border-border bg-card"
            style={{
              left: `${tooltipLeft}%`,
              top: "12px",
              transform: `translateX(${tooltipSide})`,
            }}
          >
            <div className="border-b border-border pb-1.5">
              <span className="text-[11px] font-bold text-foreground">
                {formatDatePT(activeMetric.date)}
              </span>
            </div>

            {activeSources.includes("estudos") && (
              <>
                <TooltipRow
                  color="#8b5cf6"
                  label="Estudo"
                  value={`${activeMetric.studyHours.toFixed(1)}h`}
                  detail={`${((activeMetric.studyHours / maxStudy) * 100).toFixed(0)}% da escala`}
                />
                <TooltipRow
                  color="#22c55e"
                  label="Acertos"
                  value={`${activeMetric.studyHitRate}%`}
                  detail={`${activeMetric.questionsTotal} questões`}
                />
              </>
            )}

            {activeSources.includes("sono") && (
              <TooltipRow
                color="#3b82f6"
                label="Sono"
                value={`${activeMetric.sleepHours.toFixed(1)}h`}
                detail={`${((activeMetric.sleepHours / maxSleep) * 100).toFixed(0)}% da escala`}
              />
            )}

            {activeSources.includes("leitura") && (
              <TooltipRow
                color="#f97316"
                label="Leitura"
                value={`${activeMetric.readingPages} pág.`}
                detail={`${activeMetric.readingMinutes} min`}
              />
            )}

            {activeSources.includes("foco") &&
              activeMetric.focusScore !== undefined &&
              activeMetric.focusScore !== null && (
                <TooltipRow
                  color="#f43f5e"
                  label="Foco"
                  value={`${activeMetric.focusScore.toFixed(1)}`}
                  detail={`${((activeMetric.focusScore / maxFocus) * 100).toFixed(0)}% da escala`}
                />
              )}
          </div>
        )}
      </div>
    </div>
  );
}

function TooltipRow({
  color,
  label,
  value,
  detail,
}: {
  color: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-[11px]">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <span className="font-bold text-foreground">
        {value}
        <span className="text-[9px] text-muted-foreground font-bold ml-1">
          {detail}
        </span>
      </span>
    </div>
  );
}
