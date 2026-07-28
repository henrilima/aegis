/**
 * colors.config.ts
 *
 * Fonte única de verdade para a paleta de cores do Aegis.
 * Gerencia o mapeamento entre chaves de cores (Tailwind) e seus respectivos códigos hexadecimais.
 */

export const HEX_COLORS = {
  blue: "#3b82f6",
  sky: "#0ea5e9",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  slate: "#94a3b8",
  zinc: "#a1a1aa",
  neutral: "#a3a3a3",
  stone: "#a8a29e",
  // Cores customizadas mantidas para compatibilidade de temas
  coffee: "#8d7767",
  carbon: "#3f3f46",
} as const;

export type ThemeColorKey = keyof typeof HEX_COLORS;

export interface ColorTokens {
  text: string;
  textSub: string;
  bg: string;
  bgHover: string;
  active: string;
  border: string;
  borderHover: string;
  solid: string;
  solidHover: string;
  textDark: string;
  textDarkHover: string;
}

/**
 * Lista de cores disponíveis para seleção pelo usuário (ignorando cores de sistema/especiais)
 */
export const SELECTABLE_COLORS: {
  key: ThemeColorKey;
  label: string;
  hex: string;
}[] = [
  { key: "blue", label: "Azul", hex: HEX_COLORS.blue },
  { key: "sky", label: "Céu", hex: HEX_COLORS.sky },
  { key: "cyan", label: "Ciano", hex: HEX_COLORS.cyan },
  { key: "teal", label: "Teal", hex: HEX_COLORS.teal },
  { key: "emerald", label: "Esmeralda", hex: HEX_COLORS.emerald },
  { key: "green", label: "Verde", hex: HEX_COLORS.green },
  { key: "lime", label: "Limão", hex: HEX_COLORS.lime },
  { key: "yellow", label: "Amarelo", hex: HEX_COLORS.yellow },
  { key: "amber", label: "Âmbar", hex: HEX_COLORS.amber },
  { key: "orange", label: "Laranja", hex: HEX_COLORS.orange },
  { key: "red", label: "Vermelho", hex: HEX_COLORS.red },
  { key: "rose", label: "Rosa", hex: HEX_COLORS.rose },
  { key: "pink", label: "Pink", hex: HEX_COLORS.pink },
  { key: "fuchsia", label: "Fúcsia", hex: HEX_COLORS.fuchsia },
  { key: "purple", label: "Roxo", hex: HEX_COLORS.purple },
  { key: "violet", label: "Violeta", hex: HEX_COLORS.violet },
  { key: "indigo", label: "Índigo", hex: HEX_COLORS.indigo },
  { key: "slate", label: "Ardósia", hex: HEX_COLORS.slate },
  { key: "neutral", label: "Neutro", hex: HEX_COLORS.neutral },
];

/**
 * Utilitários para Tailwind
 */
export const THEME_COLORS_CONFIG: Record<ThemeColorKey, ColorTokens> = {
  blue: {
    text: "text-blue-600 dark:text-blue-400",
    textSub: "text-blue-500 dark:text-blue-400/80",
    bg: "bg-blue-600/10",
    bgHover: "hover:bg-blue-600/20",
    active: "bg-blue-500/12",
    border: "border-blue-600/20",
    borderHover: "hover:border-blue-500/50",
    solid: "bg-blue-600",
    solidHover: "hover:bg-blue-700",
    textDark: "text-blue-300",
    textDarkHover: "hover:text-blue-200",
  },
  sky: {
    text: "text-sky-600 dark:text-sky-400",
    textSub: "text-sky-500 dark:text-sky-400/80",
    bg: "bg-sky-600/10",
    bgHover: "hover:bg-sky-600/20",
    active: "bg-sky-500/12",
    border: "border-sky-600/20",
    borderHover: "hover:border-sky-400/50",
    solid: "bg-sky-600",
    solidHover: "hover:bg-sky-700",
    textDark: "text-sky-300",
    textDarkHover: "hover:text-sky-200",
  },
  cyan: {
    text: "text-cyan-600 dark:text-cyan-400",
    textSub: "text-cyan-500 dark:text-cyan-400/80",
    bg: "bg-cyan-600/10",
    bgHover: "hover:bg-cyan-600/20",
    active: "bg-cyan-500/12",
    border: "border-cyan-600/20",
    borderHover: "hover:border-cyan-400/50",
    solid: "bg-cyan-600",
    solidHover: "hover:bg-cyan-700",
    textDark: "text-cyan-300",
    textDarkHover: "hover:text-cyan-200",
  },
  indigo: {
    text: "text-indigo-600 dark:text-indigo-400",
    textSub: "text-indigo-500 dark:text-indigo-400/80",
    bg: "bg-indigo-600/10",
    bgHover: "hover:bg-indigo-600/20",
    active: "bg-indigo-500/12",
    border: "border-indigo-600/20",
    borderHover: "hover:border-indigo-400/50",
    solid: "bg-indigo-600",
    solidHover: "hover:bg-indigo-700",
    textDark: "text-indigo-300",
    textDarkHover: "hover:text-indigo-200",
  },
  violet: {
    text: "text-violet-600 dark:text-violet-400",
    textSub: "text-violet-500 dark:text-violet-400/80",
    bg: "bg-violet-600/10",
    bgHover: "hover:bg-violet-600/20",
    active: "bg-violet-500/12",
    border: "border-violet-600/20",
    borderHover: "hover:border-violet-400/50",
    solid: "bg-violet-600",
    solidHover: "hover:bg-violet-700",
    textDark: "text-violet-300",
    textDarkHover: "hover:text-violet-200",
  },
  purple: {
    text: "text-purple-600 dark:text-purple-400",
    textSub: "text-purple-500 dark:text-purple-400/80",
    bg: "bg-purple-600/10",
    bgHover: "hover:bg-purple-600/20",
    active: "bg-purple-500/12",
    border: "border-purple-600/20",
    borderHover: "hover:border-purple-400/50",
    solid: "bg-purple-600",
    solidHover: "hover:bg-purple-700",
    textDark: "text-purple-300",
    textDarkHover: "hover:text-purple-200",
  },
  fuchsia: {
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    textSub: "text-fuchsia-500 dark:text-fuchsia-400/80",
    bg: "bg-fuchsia-600/10",
    bgHover: "hover:bg-fuchsia-600/20",
    active: "bg-fuchsia-500/12",
    border: "border-fuchsia-600/20",
    borderHover: "hover:border-fuchsia-400/50",
    solid: "bg-fuchsia-600",
    solidHover: "hover:bg-fuchsia-700",
    textDark: "text-fuchsia-300",
    textDarkHover: "hover:text-fuchsia-200",
  },
  pink: {
    text: "text-pink-600 dark:text-pink-400",
    textSub: "text-pink-500 dark:text-pink-400/80",
    bg: "bg-pink-600/10",
    bgHover: "hover:bg-pink-600/20",
    active: "bg-pink-500/12",
    border: "border-pink-600/20",
    borderHover: "hover:border-pink-400/50",
    solid: "bg-pink-600",
    solidHover: "hover:bg-pink-700",
    textDark: "text-pink-300",
    textDarkHover: "hover:text-pink-200",
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    textSub: "text-rose-500 dark:text-rose-400/80",
    bg: "bg-rose-600/10",
    bgHover: "hover:bg-rose-600/20",
    active: "bg-rose-500/12",
    border: "border-rose-600/20",
    borderHover: "hover:border-rose-400/50",
    solid: "bg-rose-600",
    solidHover: "hover:bg-rose-700",
    textDark: "text-rose-300",
    textDarkHover: "hover:text-rose-200",
  },
  red: {
    text: "text-red-600 dark:text-red-400",
    textSub: "text-red-500 dark:text-red-400/80",
    bg: "bg-red-600/10",
    bgHover: "hover:bg-red-600/20",
    active: "bg-red-500/12",
    border: "border-red-600/20",
    borderHover: "hover:border-red-400/50",
    solid: "bg-red-600",
    solidHover: "hover:bg-red-700",
    textDark: "text-red-300",
    textDarkHover: "hover:text-red-200",
  },
  orange: {
    text: "text-orange-600 dark:text-orange-400",
    textSub: "text-orange-500 dark:text-orange-400/80",
    bg: "bg-orange-600/10",
    bgHover: "hover:bg-orange-600/20",
    active: "bg-orange-500/12",
    border: "border-orange-600/20",
    borderHover: "hover:border-orange-400/50",
    solid: "bg-orange-600",
    solidHover: "hover:bg-orange-700",
    textDark: "text-orange-300",
    textDarkHover: "hover:text-orange-200",
  },
  amber: {
    text: "text-amber-700 dark:text-amber-400",
    textSub: "text-amber-600 dark:text-amber-400/80",
    bg: "bg-amber-500/10",
    bgHover: "hover:bg-amber-500/20",
    active: "bg-amber-500/12",
    border: "border-amber-500/20",
    borderHover: "hover:border-amber-400/50",
    solid: "bg-amber-500",
    solidHover: "hover:bg-amber-600",
    textDark: "text-amber-300",
    textDarkHover: "hover:text-amber-200",
  },
  yellow: {
    text: "text-yellow-700 dark:text-yellow-400",
    textSub: "text-yellow-600 dark:text-yellow-400/80",
    bg: "bg-yellow-500/10",
    bgHover: "hover:bg-yellow-500/20",
    active: "bg-yellow-500/12",
    border: "border-yellow-500/20",
    borderHover: "hover:border-yellow-400/50",
    solid: "bg-yellow-500",
    solidHover: "hover:bg-yellow-600",
    textDark: "text-yellow-300",
    textDarkHover: "hover:text-yellow-200",
  },
  lime: {
    text: "text-lime-700 dark:text-lime-400",
    textSub: "text-lime-600 dark:text-lime-400/80",
    bg: "bg-lime-600/10",
    bgHover: "hover:bg-lime-600/20",
    active: "bg-lime-500/12",
    border: "border-lime-600/20",
    borderHover: "hover:border-lime-400/50",
    solid: "bg-lime-600",
    solidHover: "hover:bg-lime-700",
    textDark: "text-lime-300",
    textDarkHover: "hover:text-lime-200",
  },
  green: {
    text: "text-green-600 dark:text-green-400",
    textSub: "text-green-500 dark:text-green-400/80",
    bg: "bg-green-600/10",
    bgHover: "hover:bg-green-600/20",
    active: "bg-green-500/12",
    border: "border-green-600/20",
    borderHover: "hover:border-green-400/50",
    solid: "bg-green-600",
    solidHover: "hover:bg-green-700",
    textDark: "text-green-300",
    textDarkHover: "hover:text-green-200",
  },
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    textSub: "text-emerald-500 dark:text-emerald-400/80",
    bg: "bg-emerald-600/10",
    bgHover: "hover:bg-emerald-600/20",
    active: "bg-emerald-500/12",
    border: "border-emerald-600/20",
    borderHover: "hover:border-emerald-400/50",
    solid: "bg-emerald-600",
    solidHover: "hover:bg-emerald-700",
    textDark: "text-emerald-300",
    textDarkHover: "hover:text-emerald-200",
  },
  teal: {
    text: "text-teal-600 dark:text-teal-400",
    textSub: "text-teal-500 dark:text-teal-400/80",
    bg: "bg-teal-600/10",
    bgHover: "hover:bg-teal-600/20",
    active: "bg-teal-500/12",
    border: "border-teal-600/20",
    borderHover: "hover:border-teal-400/50",
    solid: "bg-teal-600",
    solidHover: "hover:bg-teal-700",
    textDark: "text-teal-300",
    textDarkHover: "hover:text-teal-200",
  },
  slate: {
    text: "text-slate-600 dark:text-slate-400",
    textSub: "text-slate-500 dark:text-slate-400/80",
    bg: "bg-slate-700/20",
    bgHover: "hover:bg-slate-700/30",
    active: "bg-slate-600/20",
    border: "border-slate-600/30",
    borderHover: "hover:border-slate-500/50",
    solid: "bg-slate-600",
    solidHover: "hover:bg-slate-500",
    textDark: "text-slate-300",
    textDarkHover: "hover:text-slate-200",
  },
  zinc: {
    text: "text-zinc-600 dark:text-zinc-400",
    textSub: "text-zinc-500 dark:text-zinc-400/80",
    bg: "bg-zinc-700/20",
    bgHover: "hover:bg-zinc-700/30",
    active: "bg-zinc-600/20",
    border: "border-zinc-600/30",
    borderHover: "hover:border-zinc-500/50",
    solid: "bg-zinc-600",
    solidHover: "hover:bg-zinc-500",
    textDark: "text-zinc-300",
    textDarkHover: "hover:text-zinc-100",
  },
  neutral: {
    text: "text-neutral-600 dark:text-neutral-400",
    textSub: "text-neutral-500 dark:text-neutral-400/80",
    bg: "bg-neutral-700/20",
    bgHover: "hover:bg-neutral-700/30",
    active: "bg-neutral-600/20",
    border: "border-neutral-600/30",
    borderHover: "hover:border-neutral-500/50",
    solid: "bg-neutral-600",
    solidHover: "hover:bg-neutral-500",
    textDark: "text-neutral-300",
    textDarkHover: "hover:text-neutral-200",
  },
  stone: {
    text: "text-stone-600 dark:text-stone-400",
    textSub: "text-stone-500 dark:text-stone-400/80",
    bg: "bg-stone-700/20",
    bgHover: "hover:bg-stone-700/30",
    active: "bg-stone-600/20",
    border: "border-stone-600/30",
    borderHover: "hover:border-stone-500/50",
    solid: "bg-stone-600",
    solidHover: "hover:bg-stone-500",
    textDark: "text-stone-300",
    textDarkHover: "hover:text-stone-200",
  },
  coffee: {
    text: "text-[#6b584a] dark:text-[#a68d7a]",
    textSub: "text-[#8d7767] dark:text-[#a68d7a]/80",
    bg: "bg-[#8d7767]/10",
    bgHover: "hover:bg-[#8d7767]/20",
    active: "bg-[#8d7767]/15",
    border: "border-[#8d7767]/30",
    borderHover: "hover:border-[#8d7767]/50",
    solid: "bg-[#8d7767]",
    solidHover: "hover:bg-[#a68d7a]",
    textDark: "text-[#fef3c7]",
    textDarkHover: "hover:text-white",
  },
  carbon: {
    text: "text-zinc-600 dark:text-zinc-400",
    textSub: "text-zinc-500 dark:text-zinc-400/80",
    bg: "bg-zinc-800/40",
    bgHover: "hover:bg-zinc-800/60",
    active: "bg-zinc-700/50",
    border: "border-zinc-700/50",
    borderHover: "hover:border-zinc-500/50",
    solid: "bg-zinc-700",
    solidHover: "hover:bg-zinc-600",
    textDark: "text-zinc-300",
    textDarkHover: "hover:text-zinc-100",
  },
} as const;

/**
 * Resolve uma cor que pode ser tanto uma chave (ex: "blue") quanto um código Hex (ex: "#3b82f6").
 * @returns O código hexadecimal correspondente.
 */
export function resolveColor(color: string | undefined | null): string {
  if (!color) return "#6b7280"; // Cor padrão (cinza)

  // Se for uma chave mapeada, retorna o Hex dela
  if (color in HEX_COLORS) {
    return HEX_COLORS[color as ThemeColorKey];
  }

  // Caso contrário, assume que já é um Hex válido
  return color;
}

/**
 * Utilitário para padronizar o estilo de bordas e ícones baseados em cores das tarefas e notas.
 * @param color Chave da cor ou código Hex.
 * @param isCompleted Se o item está concluído (opcional).
 * @returns Um objeto com os estilos inline e cores processadas.
 */
export function resolveTaskStyles(
  color: string | undefined | null,
  isCompleted: boolean = false,
) {
  const baseColor = resolveColor(color);

  // Opacidade da borda: mais suave se concluído
  const borderOpacity = isCompleted ? "40" : "90";
  // Opacidade do ícone (Circle): sempre um pouco mais suave que o CheckCircle
  const iconMutedOpacity = "60";

  return {
    baseColor,
    borderColor: color ? `${baseColor}${borderOpacity}` : undefined,
    iconColor: baseColor,
    iconColorMuted: `${baseColor}${iconMutedOpacity}`,
    badgeBg: `${baseColor}15`,
    badgeBorder: `1px solid ${baseColor}25`,
  };
}

/**
 * Mapeamento de nomes de cores em português (e termos em inglês) para ThemeColorKey.
 */
export const COLOR_TAG_MAP: Record<string, ThemeColorKey> = {
  // Português & Aliases
  azul: "blue",
  ceu: "sky",
  céu: "sky",
  ciano: "cyan",
  esmeralda: "emerald",
  verde: "green",
  limao: "lime",
  limão: "lime",
  amarelo: "yellow",
  ambar: "amber",
  âmbar: "amber",
  laranja: "orange",
  vermelho: "red",
  rosa: "rose",
  fucsia: "fuchsia",
  fúcsia: "fuchsia",
  roxo: "purple",
  violeta: "violet",
  índigo: "indigo",
  ardosia: "slate",
  ardósia: "slate",
  neutro: "neutral",
  cinza: "neutral",
  pedra: "stone",
  cafe: "coffee",
  café: "coffee",
  carbono: "carbon",

  // Chaves de cores em inglês (ThemeColorKey)
  blue: "blue",
  sky: "sky",
  cyan: "cyan",
  teal: "teal",
  emerald: "emerald",
  green: "green",
  lime: "lime",
  yellow: "yellow",
  amber: "amber",
  orange: "orange",
  red: "red",
  rose: "rose",
  pink: "pink",
  fuchsia: "fuchsia",
  purple: "purple",
  violet: "violet",
  indigo: "indigo",
  slate: "slate",
  zinc: "zinc",
  neutral: "neutral",
  stone: "stone",
  coffee: "coffee",
  carbon: "carbon",
};

/**
 * Tenta encontrar uma cor de tema correspondente a partir de uma tag ou lista de tags.
 */
export function resolveColorFromTag(
  tags?: string | string[],
): ThemeColorKey | null {
  if (!tags) return null;
  const tagList = Array.isArray(tags)
    ? tags
    : tags.split(",").map((t) => t.trim().toLowerCase());

  for (const t of tagList) {
    const cleanTag = t.trim().toLowerCase();
    if (cleanTag in COLOR_TAG_MAP) {
      return COLOR_TAG_MAP[cleanTag];
    }
  }
  return null;
}
