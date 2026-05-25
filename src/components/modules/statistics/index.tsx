"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  Gauge,
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
import { PeriodOverview } from "./components/periodOverview";
import { StatisticsInfoModal } from "./components/StatisticsInfoModal";
import { SleepImpact } from "./components/sleepImpact";
import { SubjectDistribution } from "./components/subjectDistribution";
import type { CrossMetric, PerformanceSummary } from "./types";

export default function StatisticsPage() {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";
  const [days, setDays] = useState(30);
  const [metrics, setMetrics] = useState<CrossMetric[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

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
      toast.error("Falha ao processar estatisticas.");
    } finally {
      setLoading(false);
    }
  }, [uid, days]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse font-bold">
          <BarChart3 className="w-4 h-4" />
          <span>Processando dados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-5 pb-12 animate-in fade-in duration-700 text-foreground px-1">
      <ModuleHeader
        color={getModuleColor("statistics")}
        title="Estatisticas"
        subtitle="Leitura cruzada de estudo, sono, foco e leitura"
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
            tooltip: "Guia do modulo",
            onClick: () => setShowInfo(true),
          },
        ]}
      />

      <StatisticsInfoModal show={showInfo} onClose={() => setShowInfo(false)} />

      {summary && summary.totalDaysAnalyzed > 0 ? (
        <>
          <PeriodOverview days={days} metrics={metrics} summary={summary} />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricCard
              icon={Gauge}
              label="Precisao media"
              value={`${summary.avgHitRate.toFixed(1)}%`}
              sub={`${summary.studyEfficiency.toFixed(1)} itens por hora`}
              color="#22c55e"
              bgColor="#22c55e15"
              borderColor="#22c55e25"
              tooltip="Porcentagem media de acertos e ritmo de resolucao por hora estudada."
            />
            <MetricCard
              icon={Activity}
              label="Consistencia"
              value={`${summary.consistencyScore.toFixed(0)}%`}
              sub={`${summary.totalDaysAnalyzed} dias analisados`}
              color="#0ea5e9"
              bgColor="#0ea5e915"
              borderColor="#0ea5e925"
              tooltip="Frequencia com que houve registro util no periodo selecionado."
            />
            <MetricCard
              icon={Moon}
              label="Sono medio"
              value={`${summary.avgSleepHours.toFixed(1)}h`}
              sub={`${summary.sleepStreakDays}d de sequencia`}
              color="#3b82f6"
              bgColor="#3b82f615"
              borderColor="#3b82f625"
              tooltip="Media de horas dormidas por noite e sequencia de dias com registros de sono."
            />
            <MetricCard
              icon={Brain}
              label="Foco medio"
              value={`${summary.avgFocusScore.toFixed(1)}`}
              sub={`${summary.focusHitRateHigh.toFixed(1)}% em dias fortes`}
              color="#f43f5e"
              bgColor="#f43f5e15"
              borderColor="#f43f5e25"
              tooltip="Media do foco registrado e taxa de acerto quando o foco ficou alto."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MetricCard
                icon={BookOpen}
                label="Estudo diario"
                value={`${summary.avgStudyHours.toFixed(1)}h`}
                sub={`${summary.studyStreakDays}d de sequencia`}
                color="#8b5cf6"
                bgColor="#8b5cf615"
                borderColor="#8b5cf625"
                tooltip="Media de horas estudadas por dia e sequencia de dias com registros."
              />
              <MetricCard
                icon={Target}
                label="Leitura diaria"
                value={`${summary.avgReadingPages.toFixed(0)}p`}
                sub={`${summary.avgReadingMinutes.toFixed(0)} min/dia`}
                color="#f97316"
                bgColor="#f9731615"
                borderColor="#f9731625"
                tooltip="Media de paginas e minutos de leitura por dia no periodo."
              />
            </div>

            <CorrelationInsight summary={summary} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
            <SleepImpact summary={summary} />
            <SubjectDistribution summary={summary} />
          </div>

          <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-400/10 rounded-xl border border-red-400/20">
                  <Brain className="w-5 h-5 text-red-100" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Mapa temporal</h2>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                    Sono, estudo, leitura e acerto normalizados
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex text-[10px] font-bold text-muted-foreground border border-border rounded-lg px-3 py-1.5">
                ultimos {Math.min(metrics.length, 30)} pontos
              </span>
            </div>
            <CorrelationChart metrics={metrics} />
          </div>

          <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-800 rounded-xl border border-border">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">
                    Diario de metricas
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                    Ultimos registros do periodo selecionado
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Base bruta
              </div>
            </div>
            <CrossTable metrics={metrics} />
          </div>
        </>
      ) : (
        <EmptyState
          icon={BarChart3}
          title="Volume de dados insuficiente"
          description="Para gerar insights precisos, precisamos de alguns dias de atividade registrada. Continue alimentando estudos, sono e leitura."
        />
      )}
    </div>
  );
}
