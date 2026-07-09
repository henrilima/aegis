"use client";

import { Loader2 } from "lucide-react";

interface ModuleLoadingProps {
  moduleName?: string;
}

export default function ModuleLoading({ moduleName }: ModuleLoadingProps) {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6 bg-transparent">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-card shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/60" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-foreground">
            {moduleName ? `Carregando ${moduleName}...` : "Carregando..."}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground/60">
            Sincronizando seus dados locais
          </p>
        </div>
      </div>
    </div>
  );
}
