"use client";

import dynamic from "next/dynamic";
import type React from "react";

// Skeleton de loading padrão para carregamento assíncrono dos widgets
const WidgetSkeleton = () => (
  <div className="h-full w-full bg-card/50 animate-pulse rounded-2xl min-h-[300px] border border-border/30" />
);

// Imports dinâmicos (Dynamic Imports) para otimizar o bundle size e evitar carregamento de componentes inativos
const HabitsWidget = dynamic(
  () => import("./habits/HabitsWidget").then((m) => m.HabitsWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const PomodoroWidget = dynamic(
  () => import("./pomodoro/PomodoroWidget").then((m) => m.PomodoroWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const NotesWidget = dynamic(
  () => import("./notes/NotesWidget").then((m) => m.NotesWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const TasksWidget = dynamic(
  () => import("./tasks/TasksWidget").then((m) => m.TasksWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const EstudosWidget = dynamic(
  () => import("./studies/StudiesWidget").then((m) => m.EstudosWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const SonoWidget = dynamic(
  () => import("./sleep/SleepWidget").then((m) => m.SonoWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const CalendarWidget = dynamic(
  () => import("./calendar/CalendarWidget").then((m) => m.CalendarWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const AlarmsWidget = dynamic(
  () => import("./alarms/AlarmsWidget").then((m) => m.AlarmsWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const StatisticsWidget = dynamic(
  () => import("./statistics/StatisticsWidget").then((m) => m.StatisticsWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const ReadingWidget = dynamic(
  () => import("./reading/ReadingWidget").then((m) => m.ReadingWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const MoviesWidget = dynamic(
  () => import("./movies/MoviesWidget").then((m) => m.MoviesWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const DictionaryWidget = dynamic(
  () =>
    import("./dictionary/DictionaryWidget").then((m) => m.DictionaryWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);
const FlashcardsWidget = dynamic(
  () =>
    import("./flashcards/FlashcardsWidget").then((m) => m.FlashcardsWidget),
  {
    loading: WidgetSkeleton,
    ssr: false,
  },
);

// biome-ignore lint/suspicious/noExplicitAny: Heterogeneous widget registry
export const WIDGET_REGISTRY: Record<string, React.ComponentType<any>> = {
  habits: HabitsWidget,
  pomodoro: PomodoroWidget,
  notes: NotesWidget,
  tasks: TasksWidget,
  studies: EstudosWidget,
  sleep: SonoWidget,
  calendar: CalendarWidget,
  alarms: AlarmsWidget,
  statistics: StatisticsWidget,
  reading: ReadingWidget,
  movies: MoviesWidget,
  dictionary: DictionaryWidget,
  flashcards: FlashcardsWidget,
};

export const WIDGET_METADATA = [
  { id: "habits", name: "Hábitos", description: "Progresso diário e recordes" },
  { id: "pomodoro", name: "Pomodoro", description: "Timer de foco e ciclos" },
  { id: "notes", name: "Anotações", description: "Lembretes e notas rápidas" },
  { id: "tasks", name: "Tarefas", description: "Lista de afazeres" },
  { id: "studies", name: "Estudos", description: "Horas e sessões semanais" },
  { id: "sleep", name: "Sono", description: "Qualidade e duração média" },
  {
    id: "calendar",
    name: "Calendário",
    description: "Eventos e prazos importantes",
  },
  {
    id: "alarms",
    name: "Alarmes",
    description: "Próximos alertas programados",
  },
  {
    id: "statistics",
    name: "Estatísticas",
    description: "Análise de desempenho global",
  },
  {
    id: "reading",
    name: "Leitura",
    description: "Progresso de livros e leitura semanal",
  },
  {
    id: "movies",
    name: "Cinema",
    description: "Filmes assistidos e lista de desejos",
  },
  {
    id: "dictionary",
    name: "Dicionário",
    description: "Glossário pessoal e busca rápida",
  },
  {
    id: "flashcards",
    name: "Flashcards",
    description: "Cartões pendentes e taxa de acerto",
  },
];
