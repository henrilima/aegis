"use client";

import { invoke } from "@tauri-apps/api/core";
import { Clock, Droplet, Plus, Timer, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { HydrationForm } from "@/components/forms/hydration/hydrationForm";
import { useAuth } from "@/context/AuthContext";
import type { HydrationReminder } from "./types";

/**
 * Módulo de Hidratação: Gestão de alertas para consumo de água e líquidos
 */
export default function HydrationPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<HydrationReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [newType, setNewType] = useState("Interval");
  const [newValue, setNewValue] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");

  const uid = user ? String(user.id) : "";

  const fetchReminders = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await invoke<HydrationReminder[]>(
        "list_hydration_reminders",
        { userId: uid },
      );
      setReminders(res);
    } catch {
      toast.error("Erro ao sincronizar lembretes");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleAdd = async () => {
    if (!newValue || !uid)
      return toast.error("Por favor, preencha o valor do alerta.");
    try {
      await invoke("add_hydration_reminder", {
        reminder: {
          user_id: uid,
          reminder_type: newType,
          value: newValue,
          start_time: newType === "Interval" ? newStartTime : null,
          enabled: true,
        },
      });
      setNewValue("");
      setShowForm(false);
      fetchReminders();
      toast.success("Lembrete ativo! Mantenha-se hidratado.");
    } catch {
      toast.error("Falha ao salvar lembrete");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("delete_hydration_reminder", { id });
      fetchReminders();
      toast.success("Lembrete removido");
    } catch {
      toast.error("Erro ao excluir");
    }
  };

  if (loading)
    return (
      <div className="h-full w-full flex items-center justify-center font-bold">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <Droplet className="w-4 h-4" /> Sincronizando dados...
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-white px-1">
      {/* Cabeçalho do Módulo */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Droplet className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-none">Hidratação</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {reminders.length} alerta{reminders.length !== 1 ? "s" : ""} ativo
              {reminders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Novo Lembrete
        </button>
      </div>

      {/* Formulário de novo lembrete */}
      {showForm && (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <HydrationForm
            newType={newType}
            setNewType={setNewType}
            newValue={newValue}
            setNewValue={setNewValue}
            newStartTime={newStartTime}
            setNewStartTime={setNewStartTime}
            onAdd={handleAdd}
          />
        </div>
      )}

      {/* Listagem de Lembretes */}
      {reminders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-neutral-800">
          <div className="p-4 rounded-full bg-neutral-900/50">
            <Droplet className="w-10 h-10 opacity-10" />
          </div>
          <p className="text-sm font-bold uppercase opacity-30">
            Nenhum lembrete ativo
          </p>
          <p className="text-xs text-neutral-700 opacity-40">
            Clique em "Novo Lembrete" para começar
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reminders.map((r) => (
            <div
              key={r.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all group"
            >
              {/* Tag de tipo */}
              <div
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold ${
                  r.reminder_type === "Interval"
                    ? "bg-blue-500/10 text-blue-400 border-b border-blue-500/10"
                    : "bg-amber-500/10 text-amber-500 border-b border-amber-500/10"
                }`}
              >
                {r.reminder_type === "Interval" ? (
                  <Timer className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {r.reminder_type === "Interval"
                  ? "Intervalo Periódico"
                  : "Horário Definido"}
              </div>

              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="font-bold text-base text-neutral-200 leading-none">
                    {r.reminder_type === "Interval"
                      ? `A cada ${r.value} min`
                      : `Às ${r.value}`}
                  </p>
                  {r.reminder_type === "Interval" && (
                    <p className="text-xs text-neutral-500 mt-1.5">
                      Início:{" "}
                      <span className="text-neutral-400">{r.start_time}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => r.id && handleDelete(r.id)}
                  className="p-2.5 rounded-xl border border-transparent text-neutral-600 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all cursor-pointer"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
