"use client";

import { Loader2 } from "lucide-react";

interface ModuleLoadingProps {
  moduleName?: string;
}

export default function ModuleLoading({ moduleName }: ModuleLoadingProps) {
  return (
    <div className="w-full h-full min-h-100 flex flex-col items-center justify-center text-center p-6 bg-transparent">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-11 h-11 rounded-2xl border border-border/60 bg-muted/20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin opacity-80" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-foreground leading-snug">
            {moduleName
              ? `Carregando ${moduleName.toLowerCase()}...`
              : "Carregando..."}
          </p>
          <p className="text-[10px] font-medium text-muted-foreground">
            Sincronizando seus dados locais
          </p>
        </div>
      </div>
    </div>
  );
}
