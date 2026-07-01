/**
 * Configuração de temas cromáticos para o projeto Aegis.
 */
export type ChromaticThemeId =
  | "default"
  | "midnight"
  | "nordic"
  | "carbon"
  | "coffee"
  | "dracula"
  | "light";

export interface ChromaticTheme {
  id: ChromaticThemeId;
  label: string;
  description: string;
  previewColor: string;
  primary:
    | "blue"
    | "amber"
    | "teal"
    | "violet"
    | "green"
    | "red"
    | "orange"
    | "carbon"
    | "coffee"
    | "sky"
    | "indigo";
}

export const CHROMATIC_THEMES: ChromaticTheme[] = [
  {
    id: "default",
    label: "Aegis Default",
    description: "O visual clássico e neutro do Aegis.",
    previewColor: "#171717",
    primary: "blue",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Escuridão profunda para máxima concentração.",
    previewColor: "#0D0D0D",
    primary: "sky",
  },
  {
    id: "nordic",
    label: "Nordic Ocean",
    description: "Azul ardósia frio e profissional.",
    previewColor: "#1A1D23",
    primary: "sky",
  },
  {
    id: "carbon",
    label: "Carbon Steel",
    description: "Cinza industrial metálico e ultra-resistente.",
    previewColor: "#121417",
    primary: "carbon",
  },
  {
    id: "dracula",
    label: "Dracula",
    description: "Inspirado no clássico tema para desenvolvedores.",
    previewColor: "#1A1626",
    primary: "violet",
  },
  {
    id: "light",
    label: "Clarify",
    description: "Um visual limpo e claro em tons de branco e cinza.",
    previewColor: "#F5F5F5",
    primary: "blue",
  },
  {
    id: "coffee",
    label: "Cappuccino Cream",
    description: "Equilíbrio perfeito: bege creme e marrom café.",
    previewColor: "#EAE0D5",
    primary: "coffee",
  },
];
