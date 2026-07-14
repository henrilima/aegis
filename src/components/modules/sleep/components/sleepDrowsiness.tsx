"use client";

import { AlertTriangle, Moon, Sun, Zap } from "lucide-react";
import { useMemo } from "react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { SleepEntry } from "../types";

interface SleepDrowsinessProps {
  entries: SleepEntry[];
  now: Date;
}

interface DrowsinessWindow {
  startHour: number;
  endHour: number;
  label: string;
  type: "alerta" | "pico" | "neutro";
  description: string;
}

// Converte "HH:MM" em horas decimais (ex: "07:30" -> 7.5)
function timeToDecimalHours(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

// Formata hora decimal em "HH:MM"
function formatDecimalHour(h: number): string {
  const normalized = ((h % 24) + 24) % 24;
  const hours = Math.floor(normalized);
  const mins = Math.round((normalized - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Aba de Sonolência: estima janelas de baixa energia com base nos ciclos históricos do usuário
 */
export function SleepDrowsiness({ entries, now }: SleepDrowsinessProps) {
  const color = getModuleColor("sleep");
  const theme = getColorTheme(color);

  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Calcula médias dos últimos 14 registros
  const recent = useMemo(() => entries.slice(0, 14), [entries]);

  const avgWakeHour = useMemo(() => {
    if (!recent.length) return 7; // padrão: 7h
    const sum = recent.reduce((acc, e) => acc + timeToDecimalHours(e.wakeTime), 0);
    return sum / recent.length;
  }, [recent]);

  const avgBedHour = useMemo(() => {
    if (!recent.length) return 23; // padrão: 23h
    const sum = recent.reduce((acc, e) => {
      let h = timeToDecimalHours(e.bedtime);
      // Normaliza horários noturnos (ex: 22h, 23h, 0h, 1h)
      if (h < 12) h += 24;
      return acc + h;
    }, 0);
    return (sum / recent.length) % 24;
  }, [recent]);

  const avgSleepHours = useMemo(() => {
    if (!recent.length) return 7.5;
    const sum = recent.reduce((acc, e) => acc + e.durationMinutes / 60, 0);
    return sum / recent.length;
  }, [recent]);

  // Janelas de sonolência baseadas no ritmo circadiano individual
  const drowsinessWindows = useMemo((): DrowsinessWindow[] => {
    const windows: DrowsinessWindow[] = [];

    // 1. Pico matinal de alerta: ~2h após acordar
    const morningPeakStart = avgWakeHour + 1.5;
    const morningPeakEnd = avgWakeHour + 4;
    windows.push({
      startHour: morningPeakStart,
      endHour: morningPeakEnd,
      label: "Pico matinal",
      type: "pico",
      description: `Janela de alta concentração após acordar. Ideal para tarefas que exigem foco intenso.`,
    });

    // 2. Queda pós-almoço (sonolência circadiana): ~7-8h após acordar
    const afternoonDipStart = avgWakeHour + 6.5;
    const afternoonDipEnd = avgWakeHour + 8.5;
    windows.push({
      startHour: afternoonDipStart,
      endHour: afternoonDipEnd,
      label: "Vale circadiano",
      type: "alerta",
      description: `Queda natural de energia do ritmo circadiano. Cochilo de 20 min pode restaurar o foco.`,
    });

    // 3. Segundo pico de alerta: ~9-11h após acordar
    const eveningPeakStart = avgWakeHour + 9;
    const eveningPeakEnd = avgWakeHour + 11;
    windows.push({
      startHour: eveningPeakStart,
      endHour: eveningPeakEnd,
      label: "Pico vespertino",
      type: "pico",
      description: `Segundo pico de alerta do dia. Bom momento para criatividade e resolução de problemas.`,
    });

    // 4. Pressão de sono pré-dormir: ~2h antes da hora de deitar
    const preSleepStart = avgBedHour < 12 ? avgBedHour + 24 - 2 : avgBedHour - 2;
    const preSleepEnd = avgBedHour < 12 ? avgBedHour + 24 : avgBedHour;
    windows.push({
      startHour: preSleepStart % 24,
      endHour: preSleepEnd % 24,
      label: "Pressão de sono",
      type: "alerta",
      description: `Aumento natural da pressão de sono. Evite estimulantes e prefira atividades relaxantes.`,
    });

    return windows;
  }, [avgWakeHour, avgBedHour]);

  // Posição da hora atual na linha do tempo (0h-24h)
  const timelinePositionPct = (currentHour / 24) * 100;

  // Janela mais próxima do horário atual
  const upcomingWindow = useMemo(() => {
    const upcoming = drowsinessWindows
      .map((w) => {
        const start = w.startHour;
        const diff = start > currentHour ? start - currentHour : start + 24 - currentHour;
        return { ...w, hoursUntil: diff };
      })
      .filter((w) => w.hoursUntil > 0 && w.hoursUntil < 6)
      .sort((a, b) => a.hoursUntil - b.hoursUntil);
    return upcoming[0] ?? null;
  }, [drowsinessWindows, currentHour]);

  // Janela atual (se estiver dentro)
  const currentWindow = useMemo(() => {
    return drowsinessWindows.find((w) => {
      const start = w.startHour;
      let end = w.endHour;
      // Normaliza para comparação
      if (end < start) end += 24;
      const cur = currentHour < start ? currentHour + 24 : currentHour;
      return cur >= start && cur < end;
    }) ?? null;
  }, [drowsinessWindows, currentHour]);

  const hasData = recent.length >= 3;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-base font-bold text-foreground">Janelas de Energia</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Estimativas baseadas nos seus {recent.length} registros mais recentes de sono.
        </p>
      </div>

      {!hasData && (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/60 rounded-xl bg-muted/10">
          <Moon className="w-6 h-6 text-muted-foreground/30 mb-2 stroke-[1.5]" />
          <p className="text-sm font-bold text-foreground">Dados insuficientes</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Registre pelo menos 3 noites de sono para gerar estimativas personalizadas de sonolência.
          </p>
        </div>
      )}

      {hasData && (
        <>
          {/* Resumo do ritmo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-0.5 p-4 bg-card border border-border rounded-xl">
              <span className="text-[10px] font-bold text-muted-foreground">Acordar (média)</span>
              <span className={cn("text-xl font-bold", theme.text)}>{formatDecimalHour(avgWakeHour)}</span>
            </div>
            <div className="flex flex-col gap-0.5 p-4 bg-card border border-border rounded-xl">
              <span className="text-[10px] font-bold text-muted-foreground">Sono médio</span>
              <span className={cn("text-xl font-bold", theme.text)}>{avgSleepHours.toFixed(1)}h</span>
            </div>
            <div className="flex flex-col gap-0.5 p-4 bg-card border border-border rounded-xl">
              <span className="text-[10px] font-bold text-muted-foreground">Deitar (média)</span>
              <span className={cn("text-xl font-bold", theme.text)}>{formatDecimalHour(avgBedHour)}</span>
            </div>
          </div>

          {/* Status atual */}
          {(currentWindow || upcomingWindow) && (
            <div
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border",
                currentWindow?.type === "alerta"
                  ? "bg-amber-500/8 border-amber-500/20"
                  : currentWindow?.type === "pico"
                    ? "bg-emerald-500/8 border-emerald-500/20"
                    : "bg-muted/10 border-border/60",
              )}
            >
              {currentWindow?.type === "alerta" ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              ) : currentWindow?.type === "pico" ? (
                <Zap className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-foreground">
                  {currentWindow
                    ? `Agora: ${currentWindow.label}`
                    : `Em ${Math.round((upcomingWindow?.hoursUntil ?? 0) * 60)}min: ${upcomingWindow?.label}`}
                </span>
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  {currentWindow?.description ?? upcomingWindow?.description}
                </span>
              </div>
            </div>
          )}

          {/* Linha do tempo */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-muted-foreground">Linha do tempo do dia</span>

            {/* Barra de 24h */}
            <div className="relative h-8 bg-muted/30 rounded-full border border-border/50 overflow-hidden">
              {/* Janelas coloridas */}
              {drowsinessWindows.map((w) => {
                const startPct = (w.startHour / 24) * 100;
                const widthPct = ((w.endHour - w.startHour + 24) % 24 / 24) * 100;
                return (
                  <div
                    key={w.label}
                    className={cn(
                      "absolute top-0 h-full opacity-40 rounded-none",
                      w.type === "alerta"
                        ? "bg-amber-400"
                        : w.type === "pico"
                          ? "bg-emerald-400"
                          : "bg-blue-400",
                    )}
                    style={{
                      left: `${startPct}%`,
                      width: `${widthPct}%`,
                    }}
                  />
                );
              })}

              {/* Marcador da hora atual */}
              <div
                className="absolute top-0 h-full w-0.5 bg-foreground z-10"
                style={{ left: `${timelinePositionPct}%` }}
              >
                <div className="absolute -top-0.5 -translate-x-1/2 w-2 h-2 rounded-full bg-foreground" />
              </div>
            </div>

            {/* Legenda de horas */}
            <div className="flex justify-between text-[9px] text-muted-foreground font-bold px-0.5">
              {[0, 6, 12, 18, 24].map((h) => (
                <span key={h}>{String(h).padStart(2, "0")}h</span>
              ))}
            </div>
          </div>

          {/* Lista das janelas */}
          <div className="flex flex-col gap-2">
            {drowsinessWindows.map((w) => (
              <div
                key={w.label}
                className="flex items-start gap-3 py-3 border-b border-border last:border-0"
              >
                <div
                  className={cn(
                    "w-1 self-stretch rounded-full shrink-0",
                    w.type === "alerta"
                      ? "bg-amber-400"
                      : w.type === "pico"
                        ? "bg-emerald-400"
                        : "bg-blue-400",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{w.label}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {formatDecimalHour(w.startHour)} – {formatDecimalHour(w.endHour)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{w.description}</p>
                </div>
                {w.type === "alerta" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                )}
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground text-center pb-2">
            Estimativas baseadas no ritmo circadiano e nos seus padrões históricos de sono. Resultados individuais podem variar.
          </p>
        </>
      )}
    </div>
  );
}
