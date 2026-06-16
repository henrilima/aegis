"use client";

import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Loading from "@/components/global/Loading";
import Alarms from "@/components/modules/alarms";
import Calendar from "@/components/modules/calendar";

import Dashboard from "@/components/modules/dashboard";
import Dictionary from "@/components/modules/dictionary";
import Flashcards from "@/components/modules/flashcards";
import Habits from "@/components/modules/habits";
import Movies from "@/components/modules/movies";
import Notes from "@/components/modules/notes";
import Passwords from "@/components/modules/passwords";
import Pomodoro from "@/components/modules/pomodoro";
import Reading from "@/components/modules/reading";
import Sleep from "@/components/modules/sleep";
import Statistics from "@/components/modules/statistics";
import Studies from "@/components/modules/studies";
import Tasks from "@/components/modules/tasks";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";

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
