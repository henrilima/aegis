"use client";

import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Card básico para exibição de KPIs com destaque visual personalizado
 */
export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  bgColor,
  borderColor,
}: MetricCardProps) {
  return (
    <div
      className="bg-neutral-900 border rounded-2xl p-4 flex flex-col gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ borderColor }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-neutral-500">
          {label}
        </span>
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: bgColor }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <span className="text-2xl font-black leading-none" style={{ color }}>
        {value}
      </span>
      {sub && (
        <span className="text-[11px] text-neutral-600 font-medium">{sub}</span>
      )}
    </div>
  );
}
