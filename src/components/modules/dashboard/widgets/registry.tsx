"use client";

import type React from "react";
import { AlarmsWidget } from "./alarms/AlarmsWidget";
import { CalendarWidget } from "./calendar/CalendarWidget";

import { DictionaryWidget } from "./dictionary/DictionaryWidget";
import { HabitsWidget } from "./habits/HabitsWidget";
import { MoviesWidget } from "./movies/MoviesWidget";
import { NotesWidget } from "./notes/NotesWidget";
import { PomodoroWidget } from "./pomodoro/PomodoroWidget";
import { ReadingWidget } from "./reading/ReadingWidget";
import { SonoWidget } from "./sleep/SleepWidget";
import { StatisticsWidget } from "./statistics/StatisticsWidget";
import { EstudosWidget } from "./studies/StudiesWidget";
import { TasksWidget } from "./tasks/TasksWidget";

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
];
