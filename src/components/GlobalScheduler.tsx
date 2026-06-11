"use client";

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";

/**
 * GlobalScheduler
 * componente silencioso ativo durante toda a navegação que gerencia:
 * 1. O agendamento periódico de backups silenciosos em JSON.
 * 2. O roteamento de ações rápidas a partir do menu do tray.
 * 3. O foco do aplicativo em cliques em notificações nativas do sistema.
 */
export function GlobalScheduler() {
  const { navigate } = useNavigation();
  const { user } = useAuth();

  // Escuta ações originadas da bandeja do sistema (tray menu)
  useEffect(() => {
    const initTrayListener = async () => {
      const unsub = await listen<string>("tray-action", (event) => {
        const action = event.payload;
        console.log("[GlobalScheduler] Ação rápida do tray recebida:", action);

        if (action === "start-pomodoro") {
          navigate("pomodoro");
        } else if (action === "new-task") {
          navigate("tasks");
        } else if (action === "next-alarm") {
          navigate("alarms");
        }
      });
      return unsub;
    };

    const unsubPromise = initTrayListener();

    return () => {
      unsubPromise.then((unsub) => unsub());
    };
  }, [navigate]);

  // Restaura e foca a janela do Aegis quando o backend emite o evento 'focus-window'.

  useEffect(() => {
    const initFocusListener = async () => {
      const unsub = await listen("focus-window", async () => {
        console.log(
          "[GlobalScheduler] Evento focus-window recebido — restaurando janela.",
        );
        const win = getCurrentWindow();

        // Executa de forma resiliente cada ação de restauração de foco no Windows
        try {
          await win.unminimize();
        } catch (e) {
          console.warn("[GlobalScheduler] Erro ao desminimizar:", e);
        }

        try {
          await win.show();
        } catch (e) {
          console.warn("[GlobalScheduler] Erro ao mostrar janela:", e);
        }

        try {
          await win.setFocus();
        } catch (e) {
          console.warn("[GlobalScheduler] Erro ao focar janela:", e);
        }
      });
      return unsub;
    };

    const unsubPromise = initFocusListener();

    return () => {
      unsubPromise.then((unsub) => unsub());
    };
  }, []);

  // Monitora e executa o backup automático do usuário localmente em formato JSON
  useEffect(() => {
    if (!user) return;

    const runAutoBackup = async () => {
      const enabled =
        localStorage.getItem("aegis_auto_backup_enabled") === "true";
      const intervalDays = Number(
        localStorage.getItem("aegis_auto_backup_interval") || "7",
      );
      const backupPath = localStorage.getItem("aegis_auto_backup_path") || "";
      const lastBackupStr =
        localStorage.getItem("aegis_last_backup_date") || "";

      if (!enabled || !backupPath) return;

      let shouldBackup = false;
      const now = new Date();

      if (!lastBackupStr) {
        shouldBackup = true;
      } else {
        const lastDate = new Date(lastBackupStr);
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays >= intervalDays) {
          shouldBackup = true;
        }
      }

      if (shouldBackup) {
        try {
          const dateStr = now.toISOString().split("T")[0];
          const filename = `aegis_auto_backup_${user.username}_${dateStr}.json`;
          const fullPath = `${backupPath}/${filename}`;

          console.log(
            "[GlobalScheduler] Executando backup automático em:",
            fullPath,
          );

          await invoke("global_export_raw_user_json", {
            userId: String(user.id),
            path: fullPath,
          });
          toast.success("Backup automático de dados gerado com sucesso!", {
            description: `Arquivo salvo: ${filename}`,
          });

          const nowIso = now.toISOString();
          localStorage.setItem("aegis_last_backup_date", nowIso);
        } catch (err) {
          console.error(
            "[GlobalScheduler] Falha ao processar backup automático periódico:",
            err,
          );
        }
      }
    };

    // Executa imediatamente na inicialização ou login
    runAutoBackup();
    // Reavalia a cada hora de execução contínua
    const interval = setInterval(runAutoBackup, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  return null;
}
