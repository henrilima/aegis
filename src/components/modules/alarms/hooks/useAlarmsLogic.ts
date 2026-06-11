"use client";

import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { listNotificationSounds, playNotificationSound } from "@/lib/sounds";
import type { AppAlarm } from "../types";

export interface AlarmFormState {
  editingId: number | null;
  title: string;
  alarmType: string;
  time: string;
  intervalMinutes: number;
  soundFile: string;
  iconName: string;
  color: string;
}

const DEFAULT_FORM: AlarmFormState = {
  editingId: null,
  title: "",
  alarmType: "fixed",
  time: "09:00",
  intervalMinutes: 30,
  soundFile: "Plin.mp3",
  iconName: "Bell",
  color: "",
};

export function useAlarmsLogic() {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";

  const [alarms, setAlarms] = useState<AppAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableSounds, setAvailableSounds] = useState<string[]>([]);
  const [form, setForm] = useState<AlarmFormState>(DEFAULT_FORM);

  // Setters individuais para simplificar o uso nos inputs controlados
  const setTitle = (v: string) => setForm((f) => ({ ...f, title: v }));
  const setAlarmType = (v: string) => setForm((f) => ({ ...f, alarmType: v }));
  const setTime = (v: string) => setForm((f) => ({ ...f, time: v }));
  const setIntervalMinutes = (v: number) =>
    setForm((f) => ({ ...f, intervalMinutes: v }));
  const setSoundFile = (v: string) => setForm((f) => ({ ...f, soundFile: v }));
  const setIconName = (v: string) => setForm((f) => ({ ...f, iconName: v }));
  const setColor = (v: string) => setForm((f) => ({ ...f, color: v }));

  const fetchAlarms = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await invoke<AppAlarm[]>("alarm_list_alarms", {
        userId: uid,
      });
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
    listNotificationSounds().then(setAvailableSounds).catch(console.error);
  }, [fetchAlarms]);

  const handleSave = async () => {
    if (isSaving) return;
    if (!form.title || !form.time || !uid)
      return toast.error("Preencha todos os campos");

    try {
      setIsSaving(true);
      const originalAlarm = alarms.find((a) => a.id === form.editingId);

      // Reseta o lastTriggered apenas se o horário ou tipo mudaram para evitar
      // disparos imediatos desnecessários ao salvar alterações sem mudança de tempo
      const hasTimingChanged =
        originalAlarm &&
        (originalAlarm.time !== form.time ||
          originalAlarm.intervalMinutes !== form.intervalMinutes ||
          originalAlarm.alarmType !== form.alarmType);

      const alarmData = {
        id: form.editingId || undefined,
        userId: uid,
        title: form.title.trim(),
        alarmType: form.alarmType,
        time: form.time,
        intervalMinutes:
          form.alarmType === "interval" ? form.intervalMinutes : null,
        lastTriggered: form.editingId
          ? hasTimingChanged
            ? null
            : originalAlarm?.lastTriggered
          : null,
        soundFile: form.soundFile,
        icon: form.iconName,
        color: form.color,
        enabled: true,
      };

      if (form.editingId) {
        await invoke("alarm_update_alarm", { alarm: alarmData });
        toast.success("Alarme atualizado!");
      } else {
        await invoke("alarm_add_alarm", { alarm: alarmData });
        toast.success("Alarme programado!");
      }

      resetForm();
      fetchAlarms();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar alarme");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setIsModalOpen(false);
    setForm(DEFAULT_FORM);
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("alarm_delete_alarm", { id, userId: uid });
      fetchAlarms();
      toast.success("Alarme removido");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  const handleBulkDelete = async (ids: number[]) => {
    if (!ids.length) return;
    try {
      for (const id of ids) {
        await invoke("alarm_delete_alarm", { id, userId: uid });
      }
      fetchAlarms();
      toast.success(`${ids.length} alarmes removidos`);
    } catch {
      toast.error("Erro ao excluir alarmes");
    }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    // Atualização otimista: reflete na UI antes de confirmar no backend
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
    try {
      await invoke("alarm_toggle_alarm", { id, userId: uid });
    } catch {
      fetchAlarms();
      toast.error("Erro ao alterar status");
    }
  };

  const handleEdit = (alarm: AppAlarm) => {
    setForm({
      editingId: alarm.id || null,
      title: alarm.title,
      alarmType: alarm.alarmType,
      time: alarm.time,
      intervalMinutes: alarm.intervalMinutes || 30,
      soundFile: alarm.soundFile,
      iconName: alarm.icon,
      color: alarm.color || "",
    });
    setIsModalOpen(true);
  };

  const openNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const playPreview = (sound: string) => {
    playNotificationSound(sound).catch(console.error);
  };

  return {
    alarms,
    loading,
    availableSounds,
    isModalOpen,
    setIsModalOpen,
    isInfoOpen,
    setIsInfoOpen,
    isSaving,
    form,
    setTitle,
    setAlarmType,
    setTime,
    setIntervalMinutes,
    setSoundFile,
    setIconName,
    setColor,
    handleSave,
    handleDelete,
    handleBulkDelete,
    handleToggle,
    handleEdit,
    openNew,
    playPreview,
    resetForm,
  };
}
