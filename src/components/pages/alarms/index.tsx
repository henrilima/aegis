"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  AlarmClock,
  Bell,
  Clock,
  Cloud,
  Coffee,
  Droplet,
  Flame,
  Ghost,
  Heart,
  HelpCircle,
  Moon,
  Music,
  Plus,
  Settings2,
  Shield,
  Star,
  Sun,
  Timer,
  Trash2,
  Utensils,
  Volume2,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlarmsInfoModal } from "@/components/pages/alarms/AlarmsInfoModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";

export interface AppAlarm {
  id?: number;
  user_id: string;
  title: string;
  alarm_type: string;
  time: string;
  interval_minutes: number | null;
  last_triggered: string | null;
  sound_file: string;
  icon: string;
  color: string | null;
  enabled: boolean;
}

const AVAILABLE_ICONS = [
  { name: "Bell", icon: Bell },
  { name: "AlarmClock", icon: AlarmClock },
  { name: "Droplet", icon: Droplet },
  { name: "Activity", icon: Activity },
  { name: "Moon", icon: Moon },
  { name: "Coffee", icon: Coffee },
  { name: "Zap", icon: Zap },
  { name: "Heart", icon: Heart },
  { name: "Flame", icon: Flame },
  { name: "Star", icon: Star },
  { name: "Sun", icon: Sun },
  { name: "Cloud", icon: Cloud },
  { name: "Music", icon: Music },
  { name: "Utensils", icon: Utensils },
  { name: "Shield", icon: Shield },
  { name: "Ghost", icon: Ghost },
];

const ALARM_COLORS: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    hoverBorder: string;
    solid: string;
    solidHover: string;
  }
> = {
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-500",
    hoverBorder: "hover:border-red-500/30",
    solid: "bg-red-500",
    solidHover: "hover:bg-red-600",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-500",
    hoverBorder: "hover:border-orange-500/30",
    solid: "bg-orange-500",
    solidHover: "hover:bg-orange-600",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-500",
    hoverBorder: "hover:border-amber-500/30",
    solid: "bg-amber-500",
    solidHover: "hover:bg-amber-600",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-500",
    hoverBorder: "hover:border-emerald-500/30",
    solid: "bg-emerald-500",
    solidHover: "hover:bg-emerald-600",
  },
  teal: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    text: "text-teal-500",
    hoverBorder: "hover:border-teal-500/30",
    solid: "bg-teal-500",
    solidHover: "hover:bg-teal-600",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-500",
    hoverBorder: "hover:border-blue-500/30",
    solid: "bg-blue-500",
    solidHover: "hover:bg-blue-600",
  },
  sky: {
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    text: "text-sky-500",
    hoverBorder: "hover:border-sky-500/30",
    solid: "bg-sky-500",
    solidHover: "hover:bg-sky-600",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-500",
    hoverBorder: "hover:border-purple-500/30",
    solid: "bg-purple-500",
    solidHover: "hover:bg-purple-600",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    text: "text-violet-500",
    hoverBorder: "hover:border-violet-500/30",
    solid: "bg-violet-500",
    solidHover: "hover:bg-violet-600",
  },
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    text: "text-pink-500",
    hoverBorder: "hover:border-pink-500/30",
    solid: "bg-pink-500",
    solidHover: "hover:bg-pink-600",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-500",
    hoverBorder: "hover:border-rose-500/30",
    solid: "bg-rose-500",
    solidHover: "hover:bg-rose-600",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-500",
    hoverBorder: "hover:border-indigo-500/30",
    solid: "bg-indigo-500",
    solidHover: "hover:bg-indigo-600",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-500",
    hoverBorder: "hover:border-cyan-500/30",
    solid: "bg-cyan-500",
    solidHover: "hover:bg-cyan-600",
  },
};

export default function AlarmsPage() {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState<AppAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [availableSounds, setAvailableSounds] = useState<string[]>([]);

  // Estado do Formulário
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [alarmType, setAlarmType] = useState("fixed");
  const [time, setTime] = useState("09:00");
  const [intervalMinutes, setIntervalMinutes] = useState<number>(30);
  const [soundFile, setSoundFile] = useState("Plin.mp3");
  const [iconName, setIconName] = useState("Bell");
  const [color, setColor] = useState<string>("red");

  const uid = user ? String(user.id) : "";

  const fetchAlarms = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await invoke<AppAlarm[]>("list_alarms", { userId: uid });
      setAlarms(res);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar alarmes");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchAlarms();
    invoke<string[]>("list_notification_sounds")
      .then(setAvailableSounds)
      .catch(console.error);
  }, [fetchAlarms]);

  const handleSave = async () => {
    if (!title || !time || !uid) return toast.error("Preencha todos os campos");

    try {
      const originalAlarm = alarms.find((a) => a.id === editingId);
      const hasTimingChanged =
        originalAlarm &&
        (originalAlarm.time !== time ||
          originalAlarm.interval_minutes !== intervalMinutes ||
          originalAlarm.alarm_type !== alarmType);

      const alarmData = {
        id: editingId || undefined,
        user_id: uid,
        title: title.trim(),
        alarm_type: alarmType,
        time,
        interval_minutes: alarmType === "interval" ? intervalMinutes : null,
        last_triggered: editingId
          ? hasTimingChanged
            ? null
            : originalAlarm?.last_triggered
          : null,
        sound_file: soundFile,
        icon: iconName,
        color: color,
        enabled: true,
      };

      if (editingId) {
        await invoke("update_alarm", { alarm: alarmData });
        toast.success("Alarme atualizado!");
      } else {
        await invoke("add_alarm", { alarm: alarmData });
        toast.success("Alarme programado!");
      }

      resetForm();
      fetchAlarms();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar alarme");
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setTitle("");
    setAlarmType("fixed");
    setTime("09:00");
    setIntervalMinutes(30);
    setSoundFile("Plin.mp3");
    setIconName("Bell");
    setColor("red");
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("delete_alarm", { id, userId: uid });
      fetchAlarms();
      toast.success("Alarme removido");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
    try {
      await invoke("toggle_alarm", { id, userId: uid });
    } catch {
      fetchAlarms();
      toast.error("Erro ao alterar status");
    }
  };

  const handleEdit = (alarm: AppAlarm) => {
    setEditingId(alarm.id || null);
    setTitle(alarm.title);
    setAlarmType(alarm.alarm_type);
    setTime(alarm.time);
    setIntervalMinutes(alarm.interval_minutes || 30);
    setSoundFile(alarm.sound_file);
    setIconName(alarm.icon);
    setColor(alarm.color || "red");
    setIsModalOpen(true);
  };

  const playPreview = (sound: string) => {
    const audio = new Audio(`/sounds/${sound}`);
    audio
      .play()
      .catch(() => new Audio(`sounds/${sound}`).play().catch(console.error));
  };

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse font-bold">
          <AlarmClock className="w-4 h-4" /> Carregando alertas...
        </div>
      </div>
    );

  const m = getColorTheme("red");
  const inputStyle =
    "w-full bg-card border-border h-11 rounded-xl text-sm font-medium focus:border-red-500/20 transition-all placeholder:text-neutral-700";
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <div className="w-full h-full flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-foreground px-1">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-xl border transition-all",
              m.bg,
              m.border,
            )}
          >
            <AlarmClock className={cn("w-5 h-5", m.text)} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">
              Alarmes & Alertas
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {alarms.filter((a) => a.enabled).length} ativos de {alarms.length}{" "}
              totais
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToolTip content="Guia do Módulo">
            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent/50 transition-all cursor-pointer text-xs font-bold border border-border text-muted-foreground hover:text-red-500"
            >
              <HelpCircle className="w-4 h-4" />
              Guia
            </button>
          </ToolTip>
          <ToolTip content="Criar novo alarme">
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-white font-bold transition-all active:scale-95",
                m.solid,
                m.solidHover,
              )}
            >
              <Plus className="w-4 h-4 mr-2" /> Novo Alarme
            </Button>
          </ToolTip>
        </div>
      </div>

      <AlarmsInfoModal show={isInfoOpen} onClose={() => setIsInfoOpen(false)} />

      {/* Modal Padronizado */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[850px]! w-[95vw] bg-background border-border p-0 overflow-hidden rounded-2xl flex flex-col max-h-[92vh]">
          <DialogHeader className="p-6 border-b border-border/50 shrink-0">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlarmClock className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <span className="block text-lg font-bold leading-none">
                  {editingId ? "Editar Alarme" : "Novo Alarme"}
                </span>
                <span className="block text-[10px] text-muted-foreground mt-1 font-medium">
                  Configuração de alerta
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-2 gap-10">
              {/* Coluna Esquerda: Definição do Alerta */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className={lc}>
                    Título do Alerta{" "}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Beber Água, Remédio..."
                    className={inputStyle}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <Label className={lc}>Tipo de Alerta</Label>
                  <div className="flex p-1 bg-background border border-border rounded-xl gap-1">
                    {[
                      { id: "fixed", label: "Horário Fixo", icon: Clock },
                      { id: "interval", label: "Intervalo", icon: Timer },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAlarmType(opt.id)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                          alarmType === opt.id
                            ? "bg-red-500/10 border-red-500/30 text-red-500"
                            : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                        )}
                      >
                        <opt.icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className={lc}>
                      {alarmType === "fixed" ? "Horário" : "Início às"}{" "}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={inputStyle}
                    />
                  </div>

                  {alarmType === "interval" && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                      <Label className={lc}>Repetir a cada (minutos)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="1440"
                        value={intervalMinutes}
                        onChange={(e) =>
                          setIntervalMinutes(parseInt(e.target.value, 10) || 1)
                        }
                        className={inputStyle}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna Direita: Identidade e Som */}
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className={lc}>Som de Notificação</Label>
                  <div className="flex items-center gap-2">
                    <Select value={soundFile} onValueChange={setSoundFile}>
                      <SelectTrigger className="bg-card border-border rounded-xl h-11 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {availableSounds.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s.replace(".mp3", "")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl border-border h-11 w-11 shrink-0 bg-card"
                      onClick={() => playPreview(soundFile)}
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className={lc}>Identidade Visual</Label>
                  <div className="flex flex-wrap gap-2 p-2 bg-background border border-border rounded-xl">
                    {[
                      "red",
                      "orange",
                      "amber",
                      "emerald",
                      "teal",
                      "blue",
                      "sky",
                      "purple",
                      "violet",
                      "pink",
                      "rose",
                      "indigo",
                      "cyan",
                    ].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all cursor-pointer",
                          color === c
                            ? "border-foreground scale-110"
                            : "border-transparent opacity-60 hover:opacity-100",
                          c === "red" && "bg-red-500",
                          c === "orange" && "bg-orange-500",
                          c === "amber" && "bg-amber-500",
                          c === "emerald" && "bg-emerald-500",
                          c === "teal" && "bg-teal-500",
                          c === "blue" && "bg-blue-500",
                          c === "sky" && "bg-sky-500",
                          c === "purple" && "bg-purple-500",
                          c === "violet" && "bg-violet-500",
                          c === "pink" && "bg-pink-500",
                          c === "rose" && "bg-rose-500",
                          c === "indigo" && "bg-indigo-500",
                          c === "cyan" && "bg-cyan-500",
                        )}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2 p-2 bg-background border border-border rounded-xl">
                    {AVAILABLE_ICONS.map((ic) => (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setIconName(ic.name)}
                        className={cn(
                          "flex items-center justify-center py-2.5 rounded-lg border transition-all cursor-pointer",
                          iconName === ic.name
                            ? `${ALARM_COLORS[color].bg} ${ALARM_COLORS[color].border} ${ALARM_COLORS[color].text}`
                            : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                        )}
                      >
                        <ic.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações Padronizadas do Rodapé */}
          <div className="flex gap-3 p-6 border-t border-border shrink-0 bg-background/50">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={cn(
                "flex-2 px-4 py-3 rounded-xl text-white font-bold text-xs transition-all active:scale-95 cursor-pointer",
                m.solid,
                m.solidHover,
              )}
            >
              {editingId ? "Salvar Alterações" : "Criar Alarme Agora"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Grid de Alarmes */}
      {alarms.length === 0 ? (
        <EmptyState
          icon={AlarmClock}
          title="Silêncio total por aqui"
          description="Você ainda não tem nenhum alarme configurado. Crie lembretes personalizados para não esquecer de nada importante."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alarms.map((a) => {
            const IconComp =
              AVAILABLE_ICONS.find((i) => i.name === a.icon)?.icon || Bell;
            return (
              <div
                key={a.id}
                className={cn(
                  "group bg-card border border-border rounded-2xl p-5 hover:border-border transition-all relative overflow-hidden",
                  !a.enabled && "opacity-75",
                  a.enabled &&
                    (ALARM_COLORS[a.color || "red"]?.hoverBorder ||
                      "hover:border-red-500/30"),
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-2xl border transition-all",
                        a.enabled
                          ? `${ALARM_COLORS[a.color || "red"].bg} ${ALARM_COLORS[a.color || "red"].border} ${ALARM_COLORS[a.color || "red"].text}`
                          : "bg-accent border-border text-muted-foreground",
                      )}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-base font-medium leading-tight">
                        {a.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {a.alarm_type === "fixed" ? (
                          <Clock className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <Timer
                            className={cn(
                              "w-3 h-3",
                              ALARM_COLORS[a.color || "red"].text,
                            )}
                          />
                        )}
                        <span className="text-xs text-muted-foreground font-medium">
                          {a.alarm_type === "fixed"
                            ? a.time
                            : `A cada ${a.interval_minutes}m (a partir das ${a.time})`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={a.enabled}
                    onCheckedChange={(val) => a.id && handleToggle(a.id, val)}
                  />
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                    <Volume2 className="w-3 h-3" />
                    {a.sound_file.replace(".mp3", "")}
                  </div>

                  <div className="flex bg-background/50 rounded-xl border border-border overflow-hidden shrink-0">
                    <ToolTip content="Editar">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "p-2.5 text-neutral-600 transition-all border-r border-border active:scale-95",
                          `hover:bg-${a.color}-600/10 hover:text-${a.color}-500`,
                        )}
                        onClick={() => handleEdit(a)}
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </Button>
                    </ToolTip>
                    <ToolTip content="Excluir">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="p-2.5 hover:bg-rose-600/10 hover:text-rose-500 text-neutral-600 transition-all active:scale-95"
                        onClick={() => a.id && handleDelete(a.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </ToolTip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
