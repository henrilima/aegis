"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/context/ThemeContext";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  // Mapeia os temas do Aegis para o esquema do Sonner (light/dark)
  const sonnerTheme =
    theme === "light" || theme === "coffee" ? "light" : "dark";

  return (
    <Sonner
      theme={sonnerTheme}
      className="toaster group"
      // Habilita o botão de fechar nativo do sonner
      visibleToasts={1}
      expand={false}
      position="bottom-right"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-500" />,
        info: <InfoIcon className="size-4 text-blue-500" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-500" />,
        error: <OctagonXIcon className="size-4 text-red-500" />,
        loading: (
          <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        ),
      }}
      toastOptions={{
        // Forçar cores do Aegis diretamente no estilo do toast
        style: {
          background: "var(--card)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
        },
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-none",
          description: "group-[.toast]:text-muted-foreground text-[11px]",
          title: "font-bold text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Ajuste fino no botão de fechar para garantir visibilidade e clique
          closeButton:
            "opacity-100 group-hover:opacity-100 bg-background border-border text-foreground hover:bg-accent",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
