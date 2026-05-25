"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fmtTime, pomodoroClock } from "../helpers";
import type { PomodoroState } from "../types";

export function Ring({
  pct,
  color,
  size = 80,
  stroke = 8,
  className,
}: {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("-rotate-90 w-full h-full", className)}
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
    if (!p.isRunning) return;
    const id = setInterval(() => setT(pomodoroClock(p)), 1000);
    return () => clearInterval(id);
  }, [p]);
  const dur = p
    ? (p.cycleType === "Work" ? p.workMinutes : p.breakMinutes) * 60
    : 1;
  const pct = p ? Math.round(((dur - t) / dur) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Ring
          pct={pct}
          color={p?.isRunning ? "#ef4444" : "#404040"}
          size={72}
          stroke={7}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xs font-bold ${p?.isRunning ? "text-red-600 dark:text-red-400" : "text-neutral-600"}`}
          >
            {fmtTime(t)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none">
          {p?.cyclesCompleted ?? 0}
        </span>
        <span className="text-[10px] font-bold text-neutral-600 ">ciclos</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${p?.isRunning ? "bg-red-500 animate-pulse" : "bg-muted"}`}
          />
          <span className="text-[10px] text-muted-foreground">
            {p?.isRunning
              ? p.cycleType === "Work"
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
      text: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/20 dark:bg-teal-500/10",
      border: "border-teal-500/30 dark:border-teal-500/20",
      ring: "#2dd4bf",
    },
    blue: {
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/20 dark:bg-blue-500/10",
      border: "border-blue-500/30 dark:border-blue-500/20",
      ring: "#3b82f6",
    },
    amber: {
      text: "text-amber-600 dark:text-amber-500",
      bg: "bg-amber-500/20 dark:bg-amber-500/10",
      border: "border-amber-500/30 dark:border-amber-500/20",
      ring: "#f59e0b",
    },
    orange: {
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/20 dark:bg-orange-500/10",
      border: "border-orange-500/30 dark:border-orange-500/20",
      ring: "#fb923c",
    },
    red: {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/20 dark:bg-red-500/10",
      border: "border-red-500/30 dark:border-red-500/20",
      ring: "#f87171",
    },
    green: {
      text: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/20 dark:bg-green-500/10",
      border: "border-green-500/30 dark:border-green-500/20",
      ring: "#22c55e",
    },
    violet: {
      text: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/20 dark:bg-violet-500/10",
      border: "border-violet-500/30 dark:border-violet-500/20",
      ring: "#8b5cf6",
    },
    sky: {
      text: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/20 dark:bg-sky-500/10",
      border: "border-sky-500/30 dark:border-sky-500/20",
      ring: "#0ea5e9",
    },
    neutral: {
      text: "text-muted-foreground",
      bg: "bg-muted/30 dark:bg-muted/10",
      border: "border-border",
      ring: "#a3a3a3",
    },
  };

  const c = COLOR_MAP[color] || COLOR_MAP.neutral;

  return (
    <Link
      href={href}
      className={`group relative flex flex-col p-5 bg-card border border-border rounded-xl transition-all duration-300 hover:border-border hover:bg-accent/50/40 overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center group-hover:scale-110 transition-transform`}
          >
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{title}</h3>
            {description && (
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
      </div>

      <div className="flex-1">{children}</div>
    </Link>
  );
}
