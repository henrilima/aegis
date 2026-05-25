import { invoke } from "@tauri-apps/api/core";

export const DEFAULT_NOTIFICATION_SOUND = "Plin.mp3";

export function soundLabel(soundFile: string) {
  return soundFile.replace(/\.[^/.]+$/, "");
}

export async function listNotificationSounds() {
  const sounds = await invoke<string[]>("global_list_notification_sounds");
  return sounds.length > 0 ? sounds : [DEFAULT_NOTIFICATION_SOUND];
}

export function resolveNotificationSound(
  soundFile: string | null | undefined,
  availableSounds: string[],
) {
  if (soundFile && availableSounds.includes(soundFile)) return soundFile;
  if (availableSounds.includes(DEFAULT_NOTIFICATION_SOUND)) {
    return DEFAULT_NOTIFICATION_SOUND;
  }
  return availableSounds[0] ?? DEFAULT_NOTIFICATION_SOUND;
}

export async function getConfiguredNotificationSound() {
  const [config, sounds] = await Promise.all([
    invoke<{ notificationSound: string }>("global_get_app_config"),
    listNotificationSounds(),
  ]);

  return resolveNotificationSound(config.notificationSound, sounds);
}

export async function playNotificationSound(
  soundFile: string | null | undefined,
) {
  const sounds = await listNotificationSounds();
  const resolvedSound = resolveNotificationSound(soundFile, sounds);
  const audio = new Audio(`/sounds/${resolvedSound}`);

  try {
    await audio.play();
  } catch {
    await new Audio(`/sounds/${resolvedSound}`).play();
  }
}
