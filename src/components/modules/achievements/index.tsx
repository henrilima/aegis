"use client";

import {
  ArrowUpRight,
  Award,
  Cat,
  History,
  Info,
  Medal,
  Sparkles,
  Trophy,
} from "lucide-react";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getRankForLevel,
  getXPForLevel,
  RANKS,
} from "@/config/achievements.config";
import { PET_BACKGROUNDS } from "@/config/pets.config";
import { cn } from "@/lib/utils";
// Helpers e Hook do Módulo
import {
  formatXPDate,
  formatXPDescription,
  formatXPSideText,
  formatXPTitle,
  getProgressBarGradient,
  rankStyles,
} from "./achievementsUtils";
import { AchievementsGrid } from "./components/AchievementsGrid";
import { CategoryMedalsCard } from "./components/CategoryMedalsCard";
import { DailyChallengesList } from "./components/DailyChallengesList";
import { ParticleSelector } from "./components/ParticleSelector";
import { PetDisplay } from "./components/PetDisplay";
// Subcomponentes
import { PetSelector } from "./components/PetSelector";
import { StatsPanel } from "./components/StatsPanel";
import { useAchievementsLogic } from "./useAchievementsLogic";

export default function AchievementsModule() {
  const {
    moduleColor,
    theme,
    loading,
    stats,
    progress,
    selectedPet,
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
  } = useAchievementsLogic();

  // Configuração das abas integradas no cabeçalho do módulo
  const tabs = [
    { id: "overview", label: "Visão Geral", icon: Trophy },
    { id: "pet", label: "Mascote", icon: Cat },
    { id: "achievements", label: "Medalhas & Estatísticas", icon: Award },
    { id: "history", label: "Histórico de XP", icon: History },
    { id: "guide", label: "Guia de Ranks", icon: Info },
  ];

  if (loading || !progress || !stats) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-100">
        <div
          className={`flex items-center gap-2 animate-pulse font-bold ${theme.text}`}
        >
          <Trophy className="w-5 h-5 animate-bounce" /> Carregando conquistas e
          XP...
        </div>
      </div>
    );
  }

  const xpNeeded = getXPForLevel(progress.level);
  const xpPercent = Math.min(100, Math.max(0, (progress.xp / xpNeeded) * 100));
  const rank = getRankForLevel(progress.level);

  // O pet entra em repouso (idle) se todos os desafios diários de hoje forem concluídos/reivindicados
  const allChallengesCompleted =
    dailyChallenges.length > 0 &&
    dailyChallenges.every((c) =>
      progress.completedChallengesToday.includes(c.id),
    );

  const rStyle = rankStyles[rank.name] || {
    bg: "bg-card/30",
    border: "border-border/70",
    text: "text-foreground",
    solidBg: "bg-primary",
  };

  const glows: Record<string, string> = {
    Ferro: "rgba(115, 115, 115, 0.12)",
    Bronze: "rgba(180, 83, 9, 0.12)",
    Prata: "rgba(203, 213, 225, 0.18)",
    Ouro: "rgba(234, 179, 8, 0.18)",
    Platina: "rgba(34, 211, 238, 0.18)",
    Esmeralda: "rgba(52, 211, 153, 0.18)",
    Diamante: "rgba(96, 165, 250, 0.18)",
    Titânio: "rgba(192, 132, 252, 0.18)",
    Grafeno: "rgba(214, 211, 209, 0.18)",
  };
  const shadowColor = glows[rank.name] || "rgba(255, 255, 255, 0.05)";
  const glowShadow = {
    boxShadow: `0 10px 30px -10px ${shadowColor}, inset 0 1px 0 0 rgba(255, 255, 255, 0.05)`,
  };

  const xpProgressCard = (
    <div
      className={`w-full h-full p-6 rounded-2xl border backdrop-blur-md ${rStyle.border} ${rStyle.bg} flex flex-col justify-between gap-6 transition-all duration-300`}
      style={glowShadow}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 pb-5 border-b border-border/50">
        <div className="flex items-center gap-4 text-left">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border shrink-0 ${rank.color}`}
          >
            <Medal className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                Rank {rank.name}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rStyle.border} ${rStyle.bg} ${rStyle.text}`}
              >
                Nível {progress.level}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
              {rank.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 bg-muted/10 border border-border/40 rounded-xl p-3 text-left md:text-right md:items-end w-full md:w-auto shrink-0">
          <span className="text-xs font-semibold text-muted-foreground">
            Progresso do Rank
          </span>
          {rank.nextRank ? (
            <div className="flex flex-col md:items-end gap-0.5">
              <span
                className={`text-xs font-bold flex items-center gap-1 justify-start md:justify-end ${theme.text}`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Próximo:{" "}
                {rank.nextRank}
              </span>
              <span className="text-[10px] text-muted-foreground">
                no Nível {rank.minLevel + (rank.maxLevel - rank.minLevel + 1)}{" "}
                (Falta <strong>{rank.levelsToNext}</strong>{" "}
                {rank.levelsToNext === 1 ? "nível" : "níveis"})
              </span>
            </div>
          ) : (
            <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Nível Máximo Atingido!
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground">
            XP do Nível Atual:{" "}
            <span className="text-foreground">{progress.xp}</span> / {xpNeeded}{" "}
            XP
          </span>
          <span className={`font-bold ${theme.text}`}>
            {Math.round(xpPercent)}% concluído para o nível {progress.level + 1}
          </span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border/40">
          <div
            className={`h-full bg-linear-to-r transition-all duration-500 ease-out ${getProgressBarGradient(moduleColor)}`}
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-left leading-relaxed">
          Você ganha XP global executando focos Pomodoro, marcando hábitos,
          registrando sonos saudáveis, estudando ou adicionando termos ao
          dicionário.
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-foreground px-1">
      <ModuleHeader
        color={moduleColor}
        title="Salão de Troféus & XP"
        subtitle={
          <div className="flex flex-col gap-1.5 mt-1.5 max-w-md w-full">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>
                Nível Global {progress.level} ({rank.name}) •{" "}
                {progress.unlockedAchievements.length} Conquistas
              </span>
              <span className="font-bold ml-4">
                {progress.xp} / {xpNeeded} XP ({Math.round(xpPercent)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/30">
              <div
                className={`h-full bg-linear-to-r transition-all duration-500 ease-out ${getProgressBarGradient(moduleColor)}`}
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        }
        icon={Trophy}
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "overview" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {isPetActive ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Coluna Esquerda: Mascote */}
              <div className="lg:col-span-1">
                <PetDisplay
                  selectedPet={selectedPet}
                  selectedParticle={selectedParticle}
                  selectedBgMode={selectedBgMode}
                  treeLevel={progress.treeLevel}
                  treeXp={progress.treeXp}
                  last3DaysCompletedCount={progress.last3DaysCompletedCount}
                  allCompleted={allChallengesCompleted}
                  completedToday={progress.completedChallengesToday.length > 0}
                  lastCompletedDate={progress.lastCompletedDate}
                />
              </div>

              {/* Coluna Direita: Desafios Diários */}
              <div className="lg:col-span-2">
                <DailyChallengesList
                  challenges={dailyChallenges}
                  completedChallengesToday={progress.completedChallengesToday}
                  getChallengeProgress={getChallengeProgress}
                  onClaimChallenge={claimChallenge}
                  xpToday={stats.xpToday}
                  todayStr={todayStr}
                  isPetActive={isPetActive}
                />
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-border/70 bg-card/30 flex flex-col items-center text-center gap-4 backdrop-blur-md max-w-xl mx-auto my-8">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                <Cat className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-bold text-foreground">
                  Mascote Aegis desativado
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Os desafios diários servem exclusivamente para acumular XP e
                  evoluir o seu mascote Aegis. Como o seu mascote está
                  atualmente desativado, os desafios diários não estão sendo
                  exibidos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePetActive(true)}
                className="mt-2 px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors cursor-pointer"
              >
                Ativar mascote
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "pet" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Card de Ativação do Pet */}
          <div className="p-6 rounded-xl border border-border/70 bg-card/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 backdrop-blur-md">
            <div className="flex flex-col gap-1 text-left">
              <h3 className="text-lg font-bold text-foreground">
                {isPetActive
                  ? "Mascote Aegis ativado"
                  : "Mascote Aegis desativado"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isPetActive
                  ? "Seu mascote está atualmente ativo. Ele aparecerá na tela de Visão Geral e receberá XP dos seus desafios diários."
                  : "Seu mascote está desativado. Você não receberá XP de mascote ou notificações relacionadas e a interface de mascote sumirá da Visão Geral."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePetActive(!isPetActive)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                isPetActive ? "bg-amber-500" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  isPetActive ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-3 gap-6 items-start transition-all duration-300",
              !isPetActive &&
                "opacity-40 pointer-events-none select-none grayscale",
            )}
          >
            {/* Coluna Esquerda: Mascote (Pet) */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              <PetDisplay
                selectedPet={selectedPet}
                selectedParticle={selectedParticle}
                selectedBgMode={selectedBgMode}
                treeLevel={progress.treeLevel}
                treeXp={progress.treeXp}
                last3DaysCompletedCount={progress.last3DaysCompletedCount}
                allCompleted={allChallengesCompleted}
                completedToday={progress.completedChallengesToday.length > 0}
                lastCompletedDate={progress.lastCompletedDate}
              />
            </div>

            {/* Coluna Direita: Seleção de Pets e Informações */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              <PetSelector
                selectedPet={selectedPet}
                onSelectPet={handleSelectPet}
                userLevel={progress.level}
              />

              <ParticleSelector
                selectedParticle={selectedParticle}
                onSelectParticle={handleSelectParticle}
                userLevel={progress.level}
              />

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Período do Dia
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Selecione o cenário ou defina para alternar automaticamente.
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-border/70 bg-card/30">
                  <Select
                    value={selectedBgMode}
                    onValueChange={(val) =>
                      handleSelectBgMode(
                        val as "cyclic" | "day" | "afternoon" | "night",
                      )
                    }
                  >
                    <SelectTrigger className="w-full sm:w-60 bg-card border-border/50">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      {PET_BACKGROUNDS.map((bg) => (
                        <SelectItem key={bg.id} value={bg.id}>
                          {bg.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Guia do Mascote Aegis */}
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Guia do Mascote Aegis
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Entenda como funciona o sistema de evolução e vitalidade do
                    seu companheiro pixelado.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col gap-1.5">
                    <span className="font-bold text-foreground text-sm">
                      Evolução e Nível
                    </span>
                    <span className="text-muted-foreground text-xs leading-relaxed">
                      O seu Mascote possui progressão de XP{" "}
                      <strong>completamente isolada</strong> do seu Nível
                      Global. Ele só ganha XP quando você conclui e resgata os
                      Desafios Diários.
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col gap-1.5">
                    <span className="font-bold text-foreground text-sm">
                      Vitalidade e Reset de XP
                    </span>
                    <span className="text-muted-foreground text-xs leading-relaxed">
                      Mantenha a consistência! A cada{" "}
                      <strong>
                        4 dias seguidos sem concluir nenhuma missão
                      </strong>
                      , o pet desmaia e todo o seu XP acumulado é resetado para
                      zero. Ele só voltará a subir de nível quando você retomar
                      as atividades diárias.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* Card de Rank e Estatísticas Gerais lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 flex flex-col gap-6">
              {xpProgressCard}
              <CategoryMedalsCard
                unlockedAchievements={progress.unlockedAchievements}
              />
            </div>
            <div className="lg:col-span-1 flex">
              <StatsPanel stats={stats} />
            </div>
          </div>

          <div className="w-full">
            <AchievementsGrid
              unlockedAchievements={progress.unlockedAchievements}
            />
          </div>
        </div>
      )}

      {activeTab === "history" &&
        (xpHistory.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border/60 bg-card/10 rounded-xl animate-in fade-in duration-300">
            <History className="w-8 h-8 text-muted-foreground/60 mx-auto mb-3 animate-pulse" />
            <p className="text-xs text-muted-foreground">
              Nenhum registro de ganho de XP encontrado ainda.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-in fade-in duration-300">
            {xpHistory.map((entry) => {
              const isPet = entry.xpType === "Pet";
              const isAchievement =
                entry.xpType === "Global" &&
                entry.referenceTable === "achievements_unlocked";
              const isLost = entry.isLost;
              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-xl border border-border/60 bg-card/30 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors ${
                    isLost ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border w-19 text-center shrink-0 ${
                        isLost
                          ? "bg-muted border-muted-foreground/20 text-muted-foreground"
                          : isPet
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : isAchievement
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                              : "bg-cyan-500/10 border-cyan-500/20 text-cyan-500"
                      }`}
                    >
                      {isPet
                        ? "XP de Pet"
                        : isAchievement
                          ? "Conquista"
                          : "XP Global"}
                    </span>
                    <div
                      className={
                        isLost ? "line-through text-muted-foreground" : ""
                      }
                    >
                      <span className="font-semibold text-sm text-foreground block">
                        {formatXPTitle(entry.source)}
                        {isLost && (
                          <span className="text-[10px] text-red-500 font-bold ml-2 normal-case no-underline inline-block">
                            (registro original perdido)
                          </span>
                        )}
                      </span>
                      {formatXPDescription(entry.source) && (
                        <span className="text-[11px] text-muted-foreground block mt-0.5 leading-snug">
                          {formatXPDescription(entry.source)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground/60 block mt-1">
                        {formatXPDate(entry.timestamp)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold shrink-0 ${
                      isLost
                        ? "line-through text-muted-foreground"
                        : isPet
                          ? "text-emerald-500"
                          : isAchievement
                            ? "text-amber-500"
                            : "text-cyan-500"
                    }`}
                  >
                    {formatXPSideText(entry.amount, entry.source)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

      {activeTab === "guide" && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-300">
          {/* Guia de Ranks */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                Guia de Ranks do Aegis
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Entenda a curva de experiência necessária para evoluir em cada
                rank do seu Nível Global e os benefícios visuais no aplicativo.
                O Mascote possui um sistema de progressão de nível de XP
                completamente independente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {RANKS.map((r) => {
                const isCurrent = rank.name === r.name;
                const rStyle = rankStyles[r.name] || {
                  bg: "bg-card/40",
                  border: "border-border/50",
                  text: "text-foreground",
                  solidBg: "bg-primary",
                };
                return (
                  <div
                    key={r.name}
                    className={`relative p-5 rounded-xl flex flex-col gap-3 transition-all duration-300 ${
                      isCurrent
                        ? `${rStyle.bg}`
                        : "border border-border/50 bg-card/40 hover:bg-muted/10 hover:border-border/80"
                    }`}
                  >
                    {isCurrent && (
                      <span
                        className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold border ${rStyle.border} ${rStyle.bg} ${rStyle.text}`}
                      >
                        Seu Rank
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl border shrink-0 ${r.color}`}
                      >
                        <Medal className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{r.name}</h4>
                        <span className="text-[10px] text-muted-foreground">
                          Níveis {r.minLevel} a{" "}
                          {r.maxLevel === 999 ? "∞" : r.maxLevel}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1">
                      {r.description}
                    </p>
                    <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        Requisito por nível:
                      </span>
                      <span className={`font-semibold ${rStyle.text}`}>
                        {r.xpPerLevel} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabela Resumo do Multiplicador de XP */}
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                Tabela de Atividades & Ganhos de XP
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Confira como acumular XP global realizando suas atividades
                diárias no Aegis.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col gap-1">
                <span className="font-bold text-foreground text-sm block mb-0.5">
                  Sono
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed">
                  30 XP por dia + 5 XP por hora dormida.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col gap-1">
                <span className="font-bold text-foreground text-sm block mb-0.5">
                  Estudos
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed">
                  10 XP por sessão registrada + 15 XP por hora.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col gap-1">
                <span className="font-bold text-foreground text-sm block mb-0.5">
                  Leitura
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed">
                  30 XP por novo livro + 10 XP por sessão + 2 XP por página.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col gap-1">
                <span className="font-bold text-foreground text-sm block mb-0.5">
                  Entretenimento
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed">
                  25 XP flat ao cadastrar um novo filme/série assistido.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col gap-1">
                <span className="font-bold text-foreground text-sm block mb-0.5">
                  Dicionário
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed">
                  15 XP flat ao registrar um novo termo ou palavra.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col gap-1">
                <span className="font-bold text-foreground text-sm block mb-0.5">
                  Flashcards
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed">
                  25 XP flat ao criar um novo baralho de memorização.
                </span>
              </div>
            </div>
          </div>

          {/* Guia do Mascote (Pet) */}
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                Guia do Mascote Aegis
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Os Mascotes são companheiros em pixel-art que acompanham sua
                evolução diária. Eles possuem progressão de nível de XP
                completamente independente do seu nível global.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col gap-1.5">
                <span className="font-bold text-foreground text-sm flex items-center gap-1">
                  Evolução e Nível
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed">
                  O seu Mascote possui progressão de XP completamente isolada do
                  seu Nível Global. Ele só ganha XP quando você conclui e
                  resgata os Desafios Diários.
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col gap-1.5">
                <span className="font-bold text-foreground text-sm flex items-center gap-1">
                  Vitalidade e Humor
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed">
                  O pet entra em estado de caminhada enquanto houver desafios
                  pendentes no dia. Fica descansando ao concluir todos, e
                  desmaia com reset de XP se você passar 4 dias seguidos
                  inativo!
                </span>
              </div>
              <div className="p-4 rounded-xl border border-border/40 bg-card/40 flex flex-col gap-1.5">
                <span className="font-bold text-foreground text-sm flex items-center gap-1">
                  Mascotes Disponíveis
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {[
                    "Doberman",
                    "Shiba",
                    "Gato Cerveja",
                    "Gato Preto",
                    "Rato Marrom",
                    "Rato Azul",
                    "Pássaro",
                    "Pombo",
                  ].map((petName) => (
                    <span
                      key={petName}
                      className="text-[10px] px-2 py-0.5 rounded bg-muted border border-border/30 text-foreground font-medium"
                    >
                      {petName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
