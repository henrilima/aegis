"use client";

import { FileText } from "lucide-react";

interface StatsCardProps {
  count: number;
}

/**
 * Card de estatística simples para o resumo de notas
 */
export function StatsCard({ count }: StatsCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
      <div className="p-3 rounded-full bg-orange-500/10 border border-orange-500/20 mb-3">
        <FileText className="w-6 h-6 text-orange-400" />
      </div>
      <h3 className="text-3xl font-black text-white leading-none">{count}</h3>
      <p className="text-[10px] font-black uppercase text-neutral-500 mt-2">
        Notas Registradas
      </p>
    </div>
  );
}
