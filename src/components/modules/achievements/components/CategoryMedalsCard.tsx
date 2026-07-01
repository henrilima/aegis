"use client";

import { BookOpen, Heart, KeyRound, Shield, Zap } from "lucide-react";
import { ACHIEVEMENTS } from "@/config/achievements.config";

const CATEGORIES = [
  { id: "productivity", label: "Produtividade", icon: Zap },
  { id: "knowledge", label: "Conhecimento", icon: BookOpen },
  { id: "health", label: "Saúde", icon: Heart },
  { id: "security", label: "Segurança", icon: KeyRound },
  { id: "system", label: "Geral", icon: Shield },
];

export function CategoryMedalsCard({
  unlockedAchievements,
}: {
  unlockedAchievements: { achievementId: string; unlockedAt: string }[];
}) {
  const categoryStats = CATEGORIES.map((cat) => {
    const total = ACHIEVEMENTS.filter((a) => a.category === cat.id).length;
    const unlocked = unlockedAchievements.filter((ua) => {
      const ach = ACHIEVEMENTS.find((a) => a.id === ua.achievementId);
      return ach && ach.category === cat.id;
    }).length;
    const percent = total > 0 ? (unlocked / total) * 100 : 0;

    return {
      ...cat,
      total,
      unlocked,
      percent,
    };
  });

  return (
    <div className="p-5 rounded-2xl border border-border/70 bg-card/30 flex flex-col gap-4 text-left">
      <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2">
        Medalhas por Categoria
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {categoryStats.map((cat) => (
          <div
            key={cat.id}
            className="p-3.5 rounded-xl border border-border/50 bg-muted/15 flex flex-col justify-between gap-3 min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                <cat.icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-foreground truncate select-none">
                {cat.label}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-muted-foreground">Progresso</span>
                <span>
                  {cat.unlocked}/{cat.total}
                </span>
              </div>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden border border-border/20">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${cat.percent}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
