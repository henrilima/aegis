"use client";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  ACHIEVEMENTS,
  checkAchievementsToUnlock,
  type RealtimeGlobalStats,
} from "@/config/achievements.config";
import { useAuth } from "@/context/AuthContext";
import { useModules } from "@/context/ModuleContext";
import { useNavigation } from "@/context/NavigationContext";
import { useTime } from "@/context/TimeContext";
import type { AppNotification } from "@/hooks/useNotifications";
import { formatDateLocal } from "@/lib/utils";

let isPrompting = false;

/**
 * GlobalScheduler
 * componente silencioso ativo durante toda a navegação que gerencia:
 * 1. O agendamento periódico de backups silenciosos em JSON.
 * 2. O roteamento de ações rápidas a partir do menu do tray.
 * 3. O foco do aplicativo em cliques em notificações nativas do sistema.
 */
export function GlobalScheduler() {
  const { navigate, setSettingsOpen } = useNavigation();
  const { user } = useAuth();
  const { now: simulatedNow } = useTime();
  const { enabledModules } = useModules();
  const achievementsEnabled = enabledModules.includes("achievements");

  const simulatedNowRef = useRef(simulatedNow);
  useEffect(() => {
    simulatedNowRef.current = simulatedNow;
  }, [simulatedNow]);

  const todayStr = formatDateLocal(simulatedNow);

  // Escuta ações originadas da bandeja do sistema (tray menu)
  useEffect(() => {
    if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) return;
    const initTrayListener = async () => {
      const unsub = await listen<string>("tray-action", (event) => {
        const action = event.payload;
        console.log("[GlobalScheduler] Ação rápida do tray recebida:", action);

        if (action === "start-pomodoro") {
          navigate("pomodoro");
        } else if (action === "new-task") {
          navigate("tasks");
        } else if (action === "new-note") {
          navigate("notes");
        } else if (action === "calendar") {
          navigate("calendar");
        } else if (action === "settings") {
          setSettingsOpen(true);
        }
      });

      return unsub;
    };

    let unsubFn: (() => void) | undefined;
    initTrayListener().then((unsub) => {
      unsubFn = unsub;
    });

    return () => {
      if (unsubFn) unsubFn();
    };
  }, [navigate, setSettingsOpen]);

  // Restaura e foca a janela do Aegis quando o backend emite o evento 'focus-window'.

  useEffect(() => {
    if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) return;
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
    if (!user || typeof window === "undefined" || !window.__TAURI_INTERNALS__)
      return;

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

  // Rastreador do Easter Egg de Temas (Chameleon)
  useEffect(() => {
    if (
      !user?.id ||
      !achievementsEnabled ||
      typeof window === "undefined" ||
      !window.__TAURI_INTERNALS__
    )
      return;
    const key = `theme_change_count_${user.id}`;
    const count = parseInt(localStorage.getItem(key) || "0", 10);
    if (count < 5) {
      localStorage.setItem(key, (count + 1).toString());
      if (count + 1 === 5) {
        invoke<[boolean, number, number, number]>("achievements_unlock", {
          userId: user.id,
          achievementId: "easter_egg_theme",
          xpAward: 100,
          unlockedAt: simulatedNowRef.current.toISOString(),
        })
          .then((res) => {
            if (res[0]) {
              toast.success(
                "Conquista Desbloqueada: Camaleão do Aegis! (+100 XP)",
                {
                  description:
                    "Personalizou a identidade visual trocando de tema 5 vezes.",
                  icon: "🏆",
                  duration: 5000,
                },
              );
              window.dispatchEvent(new Event("aegis-achievements-refresh"));
            }
          })
          .catch(console.error);
      }
    }
  }, [user?.id, achievementsEnabled]);

  // 1. Loop global para monitorar evolução de nível do usuário em qualquer tela
  useEffect(() => {
    if (
      !user?.id ||
      typeof window === "undefined" ||
      !window.__TAURI_INTERNALS__
    )
      return;

    let active = true;

    const checkLevelUp = async () => {
      try {
        const todayStrFormatted = todayStr;
        const threeDaysAgo = new Date(simulatedNowRef.current);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoStrFormatted = formatDateLocal(threeDaysAgo);

        const rawProgress = await invoke<{ level: number }>(
          "achievements_get_user_state",
          {
            userId: user.id,
            today: todayStrFormatted,
            threeDaysAgo: threeDaysAgoStrFormatted,
          },
        );

        if (!active) return;

        const currentLevel = rawProgress.level;
        if (typeof currentLevel === "number") {
          const lastSeenKey = `aegis_last_seen_level_${user.id}`;
          const lastSeen = localStorage.getItem(lastSeenKey);
          if (lastSeen) {
            const lastLvl = parseInt(lastSeen, 10);
            if (currentLevel > lastLvl) {
              const win = window as unknown as {
                aegisTriggerLevelUp?: (lvl: number) => void;
              };
              if (win.aegisTriggerLevelUp) {
                win.aegisTriggerLevelUp(currentLevel);
              }
              window.dispatchEvent(new Event("aegis-achievements-refresh"));
            }
          }
          localStorage.setItem(lastSeenKey, String(currentLevel));
        }
      } catch (err) {
        console.error("[GlobalScheduler] Erro ao monitorar nível:", err);
      }
    };

    checkLevelUp();

    // Verifica a cada 3 segundos
    const interval = setInterval(checkLevelUp, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user?.id, todayStr]);

  // 2. Loop global de verificação de conquistas a liberar
  useEffect(() => {
    if (
      !user?.id ||
      !achievementsEnabled ||
      typeof window === "undefined" ||
      !window.__TAURI_INTERNALS__
    )
      return;

    let active = true;

    const checkAndUnlock = async () => {
      try {
        const currentNow = simulatedNowRef.current;
        const todayStrFormatted = todayStr;
        const threeDaysAgo = new Date(currentNow);
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoStrFormatted = formatDateLocal(threeDaysAgo);

        const rawProgress = await invoke<{
          unlockedAchievements: { achievementId: string }[];
        }>("achievements_get_user_state", {
          userId: user.id,
          today: todayStrFormatted,
          threeDaysAgo: threeDaysAgoStrFormatted,
        });

        if (!active) return;

        const unlockedIds = rawProgress.unlockedAchievements.map(
          (a) => a.achievementId,
        );

        // Busca estatísticas em tempo real
        const stats = await invoke<RealtimeGlobalStats>(
          "stats_get_global_realtime_metrics",
          {
            userId: user.id,
            today: todayStrFormatted,
          },
        );

        if (!active) return;

        // Determina conquistas a liberar
        const toUnlock = checkAchievementsToUnlock(stats, unlockedIds);

        // Libera cada uma
        for (const achId of toUnlock) {
          const achDef = ACHIEVEMENTS.find((a) => a.id === achId);
          if (!achDef) continue;

          const result = await invoke<[boolean, number, number, number]>(
            "achievements_unlock",
            {
              userId: user.id,
              achievementId: achId,
              xpAward: achDef.xp,
              unlockedAt: currentNow.toISOString(),
            },
          );

          if (!active) return;

          const [newlyUnlocked, xpGained] = result;
          if (newlyUnlocked) {
            toast.success(
              `Conquista Desbloqueada: ${achDef.title}! (+${xpGained} XP)`,
              {
                description: achDef.secret
                  ? "Você descobriu um segredo!"
                  : achDef.description,
                icon: "🏆",
                duration: 5000,
              },
            );
            window.dispatchEvent(new Event("aegis-achievements-refresh"));
          }
        }
      } catch (err) {
        console.error("[GlobalScheduler] Erro ao verificar conquistas:", err);
      }
    };

    checkAndUnlock();

    // Verifica a cada 15 segundos
    const interval = setInterval(checkAndUnlock, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user?.id, todayStr, achievementsEnabled]);

  // Sincronização e Heartbeat periódico com a API Web (aegis-web-system)
  useEffect(() => {
    if (
      !user?.id ||
      typeof window === "undefined" ||
      !window.__TAURI_INTERNALS__
    )
      return;

    let active = true;

    const syncWithServer = async () => {
      if (!active) return;

      const baseUrl =
        localStorage.getItem("aegis_remote_api_url") ||
        "https://aegiswebpainel.vercel.app";
      const apiKey = localStorage.getItem("aegis_remote_api_key") || "96421340";

      // 1. Heartbeat - Cadastra/Atualiza o status ativo do usuário local no servidor
      try {
        const heartbeatRes = await fetch(`${baseUrl}/api/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email || "Não informado",
          }),
        });

        if (heartbeatRes.ok) {
          const data = await heartbeatRes.json();
          const { managementStatus, managedModules } = data;
          localStorage.setItem("aegis_management_status", managementStatus);

          // Se a solicitação está pendente e não há nenhum prompt aberto, pergunta ao usuário
          if (managementStatus === "pending" && !isPrompting) {
            isPrompting = true;
            try {
              const { ask } = await import("@tauri-apps/plugin-dialog");
              const accepted = await ask(
                "O painel de controle web está solicitando permissão para gerenciar seus módulos e configurações. Você autoriza?",
                { title: "Aegis - solicitação de controle", kind: "warning" },
              );

              const statusVal = accepted ? "approved" : "none";
              localStorage.setItem("aegis_management_status", statusVal);

              // Atualiza o status no servidor
              await fetch(`${baseUrl}/api/users/${user.id}/management-status`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": apiKey,
                },
                body: JSON.stringify({
                  status: statusVal,
                  modules: localStorage.getItem("aegis_enabled_modules"),
                }),
              });
            } catch (promptErr) {
              console.error(
                "[GlobalScheduler] Erro ao exibir prompt de permissão:",
                promptErr,
              );
            } finally {
              isPrompting = false;
            }
          }

          // Se o gerenciamento for aprovado, sincroniza os módulos ativos localmente
          if (managementStatus === "approved" && managedModules) {
            try {
              const remoteModules =
                typeof managedModules === "string"
                  ? JSON.parse(managedModules)
                  : managedModules;

              if (Array.isArray(remoteModules)) {
                const localModulesStr = localStorage.getItem(
                  "aegis_enabled_modules",
                );
                const localModules = localModulesStr
                  ? JSON.parse(localModulesStr)
                  : [];

                const isDifferent =
                  localModules.length !== remoteModules.length ||
                  !localModules.every((m: string) => remoteModules.includes(m));

                if (isDifferent) {
                  localStorage.setItem("aegis_sync_from_server", "true");
                  localStorage.setItem(
                    "aegis_enabled_modules",
                    JSON.stringify(remoteModules),
                  );
                  window.dispatchEvent(new Event("aegis-modules-changed"));
                }
              }
            } catch (modulesErr) {
              console.error(
                "[GlobalScheduler] Erro ao processar configurações de módulos remotos:",
                modulesErr,
              );
            }
          }
        }
      } catch (err) {
        console.warn(
          "[GlobalScheduler] Heartbeat com servidor web falhou:",
          err instanceof Error ? err.message : String(err),
        );
      }

      // 2. Polling - Busca notificações emitidas pelo painel administrativo
      try {
        const res = await fetch(`${baseUrl}/api/notifications`, {
          headers: {
            "x-api-key": apiKey,
          },
        });
        if (!res.ok) return;
        const remoteNotifs = await res.json();

        // Obtém notificações locais para deduping
        const localNotifs = await invoke<AppNotification[]>(
          "global_notif_list",
          {
            userId: user.id,
          },
        );
        const localTags = new Set(
          localNotifs.map((n) => n.tag).filter(Boolean),
        );

        // Carrega tags de notificações deletadas localmente
        const savedDeleted = localStorage.getItem("aegis_deleted_remote_tags");
        const locallyDeletedTags = new Set<string>(
          savedDeleted ? JSON.parse(savedDeleted) : [],
        );

        for (const rn of remoteNotifs) {
          // Filtra pelo usuário ativo (pode ser direcionado ou broadcast)
          if (rn.userId !== "todos" && rn.userId !== user.id) continue;

          // Se já foi excluída ou cadastrada localmente, ignora
          if (rn.tag && locallyDeletedTags.has(rn.tag)) continue;
          if (localTags.has(rn.tag)) continue;

          const newNotif = {
            userId: user.id,
            title: rn.title,
            body: rn.body,
            category: rn.category || "system",
            tag: rn.tag,
            isRead: false,
            createdAt: rn.created_at || new Date().toISOString(),
            persistent: !!rn.persistent,
            color: rn.color || "blue",
            icon: rn.icon || "Bell",
          };

          // Salva diretamente no SQLite local
          await invoke("global_notif_push", { n: newNotif });

          // Dispara notificação nativa no sistema operacional
          try {
            await invoke("global_send_critical_notification", {
              title: rn.title,
              body: rn.body,
            });
          } catch (notifErr) {
            console.error(
              "[GlobalScheduler] Erro ao disparar notificação nativa:",
              notifErr,
            );
          }
        }

        // 3. Sincronização de remoção - se uma notificação remota não existe mais no servidor, exclui localmente
        const remoteTagsOnServer = new Set(
          (remoteNotifs as AppNotification[])
            .filter((rn) => rn.userId === "todos" || rn.userId === user.id)
            .map((rn) => rn.tag),
        );

        // Limpa tags do cache localmente deletadas que não estão mais no servidor para liberar memória
        let localDeletedChanged = false;
        const cleanedLocallyDeleted = Array.from(locallyDeletedTags).filter(
          (tag) => {
            const keep = remoteTagsOnServer.has(tag);
            if (!keep) localDeletedChanged = true;
            return keep;
          },
        );
        if (localDeletedChanged) {
          localStorage.setItem(
            "aegis_deleted_remote_tags",
            JSON.stringify(cleanedLocallyDeleted),
          );
        }

        for (const localNotif of localNotifs) {
          if (localNotif.tag?.startsWith("remote_")) {
            if (!remoteTagsOnServer.has(localNotif.tag)) {
              try {
                await invoke("global_notif_delete_by_tag", {
                  tag: localNotif.tag,
                  userId: user.id,
                });
              } catch (delErr) {
                console.error(
                  "[GlobalScheduler] Erro ao deletar notificação órfã localmente:",
                  delErr,
                );
              }
            }
          }
        }
      } catch (err) {
        console.warn(
          "[GlobalScheduler] Erro ao sincronizar notificações remotas:",
          err instanceof Error ? err.message : String(err),
        );
      }
    };

    // Executa imediatamente e agenda repetições a cada 15 segundos
    syncWithServer();
    const interval = setInterval(syncWithServer, 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, user?.id]);

  return null;
}
