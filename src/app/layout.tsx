"use client";

import { Montserrat } from "next/font/google";
import "./globals.css";
import "./style.css";
import { useEffect } from "react";
import { NotificationPermission } from "@/components/NotificationPermission";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";

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
  useEffect(() => {
    // Handler global de erros (Safety Net)
    const handleError = (event: ErrorEvent) => {
      console.error("[CRITICAL ERROR]", event.error || event.message);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("[PROMISE REJECTION]", event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    console.log("[SYSTEM] Base Global Logging Initialized");

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <html lang="pt-BR" className="dark">
      <body className={`${montserrat.className} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <NotificationPermission />
        <Toaster />
      </body>
    </html>
  );
}
