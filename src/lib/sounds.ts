import { convertFileSrc, invoke } from "@tauri-apps/api/core";

export const DEFAULT_NOTIFICATION_SOUND = "Plin.mp3";

export interface AudioOption {
  value: string;
  label: string;
  isCustom?: boolean;
}

export const BUILTIN_AUDIO_OPTIONS: AudioOption[] = [
  { value: "alarm_1.mp3", label: "Alarme 1" },
  { value: "alarm_2.mp3", label: "Alarme 2" },
  { value: "alarm_3.mp3", label: "Alarme 3" },
  { value: "alarm_4.mp3", label: "Alarme 4" },
  { value: "Plin.mp3", label: "Plin" },
  { value: "Sinos.mp3", label: "Sinos" },
  { value: "Tlin.mp3", label: "Tlin" },
  { value: "Tudum.mp3", label: "Tudum" },
  { value: "Bolhas.mp3", label: "Bolhas" },
  { value: "Vibrar.mp3", label: "Vibrar" },
];

let activeAudioInstance: HTMLAudioElement | null = null;
let cachedCustomMediaMap: Map<string, string> = new Map();

export async function fetchCustomMediaMap(): Promise<Map<string, string>> {
  if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) {
    return cachedCustomMediaMap;
  }
  try {
    const list = await invoke<Array<{ fileName: string; displayName: string }>>(
      "global_list_custom_media",
    );
    const map = new Map<string, string>();
    for (const item of list) {
      map.set(item.fileName, item.displayName);
    }
    cachedCustomMediaMap = map;
    return map;
  } catch (e) {
    console.warn("[sounds] Erro ao carregar mídias customizadas:", e);
    return cachedCustomMediaMap;
  }
}

export function soundLabel(
  soundFile: string | null | undefined,
  customMap?: Map<string, string> | AudioOption[],
): string {
  if (!soundFile) return "";

  if (customMap instanceof Map) {
    const customVal = customMap.get(soundFile);
    if (customVal !== undefined) return customVal;
  } else if (Array.isArray(customMap)) {
    const opt = customMap.find((o) => o.value === soundFile);
    if (opt) return opt.label;
  }

  const cachedVal = cachedCustomMediaMap.get(soundFile);
  if (cachedVal !== undefined) {
    return cachedVal;
  }

  const clean = soundFile.replace(/\.[^/.]+$/, "");
  if (clean === "alarm_1") return "Alarme 1";
  if (clean === "alarm_2") return "Alarme 2";
  if (clean === "alarm_3") return "Alarme 3";
  if (clean === "alarm_4") return "Alarme 4";
  return clean;
}

export async function getAudioOptions(): Promise<AudioOption[]> {
  if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) {
    return BUILTIN_AUDIO_OPTIONS;
  }

  try {
    const [customMediaList, rawSoundsList] = await Promise.all([
      invoke<Array<{ fileName: string; displayName: string }>>(
        "global_list_custom_media",
      ).catch(() => []),
      invoke<string[]>("global_list_notification_sounds").catch(() => []),
    ]);

    const optionsMap = new Map<string, AudioOption>();

    // Atualiza cache de nomes de mídias customizadas
    const map = new Map<string, string>();
    for (const c of customMediaList) {
      map.set(c.fileName, c.displayName);
      optionsMap.set(c.fileName, {
        value: c.fileName,
        label: c.displayName,
        isCustom: true,
      });
    }
    cachedCustomMediaMap = map;

    // Adiciona opções padrão com rótulos amigáveis
    for (const opt of BUILTIN_AUDIO_OPTIONS) {
      if (!optionsMap.has(opt.value)) {
        optionsMap.set(opt.value, opt);
      }
    }

    // Adiciona arquivos soltos no diretório que ainda não foram mapeados
    for (const filename of rawSoundsList) {
      if (!optionsMap.has(filename)) {
        const cleanName = filename
          .replace(/\.[^/.]+$/, "")
          .replace(/^alarm_/, "Alarme ");
        optionsMap.set(filename, {
          value: filename,
          label: cleanName,
        });
      }
    }

    return Array.from(optionsMap.values());
  } catch (err) {
    console.error("[sounds] Erro ao obter opções de áudio:", err);
    return BUILTIN_AUDIO_OPTIONS;
  }
}

export async function listNotificationSounds(): Promise<string[]> {
  const options = await getAudioOptions();
  return options.map((o) => o.value);
}

export function resolveNotificationSound(
  soundFile: string | null | undefined,
  availableOptions: AudioOption[] | string[],
): string {
  if (!soundFile || soundFile.trim().length === 0) {
    return DEFAULT_NOTIFICATION_SOUND;
  }

  const values = availableOptions.map((o) =>
    typeof o === "string" ? o : o.value,
  );

  // Se a lista de opções ainda não foi carregada (vazia), mantém o som escolhido sem sobrescrever!
  if (values.length === 0) {
    return soundFile;
  }

  // Se o som escolhido está presente nas opções disponíveis, mantém ele!
  if (values.includes(soundFile)) {
    return soundFile;
  }

  // APENAS se as opções foram carregadas e o som NÃO existe mais (ex: foi deletado do disco), volta ao padrão
  if (values.includes(DEFAULT_NOTIFICATION_SOUND)) {
    return DEFAULT_NOTIFICATION_SOUND;
  }
  return values[0] ?? DEFAULT_NOTIFICATION_SOUND;
}

export async function getConfiguredNotificationSound() {
  const [config, options] = await Promise.all([
    invoke<{ notificationSound: string }>("global_get_app_config"),
    getAudioOptions(),
  ]);

  return resolveNotificationSound(config.notificationSound, options);
}

export function stopNotificationSound() {
  if (activeAudioInstance) {
    try {
      activeAudioInstance.pause();
      activeAudioInstance.currentTime = 0;
    } catch (e) {
      console.warn("Erro ao interromper áudio ativo:", e);
    }
    activeAudioInstance = null;
  }
}

export async function playNotificationSound(
  soundFile: string | null | undefined,
) {
  stopNotificationSound();

  const options = await getAudioOptions();
  const resolvedSound = resolveNotificationSound(soundFile, options);

  let src = `/sounds/${resolvedSound}`;
  if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
    try {
      const mediaList = await invoke<
        Array<{ fileName: string; filePath: string }>
      >("global_list_custom_media");
      const customMedia = mediaList.find((m) => m.fileName === resolvedSound);
      if (customMedia) {
        src = convertFileSrc(customMedia.filePath);
      }
    } catch (e) {
      console.warn("Erro ao obter mapa de mídia customizada:", e);
    }
  }

  const audio = new Audio(src);
  activeAudioInstance = audio;

  audio.onended = () => {
    if (activeAudioInstance === audio) {
      activeAudioInstance = null;
    }
  };

  try {
    await audio.play();
  } catch {
    try {
      const fallbackAudio = new Audio(src);
      activeAudioInstance = fallbackAudio;
      await fallbackAudio.play();
    } catch (err) {
      console.warn("Falha ao reproduzir áudio de notificação:", err);
    }
  }
}
