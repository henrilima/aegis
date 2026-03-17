"use client";

import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  HelpCircle,
  Target,
  X,
} from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface StudyInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function StudyInfoModal({ show, onClose }: StudyInfoModalProps) {
  useLockBodyScroll(show);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800/60 shrink-0 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
              <HelpCircle className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">
                Guia do Módulo de Estudos
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Como gerenciar seu desempenho acadêmico
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          {/* Seção 1: Criando Sessões */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-violet-400">
              <GraduationCap className="w-5 h-5" />
              <h3 className="font-bold text-white">Registrando Sessões</h3>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-4 space-y-3">
              <p className="text-sm text-neutral-400 leading-relaxed">
                Clique no botão{" "}
                <span className="text-violet-400 font-bold">"Nova Sessão"</span>{" "}
                para registrar seu tempo de estudo. Caso você estude por X
                horas, registre essas X horas. Se depois disso for fazer
                questões, crie outra sessão adicionando só as questões e o tempo
                que levou para resolvê-las.
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Questões", desc: "Acertos em inéditas e revisões" },
                  { label: "Páginas", desc: "Quantidade de leitura realizada" },
                  { label: "Tempo", desc: "Duração total da sessão" },
                  {
                    label: "Extra",
                    desc: "Crie sua própria métrica (ex: Flashcards)",
                  },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-2 bg-black/20 p-2.5 rounded-lg border border-neutral-800/50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 mt-0.5" />
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

          {/* Seção 2: Metas */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-violet-400">
              <Target className="w-5 h-5" />
              <h3 className="font-bold text-white">Configurando Metas</h3>
            </div>
            <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-4">
              <p className="text-sm text-neutral-400 leading-relaxed">
                Acesse o ícone de engrenagem para definir suas metas semanais e
                mensais. O sistema calculará automaticamente seu progresso em
                relação a:
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs p-2 bg-black/20 rounded-lg border border-neutral-800/50">
                  <span className="text-neutral-300">Horas de estudo</span>
                  <span className="text-violet-400 font-bold">
                    Consistência temporal
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs p-2 bg-black/20 rounded-lg border border-neutral-800/50">
                  <span className="text-neutral-300">Questões resolvidas</span>
                  <span className="text-violet-400 font-bold">
                    Volume de prática
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Dica Pro */}
          <div className="bg-violet-600/10 border border-violet-600/20 rounded-xl p-4 flex gap-4">
            <div className="shrink-0 p-2 bg-violet-600/20 rounded-lg h-fit">
              <BookOpen className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-violet-300">
                Dica de Performance
              </p>
              <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                Use o <span className="text-white font-medium">Heatmap</span>{" "}
                para visualizar sua constância. Dias mais escuros representam
                maior volume de estudo, ajudando a identificar padrões de
                produtividade.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-800/60 bg-neutral-900/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            Entendi, vamos lá!
          </button>
        </div>
      </div>
    </div>
  );
}
