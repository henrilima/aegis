"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { GlobalScheduler } from "@/components/GlobalScheduler";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";
import { DictionaryQuickSearch } from "@/components/global/DictionaryQuickSearch";
import { FeedbackDialog } from "@/components/global/FeedbackDialog";
import { LevelUpParticles } from "@/components/global/LevelUpParticles";
import { SettingsModal } from "@/components/global/SettingsModal";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { AppSidebar } from "@/components/sidebar/appSidebar";
import { SidebarTrigger } from "@/components/sidebar/SidebarTrigger";
import { useAuth } from "@/context/AuthContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isWidget, setIsWidget] = useState(false);
  const { appMode } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        const label = getCurrentWindow().label;
        setIsWidget(label === "pomo-widget" || label === "alarm-widget");
      });
    }
  }, []);

  const {
    notifications,
    unreadCount,
    markRead,
    markUnread,
    markAllRead,
    remove,
    clearRead,
  } = useNotifications(user?.id);

  const [showFeedback, setShowFeedback] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleToggle = () => setIsSidebarOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-sidebar", handleToggle);
  }, []);

  useEffect(() => {
    const handleOpenFeedback = () => setShowFeedback(true);
    const handleOpenNotifications = () => setShowNotifications(true);
    const handleToggleNotifications = () =>
      setShowNotifications((prev) => !prev);
    const handleCloseAll = () => {
      setShowFeedback(false);
      setShowNotifications(false);
    };

    window.addEventListener("open-feedback", handleOpenFeedback);
    window.addEventListener("open-notifications", handleOpenNotifications);
    window.addEventListener(
      "toggle-notifications-panel",
      handleToggleNotifications,
    );
    window.addEventListener("close-all-modals", handleCloseAll);

    return () => {
      window.removeEventListener("open-feedback", handleOpenFeedback);
      window.removeEventListener("open-notifications", handleOpenNotifications);
      window.removeEventListener(
        "toggle-notifications-panel",
        handleToggleNotifications,
      );
      window.removeEventListener("close-all-modals", handleCloseAll);
    };
  }, []);

  const isSidebarVisible = mounted && appMode === "default" && !isWidget;

  return (
    <NavigationProvider>
      <div
        className="flex min-h-screen bg-background text-foreground overflow-x-hidden"
        style={
          {
            "--sidebar-w": isSidebarVisible && isSidebarOpen ? "288px" : "0px",
          } as CSSProperties
        }
      >
        {!isWidget && (
          <>
            <GlobalScheduler />
            <GlobalShortcuts />
            <DictionaryQuickSearch />
            <SettingsModal />
            <LevelUpParticles />
          </>
        )}

        {isSidebarVisible && <AppSidebar isOpen={isSidebarOpen} />}

        {/* Gatilho flutuante (visível quando a barra lateral está fechada) */}
        {isSidebarVisible && (
          <SidebarTrigger
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(true)}
            floating
          />
        )}

        {isSidebarVisible && isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden w-full h-full border-none cursor-default"
            aria-label="Close sidebar"
            type="button"
          />
        )}

        <main
          className={cn(
            isWidget
              ? "relative z-0 flex-1 flex flex-col w-screen h-screen overflow-hidden p-0 m-0 bg-card"
              : "relative z-0 flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden p-6 md:p-10 scrollbar-stable scroll-smooth",
            isSidebarVisible && isSidebarOpen && !isWidget
              ? "lg:ml-72 lg:pl-6"
              : "ml-0",
          )}
        >
          {children}
        </main>

        {!isWidget && (
          <>
            <FeedbackDialog
              isOpen={showFeedback}
              onClose={() => setShowFeedback(false)}
            />

            <NotificationsPanel
              notifications={notifications}
              unreadCount={unreadCount}
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onMarkRead={markRead}
              onMarkUnread={markUnread}
              onMarkAllRead={markAllRead}
              onDelete={remove}
              onClearRead={clearRead}
            />
          </>
        )}
      </div>
    </NavigationProvider>
  );
}
