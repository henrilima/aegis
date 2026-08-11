import type { VersionStage } from "@/lib/versionHelper";
import versionConfig from "../../version.config.json";

/** Configurações estáticas do projeto Aegis. */
export const APP_CONFIG = {
  name: "Aegis",
  version: versionConfig.version,
  codename: versionConfig.codename,
  stage: (versionConfig.stage || "stable") as VersionStage,
  isPreRelease: versionConfig.isPreRelease ?? false,
  allowDowngrade: versionConfig.allowDowngrade ?? true,
  channel: versionConfig.channel || "stable",
  get versionLabel() {
    return `${this.stage}-${this.version} (${this.codename})`;
  },
  author: "José Henrique da Silva Lima",
  year: 2026,
  support: {
    discord: "atlassoatlas",
    email: "henrilima.contactme@gmail.com",
    github: "https://github.com/henrilima/aegis",
    discordserver: "https://discord.gg/pCQTuTGJUx",
  },
  theme: {
    primary: "blue" as
      | "blue"
      | "amber"
      | "teal"
      | "violet"
      | "green"
      | "red"
      | "orange"
      | "carbon"
      | "coffee"
      | "sky",
    chromatic: "default" as
      | "default"
      | "midnight"
      | "nordic"
      | "carbon"
      | "indigo"
      | "coffee"
      | "purple"
      | "graphite"
      | "dracula"
      | "light",
  },
} as const;
