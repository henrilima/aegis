"use client";

import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SleepCalculatorProps {
  now: Date;
  onQuickRegister: (bedtime: string, wakeTime: string) => void;
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
        border: "border-red-500/25 bg-red-500/[0.01] dark:border-red-500/20",
        text: "text-red-500 dark:text-red-400",
        tagBg: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
        desc: "Mínimo necessário. Sensação de cansaço provável.",
      };
    case 4: // Razoável
      return {
        border:
          "border-amber-500/25 bg-amber-500/[0.01] dark:border-amber-500/20",
        text: "text-amber-500 dark:text-amber-400",
        tagBg:
          "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
        desc: "Razoável. Pode sentir um leve cansaço.",
      };
    case 5: // Recomendado
      return {
        border:
          "border-emerald-500/30 bg-emerald-500/[0.02] dark:border-emerald-500/20",
        text: "text-emerald-500 dark:text-emerald-400",
        tagBg:
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        desc: "Ideal para a maioria dos adultos. Acorde renovado.",
      };
    default:
      return {
        border: "border-cyan-500/30 bg-cyan-500/[0.02] dark:border-cyan-500/20",
        text: "text-cyan-500 dark:text-cyan-400",
        tagBg:
          "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400",
        desc: "Excepcional. Altamente recuperador e produtivo.",
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
      recommended: boolean;
    }[],
    bedtimeCreator: (time: string) => string,
    wakeTimeCreator: (time: string) => string,
  ) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const style = getCycleStyle(opt.cycles);
          return (
            <div
              key={opt.cycles}
              className={cn(
                "relative flex flex-col justify-between p-4 bg-card border rounded-xl transition-all hover:bg-muted/4",
                style.border,
              )}
            >
              {opt.recommended && (
                <span
                  className={cn(
                    "absolute top-2.5 right-3 px-1.5 py-0.5 rounded-md border text-[9px] font-bold capitalize",
                    style.tagBg,
                  )}
                >
                  Ideal
                </span>
              )}
              <div className="flex flex-col gap-0.5">
                <span className={cn("text-xs font-bold", style.text)}>
                  {opt.type}
                </span>
                <span className="text-xl font-bold text-foreground">
                  {opt.time}
                </span>
                <span className="text-xs text-muted-foreground leading-normal mt-0.5">
                  {style.desc}
                </span>
                <span className="text-[10px] text-neutral-500 font-bold mt-1">
                  {opt.durationHours}h ({opt.cycles} ciclos de 90m + 15m)
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onQuickRegister(
                    bedtimeCreator(opt.time),
                    wakeTimeCreator(opt.time),
                  )
                }
                className={cn(
                  "mt-4 w-full flex items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                  opt.recommended
                    ? "bg-cyan-500 text-white border-cyan-600 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                    : "bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                Registrar ciclo
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5">
        <div>
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
          <TabsList className="bg-muted/50 border border-border/60 p-[3px] rounded-lg max-w-md w-full flex">
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
            className="mt-5 flex flex-col gap-5"
          >
            <div className="py-2 border-b border-border/60 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-foreground">
                  Horário de deitar considerado
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Hora atual simulada (inclui 15m para adormecer)
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
            className="mt-5 flex flex-col gap-5"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <span className="text-xs font-medium text-muted-foreground ml-0.5">
                  Horário planejado para deitar
                </span>
                <input
                  type="time"
                  value={targetBedtime}
                  onChange={(e) => setTargetBedtime(e.target.value)}
                  className="w-full bg-card border border-border h-11 rounded-xl px-4 text-sm font-medium focus:border-cyan-500/40 transition-all outline-none"
                />
              </div>
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
            className="mt-5 flex flex-col gap-5"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 w-full">
                <span className="text-xs font-medium text-muted-foreground ml-0.5">
                  Horário planejado para acordar
                </span>
                <input
                  type="time"
                  value={targetWakeTime}
                  onChange={(e) => setTargetWakeTime(e.target.value)}
                  className="w-full bg-card border border-border h-11 rounded-xl px-4 text-sm font-medium focus:border-cyan-500/40 transition-all outline-none"
                />
              </div>
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
      <div className="flex flex-col gap-3 pt-2 border-t border-border/60">
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
