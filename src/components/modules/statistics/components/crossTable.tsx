"use client";

import type { CrossMetric } from "../types";

interface CrossTableProps {
  metrics: CrossMetric[];
}

/**
 * Tabela detalhada com os dados brutos históricos comparados lado a lado
 */
export function CrossTable({ metrics }: CrossTableProps) {
  // Ordenação decrescente: mais recentes primeiro
  const sorted = [...metrics]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  if (sorted.length === 0) {
    return (
      <p className=" text-neutral-600 text-center py-8 italic font-medium">
        Histórico vazio no período selecionado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {["Data", "Sono", "Estudo", "Leitura", "Questões", "Acerto"].map(
              (h) => (
                <th
                  key={h}
                  className="py-3 px-2 text-left text-[10px] font-bold text-neutral-600"
                >
                  {h}
                </th>
              ),
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
                <td className="py-2.5 px-2 text-blue-400/90 font-bold">
                  {m.sleepHours > 0 ? `${m.sleepHours.toFixed(1)}h` : "-"}
                </td>
                <td className="py-2.5 px-2 text-violet-600 dark:text-violet-400/90 font-bold">
                  {m.studyHours > 0 ? `${m.studyHours.toFixed(1)}h` : "-"}
                </td>
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
                <td className="py-2.5 px-2 text-muted-foreground font-medium">
                  {m.questionsTotal}
                </td>
                <td className={`py-2.5 px-2 font-bold ${hitColor}`}>
                  {m.questionsTotal > 0 ? `${m.studyHitRate}%` : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
