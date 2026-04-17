"use client";

import type { LucideIcon } from "lucide-react";
import { Calendar, Copy, Flame, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabId } from "../types";

export const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  { id: "historico", label: "Histórico", icon: Calendar },
  { id: "heatmap", label: "Constância", icon: Flame },
  { id: "relatorio", label: "Relatório", icon: Copy },
];

interface StudiesTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function StudiesTabs({ activeTab, onTabChange }: StudiesTabsProps) {
  return (
    <div className="flex gap-1 p-1.5 bg-card border border-border rounded-xl w-fit">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onTabChange(t.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
            activeTab === t.id
              ? "bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30"
              : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted",
          )}
        >
          <t.icon className="w-4 h-4" />
          {t.label}
        </button>
      ))}
    </div>
  );
}
