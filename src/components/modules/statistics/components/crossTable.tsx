"use client";

import type { CrossMetric } from "../types";

interface CrossTableProps {
  metrics: CrossMetric[];
  activeSources: string[];
}

/**
 * Tabela detalhada com os dados brutos históricos comparados lado a lado
 */
export function CrossTable({ metrics, activeSources }: CrossTableProps) {
  // Ordenação decrescente: mais recentes primeiro
  const sorted = [...metrics]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  if (sorted.length === 0) {
    return (
      <p className="text-neutral-600 text-center py-8 italic font-medium">
        Histórico vazio no período selecionado.
      </p>
    );
  }

  const showSleep = activeSources.includes("sono");
  const showStudy = activeSources.includes("estudos");
  const showReading = activeSources.includes("leitura");
  const showFocus = activeSources.includes("foco");

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="py-3 px-2 text-left text-[10px] font-bold text-neutral-600">
              Data
            </th>
            {showSleep && (
              <th className="py-3 px-2 text-left text-[10px] font-bold text-neutral-600">
                Sono
              </th>
            )}
            {showStudy && (
              <th className="py-3 px-2 text-left text-[10px] font-bold text-neutral-600">
                Estudo
              </th>
            )}
            {showReading && (
              <th className="py-3 px-2 text-left text-[10px] font-bold text-neutral-600">
                Leitura
              </th>
            )}
            {showFocus && (
              <th className="py-3 px-2 text-left text-[10px] font-bold text-neutral-600">
                Foco
              </th>
            )}
            {showStudy && (
              <>
                <th className="py-3 px-2 text-left text-[10px] font-bold text-neutral-600">
                  Questões
                </th>
                <th className="py-3 px-2 text-left text-[10px] font-bold text-neutral-600">
                  Acerto
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/30">
          {sorted.map((m) => {
            const [y, mo, d] = m.date.split("-").map(Number);
            const dateLabel = new Date(y, mo - 1, d).toLocaleDateString(
              "pt-BR",
              { day: "2-digit", month: "short" },
            );

            // Define o destaque visual baseado na performance do dia
            const hitColor =
              m.questionsTotal === 0
                ? "text-neutral-600"
                : m.studyHitRate >= 75
                  ? "text-green-400"
                  : m.studyHitRate >= 55
                    ? "text-yellow-400/80"
                    : "text-red-600 dark:text-red-400/80";

            return (
              <tr
                key={m.date}
                className="group border-b border-border/10 hover:bg-accent/50/30 transition-all"
              >
                <td className="py-2.5 px-2 text-muted-foreground font-medium">
                  {dateLabel}
                </td>
                {showSleep && (
                  <td className="py-2.5 px-2 text-blue-400/90 font-bold">
                    {m.sleepHours > 0 ? `${m.sleepHours.toFixed(1)}h` : "-"}
                  </td>
                )}
                {showStudy && (
                  <td className="py-2.5 px-2 text-violet-600 dark:text-violet-400/90 font-bold">
                    {m.studyHours > 0 ? `${m.studyHours.toFixed(1)}h` : "-"}
                  </td>
                )}
                {showReading && (
                  <td className="py-2.5 px-2 text-orange-600 dark:text-orange-400/90 font-bold">
                    <div>
                      {m.readingPages > 0
                        ? `${m.readingPages}p / ${m.readingMinutes}m`
                        : "-"}
                    </div>
                    {m.readingPpm > 0 && (
                      <div className="text-[9px] text-orange-600/70 font-bold">
                        {m.readingPpm} PPM
                      </div>
                    )}
                  </td>
                )}
                {showFocus && (
                  <td className="py-2.5 px-2 text-rose-500 font-bold">
                    {m.focusScore !== undefined && m.focusScore !== null
                      ? m.focusScore.toFixed(1)
                      : "-"}
                  </td>
                )}
                {showStudy && (
                  <>
                    <td className="py-2.5 px-2 text-muted-foreground font-medium">
                      {m.questionsTotal}
                    </td>
                    <td className={`py-2.5 px-2 font-bold ${hitColor}`}>
                      {m.questionsTotal > 0 ? `${m.studyHitRate}%` : "-"}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
