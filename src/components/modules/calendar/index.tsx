"use client";

import { invoke } from "@tauri-apps/api/core";
import { CalendarDays, Info } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EventModal } from "@/components/modules/calendar/components/modals/calendarModals";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { useTime } from "@/context/TimeContext";
import { CalendarInfoModal } from "./components/CalendarInfoModal";
import { CalendarDayPanel } from "./components/calendarDayPanel";
import { CalendarGrid } from "./components/calendarGrid";
import { CalendarHeader } from "./components/calendarHeader";
import { CalendarUpcomingDeadlines } from "./components/calendarUpcomingDeadlines";
import type { CalendarEvent } from "./types";

export default function CalendarPage() {
  const { user } = useAuth();
  const { now: simulatedNow } = useTime();
  const uid = user ? String(user.id) : "";

  // Estados principais
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [month, setMonth] = useState(simulatedNow.getMonth());
  const [year, setYear] = useState(simulatedNow.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showHolidays, setShowHolidays] = useState(true);

  // Estados de formulário/modal
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | undefined>(
    undefined,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      const data = await invoke<CalendarEvent[]>("calendar_list_events", {
        userId: uid,
      });
      setEvents(data);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao carregar eventos");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSyncHolidays = async () => {
    if (!uid) return;
    try {
      setLoading(true);
      const count = await invoke<number>("sync_br_holidays", {
        userId: uid,
        year: year,
      });
      if (count > 0) {
        toast.success(`${count} novos feriados sincronizados!`);
        await loadEvents();
      } else {
        toast.info("Calendário de feriados já está atualizado.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao sincronizar feriados.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async (ev: CalendarEvent) => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      if (ev.id) {
        await invoke("calendar_update_event", { event: ev });
        toast.success("Compromisso atualizado!");
      } else {
        await invoke("calendar_add_event", { event: ev });
        toast.success("Compromisso agendado!");
      }
      setShowForm(false);
      loadEvents();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar compromisso");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEventDrop = async (eventId: number, targetDate: string) => {
    // Busca o compromisso correspondente ao ID arrastado na lista local de eventos
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    // Se o compromisso já estiver agendado no dia de destino, não faz nada
    if (event.date === targetDate) return;

    try {
      // Atualiza o compromisso com a nova data e persiste via comando Tauri no SQLite
      const updatedEvent = { ...event, date: targetDate };
      await invoke("calendar_update_event", { event: updatedEvent });

      // Notifica o usuário de forma elegante com toast em português
      toast.success(`"${event.title}" reagendado com sucesso!`);

      // Recarrega todos os compromissos para atualizar o estado do calendário
      loadEvents();
    } catch (err) {
      console.error(
        "[Calendar] Erro ao salvar reagendamento via drag-and-drop:",
        err,
      );
      toast.error("Não foi possível salvar o reagendamento do compromisso.");
    }
  };

  const updateShowHolidays = (val: boolean) => {
    setShowHolidays(val);
  };

  // Filtragem de eventos
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
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
          <CalendarDays className="w-4 h-4" /> Sincronizando agenda...
        </div>
      </div>
    );

  return (
    <div className="w-full h-full flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-foreground">
      {/* Cabeçalho */}
      <CalendarHeader
        month={month}
        year={year}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToday={() => {
          setMonth(simulatedNow.getMonth());
          setYear(simulatedNow.getFullYear());
        }}
        onNew={() => {
          // Se houver uma data selecionada, já abre o formulário com ela preenchida
          setEditEvent(
            selectedDate
              ? ({
                  date: selectedDate,
                  title: "",
                  eventType: "event",
                  userId: uid,
                } as CalendarEvent)
              : undefined,
          );
          setShowForm(true);
        }}
        onSyncHolidays={handleSyncHolidays}
        showHolidays={showHolidays}
        onToggleHolidays={() => updateShowHolidays(!showHolidays)}
        onShowInfo={() => setShowInfo(true)}
      />

      <CalendarInfoModal show={showInfo} onClose={() => setShowInfo(false)} />

      {/* Modais */}
      <EventModal
        show={showForm}
        userId={uid}
        editEvent={editEvent}
        onClose={() => setShowForm(false)}
        onSave={handleSaveEvent}
        isSaving={isSaving}
      />

      {deleteConfirm !== null && (
        <ConfirmModal
          title="Excluir Evento?"
          description="Esta ação não poderá ser desfeita e removerá o compromisso permanentemente."
          variant="danger"
          onConfirm={async () => {
            if (deleteConfirm) {
              try {
                await invoke("calendar_delete_event", {
                  id: deleteConfirm,
                  userId: uid,
                });
                toast.success("Evento removido");
                loadEvents();
              } catch (_err) {
                toast.error("Erro ao remover");
              }
            }
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Calendário Principal */}
        <div className="lg:col-span-2 bg-card/40 border border-border rounded-2xl overflow-hidden backdrop-blur-sm">
          <CalendarGrid
            month={month}
            year={year}
            events={events.filter((e) => showHolidays || !e.isHoliday)}
            selectedDate={selectedDate}
            onDayClick={(date) =>
              setSelectedDate((prev) => (prev === date ? null : date))
            }
            onDayDoubleClick={(date) => {
              setSelectedDate(date);
              // Abre o formulário pré-preenchido com a data clicada
              setEditEvent({
                date,
                title: "",
                eventType: "event",
                userId: uid,
              } as CalendarEvent);
              setShowForm(true);
            }}
            onEventDrop={handleEventDrop}
          />
        </div>

        {/* Painel Lateral: Prazos e Detalhes do Dia */}
        <div className="flex flex-col gap-6">
          <CalendarUpcomingDeadlines events={events} time={simulatedNow} />

          {selectedDate ? (
            <CalendarDayPanel
              date={selectedDate}
              dayEvents={selectedEvents}
              onEdit={(ev) => {
                setEditEvent(ev);
                setShowForm(true);
              }}
              onDelete={(id) => setDeleteConfirm(id)}
              onClose={() => setSelectedDate(null)}
            />
          ) : (
            <EmptyState
              icon={Info}
              title="Selecione uma data"
              description="Consulte os registros do dia ou adicione novos eventos clicando no calendário."
              className="bg-card border border-border rounded-xl p-8"
            />
          )}
        </div>
      </div>
    </div>
  );
}
