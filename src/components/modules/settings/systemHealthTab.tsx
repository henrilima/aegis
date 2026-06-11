"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  BellRing,
  CheckCircle2,
  Database,
  FileArchive,
  HardDrive,
  Music,
  RefreshCw,
  ShieldAlert,
  Volume2,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import {
  listNotificationSounds,
  playNotificationSound,
  resolveNotificationSound,
} from "@/lib/sounds";
import { cn } from "@/lib/utils";

interface AppConfigSnapshot {
  notificationSound: string;
  autoReadNotifications: boolean;
  highPriorityNotifications: boolean;
}

interface HealthState {
  loading: boolean;
  notificationStatus: string;
  notificationOk: boolean;
  sounds: string[];
  configuredSound: string;
  resolvedSound: string;
  logPath: string;
  autoBackupEnabled: boolean;
  autoBackupPath: string;
  lastBackupDate: string;
  config: AppConfigSnapshot | null;
}

const initialHealth: HealthState = {
  loading: true,
  notificationStatus: "verificando",
  notificationOk: false,
  sounds: [],
  configuredSound: "",
  resolvedSound: "",
  logPath: "",
  autoBackupEnabled: false,
  autoBackupPath: "",
  lastBackupDate: "",
  config: null,
};

export function SystemHealthTab() {
  const { themeStyles } = useTheme();
  const [health, setHealth] = useState<HealthState>(initialHealth);

  const loadHealth = useCallback(async () => {
    setHealth((current) => ({ ...current, loading: true }));

    const [permissionResult, sounds, config, logPath] = await Promise.all([
      invoke<string>("plugin:notification|request_permission")
        .then((result) => String(result || "granted"))
        .catch((error) => `erro: ${String(error)}`),
      listNotificationSounds().catch(() => [] as string[]),
      invoke<AppConfigSnapshot>("global_get_app_config").catch(() => null),
      invoke<string>("global_get_log_path").catch(() => ""),
    ]);

    let configuredSound = config?.notificationSound || "";
    const resolvedSound = resolveNotificationSound(configuredSound, sounds);

    if (
      configuredSound &&
      sounds.length > 0 &&
      !sounds.includes(configuredSound)
    ) {
      configuredSound = resolvedSound;
      if (config) {
        const updatedConfig = {
          ...config,
          notificationSound: resolvedSound,
        };
        invoke("global_set_app_config", { config: updatedConfig }).catch(
          () => null,
        );
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("aegis-config-changed"));
        }
      }
    }

    const permissionNormalized = permissionResult.toLowerCase();
    const notificationOk =
      !permissionNormalized.includes("denied") &&
      !permissionNormalized.includes("blocked") &&
      !permissionNormalized.startsWith("erro:");

    setHealth({
      loading: false,
      notificationStatus: notificationOk
        ? "Permitidas pelo Tauri"
        : permissionResult,
      notificationOk,
      sounds,
      configuredSound,
      resolvedSound,
      logPath,
      autoBackupEnabled:
        typeof window !== "undefined" &&
        localStorage.getItem("aegis_auto_backup_enabled") === "true",
      autoBackupPath:
        typeof window !== "undefined"
          ? localStorage.getItem("aegis_auto_backup_path") || ""
          : "",
      lastBackupDate:
        typeof window !== "undefined"
          ? localStorage.getItem("aegis_last_backup_date") || ""
          : "",
      config,
    });
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const soundNames = useMemo(
    () => health.sounds.map((sound) => sound.replace(/\.[^/.]+$/, "")),
    [health.sounds],
  );

  const handleTestNotification = async () => {
    try {
      await invoke("global_test_notification");
      toast.success("Notificacao nativa enviada para teste.");
      await loadHealth();
    } catch (error) {
      toast.error(`Falha no teste: ${String(error)}`);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500">
      <section className="flex items-center justify-between gap-5">
        <div className="flex items-center gap-5 min-w-0">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500/10">
            <Activity className="w-7 h-7 text-red-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-foreground">
              Saúde do Sistema
            </h2>
            <p className="text-sm text-muted-foreground">
              Diagnóstico técnico de notificações, áudio, dados locais e
              runtime.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadHealth}
          disabled={health.loading}
          className="gap-2 shrink-0"
        >
          <RefreshCw
            className={cn("w-4 h-4", health.loading && "animate-spin")}
          />
          Revalidar
        </Button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusPanel
          icon={BellRing}
          title="Notificações nativas"
          status={health.notificationStatus}
          ok={health.notificationOk}
          description="Validado pelo plugin nativo do Tauri. O status do navegador não é usado aqui porque pode marcar bloqueado mesmo quando o app desktop tem permissão."
          actions={
            <Button
              type="button"
              size="sm"
              onClick={handleTestNotification}
              className={cn("h-8 text-xs gap-2 text-white", themeStyles.solid, themeStyles.bgHover)}
            >
              <BellRing className="w-3.5 h-3.5" />
              Testar entrega
            </Button>
          }
        />

        <StatusPanel
          icon={Music}
          title="Áudio de notificações"
          status={
            health.configuredSound === health.resolvedSound
              ? "Configuração válida"
              : "Fallback ativo"
          }
          ok={health.sounds.length > 0}
          description={`Som configurado: ${health.configuredSound || "nenhum"}. Som resolvido: ${health.resolvedSound || "nenhum"}.`}
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                playNotificationSound(health.resolvedSound).catch((error) =>
                  toast.error(`Falha ao tocar som: ${String(error)}`),
                )
              }
              className="h-8 text-xs gap-2"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Tocar som
            </Button>
          }
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MetricCard
          icon={Database}
          title="Banco local"
          value="SQLite"
          detail="config.db e passwords.db"
          ok
        />
        <MetricCard
          icon={FileArchive}
          title="Backup automático"
          value={health.autoBackupEnabled ? "Ativo" : "Desativado"}
          detail={
            health.autoBackupPath
              ? health.autoBackupPath
              : "Sem diretório configurado"
          }
          ok={health.autoBackupEnabled ? Boolean(health.autoBackupPath) : true}
        />
        <MetricCard
          icon={HardDrive}
          title="Logs"
          value={health.logPath ? "Disponível" : "Indisponível"}
          detail={health.logPath || "Caminho não localizado"}
          ok={Boolean(health.logPath)}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <div className="p-5 bg-card border border-border rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/50 text-muted-foreground">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Biblioteca de sons
              </h3>
              <p className="text-xs text-muted-foreground">
                Arquivos detectados para seletores e fallbacks de notificação.
              </p>
            </div>
          </div>

          {soundNames.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {health.sounds.map((sound, index) => (
                <span
                  key={sound}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border text-[11px] font-bold",
                    sound === health.resolvedSound
                      ? `${themeStyles.bg} ${themeStyles.text} border-border`
                      : "bg-muted/30 border-border text-muted-foreground",
                  )}
                >
                  {soundNames[index]}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum arquivo de áudio foi localizado.
            </p>
          )}
        </div>

        <div className="p-5 bg-card border border-border rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/50 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Resumo</h3>
              <p className="text-xs text-muted-foreground">
                Estado agregado dos subsistemas monitorados.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <SummaryRow label="Notificações" ok={health.notificationOk} />
            <SummaryRow label="Áudio" ok={health.sounds.length > 0} />
            <SummaryRow label="Logs" ok={Boolean(health.logPath)} />
            <SummaryRow
              label="Backup"
              ok={!health.autoBackupEnabled || Boolean(health.autoBackupPath)}
            />
          </div>
        </div>
      </section>

      <div className="p-4 rounded-2xl border border-border bg-muted/20 flex gap-3">
        <ShieldAlert className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Esta aba é diagnóstica: ela não substitui as preferências das abas de
          Notificações e Dados e Backup. Use-a para verificar se caminhos, sons
          e permissões nativas estão coerentes.
        </p>
      </div>
    </div>
  );
}

function StatusPanel({
  icon: Icon,
  title,
  status,
  ok,
  description,
  actions,
}: {
  icon: ElementType;
  title: string;
  status: string;
  ok: boolean;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="p-5 bg-card border border-border rounded-2xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "p-2.5 rounded-xl border",
              ok
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                : "bg-amber-500/10 border-amber-500/20 text-amber-500",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p
              className={cn(
                "text-[11px] font-bold",
                ok ? "text-emerald-500" : "text-amber-500",
              )}
            >
              {status}
            </p>
          </div>
        </div>
        {actions}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  detail,
  ok,
}: {
  icon: ElementType;
  title: string;
  value: string;
  detail: string;
  ok: boolean;
}) {
  return (
    <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="p-2 rounded-lg bg-accent/50 text-muted-foreground">
          <Icon className="w-4 h-4" />
        </div>
        <span
          className={cn(
            "text-[10px] font-bold",
            ok ? "text-emerald-500" : "text-amber-500",
          )}
        >
          {ok ? "OK" : "Atenção"}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-semibold">{title}</p>
        <p className="text-lg font-black text-foreground leading-tight">
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground truncate mt-1">
          {detail}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span
        className={cn("font-bold", ok ? "text-emerald-500" : "text-amber-500")}
      >
        {ok ? "OK" : "Atenção"}
      </span>
    </div>
  );
}
