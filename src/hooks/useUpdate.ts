"use client";

import { check } from "@tauri-apps/plugin-updater";
import { useEffect, useState } from "react";

export function useUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const update = await check();
        setUpdateAvailable(!!update);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes("None of the fallback platforms")) {
          console.warn(
            "[useUpdate] Nenhuma atualização configurada para esta plataforma neste release (apenas Windows suportado no momento).",
          );
        } else {
          console.error("[useUpdate] Erro ao verificar atualizações:", err);
        }
      }
    };

    checkUpdate();

    // Verifica a cada 2 horas
    const interval = setInterval(checkUpdate, 2 * 60 * 60 * 1000);

    // Também ouve um evento customizado se quisermos forçar o check
    const handleCheck = () => checkUpdate();
    window.addEventListener("check-for-updates", handleCheck);

    return () => {
      clearInterval(interval);
      window.removeEventListener("check-for-updates", handleCheck);
    };
  }, []);

  return { updateAvailable };
}
