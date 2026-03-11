"use client";

import { useEffect, useState } from "react";
import { fmtTime, pomodoroClock } from "../helpers";
import type { PomodoroState } from "../types";

export function Ring({
  pct,
  color,
  size = 80,
  stroke = 8,
}: {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg
      width={size}
      height={size}
      className="-rotate-90"
      aria-label="Anel de progresso circular"
    >
      <title>Progresso</title>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

export function PomodoroLive({ p }: { p: PomodoroState | null }) {
  const [t, setT] = useState(p ? pomodoroClock(p) : 0);
  useEffect(() => {
    if (!p) {
      setT(0);
      return;
    }
    setT(pomodoroClock(p));
    if (!p.is_running) return;
    const id = setInterval(() => setT(pomodoroClock(p)), 1000);
    return () => clearInterval(id);
  }, [p]);
  const dur = p
    ? (p.cycle_type === "Work" ? p.work_minutes : p.break_minutes) * 60
    : 1;
  const pct = p ? Math.round(((dur - t) / dur) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Ring
          pct={pct}
          color={p?.is_running ? "#ef4444" : "#404040"}
          size={72}
          stroke={7}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xs font-black font-mono tabular-nums ${p?.is_running ? "text-red-400" : "text-neutral-600"}`}
          >
            {fmtTime(t)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-black font-mono text-red-400 leading-none">
          {p?.cycles_completed ?? 0}
        </span>
        <span className="text-[10px] font-black uppercase text-neutral-600 ">
          ciclos
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${p?.is_running ? "bg-red-500 animate-pulse" : "bg-neutral-700"}`}
          />
          <span className="text-[10px] text-neutral-600">
            {p?.is_running
              ? p.cycle_type === "Work"
                ? "Foco ativo"
                : "Pausa"
              : "Parado"}
          </span>
        </div>
      </div>
    </div>
  );
}

interface WidgetProps {
  title: string;
  icon: ElementType;
  href: string;
  color: ModColor;
  description?: string;
  children: React.ReactNode;
}

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ElementType } from "react";
import type { ModColor } from "../types";

export function Widget({
  title,
  icon: Icon,
  href,
  color,
  description,
  children,
}: WidgetProps) {
  const COLOR_MAP: Record<
    ModColor,
    { text: string; bg: string; border: string; ring: string }
  > = {
    teal: {
      text: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/20",
      ring: "#2dd4bf",
    },
    blue: {
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      ring: "#3b82f6",
    },
    amber: {
      text: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      ring: "#f59e0b",
    },
    orange: {
      text: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      ring: "#fb923c",
    },
    red: {
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      ring: "#f87171",
    },
    neutral: {
      text: "text-neutral-400",
      bg: "bg-neutral-500/10",
      border: "border-neutral-500/20",
      ring: "#a3a3a3",
    },
  };

  const c = COLOR_MAP[color] || COLOR_MAP.neutral;

  return (
    <Link
      href={href}
      className={`group relative flex flex-col p-5 bg-neutral-900 border border-neutral-800 rounded-3xl transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-800/40 overflow-hidden shadow-sm`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center group-hover:scale-110 transition-transform`}
          >
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
          <div>
            <h3 className="font-black  text-neutral-100 uppercase">{title}</h3>
            {description && (
              <p className="text-[10px] text-neutral-500 font-bold uppercase mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
      </div>

      <div className="flex-1">{children}</div>
    </Link>
  );
}
