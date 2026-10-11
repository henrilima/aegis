"use client";

import { CheckCircle2, Target, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAchievementsLogic } from "@/components/modules/achievements/useAchievementsLogic";
import { getXPForLevel } from "@/config/achievements.config";
import {
  getScenarioBgUrl,
  normalizePetId,
  PETS_CONFIG,
} from "@/config/pets.config";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { BaseWidget } from "../BaseWidget";

interface PetWidgetProps {
  limit?: number;
  isEditMode?: boolean;
}

const DISPLAY_SIZE = 64;

export function PetWidget({ limit = 3, isEditMode }: PetWidgetProps) {
  const { user } = useAuth();
  const uid = user?.id ? String(user.id) : "";

  const {
    progress,
    selectedPet: rawSelectedPet,
    selectedScenario,
    selectedBgMode,
    dailyChallenges,
    getChallengeProgress,
    isPetActive,
  } = useAchievementsLogic();

  const color = getModuleColor("achievements");

  const selectedPet = useMemo(
    () => normalizePetId(rawSelectedPet),
    [rawSelectedPet],
  );

  const petConfig = PETS_CONFIG[selectedPet] || PETS_CONFIG.doberman;

  // Carrega nome personalizado do mascote e sincroniza em tempo real
  const [customName, setCustomName] = useState<string>("");

  useEffect(() => {
    const loadCustomName = () => {
      if (typeof window !== "undefined") {
        const key = uid
          ? `aegis_pet_custom_name_${uid}_${selectedPet}`
          : `aegis_pet_custom_name_${selectedPet}`;
        const saved = localStorage.getItem(key);
        setCustomName(saved || "");
      }
    };

    loadCustomName();
    window.addEventListener("aegis-pet-renamed", loadCustomName);
    return () =>
      window.removeEventListener("aegis-pet-renamed", loadCustomName);
  }, [selectedPet, uid]);

  const hasCustomName = Boolean(customName && customName.trim().length > 0);
  const displayName = hasCustomName ? customName.trim() : petConfig.name;

  const treeLevel = progress?.treeLevel ?? 1;
  const treeXp = progress?.treeXp ?? 0;
  const xpNeeded = getXPForLevel(treeLevel);
  const xpPercent = Math.min(100, Math.max(0, (treeXp / xpNeeded) * 100));

  // Determina se o mascote está desmaiado (sem atividades nos últimos dias ou nv 1 com 0 XP)
  const isDead =
    (progress?.last3DaysCompletedCount ?? 0) === 0 ||
    (treeLevel === 1 && treeXp === 0);

  const animationState = isDead ? "Death" : "Idle";

  // Número de frames da spritesheet
  const frameCount = useMemo(() => {
    if (animationState === "Death") {
      if (selectedPet === "blue_rat") return 2;
      if (selectedPet === "slime") return 10;
      return 4;
    }
    return 4;
  }, [selectedPet, animationState]);

  const totalWidth = frameCount * DISPLAY_SIZE;

  const animationStyle = useMemo(() => {
    if (animationState === "Death") {
      const lastFrameOffset = totalWidth - DISPLAY_SIZE;
      return {
        animation: `play-spritesheet-once 0.8s steps(${Math.max(1, frameCount - 1)}) forwards`,
        "--spritesheet-last-frame-width": `-${lastFrameOffset}px`,
        backgroundPositionX: `-${lastFrameOffset}px`,
      } as React.CSSProperties;
    }
    return {
      animation: `play-spritesheet 0.8s steps(${frameCount}) infinite`,
      "--spritesheet-width": `-${totalWidth}px`,
    } as React.CSSProperties;
  }, [animationState, frameCount, totalWidth]);

  // Desafios diários
  const completedChallengesToday = progress?.completedChallengesToday || [];
  const displayChallenges = useMemo(() => {
    return (dailyChallenges || []).slice(0, limit);
  }, [dailyChallenges, limit]);

  const completedCount = useMemo(() => {
    return (dailyChallenges || []).filter((c) => {
      const cur = getChallengeProgress(c);
      return cur >= c.target || completedChallengesToday.includes(c.id);
    }).length;
  }, [dailyChallenges, getChallengeProgress, completedChallengesToday]);

  const bgUrl = useMemo(() => {
    const period =
      selectedBgMode && selectedBgMode !== "cyclic" ? selectedBgMode : "day";
    return getScenarioBgUrl(selectedScenario, period);
  }, [selectedScenario, selectedBgMode]);

  return (
    <BaseWidget
      title="Mascote & Missões"
      icon={Trophy}
      color={color}
      route="achievements"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-3.5 h-full justify-between p-1">
        {/* Banner Superior: Mini Habitat do Mascote & Status HUD */}
        <div className="relative rounded-xl border border-border/80 overflow-hidden bg-card/90 dark:bg-card/60 shadow-xs">
          {/* Cenário de Fundo com opacidade e contraste adaptativos para tema claro e escuro */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-500 opacity-20 dark:opacity-60"
            style={{
              backgroundImage: `url("${bgUrl}")`,
              filter: isDead
                ? "grayscale(80%) brightness(0.6)"
                : "var(--tw-brightness, brightness(0.9))",
            }}
          />
          {/* Gradiente de proteção para legibilidade perfeita no tema branco e atmosfera no preto */}
          <div className="absolute inset-0 bg-linear-to-r from-card via-card/85 to-card/65 dark:from-background/90 dark:via-background/60 dark:to-transparent" />

          {/* Conteúdo HUD do Pet */}
          <div className="relative z-10 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Moldura do Sprite */}
              <div
                className="relative shrink-0 flex items-center justify-center rounded-lg border border-border/80 bg-background/80 dark:bg-background/50 backdrop-blur-xs overflow-hidden"
                style={{
                  width: `${DISPLAY_SIZE}px`,
                  height: `${DISPLAY_SIZE}px`,
                }}
              >
                <div
                  style={{
                    width: `${DISPLAY_SIZE}px`,
                    height: `${DISPLAY_SIZE}px`,
                    backgroundImage: `url("/pets/${encodeURIComponent(selectedPet)}/${animationState}.png")`,
                    backgroundSize: `${totalWidth}px ${DISPLAY_SIZE}px`,
                    imageRendering: "pixelated",
                    backgroundRepeat: "no-repeat",
                    ...animationStyle,
                  }}
                />
              </div>

              {/* Informações do Pet */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-bold text-foreground truncate"
                    title={displayName}
                  >
                    {displayName}
                  </span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border",
                      isDead
                        ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                    )}
                  >
                    {isDead ? "Desmaiado" : `Nv. ${treeLevel}`}
                  </span>
                </div>

                <span className="text-[11px] text-muted-foreground font-medium truncate">
                  {hasCustomName
                    ? `${petConfig.name} • Rank ${petConfig.rankName} • ${isPetActive ? "Ativo" : "Em Repouso"}`
                    : `Rank ${petConfig.rankName} • ${isPetActive ? "Mascote Ativo" : "Em Repouso"}`}
                </span>

                {/* Barra de XP */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="w-24 sm:w-28 h-1.5 bg-neutral-200 dark:bg-neutral-900/80 rounded-full overflow-hidden border border-border/50">
                    <div
                      className="h-full bg-linear-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground font-bold">
                    {treeXp}/{xpNeeded} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Badge de Progresso Geral */}
            <div className="shrink-0 flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500">
                <Target className="w-3.5 h-3.5" />
                <span className="text-xs font-mono font-bold">
                  {completedCount}/{dailyChallenges.length}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">
                Missões de hoje
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Missões Diárias */}
        <div className="flex flex-col gap-2 flex-1 justify-center">
          {displayChallenges.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/5 text-center text-xs text-muted-foreground">
              {isPetActive
                ? "Nenhuma missão ativa para hoje."
                : "Ative o mascote na aba Conquistas para desbloquear missões diárias!"}
            </div>
          ) : (
            displayChallenges.map((challenge) => {
              const current = getChallengeProgress(challenge);
              const target = challenge.target;
              const percent = Math.min(
                100,
                Math.max(0, (current / target) * 100),
              );
              const isCompleted = current >= target;
              const isClaimed = completedChallengesToday.includes(challenge.id);

              return (
                <div
                  key={challenge.id}
                  className={cn(
                    "p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 group/challenge",
                    isClaimed || isCompleted
                      ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/30"
                      : "border-border/60 bg-card/40 hover:bg-card/70 hover:border-border",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-foreground truncate group-hover/challenge:text-amber-600 dark:group-hover/challenge:text-amber-400 transition-colors">
                        {challenge.title}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded shrink-0">
                        +{challenge.xp} XP
                      </span>
                    </div>

                    {/* Barra de progresso da missão */}
                    <div className="flex items-center gap-2 mt-1 w-full max-w-50">
                      <div className="flex-1 h-1 bg-neutral-200 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-300/80 dark:border-neutral-800">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            isCompleted || isClaimed
                              ? "bg-linear-to-r from-emerald-500 to-teal-400"
                              : "bg-linear-to-r from-amber-500 to-yellow-400",
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground font-semibold shrink-0">
                        {current}/{target}
                      </span>
                    </div>
                  </div>

                  {/* Estado / Resgate */}
                  <div className="shrink-0 flex items-center">
                    {isClaimed || isCompleted ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Feito
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground px-2 py-1 rounded-md bg-muted/40 border border-border/40">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </BaseWidget>
  );
}
