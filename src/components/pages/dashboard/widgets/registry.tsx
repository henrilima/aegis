"use client";

import type React from "react";
import { CalendarWidget } from "./calendar/CalendarWidget";
import { CurrencyWidget } from "./currency/CurrencyWidget";
import { HabitsWidget } from "./habits/HabitsWidget";
import { HydrationWidget } from "./hydration/HydrationWidget";
import { NotesWidget } from "./notes/NotesWidget";
import { PasswordsWidget } from "./passwords/PasswordsWidget";
import { PomodoroWidget } from "./pomodoro/PomodoroWidget";
import { SonoWidget } from "./sleep/SleepWidget";
import { StatisticsWidget } from "./statistics/StatisticsWidget";
import { EstudosWidget } from "./studies/StudiesWidget";

export const WIDGET_REGISTRY: Record<string, React.FC<any>> = {
  habits: HabitsWidget,
  pomodoro: PomodoroWidget,
  notes: NotesWidget,
  studies: EstudosWidget,
  sleep: SonoWidget,
  calendar: CalendarWidget,
  passwords: PasswordsWidget,
  hydration: HydrationWidget,
  currency: CurrencyWidget,
  statistics: StatisticsWidget,
};

export const WIDGET_METADATA = [
  { id: "habits", name: "Hábitos", description: "Progresso diário e recordes" },
  { id: "pomodoro", name: "Pomodoro", description: "Timer de foco e ciclos" },
  { id: "notes", name: "Notas", description: "Lembretes e notas rápidas" },
  { id: "studies", name: "Estudos", description: "Horas e sessões semanais" },
  { id: "sleep", name: "Sono", description: "Qualidade e duração média" },
  {
    id: "calendar",
    name: "Calendário",
    description: "Eventos e prazos importantes",
  },
  { id: "passwords", name: "Cofre", description: "Segurança e senhas" },
  { id: "hydration", name: "Hidratação", description: "Alertas de água" },
  { id: "currency", name: "Câmbio", description: "Cotações em tempo real" },
  {
    id: "statistics",
    name: "Estatísticas",
    description: "Análise de desempenho global",
  },
];
