"use client";

import {
  AlarmClock,
  Bell,
  Clock,
  MessageSquare,
  Monitor,
  Timer,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ColorPicker } from "@/components/global/ColorPicker";
import { IconSelect } from "@/components/global/IconSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type AudioOption,
  getAudioOptions,
  soundLabel,
  stopNotificationSound,
} from "@/lib/sounds";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { AlarmFormState } from "../hooks/useAlarmsLogic";

interface AlarmFormModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: AlarmFormState;
  availableSounds?: string[];
  audioOptions?: AudioOption[];
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
  setTitle: (v: string) => void;
  setAlarmType: (v: string) => void;
  setTime: (v: string) => void;
  setIntervalMinutes: (v: number) => void;
  setSoundFile: (v: string) => void;
  setIconName: (v: string) => void;
  setColor: (v: string) => void;
  setTriggerMode: (v: string) => void;
  playPreview: (sound: string) => void;
}

export function AlarmFormModal({
  open,
  onOpenChange,
  form,
  audioOptions,
  isSaving,
  onSave,
  onCancel,
  setTitle,
  setAlarmType,
  setTime,
  setIntervalMinutes,
  setSoundFile,
  setIconName,
  setColor,
  setTriggerMode,
  playPreview,
}: AlarmFormModalProps) {
  const defaultColor = getModuleColor("alarms");
  const activeColor = form.color || defaultColor;
  const m = getColorTheme(activeColor);
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";
  const inputStyle = cn(
    "w-full bg-card border-border h-11 rounded-xl text-sm font-medium transition-all placeholder:text-neutral-700 focus:outline-none focus:ring-2",
    m.text.replace("text-", "focus:ring-").replace("500", "500/20"),
  );

  const [dynamicOptions, setDynamicOptions] = useState<AudioOption[]>([]);

  useEffect(() => {
    if (open) {
      getAudioOptions().then(setDynamicOptions).catch(console.error);
    }
  }, [open]);

  // Parar qualquer áudio prévio quando o modal fechar ou desmontar
  useEffect(() => {
    if (!open) {
      stopNotificationSound();
    }
    return () => {
      stopNotificationSound();
    };
  }, [open]);

  const baseOptions = audioOptions?.length ? audioOptions : dynamicOptions;
  const optionsMap = new Map<string, AudioOption>();

  for (const opt of baseOptions) {
    optionsMap.set(opt.value, opt);
  }

  // Se o alarme atual possui um som selecionado que ainda não esteja no mapa, preserva-o!
  if (form.soundFile && !optionsMap.has(form.soundFile)) {
    optionsMap.set(form.soundFile, {
      value: form.soundFile,
      label: soundLabel(form.soundFile),
    });
  }

  const allSoundOptions = Array.from(optionsMap.values());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-200! w-[95vw] bg-background border-border p-0 overflow-hidden rounded-2xl flex flex-col max-h-[92vh]">
        <DialogHeader className="p-6 border-b border-border/50 shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl border", m.bg, m.border)}>
              <AlarmClock className={cn("w-5 h-5", m.text)} />
            </div>
            <div>
              <span className="block text-lg font-bold leading-none">
                {form.editingId ? "Editar Alarme" : "Novo Alarme"}
              </span>
              <span className="block text-[10px] text-muted-foreground mt-1 font-medium">
                Configuração de alerta despertador nativo
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna esquerda: definição do alerta */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className={lc}>
                  Título do Alerta <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Hora de Estudar, Tomar Remédio..."
                  className={inputStyle}
                />
              </div>

              {/* Modo de Exibição/Disparo */}
              <div className="space-y-1.5">
                <Label className={lc}>
                  Modos de Disparo (Selecione um ou mais)
                </Label>
                <div className="grid grid-cols-3 p-1 bg-background border border-border rounded-xl gap-1">
                  {(() => {
                    const activeModes = form.triggerMode
                      ? form.triggerMode.split(",").map((s) => s.trim())
                      : ["widget"];

                    const toggleMode = (modeId: string) => {
                      let updated: string[];
                      if (activeModes.includes(modeId)) {
                        if (activeModes.length === 1) return;
                        updated = activeModes.filter((m) => m !== modeId);
                      } else {
                        updated = [...activeModes, modeId];
                      }
                      setTriggerMode(updated.join(","));
                    };

                    return [
                      { id: "widget", label: "Widget", icon: Monitor },
                      { id: "system", label: "Sistema", icon: Bell },
                      { id: "in_app", label: "In-App", icon: MessageSquare },
                    ].map((opt) => {
                      const isSelected = activeModes.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleMode(opt.id)}
                          className={cn(
                            "flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border",
                            isSelected
                              ? cn(m.bg, m.border, m.text)
                              : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground opacity-60 hover:opacity-100",
                          )}
                        >
                          <opt.icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Tipo de Alerta */}
              <div className="flex flex-col gap-1.5">
                <Label className={lc}>Frequência de Horário</Label>
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
                        form.alarmType === opt.id
                          ? cn(m.bg, m.border, m.text)
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
                    {form.alarmType === "fixed" ? "Horário" : "Início às"}{" "}
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setTime(e.target.value)}
                    className={inputStyle}
                  />
                </div>

                {form.alarmType === "interval" && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <Label className={lc}>Repetir a cada (minutos)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="1440"
                      value={form.intervalMinutes}
                      onChange={(e) =>
                        setIntervalMinutes(parseInt(e.target.value, 10) || 1)
                      }
                      className={inputStyle}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Coluna direita: identidade e som */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label className={lc}>Som do alarme (loop contínuo)</Label>
                <div className="flex items-center gap-2">
                  <Select value={form.soundFile} onValueChange={setSoundFile}>
                    <SelectTrigger className="bg-card border-border rounded-xl h-11 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {allSoundOptions.map((s) => (
                        <SelectItem
                          key={s.value}
                          value={s.value}
                          className="text-xs"
                        >
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl border-border h-11 w-11 shrink-0 bg-card cursor-pointer"
                    onClick={() => playPreview(form.soundFile)}
                    title="Ouvir som prévio"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label className={lc}>Ícone Global (Sistema Aegis)</Label>
                <IconSelect
                  value={form.iconName}
                  onChange={setIconName}
                  color={activeColor}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={lc}>Cor do Tema</Label>
                <ColorPicker
                  value={form.color || ""}
                  onChange={(c) => setColor(c)}
                  placeholder="Padrão do Módulo"
                  defaultColor={defaultColor}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border shrink-0 bg-background/50">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              "flex-2 px-4 py-3 rounded-xl text-white font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-none",
              m.solid,
              m.solidHover,
            )}
          >
            {isSaving
              ? "Salvando..."
              : form.editingId
                ? "Salvar Alterações"
                : "Criar Alarme Agora"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
