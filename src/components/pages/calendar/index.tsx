"use client";

import { invoke } from "@tauri-apps/api/core";
import { CalendarDays } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { CalendarDayPanel } from "./components/calendarDayPanel";
import { CalendarGrid } from "./components/calendarGrid";

import { CalendarHeader } from "./components/calendarHeader";
import { CalendarUpcomingDeadlines } from "./components/calendarUpcomingDeadlines";
import { DeleteEventModal, EventModal } from "./modal/calendarModals";
import type { CalendarEvent } from "./types";

/**
 * Módulo de Calendário: Gestão de compromissos, prazos e eventos acadêmicos/pessoais
 */
export default function CalendarPage() {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Sincronização de eventos com o backend
  const loadEvents = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await invoke<CalendarEvent[]>("calendar_list_events", {
        userId: uid,
      });
      setEvents(data);
    } catch {
      toast.error("Falha ao sincronizar agenda");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSave = async (ev: CalendarEvent) => {
    try {
      if (ev.id) {
        await invoke("calendar_update_event", { event: ev });
        toast.success("Evento atualizado!");
      } else {
        await invoke("calendar_add_event", { event: ev });
        toast.success("Agenda atualizada!");
      }
      setShowForm(false);
      setEditEvent(undefined);
      await loadEvents();
    } catch {
      toast.error("Erro ao persistir evento");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await invoke("calendar_delete_event", { id, userId: uid });
      toast.success("Registro removido");
      setDeleteConfirm(null);
      setSelectedDate(null);
      await loadEvents();
    } catch {
      toast.error("Erro ao excluir do histórico");
    }
  };

  // Filtragem reativa de eventos para o dia selecionado
  const selectedEvents = useMemo(
    () => (selectedDate ? events.filter((e) => e.date === selectedDate) : []),
    [events, selectedDate],
  );

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  if (loading)
    return (
      <div className="h-full flex items-center justify-center font-bold">
        <div className="flex items-center gap-2 text-neutral-500 animate-pulse">
          <CalendarDays className="w-4 h-4" /> Sincronizando agenda...
        </div>
      </div>
    );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-white">
      {/* Controles de Navegação e Ações Globais */}
      <CalendarHeader
        month={month}
        year={year}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToday={() => {
          setMonth(now.getMonth());
          setYear(now.getFullYear());
        }}
        onNew={() => {
          setEditEvent(undefined);
          setShowForm(true);
        }}
      />

      {/* Camada de Modais de Fluxo */}
      <EventModal
        show={showForm}
        userId={uid}
        editEvent={editEvent}
        onSave={handleSave}
        onClose={() => {
          setShowForm(false);
          setEditEvent(undefined);
        }}
      />

      <DeleteEventModal
        id={deleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Grade do Calendário Principal */}
        <div className="lg:col-span-2">
          <CalendarGrid
            month={month}
            year={year}
            events={events}
            selectedDate={selectedDate}
            onDayClick={(date) =>
              setSelectedDate((prev) => (prev === date ? null : date))
            }
          />
        </div>

        {/* Painel Lateral: Prazos e Detalhes do Dia */}
        <div className="flex flex-col gap-6">
          <CalendarUpcomingDeadlines events={events} />

          {selectedDate ? (
            <CalendarDayPanel
              date={selectedDate}
              events={selectedEvents}
              onEdit={(ev) => {
                setEditEvent(ev);
                setShowForm(true);
              }}
              onDelete={(id) => setDeleteConfirm(id)}
              onClose={() => setSelectedDate(null)}
            />
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center shadow-lg animate-in fade-in duration-500">
              <div className="p-4 bg-neutral-950/40 rounded-full w-fit mx-auto mb-4">
                <CalendarDays className="w-8 h-8 text-neutral-800" />
              </div>
              <p className="text-sm font-black uppercase text-neutral-600">
                Selecione uma data
              </p>
              <p className="text-[10px] text-neutral-700 mt-2 font-bold uppercase">
                Consulte os registros do dia clicando no calendário
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
