"use client";

import {
  Activity,
  AlarmClock,
  BarChart3,
  Book,
  BookOpen,
  CalendarDays,
  FileText,
  Film,
  ListTodo,
  Lock,
  type LucideIcon,
  Moon,
  Timer,
  Trophy,
} from "lucide-react";
import { type ModuleId, useModules } from "@/context/ModuleContext";
import { useTheme } from "@/context/ThemeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

const MODULE_DEFS: {
  id: ModuleId;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}[] = [
  {
    id: "passwords",
    label: "Senhas & Cofre",
    description: "Gerenciador de senhas criptografado localmente",
    icon: Lock,
    color: "amber",
  },
  {
    id: "tasks",
    label: "Tarefas",
    description: "Lista de afazeres e gerenciamento de prioridades",
    icon: ListTodo,
    color: "red",
  },
  {
    id: "calendar",
    label: "Calendário",
    description: "Visualização de eventos, prazos e feriados",
    icon: CalendarDays,
    color: "green",
  },
  {
    id: "notes",
    label: "Anotações",
    description: "Bloco de notas rápido com suporte a fixação",
    icon: FileText,
    color: "orange",
  },
  {
    id: "studies",
    label: "Estudos",
    description: "Controle de horas de estudo e questões resolvidas",
    icon: BookOpen,
    color: "violet",
  },
  {
    id: "reading",
    label: "Leitura",
    description: "Acompanhamento de livros e metas de leitura",
    icon: Book,
    color: "orange",
  },
  {
    id: "dictionary",
    label: "Dicionário",
    description: "Busca rápida de significados e termos",
    icon: Book,
    color: "sky",
  },
  {
    id: "flashcards",
    label: "Flashcards",
    description: "Crie baralhos de cartões e pratique repetição espaçada",
    icon: BookOpen,
    color: "blue",
  },
  {
    id: "movies",
    label: "Filmes",
    description: "Biblioteca de filmes assistidos e lista de desejos",
    icon: Film,
    color: "rose",
  },
  {
    id: "habits",
    label: "Hábitos",
    description: "Rastreador de hábitos diários e consistência",
    icon: Activity,
    color: "teal",
  },
  {
    id: "pomodoro",
    label: "Pomodoro",
    description: "Timer de foco e intervalos programados",
    icon: Timer,
    color: "red",
  },
  {
    id: "sleep",
    label: "Sono",
    description: "Registro de qualidade e duração do descanso",
    icon: Moon,
    color: "blue",
  },
  {
    id: "alarms",
    label: "Alarmes",
    description: "Gerenciamento de alertas e despertadores",
    icon: AlarmClock,
    color: "red",
  },
  {
    id: "statistics",
    label: "Estatísticas",
    description: "Análise global de desempenho e uso do app",
    icon: BarChart3,
    color: "red",
  },
  {
    id: "achievements",
    label: "Conquistas & Árvore",
    description:
      "Salão de troféus, desafios diários e crescimento da árvore do Aegis",
    icon: Trophy,
    color: "amber",
  },
];

export function ModulesTab() {
  const { isModuleEnabled, toggleModule } = useModules();
  const { themeStyles } = useTheme();

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULE_DEFS.map((mod) => {
          const enabled = isModuleEnabled(mod.id);
          const moduleColor = getModuleColor(mod.id);
          const m = getColorTheme(moduleColor);

          return (
            <div
              key={mod.id}
              className={cn(
                "flex flex-col p-6 rounded-2xl border transition-all duration-300",
                enabled
                  ? "bg-card border-border hover:border-border/80"
                  : "bg-muted/10 border-transparent opacity-60",
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                    enabled
                      ? cn(m.bg, m.text, m.border)
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <mod.icon className="w-6 h-6" />
                </div>

                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    enabled ? themeStyles.solid : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      enabled ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{mod.label}</p>
                <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                  {mod.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
