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
import { CalendarGuidePanel } from "./components/CalendarInfoModal";
import { CalendarWeeklyGrid } from "./components/CalendarWeeklyGrid";
import { CalendarDayPanel } from "./components/calendarDayPanel";
import { CalendarGrid } from "./components/calendarGrid";
import { CalendarHeader } from "./components/calendarHeader";
import { CalendarUpcomingDeadlines } from "./components/calendarUpcomingDeadlines";
import type { CalendarEvent } from "./types";
import { getWeekLabel, isEventRecurringOnDate } from "./types";

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
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    () => simulatedNow,
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aegis-calendar-view-mode");
      if (saved === "month" || saved === "week") {
        setViewMode(saved);
      }
    }
  }, []);

  const handleViewModeChange = (mode: "month" | "week") => {
    setViewMode(mode);
    localStorage.setItem("aegis-calendar-view-mode", mode);
  };

  // Estados de formulário/modal
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | undefined>(
    undefined,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editRecurrenceTarget, setEditRecurrenceTarget] =
    useState<CalendarEvent | null>(null);
  const [pendingExceptionUpdate, setPendingExceptionUpdate] = useState<{
    parentId: number;
    dateToExclude: string;
  } | null>(null);
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

        if (pendingExceptionUpdate) {
          const parentEvent = events.find(
            (e) => e.id === pendingExceptionUpdate.parentId,
          );
          if (parentEvent) {
            const currentExceptions = parentEvent.recurrenceExceptions
              ? parentEvent.recurrenceExceptions.split(",").map((s) => s.trim())
              : [];
            if (
              !currentExceptions.includes(pendingExceptionUpdate.dateToExclude)
            ) {
              currentExceptions.push(pendingExceptionUpdate.dateToExclude);
            }
            const updatedParent = {
              ...parentEvent,
              recurrenceExceptions: currentExceptions.join(","),
            };
            await invoke("calendar_update_event", { event: updatedParent });
          }
          setPendingExceptionUpdate(null);
        }
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

  const handleEditClick = (ev: CalendarEvent) => {
    if (ev.recurrence && ev.recurrence !== "none") {
      setEditRecurrenceTarget(ev);
    } else {
      setEditEvent(ev);
      setShowForm(true);
    }
  };

  const updateShowHolidays = (val: boolean) => {
    setShowHolidays(val);
  };

  // Filtragem de eventos
  const selectedEvents = useMemo(
    () =>
      selectedDate
        ? events.filter((e) => isEventRecurringOnDate(e, selectedDate))
        : [],
    [events, selectedDate],
  );

  const handlePrev = () => {
    if (viewMode === "week") {
      const nextStart = new Date(currentWeekStart);
      nextStart.setDate(nextStart.getDate() - 7);
      setCurrentWeekStart(nextStart);
      setMonth(nextStart.getMonth());
      setYear(nextStart.getFullYear());
    } else {
      if (month === 0) {
        setMonth(11);
        setYear((y) => y - 1);
      } else setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      const nextStart = new Date(currentWeekStart);
      nextStart.setDate(nextStart.getDate() + 7);
      setCurrentWeekStart(nextStart);
      setMonth(nextStart.getMonth());
      setYear(nextStart.getFullYear());
    } else {
      if (month === 11) {
        setMonth(0);
        setYear((y) => y + 1);
      } else setMonth((m) => m + 1);
    }
  };

  if (loading)
    return (
      <div className="h-full flex items-center justify-center font-bold">
        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
          <CalendarDays className="w-4 h-4" /> Sincronizando agenda...
        </div>
      </div>
    );

  if (showInfo) {
    return (
      <div className="w-full h-full flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-foreground">
        <CalendarHeader
          month={month}
          year={year}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={() => {
            setMonth(simulatedNow.getMonth());
            setYear(simulatedNow.getFullYear());
            setCurrentWeekStart(simulatedNow);
          }}
          onNew={() => {}}
          onSyncHolidays={handleSyncHolidays}
          showHolidays={showHolidays}
          onToggleHolidays={() => updateShowHolidays(!showHolidays)}
          onTitleClick={() => setShowInfo(true)}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          weekLabel={getWeekLabel(currentWeekStart)}
        />
        <CalendarGuidePanel onBack={() => setShowInfo(false)} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-6 pb-12 animate-in fade-in duration-700 text-foreground">
      {/* Cabeçalho */}
      <CalendarHeader
        month={month}
        year={year}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={() => {
          setMonth(simulatedNow.getMonth());
          setYear(simulatedNow.getFullYear());
          setCurrentWeekStart(simulatedNow);
        }}
        onNew={() => {
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
        onTitleClick={() => setShowInfo(true)}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        weekLabel={getWeekLabel(currentWeekStart)}
      />

      {/* Modais */}
      <EventModal
        show={showForm}
        userId={uid}
        editEvent={editEvent}
        onClose={() => setShowForm(false)}
        onSave={handleSaveEvent}
        isSaving={isSaving}
      />

      {deleteConfirm !== null &&
        (() => {
          const eventToDelete = events.find((e) => e.id === deleteConfirm);
          const isRecurringToDelete =
            eventToDelete?.recurrence && eventToDelete.recurrence !== "none";

          if (isRecurringToDelete) {
            return (
              <ConfirmModal
                title="Excluir Compromisso Recorrente?"
                description="Este é um compromisso recorrente. Deseja excluir apenas esta ocorrência ou toda a série de compromissos?"
                confirmLabel="Toda a Série"
                cancelLabel="Apenas Esta"
                variant="danger"
                onConfirm={async () => {
                  try {
                    await invoke("calendar_delete_event", {
                      id: deleteConfirm,
                      userId: uid,
                    });
                    toast.success("Série de compromissos excluída");
                    loadEvents();
                  } catch (_err) {
                    toast.error("Erro ao remover");
                  }
                  setDeleteConfirm(null);
                }}
                onCancel={async () => {
                  if (eventToDelete && selectedDate) {
                    try {
                      const currentExceptions =
                        eventToDelete.recurrenceExceptions
                          ? eventToDelete.recurrenceExceptions
                              .split(",")
                              .map((s) => s.trim())
                          : [];
                      if (!currentExceptions.includes(selectedDate)) {
                        currentExceptions.push(selectedDate);
                      }
                      const updatedParent = {
                        ...eventToDelete,
                        recurrenceExceptions: currentExceptions.join(","),
                      };
                      await invoke("calendar_update_event", {
                        event: updatedParent,
                      });
                      toast.success("Ocorrência excluída com sucesso");
                      loadEvents();
                    } catch (_err) {
                      toast.error("Erro ao remover ocorrência");
                    }
                  }
                  setDeleteConfirm(null);
                }}
              />
            );
          }

          return (
            <ConfirmModal
              title="Excluir Evento?"
              description="Esta ação não poderá ser desfeita e removerá o compromisso permanentemente."
              variant="danger"
              onConfirm={async () => {
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
                setDeleteConfirm(null);
              }}
              onCancel={() => setDeleteConfirm(null)}
            />
          );
        })()}

      {editRecurrenceTarget !== null && (
        <ConfirmModal
          title="Editar Compromisso Recorrente?"
          description="Este é um compromisso recorrente. Deseja editar apenas esta ocorrência ou toda a série de compromissos?"
          confirmLabel="Toda a Série"
          cancelLabel="Apenas Esta"
          variant="default"
          onConfirm={() => {
            setEditEvent(editRecurrenceTarget);
            setPendingExceptionUpdate(null);
            setShowForm(true);
            setEditRecurrenceTarget(null);
          }}
          onCancel={() => {
            if (selectedDate) {
              setPendingExceptionUpdate({
                parentId: editRecurrenceTarget.id ?? 0,
                dateToExclude: selectedDate,
              });
              setEditEvent({
                ...editRecurrenceTarget,
                id: undefined,
                recurrence: "none",
                recurrenceExceptions: undefined,
                date: selectedDate,
              });
              setShowForm(true);
            }
            setEditRecurrenceTarget(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Calendário Principal */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          {viewMode === "month" ? (
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
                setEditEvent({
                  date,
                  title: "",
                  eventType: "event",
                  userId: uid,
                } as CalendarEvent);
                setShowForm(true);
              }}
              onEventDrop={handleEventDrop}
              now={simulatedNow}
            />
          ) : (
            <CalendarWeeklyGrid
              currentWeekStart={currentWeekStart}
              events={events.filter((e) => showHolidays || !e.isHoliday)}
              selectedDate={selectedDate}
              onDayClick={(date) =>
                setSelectedDate((prev) => (prev === date ? null : date))
              }
              onDayDoubleClick={(date) => {
                setSelectedDate(date);
                setEditEvent({
                  date,
                  title: "",
                  eventType: "event",
                  userId: uid,
                } as CalendarEvent);
                setShowForm(true);
              }}
              now={simulatedNow}
              isEventRecurringOnDate={isEventRecurringOnDate}
            />
          )}
        </div>

        {/* Painel Lateral: Prazos e Detalhes do Dia */}
        <div className="flex flex-col gap-6">
          <CalendarUpcomingDeadlines events={events} time={simulatedNow} />

          {selectedDate ? (
            <CalendarDayPanel
              date={selectedDate}
              dayEvents={selectedEvents}
              onEdit={handleEditClick}
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
