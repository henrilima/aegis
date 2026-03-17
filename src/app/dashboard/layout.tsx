"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { AppSidebar } from "@/components/appSidebar";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProvider } from "@/context/NavigationContext";
import { cn, getThemeColor } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <NavigationProvider>
      <div className="flex min-h-screen bg-neutral-950 text-white overflow-x-hidden">
        <AppSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        {isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-10 bg-black/60 backdrop-blur-sm lg:hidden w-full h-full border-none cursor-default"
            aria-label="Close sidebar"
            type="button"
          />
        )}

        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            type="button"
            className={cn(
              "fixed top-6 left-6 z-30 p-3 backdrop-blur-md border rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer group flex items-center justify-center",
              getThemeColor().text,
              getThemeColor().bg,
              getThemeColor().border,
              getThemeColor().borderHover,
            )}
            title="Abrir Sidebar"
          >
            <Menu className="w-5 h-5" />
            <div className="absolute left-full ml-3 px-2 py-1 bg-neutral-800 text-[11px] font-medium text-neutral-300 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-neutral-700 shadow-xl">
              Abrir Menu
            </div>
          </button>
        )}

        <main
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-auto p-6 md:p-10",
            isSidebarOpen ? "lg:ml-64" : "ml-0 pl-20 md:pl-28",
          )}
        >
          {children}
        </main>

        <Toaster />
      </div>
    </NavigationProvider>
  );
}
