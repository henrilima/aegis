"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigation } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { useSettingsLogic } from "../modules/settings/useSettingsLogic";

interface SidebarTriggerProps {
  isOpen: boolean;
  onToggle: () => void;
  floating?: boolean;
}

export function SidebarTrigger({
  isOpen,
  onToggle,
  floating,
}: SidebarTriggerProps) {
  const [mounted, setMounted] = useState(false);
  const { route } = useNavigation();
  const { accentColor } = useTheme();
  const { showSidebarTrigger, showFloatingTrigger } = useSettingsLogic();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Lógica para evitar disparos duplos
  if (floating) {
    if (!showFloatingTrigger || isOpen) return null;
  } else {
    if (!showSidebarTrigger || !isOpen) return null;
  }

  // Se for dashboard, usa a cor do tema. Se não, usa a cor fixa do módulo.
  const moduleColor =
    route === "dashboard" ? accentColor : getModuleColor(route);
  const theme = getColorTheme(moduleColor);

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        onClick={onToggle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "z-50 flex items-center justify-center transition-all duration-200 group cursor-pointer border-none bg-transparent",
          floating
            ? "fixed left-0 top-1/2 -translate-y-1/2 w-8 h-32"
            : "absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-12",
        )}
        aria-label={isOpen ? "fechar sidebar" : "abrir sidebar"}
      >
        {/* Minimalist Bar/Indicator */}
        <div
          className={cn(
            "transition-all duration-300 rounded-full",
            floating
              ? cn(
                  "w-1 h-12 ml-0 mr-auto",
                  "group-hover:h-20 group-hover:w-1.5",
                  theme.solid,
                )
              : cn(
                  "w-1 h-8 ml-auto mr-0",
                  "group-hover:h-10 group-hover:w-1.5",
                  theme.solid,
                ),
          )}
        />

        {/* Subtle Icon */}
        <div
          className={cn(
            "absolute transition-all duration-300 opacity-0 group-hover:opacity-100",
            floating ? "left-3" : "right-3",
            theme.text,
          )}
        >
          {isOpen ? (
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          ) : (
            <ChevronRight className="w-4 h-4" strokeWidth={2} />
          )}
        </div>
      </motion.button>
    </AnimatePresence>
  );
}
