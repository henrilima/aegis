"use client";

import { invoke } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { open } from "@tauri-apps/plugin-shell";
import { check } from "@tauri-apps/plugin-updater";
import {
  Activity,
  AlarmClock,
  Bell,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Coffee,
  Download,
  Droplet,
  Flame,
  Ghost,
  Heart,
  Info,
  Moon,
  Music,
  Package,
  Pin,
  Shield,
  Star,
  Sun,
  Trash2,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { APP_CONFIG } from "@/app.config";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useTheme } from "@/context/ThemeContext";
import { useLog } from "@/hooks/useLog";
import type { AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface NotificationsPanelProps {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onDelete: (id: number) => void;
  onClearRead: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Bell,
  AlarmClock,
  Droplet,
  Activity,
  Moon,
  Coffee,
  Zap,
  Info,
  Heart,
  Flame,
  Star,
  Sun,
  Cloud,
  Music,
  Utensils,
  Shield,
  Ghost,
};

const CATEGORY_ICON: Record<string, string> = {
  sleep: "Moon",
  system: "Bell",
  habit: "Bell",
  hydration: "Droplet",
  alarms: "Bell",
};

const CATEGORY_COLOR: Record<string, string> = {
  sleep: "bg-blue-500/10 border-blue-500/20 text-blue-500",
  system: "bg-muted border-border/40 text-muted-foreground",
  habit: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
  hydration: "bg-sky-500/10 border-sky-500/20 text-sky-500",
  alarms: "bg-orange-500/10 border-orange-500/20 text-orange-500",
};

const NOTIF_COLORS: Record<string, string> = {
  red: "bg-red-500/10 border-red-500/20 text-red-500",
  orange: "bg-orange-500/10 border-orange-500/20 text-orange-500",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-500",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
  teal: "bg-teal-500/10 border-teal-500/20 text-teal-500",
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-500",
  sky: "bg-sky-500/10 border-sky-500/20 text-sky-500",
  purple: "bg-purple-500/10 border-purple-500/20 text-purple-500",
  violet: "bg-violet-500/10 border-violet-500/20 text-violet-500",
  pink: "bg-pink-500/10 border-pink-500/20 text-pink-500",
  rose: "bg-rose-500/10 border-rose-500/20 text-rose-500",
  indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-500",
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface GithubRelease {
  tag_name: string;
  html_url: string;
}
type VersionState =
  | "loading"
  | "up-to-date"
  | "update-available"
  | "downloading"
  | "ready"
  | "beta"
  | "error";

// Cache global para evitar múltiplas chamadas à API ao abrir/fechar o painel
let cachedRelease: GithubRelease | null = null;
let cachedVState: VersionState = "loading";
let cachedVDiff = 0;
let lastCheckTime = 0;

function VersionCard({
  vState,
  vDiff,
  release: _,
  setShowUpdateDialog,
}: {
  vState: VersionState;
  vDiff: number;
  release: GithubRelease | null;
  setShowUpdateDialog: (v: boolean) => void;
}) {
  const { themeStyles: theme } = useTheme();
  const isCaveMode = vDiff >= 1.0;

  if (vState === "update-available") {
    return (
      <button
        type="button"
        onClick={() => setShowUpdateDialog(true)}
        className={cn(
          "w-[calc(100%-2.5rem)] mx-5 mb-3 p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] text-left",
          isCaveMode
            ? "bg-amber-500/10 border-amber-500/20"
            : `${theme.bg} ${theme.border.replace("/70", "/20")}`,
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-xl",
              isCaveMode
                ? "bg-amber-500/20"
                : "bg-background/80 border border-border/50",
            )}
          >
            <Package
              className={cn(
                "w-4 h-4",
                isCaveMode ? "text-amber-500" : theme.text,
              )}
            />
          </div>
          <div>
            <p className="text-[11px] font-bold text-foreground">
              Atualização disponível
            </p>
            <p className="text-[10px] text-muted-foreground">
              Atualize para receber novidades e correções de bugs.
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
      </button>
    );
  }

  return null;
}

export function NotificationsPanel({
  notifications,
  unreadCount,
  isOpen,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClearRead,
}: NotificationsPanelProps) {
  const { themeStyles: theme } = useTheme();
  const [exitingIds, setExitingIds] = useState<Set<number>>(new Set());
  const [isClosing, setIsClosing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const panelRef = useRef<HTMLDivElement>(null);

  // Update State
  const [release, setRelease] = useState<GithubRelease | null>(cachedRelease);
  const [vState, setVState] = useState<VersionState>(cachedVState);
  const [vDiff, setVDiff] = useState(cachedVDiff);
  const [_errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const log = useLog("Updater");
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      if (!isOpen) return;

      // Se já verificamos há menos de 1 hora, usamos o cache
      const oneHour = 60 * 60 * 1000;
      if (
        lastCheckTime > 0 &&
        Date.now() - lastCheckTime < oneHour &&
        vState !== "error" &&
        vState !== "loading"
      ) {
        return;
      }

      try {
        // 1. Tenta usar o Updater oficial do Tauri primeiro (Seguro)
        try {
          const update = await check();
          if (update) {
            const newState: VersionState = "update-available";
            const newRelease = {
              tag_name: update.version,
              html_url: "https://github.com/henrilima/aegis/releases/latest",
            };
            setVState(newState);
            setRelease(newRelease);

            // Salva no cache
            cachedVState = newState;
            cachedRelease = newRelease;
            lastCheckTime = Date.now();
            return;
          } else {
            // Se o updater oficial responder que não há updates, confiamos nele
            const newState: VersionState = "up-to-date";
            setVState(newState);
            cachedVState = newState;
            lastCheckTime = Date.now();
            return;
          }
        } catch (_) {
          log.warn("Updater oficial indisponível, tentando GitHub API...");
        }

        // 2. Se não houver update oficial, faz o check visual via Rust command (mais estável)
        const data: GithubRelease = await invoke("check_github_update");
        setRelease(data);
        cachedRelease = data;

        const cur = APP_CONFIG.version.split(".").map(Number);
        const lat = data.tag_name
          .replace(/[^0-9.]/g, "")
          .split(".")
          .map(Number);

        const weights = [1, 0.1, 0.01];
        let diff = 0;
        for (
          let i = 0;
          i < Math.max(cur.length, lat.length, weights.length);
          i++
        ) {
          const d = (lat[i] || 0) - (cur[i] || 0);
          if (d !== 0) {
            diff = Math.abs(d) * (weights[i] ?? 0.001);
            break;
          }
        }
        setVDiff(diff);
        cachedVDiff = diff;

        let state: VersionState = "up-to-date";
        for (let i = 0; i < Math.max(cur.length, lat.length); i++) {
          const c = cur[i] || 0;
          const l = lat[i] || 0;
          if (c > l) {
            state = "beta";
            break;
          }
          if (c < l) {
            state = "update-available";
            break;
          }
        }
        setVState(state);
        cachedVState = state;
        lastCheckTime = Date.now();
        setErrorMsg(null);
      } catch (err) {
        log.error("Erro no updater visual", err);
        setVState("error");
        setErrorMsg(
          typeof err === "string"
            ? err
            : "Não foi possível verificar atualizações.",
        );
      }
    };
    checkUpdate();
  }, [log.error, log.warn, isOpen, vState]);

  const handleUpdate = async () => {
    try {
      const update = await check();
      if (!update) {
        // Se o updater falhar ou não achar, abre o browser como fallback
        if (release) open(release.html_url);
        return;
      }

      setVState("downloading");

      // Realiza o backup preventivo antes de baixar
      try {
        await invoke("pre_update_backup");
        log.info("Backup pré-update realizado com sucesso.");
      } catch (e) {
        log.error("Falha no backup pré-update (continuando mesmo assim)", e);
      }

      let downloaded = 0;
      let total = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength || 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (total > 0) setDownloadProgress((downloaded / total) * 100);
            break;
          case "Finished":
            setVState("ready");
            break;
        }
      });

      // Reinicia o app para aplicar
      await relaunch();
    } catch (err) {
      log.error("Falha na instalação automática", err);
      toast.error("Erro ao baixar atualização. Tente baixar manualmente.");
      setVState("error");
    }
  };

  function UpdateDialog() {
    const isCaveMode = vDiff >= 1.0;
    const isBeta = vState === "beta";
    const isDownloading = vState === "downloading";
    const isReady = vState === "ready";

    if (!showUpdateDialog) return null;

    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div
          role="none"
          className="absolute inset-0 bg-background/40 backdrop-blur-sm"
          onClick={() => setShowUpdateDialog(false)}
        />
        <div className="relative w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          {/* Header decorativo */}
          <div
            className={cn(
              "h-24 flex items-center justify-center relative overflow-hidden",
              isCaveMode
                ? "bg-amber-500/10"
                : isBeta
                  ? "bg-purple-500/10"
                  : theme.bg,
            )}
          >
            <div className="absolute inset-0 opacity-20" />
            <Package
              className={cn(
                "w-10 h-10 relative z-10",
                isCaveMode
                  ? "text-amber-500"
                  : isBeta
                    ? "text-purple-500"
                    : theme.text,
              )}
            />
          </div>

          <div className="p-6 space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                {isDownloading
                  ? "Baixando Atualização"
                  : isReady
                    ? "Tudo Pronto!"
                    : "Nova Versão Disponível"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isDownloading
                  ? "Aguarde enquanto preparamos os novos recursos."
                  : isReady
                    ? "O Aegis precisa reiniciar para aplicar."
                    : "Uma nova versão do Aegis está pronta para você."}
              </p>
            </div>

            <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium">
                  Sua versão atual
                </span>
                <span className="text-foreground font-bold">
                  {APP_CONFIG.version}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium">
                  Nova versão
                </span>
                <span
                  className={cn(
                    "font-bold",
                    isCaveMode ? "text-amber-500" : theme.text,
                  )}
                >
                  {release?.tag_name || "v2.1.x"}
                </span>
              </div>
              {isDownloading && (
                <div className="space-y-2 pt-2">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        theme.solid,
                      )}
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-center font-mono text-muted-foreground">
                    {Math.round(downloadProgress)}% concluído
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUpdateDialog(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-muted-foreground transition-all active:scale-95 cursor-pointer"
              >
                Depois
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isDownloading}
                className={cn(
                  "flex-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2",
                  isCaveMode
                    ? "bg-amber-600 hover:bg-amber-500"
                    : `${theme.solid} ${theme.solidHover}`,
                )}
              >
                {isDownloading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Baixando...
                  </>
                ) : isReady ? (
                  "Reiniciar Agora"
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Atualizar Agora
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reseta estado ao abrir
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setExitingIds(new Set());
      panelRef.current?.focus();

      // Auto-read logic
      if (unreadCount > 0) {
        invoke<{ autoReadNotifications: boolean }>("get_app_config")
          .then((config) => {
            if (config.autoReadNotifications) {
              onMarkAllRead();
            }
          })
          .catch(console.error);
      }
    }
  }, [isOpen, unreadCount, onMarkAllRead]);

  // Intercepta o fechamento para exibir animação de saída
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setShowUpdateDialog(false); // Reset update dialog on close
    }, 280);
  };

  // Focus trap: impede que Tab vaze para o conteúdo por trás do painel
  const handlePanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      handleClose();
      return;
    }
    if (e.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };

  const handleMarkRead = (ids: number[]) => {
    for (const id of ids) setExitingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      for (const id of ids) {
        onMarkRead(id);
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }, 350);
  };

  const handleDeleteGroup = (ids: number[]) => {
    for (const id of ids) {
      onDelete(id);
    }
  };

  const groupedNotifications = useMemo(() => {
    const groups: Map<
      string,
      AppNotification & { count: number; ids: number[] }
    > = new Map();

    for (const n of notifications) {
      if (activeFilter !== "all" && n.category !== activeFilter) continue;

      const key = `${n.category}-${n.title}-${n.isRead}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count++;
        existing.ids.push(n.id);
        if (new Date(n.createdAt) > new Date(existing.createdAt)) {
          existing.createdAt = n.createdAt;
        }
      } else {
        groups.set(key, { ...n, count: 1, ids: [n.id] });
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [notifications, activeFilter]);

  const uniqueCategories = Array.from(
    new Set(notifications.map((n) => n.category)),
  );

  const categoryLabels: Record<string, string> = {
    system: "Sistema",
    sleep: "Sono",
    habit: "Hábitos",
    hydration: "Hidratação",
    alarms: "Alarmes",
    alarmes: "Alarmes",
  };

  const hasRead = notifications.some((n) => n.isRead);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start items-start">
      {/* Backdrop - fechamento por mouse; teclado usa Escape ou botão X */}
      <div
        role="none"
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[2px] w-full h-full cursor-default transition-opacity duration-300",
          isClosing ? "opacity-0" : "opacity-100",
        )}
        onClick={handleClose}
      />

      {/* Painel lateral deslizante - é este div que é o dialog de fato */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Painel de notificações"
        tabIndex={-1}
        className={cn(
          "relative flex flex-col h-full w-[350px] bg-background/95 backdrop-blur-xl border-r border-border z-10 outline-none",
          isClosing
            ? "animate-out slide-out-to-left duration-280 ease-in"
            : "animate-in slide-in-from-left duration-300 ease-out",
        )}
        onKeyDown={handlePanelKeyDown}
      >
        {/* Cabeçalho do painel */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border/80 bg-card/20">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${theme.bg} border ${theme.border} group`}
            >
              <Bell
                className={`w-4 h-4 ${theme.text} group-hover:rotate-12 transition-transform`}
              />
            </div>
            <div>
              <h2 className="font-bold text-[15px] text-foreground">
                Notificações
              </h2>
              {unreadCount > 0 ? (
                <p
                  className={`text-[11px] font-medium ${theme.text} opacity-80`}
                >
                  {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
                </p>
              ) : (
                <p
                  className={`text-[11px] font-medium ${theme.text} opacity-80`}
                >
                  Nenhuma notificação
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {vState === "update-available" && (
              <ToolTip content="Nova atualização disponível">
                <button
                  type="button"
                  onClick={() => setShowUpdateDialog(true)}
                  className={cn(
                    "p-2 rounded-xl animate-pulse transition-all cursor-pointer active:scale-95",
                    theme.text,
                    theme.bg,
                  )}
                >
                  <Package className="w-4 h-4" />
                </button>
              </ToolTip>
            )}
            {unreadCount > 0 && (
              <ToolTip content="Marcar todas como lidas">
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="p-2 rounded-xl text-muted-foreground hover:text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              </ToolTip>
            )}
            {hasRead && (
              <ToolTip content="Limpar lidas">
                <button
                  type="button"
                  onClick={onClearRead}
                  className="p-2 rounded-xl text-muted-foreground hover:text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </ToolTip>
            )}
            <ToolTip content="Fechar">
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </ToolTip>
          </div>
        </div>

        {/* Seção Fixa: Versão e Filtros */}
        <div className="flex flex-col shrink-0">
          {/* Status da versão do software */}
          <div className="border-b border-border/60 bg-card/30 py-1">
            <div className="px-5 py-1.5">
              <p className="text-[10px] font-bold text-muted-foreground">
                Estado do sistema
              </p>
            </div>
            <VersionCard
              vState={vState}
              vDiff={vDiff}
              release={release}
              setShowUpdateDialog={setShowUpdateDialog}
            />
          </div>

          {/* Filtros de Categoria */}
          {uniqueCategories.length > 0 && (
            <div className="px-5 py-3 border-b border-border/50 bg-card/20 flex gap-2 overflow-x-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                  activeFilter === "all"
                    ? `${theme.bg} ${theme.text}`
                    : "bg-muted/50 text-muted-foreground hover:bg-muted",
                )}
              >
                Todas
              </button>
              {uniqueCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveFilter(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                    activeFilter === cat
                      ? `${theme.bg} ${theme.text}`
                      : "bg-muted/50 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>
          )}

          <div className="px-5 py-3 border-b border-border/10">
            <p className="text-[10px] font-bold text-muted-foreground">
              Alertas recentes
            </p>
          </div>
        </div>

        {/* Lista de notificações - Única parte rolável */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <div className="flex-1 divide-y divide-border/40">
            {groupedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-10 text-center gap-4 animate-in fade-in zoom-in duration-700">
                <div className="p-5 rounded-xl bg-card/50 border border-border group">
                  <Bell
                    className={`w-8 h-8 text-muted-foreground group-hover:${theme.text} opacity-80 transition-colors duration-500`}
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Tudo limpo por aqui
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
                    Você não tem novas notificações{" "}
                    {activeFilter !== "all" ? "desta categoria" : "no momento"}.
                  </p>
                </div>
              </div>
            ) : (
              groupedNotifications.map((n, idx) => (
                <NotificationCard
                  key={`${n.category}-${n.title}-${n.isRead}`}
                  n={n}
                  idx={idx}
                  theme={theme}
                  exitingIds={exitingIds}
                  handleMarkRead={handleMarkRead}
                  handleDeleteGroup={handleDeleteGroup}
                />
              ))
            )}
          </div>
        </div>

        {/* Rodapé informativo do sistema */}
        <div className="px-5 py-4 border-t border-border/80 bg-card/20">
          <p className="text-[10px] text-muted-foreground/70 text-center font-medium italic">
            Sistema Aegis - Software para Desktop
          </p>
        </div>

        {/* Dialog de Atualização */}
        <UpdateDialog />
      </div>
    </div>
  );
}

function NotificationCard({
  n,
  idx,
  theme,
  exitingIds,
  handleMarkRead,
  handleDeleteGroup,
}: {
  n: AppNotification & { count: number; ids: number[] };
  idx: number;
  theme: { solid: string; solidHover: string; text: string; bg: string };
  exitingIds: Set<number>;
  handleMarkRead: (ids: number[]) => void;
  handleDeleteGroup: (ids: number[]) => void;
}) {
  return (
    <div
      style={{ animationDelay: `${idx * 50}ms` }}
      className={cn(
        "group relative w-full overflow-hidden transition-all duration-300 animate-in slide-in-from-left-2",
        n.ids.some((id) => exitingIds.has(id))
          ? "opacity-0 -translate-x-4 scale-95 pointer-events-none"
          : n.isRead
            ? "bg-transparent opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0 hover:bg-muted/10"
            : "bg-transparent hover:bg-muted/40",
      )}
    >
      {/* Botão de ação principal (Overlay) - Satisfaz a semântica sem aninhar botões */}
      <button
        type="button"
        onClick={() => !n.isRead && handleMarkRead(n.ids)}
        className="absolute inset-0 w-full h-full bg-transparent cursor-pointer z-0 outline-none focus-visible:bg-muted/20"
        aria-label={`Marcar "${n.title}" como lida`}
      />

      {/* Conteúdo e botões secundários */}
      <div className="relative z-10 flex gap-3 px-4 py-3.5 pointer-events-none">
        <div
          className={cn(
            "mt-0.5 shrink-0 w-10 h-10 rounded-[14px] border flex items-center justify-center transition-transform group-hover:scale-105",
            n.color && NOTIF_COLORS[n.color]
              ? NOTIF_COLORS[n.color]
              : (CATEGORY_COLOR[n.category] ?? CATEGORY_COLOR.system),
            n.isRead && "opacity-80",
          )}
        >
          {(() => {
            const IconComp =
              ICON_MAP[n.icon || ""] ||
              ICON_MAP[CATEGORY_ICON[n.category]] ||
              Bell;
            return <IconComp className="w-4 h-4" />;
          })()}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "text-[13px] font-bold leading-tight",
                    n.isRead ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {n.title}
                </p>
                {!n.isRead && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 text-[8px] font-bold animate-in fade-in zoom-in">
                    Novo
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">
                {formatDate(n.createdAt)}
                {n.count > 1 && (
                  <span className="ml-2 py-0.5 px-1.5 rounded-full bg-accent text-[9px] font-black text-foreground">
                    {n.count}x
                  </span>
                )}
              </p>

              <p
                className={cn(
                  "text-[12px] leading-relaxed mt-1",
                  n.isRead ? "text-muted-foreground" : "text-muted-foreground",
                )}
              >
                {n.body.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                  part.match(/^https?:\/\//) ? (
                    <span
                      key={`${n.id}-part-${i}`}
                      className={`${theme.text} font-bold break-all`}
                    >
                      {part}
                    </span>
                  ) : (
                    part
                  ),
                )}
              </p>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 ml-auto self-center pointer-events-auto">
              {n.persistent ? (
                <ToolTip content="Esta notificação é permanente">
                  <span className="p-1.5 rounded-lg text-muted-foreground/80 cursor-default flex">
                    <Pin className="w-3.5 h-3.5" />
                  </span>
                </ToolTip>
              ) : (
                <ToolTip content="Remover todas">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(n.ids);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:text-red-400 hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </ToolTip>
              )}

              {!n.isRead && (
                <ToolTip content="Marcar todas como lidas">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(n.ids);
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </ToolTip>
              )}
            </div>
          </div>

          {n.body.match(/https?:\/\/[^\s]+/) && (
            <div className="mt-1 flex gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const match = n.body.match(/(https?:\/\/[^\s]+)/);
                  if (match) {
                    open(match[0]);
                  } else if (
                    n.tag === "discord-invite" ||
                    n.title.toLowerCase().includes("discord")
                  ) {
                    open("https://discord.gg/pCQTuTGJUx");
                  }
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-2",
                  n.title.toLowerCase().includes("discord") ||
                    n.body.toLowerCase().includes("discord")
                    ? "bg-[#5865F2] hover:bg-[#4752C4] text-white"
                    : `${theme.solid} ${theme.solidHover} text-white`,
                )}
              >
                {n.body.toLowerCase().includes("discord") ? (
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 127.14 96.36"
                    fill="currentColor"
                    role="img"
                  >
                    <title>Discord Icon</title>
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.21a105.73,105.73,0,0,0,32.22,16.15c2.51-3.45,4.76-7.1,6.69-10.94a74.84,74.84,0,0,1-10.65-5.14,53.27,53.27,0,0,0,1.31-1,80,80,0,0,0,74.15,0c.41.34.88.67,1.31,1a74.11,74.11,0,0,1-10.65,5.14c1.93,3.84,4.18,7.49,6.69,10.94a105.31,105.31,0,0,0,32.29-16.16C130,50.12,125.09,26.28,117.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.1,65.69,84.69,65.69Z" />
                  </svg>
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                Ver no{" "}
                {n.body.toLowerCase().includes("discord") ? "Discord" : "Site"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
