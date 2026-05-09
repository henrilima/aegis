import { Bell, Monitor, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tab } from "./useSettingsLogic";

interface SettingsSidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export function SettingsSidebar({
  activeTab,
  setActiveTab,
}: SettingsSidebarProps) {
  const tabs = [
    // Define as abas disponíveis na página de configurações
    { id: "profile" as Tab, label: "Perfil", icon: User },
    { id: "system" as Tab, label: "Sistema", icon: Monitor },
    { id: "security" as Tab, label: "Segurança", icon: ShieldCheck },
    { id: "notifications" as Tab, label: "Notificações", icon: Bell },
  ];

  return (
    <div className="flex flex-col gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant="ghost"
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "justify-start gap-3 transition-all",
            activeTab === tab.id
              ? "bg-accent text-foreground border-l-2 border-primary rounded-l-none font-bold"
              : "hover:bg-accent/50 text-muted-foreground",
          )}
        >
          <tab.icon className="w-4 h-4" /> {tab.label}
        </Button>
      ))}
    </div>
  );
}
