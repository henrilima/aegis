"use client";

import { ExternalLink, HelpCircle, Timer } from "lucide-react";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { getModuleColor } from "@/modules.config";

interface PomoHeaderProps {
  cyclesCompleted: number;
  isWork: boolean;
  activeTab: "pomodoro" | "stopwatch";
  onTabChange: (tab: "pomodoro" | "stopwatch") => void;
  onTitleClick?: () => void;
  onDetach?: () => void;
}

const POMO_TABS = [
  { id: "pomodoro", label: "Pomodoro" },
  { id: "stopwatch", label: "Cronômetro" },
];

export function PomoHeader({
  cyclesCompleted,
  isWork,
  activeTab,
  onTabChange,
  onTitleClick,
  onDetach,
}: PomoHeaderProps) {
  const subtitle =
    activeTab === "stopwatch"
      ? "Contagem progressiva de tempo com registro de voltas"
      : isWork
        ? `${cyclesCompleted} ciclo${cyclesCompleted !== 1 ? "s" : ""} concluído${cyclesCompleted !== 1 ? "s" : ""} — fase de foco ativa`
        : `${cyclesCompleted} ciclo${cyclesCompleted !== 1 ? "s" : ""} concluído${cyclesCompleted !== 1 ? "s" : ""} — pausa para descanso`;

  const headerActions = [];

  if (onDetach) {
    headerActions.push({
      id: "detach",
      icon: ExternalLink,
      tooltip: "Destacar Widget",
      onClick: onDetach,
    });
  }

  return (
    <ModuleHeader
      moduleId="pomodoro"
      color={getModuleColor("pomodoro")}
      title="Foco & Produtividade"
      subtitle={subtitle}
      icon={Timer}
      tabs={POMO_TABS}
      activeTab={activeTab}
      onTabChange={(id) => onTabChange(id as "pomodoro" | "stopwatch")}
      actions={headerActions}
      onTitleClick={onTitleClick}
      titleHoverIcon={HelpCircle}
      titleTooltip="Visualizar Guia do Pomodoro"
    />
  );
}
