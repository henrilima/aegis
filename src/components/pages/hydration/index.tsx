"use client";

import { invoke } from "@tauri-apps/api/core";
import { Clock, Droplet, Plus, Timer, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import type { HydrationReminder } from "./types";

export default function HydrationPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<HydrationReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState("Interval");
  const [newValue, setNewValue] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    try {
      const res = await invoke<HydrationReminder[]>(
        "list_hydration_reminders",
        {
          userId: String(user.id),
        },
      );
      setReminders(res);
    } catch {
      toast.error("Erro ao carregar lembretes");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleAdd = async () => {
    if (!newValue || !user) return toast.error("Preencha todos os campos.");
    try {
      await invoke("add_hydration_reminder", {
        reminder: {
          user_id: String(user.id),
          reminder_type: newType,
          value: newValue,
          start_time: newType === "Interval" ? newStartTime : null,
          enabled: true,
        },
      });
      setNewValue("");
      fetchReminders();
      toast.success("Lembrete ativado!");
    } catch {
      toast.error("Erro ao adicionar lembrete");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("delete_hydration_reminder", { id });
      fetchReminders();
      toast.success("Lembrete removido");
    } catch {
      toast.error("Erro ao remover");
    }
  };

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <Droplet className="w-4 h-4" /> Carregando...
        </div>
      </div>
    );

  return (
    <div className="h-full w-full flex items-start justify-center overflow-auto px-4">
      <div className="w-full max-w-2xl flex flex-col lg:flex-row items-center lg:items-start gap-12 py-8">
        <div className="w-full max-w-sm space-y-4 shrink-0">
          <div className="text-center space-y-1 pb-2">
            <div className="mx-auto mb-3 p-3 bg-blue-500/10 rounded-3xl w-fit border border-blue-500/20">
              <Droplet className="w-7 h-7 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold">Hidratação</h1>
            <p className="text-sm text-neutral-500">
              {reminders.length} lembrete{reminders.length !== 1 ? "s" : ""}{" "}
              ativo
              {reminders.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase  text-neutral-500">
                Tipo de Lembrete
              </p>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="bg-neutral-950 border-neutral-700">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Interval">Intervalo (Minutos)</SelectItem>
                  <SelectItem value="Fixed">Horário Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase  text-neutral-500">
                {newType === "Interval"
                  ? "Intervalo em Minutos"
                  : "Horário Escolhido"}
              </p>
              {newType === "Interval" ? (
                <Input
                  type="text"
                  inputMode="numeric"
                  value={newValue}
                  onChange={(e) => {
                    // Remove caracteres não numéricos permitindo apenas números
                    const val = e.target.value.replace(/\D/g, "");
                    setNewValue(val);
                  }}
                  placeholder="60"
                  className="bg-neutral-950 border-neutral-700"
                />
              ) : (
                <Input
                  type="time"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="bg-neutral-950 border-neutral-700"
                />
              )}
            </div>

            {newType === "Interval" && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase  text-neutral-500">
                  Horário de Início
                </p>
                <Input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="bg-neutral-950 border-neutral-700"
                />
              </div>
            )}

            <Button
              onClick={handleAdd}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold cursor-pointer shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Lembrete
            </Button>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase  text-neutral-500">
              Lembretes Ativos
            </p>
            <span className="text-xs font-bold text-neutral-600 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full">
              {reminders.length}
            </span>
          </div>

          {reminders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-neutral-700">
              <Droplet className="w-8 h-8 opacity-30" />
              <p className="text-sm">Nenhum lembrete ativo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-colors group"
                >
                  <div
                    className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase  ${
                      r.reminder_type === "Interval"
                        ? "bg-blue-500/10 text-blue-400 border-b border-blue-500/15"
                        : "bg-amber-500/10 text-amber-500 border-b border-amber-500/15"
                    }`}
                  >
                    {r.reminder_type === "Interval" ? (
                      <Timer className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {r.reminder_type === "Interval"
                      ? "Intervalo"
                      : "Horário Fixo"}
                  </div>

                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-bold text-sm leading-none">
                        {r.reminder_type === "Interval"
                          ? `A cada ${r.value} min`
                          : `Às ${r.value}`}
                      </p>
                      {r.reminder_type === "Interval" && (
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          Início: {r.start_time}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => r.id && handleDelete(r.id)}
                      className="p-2 rounded-lg text-neutral-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
