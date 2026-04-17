"use client";

import { open } from "@tauri-apps/plugin-shell";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Droplet,
  Info,
  Moon,
  Pin,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { APP_CONFIG } from "@/app.config";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useTheme } from "@/context/ThemeContext";
import type { AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface NotificationsPanelProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onDelete: (id: number) => void;
  onClearRead: () => void;
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  sleep: <Moon className="w-4 h-4 text-blue-400" />,
  system: <Bell className="w-4 h-4 text-muted-foreground" />,
  habit: <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  hydration: <Droplet className="w-4 h-4 text-sky-400" />,
};

const CATEGORY_COLOR: Record<string, string> = {
  sleep: "bg-blue-500/10 border-blue-500/20",
  system: "bg-muted border-border/40",
  habit: "bg-emerald-500/10 border-emerald-500/20",
  hydration: "bg-sky-500/10 border-sky-500/20",
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
  | "beta"
  | "error";

function VersionCard() {
  const [release, setRelease] = useState<GithubRelease | null>(null);
  const [vState, setVState] = useState<VersionState>("loading");
  const [vDiff, setVDiff] = useState(0);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(
          "https://api.github.com/repos/henrilima/aegis/releases/latest",
          {
            cache: "no-store",
            headers: { Accept: "application/vnd.github.v3+json" },
          },
        );
        if (!res.ok) {
          setVState("error");
          return;
        }
        const data: GithubRelease = await res.json();
        setRelease(data);

        const cur = APP_CONFIG.version.split(".").map(Number);
        const lat = data.tag_name
          .replace(/[^0-9.]/g, "")
          .split(".")
          .map(Number);
        const cVal = (cur[0] || 0) + (cur[1] || 0) / 10;
        const lVal = (lat[0] || 0) + (lat[1] || 0) / 10;
        const diff = Math.abs(cVal - lVal);
        setVDiff(diff);

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
      } catch {
        setVState("error");
      }
    };
    check();
  }, []);

  if (vState === "loading")
    return (
      <div className="px-4 py-3 flex items-center gap-2 text-muted-foreground text-xs">
        <div className="w-3.5 h-3.5 border-2 border-border border-b-transparent rounded-full animate-spin shrink-0" />
        Verificando atualizações...
      </div>
    );

  if (vState === "error")
    return (
      <div className="px-4 py-3 flex items-center gap-2.5 text-xs">
        <Info className="w-4 h-4 text-red-500 shrink-0" />
        <span className="text-red-600 dark:text-red-400/80">
          Não foi possível verificar atualizações agora.
        </span>
      </div>
    );

  if (vState === "up-to-date")
    return (
      <div className="px-4 py-3.5 flex flex-col gap-1 text-xs border-l-2 border-emerald-500/50 bg-emerald-500/5">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-none">
            Sistema atualizado
          </span>
          <span className="text-[11px] text-muted-foreground mt-1.5">
            Sua versão:{" "}
            <span className="font-bold text-xs text-foreground">
              {APP_CONFIG.version}
            </span>{" "}
            (Estável)
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-1">
          Aegis está operando na versão mais recente disponível.
        </p>
      </div>
    );

  if (vState === "beta") {
    const isGalactic = vDiff >= 1.5;
    return (
      <div
        className={cn(
          "px-4 py-3.5 flex flex-col gap-1.5 border-l-2 bg-purple-500/5",
          isGalactic ? "border-purple-400" : "border-purple-500/30",
        )}
      >
        <div className="flex flex-col">
          <span className="text-sm font-bold text-purple-400">
            {isGalactic ? "🛸 Paradoxo temporal" : "🧪 Versão beta"}
          </span>
          <div className="flex flex-col text-[11px] mt-1.5 space-y-0.5">
            <p className="text-muted-foreground">
              Sua versão:{" "}
              <span className="text-foreground font-bold text-xs">
                {APP_CONFIG.version}
              </span>
            </p>
            <p className="text-muted-foreground">
              Próxima oficial:{" "}
              <span className="font-bold text-foreground">
                {release?.tag_name}
              </span>
            </p>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed italic opacity-70">
          {isGalactic
            ? "Você está testando uma versão avançada do futuro."
            : "Recursos experimentais em teste."}
        </p>
      </div>
    );
  }

  const isCaveMode = vDiff >= 1.0;
  return (
    <div
      className={cn(
        "px-4 py-3.5 flex flex-col gap-2 border-l-2 bg-card/40",
        isCaveMode ? "border-amber-500/50" : "border-blue-500/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span
            className={cn(
              "text-sm font-bold",
              isCaveMode ? "text-amber-400" : "text-blue-400",
            )}
          >
            {isCaveMode ? "🕰️ Versão primitiva" : "📦 Nova versão"}
          </span>
          <div className="flex flex-col gap-0.5 mt-2">
            <p className="text-[11px] text-muted-foreground">
              Sua versão:{" "}
              <span className="text-foreground font-bold text-xs">
                {APP_CONFIG.version}
              </span>
            </p>
            <p
              className={cn(
                "text-[11px] font-bold",
                isCaveMode ? "text-amber-400" : "text-blue-400",
              )}
            >
              Disponível:{" "}
              <span className="text-xs text-foreground">
                {release?.tag_name}
              </span>
            </p>
          </div>
        </div>
        {release && (
          <button
            type="button"
            onClick={() => open(release.html_url)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-xs flex items-center gap-1.5",
              isCaveMode
                ? "bg-amber-600 hover:bg-amber-500 text-foreground"
                : "bg-blue-600 hover:bg-blue-500 text-foreground",
            )}
          >
            Atualizar
          </button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
        {isCaveMode
          ? "Sua versão é obsoleta. Recomendamos atualizar para proteger seus dados."
          : `Novos recursos e melhorias de performance estão disponíveis.`}
      </p>
    </div>
  );
}

export function NotificationsPanel({
  notifications,
  isOpen,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClearRead,
}: NotificationsPanelProps) {
  const { themeStyles: theme } = useTheme();

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const hasRead = notifications.some((n) => n.is_read);

  return (
    <div className="fixed inset-0 z-50 flex justify-start items-start">
      {/* Camada de fundo (backdrop) para fechar ao clicar fora */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity w-full h-full border-none cursor-default"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === " ") {
            onClose();
          }
        }}
        aria-label="Fechar painel"
      />

      {/* Painel lateral deslizante */}
      <div className="relative flex flex-col h-full w-[350px] bg-background/95 backdrop-blur-xl border-r border-border z-10 animate-in slide-in-from-left duration-500 ease-out">
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
              {unreadCount > 0 && (
                <p
                  className={`text-[11px] font-medium ${theme.text} opacity-80`}
                >
                  {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
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
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </ToolTip>
          </div>
        </div>

        {/* Conteúdo da lista de notificações */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {/* Status da versão do software */}
          <div className="border-b border-border/60 bg-card/30 py-1">
            <div className="px-5 py-1.5">
              <p className="text-[10px] font-bold text-muted-foreground">
                Estado do sistema
              </p>
            </div>
            <VersionCard />
          </div>

          <div className="px-5 py-3">
            <p className="text-[10px] font-bold text-muted-foreground">
              Alertas recentes
            </p>
          </div>

          <div className="flex-1 divide-y divide-border/40">
            {notifications.length === 0 ? (
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
                    Você não tem novas notificações no momento.
                  </p>
                </div>
              </div>
            ) : (
              notifications.map((n, idx) => (
                <div
                  key={n.id}
                  style={{ animationDelay: `${idx * 50}ms` }}
                  className={cn(
                    "group flex gap-4 px-5 py-4.5 transition-all duration-300 animate-in slide-in-from-left-2",
                    n.is_read
                      ? "bg-transparent opacity-40 grayscale-[0.5] hover:opacity-80 hover:grayscale-0"
                      : `bg-transparent hover:bg-muted/40 border-l-2 ${theme.border}`,
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 shrink-0 w-10 h-10 rounded-[14px] border flex items-center justify-center transition-transform group-hover:scale-105",
                      CATEGORY_COLOR[n.category] ?? CATEGORY_COLOR.system,
                    )}
                  >
                    {CATEGORY_ICON[n.category] ?? CATEGORY_ICON.system}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <p
                          className={cn(
                            "text-[13px] font-bold leading-tight",
                            n.is_read
                              ? "text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {formatDate(n.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
                        {!n.is_read && (
                          <ToolTip content="Marcar como lida">
                            <button
                              type="button"
                              onClick={() => onMarkRead(n.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          </ToolTip>
                        )}
                        {n.persistent ? (
                          <ToolTip content="Esta notificação é permanente">
                            <span className="p-1.5 rounded-lg text-muted-foreground/80 cursor-default flex">
                              <Pin className="w-3.5 h-3.5" />
                            </span>
                          </ToolTip>
                        ) : (
                          <ToolTip content="Remover">
                            <button
                              type="button"
                              onClick={() => onDelete(n.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 dark:text-red-400 hover:bg-accent/50 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </ToolTip>
                        )}
                      </div>
                    </div>

                    <p
                      className={cn(
                        "text-[12px] leading-relaxed",
                        n.is_read
                          ? "text-muted-foreground"
                          : "text-muted-foreground",
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

                    {n.body.match(/https?:\/\/[^\s]+/) && (
                      <div className="mt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const match = n.body.match(/(https?:\/\/[^\s]+)/);
                            if (match) open(match[0]);
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[11px] font-black uppercase transition-all active:scale-95 flex items-center gap-2",
                            n.title.toLowerCase().includes("discord") ||
                              n.body.toLowerCase().includes("discord")
                              ? "bg-[#5865F2] hover:bg-[#4752C4] text-white"
                              : `${theme.solid} ${theme.solidHover} text-white`,
                          )}
                        >
                          {n.body.toLowerCase().includes("discord") ? (
                            <>
                              <svg
                                className="w-3.5 h-3.5"
                                viewBox="0 0 127.14 96.36"
                                fill="currentColor"
                                role="img"
                              >
                                <title>Discord Icon</title>
                                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.71,32.65-1.82,56.6.48,80.21a105.73,105.73,0,0,0,32.22,16.15c2.51-3.45,4.76-7.1,6.69-10.94a74.84,74.84,0,0,1-10.65-5.14,53.27,53.27,0,0,0,1.31-1,80,80,0,0,0,74.15,0c.41.34.88.67,1.31,1a74.11,74.11,0,0,1-10.65,5.14c1.93,3.84,4.18,7.49,6.69,10.94a105.31,105.31,0,0,0,32.29-16.16C130,50.12,125.09,26.28,117.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.1,65.69,84.69,65.69Z" />
                              </svg>
                              Entrar no Servidor
                            </>
                          ) : (
                            "Acessar Link"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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
      </div>
    </div>
  );
}
