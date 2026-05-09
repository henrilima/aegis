/**
 * useLog - Wrapper centralizado para logging frontend.
 *
 * Em produção, roteia os erros para o `tauri-plugin-log` (arquivo em disco).
 * Em desenvolvimento, usa o console do browser normalmente.
 *
 * Uso:
 *   import { useLog } from "@/hooks/useLog";
 *   const log = useLog("MeuComponente");
 *   log.error("Falha ao carregar dados", err);
 */

import {
  debug as tauriDebug,
  error as tauriError,
  info as tauriInfo,
  warn as tauriWarn,
} from "@tauri-apps/plugin-log";
import { useMemo } from "react";

const isDev = process.env.NODE_ENV === "development";

function formatMsg(tag: string, msg: string): string {
  return `[${tag}] ${msg}`;
}

export function useLog(tag: string) {
  return useMemo(
    () => ({
      error: (msg: string, err?: unknown) => {
        const full = formatMsg(tag, msg);
        const detail = err instanceof Error ? err.message : String(err ?? "");
        if (isDev) {
          console.error(full, err);
        }
        tauriError(`${full}${detail ? ` | ${detail}` : ""}`).catch(() => {});
      },

      warn: (msg: string) => {
        const full = formatMsg(tag, msg);
        if (isDev) {
          console.warn(full);
        }
        tauriWarn(full).catch(() => {});
      },

      info: (msg: string) => {
        const full = formatMsg(tag, msg);
        if (isDev) {
          console.info(full);
        }
        tauriInfo(full).catch(() => {});
      },

      debug: (msg: string) => {
        const full = formatMsg(tag, msg);
        if (isDev) {
          console.debug(full);
        }
        tauriDebug(full).catch(() => {});
      },
    }),
    [tag],
  );
}

// Versão estática (fora de componentes React)
export const log = {
  error: (tag: string, msg: string, err?: unknown) => {
    const full = formatMsg(tag, msg);
    const detail = err instanceof Error ? err.message : String(err ?? "");
    if (isDev) {
      console.error(full, err);
    } else {
      tauriError(`${full}${detail ? ` | ${detail}` : ""}`).catch(() => {});
    }
  },
  warn: (tag: string, msg: string) => {
    const full = formatMsg(tag, msg);
    if (isDev) console.warn(full);
    else tauriWarn(full).catch(() => {});
  },
  info: (tag: string, msg: string) => {
    const full = formatMsg(tag, msg);
    if (isDev) console.info(full);
    tauriInfo(full).catch(() => {});
  },
};
