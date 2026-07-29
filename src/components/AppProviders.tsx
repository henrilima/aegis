"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VersionGuard } from "@/components/VersionGuard";
import { AuthProvider } from "@/context/AuthContext";
import { ModuleProvider } from "@/context/ModuleContext";
import { TaskTimerProvider } from "@/context/TaskTimerContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { TimeProvider } from "@/context/TimeContext";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useZoom } from "@/hooks/useZoom";
import { NotificationPermission } from "@/lib/NotificationPermission";

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

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
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
