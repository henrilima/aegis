"use client";

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { BellOff, Clock } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSystemIcon } from "@/components/global/IconSelect";
import { stopNotificationSound } from "@/lib/sounds";
import { HEX_COLORS, type ThemeColorKey } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { AppAlarm } from "./types";

function formatCurrentTime() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function FloatingAlarmWidget() {
  const [alarm, setAlarm] = useState<AppAlarm | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasClosedRef = useRef(false);

  const colorKey = (alarm?.color || getModuleColor("alarms")) as ThemeColorKey;
  const hexColor = HEX_COLORS[colorKey as keyof typeof HEX_COLORS] || "#3b82f6";

  // Função centralizada para interromper todo e qualquer som do widget
  const stopWidgetAudio = useCallback(() => {
    stopNotificationSound();
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
      } catch (e) {
        console.warn("Erro ao pausar áudio do widget:", e);
      }
      audioRef.current = null;
    }
  }, []);

  const displayTime =
    alarm?.alarmType === "interval"
      ? formatCurrentTime()
      : alarm?.time || "08:00";

  const closeWidget = useCallback(
    (manual = false) => {
      if (hasClosedRef.current) return;
      hasClosedRef.current = true;

      stopWidgetAudio();

      if (!manual && alarm && alarm.userId) {
        const title = `Alarme Perdido: ${alarm.title}`;
        const body = `Você não atendeu ao alarme configurado para às ${displayTime}.`;
        const todayStr = new Date().toISOString().split("T")[0];
        const tag = `missed_alarm_${alarm.id || 0}_${todayStr}_${displayTime}`;

        invoke("global_notif_push", {
          n: {
            userId: alarm.userId,
            title,
            body,
            category: "alarms",
            tag,
            color: "red",
            icon: alarm.icon || "BellOff",
            persistent: false,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        }).catch((err) =>
          console.warn(
            "[FloatingAlarmWidget] Erro ao registrar alarme perdido:",
            err,
          ),
        );
      }

      if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
        invoke("alarm_clear_active_widget_alarm").catch(console.error);
        getCurrentWindow().close();
      }
    },
    [alarm, displayTime, stopWidgetAudio],
  );

  // Interrompe áudio se a janela for fechada ou descarregada pelo sistema
  useEffect(() => {
    const handleUnload = () => {
      stopWidgetAudio();
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
      stopWidgetAudio();
    };
  }, [stopWidgetAudio]);

  // Auto-fechamento do widget após 1 minuto (60 segundos) se não for encerrado manualmente
  useEffect(() => {
    if (!alarm) return;
    const timer = setTimeout(() => {
      closeWidget(false);
    }, 60_000);

    return () => {
      clearTimeout(timer);
    };
  }, [alarm, closeWidget]);

  // Carrega o alarme ativo da memória do Rust ou via evento
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
      invoke<AppAlarm | null>("alarm_get_active_widget_alarm")
        .then((res) => {
          if (res) {
            setAlarm(res);
          }
        })
        .catch(console.error);

      listen<AppAlarm>("alarm-trigger", (event) => {
        if (event.payload) {
          setAlarm(event.payload);
        }
      }).then((fn) => {
        unlisten = fn;
      });
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Áudio contínuo em loop com limpeza garantida (apenas se alarm for não-nulo)
  useEffect(() => {
    if (!alarm) return;

    const soundFile = alarm.soundFile || "alarm_1.mp3";
    let isCancelled = false;

    const startAudio = async () => {
      let src = `/sounds/${soundFile}`;
      if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
        try {
          const mediaList = await invoke<
            Array<{ fileName: string; filePath: string }>
          >("global_list_custom_media");
          const custom = mediaList.find((m) => m.fileName === soundFile);
          if (custom) {
            src = convertFileSrc(custom.filePath);
          }
        } catch (e) {
          console.warn(
            "[FloatingAlarmWidget] Erro ao verificar mídia customizada:",
            e,
          );
        }
      }

      if (isCancelled) return;

      const audio = new Audio(src);
      audio.loop = true;
      audioRef.current = audio;

      audio.play().catch(() => {
        if (!isCancelled && audioRef.current === audio) {
          const fallback = new Audio("/sounds/alarm_1.mp3");
          fallback.loop = true;
          audioRef.current = fallback;
          fallback.play().catch(console.error);
        }
      });
    };

    startAudio();

    return () => {
      isCancelled = true;
      stopWidgetAudio();
    };
  }, [alarm, stopWidgetAudio]);

  const IconComp = getSystemIcon(alarm?.icon);

  return (
    <div
      style={{ borderColor: `${hexColor}60` }}
      className="w-screen h-screen bg-card text-foreground font-sans select-none relative overflow-hidden border-2 rounded-lg p-3 flex flex-col justify-between shadow-none"
    >
      {/* Header: Ícone e Título (Com Drag Region em toda a área de cabeçalho) */}
      <div
        className="flex items-center justify-between gap-2 min-w-0 cursor-grab active:cursor-grabbing"
        data-tauri-drag-region
      >
        <div
          className="flex items-center gap-2.5 min-w-0 flex-1"
          data-tauri-drag-region
        >
          <div
            data-tauri-drag-region
            style={{
              backgroundColor: `${hexColor}20`,
              borderColor: `${hexColor}50`,
              color: hexColor,
            }}
            className="p-2 rounded-xl border shrink-0 animate-pulse"
          >
            <IconComp className="w-4 h-4 pointer-events-none" />
          </div>

          <div className="min-w-0 flex-1" data-tauri-drag-region>
            <h2
              className="text-xs font-bold text-foreground truncate leading-tight"
              data-tauri-drag-region
            >
              {alarm?.title || "Alarme Aegis"}
            </h2>
            <div
              className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono font-medium mt-0.5"
              data-tauri-drag-region
            >
              <Clock className="w-3 h-3 text-muted-foreground/70 shrink-0 pointer-events-none" />
              <span data-tauri-drag-region>{displayTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Botão Único Parar Alarme com Cor do Alarme */}
      <div className="pt-2 border-t border-border/40 flex justify-end">
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeWidget(true);
          }}
          style={{ backgroundColor: hexColor }}
          className="w-full py-1.5 px-3 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer shadow-none relative z-50"
        >
          <BellOff className="w-3.5 h-3.5" />
          Parar alarme
        </button>
      </div>
    </div>
  );
}
