"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/Loading";
import Currency from "@/components/pages/currency";

import Dashboard from "@/components/pages/dashboard";
import Habits from "@/components/pages/habits";
import Hydration from "@/components/pages/hydration";
import Notes from "@/components/pages/notes";
import Passwords from "@/components/pages/passwords";
import Pomodoro from "@/components/pages/pomodoro";
import Settings from "@/components/pages/settings";
import Sono from "@/components/pages/sleep";
import Speedtest from "@/components/pages/speedtest";
import Estudos from "@/components/pages/studies";
import { useAuth } from "@/context/AuthContext";

export default function DashboardClient() {
  const pathname = usePathname();

  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !user) {
    return <Loading />;
  }

  var page: React.ReactNode;

  if (pathname === "/dashboard") {
    page = <Dashboard />;
  } else if (pathname?.startsWith("/dashboard/passwords")) {
    page = <Passwords />;
  } else if (pathname?.startsWith("/dashboard/speedtest")) {
    page = <Speedtest />;
  } else if (pathname?.startsWith("/dashboard/settings")) {
    page = <Settings />;
  } else if (pathname?.startsWith("/dashboard/habits")) {
    page = <Habits />;
  } else if (pathname?.startsWith("/dashboard/pomodoro")) {
    page = <Pomodoro />;
  } else if (pathname?.startsWith("/dashboard/currency")) {
    page = <Currency />;
  } else if (pathname?.startsWith("/dashboard/hydration")) {
    page = <Hydration />;
  } else if (pathname?.startsWith("/dashboard/notes")) {
    page = <Notes />;
  } else if (pathname?.startsWith("/dashboard/estudos")) {
    page = <Estudos />;
  } else if (pathname?.startsWith("/dashboard/sono")) {
    page = <Sono />;
  } else {
    page = <Dashboard />;
  }

  return <div className="w-full h-full">{page}</div>;
}
