"use client";

import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Loading from "@/components/global/Loading";
import ModuleLoading from "@/components/global/ModuleLoading";
import { FloatingAlarmWidget } from "@/components/modules/alarms/FloatingAlarmWidget";
import Dashboard from "@/components/modules/dashboard";
import { FloatingPomodoroWidget } from "@/components/modules/pomodoro/FloatingPomodoroWidget";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";

const Achievements = dynamic(
  () => import("@/components/modules/achievements"),
  { loading: () => <ModuleLoading moduleName="Conquistas" /> },
);
const Alarms = dynamic(() => import("@/components/modules/alarms"), {
  loading: () => <ModuleLoading moduleName="Alarmes" />,
});
const Calendar = dynamic(() => import("@/components/modules/calendar"), {
  loading: () => <ModuleLoading moduleName="Calendário" />,
});
const Dictionary = dynamic(() => import("@/components/modules/dictionary"), {
  loading: () => <ModuleLoading moduleName="Dicionário" />,
});
const Flashcards = dynamic(() => import("@/components/modules/flashcards"), {
  loading: () => <ModuleLoading moduleName="Flashcards" />,
});
const Habits = dynamic(() => import("@/components/modules/habits"), {
  loading: () => <ModuleLoading moduleName="Hábitos" />,
});
const Movies = dynamic(() => import("@/components/modules/movies"), {
  loading: () => <ModuleLoading moduleName="Filmes" />,
});
const Notes = dynamic(() => import("@/components/modules/notes"), {
  loading: () => <ModuleLoading moduleName="Anotações" />,
});
const Passwords = dynamic(() => import("@/components/modules/passwords"), {
  loading: () => <ModuleLoading moduleName="Cofre de Senhas" />,
});
const Pomodoro = dynamic(() => import("@/components/modules/pomodoro"), {
  loading: () => <ModuleLoading moduleName="Pomodoro" />,
});
const Reading = dynamic(() => import("@/components/modules/reading"), {
  loading: () => <ModuleLoading moduleName="Leitura" />,
});
const Sleep = dynamic(() => import("@/components/modules/sleep"), {
  loading: () => <ModuleLoading moduleName="Sono" />,
});
const Statistics = dynamic(() => import("@/components/modules/statistics"), {
  loading: () => <ModuleLoading moduleName="Estatísticas" />,
});
const Studies = dynamic(() => import("@/components/modules/studies"), {
  loading: () => <ModuleLoading moduleName="Estudos" />,
});
const Tasks = dynamic(() => import("@/components/modules/tasks"), {
  loading: () => <ModuleLoading moduleName="Tarefas" />,
});

export default function DashboardClient() {
  const router = useRouter();
  const { route } = useNavigation();
  const { user, loading, isAuthenticated } = useAuth();
  const [widgetType, setWidgetType] = useState<"pomo" | "alarm" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        const label = getCurrentWindow().label;
        if (label === "pomo-widget") setWidgetType("pomo");
        else if (label === "alarm-widget") setWidgetType("alarm");
      });
    }
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

  const discordInviteCalled = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user?.id && !discordInviteCalled.current) {
      discordInviteCalled.current = true;
      invoke("global_ensure_discord_invite", { userId: user.id }).catch(
        console.error,
      );
    }
  }, [isAuthenticated, user?.id]);

  if (widgetType && (loading || !user)) {
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

  if (widgetType === "alarm") {
    return <FloatingAlarmWidget />;
  }

  if (widgetType === "pomo") {
    return <FloatingPomodoroWidget />;
  }

  if (loading || !user) {
    return <Loading />;
  }

  const renderContent = () => {
    switch (route) {
      case "dashboard":
        return <Dashboard />;
      case "dictionary":
        return <Dictionary />;
      case "flashcards":
        return <Flashcards />;

      case "passwords":
        return <Passwords />;
      case "habits":
        return <Habits />;
      case "alarms":
        return <Alarms />;
      case "notes":
        return <Notes />;
      case "pomodoro":
        return <Pomodoro />;
      case "studies":
        return <Studies />;
      case "sleep":
        return <Sleep />;

      case "calendar":
        return <Calendar />;
      case "statistics":
        return <Statistics />;
      case "reading":
        return <Reading />;
      case "tasks":
        return <Tasks />;
      case "movies":
        return <Movies />;
      case "achievements":
        return <Achievements />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="w-full relative min-h-full ml-3">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={route}
          initial={{ opacity: 0, y: 10, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.985 }}
          transition={{
            duration: 0.35,
            ease: [0.33, 1, 0.68, 1],
          }}
          className="w-full origin-top"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
