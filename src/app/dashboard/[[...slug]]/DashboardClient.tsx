"use client";

import { invoke } from "@tauri-apps/api/core";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Loading from "@/components/Loading";
import Alarms from "@/components/pages/alarms";
import Calendar from "@/components/pages/calendar";
import Currency from "@/components/pages/currency";
import Dashboard from "@/components/pages/dashboard";
import Habits from "@/components/pages/habits";
import Notes from "@/components/pages/notes";
import Passwords from "@/components/pages/passwords";
import Pomodoro from "@/components/pages/pomodoro";
import Reading from "@/components/pages/reading";
import Settings from "@/components/pages/settings";
import Sleep from "@/components/pages/sleep";
import Speedtest from "@/components/pages/speedtest";
import Statistics from "@/components/pages/statistics";
import Studies from "@/components/pages/studies";
import Tasks from "@/components/pages/tasks";
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
      invoke("ensure_discord_invite", { userId: user.id }).catch(console.error);
    }
  }, [isAuthenticated, user?.id]);

  if (loading || !user) {
    return <Loading />;
  }

  const renderContent = () => {
    switch (route) {
      case "dashboard":
        return <Dashboard />;
      case "currency":
        return <Currency />;
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
      case "settings":
        return <Settings />;
      case "speedtest":
        return <Speedtest />;
      case "calendar":
        return <Calendar />;
      case "statistics":
        return <Statistics />;
      case "reading":
        return <Reading />;
      case "tasks":
        return <Tasks />;
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
          exit={{ opacity: 0, y: -10, scale: 0.985, filter: "blur(8px)" }}
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
