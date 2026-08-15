"use client";

import { Trophy } from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  type DailyChallenge,
  getDailyChallenges,
  type RealtimeGlobalStats,
} from "@/config/achievements.config";
import { getModuleColor } from "@/config/modules.config";
import { normalizePetId } from "@/config/pets.config";
import { useAuth } from "@/context/AuthContext";
import { useModules } from "@/context/ModuleContext";
import { useTime } from "@/context/TimeContext";
import { formatDateLocal, getColorTheme } from "@/lib/utils";
import type { UserProgressState, XPHistoryEntry } from "./types";

export function useAchievementsLogic() {
  const { user } = useAuth();
  const { enabledModules } = useModules();
  const { now } = useTime();

  const moduleColor = getModuleColor("achievements");
  const theme = getColorTheme(moduleColor);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RealtimeGlobalStats | null>(null);
  const [progress, setProgress] = useState<UserProgressState | null>(null);
  const [selectedPet, setSelectedPet] = useState<string>("doberman");
  const [selectedParticle, setSelectedParticle] = useState<string>("none");
  const [selectedBgMode, setSelectedBgMode] = useState<
    "cyclic" | "day" | "afternoon" | "night"
  >("cyclic");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [xpHistory, setXpHistory] = useState<XPHistoryEntry[]>([]);
  const uid = user?.id ? String(user.id) : "";

  const [isPetActive, setIsPetActive] = useState<boolean>(false);

  const handleTogglePetActive = (active: boolean) => {
    setIsPetActive(active);
    if (typeof window !== "undefined") {
      const key = uid ? `aegis_pet_active_${uid}` : "aegis_pet_active";
      localStorage.setItem(key, String(active));
    }
  };

  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    if (uid !== undefined) {
      prevLevelRef.current = null;
    }
  }, [uid]);

  useEffect(() => {
    if (progress?.level) {
      if (
        prevLevelRef.current !== null &&
        progress.level > prevLevelRef.current
      ) {
        window.dispatchEvent(
          new CustomEvent("aegis-level-up", {
            detail: { level: progress.level },
          }),
        );
      }
      prevLevelRef.current = progress.level;
    }
  }, [progress?.level]);

  // Desafios diários sorteados para hoje
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const todayStr = useMemo(() => formatDateLocal(now), [now]);
  const threeDaysAgoStr = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 3);
    return formatDateLocal(d);
  }, [now]);

  // Carregar pet salvo por usuário
  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeKey = uid ? `aegis_pet_active_${uid}` : "aegis_pet_active";
      const savedActive = localStorage.getItem(activeKey);
      setIsPetActive(savedActive === "true");

      const petKey = uid ? `aegis_selected_pet_${uid}` : "aegis_selected_pet";
      const saved = localStorage.getItem(petKey);
      setSelectedPet(normalizePetId(saved));

      const particleKey = uid
        ? `aegis_selected_pet_particle_${uid}`
        : "aegis_selected_pet_particle";
      const savedParticle = localStorage.getItem(particleKey);
      setSelectedParticle(savedParticle || "none");

      const bgKey = uid
        ? `aegis_selected_pet_background_mode_${uid}`
        : "aegis_selected_pet_background_mode";
      const savedBg = localStorage.getItem(bgKey);
      setSelectedBgMode(
        (savedBg as "cyclic" | "day" | "afternoon" | "night") || "cyclic",
      );
    }
  }, [uid]);

  const handleSelectPet = (petId: string) => {
    setSelectedPet(petId);
    if (typeof window !== "undefined") {
      const key = uid ? `aegis_selected_pet_${uid}` : "aegis_selected_pet";
      localStorage.setItem(key, petId);
    }
  };

  const handleSelectParticle = (particleId: string) => {
    setSelectedParticle(particleId);
    if (typeof window !== "undefined") {
      const key = uid
        ? `aegis_selected_pet_particle_${uid}`
        : "aegis_selected_pet_particle";
      localStorage.setItem(key, particleId);
    }
  };

  const handleSelectBgMode = (
    bgMode: "cyclic" | "day" | "afternoon" | "night",
  ) => {
    setSelectedBgMode(bgMode);
    if (typeof window !== "undefined") {
      const key = uid
        ? `aegis_selected_pet_background_mode_${uid}`
        : "aegis_selected_pet_background_mode";
      localStorage.setItem(key, bgMode);
    }
  };

  // Carregar dados gerais e estado do usuário
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");

      // Datas para calcular a saúde da árvore/pet
      const todayStrFormatted = todayStr;
      const threeDaysAgoStrFormatted = threeDaysAgoStr;

      // Busca estatísticas globais em tempo real
      const rawStats = await invoke<RealtimeGlobalStats>(
        "stats_get_global_realtime_metrics",
        {
          userId: user.id,
          today: todayStrFormatted,
        },
      );
      setStats(rawStats);

      // Busca o progresso (nível, XP, conquistas, histórico de desafios)
      const rawProgress = await invoke<UserProgressState>(
        "achievements_get_user_state",
        {
          userId: user.id,
          today: todayStrFormatted,
          threeDaysAgo: threeDaysAgoStrFormatted,
        },
      );

      // Busca o histórico de XP ganho pelo usuário
      const rawHistory = await invoke<XPHistoryEntry[]>(
        "stats_get_xp_history",
        {
          userId: user.id,
        },
      );

      // Sincroniza conquistas desbloqueadas no ledger de XP (garante que todas têm entrada)
      if (rawProgress.unlockedAchievements.length > 0) {
        const { ACHIEVEMENTS } = await import("@/config/achievements.config");
        const achievementMap = new Map(ACHIEVEMENTS.map((a) => [a.id, a.xp]));
        const unlockedPairs: [string, number][] =
          rawProgress.unlockedAchievements
            .filter((ua) => achievementMap.has(ua.achievementId))
            .map((ua) => [
              ua.achievementId,
              achievementMap.get(ua.achievementId) ?? 0,
            ]);
        if (unlockedPairs.length > 0) {
          invoke("achievements_sync_ledger", {
            userId: user.id,
            achievements: unlockedPairs,
          }).catch(console.error);
        }
      }

      // Sorteia desafios diários baseados no dia, módulos habilitados e desafios concluídos (apenas se o pet estiver ativo)
      const challenges = isPetActive
        ? getDailyChallenges(
            todayStrFormatted,
            enabledModules,
            rawProgress.completedChallengesToday,
            rawStats,
          )
        : [];
      setDailyChallenges(challenges);

      // Função utilitária para verificar progresso dos desafios localmente em tempo real
      const getChallengeProgressLocal = (
        c: DailyChallenge,
        s: RealtimeGlobalStats,
      ) => {
        switch (c.type) {
          case "pomodoro":
            return s.totalPomodorosToday;
          case "study":
            return Math.round(s.studyHoursToday * 60);
          case "reading":
            return s.readingPagesToday;
          case "habit":
            return s.habitsCompletedToday;
          case "note":
            return s.notesCreatedToday;
          case "task":
            return s.completedTasksToday;
          case "sleep":
            return s.sleepLoggedTodayHours > 0 ? 1 : 0;
          default:
            return 0;
        }
      };

      // Identifica desafios que foram completados mas ainda não foram registrados como resgatados
      const unclaimedCompleted = challenges.filter((c) => {
        const current = getChallengeProgressLocal(c, rawStats);
        const isCompleted = current >= c.target;
        const isClaimed = rawProgress.completedChallengesToday.includes(c.id);
        return isCompleted && !isClaimed;
      });

      // Identifica desafios que deixaram de estar completos (por exemplo, deletou registro de sono, desmarcou hábito)
      // mas que constam como completados/resgatados hoje.
      const challengesToUndo = challenges.filter((c) => {
        const current = getChallengeProgressLocal(c, rawStats);
        const isCompleted = current >= c.target;
        const isClaimed = rawProgress.completedChallengesToday.includes(c.id);
        return !isCompleted && isClaimed;
      });

      let progressChanged = false;

      if (unclaimedCompleted.length > 0) {
        for (const challenge of unclaimedCompleted) {
          try {
            await invoke<[number, number]>("achievements_complete_challenge", {
              userId: user.id,
              challengeId: challenge.id,
              xpAward: challenge.xp,
              date: todayStrFormatted,
            });
            toast.success(
              isPetActive
                ? `Desafio Concluído! +${challenge.xp} XP acumulado para seu pet.`
                : `Desafio Concluído! Parabéns pelo seu progresso.`,
              {
                icon: React.createElement(Trophy, {
                  className: "w-5 h-5 text-amber-500",
                }),
              },
            );
            progressChanged = true;
          } catch (e) {
            console.error("Erro ao auto-resgatar desafio:", challenge.id, e);
          }
        }
      }

      if (challengesToUndo.length > 0) {
        for (const challenge of challengesToUndo) {
          try {
            await invoke<[number, number]>("achievements_undo_challenge", {
              userId: user.id,
              challengeId: challenge.id,
              date: todayStrFormatted,
            });
            toast.info(
              `Desafio Desfeito: O progresso de "${challenge.title}" diminuiu. XP do pet reduzido.`,
              {
                icon: React.createElement(Trophy, {
                  className: "w-5 h-5 text-neutral-500",
                }),
              },
            );
            progressChanged = true;
          } catch (e) {
            console.error("Erro ao desfazer desafio:", challenge.id, e);
          }
        }
      }

      if (progressChanged) {
        // Recarrega o estado atualizado do progresso e do histórico
        const updatedProgress = await invoke<UserProgressState>(
          "achievements_get_user_state",
          {
            userId: user.id,
            today: todayStrFormatted,
            threeDaysAgo: threeDaysAgoStrFormatted,
          },
        );
        setProgress(updatedProgress);

        const updatedHistory = await invoke<XPHistoryEntry[]>(
          "stats_get_xp_history",
          {
            userId: user.id,
          },
        );
        setXpHistory(updatedHistory);
        window.dispatchEvent(new Event("aegis-achievements-refresh"));
      } else {
        setProgress(rawProgress);
        setXpHistory(rawHistory);
      }

      setLoading(false);
    } catch (err) {
      console.error(
        "Erro ao carregar dados do Tauri, usando fallback mockado para visualização local:",
        err,
      );

      const today = now;
      const todayStrFormatted = formatDateLocal(today);

      // Mocks de fallback para o ambiente do navegador web
      setStats({
        totalPasswords: 3,
        totalTasks: 5,
        completedTasksTotal: 2,
        completedTasksToday: 1,
        totalNotes: 4,
        notesCreatedToday: 1,
        totalPomodorosToday: 1,
        totalPomodoros: 4,
        totalHabits: 2,
        habitsCompletedToday: 1,
        sleepLoggedTodayHours: 8.0,
        studyHoursToday: 1.5,
        readingPagesToday: 15,
        readingBooksTotal: 2,
        activeDaysTotal: 3,
        currentXp: 120,
        level: 2,
        treeXp: 40,
        treeLevel: 1,
        xpToday: 0,
        totalGlossaryWords: 1,
        totalFlashcardDecks: 1,
        totalMovies: 1,
        maxHabitStreak: 0,
        hasNightPomodoro: false,
      });

      setProgress({
        xp: 120,
        level: 2,
        treeXp: 40,
        treeLevel: 1,
        unlockedAchievements: [
          {
            achievementId: "first_login",
            unlockedAt: new Date().toISOString(),
          },
        ],
        completedChallengesToday: [],
        last3DaysCompletedCount: 1,
        lastCompletedDate: formatDateLocal(
          new Date(now.getTime() - 24 * 60 * 60 * 1000),
        ),
      });

      setXpHistory([
        {
          id: 1,
          userId: user?.id || "fallback-user",
          amount: 30,
          source: "Registro de Sono",
          xpType: "Global",
          timestamp: "2026-06-24 08:30:00",
        },
        {
          id: 2,
          userId: user?.id || "fallback-user",
          amount: 15,
          source: "Nova Anotação",
          xpType: "Global",
          timestamp: "2026-06-24 07:15:00",
        },
        {
          id: 3,
          userId: user?.id || "fallback-user",
          amount: 50,
          source: "Desafio Diário: challenge_study_30",
          xpType: "Pet",
          timestamp: "2026-06-24 06:00:00",
        },
      ]);

      const challenges = isPetActive
        ? getDailyChallenges(todayStrFormatted, enabledModules)
        : [];
      setDailyChallenges(challenges);

      setLoading(false);
    }
  }, [user?.id, enabledModules, todayStr, threeDaysAgoStr, now, isPetActive]);

  // Carrega ao montar, logar, habilitar módulos, receber eventos globais de atualização ou periodicamente a cada 5 segundos
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const handleRefresh = () => {
      loadData();
    };

    window.addEventListener("aegis-achievements-refresh", handleRefresh);
    return () => {
      window.removeEventListener("aegis-achievements-refresh", handleRefresh);
    };
  }, [loadData]);

  // Resgatar recompensa de desafio diário
  const claimChallenge = async (challenge: DailyChallenge) => {
    if (!user?.id || !progress) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke<[number, number]>("achievements_complete_challenge", {
        userId: user.id,
        challengeId: challenge.id,
        xpAward: challenge.xp,
        date: todayStr,
      });

      toast.success(
        isPetActive
          ? `Desafio Concluído! +${challenge.xp} XP acumulado para seu pet.`
          : `Desafio Concluído! Parabéns pelo seu progresso.`,
        {
          icon: React.createElement(Trophy, {
            className: `w-5 h-5 ${theme.text}`,
          }),
        },
      );

      window.dispatchEvent(new Event("aegis-achievements-refresh"));
    } catch (err) {
      console.error("Erro ao resgatar desafio:", err);
    }
  };

  // Retorna progresso de um desafio específico comparando com as métricas globais
  const getChallengeProgress = (challenge: DailyChallenge) => {
    if (!stats) return 0;
    switch (challenge.type) {
      case "pomodoro":
        return stats.totalPomodorosToday;
      case "study":
        return Math.round(stats.studyHoursToday * 60);
      case "reading":
        return stats.readingPagesToday;
      case "habit":
        return stats.habitsCompletedToday;
      case "note":
        return stats.notesCreatedToday;
      case "task":
        return stats.completedTasksToday;
      case "sleep":
        return stats.sleepLoggedTodayHours > 0 ? 1 : 0;
      default:
        return 0;
    }
  };

  return {
    moduleColor,
    theme,
    loading,
    stats,
    progress,
    selectedPet,
    setSelectedPet,
    handleSelectPet,
    selectedParticle,
    handleSelectParticle,
    selectedBgMode,
    handleSelectBgMode,
    activeTab,
    setActiveTab,
    xpHistory,
    dailyChallenges,
    todayStr,
    isPetActive,
    handleTogglePetActive,
    claimChallenge,
    getChallengeProgress,
    loadData,
  };
}
