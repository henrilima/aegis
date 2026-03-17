"use client";

import {
  Bell,
  Info,
  Monitor,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { APP_CONFIG } from "@/app.config";
import { Badge } from "@/components/ui/badge";
import { getThemeColor } from "@/lib/utils";
import { AboutTab } from "./aboutTab";
import { DangerTab } from "./dangerTab";
import { NotificationsTab } from "./notificationsTab";
import { ProfileTab } from "./profileTab";
import { SecurityTab } from "./securityTab";
import { SystemTab } from "./systemTab";
import { useSettingsLogic } from "./useSettingsLogic";

const TABS = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "system", label: "Sistema", icon: Monitor },
  { id: "security", label: "Segurança", icon: ShieldCheck },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "about", label: "Sobre", icon: Info },
  { id: "danger", label: "Zona de Perigo", icon: Trash2 },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Settings() {
  const {
    minimizeOnClose,
    startAtLogin,
    startMinimized,
    username,
    email,
    updateSystemConfig,
    handleTestNotification,
    handleInternalCommand,
    handleDeleteAccount,
  } = useSettingsLogic();
  const theme = getThemeColor();

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${theme.bg} rounded-xl border ${theme.border}`}>
          <SettingsIcon className={`w-5 h-5 ${theme.text}`} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold leading-none">Configurações</h1>
            <Badge
              variant="outline"
              className={`text-[10px] py-0 px-1.5 h-4 ${theme.border} border-opacity-30 ${theme.text} ${theme.bg} bg-opacity-5`}
            >
              {APP_CONFIG.versionLabel}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gerencie sua conta e preferências do sistema
          </p>
        </div>
      </div>

      <div className="flex gap-1 p-1.5 bg-neutral-950 border border-neutral-700/60 rounded-xl w-fit shadow-lg shadow-black/30">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl  font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? `${theme.bg} ${theme.text.replace("text-", "text-").replace("500", "400")} border ${theme.border.replace("20", "40")} shadow-md shadow-${theme.text.split("-")[1]}-600/10`
                : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800/60"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        {/* Abas */}
        {activeTab === "profile" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ProfileTab username={username} email={email} />
          </div>
        )}

        {activeTab === "system" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SystemTab
              startAtLogin={startAtLogin}
              minimizeOnClose={minimizeOnClose}
              startMinimized={startMinimized}
              updateSystemConfig={updateSystemConfig}
              handleInternalCommand={handleInternalCommand}
              weekStartDay={0} // Default placeholder as it's handled via hook if needed
              updateWeekStart={async () => {}} // Placeholder
            />
          </div>
        )}

        {activeTab === "security" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SecurityTab />
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <NotificationsTab handleTestNotification={handleTestNotification} />
          </div>
        )}

        {activeTab === "about" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AboutTab />
          </div>
        )}

        {activeTab === "danger" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <DangerTab
              username={username}
              onDeleteAccount={handleDeleteAccount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
