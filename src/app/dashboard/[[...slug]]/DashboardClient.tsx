"use client";

import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Loading from "@/components/global/Loading";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";

const Achievements = dynamic(
  () => import("@/components/modules/achievements"),
  { loading: () => <Loading /> },
);
const Alarms = dynamic(() => import("@/components/modules/alarms"), {
  loading: () => <Loading />,
});
const Calendar = dynamic(() => import("@/components/modules/calendar"), {
  loading: () => <Loading />,
});
const Dashboard = dynamic(() => import("@/components/modules/dashboard"), {
  loading: () => <Loading />,
});
const Dictionary = dynamic(() => import("@/components/modules/dictionary"), {
  loading: () => <Loading />,
});
const Flashcards = dynamic(() => import("@/components/modules/flashcards"), {
  loading: () => <Loading />,
});
const Habits = dynamic(() => import("@/components/modules/habits"), {
  loading: () => <Loading />,
});
const Movies = dynamic(() => import("@/components/modules/movies"), {
  loading: () => <Loading />,
});
const Notes = dynamic(() => import("@/components/modules/notes"), {
  loading: () => <Loading />,
});
const Passwords = dynamic(() => import("@/components/modules/passwords"), {
  loading: () => <Loading />,
});
const Pomodoro = dynamic(() => import("@/components/modules/pomodoro"), {
  loading: () => <Loading />,
});
const Reading = dynamic(() => import("@/components/modules/reading"), {
  loading: () => <Loading />,
});
const Sleep = dynamic(() => import("@/components/modules/sleep"), {
  loading: () => <Loading />,
});
const Statistics = dynamic(() => import("@/components/modules/statistics"), {
  loading: () => <Loading />,
});
const Studies = dynamic(() => import("@/components/modules/studies"), {
  loading: () => <Loading />,
});
const Tasks = dynamic(() => import("@/components/modules/tasks"), {
  loading: () => <Loading />,
});

export default function DashboardClient() {
  const router = useRouter();
  const { route } = useNavigation();
  const { user, loading, isAuthenticated } = useAuth();

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
