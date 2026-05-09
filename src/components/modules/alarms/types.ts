import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlarmClock,
  Bell,
  Cloud,
  Coffee,
  Droplet,
  Flame,
  Ghost,
  Heart,
  Moon,
  Music,
  Shield,
  Star,
  Sun,
  Utensils,
  Zap,
} from "lucide-react";

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
}

export const AVAILABLE_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: "Bell", icon: Bell },
  { name: "AlarmClock", icon: AlarmClock },
  { name: "Droplet", icon: Droplet },
  { name: "Activity", icon: Activity },
  { name: "Moon", icon: Moon },
  { name: "Coffee", icon: Coffee },
  { name: "Zap", icon: Zap },
  { name: "Heart", icon: Heart },
  { name: "Flame", icon: Flame },
  { name: "Star", icon: Star },
  { name: "Sun", icon: Sun },
  { name: "Cloud", icon: Cloud },
  { name: "Music", icon: Music },
  { name: "Utensils", icon: Utensils },
  { name: "Shield", icon: Shield },
  { name: "Ghost", icon: Ghost },
];

import { SELECTABLE_COLORS } from "@/colors.config";

export const ALARM_COLOR_OPTIONS = SELECTABLE_COLORS;
export const ALARM_COLOR_KEYS = SELECTABLE_COLORS.map((c) => c.key);
