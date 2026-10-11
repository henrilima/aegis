"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VersionGuard } from "@/components/VersionGuard";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ModuleProvider } from "@/context/ModuleContext";
import { TaskTimerProvider } from "@/context/TaskTimerContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { TimeProvider } from "@/context/TimeContext";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useZoom } from "@/hooks/useZoom";
import { NotificationPermission } from "@/lib/NotificationPermission";
import { indexAppVocabulary } from "@/lib/wordSuggestions";

function AppVocabularyIndexer() {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";

  useEffect(() => {
    if (!uid) return;
    // Carrega o vocabulário em segundo plano sem competir com a inicialização
    const timer = setTimeout(() => {
      indexAppVocabulary(uid);
    }, 1500);

    return () => clearTimeout(timer);
  }, [uid]);

  return null;
}

function AppRuntimeEffects() {
  useFullscreen();
  useZoom();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes("ResizeObserver loop completed")) return;
      console.error("[CRITICAL ERROR]", event.error || event.message);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[PROMISE REJECTION]", event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    document.body.style.overflow = "auto";

    // Desativa autocomplete nativo do navegador/webview em todos os campos de texto e formulários
    const disableAutocomplete = (el: Element) => {
      if (
        (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
        !el.hasAttribute("autocomplete")
      ) {
        el.setAttribute("autocomplete", "off");
      }
    };

    document.querySelectorAll("input, textarea").forEach(disableAutocomplete);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) {
            disableAutocomplete(node);
            node
              .querySelectorAll("input, textarea")
              .forEach(disableAutocomplete);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA") &&
        !target.hasAttribute("autocomplete")
      ) {
        target.setAttribute("autocomplete", "off");
      }
    };
    document.addEventListener("focusin", handleFocusIn, true);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
      document.removeEventListener("focusin", handleFocusIn, true);
      observer.disconnect();
    };
  }, []);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <TimeProvider>
            <ModuleProvider>
              <TaskTimerProvider>
                <AppRuntimeEffects />
                <AppVocabularyIndexer />
                {children}
                <NotificationPermission />
                <VersionGuard />
                <Toaster />
              </TaskTimerProvider>
            </ModuleProvider>
          </TimeProvider>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
