"use client";

import { CheckCircle2, Target } from "lucide-react";
import { useEffect, useState } from "react";
import type { DailyChallenge } from "@/config/achievements.config";
import { useTime } from "@/context/TimeContext";

interface DailyChallengesListProps {
  challenges: DailyChallenge[];
  completedChallengesToday: string[];
  getChallengeProgress: (challenge: DailyChallenge) => number;
  onClaimChallenge?: (challenge: DailyChallenge) => void;
  xpToday: number;
  todayStr: string;
  isPetActive: boolean;
}

export function DailyChallengesList({
  challenges,
  completedChallengesToday,
  getChallengeProgress,
  xpToday,
  todayStr,
  isPetActive,
}: DailyChallengesListProps) {
  const { now: simulatedNow } = useTime();
  // Converte data "YYYY-MM-DD" para "DD/MM/YYYY"
  const formattedDate = todayStr.split("-").reverse().join("/");

  const [timeLeftToMidnight, setTimeLeftToMidnight] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = simulatedNow;
      const midnight = new Date(simulatedNow);
      midnight.setHours(24, 0, 0, 0); // Define meia-noite do dia simulado

      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeftToMidnight(`${hours}h ${minutes}m`);
    };

    updateCountdown();
  }, [simulatedNow]);

  return (
    <div className="p-6 rounded-2xl border border-border/70 bg-card/30 flex flex-col justify-between gap-4 h-full">
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Target className="w-5 h-5 text-amber-500" />
          <h2 className="text-sm font-bold text-foreground">
            Desafios de Hoje ({formattedDate})
          </h2>
          <span className="text-[10px] text-muted-foreground font-medium bg-muted/65 px-2 py-0.5 rounded-md border border-border/30">
            Reseta em {timeLeftToMidnight}
          </span>
        </div>
        <span className="text-[10px] font-bold text-amber-500 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          Resgatado hoje: +{xpToday} XP
        </span>
      </div>

      <p className="text-xs text-muted-foreground -mt-1 mb-1 leading-relaxed">
        {isPetActive ? (
          <>
            Conclua e resgate os desafios diários para ganhar XP para o seu{" "}
            <strong>Pet Aegis</strong>, ajudando-o a subir de nível, se manter
            vivo e cheio de energia!
          </>
        ) : (
          <>
            Conclua e resgate os desafios diários para testar seus limites e
            ganhar conquistas. Ative seu mascote na aba <strong>Mascote</strong>{" "}
            para acompanhar sua evolução!
          </>
        )}
      </p>

      <div className="flex flex-col gap-3">
        {challenges.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border/60 bg-muted/5 text-center text-xs text-muted-foreground leading-normal">
            Nenhum desafio disponível para hoje. Ative módulos como Tarefas,
            Estudos, Hábitos, Pomodoro, Leitura ou Anotações nas Configurações
            para gerar desafios diários!
          </div>
        ) : (
          challenges.map((challenge) => {
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
                className="p-4 rounded-xl border border-border/60 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 text-left flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {challenge.title}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded">
                      +{challenge.xp} XP
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {challenge.description}
                  </p>

                  {/* Progresso visual */}
                  <div className="flex items-center gap-2 mt-2 w-full max-w-md">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden border border-border/55">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? "bg-green-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground shrink-0 min-w-[32px] text-right">
                      {current} / {target}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  {isClaimed || isCompleted ? (
                    <span className="text-xs font-bold text-green-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
                      <CheckCircle2 className="w-4 h-4 text-green-550" />{" "}
                      Concluído
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground border border-border bg-muted/40 px-3 py-1.5 rounded-lg select-none">
                      Em Progresso
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
