"use client";

import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface PomoHeaderProps {
  cyclesCompleted: number;
  isWork: boolean;
}

/**
 * Cabeçalho do Módulo Pomodoro: Padronizado com o design do sistema
 */
export function PomoHeader({ cyclesCompleted, isWork }: PomoHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6 flex-wrap">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-xl border transition-all",
              isWork
                ? "bg-red-500/10 border-red-500/20"
                : "bg-teal-500/10 border-teal-500/20",
            )}
          >
            <Timer
              className={cn(
                "w-5 h-5",
                isWork
                  ? "text-red-600 dark:text-red-400"
                  : "text-teal-600 dark:text-teal-400",
              )}
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground leading-none">
              Foco & Produtividade
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Gerencie seus ciclos de trabalho e descanso
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isWork ? "bg-red-500 animate-pulse" : "bg-teal-500",
              )}
            />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              {isWork ? "Fase Provedora de Foco" : "Fase de Recuperação Neutra"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              {cyclesCompleted} Ciclo{cyclesCompleted !== 1 ? "s" : ""}{" "}
              Concluído{cyclesCompleted !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
