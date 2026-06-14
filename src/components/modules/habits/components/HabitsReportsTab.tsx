"use client";

import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Habit } from "../types";
import { HabitsReportCanvas } from "./HabitsReportCanvas";

interface HabitsReportsTabProps {
  habits: Habit[];
}

export function HabitsReportsTab({ habits }: HabitsReportsTabProps) {
  const color = getModuleColor("habits");
  const theme = getColorTheme(color);
  const [periodOffset, setPeriodOffset] = useState(0);

  const positive = habits.filter((h) => h.habitType === "Positive");
  const negative = habits.filter(
    (h) => h.habitType === "Negative" || h.habitType === "Bad",
  );

  const totalCurrentStreak = positive.reduce(
    (acc, h) => acc + h.currentStreak,
    0,
  );
  const maxGlobalStreak = habits.reduce(
    (acc, h) => Math.max(acc, h.maxStreak),
    0,
  );

  // Cálculo da Taxa de Foco (Performance)
  const focusRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const totalPerformance = habits.reduce((acc, h) => {
      const target =
        h.goalDays && h.goalDays > 0
          ? h.goalDays
          : h.maxStreak > 0
            ? h.maxStreak
            : 7;
      const performance = Math.min(100, (h.currentStreak / target) * 100);
      return acc + performance;
    }, 0);
    return Math.round(totalPerformance / habits.length);
  }, [habits]);

  const statusLabel = useMemo(() => {
    if (habits.length === 0) return "Sem dados";
    if (focusRate >= 90) return "Inabalável";
    if (focusRate >= 60) return "Consistente";
    if (focusRate >= 30) return "Em Evolução";
    return "Iniciando";
  }, [habits, focusRate]);

  const reportText = useMemo(() => {
    const rawDateStr = new Date().toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const cleanRange = rawDateStr.charAt(0).toUpperCase() + rawDateStr.slice(1);

    const lines = [
      "⚡ Aegis — Relatório Mensal de Hábitos",
      `📅 ${cleanRange}`,
      "",
      `🔥 Ofensiva acumulada: ${totalCurrentStreak} dias`,
      `🏆 Recorde global: ${maxGlobalStreak} dias`,
      `📊 Performance global: ${focusRate}%`,
      `✅ Hábitos em foco: ${positive.length}`,
      `🛡️ Controle de vícios: ${negative.length}`,
      "",
      "- Gerado pelo Aegis",
    ];
    return lines.join("\n");
  }, [
    totalCurrentStreak,
    maxGlobalStreak,
    focusRate,
    positive.length,
    negative.length,
  ]);

  const copyReport = () => {
    navigator.clipboard.writeText(reportText);
    toast.success("Relatório copiado para a área de transferência!");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Controles de Período (Simulando o padrão de outros módulos) */}
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
              Relatório Mensal
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
          <HabitsReportCanvas habits={habits} />
        </div>

        {/* Text Section */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", theme.bg)}>
                  <Activity className={cn("w-4 h-4", theme.text)} />
                </div>
                <h3 className="font-bold text-foreground">
                  Resumo de Desempenho
                </h3>
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
    </div>
  );
}
