"use client";

import { AlarmClock, Clock, Timer, Volume2 } from "lucide-react";
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
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { AlarmFormState } from "../hooks/useAlarmsLogic";
import { ALARM_COLOR_KEYS, AVAILABLE_ICONS } from "../types";

interface AlarmFormModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: AlarmFormState;
  availableSounds: string[];
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
  playPreview: (sound: string) => void;
}

export function AlarmFormModal({
  open,
  onOpenChange,
  form,
  availableSounds,
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
  playPreview,
}: AlarmFormModalProps) {
  const m = getColorTheme(getModuleColor("alarms"));
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";
  const inputStyle = cn(
    "w-full bg-card border-border h-11 rounded-xl text-sm font-medium transition-all placeholder:text-neutral-700 focus:outline-none focus:ring-2",
    m.text.replace("text-", "focus:ring-").replace("500", "500/20"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[850px]! w-[95vw] bg-background border-border p-0 overflow-hidden rounded-2xl flex flex-col max-h-[92vh]">
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
                Configuração de alerta
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-2 gap-10">
            {/* Coluna esquerda: definição do alerta */}
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label className={lc}>
                  Título do Alerta <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  value={form.title}
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
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label className={lc}>Som de Notificação</Label>
                <div className="flex items-center gap-2">
                  <Select value={form.soundFile} onValueChange={setSoundFile}>
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
                    onClick={() => playPreview(form.soundFile)}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label className={lc}>Identidade Visual</Label>

                {/* Seletor de cor */}
                <div className="flex flex-wrap gap-2 p-2 bg-background border border-border rounded-xl">
                  {ALARM_COLOR_KEYS.map((c) => {
                    const theme = getColorTheme(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 transition-all cursor-pointer",
                          theme.solid,
                          form.color === c
                            ? "border-foreground scale-110"
                            : "border-transparent opacity-60 hover:opacity-100",
                        )}
                      />
                    );
                  })}
                </div>

                {/* Seletor de ícone */}
                <div className="grid grid-cols-4 gap-2 p-2 bg-background border border-border rounded-xl">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setIconName(ic.name)}
                      className={cn(
                        "flex items-center justify-center py-2.5 rounded-lg border transition-all cursor-pointer",
                        form.iconName === ic.name
                          ? cn(m.bg, m.border, m.text)
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
              "flex-2 px-4 py-3 rounded-xl text-white font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
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
