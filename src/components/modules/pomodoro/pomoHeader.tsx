"use client";

import { ExternalLink, HelpCircle, Timer } from "lucide-react";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { getModuleColor } from "@/modules.config";

interface PomoHeaderProps {
  cyclesCompleted: number;
  isWork: boolean;
  onInfoOpen?: () => void;
  onDetach?: () => void;
}

export function PomoHeader({
  cyclesCompleted,
  isWork,
  onInfoOpen,
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

  if (onInfoOpen) {
    headerActions.push({
      id: "info",
      icon: HelpCircle,
      tooltip: "Guia do Módulo",
      onClick: onInfoOpen,
    });
  }

  return (
    <ModuleHeader
      color={getModuleColor("pomodoro")}
      title="Foco & Produtividade"
      subtitle={subtitle}
      icon={Timer}
      actions={headerActions}
    />
  );
}
