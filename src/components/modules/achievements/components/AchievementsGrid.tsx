"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Book,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Film,
  Fingerprint,
  Flame,
  GraduationCap,
  KeyRound,
  Languages,
  Layers,
  Library,
  Lock,
  Moon,
  MoonStar,
  Palette,
  PlusCircle,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { ACHIEVEMENTS } from "@/config/achievements.config";

// Ícones mapeados dinamicamente para exibição
const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  Fingerprint,
  Palette,
  KeyRound,
  Lock,
  PlusCircle,
  CheckCircle2,
  ListTodo: Target,
  Timer: Clock,
  Flame,
  Moon,
  BookOpen,
  GraduationCap,
  FileText,
  Book,
  Library,
  Languages,
  Layers,
  Activity,
  TrendingUp,
  MoonStar,
  Sparkles,
  Zap,
  Film,
};

interface AchievementsGridProps {
  unlockedAchievements: { achievementId: string; unlockedAt: string }[];
}

export function AchievementsGrid({
  unlockedAchievements,
}: AchievementsGridProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "unlocked" | "locked" | "secret"
  >("all");

  const filteredAchievements = ACHIEVEMENTS.filter((ach) => {
    const isUnlocked = unlockedAchievements.some(
      (u) => u.achievementId === ach.id,
    );
    if (activeTab === "unlocked") return isUnlocked;
    if (activeTab === "locked") return !isUnlocked && !ach.secret;
    if (activeTab === "secret") return ach.secret;
    return true; // "all"
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-bold text-foreground">
            Galeria de Medalhas
          </h2>
        </div>

        {/* Filtros de Conquistas */}
        <div className="flex items-center gap-1 border border-border/70 p-0.5 rounded-xl bg-muted/20">
          {(["all", "unlocked", "locked", "secret"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none select-none ${
                activeTab === tab
                  ? "bg-amber-500/10 text-amber-500"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              type="button"
            >
              {tab === "all" && "Todas"}
              {tab === "unlocked" && "Desbloqueadas"}
              {tab === "locked" && "Bloqueadas"}
              {tab === "secret" && "Secretas"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Conquistas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredAchievements.map((ach) => {
          const unlockedState = unlockedAchievements.find(
            (u) => u.achievementId === ach.id,
          );
          const isUnlocked = !!unlockedState;
          const IconComponent = ICON_MAP[ach.icon] || Trophy;

          // Conquista secreta oculta
          if (ach.secret && !isUnlocked && activeTab !== "secret") {
            return null; // Oculta da aba principal
          }

          const displayTitle =
            ach.secret && !isUnlocked ? "Conquista Secreta" : ach.title;
          const displayDesc =
            ach.secret && !isUnlocked
              ? "Esta insígnia é um mistério. Continue explorando o Aegis para revelá-la!"
              : ach.description;

          return (
            <div
              key={ach.id}
              className={`p-4 rounded-xl border flex gap-4 text-left transition-all hover:border-amber-500/30 hover:bg-amber-500/2 ${
                isUnlocked
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-border/60 bg-muted/5 opacity-55"
              }`}
            >
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  isUnlocked
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                    : "bg-muted border-border/80 text-muted-foreground"
                }`}
              >
                {ach.secret && !isUnlocked ? (
                  <Lock className="w-5.5 h-5.5" />
                ) : (
                  <IconComponent className="w-5.5 h-5.5" />
                )}
              </div>

              <div className="flex-1 flex flex-col gap-1 justify-center min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-bold text-sm sm:text-base truncate ${
                      isUnlocked ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {displayTitle}
                  </span>
                  <span className="text-xs font-bold text-amber-500 shrink-0">
                    +{ach.xp} XP
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed wrap-break-word">
                  {displayDesc}
                </p>

                {isUnlocked && unlockedState && (
                  <span className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Desbloqueado em:{" "}
                    {new Date(unlockedState.unlockedAt).toLocaleDateString(
                      "pt-BR",
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredAchievements.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground text-xs italic">
            Nenhuma conquista encontrada nesta categoria.
          </div>
        )}
      </div>
    </div>
  );
}
