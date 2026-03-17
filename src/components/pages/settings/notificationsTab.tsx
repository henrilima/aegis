import { invoke } from "@tauri-apps/api/core";
import {
  Bell,
  ExternalLink,
  Settings as SettingsIcon,
  ShieldAlert,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getThemeColor } from "@/lib/utils";

interface NotificationsTabProps {
  handleTestNotification: () => void;
}

export function NotificationsTab({
  handleTestNotification,
}: NotificationsTabProps) {
  const theme = getThemeColor();
  const handleOpenSettings = async () => {
    await invoke("open_notification_settings");
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-xs font-black uppercase text-neutral-500">
        Notificações do Sistema
      </p>

      <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-2.5 ${theme.bg} rounded-xl border ${theme.border} shrink-0`}
            >
              <ShieldAlert className={`w-5 h-5 ${theme.text}`} />
            </div>
            <div>
              <p className="font-bold ">Prioridade Crítica (Windows)</p>
              <p className="text-xs text-neutral-500 mt-0.5 mr-2">
                Defina as notificações prioritárias para que elas apareçam mesmo
                se o Windows estiver em modo Foco/Não Perturbe.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenSettings}
              className="h-8 text-[10px] font-bold border-neutral-800 hover:bg-neutral-800"
            >
              <ExternalLink className="w-3 h-3 mr-1.5" />
              Configurar no Windows
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-neutral-800 pt-6">
          <div
            className={`p-2.5 ${theme.bg} rounded-xl border ${theme.border} shrink-0`}
          >
            <Bell className={`w-5 h-5 ${theme.text}`} />
          </div>
          <div>
            <p className="font-bold ">Teste de Comunicação</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Verifique se o Windows está entregando os alertas do Aegis.
            </p>
          </div>
        </div>
        <Button
          onClick={handleTestNotification}
          className={`w-full ${theme.solid} ${theme.solidHover} text-white font-black uppercase text-xs cursor-pointer`}
        >
          Enviar Notificação de Teste
        </Button>
      </div>

      <div className="flex gap-3 p-4 border border-dashed border-neutral-800 rounded-xl">
        <SettingsIcon className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-500 leading-relaxed">
          <p className="font-bold text-neutral-400 mb-1">
            Sobre a Prioridade Crítica:
          </p>
          Ao ativar as notificações prioritárias, o Aegis enviará notificações
          com prioridade alta. Isso permite que elas apareçam mesmo se o Windows
          estiver em modo Foco/Não Perturbe, garantindo que você não perca o fim
          do seu Pomodoro ou lembretes de saúde.
        </div>
      </div>
    </div>
  );
}
