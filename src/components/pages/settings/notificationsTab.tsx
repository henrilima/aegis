"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  ExternalLink,
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
  iconBg,
  iconColor,
  title,
  description,
  timeValue,
  timeKey,
  enabled,
  enabledKey,
  timeLabel,
  readOnly,
  readOnlyHint,
  updateConfig,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  timeValue?: string;
  timeKey?: string;
  enabled: boolean;
  enabledKey: string;
  timeLabel?: string;
  readOnly?: boolean;
  readOnlyHint?: string;
  updateConfig: (key: string, val: string | number | boolean) => Promise<void>;
}) {
  const [localTime, setLocalTime] = useState(timeValue || "");

  // Sincroniza o estado local quando o valor externo muda (vido do backend)
  useEffect(() => {
    if (timeValue !== undefined) {
      setLocalTime(timeValue);
    }
  }, [timeValue]);

  const handleSave = () => {
    if (timeValue !== localTime && timeKey) {
      updateConfig(timeKey, localTime);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
      (e.target as HTMLInputElement).blur();
    }
  };

  const hasChanges = timeValue !== localTime;

  return (
    <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBg} ${iconColor} rounded-xl`}>
            <Icon className="w-4 h-4" />
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
          className={`flex items-center gap-2 pt-1 pl-1 ${!enabled ? "opacity-40 pointer-events-none" : ""}`}
        >
          {timeLabel && (
            <span className="text-xs text-muted-foreground font-medium min-w-max">
              {timeLabel}
            </span>
          )}
          {readOnly ? (
            <div className="flex items-center gap-2">
              <span className="bg-muted/50 border border-border/50 rounded-lg px-3 py-1 text-sm text-foreground font-mono">
                {timeValue}
              </span>
              {readOnlyHint && (
                <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                  <Info className="w-3 h-3" /> {readOnlyHint}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={localTime}
                onChange={(e) => setLocalTime(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!enabled}
                className="bg-background/80 border border-border/50 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:opacity-50 font-mono transition-all hover:border-border cursor-pointer ring-offset-background"
              />
              {hasChanges && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSave}
                  className="h-8 w-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 animate-in fade-in zoom-in duration-200"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NotificationsTab({
  highPriorityNotifications,
  notifSleepBedtime,
  notifSleepBedtimeTime,
  notifSleepMorning,
  notifSleepMorningTime,
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
    invoke<string[]>("list_notification_sounds")
      .then((sounds) => {
        setAvailableSounds(sounds);
        if (sounds.length > 0 && !sounds.includes(notificationSound)) {
          // Se o som atual não existe, seleciona o primeiro da lista
          updateConfig("notification_sound", sounds[0]);
        }
      })
      .catch(console.error);
  }, [notificationSound, updateConfig]);

  const handleSoundChange = (val: string) => {
    updateConfig("notification_sound", val);
    // Toca o som para preview
    const audio = new Audio(`/sounds/${val}`);
    audio.play().catch(() => {
      new Audio(`sounds/${val}`).play().catch(console.error);
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${themeStyles.bg} ${themeStyles.text}`}>
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">
            Central de Notificações
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie todos os lembretes e alertas do Aegis
          </p>
        </div>
      </div>

      {/* Comportamento Geral */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground">
          Comportamento geral
        </h3>

        <label
          className={`w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-card/80 transition-all cursor-pointer`}
          htmlFor="auto-read-notif"
        >
          <div className="flex items-center gap-3 flex-1 pr-4">
            <div className="p-2 bg-muted rounded-xl">
              <CheckCheck className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <span className="text-sm font-bold cursor-pointer">
                Marcar como lidas automaticamente
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                As notificações serão marcadas assim que você abrir o painel.
              </p>
            </div>
          </div>
          <Switch
            id="auto-read-notif"
            checked={autoReadNotifications}
            onCheckedChange={updateAutoReadNotifications}
          />
        </label>

        <div className="p-4 bg-card border border-border rounded-xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2.5 bg-accent rounded-xl shrink-0">
                <ShieldAlert className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">
                  Prioridade Crítica (Windows)
                </p>
                <p className="text-xs text-muted-foreground">
                  Exibir alertas mesmo em modo Foco/Não Perturbe.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => invoke("open_notification_settings")}
                className="h-8 text-xs font-bold border-border/50 hover:bg-accent/50 cursor-pointer shrink-0"
              >
                <ExternalLink className="w-3 h-3 mr-1.5" />
                Ajustes OS
              </Button>
              <Switch
                checked={highPriorityNotifications}
                onCheckedChange={(v) =>
                  updateConfig("high_priority_notifications", v)
                }
              />
            </div>
          </div>

          <div className="h-px bg-border/50" />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent rounded-xl shrink-0">
                <Bell className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">Sinal de Teste</p>
                <p className="text-xs text-muted-foreground">
                  Verificar entrega de notificações no Windows.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleTestNotification}
              className="h-8 text-xs font-bold bg-accent text-foreground cursor-pointer hover:bg-accent/80 shrink-0"
            >
              Enviar Teste
            </Button>
          </div>
        </div>
      </section>

      {/* Seleção de Som */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5" /> Áudio
        </h3>
        <div className="p-4 bg-card border border-border rounded-xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent rounded-xl shrink-0">
                <Music className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">Som de Notificação</p>
                <p className="text-xs text-muted-foreground">
                  Toque padrão para alertas internos e do sistema.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={notificationSound}
                onValueChange={(val) => handleSoundChange(val)}
              >
                <SelectTrigger className="w-[180px] h-9 text-xs font-bold bg-background border-border/50">
                  <SelectValue placeholder="Selecione um som" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-border/50">
                  {availableSounds.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="text-xs font-medium focus:bg-accent cursor-pointer"
                    >
                      {s.replace(/\.[^/.]+$/, "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border/50 hover:bg-accent/50 cursor-pointer"
                onClick={() => {
                  const audio = new Audio(`/sounds/${notificationSound}`);
                  audio.play().catch(console.error);
                }}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Módulo de Sono */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
          <Moon className="w-3.5 h-3.5" /> Sono
        </h3>

        <NotifRow
          icon={Moon}
          iconBg="bg-indigo-500/10"
          iconColor="text-indigo-500"
          title="Aviso de Hora de Dormir"
          description="Notificação baseada no seu horário ideal de repouso."
          timeValue={notifSleepBedtimeTime}
          timeKey="notif_sleep_bedtime_time"
          enabled={notifSleepBedtime}
          enabledKey="notif_sleep_bedtime"
          timeLabel="Horário do aviso:"
          updateConfig={updateConfig}
        />

        <NotifRow
          icon={Moon}
          iconBg="bg-indigo-500/10"
          iconColor="text-indigo-500"
          title="Aviso Matinal de Sono"
          description="Lembrete ao abrir o app se o sono de ontem não foi registrado."
          timeValue={notifSleepMorningTime}
          timeKey="notif_sleep_morning_time"
          enabled={notifSleepMorning}
          enabledKey="notif_sleep_morning"
          timeLabel="Verificar a partir de:"
          updateConfig={updateConfig}
        />
      </section>

      {/* Módulo de Hábitos */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
          <Zap className="w-3.5 h-3.5" /> Hábitos
        </h3>

        <NotifRow
          icon={Zap}
          iconBg="bg-teal-500/10"
          iconColor="text-teal-500"
          title="Hábitos Pendentes"
          description="Aviso quando o dia está acabando e você não concluiu hábitos positivos."
          timeValue={notifHabitTime}
          timeKey="notif_habit_time"
          enabled={notifHabitUncompleted}
          enabledKey="notif_habit_uncompleted"
          timeLabel="Horário do lembrete:"
          updateConfig={updateConfig}
        />
      </section>

      {/* Módulo de Eventos */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" /> Calendário e eventos
        </h3>

        <NotifRow
          icon={Calendar}
          iconBg="bg-rose-500/10"
          iconColor="text-rose-500"
          title="Lembretes de Eventos"
          description="Aviso um dia antes e 1 hora antes de cada evento no calendário."
          timeValue={notifEventUpcomingTime}
          timeKey="notif_event_upcoming_time"
          enabled={notifEventUpcoming}
          enabledKey="notif_event_upcoming"
          timeLabel="Aviso diário do dia anterior às:"
          updateConfig={updateConfig}
        />
      </section>

      {/* Nota informativa */}
      <div className="flex gap-2 p-3 border border-dashed border-border rounded-xl text-[11px] text-muted-foreground">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p>
          Todas as notificações ativas são enviadas tanto para o painel interno
          do Aegis quanto como notificações nativas do Windows. Ative a{" "}
          <strong>Prioridade Crítica</strong> acima para recebê-las mesmo com o
          modo Foco ativado.
        </p>
      </div>
    </div>
  );
}
