"use client";

import { BarChart3, HistoryIcon, LayoutDashboard, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabId } from "../types";

export const TABS = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "history", label: "Histórico", icon: HistoryIcon },
  { id: "library", label: "Biblioteca", icon: Library },
  { id: "reports", label: "Relatórios", icon: BarChart3 },
];

interface ReadingTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function ReadingTabs({ activeTab, onTabChange }: ReadingTabsProps) {
  return (
    <div className="flex gap-1 p-1.5 bg-background border border-border/60 rounded-xl w-fit">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onTabChange(t.id as TabId)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
            activeTab === t.id
              ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30"
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
