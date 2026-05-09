"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Info,
  Moon,
  Music,
  ShieldAlert,
  Volume2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface NotificationsTabProps {
  highPriorityNotifications: boolean;
  notifSleepBedtime: boolean;
  notifSleepBedtimeTime: string;
  notifSleepMorning: boolean;
  notifSleepMorningTime: string;
  notifHabitUncompleted: boolean;
  notifHabitTime: string;
  notifEventUpcoming: boolean;
  notifEventUpcomingTime: string;
  autoReadNotifications: boolean;
  notificationSound: string;
  updateConfig: (key: string, val: string | number | boolean) => Promise<void>;
  updateAutoReadNotifications: (val: boolean) => Promise<void>;
  handleTestNotification: () => void;
}

function NotifRow({
  icon: Icon,
  title,
  description,
  timeValue,
  timeKey,
  enabled,
  enabledKey,
  timeLabel,
  updateConfig,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  timeValue?: string;
  timeKey?: string;
  enabled: boolean;
  enabledKey: string;
  timeLabel?: string;
  updateConfig: (key: string, val: string | number | boolean) => Promise<void>;
}) {
  const [localTime, setLocalTime] = useState(timeValue || "");

  useEffect(() => {
    if (timeValue !== undefined) setLocalTime(timeValue);
  }, [timeValue]);

  const handleSave = () => {
    if (timeValue !== localTime && timeKey) updateConfig(timeKey, localTime);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
      (e.target as HTMLInputElement).blur();
    }
  };

  const hasChanges = timeValue !== localTime;

  return (
    <div className="p-5 bg-card border border-border rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-accent/50 rounded-xl text-muted-foreground">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={(v) => updateConfig(enabledKey, v)}
        />
      </div>

      {timeValue !== undefined && timeKey && (
        <div
          className={cn(
            "flex items-center gap-2 pl-14",
            !enabled && "opacity-40 pointer-events-none",
          )}
        >
          {timeLabel && (
            <span className="text-xs text-muted-foreground font-medium">
              {timeLabel}
            </span>
          )}
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={localTime}
              onChange={(e) => setLocalTime(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!enabled}
              className="bg-background border border-border/50 rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            {hasChanges && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleSave}
                className="h-8 w-8 bg-primary/10 text-primary"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function NotificationsTab({
  highPriorityNotifications,
  notifSleepBedtime,
  notifSleepBedtimeTime,
  notifHabitUncompleted,
  notifHabitTime,
  notifEventUpcoming,
  notifEventUpcomingTime,
  autoReadNotifications,
  updateConfig,
  updateAutoReadNotifications,
  handleTestNotification,
  notificationSound,
}: NotificationsTabProps) {
  const { themeStyles } = useTheme();
  const [availableSounds, setAvailableSounds] = useState<string[]>([]);

  useEffect(() => {
    invoke<string[]>("list_notification_sounds").then((sounds) => {
      setAvailableSounds(sounds);
      if (sounds.length > 0 && !sounds.includes(notificationSound)) {
        updateConfig("notificationSound", sounds[0]);
      }
    });
  }, [notificationSound, updateConfig]);

  const handleSoundChange = (val: string) => {
    updateConfig("notificationSound", val);
    new Audio(`/sounds/${val}`).play().catch(console.error);
  };

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      {/* Header Padronizado */}
      <section className="flex items-center gap-5">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            themeStyles.bg,
          )}
        >
          <Bell className={cn("w-7 h-7", themeStyles.text)} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Notificações</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie como o Aegis se comunica com você.
          </p>
        </div>
      </section>

      {/* Comportamento Geral */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground px-1">Geral</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl hover:bg-accent/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-accent/50 rounded-xl">
                <CheckCheck className="w-5 h-5 text-muted-foreground" />
              </div>
              <label htmlFor="auto-read-notif" className="cursor-pointer">
                <span className="text-sm font-bold block">
                  Leitura Automática
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Marcar como lidas ao abrir o painel.
                </p>
              </label>
            </div>
            <Switch
              id="auto-read-notif"
              checked={autoReadNotifications}
              onCheckedChange={updateAutoReadNotifications}
            />
          </div>

          <div className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-accent/50 rounded-xl">
                <ShieldAlert className="w-5 h-5 text-muted-foreground" />
              </div>
              <label htmlFor="high-priority-notif" className="cursor-pointer">
                <span className="text-sm font-bold block">
                  Prioridade Crítica
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Ignorar modo Foco do Windows.
                </p>
              </label>
            </div>
            <Switch
              id="high-priority-notif"
              checked={highPriorityNotifications}
              onCheckedChange={(v) =>
                updateConfig("highPriorityNotifications", v)
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-5 bg-accent/20 border border-dashed border-border rounded-2xl">
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">
              Verifique a entrega nativa enviando um sinal de teste.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleTestNotification}
            className="h-8 text-xs font-bold bg-foreground text-background hover:bg-foreground/90"
          >
            Enviar teste
          </Button>
        </div>
      </section>

      {/* Áudio */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground px-1">Áudio</h3>
        <div className="p-5 bg-card border border-border rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-accent/50 rounded-xl">
              <Music className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold">Som de Notificação</p>
              <p className="text-xs text-muted-foreground">
                Toque padrão para todos os alertas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={notificationSound} onValueChange={handleSoundChange}>
              <SelectTrigger className="w-[180px] h-10 text-xs font-bold bg-background border-border">
                <SelectValue placeholder="Som" />
              </SelectTrigger>
              <SelectContent>
                {availableSounds.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="text-xs cursor-pointer"
                  >
                    {s.replace(/\.[^/.]+$/, "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 border-border"
              onClick={() => new Audio(`/sounds/${notificationSound}`).play()}
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Lembretes Inteligentes */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground px-1">
          Lembretes Inteligentes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NotifRow
            icon={Moon}
            title="Hora de Dormir"
            description="Lembrete baseado no seu ciclo ideal."
            timeValue={notifSleepBedtimeTime}
            timeKey="notifSleepBedtimeTime"
            enabled={notifSleepBedtime}
            enabledKey="notifSleepBedtime"
            timeLabel="Avisar às:"
            updateConfig={updateConfig}
          />
          <NotifRow
            icon={Zap}
            title="Hábitos Pendentes"
            description="Alertar sobre rotinas não concluídas."
            timeValue={notifHabitTime}
            timeKey="notifHabitTime"
            enabled={notifHabitUncompleted}
            enabledKey="notifHabitUncompleted"
            timeLabel="Lembrar às:"
            updateConfig={updateConfig}
          />
          <NotifRow
            icon={Calendar}
            title="Eventos Próximos"
            description="Aviso diário de compromissos."
            timeValue={notifEventUpcomingTime}
            timeKey="notifEventUpcomingTime"
            enabled={notifEventUpcoming}
            enabledKey="notifEventUpcoming"
            timeLabel="Resumo às:"
            updateConfig={updateConfig}
          />
        </div>
      </section>
    </div>
  );
}
