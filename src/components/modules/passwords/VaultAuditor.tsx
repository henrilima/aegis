"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { VaultAuditReport } from "./types";

interface VaultAuditorProps {
  report: VaultAuditReport | null;
  loading: boolean;
  onRefresh: () => void;
  onEditCredential: (id: number) => void;
  openExternal: (url: string) => void;
}

export function VaultAuditor({
  report,
  loading,
  onRefresh,
  onEditCredential,
  openExternal,
}: VaultAuditorProps) {
  const [activeFilter, setActiveFilter] = useState<
    "all" | "weak" | "reused" | "old"
  >("all");

  if (loading) {
    return (
      <div className="w-full p-8 border border-border/60 rounded-2xl bg-card/30 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs font-semibold text-muted-foreground">
          Executando auditoria criptográfica de segurança...
        </span>
      </div>
    );
  }

  if (!report || report.totalCount === 0) {
    return (
      <div className="w-full p-6 border border-border/50 rounded-2xl bg-card/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-foreground">
              Auditoria de segurança
            </h4>
            <p className="text-xs text-muted-foreground">
              Adicione credenciais ao cofre para avaliar a saúde, senhas fracas
              e reutilizadas.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
        >
          Analisar agora
        </button>
      </div>
    );
  }

  const { healthScore, totalCount, weakCount, reusedCount, oldCount, entries } =
    report;

  // Filtragem dos itens auditados
  const filteredEntries = entries.filter((entry) => {
    const hasAnyIssue = entry.isWeak || entry.isReused || entry.isOld;
    if (activeFilter === "all") return hasAnyIssue;
    if (activeFilter === "weak") return entry.isWeak;
    if (activeFilter === "reused") return entry.isReused;
    if (activeFilter === "old") return entry.isOld;
    return true;
  });

  const getScoreTheme = (score: number) => {
    if (score >= 80) {
      return {
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/10",
        label: "Excelente",
        desc: "Seu cofre está com excelente nível de blindagem.",
      };
    }
    if (score >= 50) {
      return {
        text: "text-amber-400",
        border: "border-amber-500/30",
        bg: "bg-amber-500/10",
        label: "Atenção",
        desc: "Existem credenciais vulneráveis que requerem revisão.",
      };
    }
    return {
      text: "text-red-400",
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      label: "Crítico",
      desc: "Alto risco de vulnerabilidade devido a senhas fracas ou reutilizadas.",
    };
  };

  const scoreTheme = getScoreTheme(healthScore);

  return (
    <div className="w-full flex flex-col gap-4 p-5 rounded-2xl border border-border bg-card/25">
      {/* Cabeçalho do Auditor & Health Score */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-16 h-16 rounded-2xl border flex flex-col items-center justify-center shrink-0",
              scoreTheme.bg,
              scoreTheme.border,
            )}
          >
            <span
              className={cn("text-xl font-bold leading-none", scoreTheme.text)}
            >
              {healthScore}%
            </span>
            <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">
              Saúde
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Auditoria de segurança do cofre
              </h3>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  scoreTheme.bg,
                  scoreTheme.border,
                  scoreTheme.text,
                )}
              >
                {scoreTheme.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {scoreTheme.desc} Total de {totalCount}{" "}
              {totalCount === 1
                ? "credencial avaliada"
                : "credenciais avaliadas"}
              .
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reanalisar cofre
        </button>
      </div>

      {/* Cartões de Indicadores Resumidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={cn(
            "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
            activeFilter === "all"
              ? "bg-primary/10 border-primary/40 text-foreground"
              : "bg-card/40 border-border text-muted-foreground hover:bg-card/80",
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Com alertas</span>
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground mt-1">
            {weakCount + reusedCount + oldCount === 0
              ? "0"
              : weakCount + reusedCount + oldCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("weak")}
          className={cn(
            "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
            activeFilter === "weak"
              ? "bg-red-500/15 border-red-500/40 text-red-400"
              : "bg-card/40 border-border text-muted-foreground hover:bg-card/80",
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Senhas fracas</span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          </div>
          <span
            className={cn(
              "text-lg font-bold mt-1",
              weakCount > 0 ? "text-red-400" : "text-foreground",
            )}
          >
            {weakCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("reused")}
          className={cn(
            "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
            activeFilter === "reused"
              ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
              : "bg-card/40 border-border text-muted-foreground hover:bg-card/80",
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Reutilizadas</span>
            <Copy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span
            className={cn(
              "text-lg font-bold mt-1",
              reusedCount > 0 ? "text-amber-400" : "text-foreground",
            )}
          >
            {reusedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("old")}
          className={cn(
            "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
            activeFilter === "old"
              ? "bg-sky-500/15 border-sky-500/40 text-sky-400"
              : "bg-card/40 border-border text-muted-foreground hover:bg-card/80",
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Antigas (+90d)</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <span
            className={cn(
              "text-lg font-bold mt-1",
              oldCount > 0 ? "text-sky-400" : "text-foreground",
            )}
          >
            {oldCount}
          </span>
        </button>
      </div>

      {/* Lista de Credenciais com Problemas ou Estado Seguro */}
      {filteredEntries.length === 0 ? (
        <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center gap-3 text-center">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-emerald-400">
            {activeFilter === "all"
              ? "Parabéns! Todas as suas credenciais atendem aos requisitos de segurança recomendados."
              : "Nenhuma credencial encontrada para este filtro específico."}
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-semibold text-muted-foreground">
              Credenciais que requerem atenção
              <span className="ml-1.5 text-xs font-bold text-foreground">
                ({filteredEntries.length})
              </span>
            </span>
            <span className="text-xs text-muted-foreground">
              Clique em alterar para corrigir
            </span>
          </div>

          <div className="flex flex-col divide-y divide-border/50 border border-border/60 rounded-xl overflow-hidden max-h-120 overflow-y-auto custom-scrollbar">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col bg-card/40 hover:bg-card/70 transition-colors"
              >
                {/* Linha principal */}
                <div className="flex items-center gap-3 px-4 py-2.5">
                  {/* Ícone de status */}
                  <div
                    className={cn(
                      "w-1.5 h-7 rounded-full shrink-0",
                      entry.isWeak
                        ? "bg-red-500"
                        : entry.isReused
                          ? "bg-amber-500"
                          : "bg-sky-500",
                    )}
                  />

                  {/* Nome + usuário */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-sm font-semibold text-foreground truncate leading-tight">
                      {entry.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate leading-tight">
                      {entry.username || "Sem usuário"}
                      {entry.url && (
                        <button
                          type="button"
                          onClick={() => openExternal(entry.url)}
                          className="ml-2 text-primary/70 hover:text-primary hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {entry.isWeak && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                        Fraca
                      </span>
                    )}
                    {entry.isReused && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                        Reutilizada
                      </span>
                    )}
                    {entry.isOld && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400">
                        +{entry.daysSinceUpdate}d
                      </span>
                    )}
                  </div>

                  {/* Botão editar */}
                  <button
                    type="button"
                    onClick={() => onEditCredential(entry.id)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/60 text-xs font-semibold text-foreground transition-all cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    Alterar
                  </button>
                </div>

                {/* Sub-linha de motivos (só se houver) */}
                {entry.weaknessReasons.length > 0 && (
                  <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
                    {entry.weaknessReasons.map((reason, idx) => (
                      <span
                        key={`reason-${entry.id}-${idx}`}
                        className="text-[11px] text-muted-foreground flex items-center gap-1"
                      >
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                        {reason}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
