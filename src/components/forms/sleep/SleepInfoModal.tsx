"use client";

import {
  BedDouble,
  CheckCircle2,
  HelpCircle,
  Target,
  X,
  Zap,
} from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface SleepInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function SleepInfoModal({ show, onClose }: SleepInfoModalProps) {
  useLockBodyScroll(show);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/60 shrink-0 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <HelpCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">
                Monitoramento de Sono
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Guia para otimizar seu descanso
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          {/* Seção 1: Registrando Sono */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-blue-400">
              <BedDouble className="w-5 h-5" />
              <h3 className="font-bold text-white">Registrando seus Ciclos</h3>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-4 space-y-3">
              <p className="text-sm text-neutral-400 leading-relaxed">
                Clique no botão{" "}
                <span className="text-blue-400 font-bold">
                  "Registrar Sono"
                </span>{" "}
                sempre que acordar para documentar seu ciclo de repouso:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Horário", desc: "Quando deitou e quando levantou" },
                  {
                    label: "Qualidade",
                    desc: "Avalie de 1 a 5 estrelas o seu vigor",
                  },
                  { label: "Notas", desc: "Descreva sonhos ou interrupções" },
                  {
                    label: "Sonecas",
                    desc: "Registre breves descansos diurnos",
                  },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-2 bg-black/20 p-2.5 rounded-lg border border-neutral-800/50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-neutral-200">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Seção 2: Objetivos */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-blue-400">
              <Target className="w-5 h-5" />
              <h3 className="font-bold text-white">Objetivos e Metas</h3>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-4">
              <p className="text-sm text-neutral-400 leading-relaxed">
                No ícone de engrenagem, você define seu{" "}
                <span className="text-blue-400">horário ideal</span> de dormir e
                as <span className="text-blue-400">horas desejadas</span>. O
                sistema exibirá:
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs p-2 bg-black/20 rounded-lg border border-neutral-800/50">
                  <span className="text-neutral-300">Déficit de sono</span>
                  <span className="text-blue-400 font-bold">
                    Consistência semanal
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs p-2 bg-black/20 rounded-lg border border-neutral-800/50">
                  <span className="text-neutral-300">Qualidade média</span>
                  <span className="text-blue-400 font-bold">
                    Avaliação de vigor
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Dica Pro */}
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-xl p-4 flex gap-4">
            <div className="shrink-0 p-2 bg-blue-600/20 rounded-lg h-fit">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-300">
                Poder de Recuperação
              </p>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Manter uma rotina estável de sono aumenta drasticamente sua
                capacidade de{" "}
                <span className="text-white font-medium">foco e memória</span>{" "}
                durante os estudos e trabalho.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-800/60 bg-neutral-900/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            Entendido, bons sonhos!
          </button>
        </div>
      </div>
    </div>
  );
}
