"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  AlertCircle,
  Bug,
  ChevronDown,
  Copy,
  Info,
  RefreshCw,
  Terminal,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLog } from "@/hooks/useLog";
import { cn } from "@/lib/utils";

interface LogEntry {
  level:
    | "ERROR"
    | "WARN"
    | "INFO"
    | "DEBUG"
    | "TRACE"
    | "STATUS"
    | "SUCCESS"
    | "NOTIFY";
  message: string;
  timestamp: string;
  raw: string;
}

const LEVEL_STYLES: Record<
  LogEntry["level"],
  { color: string; icon: React.ReactNode; bg: string }
> = {
  ERROR: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  NOTIFY: {
    color: "text-red-500 font-bold",
    bg: "bg-red-500/10",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  WARN: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  INFO: {
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    icon: <Info className="w-3 h-3" />,
  },
  STATUS: {
    color: "text-blue-500 font-semibold",
    bg: "bg-blue-600/10",
    icon: <Info className="w-3 h-3" />,
  },
  SUCCESS: {
    color: "text-green-400",
    bg: "bg-green-500/10",
    icon: <Activity className="w-3 h-3" />,
  },
  DEBUG: {
    color: "text-green-500",
    bg: "",
    icon: <Bug className="w-3 h-3" />,
  },
  TRACE: {
    color: "text-muted-foreground/60",
    bg: "",
    icon: <Activity className="w-3 h-3" />,
  },
};

function parseLine(raw: string): LogEntry {
  // Remover possíveis códigos de cor ANSI que o Tauri injete no arquivo de log
  const cleanRaw = raw
    .replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g"), "")
    .trim();

  // Formato nativo do tauri_plugin_log v2: [YYYY-MM-DD][HH:MM:SS][Target][Level] Message
  const newFormatMatch = cleanRaw.match(
    /\[(\d{4}-\d{2}-\d{2})\]\[([\d:]+)\]\[(.*?)\]\[(ERROR|WARN|INFO|DEBUG|TRACE)\]\s*(.*)/,
  );

  if (newFormatMatch) {
    const date = newFormatMatch[1];
    const time = newFormatMatch[2];
    const target = newFormatMatch[3];
    let level = newFormatMatch[4] as LogEntry["level"];
    let message = newFormatMatch[5];

    // Detectar targets customizados do back-end para injetar estilos
    if (target === "STATUS" || message.includes("[STATUS]")) {
      level = "STATUS";
      message = message.replace("[STATUS]", "").trim();
    } else if (target === "SUCCESS" || message.includes("[SUCCESS]")) {
      level = "SUCCESS";
      message = message.replace("[SUCCESS]", "").trim();
    } else if (
      target === "SYSTEM_NOTIFICATIONS" ||
      message.includes("[SYSTEM_NOTIFICATIONS]")
    ) {
      level = "NOTIFY";
      message = message.replace("[SYSTEM_NOTIFICATIONS]", "").trim();
    }

    return {
      timestamp: `${date}T${time}`,
      level,
      message,
      raw: cleanRaw,
    };
  }

  // Fallback: Formato antigo (antes da v2)
  const oldMatch = cleanRaw.match(
    /(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\s+(ERROR|WARN|INFO|DEBUG|TRACE)\s+(.*)/,
  );
  if (oldMatch) {
    let level = oldMatch[2] as LogEntry["level"];
    let message = oldMatch[3];

    if (message.includes("[STATUS]")) {
      level = "STATUS";
      message = message.replace("[STATUS]", "").trim();
    } else if (message.includes("[SUCCESS]")) {
      level = "SUCCESS";
      message = message.replace("[SUCCESS]", "").trim();
    } else if (message.includes("[SYSTEM_NOTIFICATIONS]")) {
      level = "NOTIFY";
      message = message.replace("[SYSTEM_NOTIFICATIONS]", "").trim();
    }

    message = message.replace(/^\[app_lib\]\s*/, "");

    return {
      timestamp: oldMatch[1],
      level,
      message,
      raw,
    };
  }

  return { timestamp: "", level: "INFO", message: raw, raw };
}

export function TelemetryTab() {
  const [logContent, setLogContent] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogEntry["level"] | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logPath, setLogPath] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const log = useLog("Telemetria");

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const raw = await invoke<string>("read_app_logs");
      const lines = raw.split("\n").filter(Boolean).map(parseLine);
      setLogContent(lines);
    } catch {
      setLogContent([
        {
          level: "WARN",
          message:
            "Nenhum log disponível ainda. O arquivo de log é criado após o primeiro uso do app.",
          timestamp: new Date().toISOString(),
          raw: "",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLogPath = useCallback(async () => {
    try {
      const path = await invoke<string>("get_log_path");
      setLogPath(path);
    } catch {
      setLogPath("");
    }
  }, []);

  const handleTestLog = () => {
    log.info("Iniciando sequência de testes de telemetria...");
    log.warn("Simulação: Uso de CPU acima do esperado (85%).");
    log.warn("Simulação: Latência de rede instável detectada.");
    log.error(
      "Simulação: Falha temporária ao sincronizar banco de dados local.",
      "TEST_DB_SYNC_ERR",
    );
    setTimeout(loadLogs, 500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success(`${label} copiado`);
      })
      .catch(() => {
        toast.error("Falha ao copiar");
      });
  };

  useEffect(() => {
    loadLogs();
    loadLogPath();
  }, [loadLogPath, loadLogs]);

  useEffect(() => {
    if (autoScroll && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [autoScroll]);

  const filtered = logContent.filter((e) => {
    if (filter !== "ALL" && e.level !== filter) return false;
    if (search && !e.message.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const counts = logContent.reduce(
    (acc, e) => {
      acc[e.level] = (acc[e.level] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
        <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
          <Terminal className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h3 className="font-bold text-sm">Telemetria Local</h3>
          <p className="text-xs text-muted-foreground truncate">
            {logPath || "Localizando arquivo de logs..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestLog}
            className="h-8 text-xs gap-1.5 border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
          >
            <Bug className="w-3 h-3" /> Simular
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadLogs}
            disabled={isLoading}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />{" "}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {(
          [
            "ALL",
            "ERROR",
            "WARN",
            "NOTIFY",
            "INFO",
            "STATUS",
            "SUCCESS",
            "DEBUG",
          ] as const
        ).map((level) => {
          const count =
            level === "ALL" ? logContent.length : counts[level] || 0;
          const style =
            level === "ALL"
              ? { color: "text-foreground", bg: "bg-accent/50" }
              : LEVEL_STYLES[level];
          return (
            <button
              key={level}
              type="button"
              onClick={() => setFilter(level)}
              className={cn(
                "flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer",
                filter === level
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-card hover:bg-accent/50",
              )}
            >
              <span className={cn("text-lg font-black", style.color)}>
                {count}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {level}
              </span>
            </button>
          );
        })}
      </div>

      {/* Busca */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar mensagens..."
          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Log Viewer */}
      <div className="relative rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/50">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Terminal className="w-3 h-3" /> {filtered.length} entradas
          </span>
          <button
            type="button"
            onClick={() => setAutoScroll((p) => !p)}
            className={cn(
              "flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer",
              autoScroll ? "text-green-400" : "text-muted-foreground",
            )}
          >
            <ChevronDown className="w-3 h-3" />
            {autoScroll ? "Auto-scroll ativo" : "Auto-scroll inativo"}
          </button>
        </div>

        <div
          ref={listRef}
          className="h-[420px] overflow-y-auto bg-black/90 p-2 space-y-0.5 font-mono custom-scrollbar"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <Trash2 className="w-6 h-6 opacity-30" />
              <p className="text-xs">Nenhuma entrada encontrada</p>
            </div>
          ) : (
            filtered.map((entry, i) => {
              const style = LEVEL_STYLES[entry.level];
              return (
                <button
                  key={`${entry.timestamp}-${entry.level}-${i}`}
                  type="button"
                  onClick={() =>
                    copyToClipboard(entry.raw || entry.message, "Log")
                  }
                  className={cn(
                    "w-full flex items-start gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-all group cursor-pointer relative text-left",
                    entry.level === "ERROR" &&
                      "bg-red-500/5 hover:bg-red-500/10",
                  )}
                >
                  <div className="absolute right-2 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1 mt-0.5 shrink-0 text-[10px] font-bold min-w-[52px]",
                      style.color,
                    )}
                  >
                    {style.icon} {entry.level}
                  </span>
                  {entry.timestamp && (
                    <span className="text-[9px] text-muted-foreground/40 mt-0.5 shrink-0 hidden group-hover:block">
                      {new Date(entry.timestamp).toLocaleTimeString("pt-BR")}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-[11px] break-all leading-relaxed",
                      style.color === "text-muted-foreground"
                        ? "text-zinc-400"
                        : style.color,
                    )}
                  >
                    {entry.message || entry.raw}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
