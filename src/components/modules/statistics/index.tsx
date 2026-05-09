"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  HelpCircle,
  Moon,
  Target,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { getModuleColor } from "@/modules.config";
import { CorrelationChart } from "./components/correlationChart";
import { CorrelationInsight } from "./components/correlationInsight";
import { CrossTable } from "./components/crossTable";
import { MetricCard } from "./components/metricCard";
import { StatisticsInfoModal } from "./components/StatisticsInfoModal";
import { SleepImpact } from "./components/sleepImpact";
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
  const [showInfo, setShowInfo] = useState(false);

  // Busca métricas consolidadas do backend
  const loadStats = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [m, s] = await Promise.all([
        invoke<CrossMetric[]>("stats_get_cross_metrics", {
          userId: uid,
          days,
        }),
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
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse font-bold">
          <BarChart3 className="w-4 h-4" />
          <span>Processando Matriz de Dados...</span>
        </div>
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-foreground px-1">
      {/* Cabeçalho */}
      <ModuleHeader
        color={getModuleColor("statistics")}
        title="Estatísticas"
        subtitle="Cruzamento inteligente de dados para análise de performance"
        icon={BarChart3}
        tabs={[
          { id: "7", label: "7d" },
          { id: "14", label: "14d" },
          { id: "30", label: "30d" },
          { id: "60", label: "60d" },
          { id: "90", label: "90d" },
        ]}
        activeTab={String(days)}
        onTabChange={(id) => {
          const n = Number(id);
          if (!Number.isNaN(n) && n > 0) setDays(n);
        }}
        actions={[
          {
            id: "info",
            label: "Guia",
            icon: HelpCircle,
            tooltip: "Guia do Módulo",
            onClick: () => setShowInfo(true),
          },
        ]}
      />

      <StatisticsInfoModal show={showInfo} onClose={() => setShowInfo(false)} />

      {summary && summary.totalDaysAnalyzed > 0 ? (
        <>
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <MetricCard
              icon={Moon}
              label="Eficiência Sono"
              value={`${summary.avgSleepHours.toFixed(1)}h`}
              sub={`${summary.sleepStreakDays}d Sequência`}
              color="#3b82f6"
              bgColor="#3b82f615"
              borderColor="#3b82f625"
              tooltip="Média de horas dormidas por noite e sequência de dias com registros de sono."
            />
            <MetricCard
              icon={BookOpen}
              label="Foco Diário"
              value={`${summary.avgStudyHours.toFixed(1)}h`}
              sub={`${summary.studyStreakDays}d Sequência`}
              color="#8b5cf6"
              bgColor="#8b5cf615"
              borderColor="#8b5cf625"
              tooltip="Média de horas estudadas por dia e sequência de dias com registros de estudo."
            />
            <MetricCard
              icon={Target}
              label="Taxa de Precisão"
              value={`${summary.avgHitRate.toFixed(1)}%`}
              sub={`Análise: ${summary.totalDaysAnalyzed}d`}
              color="#22c55e"
              bgColor="#22c55e15"
              borderColor="#22c55e25"
              tooltip="Porcentagem média de acertos em questões durante as sessões de estudo."
            />
            <MetricCard
              icon={Activity}
              label="Consistência"
              value={`${summary.consistencyScore.toFixed(0)}%`}
              sub={`Frequência de Uso`}
              color="#0ea5e9"
              bgColor="#0ea5e915"
              borderColor="#0ea5e925"
              tooltip="Frequência com que o aplicativo é utilizado para registrar dados no período analisado."
            />
            <MetricCard
              icon={Zap}
              label="Eficiência"
              value={`${summary.studyEfficiency.toFixed(1)}`}
              sub={`Itens por Hora`}
              color="#f59e0b"
              bgColor="#f59e0b15"
              borderColor="#f59e0b25"
              tooltip="Quantidade média de questões/itens processados por hora de estudo."
            />
            <MetricCard
              icon={Brain}
              label="Foco/Energia"
              value={`${summary.avgFocusScore.toFixed(1)}`}
              sub={`Nível Médio`}
              color="#f43f5e"
              bgColor="#f43f5e15"
              borderColor="#f43f5e25"
              tooltip="Avaliação média do seu nível de foco e energia durante as sessões de estudo (1 a 5)."
            />
            <MetricCard
              icon={BookOpen}
              label="Páginas Lidas"
              value={`${summary.avgReadingPages.toFixed(0)}`}
              sub={`${summary.avgPpm.toFixed(1)} PPM · ${summary.readingStreakDays}d`}
              color="#f97316"
              bgColor="#f9731615"
              borderColor="#f9731625"
              tooltip="Média de páginas lidas por dia, ritmo médio (PPM) e sequência de dias com registros de leitura."
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
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-red-400/10 rounded-xl border border-red-400/20">
                <Brain className="w-5 h-5 text-red-100" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">
                  Cruzamento Temporal
                </h2>
                <p className="text-[10px] font-bold text-neutral-600 mt-0.5">
                  Sono · Estudo · Leitura · Acerto
                </p>
              </div>
            </div>
            <CorrelationChart metrics={metrics} />
          </div>

          {/* Dados Brutos */}
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-neutral-800 rounded-xl border border-border">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">
                  Log de Processamento
                </h2>
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
