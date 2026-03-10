"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  Copy,
  Flame,
  LayoutDashboard,
} from "lucide-react";
import type { TabId } from "../types";

export const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  { id: "historico", label: "Histórico", icon: Calendar },
  { id: "heatmap", label: "Flame", icon: Flame },
  { id: "desempenho", label: "Desempenho", icon: BarChart3 },
  { id: "relatorio", label: "Relatório", icon: Copy },
];

interface StudiesTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function StudiesTabs({ activeTab, onTabChange }: StudiesTabsProps) {
  return (
    <div className="flex gap-1 p-1.5 bg-neutral-950 border border-neutral-700/60 rounded-2xl w-fit shadow-lg shadow-black/30">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onTabChange(t.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === t.id
              ? "bg-violet-500/25 text-violet-300 border border-violet-500/40 shadow-sm shadow-violet-500/10"
              : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
          }`}
        >
          <t.icon className="w-4 h-4" />
          {t.label}
        </button>
      ))}
    </div>
  );
}
