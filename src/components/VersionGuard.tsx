"use client";

import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { useCallback, useEffect, useState } from "react";
import { WhatsNewModal } from "./WhatsNewModal";

export function VersionGuard() {
  const [showModal, setShowModal] = useState(false);
  const [version, setVersion] = useState("");
  const [highlights, setHighlights] = useState<
    { title: string; description: string }[]
  >([]);

  // Função centralizada para carregar e processar o changelog
  const prepareChangelog = useCallback(async () => {
    console.log("[Aegis] Iniciando carregamento do changelog...");
    try {
      const currentVersion = await invoke<string>("get_app_version");
      const content = await invoke<string>("read_changelog");

      const parsed: { updates: string[]; fixes: string[] } = {
        updates: [],
        fixes: [],
      };

      let currentSection = "";
      const lines = content.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        if (trimmed === "[updates]") {
          currentSection = "updates";
          continue;
        }
        if (trimmed === "[fixes]" || trimmed === "[bugs]") {
          currentSection = "fixes";
          continue;
        }

        const itemMatch = trimmed.match(/\[\d+\]:\["(.*?)"\]/);
        if (itemMatch && currentSection) {
          if (currentSection === "updates") parsed.updates.push(itemMatch[1]);
          if (currentSection === "fixes") parsed.fixes.push(itemMatch[1]);
        }
      }

      const combinedHighlights = [
        ...parsed.updates.map((u) => ({ title: "Novidade", description: u })),
        ...parsed.fixes.map((f) => ({ title: "Correção", description: f })),
      ];

      setHighlights(combinedHighlights);
      setVersion(currentVersion);
      return currentVersion;
    } catch (err) {
      console.error(
        "[Aegis] Erro crítico ao processar o changelog para o modal de novidades:",
        err,
      );
      return null;
    }
  }, []);

  useEffect(() => {
    console.log("[Aegis] VersionGuard montado e pronto.");

    // Verificação automática ao iniciar (apenas se a versão mudou)
    const checkVersion = async () => {
      await new Promise((r) => setTimeout(r, 2000));
      const currentVersion = await invoke<string>("get_app_version");
      const store = await load("aegis-app-metadata.json", {
        defaults: {},
        autoSave: true,
      });
      const lastSeen = await store.get<string>("last_seen_changelog_version");

      if (lastSeen !== currentVersion) {
        const loadedVersion = await prepareChangelog();
        if (loadedVersion) setShowModal(true);
      }
    };

    // Listener para abertura manual via atalho (Ctrl + Shift + D)
    const handleManualOpen = () => {
      console.log("[Aegis] Recebido comando manual para abrir novidades.");
      prepareChangelog().then(() => {
        setShowModal(true);
      });
    };

    checkVersion();
    window.addEventListener("open-whats-new", handleManualOpen);

    return () => window.removeEventListener("open-whats-new", handleManualOpen);
  }, [prepareChangelog]);

  const handleClose = async () => {
    setShowModal(false);
    try {
      const store = await load("aegis-app-metadata.json", {
        defaults: {},
        autoSave: true,
      });
      await store.set("last_seen_changelog_version", version);
    } catch (err) {
      console.error("Erro ao registrar versão visualizada no store:", err);
    }
  };

  return (
    <WhatsNewModal
      isOpen={showModal}
      onClose={handleClose}
      version={version}
      highlights={highlights}
    />
  );
}
