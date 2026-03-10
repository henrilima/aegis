"use client";

import { AlertCircle, Award } from "lucide-react";
import { formatHours } from "../utils";

interface SubjectRank {
  name: string;
  hours: number;
  rate: number;
}

interface PerformanceRankingProps {
  mastered: SubjectRank[];
  needFocus: SubjectRank[];
}

export function PerformanceRanking({
  mastered,
  needFocus,
}: PerformanceRankingProps) {
  return (
    <>
      {/* Maestria top acerto */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-6 shadow-xl lg:col-span-1">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-black uppercase text-neutral-400">
            Maestria (Top Acerto)
          </h3>
        </div>
        <div className="flex flex-col gap-4">
          {mastered.length > 0 ? (
            mastered.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-2xl border border-neutral-800"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">
                    {s.name}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {formatHours(s.hours)} de dedicação
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-400">
                    {s.rate}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-neutral-600 italic text-center py-4">
              Ainda não há dados suficientes.
            </p>
          )}
        </div>
      </div>

      {/* Pontos de atenção */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col gap-6 lg:col-span-1 shadow-xl">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-black uppercase text-neutral-400">
            Atenção (Acerto Baixo)
          </h3>
        </div>
        <div className="flex flex-col gap-4">
          {needFocus.length > 0 ? (
            needFocus.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-2xl border border-neutral-800"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">
                    {s.name}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Taxa de acerto abaixo da média
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-red-400">
                    {s.rate}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-neutral-600 italic text-center py-4">
              Continue estudando para identificar áreas.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
