"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Heart,
  HelpCircle,
  Info,
  LayoutDashboard,
  Smile,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Habit, SoberLog } from "../types";

interface SoberDetailPanelProps {
  habit: Habit;
  onClose: () => void;
  onRefresh: () => void;
  now: Date;
}

type TriggerType =
  | "Estresse"
  | "Ansiedade"
  | "Tédio"
  | "Influência Social"
  | "Cansaço";

export function SoberDetailPanel({
  habit,
  onClose,
  onRefresh,
  now: simulatedNow,
}: SoberDetailPanelProps) {
  const [logs, setLogs] = useState<SoberLog[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"progress" | "diary">(
    "progress",
  );
  const [timeStr, setTimeStr] = useState("");
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  // Estados para nova recaída
  const [selectedTrigger, setSelectedTrigger] =
    useState<TriggerType>("Estresse");
  const [slipNotes, setSlipNotes] = useState("");
  const [isSubmittingSlip, setIsSubmittingSlip] = useState(false);

  // Estados para pacto/revisão
  const [isSubmittingPledge, setIsSubmittingPledge] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewDifficulty, setReviewDifficulty] = useState<
    "Fácil" | "Médio" | "Difícil"
  >("Fácil");
  const [reviewNotes, setReviewNotes] = useState("");

  const triggerOptions: TriggerType[] = [
    "Estresse",
    "Ansiedade",
    "Tédio",
    "Influência Social",
    "Cansaço",
  ];

  // Carrega os logs de sobriedade do backend Rust
  const fetchSoberLogs = useCallback(async () => {
    if (!habit.id) return;
    try {
      const res = await invoke<SoberLog[]>("habit_list_sober_logs", {
        habitId: habit.id,
      });
      setLogs(res);
    } catch (err) {
      console.error("Erro ao carregar logs de sobriedade:", err);
    }
  }, [habit.id]);

  useEffect(() => {
    fetchSoberLogs();
  }, [fetchSoberLogs]);

  // Formata a data de hoje local (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date(simulatedNow);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [simulatedNow]);

  // Verifica se o usuário já fez o pacto de hoje
  const hasPledgedToday = useMemo(() => {
    return logs.some((l) => l.logType === "pledge" && l.logDate === todayStr);
  }, [logs, todayStr]);

  // Verifica se o usuário já fez a revisão de hoje
  const hasReviewedToday = useMemo(() => {
    return logs.some((l) => l.logType === "review" && l.logDate === todayStr);
  }, [logs, todayStr]);

  // Atualização dinâmica do cronômetro
  useEffect(() => {
    const updateTimer = () => {
      const lastSlipTime = new Date(habit.lastSlip).getTime();
      const nowTime = Date.now();
      const diff = nowTime - lastSlipTime;

      if (diff <= 0) {
        setTimeStr("00d 00h 00m 00s");
        return;
      }

      const sec = Math.floor((diff / 1000) % 60);
      const min = Math.floor((diff / (1000 * 60)) % 60);
      const hr = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const day = Math.floor(diff / (1000 * 60 * 60 * 24));

      const dStr = String(day).padStart(2, "0");
      const hStr = String(hr).padStart(2, "0");
      const mStr = String(min).padStart(2, "0");
      const sStr = String(sec).padStart(2, "0");

      setTimeStr(`${dStr}d ${hStr}h ${mStr}m ${sStr}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [habit.lastSlip]);

  // Estatísticas de gatilhos calculados a partir das recaídas passadas
  const triggerStats = useMemo(() => {
    const relapses = logs.filter((l) => l.logType === "relapse");
    const total = relapses.length;
    if (total === 0) return [];

    const counts: Record<string, number> = {};
    for (const opt of triggerOptions) {
      counts[opt] = 0;
    }

    for (const r of relapses) {
      if (r.triggerType) {
        counts[r.triggerType] = (counts[r.triggerType] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  // Melhores sequências e conquistas simuladas baseadas em dias
  const calculatedDays = useMemo(() => {
    const lastSlipTime = new Date(habit.lastSlip).getTime();
    const nowTime = simulatedNow.getTime();
    const diff = nowTime - lastSlipTime;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }, [habit.lastSlip, simulatedNow]);

  // Envia o pacto matinal
  const handlePledge = async () => {
    if (!habit.id || isSubmittingPledge) return;
    setIsSubmittingPledge(true);
    try {
      const logPayload = {
        habitId: habit.id,
        logType: "pledge",
        timestamp: new Date().toISOString(),
        logDate: todayStr,
        notes: "Pacto de sobriedade firmado.",
      };

      await invoke("habit_add_sober_log", { log: logPayload });
      toast.success("Compromisso matinal firmado! Força para hoje!");
      fetchSoberLogs();
    } catch (err) {
      toast.error("Erro ao registrar pacto.");
      console.error(err);
    } finally {
      setIsSubmittingPledge(false);
    }
  };

  // Envia a revisão noturna
  const handleReview = async () => {
    if (!habit.id || isSubmittingReview) return;
    setIsSubmittingReview(true);
    try {
      const logPayload = {
        habitId: habit.id,
        logType: "review",
        timestamp: new Date().toISOString(),
        logDate: todayStr,
        difficulty: reviewDifficulty,
        notes: reviewNotes.trim() || undefined,
      };

      await invoke("habit_add_sober_log", { log: logPayload });
      toast.success("Revisão diária salva! Mais um dia concluído!");
      setReviewNotes("");
      fetchSoberLogs();
    } catch (err) {
      toast.error("Erro ao salvar revisão.");
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Envia o log de recaída e reseta o cronômetro
  const handleSlipSubmit = async () => {
    if (!habit.id || isSubmittingSlip) return;
    setIsSubmittingSlip(true);
    try {
      await invoke("habit_reset_with_trigger", {
        id: habit.id,
        timestamp: new Date().toISOString(),
        triggerType: selectedTrigger,
        notes: slipNotes.trim(),
      });

      toast.error(
        "Contador reiniciado. O importante é não desistir e aprender com o deslize!",
      );
      setIsSlipOpen(false);
      setSlipNotes("");
      onRefresh();
      fetchSoberLogs();
    } catch (err) {
      toast.error("Erro ao registrar recaída.");
      console.error(err);
    } finally {
      setIsSubmittingSlip(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-foreground animate-in fade-in-50 duration-200">
      {/* Barra superior de navegação / cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-border bg-card hover:bg-accent hover:text-foreground transition-all cursor-pointer flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{habit.name}</h2>
              <p className="text-xs text-muted-foreground">
                Monitoramento e Relatório de Sobriedade
              </p>
            </div>
          </div>
        </div>

        {/* Sub-abas de Navegação Interna */}
        <div className="flex gap-1.5 bg-accent/20 border border-border/40 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab("progress")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "progress"
                ? "bg-card border border-border/60 text-foreground shadow-none"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Progresso
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("diary")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "diary"
                ? "bg-card border border-border/60 text-foreground shadow-none"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Diário ({logs.length})
          </button>
        </div>
      </div>

      {activeSubTab === "diary" ? (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              Diário Completo de Sobriedade
            </h3>
            <p className="text-xs text-muted-foreground">
              Linha do tempo detalhada com seus pactos, anotações de sentimentos
              e gatilhos.
            </p>
          </div>

          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border/60 rounded-2xl bg-accent/5">
              <BookOpen className="w-12 h-12 text-muted-foreground/35 mb-3" />
              <span className="text-sm font-bold text-foreground">
                Seu diário está em branco
              </span>
              <p className="text-xs text-muted-foreground max-w-[280px] mt-1.5 leading-relaxed">
                Comece firmando seu pacto matinal ou fazendo a revisão noturna
                para registrar suas reflexões diárias.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const displayDate = dateObj.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
                const displayTime = dateObj.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={log.id}
                    className="p-5 bg-card border border-border/60 rounded-2xl space-y-3 transition-all hover:border-border select-none shadow-none"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2">
                      <span className="text-xs font-bold text-muted-foreground capitalize">
                        {displayDate} às {displayTime}
                      </span>
                      <div>
                        {log.logType === "pledge" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
                            Pacto Matinal
                          </span>
                        ) : log.logType === "review" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            Revisão Diária — {log.difficulty}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                            Recaída — Gatilho: {log.triggerType}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-foreground leading-relaxed">
                      {log.logType === "pledge" && (
                        <p className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
                          <Heart className="w-4 h-4 shrink-0 fill-current text-red-500" />
                          "Firmei meu compromisso de me manter livre e no
                          controle hoje!"
                        </p>
                      )}
                      {log.logType === "review" && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground font-semibold">
                            Nota do Dia:
                          </p>
                          <p className="italic text-foreground/80 bg-accent/5 p-3 rounded-xl border border-border/30">
                            {log.notes ||
                              "O dia foi revisado sem comentários adicionais."}
                          </p>
                        </div>
                      )}
                      {log.logType === "relapse" && (
                        <div className="space-y-2">
                          <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Relato do Deslize:
                          </p>
                          <p className="italic text-foreground/80 bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                            {log.notes ||
                              "Nenhuma nota inserida sobre o deslize."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Grid Principal de Conteúdo (Duas Colunas) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna da Esquerda (Pacto, Cronômetro, Relapse) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Painel do Cronômetro */}
            <div className="bg-accent/10 border border-border/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-500" />
                Tempo de Sobriedade Ativo
              </span>
              <div className="text-4xl font-extrabold font-mono text-foreground tabular-nums select-all mt-1">
                {timeStr || "Carregando..."}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Desde o último deslize em{" "}
                {new Date(habit.lastSlip).toLocaleString()}
              </div>
            </div>

            {/* Pacto & Revisão Diária */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box Pacto Matinal */}
              <div className="p-5 border border-border/60 bg-card rounded-2xl flex flex-col gap-3 justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5" />
                    1. Pacto Matinal
                  </span>
                  <h4 className="text-sm font-bold text-foreground">
                    Compromisso do Dia
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Firme a sua intenção de ficar sóbrio esta manhã para guiar
                    seu dia com disciplina.
                  </p>
                </div>

                {hasPledgedToday ? (
                  <div className="py-2.5 px-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Pacto firmado para hoje!
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handlePledge}
                    disabled={isSubmittingPledge}
                    className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Smile className="w-4 h-4" />
                    Firmar Pacto Matinal
                  </button>
                )}
              </div>

              {/* Box Revisão Noturna */}
              <div className="p-5 border border-border/60 bg-card rounded-2xl flex flex-col gap-3 justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    2. Revisão Noturna
                  </span>
                  <h4 className="text-sm font-bold text-foreground">
                    Fechamento do Dia
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Avalie o dia e anote reflexões sobre suas emoções e
                    conquistas.
                  </p>
                </div>

                {hasReviewedToday ? (
                  <div className="py-2.5 px-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Dia revisado e registrado!
                  </div>
                ) : !hasPledgedToday ? (
                  <div className="py-2.5 px-3.5 bg-muted border border-border text-muted-foreground rounded-xl text-[11px] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    Faça o pacto matinal primeiro para poder revisar à noite.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex gap-2">
                      {(["Fácil", "Médio", "Difícil"] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setReviewDifficulty(diff)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                            reviewDifficulty === diff
                              ? "bg-red-500 text-white border-red-600"
                              : "bg-background border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Nota rápida/sentimento..."
                      className="w-full text-xs bg-background border border-border rounded-lg p-2 focus:outline-none focus:border-red-500/30 text-foreground"
                    />
                    <button
                      type="button"
                      onClick={handleReview}
                      disabled={isSubmittingReview}
                      className="w-full py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Salvar Revisão
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Deslizamento / Recaída */}
            <div className="border border-border/60 bg-card rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Teve um deslizamento?
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Registrar falhas nos ajuda a mapear os piores gatilhos de
                    recaída.
                  </p>
                </div>
                {!isSlipOpen && (
                  <button
                    type="button"
                    onClick={() => setIsSlipOpen(true)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-xl border border-red-500/20 transition-all cursor-pointer"
                  >
                    Registrar Deslize
                  </button>
                )}
              </div>

              {isSlipOpen && (
                <div className="mt-2 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-foreground">
                      Qual foi o gatilho principal?
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {triggerOptions.map((trig) => (
                        <button
                          key={trig}
                          type="button"
                          onClick={() => setSelectedTrigger(trig)}
                          className={`py-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                            selectedTrigger === trig
                              ? "bg-red-500 text-white border-red-600"
                              : "bg-background border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {trig}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-foreground">
                      Notas sobre o deslize
                    </span>
                    <textarea
                      rows={2}
                      value={slipNotes}
                      onChange={(e) => setSlipNotes(e.target.value)}
                      placeholder="O que aconteceu? O que você aprendeu com isso?"
                      className="w-full text-xs bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-red-500/30 text-foreground resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsSlipOpen(false)}
                      className="px-3.5 py-2 text-xs font-bold bg-background border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSlipSubmit}
                      disabled={isSubmittingSlip}
                      className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all cursor-pointer"
                    >
                      Confirmar e Reiniciar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna da Direita (Mapeamento de Gatilhos, Conquistas, Histórico) */}
          <div className="space-y-6">
            {/* Box de Estabilidade e Recordes */}
            <div className="p-5 border border-border/60 rounded-2xl flex flex-col gap-4 bg-accent/5">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-red-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Estabilidade
                </span>
                <h4 className="text-sm font-bold text-foreground">
                  Registros de Progresso
                </h4>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Abstinência Atual
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {calculatedDays} dias
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Recorde Histórico
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {habit.maxStreak} dias
                  </span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Meta de Abstinência
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {habit.goalDays && habit.goalDays > 0
                      ? `${habit.goalDays} dias`
                      : "Sem limite"}
                  </span>
                </div>
              </div>
            </div>

            {/* Box Mapeamento de Gatilhos */}
            <div className="p-5 border border-border/60 rounded-2xl flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-red-500" />
                  Gatilhos de Recaída
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium">
                  Autoanálise das recaídas anteriores
                </p>
              </div>

              {triggerStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/60 rounded-xl bg-accent/5">
                  <HelpCircle className="w-8 h-8 text-muted-foreground/45 mb-1.5" />
                  <span className="text-xs font-bold text-foreground">
                    Sem dados suficientes
                  </span>
                  <p className="text-[10px] text-muted-foreground max-w-[200px] mt-0.5 leading-relaxed">
                    Nenhum deslize registrado até agora. Continue forte!
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {triggerStats.map((stat) => (
                    <div key={stat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold leading-none">
                        <span className="text-foreground">{stat.name}</span>
                        <span className="text-muted-foreground font-mono">
                          {stat.percentage}% ({stat.count})
                        </span>
                      </div>
                      <div className="h-2 w-full bg-accent/20 border border-border/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-1000"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
