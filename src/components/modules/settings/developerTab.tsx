"use client";

import { Cpu, ShieldAlert, Terminal } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { TelemetryTab } from "./telemetryTab";

interface DeveloperTabProps {
  handleInternalCommand: (command: string) => Promise<void>;
}

export function DeveloperTab({ handleInternalCommand }: DeveloperTabProps) {
  const [internalCmd, setInternalCmd] = React.useState("");

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      {/* Header Padronizado */}
      <section className="flex items-center gap-5">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/10",
          )}
        >
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Desenvolvedor</h2>
          <p className="text-sm text-muted-foreground">
            Ferramentas avançadas para diagnóstico e comandos internos.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8">
        {/* Comandos Internos */}
        <section className="p-6 bg-card border border-border rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-bold">Console de Comandos</h4>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Execute comandos diretamente no núcleo do Aegis para testes e
              manutenção.
            </p>
            <div className="relative group">
              <input
                type="text"
                value={internalCmd}
                onChange={(e) => setInternalCmd(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && internalCmd.trim()) {
                    handleInternalCommand(internalCmd);
                    setInternalCmd("");
                  }
                }}
                placeholder="Comando de sistema..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-accent border border-border text-[9px] font-bold text-muted-foreground opacity-0 group-focus-within:opacity-100 transition-opacity">
                ENTER
              </kbd>
            </div>
          </div>
        </section>

        {/* Telemetria e Diagnóstico */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Cpu className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-bold">Telemetria em Tempo Real</h4>
          </div>
          <div className="border border-border rounded-2xl overflow-hidden bg-background/40">
            <TelemetryTab />
          </div>
        </section>
      </div>
    </div>
  );
}
