"use client";

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useState } from "react";

/** Retorna o src de uma imagem base64 a partir dos dados e do tipo MIME detectado. */
function toDataUrl(base64: string): string {
  // Detecta o tipo pelo cabeçalho base64
  const header = base64.substring(0, 10);
  let mime = "image/png";
  if (header.startsWith("/9j/")) mime = "image/jpeg";
  else if (header.startsWith("UklGR")) mime = "image/webp";
  else if (header.startsWith("R0lGO")) mime = "image/gif";
  return `data:${mime};base64,${base64}`;
}

export function useAvatar(userId: string | undefined) {
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAvatar = useCallback(async () => {
    if (!userId) return;
    const data = await invoke<string | null>("global_get_avatar", { userId });
    setAvatarSrc(data ? toDataUrl(data) : null);
  }, [userId]);

  useEffect(() => {
    fetchAvatar();

    const handleUpdate = () => fetchAvatar();
    window.addEventListener("avatar-updated", handleUpdate);
    return () => window.removeEventListener("avatar-updated", handleUpdate);
  }, [fetchAvatar]);

  /** Abre o seletor de arquivos e salva a imagem como base64. */
  const pickAvatar = useCallback(async () => {
    if (!userId) return;
    const path = await open({
      multiple: false,
      filters: [
        { name: "Imagem", extensions: ["png", "jpg", "jpeg", "webp", "gif"] },
      ],
    });
    if (!path || typeof path !== "string") return;

    setLoading(true);
    try {
      const bytes = await readFile(path);
      // Converte Uint8Array para base64 de forma mais eficiente
      const binary = Array.from(bytes, (byte) =>
        String.fromCharCode(byte),
      ).join("");
      const base64 = btoa(binary);

      await invoke("global_save_avatar", { userId, base64Data: base64 });
      setAvatarSrc(toDataUrl(base64));
      window.dispatchEvent(new Event("avatar-updated"));
      console.log("Avatar atualizado com sucesso");
    } catch (error) {
      console.error("Erro ao salvar avatar:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /** Remove o avatar do usuário. */
  const removeAvatar = useCallback(async () => {
    if (!userId) return;
    await invoke("global_delete_avatar", { userId });
    setAvatarSrc(null);
    window.dispatchEvent(new Event("avatar-updated"));
  }, [userId]);

  return { avatarSrc, loading, pickAvatar, removeAvatar, refetch: fetchAvatar };
}
