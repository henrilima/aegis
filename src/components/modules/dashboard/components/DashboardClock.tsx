"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface DashboardClockProps {
  time: Date;
  style?: string;
  animated?: boolean;
}

interface TimeReelProps {
  value: string;
  animated: boolean;
}

function TimeReel({ value, animated }: TimeReelProps) {
  const [currentVal, setCurrentVal] = useState(value);
  const [nextVal, setNextVal] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== currentVal) {
      if (animated) {
        setNextVal(value);
        setIsAnimating(true);
        const timer = setTimeout(() => {
          setCurrentVal(value);
          setIsAnimating(false);
        }, 350);
        return () => clearTimeout(timer);
      } else {
        setCurrentVal(value);
        setNextVal(value);
      }
    }
  }, [value, currentVal, animated]);

  return (
    <div className="relative h-[52px] sm:h-[60px] w-[40px] sm:w-[48px] overflow-hidden">
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-[200%] flex flex-col",
          animated && isAnimating
            ? "transition-all duration-350 ease-out -translate-y-1/2"
            : "transition-none translate-y-0",
        )}
      >
        {/* Slot 1: Valor atual */}
        <div className="h-1/2 w-full flex items-center justify-center font-sans text-4xl sm:text-5xl font-black text-foreground/95 tabular-nums leading-none">
          {currentVal}
        </div>
        {/* Slot 2: Próximo valor deslizando */}
        <div className="h-1/2 w-full flex items-center justify-center font-sans text-4xl sm:text-5xl font-black text-foreground/95 tabular-nums leading-none">
          {nextVal}
        </div>
      </div>
    </div>
  );
}

function timeToWords(
  h: number,
  m: number,
  s: number,
): { primary: string; secondary: string } {
  const numbers = [
    "zero",
    "uma",
    "duas",
    "três",
    "quatro",
    "cinco",
    "seis",
    "sete",
    "oito",
    "nove",
    "dez",
    "onze",
    "doze",
    "treze",
    "quatorze",
    "quinze",
    "dezesseis",
    "dezessete",
    "dezoito",
    "dezenove",
    "vinte",
    "vinte e um",
    "vinte e duas",
    "vinte e três",
  ];

  const minutesWords = (val: number): string => {
    if (val === 0) return "";
    if (val === 15) return "e quinze";
    if (val === 30) return "e meia";
    if (val === 45) return "menos quinze";

    const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta"];
    const units = [
      "",
      "um",
      "dois",
      "três",
      "quatro",
      "cinco",
      "seis",
      "sete",
      "oito",
      "nove",
    ];

    if (val < 20) {
      const small = [
        "",
        "um",
        "dois",
        "três",
        "quatro",
        "cinco",
        "seis",
        "sete",
        "oito",
        "nove",
        "dez",
        "onze",
        "doze",
        "treze",
        "quatorze",
        "quinze",
        "dezesseis",
        "dezessete",
        "dezoito",
        "dezenove",
      ];
      return `e ${small[val]}`;
    }

    const ten = Math.floor(val / 10);
    const unit = val % 10;
    return `e ${tens[ten]}${unit > 0 ? ` e ${units[unit]}` : ""}`;
  };

  const hourStr =
    h === 1
      ? "uma hora"
      : h === 12
        ? "meio dia"
        : h === 0
          ? "meia noite"
          : `${numbers[h]} horas`;
  const minStr = m === 0 ? "em ponto" : minutesWords(m);

  let secStr = "segundos";
  if (s === 1) secStr = "um segundo";
  else if (s > 1) {
    const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta"];
    const units = [
      "",
      "um",
      "dois",
      "três",
      "quatro",
      "cinco",
      "seis",
      "sete",
      "oito",
      "nove",
    ];
    if (s < 20) {
      const small = [
        "zero",
        "um",
        "dois",
        "três",
        "quatro",
        "cinco",
        "seis",
        "sete",
        "oito",
        "nove",
        "dez",
        "onze",
        "doze",
        "treze",
        "quatorze",
        "quinze",
        "dezesseis",
        "dezessete",
        "dezoito",
        "dezenove",
      ];
      secStr = `${small[s]} segundos`;
    } else {
      const ten = Math.floor(s / 10);
      const unit = s % 10;
      secStr = `${tens[ten]}${unit > 0 ? ` e ${units[unit]}` : ""} segundos`;
    }
  }

  return {
    primary: `${hourStr} ${minStr}`.trim(),
    secondary: s > 0 ? `e ${secStr}` : "",
  };
}

export function DashboardClock({
  time,
  style = "default",
  animated = true,
}: DashboardClockProps) {
  const { themeStyles: theme } = useTheme();

  const hVal = time.getHours();
  const mVal = time.getMinutes();
  const sVal = time.getSeconds();

  const hours = hVal.toString().padStart(2, "0");
  const minutes = mVal.toString().padStart(2, "0");
  const seconds = sVal.toString().padStart(2, "0");

  // 1. STYLE: DEFAULT (Padrão Minimalista)
  if (style === "default") {
    return (
      <div className="flex flex-col items-end gap-1 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-baseline gap-2">
          <div className="flex items-center gap-0.5">
            <span className="font-sans text-5xl sm:text-6xl font-black text-foreground tabular-nums leading-none">
              {hours}
            </span>
            <span
              className={cn(
                "font-sans text-4xl sm:text-5xl font-black leading-none opacity-70 mx-1.5",
                theme.text,
              )}
            >
              :
            </span>
            <span className="font-sans text-5xl sm:text-6xl font-black text-foreground tabular-nums leading-none">
              {minutes}
            </span>
          </div>
          <span
            className={cn(
              "font-sans text-base sm:text-lg font-black tabular-nums select-none",
              theme.text,
            )}
          >
            {seconds}s
          </span>
        </div>
      </div>
    );
  }

  // 2. STYLE: CHUNKY (Moderno Completo - HH:MM:SS unificado em tamanho menor)
  if (style === "chunky") {
    if (animated) {
      // Se animado for verdadeiro, renderiza o carrossel de rolagem vertical suave
      return (
        <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-500 select-none">
          <TimeReel value={hours} animated={animated} />
          <span
            className={cn(
              "font-sans text-4xl sm:text-5xl font-black leading-none opacity-85 pb-0.5 animate-pulse mx-0.5",
              theme.text,
            )}
          >
            :
          </span>
          <TimeReel value={minutes} animated={animated} />
          <span
            className={cn(
              "font-sans text-4xl sm:text-5xl font-black leading-none opacity-85 pb-0.5 animate-pulse mx-0.5",
              theme.text,
            )}
          >
            :
          </span>
          <TimeReel value={seconds} animated={animated} />
        </div>
      );
    }

    // Caso contrário, renderiza o layout estático unificado
    return (
      <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-500 select-none">
        <span className="font-sans text-5xl sm:text-6xl font-black text-foreground tabular-nums leading-none">
          {hours}
        </span>
        <span
          className={cn(
            "font-sans text-4xl sm:text-5xl font-black leading-none opacity-80 animate-pulse mx-0.5",
            theme.text,
          )}
        >
          :
        </span>
        <span className="font-sans text-5xl sm:text-6xl font-black text-foreground tabular-nums leading-none">
          {minutes}
        </span>
        <span
          className={cn(
            "font-sans text-4xl sm:text-5xl font-black leading-none opacity-80 animate-pulse mx-0.5",
            theme.text,
          )}
        >
          :
        </span>
        <span className="font-sans text-5xl sm:text-6xl font-black text-foreground tabular-nums leading-none">
          {seconds}
        </span>
      </div>
    );
  }

  // 3. STYLE: SEMANAL (Calendário Semanal)
  if (style === "semanal") {
    const currentDay = time.getDay(); // 0-6

    return (
      <div className="flex flex-col items-end text-right gap-3 animate-in fade-in duration-500 select-none">
        <div className="flex items-baseline gap-1.5">
          <span className="font-sans text-5xl sm:text-6xl font-black text-foreground tabular-nums leading-none flex items-center gap-0.5">
            <span>{hours}</span>
            <span className={cn("opacity-80 animate-pulse mx-1.5", theme.text)}>
              :
            </span>
            <span>{minutes}</span>
          </span>
          <span
            className={cn(
              "font-sans text-sm sm:text-base font-black tabular-nums",
              theme.text,
            )}
          >
            {seconds}s
          </span>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-foreground/5 dark:bg-foreground/5 rounded-xl border border-border/10">
          {[
            { initial: "D", dayNum: 0 },
            { initial: "S", dayNum: 1 },
            { initial: "T", dayNum: 2 },
            { initial: "Q", dayNum: 3 },
            { initial: "Q", dayNum: 4 },
            { initial: "S", dayNum: 5 },
            { initial: "S", dayNum: 6 },
          ].map((day) => {
            const isToday = day.dayNum === currentDay;
            return (
              <div
                key={`semanal-day-${day.dayNum}`}
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black tracking-tighter transition-all duration-300",
                  isToday
                    ? `${theme.solid} text-white font-black scale-105`
                    : "text-muted-foreground/45 font-semibold",
                )}
              >
                {day.initial}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. STYLE: WORD (Texto Literário)
  if (style === "word") {
    const words = timeToWords(hVal, mVal, sVal);
    const primaryClean =
      words.primary.charAt(0).toUpperCase() +
      words.primary.slice(1).toLowerCase();
    const secondaryClean = words.secondary.toLowerCase();

    return (
      <div className="flex flex-col items-end text-right gap-1.5 animate-in fade-in duration-500 select-none max-w-md">
        <span className="font-sans text-3xl sm:text-4xl md:text-5xl font-black text-foreground leading-tight tracking-tight">
          {primaryClean}
        </span>
        {secondaryClean && (
          <span
            className={cn(
              "font-sans text-sm sm:text-base md:text-lg font-bold opacity-80 leading-none",
              theme.text,
            )}
          >
            {secondaryClean}
          </span>
        )}
      </div>
    );
  }

  // 5. STYLE: PROGRESS (Progresso do Dia)
  if (style === "progress") {
    const daySeconds = hVal * 3600 + mVal * 60 + sVal;
    const progressPercent = ((daySeconds / 86400) * 100).toFixed(2);

    return (
      <div className="flex flex-col items-end gap-3.5 animate-in fade-in duration-500 select-none min-w-[240px]">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-5xl sm:text-6xl font-black text-foreground tabular-nums leading-none flex items-center gap-0.5">
            <span>{hours}</span>
            <span className={cn("opacity-80 animate-pulse mx-1.5", theme.text)}>
              :
            </span>
            <span>{minutes}</span>
          </span>
          <span
            className={cn(
              "font-sans text-base sm:text-lg font-black tabular-nums",
              theme.text,
            )}
          >
            {seconds}s
          </span>
        </div>

        {/* Dynamic linear bar (enlarged) */}
        <div className="w-full h-3 rounded-full bg-foreground/5 dark:bg-foreground/10 overflow-hidden relative border border-border/10 p-[1.5px]">
          <div
            className={cn(
              "h-full rounded-full transition-all ease-out",
              theme.solid,
            )}
            style={{
              width: `${progressPercent}%`,
              transitionDuration: animated ? "400ms" : "0ms",
            }}
          />
        </div>

        <span className="text-xs font-black text-muted-foreground/60 uppercase">
          dia{" "}
          <span className={cn("font-black", theme.text)}>
            {progressPercent}%
          </span>{" "}
          concluído
        </span>
      </div>
    );
  }

  // 6. STYLE: DATETIME (Data Completa)
  if (style === "datetime") {
    const formattedDate = time.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const dateStr =
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    return (
      <div className="flex flex-col items-end text-right gap-1 animate-in fade-in duration-500 select-none min-w-[200px]">
        <div className="flex items-baseline gap-1.5">
          <span className="font-sans text-5xl sm:text-6xl font-black text-foreground tabular-nums leading-none flex items-center gap-0.5">
            <span>{hours}</span>
            <span className={cn("opacity-80 animate-pulse mx-1.5", theme.text)}>
              :
            </span>
            <span>{minutes}</span>
          </span>
          <span
            className={cn(
              "font-sans text-sm sm:text-base font-black tabular-nums",
              theme.text,
            )}
          >
            {seconds}s
          </span>
        </div>
        <span className="font-sans text-xs sm:text-sm font-bold text-muted-foreground/80 mt-1 leading-none">
          {dateStr}
        </span>
      </div>
    );
  }
}
