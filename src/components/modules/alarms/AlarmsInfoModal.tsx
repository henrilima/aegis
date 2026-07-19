"use client";

import {
  AlarmClock,
  Bell,
  CheckCircle2,
  Clock,
  Timer,
  Volume2,
  Zap,
} from "lucide-react";
import { ModuleGuideContainer } from "@/components/global/ModuleGuideContainer";
import { ModuleInfoModal } from "@/components/global/ModuleInfoModal";
import {
  InfoSection,
  ProTip,
  useModuleColor,
} from "@/components/global/ModuleInfoParts";
import { cn, type ThemeColorKey } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface AlarmsInfoModalProps {
  show: boolean;
  onClose: () => void;
}

function AlarmTypes() {
  const { theme } = useModuleColor();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        {
          icon: Clock,
          label: "Horário Fixo",
          desc: "Ideal para compromissos com hora marcada, como reuniões, doses de medicamentos ou o fim do expediente. O alerta soará exatamente no minuto configurado.",
        },
        {
          icon: Timer,
          label: "Intervalo",
          desc: "Perfeito para hábitos repetitivos (hidratação, postura, descanso ocular). Defina um horário de início e o Aegis repetirá o alerta a cada X minutos.",
        },
      ].map((item) => (
        <div
          key={item.label}
          className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-2"
        >
          <div className={cn("flex items-center gap-2", theme.text)}>
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-bold">{item.label}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

function SoundFeatures() {
  const { theme } = useModuleColor();
  return (
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
          <item.icon className={cn("w-4 h-4 mt-0.5 shrink-0", theme.text)} />
          <div>
            <p className="text-xs font-bold text-foreground">{item.label}</p>
            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AlarmsInfoModal({ show, onClose }: AlarmsInfoModalProps) {
  const moduleColor = getModuleColor("alarms");
  return (
    <ModuleInfoModal
      show={show}
      onClose={onClose}
      color={moduleColor}
      title="Guia do Módulo de Alarmes"
      subtitle="Gerencie seus alertas e lembretes periódicos"
      closeLabel="Tudo certo, vamos lá!"
    >
      <AlarmsGuideContent />
    </ModuleInfoModal>
  );
}

export function AlarmsGuidePanel({ onBack }: { onBack?: () => void }) {
  return (
    <ModuleGuideContainer
      color={getModuleColor("alarms") as ThemeColorKey}
      icon={AlarmClock}
      title="Guia do Módulo de Alarmes"
      subtitle="Gerencie seus alertas e lembretes periódicos"
      onBack={onBack}
    >
      <AlarmsGuideContent />
    </ModuleGuideContainer>
  );
}

function AlarmsGuideContent() {
  return (
    <>
      <InfoSection icon={AlarmClock} title="Tipos de Alerta">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Dois modos para atender a diferentes necessidades:
        </p>
        <AlarmTypes />
      </InfoSection>

      <InfoSection icon={Zap} title="Identidade & Som">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cada alarme pode ter uma identidade única para que você saiba do que
          se trata sem precisar ler a notificação:
        </p>
        <SoundFeatures />
      </InfoSection>

      <ProTip title="Dica de Produtividade">
        Use alarmes de{" "}
        <span className="text-foreground font-medium">Intervalo</span> para
        implementar a técnica de Micro-pausas. Configure um alerta a cada 60
        minutos para se alongar, melhorando sua circulação, foco e memória.
      </ProTip>
    </>
  );
}
