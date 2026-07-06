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
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { CorrelationChart } from "./components/correlationChart";
import { CorrelationInsight } from "./components/correlationInsight";
import { CrossTable } from "./components/crossTable";
import { MetricCard } from "./components/metricCard";
import { PeriodComparison } from "./components/periodComparison";
import { PeriodOverview } from "./components/periodOverview";
import { SleepImpact } from "./components/sleepImpact";
import { StatisticsGuide } from "./components/statisticsGuide";
import { SubjectDistribution } from "./components/subjectDistribution";
import type { CrossMetric, PerformanceSummary } from "./types";

const PERIODS = [
  { id: 7, label: "7d" },
  { id: 14, label: "14d" },
  { id: 30, label: "30d" },
  { id: 60, label: "60d" },
  { id: 90, label: "90d" },
];

export default function StatisticsPage() {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";
  const theme = getColorTheme(getModuleColor("statistics"));

  // Abas e filtros do módulo de estatísticas
  const [activeTab, setActiveTab] = useState<
    "overview" | "comparison" | "guide"
  >("overview");
  const [activeSources, setActiveSources] = useState<string[]>([
    "estudos",
    "sono",
    "leitura",
    "foco",
  ]);
  const [days, setDays] = useState(30);

  const [metrics, setMetrics] = useState<CrossMetric[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      // No comparativo buscamos o dobro de dias para calcular a relação com o período anterior
      const queryDays = activeTab === "comparison" ? days * 2 : days;
      const [m, s] = await Promise.all([
        invoke<CrossMetric[]>("stats_get_cross_metrics", {
          userId: uid,
          days: queryDays,
        }),
        invoke<PerformanceSummary>("stats_get_performance_summary", {
          userId: uid,
          days: days, // O resumo atual foca apenas no período de dias selecionado
        }),
      ]);
      setMetrics(m);
      setSummary(s);
    } catch {
      toast.error("Falha ao processar estatísticas.");
    } finally {
      setLoading(false);
    }
  }, [uid, days, activeTab]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const toggleSource = (source: string) => {
    setActiveSources((prev) => {
      if (prev.includes(source)) {
        if (prev.length === 1) return prev; // Mantém ao menos uma fonte selecionada
        return prev.filter((s) => s !== source);
      }
      return [...prev, source];
    });
  };

  const sourceOptions = [
    {
      id: "estudos",
      label: "Estudos",
      icon: BookOpen,
      activeColorClass:
        "text-violet-600 dark:text-violet-400 border-violet-500/30 bg-violet-500/10",
    },
    {
      id: "sono",
      label: "Sono",
      icon: Moon,
      activeColorClass:
        "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10",
    },
    {
      id: "leitura",
      label: "Leitura",
      icon: Target,
      activeColorClass:
        "text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-500/10",
    },
    {
      id: "foco",
      label: "Foco",
      icon: Brain,
      activeColorClass:
        "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10",
    },
  ];

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

  // Define se os blocos de correlação cruzada devem aparecer
  const showCrossInsights =
    activeSources.includes("estudos") && activeSources.includes("sono");

  return (
    <div className="w-full h-full flex flex-col gap-5 pb-12 animate-in fade-in duration-700 text-foreground px-1">
      <ModuleHeader
        color={getModuleColor("statistics")}
        title="Estatísticas"
        subtitle="Leitura cruzada de estudo, sono, foco e leitura"
        icon={BarChart3}
        tabs={[
          { id: "overview", label: "Visão geral", icon: BarChart3 },
          { id: "comparison", label: "Comparativo", icon: Activity },
          { id: "guide", label: "Guia", icon: HelpCircle },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as typeof activeTab)}
      />

      {summary && summary.totalDaysAnalyzed > 0 ? (
        <>
          {/* Barra de Controles - Exibida apenas nas abas de dados ativos */}
          {activeTab !== "guide" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/20 pb-4">
              {/* Filtros de Fontes de Dados */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Fontes:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sourceOptions.map((opt) => {
                    const isActive = activeSources.includes(opt.id);
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleSource(opt.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                          isActive
                            ? opt.activeColorClass
                            : "text-muted-foreground border-border bg-card/40 hover:bg-accent/40",
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seletor de Dias/Período */}
              <div className="flex items-center gap-1 bg-accent/30 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
                {PERIODS.map((p) => {
                  const isActive = days === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDays(p.id)}
                      className={cn(
                        "text-xs font-bold px-3 py-1.5 rounded-lg transition-all border",
                        isActive
                          ? `${theme.bg} ${theme.text} ${theme.border}`
                          : "text-muted-foreground hover:text-foreground bg-transparent border-transparent",
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "overview" ? (
            <>
              <PeriodOverview days={days} metrics={metrics} summary={summary} />

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <MetricCard
                  icon={Gauge}
                  label="Precisão média"
                  value={`${summary.avgHitRate.toFixed(1)}%`}
                  sub={`${summary.studyEfficiency.toFixed(1)} itens por hora`}
                  color="#22c55e"
                  bgColor="#22c55e15"
                  borderColor="#22c55e25"
                  tooltip="Porcentagem média de acertos e ritmo de resolução por hora estudada."
                  inactive={!activeSources.includes("estudos")}
                  inactiveMessage="Ative Estudos para visualizar"
                />

                <MetricCard
                  icon={Activity}
                  label="Consistência"
                  value={`${summary.consistencyScore.toFixed(0)}%`}
                  sub={`${summary.totalDaysAnalyzed} dias analisados`}
                  color="#0ea5e9"
                  bgColor="#0ea5e915"
                  borderColor="#0ea5e925"
                  tooltip="Frequência com que houve registro útil no período selecionado."
                />

                <MetricCard
                  icon={Moon}
                  label="Sono médio"
                  value={`${summary.avgSleepHours.toFixed(1)}h`}
                  sub={`${summary.sleepStreakDays}d de sequência`}
                  color="#3b82f6"
                  bgColor="#3b82f615"
                  borderColor="#3b82f625"
                  tooltip="Média de horas dormidas por noite e sequência de dias com registros de sono."
                  inactive={!activeSources.includes("sono")}
                  inactiveMessage="Ative Sono para visualizar"
                />

                <MetricCard
                  icon={Brain}
                  label="Foco médio"
                  value={`${summary.avgFocusScore.toFixed(1)}`}
                  sub={`${summary.focusHitRateHigh.toFixed(1)}% em dias fortes`}
                  color="#f43f5e"
                  bgColor="#f43f5e15"
                  borderColor="#f43f5e25"
                  tooltip="Média do foco registrado e taxa de acerto quando o foco ficou alto."
                  inactive={!activeSources.includes("foco")}
                  inactiveMessage="Ative Foco para visualizar"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MetricCard
                    icon={BookOpen}
                    label="Estudo diário"
                    value={`${summary.avgStudyHours.toFixed(1)}h`}
                    sub={`${summary.studyStreakDays}d de sequência`}
                    color="#8b5cf6"
                    bgColor="#8b5cf615"
                    borderColor="#8b5cf625"
                    tooltip="Média de horas estudadas por dia e sequência de dias com registros."
                    inactive={!activeSources.includes("estudos")}
                    inactiveMessage="Ative Estudos para visualizar"
                  />
                  <MetricCard
                    icon={Target}
                    label="Leitura diário"
                    value={`${summary.avgReadingPages.toFixed(0)}p`}
                    sub={`${summary.avgReadingMinutes.toFixed(0)} min/dia`}
                    color="#f97316"
                    bgColor="#f9731615"
                    borderColor="#f9731625"
                    tooltip="Média de páginas e minutos de leitura por dia no período."
                    inactive={!activeSources.includes("leitura")}
                    inactiveMessage="Ative Leitura para visualizar"
                  />
                </div>

                {showCrossInsights ? (
                  <CorrelationInsight summary={summary} />
                ) : (
                  <div className="p-5 bg-card/30 border border-border rounded-xl flex items-center justify-center text-center text-xs text-muted-foreground italic font-medium">
                    Ative Estudos e Sono para reativar correlações e insights de
                    foco.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
                {showCrossInsights ? (
                  <SleepImpact summary={summary} />
                ) : (
                  <div className="p-5 bg-card/30 border border-border rounded-xl flex items-center justify-center text-center text-xs text-muted-foreground italic font-medium">
                    Impacto do sono requer Estudos e Sono ativos.
                  </div>
                )}

                {activeSources.includes("estudos") ? (
                  <SubjectDistribution summary={summary} />
                ) : (
                  <div className="p-5 bg-card/30 border border-border rounded-xl flex items-center justify-center text-center text-xs text-muted-foreground italic font-medium">
                    Distribuição por matéria requer Estudos ativo.
                  </div>
                )}
              </div>

              {/* Mapa temporal de métricas */}
              <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-400/10 rounded-xl border border-red-400/20">
                      <Brain className="w-5 h-5 text-red-100" />
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground">
                        Mapa temporal
                      </h2>
                      <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                        Tendência cronológica de comportamento
                      </p>
                    </div>
                  </div>
                  <span className="hidden sm:inline-flex text-[10px] font-bold text-muted-foreground border border-border rounded-lg px-3 py-1.5">
                    Últimos {Math.min(metrics.length, 30)} pontos
                  </span>
                </div>
                <CorrelationChart
                  metrics={metrics}
                  activeSources={activeSources}
                />
              </div>

              {/* Tabela detalhada */}
              <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-neutral-800 rounded-xl border border-border">
                      <BarChart3 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground">
                        Diário de métricas
                      </h2>
                      <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                        Últimos registros do período selecionado
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Base bruta
                  </div>
                </div>
                <CrossTable metrics={metrics} activeSources={activeSources} />
              </div>
            </>
          ) : activeTab === "comparison" ? (
            <PeriodComparison
              metrics={metrics}
              days={days}
              activeSources={activeSources}
            />
          ) : (
            <StatisticsGuide />
          )}
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
