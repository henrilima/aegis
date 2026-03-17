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
import { EmptyState } from "@/components/ui/EmptyState";
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

  // Busca métricas consolidadas do backend
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
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse font-bold">
          <BarChart3 className="w-4 h-4" />
          <span>Processando Matriz de Dados...</span>
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-white px-1">
      {/* Cabeçalho */}
      <StatisticsHeader days={days} onDaysChange={setDays} />

      {summary && summary.total_days_analyzed > 0 ? (
        <>
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              icon={Moon}
              label="Eficiência Sono"
              value={`${summary.avg_sleep_hours.toFixed(1)}h`}
              sub={`${summary.sleep_streak_days}d Sequência`}
              color="#3b82f6"
              bgColor="#3b82f615"
              borderColor="#3b82f625"
              tooltip="Média de horas dormidas por noite e sequência de dias com registros de sono."
            />
            <MetricCard
              icon={BookOpen}
              label="Foco Diário"
              value={`${summary.avg_study_hours.toFixed(1)}h`}
              sub={`${summary.study_streak_days}d Sequência`}
              color="#8b5cf6"
              bgColor="#8b5cf615"
              borderColor="#8b5cf625"
              tooltip="Média de horas estudadas por dia e sequência de dias com registros de estudo."
            />
            <MetricCard
              icon={Target}
              label="Taxa de Precisão"
              value={`${summary.avg_hit_rate.toFixed(1)}%`}
              sub={`Análise: ${summary.total_days_analyzed}d`}
              color="#22c55e"
              bgColor="#22c55e15"
              borderColor="#22c55e25"
              tooltip="Porcentagem média de acertos em questões durante as sessões de estudo."
            />
            <MetricCard
              icon={Activity}
              label="Consistência"
              value={`${summary.consistency_score.toFixed(0)}%`}
              sub={`Frequência de Uso`}
              color="#0ea5e9"
              bgColor="#0ea5e915"
              borderColor="#0ea5e925"
              tooltip="Frequência com que o aplicativo é utilizado para registrar dados no período analisado."
            />
            <MetricCard
              icon={Zap}
              label="Eficiência"
              value={`${summary.study_efficiency.toFixed(1)}`}
              sub={`Itens por Hora`}
              color="#f59e0b"
              bgColor="#f59e0b15"
              borderColor="#f59e0b25"
              tooltip="Quantidade média de questões/itens processados por hora de estudo."
            />
            <MetricCard
              icon={Brain}
              label="Foco/Energia"
              value={`${summary.avg_focus_score.toFixed(1)}`}
              sub={`Nível Médio`}
              color="#f43f5e"
              bgColor="#f43f5e15"
              borderColor="#f43f5e25"
              tooltip="Avaliação média do seu nível de foco e energia durante as sessões de estudo (1 a 5)."
            />
          </div>

          {/* Impacto e Distribuição */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <SleepImpact summary={summary} />
            <SubjectDistribution summary={summary} />
          </div>

          {/* Insights de Correlação */}
          <CorrelationInsight summary={summary} />

          {/* Gráfico Temporal */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-red-400/10 rounded-xl border border-red-400/20">
                <Brain className="w-5 h-5 text-red-100" />
              </div>
              <div>
                <h2 className="font-bold text-white">Cruzamento Temporal</h2>
                <p className="text-[10px] font-bold text-neutral-600 mt-0.5">
                  Sono · Estudo · Acerto
                </p>
              </div>
            </div>
            <CorrelationChart metrics={metrics} />
          </div>

          {/* Dados Brutos */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-neutral-800 rounded-xl border border-neutral-700">
                <BarChart3 className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">Log de Processamento</h2>
                <p className="text-[10px] font-bold text-neutral-600 mt-0.5">
                  Dados Brutos (Últimos {days} dias)
                </p>
              </div>
            </div>
            <CrossTable metrics={metrics} />
          </div>
        </>
      ) : (
        /* Sem dados suficientes */
        !loading && (
          <EmptyState
            icon={BarChart3}
            title="Volume de Dados Insuficiente"
            description="Para gerar insights precisos, precisamos de pelo menos alguns dias de atividade registrada. Continue alimentando seu roteiro de estudos e sono!"
          />
        )
      )}
    </div>
  );
}
