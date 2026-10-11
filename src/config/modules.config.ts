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
    color: "green",
  },
  pomodoro: {
    route: "pomodoro",
    label: "Pomodoro",
    color: "red",
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
    color: "orange",
  },
  studies: {
    route: "studies",
    label: "Estudos",
    color: "violet",
  },
  grades: {
    route: "grades",
    label: "Simulados & Notas",
    color: "emerald",
  },
  reading: {
    route: "reading",
    label: "Leitura",
    color: "indigo",
  },
  dictionary: {
    route: "dictionary",
    label: "Dicionário",
    color: "blue",
  },
  flashcards: {
    route: "flashcards",
    label: "Flashcards",
    color: "cyan",
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
  achievements: {
    route: "achievements",
    label: "Conquistas & Desafios",
    color: "amber",
  },
} as const satisfies Record<string, ModuleConfig>;

export type ModuleId = keyof typeof MODULE_CONFIGS;

export const PORTAL_DESCRIPTIONS: Record<string, string> = {
  passwords:
    "Cofre de segurança local de senhas com criptografia avançada AES-256-GCM.",
  tasks:
    "Gerenciador de tarefas com prioridades, datas de vencimento e sub-tarefas.",
  calendar:
    "Visualização integrada de eventos e tarefas agendadas em calendário.",
  notes: "Editor pessoal de anotações com suporte nativo a Markdown.",
  studies:
    "Controle do tempo de estudo por matéria, progresso e metas semanais.",
  grades:
    "Registro de notas e simulados com cálculo de médias e status de aprovação por matéria.",
  reading: "Acompanhamento de hábitos de leitura, páginas lidas e progresso.",
  dictionary: "Glossário e dicionário bilíngue pessoal de termos e idiomas.",
  movies: "Acervo cinematográfico pessoal integrado com busca automática TMDb.",
  habits: "Rastreamento diário de hábitos e sequências de consistência.",
  pomodoro: "Temporizador Pomodoro com contagem regressiva suave.",
  sleep: "Registro e análise de horas de sono e eficiência de repouso.",
  alarms: "Gerenciamento de despertadores e múltiplos alarmes recorrentes.",
  statistics: "Painel central de estatísticas integradas e heatmaps.",
  flashcards: "Memorização ativa com baralhos, repetição espaçada e flip 3D.",
  achievements:
    "Quadro de medalhas, desafios diários com recompensa de XP e evolução.",
};

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

/**
 * Mapeamento direto de rota para o nome do asset de logo do Discord Rich Presence.
 * Tem prioridade sobre o mapeamento por cor para garantir precisão por módulo.
 */
export const ROUTE_DISCORD_ASSET_MAP: Partial<Record<string, string>> = {
  // Dashboard (azul)
  dashboard: "aegis_azul",
  // Produtividade (vermelho/amarelo/verde)
  tasks: "aegis_vermelho",
  pomodoro: "aegis_vermelho",
  alarms: "aegis_vermelho",
  calendar: "aegis_verde",
  habits: "aegis_azul", 
  // Conhecimento
  notes: "aegis_laranja",
  studies: "aegis_roxo",
  grades: "aegis_verde",
  reading: "aegis_roxo",
  dictionary: "aegis_azul",
  flashcards: "aegis_azul",
  // Entretenimento
  movies: "aegis_rosa",
  sleep: "aegis_azul",
  // Segurança & Sistema
  passwords: "aegis_amarelo",
  statistics: "aegis_roxo",
  achievements: "aegis_amarelo",
};

/**
 * Mapeamento de fallback da cor de identidade para o asset do Discord.
 */
export const COLOR_DISCORD_ASSET_MAP: Record<ThemeColorKey, string> = {
  yellow: "aegis_amarelo",
  amber: "aegis_amarelo",
  lime: "aegis_limao",
  green: "aegis_verde",
  emerald: "aegis_verde",
  teal: "aegis_azul",
  blue: "aegis_azul",
  sky: "aegis_azul",
  cyan: "aegis_azul",
  // indigo é azul visualmente no contexto do Aegis (Leitura)
  indigo: "aegis_azul",
  violet: "aegis_roxo",
  purple: "aegis_roxo",
  fuchsia: "aegis_rosa",
  pink: "aegis_rosa",
  rose: "aegis_rosa",
  red: "aegis_vermelho",
  orange: "aegis_laranja",
  slate: "aegis_branco",
  zinc: "aegis_branco",
  neutral: "aegis_branco",
  stone: "aegis_branco",
  coffee: "aegis_branco",
  carbon: "aegis_branco",
};

/**
 * Retorna o nome do asset de logo do Discord correspondente ao módulo.
 * Usa mapeamento direto por rota como prioridade, depois fallback por cor.
 *
 * @example
 *   getModuleDiscordAsset("notes")    // "aegis_laranja"
 *   getModuleDiscordAsset("studies")  // "aegis_roxo"
 *   getModuleDiscordAsset("reading")  // "aegis_azul"
 */
export function getModuleDiscordAsset(route: string): string {
  // Prioridade: mapeamento direto por rota
  const directAsset = ROUTE_DISCORD_ASSET_MAP[route];
  if (directAsset) return directAsset;
  // Fallback: derivar a partir da cor do módulo
  const color = getModuleColor(route);
  return COLOR_DISCORD_ASSET_MAP[color] ?? "aegis_logo";
}
