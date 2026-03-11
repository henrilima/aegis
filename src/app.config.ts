/** * Configurações estáticas do projeto Aegis. * Altere este arquivo para atualizar versão, nome e metadados globais. */
export const APP_CONFIG = {
    name: "Aegis",
    version: "1.0.0",
    codename: "evergreen",
    stage: "stable",
    get versionLabel() {
      return `${this.stage}-${this.version} (${this.codename})`;
    },
    author: "José Henrique",
    year: 2026,
    support: {
      discord: "henrilima",
      email: "suporte@aegis.app",
      github: "https://github.com/henrilima/aegis",
    },
  } as const;
