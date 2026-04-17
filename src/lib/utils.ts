import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_CONFIG } from "@/app.config";
import { CHROMATIC_THEMES, type ChromaticThemeId } from "@/themes.config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function setCookie(name: string, value: string, maxAge: number) {
  // biome-ignore lint/suspicious/noDocumentCookie: Uso intencional para persistência simples do estado da sidebar
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export const THEME_COLORS = {
  blue: {
    text: "text-blue-500",
    textSub: "text-blue-400",
    bg: "bg-blue-600/10",
    bgHover: "hover:bg-blue-600/20",
    active: "bg-blue-500/12",
    border: "border-blue-600/20",
    borderHover: "hover:border-blue-500",
    solid: "bg-blue-600",
    solidHover: "hover:bg-blue-700",
    textDark: "text-blue-300",
    textDarkHover: "hover:text-blue-200",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-500",
    textSub: "text-amber-400",
    bg: "bg-amber-500/10",
    bgHover: "hover:bg-amber-500/20",
    active: "bg-amber-500/12",
    border: "border-amber-500/20",
    borderHover: "hover:border-amber-400",
    solid: "bg-amber-500",
    solidHover: "hover:bg-amber-600",
    textDark: "text-amber-300",
    textDarkHover: "hover:text-amber-200",
  },
  teal: {
    text: "text-teal-500",
    textSub: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-600/10",
    bgHover: "hover:bg-teal-600/20",
    active: "bg-teal-500/12",
    border: "border-teal-600/20",
    borderHover: "hover:border-teal-400",
    solid: "bg-teal-600",
    solidHover: "hover:bg-teal-700",
    textDark: "text-teal-300",
    textDarkHover: "hover:text-teal-200",
  },
  violet: {
    text: "text-violet-500",
    textSub: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-600/10",
    bgHover: "hover:bg-violet-600/20",
    active: "bg-violet-500/12",
    border: "border-violet-600/20",
    borderHover: "hover:border-violet-400",
    solid: "bg-violet-600",
    solidHover: "hover:bg-violet-700",
    textDark: "text-violet-300",
    textDarkHover: "hover:text-violet-200",
  },
  green: {
    text: "text-green-500",
    textSub: "text-green-400",
    bg: "bg-green-600/10",
    bgHover: "hover:bg-green-600/20",
    active: "bg-green-500/12",
    border: "border-green-600/20",
    borderHover: "hover:border-green-400",
    solid: "bg-green-600",
    solidHover: "hover:bg-green-700",
    textDark: "text-green-300",
    textDarkHover: "hover:text-green-200",
  },
  red: {
    text: "text-red-500",
    textSub: "text-red-600 dark:text-red-400",
    bg: "bg-red-600/10",
    bgHover: "hover:bg-red-600/20",
    active: "bg-red-500/12",
    border: "border-red-600/20",
    borderHover: "hover:border-red-400",
    solid: "bg-red-600",
    solidHover: "hover:bg-red-700",
    textDark: "text-red-300",
    textDarkHover: "hover:text-red-200",
  },
  orange: {
    text: "text-orange-500",
    textSub: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-600/10",
    bgHover: "hover:bg-orange-600/20",
    active: "bg-orange-500/12",
    border: "border-orange-600/20",
    borderHover: "hover:border-orange-400",
    solid: "bg-orange-600",
    solidHover: "hover:bg-orange-700",
    textDark: "text-orange-300",
    textDarkHover: "hover:text-orange-200",
  },
  sky: {
    text: "text-sky-500",
    textSub: "text-sky-400",
    bg: "bg-sky-600/10",
    bgHover: "hover:bg-sky-600/20",
    active: "bg-sky-500/12",
    border: "border-sky-600/20",
    borderHover: "hover:border-sky-400",
    solid: "bg-sky-600",
    solidHover: "hover:bg-sky-700",
    textDark: "text-sky-300",
    textDarkHover: "hover:text-sky-200",
  },
  coffee: {
    text: "text-[#8d7767]",
    textSub: "text-[#a68d7a]",
    bg: "bg-[#8d7767]/10",
    bgHover: "hover:bg-[#8d7767]/20",
    active: "bg-[#8d7767]/15",
    border: "border-[#8d7767]/30",
    borderHover: "hover:border-[#8d7767]",
    solid: "bg-[#8d7767]",
    solidHover: "hover:bg-[#a68d7a]",
    textDark: "text-[#fef3c7]",
    textDarkHover: "hover:text-white",
  },
  carbon: {
    text: "text-zinc-400",
    textSub: "text-zinc-500",
    bg: "bg-zinc-800/40",
    bgHover: "hover:bg-zinc-800/60",
    active: "bg-zinc-700/50",
    border: "border-zinc-700/50",
    borderHover: "hover:border-zinc-500",
    solid: "bg-zinc-700",
    solidHover: "hover:bg-zinc-600",
    textDark: "text-zinc-300",
    textDarkHover: "hover:text-zinc-100",
  },
};

export function getColorTheme(colorName: string) {
  return (
    THEME_COLORS[colorName as keyof typeof THEME_COLORS] || THEME_COLORS.blue
  );
}

export function getThemeColor(themeId?: ChromaticThemeId) {
  let primary = APP_CONFIG.theme.primary;

  // Se um tema cromático for fornecido, usamos a cor primária harmonizada
  if (themeId) {
    const config = CHROMATIC_THEMES.find((t) => t.id === themeId);
    if (config) {
      primary = config.primary;
    }
  }

  const theme = getColorTheme(primary);
  return {
    ...theme,
    name: primary || "blue",
  };
}

// Formata data para YYYY-MM-DD (local)
export function formatDateLocal(date?: Date): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
