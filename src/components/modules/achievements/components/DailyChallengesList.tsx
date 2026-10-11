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
      const midnight = new Date(simulatedNow);
      midnight.setHours(24, 0, 0, 0); // Define meia-noite do dia simulado

      const diffMs = midnight.getTime() - simulatedNow.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeftToMidnight(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    // Atualiza a cada 30 segundos para manter o countdown preciso independente do TimeContext
    const intervalId = setInterval(updateCountdown, 30_000);
    return () => clearInterval(intervalId);
  }, [simulatedNow]);

  return (
    <div className="p-6 rounded-2xl border border-border/80 bg-linear-to-b from-card/80 via-card/50 to-muted/20 backdrop-blur-md flex flex-col justify-between gap-5 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xs">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              Desafios Diários
              <span className="text-[11px] font-normal text-muted-foreground">
                ({formattedDate})
              </span>
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                Reseta em {timeLeftToMidnight}
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0 flex items-center">
          <span className="text-[11px] font-mono font-bold text-amber-400 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 shadow-xs">
            XP Ganho Hoje: +{xpToday} XP
          </span>
        </div>
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
                className="p-4 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex-1 text-left flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground group-hover:text-amber-400 transition-colors">
                      {challenge.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md shadow-xs">
                      +{challenge.xp} XP
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {challenge.description}
                  </p>

                  {/* Progresso visual */}
                  <div className="flex items-center gap-3 mt-1.5 w-full max-w-md">
                    <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700/60 p-px">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? "bg-linear-to-r from-emerald-500 to-teal-400"
                            : "bg-linear-to-r from-amber-500 to-yellow-400"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground shrink-0 min-w-9 text-right">
                      {current} / {target}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  {isClaimed ? (
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />{" "}
                      Resgatado
                    </span>
                  ) : isCompleted ? (
                    <span className="text-xs font-mono font-bold text-teal-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30">
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />{" "}
                      Concluído
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-semibold text-muted-foreground border border-border/60 bg-muted/50 px-3 py-1.5 rounded-lg select-none">
                      Em curso
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
