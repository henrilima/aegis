"use client";

import {
  AlarmClock,
  Bell,
  CheckCircle2,
  Clock,
  HelpCircle,
  Timer,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface AlarmsInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function AlarmsInfoModal({ show, onClose }: AlarmsInfoModalProps) {
  useLockBodyScroll(show);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
              <HelpCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-none">
                Guia do Módulo de Alarmes
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Gerencie seus alertas e lembretes periódicos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          {/* Seção 1: Tipos de Alarme */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlarmClock className="w-5 h-5" />
              <h3 className="font-bold text-foreground">Tipos de Alerta</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-bold">Horário Fixo</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ideal para compromissos com hora marcada, como reuniões, doses
                  de medicamentos ou o fim do expediente. O alerta soará
                  exatamente no minuto configurado.
                </p>
              </div>
              <div className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-500">
                  <Timer className="w-4 h-4" />
                  <span className="text-sm font-bold">Intervalo</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Perfeito para hábitos repetitivos (hidratação, postura,
                  descanso ocular). Defina um horário de início e o Aegis
                  repetirá o alerta a cada X minutos.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 2: Personalização */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <Zap className="w-5 h-5" />
              <h3 className="font-bold text-foreground">Identidade & Som</h3>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cada alarme pode ter uma identidade única para que você saiba do
                que se trata sem precisar ler a notificação:
              </p>
              <ul className="space-y-3">
                {[
                  {
                    label: "Ícones Temáticos",
                    desc: "Escolha entre Café, Água, Sono e outros para identificar o alerta visualmente.",
                    icon: Bell,
                  },
                  {
                    label: "Sons Customizados",
                    desc: "Selecione o áudio que mais lhe agrada. O Aegis tocará o arquivo .mp3 escolhido.",
                    icon: Volume2,
                  },
                  {
                    label: "Notificações Críticas",
                    desc: "Alarmes usam o canal de alta prioridade do Aegis, garantindo que você não os perca.",
                    icon: CheckCircle2,
                  },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-3 bg-black/20 p-3 rounded-lg border border-border/50"
                  >
                    <item.icon className="w-4 h-4 text-red-500 mt-0.5" />
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

          {/* Dica Pro */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-4">
            <div className="shrink-0 p-2 bg-red-500/20 rounded-lg h-fit">
              <Zap className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-300">
                Dica de Produtividade
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Use alarmes de{" "}
                <span className="text-foreground font-medium">Intervalo</span>{" "}
                para implementar a técnica de Micro-pausas. Configure um alerta
                a cada 60 minutos para se alongar, melhorando sua circulação,
                foco e memória.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/60 bg-card/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-foreground text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            Tudo certo, vamos lá!
          </button>
        </div>
      </div>
    </div>
  );
}
