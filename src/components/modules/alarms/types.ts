import { SELECTABLE_COLORS } from "@/colors.config";

export type AlarmTriggerMode = "widget" | "system" | "in_app";

export interface AppAlarm {
  id?: number;
  userId: string;
  title: string;
  alarmType: string;
  time: string;
  intervalMinutes: number | null;
  lastTriggered: string | null;
  soundFile: string;
  icon: string;
  color: string | null;
  enabled: boolean;
  triggerMode?: string;
}

export const ALARM_SOUND_OPTIONS = [
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

export const ALARM_COLOR_OPTIONS = SELECTABLE_COLORS;
export const ALARM_COLOR_KEYS = SELECTABLE_COLORS.map((c) => c.key);
