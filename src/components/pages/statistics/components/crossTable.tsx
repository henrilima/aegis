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
          <tr className="border-b border-neutral-800">
            {["Data", "Sono", "Estudo", "Questões", "Acerto"].map((h) => (
              <th
                key={h}
                className="py-3 px-2 text-left text-[10px] font-black uppercase text-neutral-600"
              >
                {h}
              </th>
            ))}
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
              m.questions_total === 0
                ? "text-neutral-600"
                : m.study_hit_rate >= 75
                  ? "text-green-400"
                  : m.study_hit_rate >= 55
                    ? "text-yellow-400/80"
                    : "text-red-400/80";

            return (
              <tr
                key={m.date}
                className="group border-b border-neutral-800/10 hover:bg-neutral-800/30 transition-all"
              >
                <td className="py-2.5 px-2 text-neutral-400 font-medium">
                  {dateLabel}
                </td>
                <td className="py-2.5 px-2 text-blue-400/90 font-bold">
                  {m.sleep_hours > 0 ? `${m.sleep_hours.toFixed(1)}h` : "—"}
                </td>
                <td className="py-2.5 px-2 text-violet-400/90 font-bold">
                  {m.study_hours > 0 ? `${m.study_hours.toFixed(1)}h` : "—"}
                </td>
                <td className="py-2.5 px-2 text-neutral-500 font-medium">
                  {m.questions_total}
                </td>
                <td className={`py-2.5 px-2 font-black ${hitColor}`}>
                  {m.questions_total > 0 ? `${m.study_hit_rate}%` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
