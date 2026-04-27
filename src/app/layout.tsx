"use client";

import { Montserrat } from "next/font/google";
import "./globals.css";
import "./style.css";
import { useEffect } from "react";
import { NotificationPermission } from "@/components/NotificationPermission";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VersionGuard } from "@/components/VersionGuard";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { TimeProvider } from "@/context/TimeContext";

import { useFullscreen } from "@/hooks/useFullscreen";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useFullscreen();
  useEffect(() => {
    // Handler global de erros (Safety Net)
    const handleError = (event: ErrorEvent) => {
      // Ignorar erro comum de ResizeObserver que não afeta a funcionalidade
      if (event.message?.includes("ResizeObserver loop completed")) return;
      console.error("[CRITICAL ERROR]", event.error || event.message);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[PROMISE REJECTION]", event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    // Garantia de scroll - Resetar body se estiver travado
    document.body.style.overflow = "auto";

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <html lang="pt-BR" className="dark">
      <body className={`${montserrat.className} antialiased`}>
        <ThemeProvider>
          <TooltipProvider>
            <TimeProvider>
              <AuthProvider>
                {children}
                <NotificationPermission />
                <VersionGuard />
                <Toaster />
              </AuthProvider>
            </TimeProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
