/**
 * Utilitários centralizados para gerenciamento de versão do app Aegis,
 * identificação de estágios (Stable, Hotfix, RC, Beta, Alpha), badges visuais,
 * comparação SemVer e suporte a Downgrade.
 */

export type VersionStage =
  | "stable"
  | "hotfix"
  | "rc"
  | "pre-release"
  | "beta"
  | "alpha";

export interface StageDetails {
  stage: VersionStage;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  badgeDot: string;
}

export const STAGE_DETAILS: Record<VersionStage, StageDetails> = {
  stable: {
    stage: "stable",
    label: "Estável",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    badgeBorder: "border-emerald-500/20",
    badgeDot: "bg-emerald-500",
  },
  hotfix: {
    stage: "hotfix",
    label: "Hotfix",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-600 dark:text-rose-400",
    badgeBorder: "border-rose-500/20",
    badgeDot: "bg-rose-500",
  },
  rc: {
    stage: "rc",
    label: "Release Candidate",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-600 dark:text-amber-400",
    badgeBorder: "border-amber-500/20",
    badgeDot: "bg-amber-500",
  },
  "pre-release": {
    stage: "pre-release",
    label: "Pré-release",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-600 dark:text-orange-400",
    badgeBorder: "border-orange-500/20",
    badgeDot: "bg-orange-500",
  },
  beta: {
    stage: "beta",
    label: "Beta",
    badgeBg: "bg-purple-500/10",
    badgeText: "text-purple-600 dark:text-purple-400",
    badgeBorder: "border-purple-500/20",
    badgeDot: "bg-purple-500",
  },
  alpha: {
    stage: "alpha",
    label: "Alpha",
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-600 dark:text-cyan-400",
    badgeBorder: "border-cyan-500/20",
    badgeDot: "bg-cyan-500",
  },
};

/**
 * Analisa a tag da release (ex: "v4.1.0-beta.1", "4.0.12-hotfix", "v3.1.0")
 * com trava preventiva para versões antigas / legadas que não possuem estágio explícito.
 */
export function parseVersionStage(
  tagOrVersion?: string | null,
  isGithubPrerelease?: boolean,
): StageDetails {
  if (!tagOrVersion) {
    return STAGE_DETAILS.stable;
  }

  const normalized = String(tagOrVersion)
    .toLowerCase()
    .replace(/^v/, "")
    .trim();

  if (normalized.includes("hotfix")) return STAGE_DETAILS.hotfix;
  if (normalized.includes("alpha")) return STAGE_DETAILS.alpha;
  if (normalized.includes("beta")) return STAGE_DETAILS.beta;
  if (normalized.includes("rc")) return STAGE_DETAILS.rc;
  if (normalized.includes("pre-release") || normalized.includes("prerelease")) {
    return STAGE_DETAILS["pre-release"];
  }

  // Preventiva / Fallback para versões antigas no GitHub
  if (isGithubPrerelease) {
    return STAGE_DETAILS["pre-release"];
  }

  return STAGE_DETAILS.stable;
}

/**
 * Converte string SemVer em tupla numérica para comparação exata
 */
export function parseSemver(verStr: string) {
  const clean = verStr.replace(/^v/, "").trim();
  const [mainPart, prePart] = clean.split("-");
  const numbers = mainPart.split(".").map((n) => Number.parseInt(n, 10) || 0);
  while (numbers.length < 3) numbers.push(0);

  let preNum = 0;
  let isPre = false;

  if (prePart) {
    isPre = true;
    const digits = prePart.replace(/[^0-9]/g, "");
    preNum = digits ? Number.parseInt(digits, 10) : -1;
  }

  return { numbers, preNum, isPre };
}

export type VersionCheckResultAction =
  | "upgrade-available"
  | "downgrade-available"
  | "up-to-date"
  | "beta-active";

export interface VersionCheckEvaluation {
  action: VersionCheckResultAction;
  currentVersion: string;
  targetVersion: string;
  targetStage: StageDetails;
  isDowngrade: boolean;
  isUpgrade: boolean;
  title: string;
  description: string;
  actionButtonText: string;
}

/**
 * Avalia a versão atual do app contra a versão do release do GitHub/Updater,
 * identificando se é Upgrade, Downgrade, ou se já está atualizado.
 */
export function evaluateVersionCheck(
  currentVerStr: string,
  targetVerStr: string,
  targetStageDetails: StageDetails,
  currentStageName: VersionStage = "stable",
): VersionCheckEvaluation {
  const currentSem = parseSemver(currentVerStr);
  const targetSem = parseSemver(targetVerStr);

  let semverDiff = 0;
  for (let i = 0; i < 3; i++) {
    const d = (targetSem.numbers[i] || 0) - (currentSem.numbers[i] || 0);
    if (d !== 0) {
      semverDiff = d;
      break;
    }
  }

  const isCurrentPre = currentSem.isPre || currentStageName !== "stable";
  const isTargetPre = targetSem.isPre || targetStageDetails.stage !== "stable";

  let action: VersionCheckResultAction = "up-to-date";
  let isDowngrade = false;
  let isUpgrade = false;

  if (semverDiff > 0) {
    action = "upgrade-available";
    isUpgrade = true;
  } else if (semverDiff < 0) {
    if (isCurrentPre || currentStageName !== "stable") {
      action = "downgrade-available";
      isDowngrade = true;
    } else {
      action = "up-to-date";
    }
  } else {
    // Semver principal igual (ex: 4.1.0 vs 4.1.0-beta)
    if (isCurrentPre && !isTargetPre) {
      // Usuário está em Beta/Alpha 4.1.0 e saiu a 4.1.0 oficial estável
      action = "upgrade-available";
      isUpgrade = true;
    } else if (!isCurrentPre && isTargetPre) {
      action = "beta-active";
    } else if (currentSem.preNum < targetSem.preNum) {
      action = "upgrade-available";
      isUpgrade = true;
    } else if (currentSem.preNum > targetSem.preNum) {
      action = "downgrade-available";
      isDowngrade = true;
    } else {
      action = "up-to-date";
    }
  }

  let title = "Sistema atualizado";
  let description = "Você está utilizando a versão mais recente do Aegis.";
  let actionButtonText = "Atualizar agora";

  if (isUpgrade) {
    title = `Nova versão (${targetStageDetails.label})`;
    description = `Uma nova versão (${targetStageDetails.label.toLowerCase()}) está disponível.`;
    actionButtonText = `Atualizar para ${targetStageDetails.label}`;
  } else if (isDowngrade) {
    title = "Downgrade disponível";
    description = `Você pode retornar da versão de testes para a versão ${targetStageDetails.label.toLowerCase()} (${targetVerStr}).`;
    actionButtonText = `Fazer downgrade (${targetStageDetails.label})`;
  } else if (action === "beta-active") {
    title = "Versão experimental ativa";
    description = "Você está em um canal de compilação de testes.";
    actionButtonText = "Verificar releases";
  }

  return {
    action,
    currentVersion: currentVerStr,
    targetVersion: targetVerStr,
    targetStage: targetStageDetails,
    isDowngrade,
    isUpgrade,
    title,
    description,
    actionButtonText,
  };
}
