import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function setCookie(name: string, value: string, maxAge: number) {
  // biome-ignore lint/suspicious/noDocumentCookie: Uso intencional para persistência simples do estado da sidebar
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}
