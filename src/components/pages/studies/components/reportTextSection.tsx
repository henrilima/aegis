"use client";

import { Copy } from "lucide-react";

interface ReportTextSectionProps {
  reportText: string;
  onCopy: () => void;
}

export function ReportTextSection({
  reportText,
  onCopy,
}: ReportTextSectionProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl h-full flex flex-col">
      <div className="p-6 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Copy className="w-4 h-4 text-violet-500" />
          <h2 className=" font-black uppercase text-neutral-400">
            Relatório Detalhado (Texto)
          </h2>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 text-violet-400 text-[10px] font-black uppercase transition-all cursor-pointer border border-violet-600/30 hover:bg-violet-600/30"
        >
          <Copy className="w-3.5 h-3.5" /> Copiar Tudo
        </button>
      </div>
      <div className="p-6 flex-1">
        <pre className="text-xs text-neutral-300 font-mono whitespace-pre-wrap bg-neutral-950 border border-neutral-800 rounded-xl p-6 leading-relaxed shadow-inner h-full overflow-y-auto">
          {reportText}
        </pre>
      </div>
    </div>
  );
}
