"use client";

import { useEffect, useState } from "react";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";
import { DictionaryQuickSearch } from "@/components/global/DictionaryQuickSearch";
import { SettingsModal } from "@/components/global/SettingsModal";
import { AppSidebar } from "@/components/sidebar/appSidebar";
import { SidebarTrigger } from "@/components/sidebar/SidebarTrigger";
import { NavigationProvider } from "@/context/NavigationContext";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  return (
    <NavigationProvider>
      <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden">
        <GlobalShortcuts />
        <DictionaryQuickSearch />
        <SettingsModal />
        <AppSidebar isOpen={isSidebarOpen} />

        {/* Floating Trigger (visible when sidebar is closed) */}
        <SidebarTrigger
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(true)}
          floating
        />

        {isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-10 bg-black/60 backdrop-blur-sm lg:hidden w-full h-full border-none cursor-default"
            aria-label="Close sidebar"
            type="button"
          />
        )}

        <main
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden p-6 md:p-10 scrollbar-stable scroll-smooth",
            isSidebarOpen ? "lg:ml-72" : "ml-0",
          )}
        >
          {children}
        </main>
      </div>
    </NavigationProvider>
  );
}
