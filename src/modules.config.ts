import type { ThemeColorKey } from "@/lib/utils";

/**
 * modules.config.ts
 *
 * Fonte única de verdade para a identidade visual de cada módulo.
 *
 * A cor é usada em: ModuleHeader, sidebar, widgets do dashboard,
 * botões primários, tabs ativas, bordas de foco e badges.
 */

export interface ModuleConfig {
  /** ID da rota */
  route: string;
  /** Nome de exibição do módulo */
  label: string;
  /** Cor de identidade do módulo */
  color: ThemeColorKey;
}

export const MODULE_CONFIGS = {
  //  Produtividade
  dashboard: {
    route: "dashboard",
    label: "Dashboard",
    color: "blue",
  },
  tasks: {
    route: "tasks",
    label: "Tarefas",
    color: "red",
  },
  calendar: {
    route: "calendar",
    label: "Calendário",
    color: "emerald",
  },
  pomodoro: {
    route: "pomodoro",
    label: "Pomodoro",
    color: "orange",
  },
  habits: {
    route: "habits",
    label: "Hábitos",
    color: "teal",
  },

  //  Conhecimento
  notes: {
    route: "notes",
    label: "Anotações",
    color: "lime",
  },
  studies: {
    route: "studies",
    label: "Estudos",
    color: "violet",
  },
  reading: {
    route: "reading",
    label: "Leitura",
    color: "indigo",
  },
  dictionary: {
    route: "dictionary",
    label: "Dicionário",
    color: "sky",
  },

  //  Entretenimento & Estilo de Vida
  movies: {
    route: "movies",
    label: "Filmes",
    color: "rose",
  },
  sleep: {
    route: "sleep",
    label: "Sono",
    color: "cyan",
  },

  //  Segurança & Sistema
  passwords: {
    route: "passwords",
    label: "Cofre",
    color: "amber",
  },
  alarms: {
    route: "alarms",
    label: "Alarmes",
    color: "red",
  },
  statistics: {
    route: "statistics",
    label: "Estatísticas",
    color: "purple",
  },
} as const satisfies Record<string, ModuleConfig>;

export type ModuleId = keyof typeof MODULE_CONFIGS;

/**
 * Retorna a configuração de um módulo pelo ID da rota.
 */
export function getModuleConfig(route: string): ModuleConfig {
  return (
    MODULE_CONFIGS[route as ModuleId] ?? {
      route,
      label: route,
      color: "blue",
    }
  );
}

/**
 * Retorna apenas a cor de identidade de um módulo.
 * Forma mais curta para uso em componentes.
 *
 * @example
 *   const color = getModuleColor("movies"); // "rose"
 *   <ModuleHeader color={color} ... />
 */
export function getModuleColor(route: string): ThemeColorKey {
  return getModuleConfig(route).color;
}
