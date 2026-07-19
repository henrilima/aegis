"use client";

import {
  AlertTriangle,
  ArrowRight,
  Battery,
  Moon,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SleepCalculatorProps {
  now: Date;
  onQuickRegister: (
    bedtime: string,
    wakeTime: string,
    defaultQuality: number,
  ) => void;
}

// Helper para formatar hora/minuto em string HH:MM
function formatMinsToTime(totalMins: number): string {
  const norm = (totalMins + 1440) % 1440;
  const h = String(Math.floor(norm / 60)).padStart(2, "0");
  const m = String(norm % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// Helper para converter HH:MM em minutos desde a meia-noite
function parseTimeToMins(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Mapeamento de estilos visuais e descrições para cada quantidade de ciclos
const getCycleStyle = (cycles: number) => {
  switch (cycles) {
    case 3: // Sobrevivência
      return {
        cardBorder: "border border-red-500/20 dark:border-red-500/10",
        cardBg:
          "bg-gradient-to-br from-red-500/[0.04] to-transparent dark:from-red-500/[0.02]",
        textClass: "text-red-600 dark:text-red-400",
        badgeBg:
          "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400",
        btnClass:
          "bg-red-500 hover:bg-red-600 text-white border-red-600 dark:bg-red-600 dark:hover:bg-red-700",
        desc: "Mínimo necessário para sobrevivência. Sensação de fadiga provável.",
        type: "Sobrevivência",
      };
    case 4: // Aceitável / Razoável
      return {
        cardBorder: "border border-amber-500/20 dark:border-amber-500/10",
        cardBg:
          "bg-gradient-to-br from-amber-500/[0.04] to-transparent dark:from-amber-500/[0.02]",
        textClass: "text-amber-600 dark:text-amber-400",
        badgeBg:
          "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400",
        btnClass:
          "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700",
        desc: "Ciclo básico aceitável. Pode sentir alguma sonolência de dia.",
        type: "Razoável",
      };
    case 5: // Recomendado
      return {
        cardBorder: "border border-emerald-500/30 dark:border-emerald-500/15",
        cardBg:
          "bg-gradient-to-br from-emerald-500/[0.06] to-transparent dark:from-emerald-500/[0.03]",
        textClass: "text-emerald-600 dark:text-emerald-400",
        badgeBg:
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400",
        btnClass:
          "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700",
        desc: "Duração recomendada para a maioria dos adultos. Acorde bem e revigorado.",
        type: "Recomendado",
      };
    default: // Excelente (6)
      return {
        cardBorder: "border border-cyan-500/30 dark:border-cyan-500/15",
        cardBg:
          "bg-gradient-to-br from-cyan-500/[0.06] to-transparent dark:from-cyan-500/[0.03]",
        textClass: "text-cyan-600 dark:text-cyan-400",
        badgeBg:
          "bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-400",
        btnClass:
          "bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700",
        desc: "Excelente duração. Perfeito para descanso profundo e foco total.",
        type: "Excelente",
      };
  }
};

export function SleepCalculator({
  now,
  onQuickRegister,
}: SleepCalculatorProps) {
  const [targetWakeTime, setTargetWakeTime] = useState("07:00");
  const [targetBedtime, setTargetBedtime] = useState("23:00");
  const [activeTab, setActiveTab] = useState<
    "dormir-agora" | "planejar-dormir" | "acordar-hora"
  >("dormir-agora");

  // Cálculos para "Dormir Agora" (retorna horários de acordar sugeridos)
  const wakeUpOptions = useMemo(() => {
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const startMins = currentMins + 15; // 15 minutos de latência de sono

    return [3, 4, 5, 6].map((cycles) => {
      const durationMins = cycles * 90;
      const wakeMins = startMins + durationMins;
      return {
        cycles,
        durationHours: (cycles * 90) / 60,
        time: formatMinsToTime(wakeMins),
        recommended: cycles === 5 || cycles === 6,
        defaultQuality:
          cycles === 3 ? 1 : cycles === 4 ? 3 : cycles === 5 ? 4 : 5,
        type:
          cycles === 3
            ? "Sobrevivência"
            : cycles === 4
              ? "Aceitável"
              : cycles === 5
                ? "Recomendado"
                : "Excelente",
      };
    });
  }, [now]);

  // Cálculos para "Planejar Dormir" (retorna horários de acordar baseados no horário programado de deitar)
  const planejarDormirOptions = useMemo(() => {
    const bedMins = parseTimeToMins(targetBedtime);
    const startMins = bedMins + 15; // 15 minutos para adormecer

    return [3, 4, 5, 6].map((cycles) => {
      const durationMins = cycles * 90;
      const wakeMins = startMins + durationMins;
      return {
        cycles,
        durationHours: (cycles * 90) / 60,
        time: formatMinsToTime(wakeMins),
        recommended: cycles === 5 || cycles === 6,
        defaultQuality:
          cycles === 3 ? 1 : cycles === 4 ? 3 : cycles === 5 ? 4 : 5,
        type:
          cycles === 3
            ? "Sobrevivência"
            : cycles === 4
              ? "Aceitável"
              : cycles === 5
                ? "Recomendado"
                : "Excelente",
      };
    });
  }, [targetBedtime]);

  // Cálculos para "Planejar Despertar" (retorna horários recomendados para ir deitar)
  const bedtimeOptions = useMemo(() => {
    const wakeMins = parseTimeToMins(targetWakeTime);

    return [3, 4, 5, 6].map((cycles) => {
      const durationMins = cycles * 90;
      // bedtime = wakeTime - duration - 15 mins (tempo para pegar no sono)
      const bedMins = wakeMins - durationMins - 15;
      return {
        cycles,
        durationHours: (cycles * 90) / 60,
        time: formatMinsToTime(bedMins),
        recommended: cycles === 5 || cycles === 6,
        defaultQuality:
          cycles === 3 ? 1 : cycles === 4 ? 3 : cycles === 5 ? 4 : 5,
        type:
          cycles === 3
            ? "Sobrevivência"
            : cycles === 4
              ? "Aceitável"
              : cycles === 5
                ? "Recomendado"
                : "Excelente",
      };
    });
  }, [targetWakeTime]);

  // Helper para renderizar a grade de cartões de sugestão de ciclos
  function renderOptionsGrid(
    options: {
      cycles: number;
      durationHours: number;
      time: string;
      type: string;
      defaultQuality: number;
      recommended: boolean;
    }[],
    bedtimeCreator: (time: string) => string,
    wakeTimeCreator: (time: string) => string,
  ) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((opt) => {
          const style = getCycleStyle(opt.cycles);

          let CycleIcon = Moon;
          if (opt.cycles === 3) CycleIcon = AlertTriangle;
          else if (opt.cycles === 4) CycleIcon = Battery;
          else if (opt.cycles === 6) CycleIcon = Sparkles;

          return (
            <div
              key={opt.cycles}
              className={cn(
                "relative flex flex-col justify-between p-5 bg-card rounded-2xl transition-all hover:brightness-105 dark:hover:brightness-110",
                style.cardBorder,
                style.cardBg,
              )}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "p-1.5 rounded-lg bg-background border border-border/50 text-left",
                        style.textClass,
                      )}
                    >
                      <CycleIcon className="w-4 h-4 shrink-0" />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-extrabold uppercase tracking-wider text-left",
                        style.textClass,
                      )}
                    >
                      {style.type}
                    </span>
                  </div>
                  {opt.recommended && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider",
                        style.badgeBg,
                      )}
                    >
                      Ideal
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5 mt-4 text-left">
                  <span className="text-3xl font-black text-foreground tracking-tight">
                    {opt.time}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed mt-1 font-medium">
                    {style.desc}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold mb-3 flex items-center gap-1.5 justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                  {opt.durationHours}h de sono ({opt.cycles} ciclos + 15m)
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onQuickRegister(
                      bedtimeCreator(opt.time),
                      wakeTimeCreator(opt.time),
                      opt.defaultQuality,
                    )
                  }
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none",
                    style.btnClass,
                  )}
                >
                  <span>Registrar este ciclo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5">
        <div className="text-left">
          <h2 className="text-base font-bold text-foreground">
            Calculadora de Ciclos
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            O sono humano é estruturado em ciclos de 90 minutos. Acorde no fim
            de um ciclo para se sentir renovado.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(val) =>
            setActiveTab(
              val as "dormir-agora" | "planejar-dormir" | "acordar-hora",
            )
          }
          className="w-full"
        >
          <TabsList className="bg-muted/50 border border-border/60 p-[3px] rounded-lg max-w-md w-full flex mb-6">
            <TabsTrigger value="dormir-agora" className="flex-1 text-xs py-1.5">
              Dormir agora
            </TabsTrigger>
            <TabsTrigger
              value="planejar-dormir"
              className="flex-1 text-xs py-1.5"
            >
              Planejar deitar
            </TabsTrigger>
            <TabsTrigger value="acordar-hora" className="flex-1 text-xs py-1.5">
              Planejar despertar
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Dormir agora */}
          <TabsContent
            value="dormir-agora"
            className="mt-2 flex flex-col gap-5"
          >
            <div className="py-3 border-b border-border/60 flex items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-xs font-bold text-foreground">
                  Horário de deitar considerado
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Hora atual simulada (inclui 15m de latência)
                </p>
              </div>
              <span className="text-sm font-bold text-cyan-500">
                {String(now.getHours()).padStart(2, "0")}:
                {String(now.getMinutes()).padStart(2, "0")}
              </span>
            </div>

            {renderOptionsGrid(
              wakeUpOptions,
              () => {
                return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
              },
              (time) => time,
            )}
          </TabsContent>

          {/* Tab 2: Planejar Deitar */}
          <TabsContent
            value="planejar-dormir"
            className="mt-2 flex flex-col gap-5"
          >
            <div className="py-3 border-b border-border/60 flex items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-xs font-bold text-foreground">
                  Horário planejado para deitar
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Escolha quando você planeja ir para a cama (adiciona 15m de
                  latência)
                </p>
              </div>
              <input
                type="time"
                value={targetBedtime}
                onChange={(e) => setTargetBedtime(e.target.value)}
                className="bg-card border border-border/60 h-9 rounded-lg px-3 text-xs font-bold text-cyan-500 focus:border-cyan-500/40 transition-all outline-none"
              />
            </div>

            {renderOptionsGrid(
              planejarDormirOptions,
              () => targetBedtime,
              (time) => time,
            )}
          </TabsContent>

          {/* Tab 3: Planejar Despertar */}
          <TabsContent
            value="acordar-hora"
            className="mt-2 flex flex-col gap-5"
          >
            <div className="py-3 border-b border-border/60 flex items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-xs font-bold text-foreground">
                  Horário planejado para acordar
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Escolha a hora que você precisa despertar na manhã seguinte
                </p>
              </div>
              <input
                type="time"
                value={targetWakeTime}
                onChange={(e) => setTargetWakeTime(e.target.value)}
                className="bg-card border border-border/60 h-9 rounded-lg px-3 text-xs font-bold text-cyan-500 focus:border-cyan-500/40 transition-all outline-none"
              />
            </div>

            {renderOptionsGrid(
              bedtimeOptions,
              (time) => time,
              () => targetWakeTime,
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dicas de higiene do sono */}
      <div className="flex flex-col gap-3 pt-4 border-t border-border/60 text-left">
        <h3 className="text-xs font-bold text-foreground">
          Dicas de higiene do sono
        </h3>
        <ul className="text-[11px] text-muted-foreground space-y-2 leading-relaxed">
          <li className="flex gap-2">
            <span className="text-cyan-500 font-bold">•</span>
            <span>
              Evite telas de luz azul (celular/computador) por pelo menos 30
              minutos antes do horário planejado para deitar.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-500 font-bold">•</span>
            <span>
              Mantenha o quarto escuro, silencioso e com temperatura agradável
              para estimular a produção de melatonina.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-500 font-bold">•</span>
            <span>
              Durma em múltiplos de 90 minutos. É preferível dormir 7.5 horas (5
              ciclos completos) do que 8 horas (acordando no meio de um ciclo).
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
