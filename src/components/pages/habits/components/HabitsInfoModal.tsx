"use client";

import {
  CheckCircle2,
  HelpCircle,
  ShieldOff,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface HabitsInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function HabitsInfoModal({ show, onClose }: HabitsInfoModalProps) {
  useLockBodyScroll(show);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/10 rounded-xl border border-teal-500/20">
              <HelpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-none">
                Hábitos & Disciplina
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Guia para construção de rotina e autocontrole
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-5 h-4" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          {/* Hábitos Positivos */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400">
              <TrendingUp className="w-5 h-5" />
              <h3 className="font-bold text-foreground">Hábitos Positivos</h3>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fortaleça seus comportamentos produtivos acompanhando sua
                frequência e mantendo sequências (streaks):
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    label: "Cargas de Uso",
                    desc: "Defina quantas vezes pode fazer",
                  },
                  {
                    label: "Streaks",
                    desc: "Acompanhe sua sequência de dias",
                  },
                  {
                    label: "Intervalos",
                    desc: "Dias de descanso entre cada ação",
                  },
                  {
                    label: "Max Streak",
                    desc: "Bata seus próprios recordes",
                  },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-2 bg-black/20 p-2.5 rounded-lg border border-border/50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Controle de Vícios */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <ShieldOff className="w-5 h-5" />
              <h3 className="font-bold text-foreground">Controle de Vícios</h3>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Rastreie comportamentos negativos para eliminá-los. O sistema
                ajuda a monitorar o tempo desde o último deslize:
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs p-2 bg-black/20 rounded-lg border border-border/50">
                  <span className="text-muted-foreground">
                    Tempo de Abstinência
                  </span>
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    Contagem progressiva de dias
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs p-2 bg-black/20 rounded-lg border border-border/50">
                  <span className="text-muted-foreground">Botão de Reset</span>
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    Reinicia o contador em caso de falha
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Dica Pro */}
          <div className="bg-teal-600/10 border border-teal-600/20 rounded-xl p-4 flex gap-4">
            <div className="shrink-0 p-2 bg-teal-600/20 rounded-lg h-fit">
              <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-300">
                Lembretes Inteligentes
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Ative as{" "}
                <span className="text-foreground font-medium">
                  Notificações de Hábito
                </span>{" "}
                nas configurações. O Aegis avisará no final do dia caso você
                tenha esquecido de marcar uma tarefa importante.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/60 bg-card/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            Entendido, foco total!
          </button>
        </div>
      </div>
    </div>
  );
}
