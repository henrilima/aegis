import { BotMessageSquare, Brain } from "lucide-react";
import type React from "react";
import { changeModule } from "./lib/utils";

export interface NotificationButton {
  label: string;
  url?: string;
  action?: () => void;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface PersistentNotification {
  id: number;
  title: string;
  body: string;
  category: string;
  isRead: boolean;
  createdAt: string;
  tag?: string;
  persistent: boolean;
  color?: string;
  icon?: string | React.ComponentType<{ className?: string }>;
  buttons?: NotificationButton[];
}

export const PERSISTENT_NOTIFICATIONS: PersistentNotification[] = [
  {
    id: -1,
    title: "Bem-vindo à Comunidade!",
    body: "Obrigado por usar o Aegis! Para uma experiência melhor, junte-se ao nosso servidor oficial no Discord. Lá você encontrará suporte, poderá enviar feedback direto aos desenvolvedores e ficar por dentro de todas as novidades.",
    category: "fixas",
    isRead: false,
    createdAt: "2026-05-21T12:00:00Z",
    tag: "discord-invite",
    persistent: true,
    color: "blue",
    icon: BotMessageSquare,
    buttons: [
      {
        label: "Entrar no Discord",
        url: "https://discord.gg/pCQTuTGJUx",
        className: "bg-blue-800 hover:bg-blue-900 text-white",
        icon: BotMessageSquare,
      },
    ],
  },
  {
    id: -2,
    title: "Novo módulo: Flashcards",
    body: "O novo módulo de Flashcards chegou! Teste seus conhecimentos e aprenda de forma mais eficiente.",
    category: "fixas",
    isRead: false,
    createdAt: "2026-05-25T12:00:00Z",
    tag: "flashcards",
    persistent: true,
    color: "cyan",
    icon: Brain,
    buttons: [
      {
        label: "Ver Flashcards",
        action: () => changeModule("flashcards"),
        className: "bg-cyan-800 hover:bg-cyan-900 text-white",
        icon: Brain,
      },
    ],
  },
];
