"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  Moon,
  Target,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { CorrelationChart } from "./components/correlationChart";
import { CorrelationInsight } from "./components/correlationInsight";
import { CrossTable } from "./components/crossTable";
import { MetricCard } from "./components/metricCard";
import { SleepImpact } from "./components/sleepImpact";
import { StatisticsHeader } from "./components/statisticsHeader";
import { SubjectDistribution } from "./components/subjectDistribution";
import type { CrossMetric, PerformanceSummary } from "./types";

/**
 * Módulo de Estatísticas: Inteligência de Cruzamento de Dados (Estudo, Sono e Performance)
 */
export default function StatisticsPage() {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";
  const [days, setDays] = useState(30);
  const [metrics, setMetrics] = useState<CrossMetric[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Consolidação de métricas via backend
  const loadStats = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [m, s] = await Promise.all([
        invoke<CrossMetric[]>("stats_get_cross_metrics", { userId: uid, days }),
        invoke<PerformanceSummary>("stats_get_performance_summary", {
          userId: uid,
          days,
        }),
      ]);
      setMetrics(m);
      setSummary(s);
    } catch {
      toast.error("Falha ao processar matriz de estatísticas.");
    } finally {
      setLoading(false);
    }
  }, [uid, days]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading)
    return (
      <div className="h-full flex items-center justify-center font-bold">
        <div className="flex flex-col items-center gap-5 animate-pulse">
          <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-500/5">
            <BarChart3 className="w-10 h-10 text-red-400" />
          </div>
          <span className="text-neutral-500  uppercase">
            Processando Matriz de Dados...
          </span>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-white">
      {/* Cabeçalho de Período e Título */}
      <StatisticsHeader days={days} onDaysChange={setDays} />

      {summary && summary.total_days_analyzed > 0 ? (
        <>
          {/* Grid de Métricas Fundamentais */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              icon={Moon}
              label="Eficiência Sono"
              value={`${summary.avg_sleep_hours.toFixed(1)}h`}
              sub={`${summary.sleep_streak_days}d Sequência`}
              color="#3b82f6"
              bgColor="#3b82f615"
              borderColor="#3b82f625"
            />
            <MetricCard
              icon={BookOpen}
              label="Foco Diário"
              value={`${summary.avg_study_hours.toFixed(1)}h`}
              sub={`${summary.study_streak_days}d Sequência`}
              color="#8b5cf6"
              bgColor="#8b5cf615"
              borderColor="#8b5cf625"
            />
            <MetricCard
              icon={Target}
              label="Taxa de Precisão"
              value={`${summary.avg_hit_rate.toFixed(1)}%`}
              sub={`Análise: ${summary.total_days_analyzed}d`}
              color="#22c55e"
              bgColor="#22c55e15"
              borderColor="#22c55e25"
            />
            <MetricCard
              icon={Activity}
              label="Consistência"
              value={`${summary.consistency_score.toFixed(0)}%`}
              sub={`Frequência de Uso`}
              color="#0ea5e9"
              bgColor="#0ea5e915"
              borderColor="#0ea5e925"
            />
            <MetricCard
              icon={Zap}
              label="Taxa Processamento"
              value={`${summary.study_efficiency.toFixed(1)}`}
              sub={`Itens por Hora`}
              color="#f59e0b"
              bgColor="#f59e0b15"
              borderColor="#f59e0b25"
            />
            <MetricCard
              icon={Brain}
              label="Maior Retenção"
              value={summary.peak_study_subject || "N/A"}
              sub={`Volume Máximo`}
              color="#f43f5e"
              bgColor="#f43f5e15"
              borderColor="#f43f5e25"
            />
          </div>

          {/* Análises Qualitativas de Impacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <SleepImpact summary={summary} />
            <SubjectDistribution summary={summary} />
          </div>

          {/* Engine de Insights: Correlações Sazonais */}
          <CorrelationInsight summary={summary} />

          {/* Gráfico de Linha do Tempo Reativo */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-red-400/10 rounded-xl border border-red-400/20">
                <Brain className="w-5 h-5 text-red-100" />
              </div>
              <div>
                <h2 className=" font-black text-white">Cruzamento Temporal</h2>
                <p className="text-[10px] uppercase font-black text-neutral-600 mt-0.5">
                  Sono × Estudo × Acerto
                </p>
              </div>
            </div>
            <CorrelationChart metrics={metrics} />
          </div>

          {/* Matriz Bruta de Dados (Tabela) */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-neutral-800 rounded-xl border border-neutral-700">
                <BarChart3 className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <h2 className=" font-black text-white">Log de Processamento</h2>
                <p className="text-[10px] uppercase font-black text-neutral-600 mt-0.5">
                  Dados Brutos do Ciclo ({days} dias)
                </p>
              </div>
            </div>
            <CrossTable metrics={metrics} />
          </div>
        </>
      ) : (
        /* Estado Vazio: Aguardando volume de dados */
        !loading && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-20 text-center shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-neutral-950/40 border border-neutral-800/50 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <BarChart3 className="w-10 h-10 text-neutral-800" />
            </div>
            <h3 className="text-white font-black text-xl mb-3">
              Volume de Dados Insuficiente
            </h3>
            <p className="text-neutral-600  max-w-sm mx-auto leading-relaxed font-bold">
              Para gerar insights precisos, precisamos de pelo menos alguns dias
              de atividade registrada. Continue alimentando seu roteiro de
              estudos e sono!
            </p>
          </div>
        )
      )}
    </div>
  );
}
