"use client";

import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Habit } from "../types";
import { HabitsHeatmap } from "./HabitsHeatmap";
import { HabitsReportCanvas } from "./HabitsReportCanvas";

interface HabitsReportsTabProps {
  habits: Habit[];
}

export function HabitsReportsTab({ habits }: HabitsReportsTabProps) {
  const { now: simulatedNow } = useTime();
  const color = getModuleColor("habits");
  const theme = getColorTheme(color);
  const [periodOffset, setPeriodOffset] = useState(0);
  const [period, setPeriod] = useState<7 | 30 | 100>(30);

  // Consideramos apenas os hábitos ativos para métricas de progresso e ofensivas atuais.
  // Hábitos arquivados guardam histórico do passado e não poluem as métricas da rotina atual.
  const activePositive = habits.filter(
    (h) => h.habitType === "Positive" && !h.archived,
  );
  const activeNegative = habits.filter(
    (h) => (h.habitType === "Negative" || h.habitType === "Bad") && !h.archived,
  );

  const maxGlobalStreak = activePositive.reduce(
    (acc, h) => Math.max(acc, h.maxStreak),
    0,
  );

  // Média de Ofensivas Ativas
  const avgStreak = useMemo(() => {
    if (activePositive.length === 0) return 0;
    const activeStreakSum = activePositive.reduce(
      (acc, h) => acc + h.currentStreak,
      0,
    );
    return Math.round(activeStreakSum / activePositive.length);
  }, [activePositive]);

  // Cálculo da Taxa de Foco baseada nos dias reais agendados no período selecionado
  const focusRate = useMemo(() => {
    if (activePositive.length === 0) return 0;

    let totalAdherence = 0;
    let habitsWithSchedules = 0;

    // Gera a lista de datas do período de teste (dos últimos N dias até hoje)
    const dates: Date[] = [];
    const today = new Date(simulatedNow);
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < period; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d);
    }

    const getFormattedDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    for (const h of activePositive) {
      let scheduledCount = 0;
      let completedCount = 0;

      const weekdays = h.weekdays
        ? h.weekdays.split(",").map(Number)
        : [1, 2, 3, 4, 5];

      for (const d of dates) {
        const wDay = d.getDay();
        const isScheduled =
          !h.frequency || h.frequency === "daily" || weekdays.includes(wDay);

        if (isScheduled) {
          scheduledCount++;
          const formatted = getFormattedDate(d);
          if (h.completedDates?.includes(formatted)) {
            completedCount++;
          }
        }
      }

      if (scheduledCount > 0) {
        const rate = (completedCount / scheduledCount) * 100;
        totalAdherence += rate;
        habitsWithSchedules++;
      }
    }

    return habitsWithSchedules > 0
      ? Math.round(totalAdherence / habitsWithSchedules)
      : 100;
  }, [activePositive, period, simulatedNow]);

  // Cálculo das Taxas de Conclusão Individuais para cada hábito
  const individualRates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date(simulatedNow);
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < period; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d);
    }

    const getFormattedDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    return activePositive.map((h) => {
      let scheduledCount = 0;
      let completedCount = 0;

      const weekdays = h.weekdays
        ? h.weekdays.split(",").map(Number)
        : [1, 2, 3, 4, 5];

      for (const d of dates) {
        const wDay = d.getDay();
        const isScheduled =
          !h.frequency || h.frequency === "daily" || weekdays.includes(wDay);

        if (isScheduled) {
          scheduledCount++;
          const formatted = getFormattedDate(d);
          if (h.completedDates?.includes(formatted)) {
            completedCount++;
          }
        }
      }

      const rate =
        scheduledCount > 0
          ? Math.round((completedCount / scheduledCount) * 100)
          : 0;

      return {
        id: h.id,
        name: h.name,
        rate,
      };
    });
  }, [activePositive, period, simulatedNow]);

  const statusLabel = useMemo(() => {
    if (activePositive.length === 0) return "Sem dados";
    if (focusRate >= 90) return "Inabalável";
    if (focusRate >= 60) return "Consistente";
    if (focusRate >= 30) return "Em Evolução";
    return "Iniciando";
  }, [activePositive.length, focusRate]);

  const reportText = useMemo(() => {
    const periodLabel =
      period === 7
        ? "Últimos 7 dias"
        : period === 30
          ? "Últimos 30 dias"
          : "Últimos 100 dias";
    const rawDateStr = new Date(simulatedNow).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const cleanRange = rawDateStr.charAt(0).toUpperCase() + rawDateStr.slice(1);

    const lines = [
      "⚡ Aegis — Relatório de Hábitos",
      `📅 Período: ${periodLabel} (${cleanRange})`,
      "",
      `🔥 Sequência ativa média: ${avgStreak} dias`,
      `🏆 Recorde de ofensiva: ${maxGlobalStreak} dias`,
      `📊 Taxa de foco no período: ${focusRate}%`,
      `✅ Hábitos diários ativos: ${activePositive.length}`,
      `🛡️ Controle de vícios ativos: ${activeNegative.length}`,
      "",
      "- Gerado pelo Aegis",
    ];
    return lines.join("\n");
  }, [
    period,
    focusRate,
    avgStreak,
    activePositive.length,
    activeNegative.length,
    maxGlobalStreak,
    simulatedNow,
  ]);

  const copyReport = () => {
    navigator.clipboard.writeText(reportText);
    toast.success("Relatório copiado para a área de transferência!");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Controles de Período */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "p-2 rounded-lg bg-background border border-border",
              theme.text,
            )}
          >
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Relatório de Desempenho
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium uppercase">
              {new Date().toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-background/50 border border-border rounded-xl p-1">
          <button
            type="button"
            onClick={() => setPeriodOffset(periodOffset - 1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 py-1 text-xs font-bold text-foreground">
            Período Atual
          </div>
          <button
            type="button"
            onClick={() => setPeriodOffset(periodOffset + 1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Canvas Section */}
        <div className="lg:w-[400px] shrink-0">
          <HabitsReportCanvas
            habits={habits}
            focusRate={focusRate}
            avgStreak={avgStreak}
          />
        </div>

        {/* Text Section */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", theme.bg)}>
                  <Activity className={cn("w-4 h-4", theme.text)} />
                </div>
                <h3 className="font-bold text-foreground">
                  Resumo de Desempenho
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Seletor de Período */}
                <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setPeriod(7)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                      period === 7
                        ? cn(theme.solid, "text-white")
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    7D
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod(30)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                      period === 30
                        ? cn(theme.solid, "text-white")
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    30D
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod(100)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                      period === 100
                        ? cn(theme.solid, "text-white")
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    100D
                  </button>
                </div>

                <button
                  type="button"
                  onClick={copyReport}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                    theme.bg,
                    theme.text,
                    theme.border,
                    theme.bgHover,
                  )}
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Texto
                </button>
              </div>
            </div>

            <div className="flex-1 bg-background/50 border border-border rounded-xl p-6 font-mono text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {reportText}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-background/40 border border-border/50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                  Status Geral
                </p>
                <p className={cn("text-xl font-black", theme.text)}>
                  {statusLabel}
                </p>
              </div>
              <div className="bg-background/40 border border-border/50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                  Taxa de Foco
                </p>
                <p className="text-xl font-black text-foreground">
                  {focusRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa de Calor Anual (Heatmap) */}
      <HabitsHeatmap habits={habits} />

      {/* Taxas de Conclusão Individuais */}
      {activePositive.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-350">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", theme.bg)}>
              <TrendingUp className={cn("w-4 h-4", theme.text)} />
            </div>
            <h3 className="font-bold text-foreground">
              Desempenhos Individuais
            </h3>
          </div>

          <div className="w-full overflow-x-auto border border-border/60 rounded-xl bg-background/25">
            <table className="w-full border-collapse text-left text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-border/50 bg-background/40">
                  <th className="py-3 px-4 font-bold text-muted-foreground w-[180px] text-xs">
                    Nome
                  </th>
                  {individualRates.map((ir) => (
                    <th
                      key={ir.id || ir.name}
                      className="py-3 px-4 font-semibold text-foreground text-center border-l border-border/10"
                    >
                      {ir.name}
                    </th>
                  ))}
                  <th className="py-3 px-4 font-bold text-foreground text-center border-l border-border/30 bg-muted/15">
                    📊 Geral
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-4 px-4 font-bold text-foreground bg-background/10">
                    Taxa de conclusão
                  </td>
                  {individualRates.map((ir) => (
                    <td
                      key={ir.id || ir.name}
                      className="py-4 px-4 text-center border-l border-border/10"
                    >
                      <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                        <span className="font-extrabold text-foreground">
                          {ir.rate}%
                        </span>
                        <div className="w-20 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              theme.solid,
                            )}
                            style={{ width: `${ir.rate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  ))}
                  <td className="py-4 px-4 text-center border-l border-border/30 bg-muted/15">
                    <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                      <span className="font-extrabold text-foreground">
                        {focusRate}%
                      </span>
                      <div className="w-20 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            theme.solid,
                          )}
                          style={{ width: `${focusRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
