"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/Loading";
import Calendar from "@/components/pages/calendar";
import Currency from "@/components/pages/currency";
import Dashboard from "@/components/pages/dashboard";
import Habits from "@/components/pages/habits";
import Hydration from "@/components/pages/hydration";
import Notes from "@/components/pages/notes";
import Passwords from "@/components/pages/passwords";
import Pomodoro from "@/components/pages/pomodoro";
import Settings from "@/components/pages/settings";
import Sleep from "@/components/pages/sleep";
import Speedtest from "@/components/pages/speedtest";
import Statistics from "@/components/pages/statistics";
import Studies from "@/components/pages/studies";
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
      case "hydration":
        return <Hydration />;
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
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0A0A0B]">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="w-full h-full">{renderContent()}</div>
      </div>
    </div>
  );
}
