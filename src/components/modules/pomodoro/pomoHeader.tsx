"use client";

import { ExternalLink, HelpCircle, Timer } from "lucide-react";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { getModuleColor } from "@/modules.config";

interface PomoHeaderProps {
  cyclesCompleted: number;
  isWork: boolean;
  onTitleClick?: () => void;
  onDetach?: () => void;
}

export function PomoHeader({
  cyclesCompleted,
  isWork,
  onTitleClick,
  onDetach,
}: PomoHeaderProps) {
  const subtitle = isWork
    ? `${cyclesCompleted} ciclo${cyclesCompleted !== 1 ? "s" : ""} concluído${cyclesCompleted !== 1 ? "s" : ""} - fase de foco ativa`
    : `${cyclesCompleted} ciclo${cyclesCompleted !== 1 ? "s" : ""} concluído${cyclesCompleted !== 1 ? "s" : ""} - pausa para descanso`;

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
      color={getModuleColor("pomodoro")}
      title="Foco & Produtividade"
      subtitle={subtitle}
      icon={Timer}
      actions={headerActions}
      onTitleClick={onTitleClick}
      titleHoverIcon={HelpCircle}
      titleTooltip="Visualizar Guia do Pomodoro"
    />
  );
}
