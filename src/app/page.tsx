"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoginComponent from "@/components/auth/Login";
import Loading from "@/components/global/Loading";

import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [isWidget, setIsWidget] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        const label = getCurrentWindow().label;
        setIsWidget(label === "pomo-widget" || label === "alarm-widget");
      });
    }
  }, []);

  useEffect(() => {
    // Redireciona para o dashboard se o usuário já estiver autenticado
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [loading, isAuthenticated, router]);

  if (isWidget && (loading || isAuthenticated)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-card p-4 select-none">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 rounded-lg border border-border bg-card flex items-center justify-center">
            <div className="w-3.5 h-3.5 border-2 border-muted-foreground/60 border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-[9px] font-bold text-foreground">
            Carregando...
          </span>
        </div>
      </div>
    );
  }

  if (loading || isAuthenticated) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6 md:flex-row md:gap-16 md:p-0">
      <Image
        src="/images/version-control.png"
        alt="Version Control"
        width={460}
        height={460}
        className="max-lg:hidden"
        priority
      />
      <div className="max-w-lg w-lg text-center md:text-left">
        <LoginComponent />
      </div>
    </div>
  );
}
