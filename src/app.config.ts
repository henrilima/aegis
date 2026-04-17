/** * Configurações estáticas do projeto Aegis. */
export const APP_CONFIG = {
  name: "Aegis",
  version: "2.0.0",
  codename: "medusa",
  stage: "stable",
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
      | "sky",
    chromatic: "default" as
      | "default"
      | "midnight"
      | "deep-blue"
      | "dracula"
      | "light",
  },
} as const;
