"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { GripVertical, Move, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AlarmFormState } from "@/components/modules/alarms/hooks/useAlarmsLogic";
import { DashboardConfigModal } from "@/components/modules/dashboard/components/modals/DashboardConfigModal";
import { useSettingsLogic } from "@/components/modules/settings/useSettingsLogic";
import { NAV_GROUPS } from "@/components/sidebar/appSidebar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { type ModuleId, useModules } from "@/context/ModuleContext";
import { useNavigation } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { useTime } from "@/context/TimeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor, PORTAL_DESCRIPTIONS } from "@/modules.config";
import type { CalendarEvent } from "../calendar/types";
import type { ReadingSession } from "../reading/types";
import type { Task } from "../tasks/types";
import { DashboardHeader } from "./dashboardHeader";
import { isToday } from "./helpers";
import type { Habit, SleepEntry, StudySession } from "./types";
import { useDashboardData, useWidgetLayout } from "./useDashboardData";
import { WIDGET_METADATA, WIDGET_REGISTRY } from "./widgets/registry";

// Variantes de animação escalonada (staggered entrance)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 25,
    },
  },
};

// ---- Componente de widget sortable (wrapper do @dnd-kit) ----
interface SortableWidgetItemProps {
  id: string;
  isVisualEditMode: boolean;
  activeDragId: string | null;
  onRemove: (id: string) => void;
  onUpdateConfig: (
    id: string,
    cfg: { interactive?: boolean; limit?: number },
  ) => void;
  widgetConfig: { interactive: boolean; limit?: number };
  children: React.ReactNode;
}

function SortableWidgetItem({
  id,
  isVisualEditMode,
  onRemove,
  onUpdateConfig,
  widgetConfig,
  children,
}: SortableWidgetItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isVisualEditMode });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const hasLimit = ["habits", "tasks", "alarms", "reading"].includes(id);
  const widgetName = WIDGET_METADATA.find((w) => w.id === id)?.name ?? id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full h-full min-h-[300px] lg:min-h-[340px]"
    >
      <div
        className={cn(
          "relative group/widget transition-all duration-300 w-full h-full rounded-2xl",
          isVisualEditMode &&
            "border-2 border-dashed border-emerald-500/40 p-1 bg-emerald-500/5",
          isDragging && "scale-[0.98]",
        )}
      >
        {isVisualEditMode && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs rounded-2xl z-40 flex flex-col items-center justify-between p-4 pointer-events-auto">
            <div className="flex items-center justify-between w-full">
              <div className="w-[30px]" />
              <span className="text-xs font-black text-foreground bg-background/85 px-2.5 py-1 rounded-full border border-border select-none">
                {widgetName}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(id);
                }}
                className="p-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                title="Remover widget"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Handle de arraste — listeners do dnd-kit aqui */}
            <div
              {...attributes}
              {...listeners}
              className="flex flex-col items-center justify-center gap-1.5 select-none cursor-grab active:cursor-grabbing hover:scale-105 transition-all opacity-80 hover:opacity-100 touch-none"
            >
              <GripVertical className="w-6 h-6 text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-foreground">
                arrastar para reordenar
              </span>
            </div>

            <div className="w-full flex items-center justify-center gap-2">
              {hasLimit && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-background/95 border border-border shadow-none">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">
                    Itens:
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const defVal = id === "reading" ? 2 : 3;
                      const curr = widgetConfig.limit ?? defVal;
                      if (curr > 1) onUpdateConfig(id, { limit: curr - 1 });
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-lg bg-accent border border-border text-xs font-bold hover:border-foreground transition-all cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-black w-4 text-center">
                    {widgetConfig.limit ?? (id === "reading" ? 2 : 3)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const defVal = id === "reading" ? 2 : 3;
                      const curr = widgetConfig.limit ?? defVal;
                      if (curr < 15) onUpdateConfig(id, { limit: curr + 1 });
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-lg bg-accent border border-border text-xs font-bold hover:border-foreground transition-all cursor-pointer"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className={cn(
            "h-full w-full",
            isVisualEditMode && "pointer-events-none select-none opacity-40",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { now: time, isSimulated } = useTime();
  const { isModuleEnabled } = useModules();
  const { appMode } = useTheme();
  const { navigate } = useNavigation();
  const {
    dashboardCoverImage,
    dashboardCoverPositionX = 50,
    dashboardCoverPositionY = 50,
    dashboardCoverBlur = 0,
    dashboardCoverGrayscale = 0,
    dashboardCoverSaturation = 100,
    dashboardCoverZoom = 100,
    dashboardCoverHeight = 300,
  } = useSettingsLogic();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [taskToConfirm, setTaskToConfirm] = useState<{
    task: Task;
    count: number;
  } | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [habitToConfirm, setHabitToConfirm] = useState<Habit | null>(null);

  const {
    activeWidgetIds,
    handleToggleWidget,
    handleReorderWidgets,
    widgetConfigs,
    handleUpdateWidgetConfig,
  } = useWidgetLayout();

  const [isVisualEditMode, setIsVisualEditMode] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Sensors do @dnd-kit — requer 8px de movimento antes de iniciar o drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (over && active.id !== over.id) {
      const oldIndex = activeWidgetIds.indexOf(String(active.id));
      const newIndex = activeWidgetIds.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        handleReorderWidgets(arrayMove(activeWidgetIds, oldIndex, newIndex));
      }
    }
  };

  const inactiveWidgets = WIDGET_METADATA.filter(
    (w) => isModuleEnabled(w.id as ModuleId) && !activeWidgetIds.includes(w.id),
  );
  const {
    data,
    fetchAll,
    pendingTasksCount,
    handleCreateNote,
    handleToggleTask,
    handleDeleteTask,
    derived,
  } = useDashboardData();

  const {
    weekSessions,
    weekHours,
    weekQuestions,
    goalWeekHours,
    goalWeekQuestions,
    recentSleep,
    avgSleepMin,
    avgQuality,
    goalSleepMin,
    sleepPct,
    weekPages,
    goalWeekPages,
  } = derived;

  const doneTodayCount = data.habits.filter(
    (h) => h.lastDone && isToday(h.lastDone),
  ).length;
  const positiveHabitsCount = data.habits.filter(
    (h) => h.habitType === "Positive",
  ).length;

  if (appMode === "portal") {
    const portalModules = NAV_GROUPS.flatMap((g) => g.items).filter(
      (item) =>
        item.route !== "dashboard" && isModuleEnabled(item.route as ModuleId),
    );

    return (
      <div className="flex flex-col items-center w-full min-h-screen bg-background animate-in fade-in duration-700 relative">
        {dashboardCoverImage && (
          <div
            className="absolute -top-6 md:-top-10 -left-6 md:-left-10 -right-6 md:-right-10 overflow-hidden pointer-events-none z-0"
            style={{ height: `${dashboardCoverHeight}px` }}
          >
            <img
              src={dashboardCoverImage}
              alt="Dashboard Cover"
              className="w-full h-full object-cover"
              style={{
                objectPosition: `${dashboardCoverPositionX}% ${dashboardCoverPositionY}%`,
                filter: `blur(${dashboardCoverBlur}px) grayscale(${dashboardCoverGrayscale}%) saturate(${dashboardCoverSaturation}%)`,
                transform: `scale(${dashboardCoverZoom / 100})`,
              }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-background/25 to-background" />
          </div>
        )}
        <div
          className={cn(
            "w-full max-w-[1400px] flex flex-col gap-4 sm:gap-8 min-w-0 relative z-10",
          )}
          style={
            dashboardCoverImage
              ? { paddingTop: `${Math.max(12, dashboardCoverHeight - 220)}px` }
              : undefined
          }
        >
          <div className={cn("flex-none px-4 sm:px-0 mt-4 sm:mt-0")}>
            <DashboardHeader
              time={time}
              greeting="Olá"
              user={user}
              doneTodayCount={doneTodayCount}
              positiveHabitsCount={positiveHabitsCount}
              pendingTasksCount={pendingTasksCount}
              onOpenConfig={() => setIsConfigOpen(true)}
              onStartVisualEdit={() => setIsVisualEditMode(true)}
              isSimulated={isSimulated}
            />
          </div>

          <div className="relative flex-1 px-4 sm:px-0 mb-20">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 auto-rows-auto"
            >
              {portalModules.map((item) => {
                const Icon = item.icon;
                const mColor = getModuleColor(item.route);
                const mStyles = getColorTheme(mColor);
                const desc =
                  PORTAL_DESCRIPTIONS[item.route] || "Acesse o módulo.";

                return (
                  <motion.div
                    key={item.route}
                    variants={itemVariants}
                    onClick={() => navigate(item.route)}
                    className={cn(
                      "p-6 bg-card border border-border rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:border-border/80 group cursor-pointer relative overflow-hidden min-h-[140px]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2.5 rounded-2xl border transition-all duration-300",
                          mStyles.bg,
                          mStyles.border,
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5 transition-transform group-hover:scale-110",
                            mStyles.text,
                          )}
                        />
                      </div>
                      <span className="text-base font-black text-foreground">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                      {desc}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-background animate-in fade-in duration-700 relative">
      {dashboardCoverImage && (
        <div
          className="absolute -top-6 md:-top-10 -left-6 md:-left-10 -right-6 md:-right-10 overflow-hidden pointer-events-none z-0"
          style={{ height: `${dashboardCoverHeight}px` }}
        >
          <img
            src={dashboardCoverImage}
            alt="Dashboard Cover"
            className="w-full h-full object-cover"
            style={{
              objectPosition: `${dashboardCoverPositionX}% ${dashboardCoverPositionY}%`,
              filter: `blur(${dashboardCoverBlur}px) grayscale(${dashboardCoverGrayscale}%) saturate(${dashboardCoverSaturation}%)`,
              transform: `scale(${dashboardCoverZoom / 100})`,
            }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-background/25 to-background" />
        </div>
      )}
      <div
        className={cn(
          "w-full max-w-[1400px] flex flex-col gap-4 sm:gap-8 min-w-0 relative z-10",
        )}
        style={
          dashboardCoverImage
            ? { paddingTop: `${Math.max(12, dashboardCoverHeight - 220)}px` }
            : undefined
        }
      >
        <div className={cn("flex-none px-4 sm:px-0 mt-4 sm:mt-0")}>
          <DashboardHeader
            time={time}
            greeting="Olá"
            user={user}
            doneTodayCount={doneTodayCount}
            positiveHabitsCount={positiveHabitsCount}
            pendingTasksCount={pendingTasksCount}
            onOpenConfig={() => setIsConfigOpen(true)}
            onStartVisualEdit={() => setIsVisualEditMode(true)}
            isSimulated={isSimulated}
          />
        </div>

        <div className="relative flex-1 px-4 sm:px-0 mb-20 whitespace-normal">
          {/* Banner do Modo de Edição Visual */}
          {isVisualEditMode && (
            <div className="w-full bg-emerald-500/10 border-2 border-dashed border-emerald-500/20 text-emerald-500 rounded-3xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Move className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black text-foreground">
                    Modo de Edição Ativo
                  </span>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    Arraste os widgets para mudar suas posições na tela ou
                    configure-os usando os painéis rápidos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVisualEditMode(false)}
                className="px-6 py-2 rounded-xl bg-emerald-500 text-black font-black text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                Concluir Edição
              </button>
            </div>
          )}

          {/* Biblioteca de Widgets Inativos (Scroll Lateral) */}
          {isVisualEditMode && inactiveWidgets.length > 0 && (
            <div className="w-full flex flex-col gap-3 mb-8 text-left animate-in slide-in-from-top-2 duration-300">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-wider pl-1">
                Biblioteca de Widgets (Inativos)
              </span>
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar snap-x snap-mandatory">
                {inactiveWidgets.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleToggleWidget(w.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-card/60 hover:bg-card hover:border-foreground/30 transition-all shrink-0 snap-start w-72 group text-left cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 border border-border group-hover:bg-foreground group-hover:text-background transition-all">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-foreground truncate">
                        {w.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 leading-tight">
                        {w.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeWidgetIds.filter((id) =>
                isModuleEnabled(id as ModuleId),
              )}
              strategy={rectSortingStrategy}
            >
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 auto-rows-auto"
              >
                {activeWidgetIds
                  .filter((id) => isModuleEnabled(id as ModuleId))
                  .map((id) => {
                    const WidgetComponent = WIDGET_REGISTRY[id];
                    if (!WidgetComponent) return null;

                    const config = widgetConfigs[id] || { interactive: false };
                    const boundIsToday = (iso: string) => isToday(iso, time);

                    const widgetProps: {
                      isToday: (iso: string) => boolean;
                      time: Date;
                      limit?: number;
                      [key: string]: unknown;
                    } = {
                      isToday: boundIsToday,
                      time,
                      limit: config.limit,
                    };

                    if (id === "habits") {
                      widgetProps.habits = data.habits;
                    }
                    if (id === "pomodoro") {
                      widgetProps.pomodoro = data.pomodoro;
                      widgetProps.onTogglePomo = async () => {
                        if (!data.pomodoro || !user) return;
                        const isStarting = !data.pomodoro.isRunning;
                        const nowIso = time.toISOString();
                        let newAccumulated = data.pomodoro.accumulatedSeconds;
                        if (!isStarting && data.pomodoro.startTime) {
                          const startTime = new Date(
                            data.pomodoro.startTime,
                          ).getTime();
                          newAccumulated += Math.floor(
                            (time.getTime() - startTime) / 1000,
                          );
                        }
                        const newState = {
                          ...data.pomodoro,
                          isRunning: isStarting,
                          startTime: isStarting ? nowIso : null,
                          accumulatedSeconds: newAccumulated,
                          cycleType:
                            isStarting && data.pomodoro.cyclesCompleted === 0
                              ? "Work"
                              : data.pomodoro.cycleType,
                        };
                        try {
                          await invoke("pomodoro_save_pomodoro_state", {
                            userId: String(user.id),
                            pomoState: newState,
                          });
                          fetchAll();
                        } catch {
                          toast.error("Erro ao salvar Pomodoro");
                        }
                      };
                      widgetProps.onStopPomo = async () => {
                        if (!user || !data.pomodoro) return;
                        if (data.pomodoro.cyclesCompleted > 0) {
                          const historyEntry = {
                            userId: String(user.id),
                            workMinutes: data.pomodoro.workMinutes,
                            breakMinutes: data.pomodoro.breakMinutes,
                            cyclesDone: data.pomodoro.cyclesCompleted,
                            startTime: time.toISOString(),
                            endTime: time.toISOString(),
                          };
                          try {
                            await invoke("pomodoro_record_pomodoro_session", {
                              session: historyEntry,
                            });
                          } catch {}
                        }
                        const newState = {
                          ...data.pomodoro,
                          isRunning: false,
                          startTime: null,
                          cyclesCompleted: 0,
                          accumulatedSeconds: 0,
                          cycleType: "Work",
                        };
                        await invoke("pomodoro_save_pomodoro_state", {
                          userId: String(user.id),
                          pomoState: newState,
                        });
                        fetchAll();
                      };
                    }
                    if (id === "notes") {
                      widgetProps.notes = data.notes;
                      widgetProps.onCreateNote = handleCreateNote;
                    }
                    if (id === "tasks") {
                      widgetProps.tasks = data.tasks;
                      widgetProps.onToggleTask = async (task: Task) => {
                        const res = await handleToggleTask(task);
                        if (
                          res?.needsConfirmation &&
                          res.pendingCount !== undefined
                        ) {
                          setTaskToConfirm({
                            task,
                            count: res.pendingCount,
                          });
                        }
                      };
                      widgetProps.onDeleteTask = (task: Task) => {
                        setTaskToDelete(task);
                      };
                      widgetProps.onAddTask = async (
                        title: string,
                        priority?: number,
                        category?: string,
                        color?: string,
                      ) => {
                        try {
                          await invoke("tasks_upsert", {
                            task: {
                              userId: String(user?.id),
                              title,
                              description: null,
                              completed: false,
                              dueDate: null,
                              createdAt: time.toISOString(),
                              priority,
                              category,
                              color,
                            },
                          });
                          fetchAll();
                          toast.success("Tarefa adicionada!");
                        } catch (err) {
                          toast.error(
                            typeof err === "string"
                              ? err
                              : "Erro ao adicionar tarefa",
                          );
                        }
                      };
                    }
                    if (id === "studies") {
                      const allSubjects = Array.from(
                        new Set(
                          (data.studySessions || []).map(
                            (s: StudySession) => s.subject,
                          ),
                        ),
                      ).sort();
                      widgetProps.sessions = weekSessions;
                      widgetProps.allSubjects = allSubjects;
                      widgetProps.weekHours = weekHours;
                      widgetProps.weekQuestions = weekQuestions;
                      widgetProps.goalWeekHours = goalWeekHours;
                      widgetProps.goalWeekQuestions = goalWeekQuestions;
                      widgetProps.onAddSession = async (
                        session: StudySession,
                      ) => {
                        try {
                          await invoke("estudos_add_session", {
                            session: { ...session, userId: String(user?.id) },
                          });
                          fetchAll();
                          toast.success("Estudo registrado!");
                        } catch {
                          toast.error("Erro ao salvar sessão");
                        }
                      };
                    }
                    if (id === "sleep") {
                      widgetProps.recentSleep = recentSleep;
                      widgetProps.avgSleepMin = avgSleepMin;
                      widgetProps.avgQuality = avgQuality;
                      widgetProps.goalSleepMin = goalSleepMin;
                      widgetProps.sleepPct = sleepPct;
                      widgetProps.onAddSleep = async (entry: SleepEntry) => {
                        try {
                          const entryData = {
                            id: entry.id || undefined,
                            userId: String(user?.id),
                            date: entry.date,
                            bedtime: entry.bedtime,
                            wakeTime: entry.wakeTime,
                            durationMinutes: Number(entry.durationMinutes || 0),
                            nap_minutes: Number(entry.nap_minutes || 0),
                            quality: Number(entry.quality || 5),
                            note: entry.note || "",
                          };
                          await invoke("sono_upsert_entry", {
                            entry: entryData,
                          });
                          fetchAll();
                          toast.success("Sono registrado!");
                        } catch (err) {
                          console.error("Erro ao salvar sono:", err);
                          toast.error("Erro ao salvar sono");
                        }
                      };
                    }
                    if (id === "alarms") {
                      widgetProps.alarms = data.alarms;
                      widgetProps.onAddAlarm = async (form: AlarmFormState) => {
                        try {
                          const alarmData = {
                            userId: String(user?.id),
                            title: form.title.trim(),
                            alarmType: form.alarmType,
                            time: form.time,
                            intervalMinutes:
                              form.alarmType === "interval"
                                ? Number(form.intervalMinutes)
                                : null,
                            lastTriggered: null,
                            soundFile: form.soundFile,
                            icon: form.iconName || "Bell",
                            color: form.color || "red",
                            enabled: true,
                          };
                          await invoke("alarm_add_alarm", { alarm: alarmData });
                          fetchAll();
                          toast.success("Alarme adicionado!");
                        } catch {
                          toast.error("Erro ao adicionar alarme");
                        }
                      };
                    }

                    if (id === "calendar") {
                      widgetProps.showHolidays = data.showHolidays;
                      widgetProps.onAddEvent = async (event: CalendarEvent) => {
                        try {
                          await invoke("calendar_add_event", {
                            event: { ...event, userId: String(user?.id) },
                          });
                          fetchAll();
                          toast.success("Evento agendado!");
                        } catch {
                          toast.error("Erro ao agendar evento");
                        }
                      };
                    }

                    if (id === "reading") {
                      widgetProps.books = data.readingBooks;
                      widgetProps.recentSessions = data.readingSessions.slice(
                        0,
                        5,
                      );
                      widgetProps.weekPages = weekPages;
                      widgetProps.goalWeekPages = goalWeekPages;
                      widgetProps.onLogSession = async (
                        session: ReadingSession,
                      ) => {
                        try {
                          const sessionData = {
                            id: session.id || undefined,
                            userId: String(user?.id),
                            bookId: session.bookId
                              ? Number(session.bookId)
                              : undefined,
                            pagesRead: Number(session.pagesRead || 0),
                            durationMinutes: Number(
                              session.durationMinutes || 0,
                            ),
                            date:
                              session.date ||
                              new Date().toISOString().split("T")[0],
                            note: session.note || "",
                            focus: Number(session.focus || 5),
                          };
                          await invoke("reading_upsert_session", {
                            session: sessionData,
                          });

                          // Atualiza progresso do livro
                          const book = data.readingBooks.find(
                            (b) => b.id === sessionData.bookId,
                          );
                          if (book) {
                            const newPage =
                              Number(book.currentPage) +
                              Number(sessionData.pagesRead);
                            await invoke("reading_upsert_book", {
                              book: {
                                ...book,
                                currentPage: newPage,
                              },
                            });
                          }
                          fetchAll();
                          toast.success("Leitura registrada!");
                        } catch (err) {
                          console.error("Erro ao salvar leitura:", err);
                          toast.error("Erro ao salvar sessão");
                        }
                      };
                    }

                    if (id === "statistics")
                      widgetProps.summary = data.statsSummary;
                    if (id === "movies") {
                      widgetProps.movies = data.movies;
                    }
                    if (id === "dictionary") {
                      widgetProps.words = data.dictionaryWords;
                    }

                    const isNonInteractive = [
                      "movies",
                      "statistics",
                      "dictionary",
                    ].includes(id);
                    const isInteractive = isNonInteractive
                      ? false
                      : config.interactive;

                    widgetProps.isInteractive = isInteractive;
                    widgetProps.onToggleInteractive = !isNonInteractive
                      ? () =>
                          handleUpdateWidgetConfig(id, {
                            interactive: !config.interactive,
                          })
                      : undefined;

                    if (id === "habits") {
                      widgetProps.onToggleHabit = (habitId: number) => {
                        const habit = data.habits.find((h) => h.id === habitId);
                        if (habit) setHabitToConfirm(habit);
                      };
                    }

                    return (
                      <motion.div key={id} variants={itemVariants}>
                        <SortableWidgetItem
                          id={id}
                          isVisualEditMode={isVisualEditMode}
                          activeDragId={activeDragId}
                          onRemove={handleToggleWidget}
                          onUpdateConfig={handleUpdateWidgetConfig}
                          widgetConfig={config}
                        >
                          <WidgetComponent
                            {...widgetProps}
                            className="h-full w-full"
                          />
                        </SortableWidgetItem>
                      </motion.div>
                    );
                  })}
              </motion.div>
            </SortableContext>

            {/* Overlay visual durante o drag */}
            <DragOverlay>
              {activeDragId ? (
                <div className="w-full min-h-[300px] rounded-2xl border-2 border-dashed border-emerald-500/60 bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-emerald-500">
                    <GripVertical className="w-8 h-8 animate-pulse" />
                    <span className="text-xs font-black">
                      {WIDGET_METADATA.find((w) => w.id === activeDragId)?.name}
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {isConfigOpen && (
        <DashboardConfigModal
          activeWidgetIds={activeWidgetIds}
          onToggle={handleToggleWidget}
          onReorder={handleReorderWidgets}
          widgetConfigs={widgetConfigs}
          onUpdateConfig={handleUpdateWidgetConfig}
          onClose={() => setIsConfigOpen(false)}
          onStartVisualEdit={() => setIsVisualEditMode(true)}
        />
      )}

      {taskToConfirm && (
        <ConfirmModal
          title="Concluir tudo?"
          description={`Esta tarefa possui ${taskToConfirm.count} subtarefas pendentes. Deseja marcar todas como concluídas?`}
          confirmLabel="Sim, concluir tudo"
          cancelLabel="Cancelar"
          variant="default"
          onConfirm={() => {
            const t = taskToConfirm.task;
            setTaskToConfirm(null);
            handleToggleTask(t, true);
          }}
          onCancel={() => setTaskToConfirm(null)}
        />
      )}

      {taskToDelete && (
        <ConfirmModal
          title={
            data.tasks.filter((t) => t.parentId === taskToDelete.id).length > 0
              ? "Excluir tarefa e subtarefas?"
              : "Excluir tarefa?"
          }
          description={
            data.tasks.filter((t) => t.parentId === taskToDelete.id).length > 0
              ? `Esta tarefa possui ${data.tasks.filter((t) => t.parentId === taskToDelete.id).length} subtarefas vinculadas. Ao excluí-la, todas as subtarefas também serão removidas permanentemente.`
              : "Deseja remover permanentemente esta tarefa de sua lista?"
          }
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => {
            const t = taskToDelete;
            setTaskToDelete(null);
            handleDeleteTask(t);
          }}
          onCancel={() => setTaskToDelete(null)}
        />
      )}

      {habitToConfirm && (
        <ConfirmModal
          title="Marcar hábito?"
          description={`Deseja marcar o hábito "${habitToConfirm.name}" como concluído hoje?`}
          confirmLabel="Sim, concluir"
          cancelLabel="Cancelar"
          variant="default"
          onConfirm={async () => {
            const hId = habitToConfirm.id;
            setHabitToConfirm(null);
            if (hId === undefined) return;
            try {
              await invoke("habit_mark_habit_done", {
                id: hId,
                userId: String(user?.id),
              });
              fetchAll();
              toast.success("Hábito concluído!");
            } catch {
              toast.error("Erro ao atualizar hábito");
            }
          }}
          onCancel={() => setHabitToConfirm(null)}
        />
      )}
    </div>
  );
}
