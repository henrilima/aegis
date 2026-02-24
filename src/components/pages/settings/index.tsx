"use client";

import {
  Bell,
  Monitor,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DangerTab } from "./danger-tab";
import { NotificationsTab } from "./notifications-tab";
import { ProfileTab } from "./profile-tab";
import { SecurityTab } from "./security-tab";
import { SystemTab } from "./system-tab";
import { useSettingsLogic } from "./use-settings-logic";

const TABS = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "system", label: "Sistema", icon: Monitor },
  { id: "security", label: "Segurança", icon: ShieldCheck },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "danger", label: "Zona de Perigo", icon: Trash2 },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Settings() {
  const {
    minimizeOnClose,
    startAtLogin,
    username,
    email,
    updateSystemConfig,
    handleTestNotification,
    handleDeleteAccount,
  } = useSettingsLogic();

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-auto pb-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <SettingsIcon className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold leading-none">Configurações</h1>
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 h-4 border-amber-500/30 text-amber-500 bg-amber-500/5"
            >
              beta-0.1.0 (blossom)
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gerencie sua conta e preferências do sistema
          </p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                : "text-neutral-500 hover:text-neutral-200"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        {/* Renderiza a aba ativa no painel de configurações */}
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
              updateSystemConfig={updateSystemConfig}
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
