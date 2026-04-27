"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { AppSidebar } from "@/components/appSidebar";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";
import { Toaster } from "@/components/ui/sonner";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { NavigationProvider } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { themeStyles } = useTheme();

  return (
    <NavigationProvider>
      <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden">
        <GlobalShortcuts />
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
          <ToolTip content="Abrir Menu" side="right">
            <button
              onClick={() => setIsSidebarOpen(true)}
              type="button"
              className={cn(
                "fixed top-6 left-6 z-30 p-3 backdrop-blur-md border rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer group flex items-center justify-center",
                themeStyles.text,
                themeStyles.bg,
                themeStyles.border,
                themeStyles.borderHover,
              )}
            >
              <Menu className="w-5 h-5" />
            </button>
          </ToolTip>
        )}

        <main
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden p-6 md:p-10 scrollbar-stable scroll-smooth",
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
