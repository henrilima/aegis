"use client";

import { HelpCircle, Timer } from "lucide-react";
import { ModuleHeader } from "@/components/global/ModuleHeader";
import { getModuleColor } from "@/modules.config";

interface PomoHeaderProps {
  cyclesCompleted: number;
  isWork: boolean;
  onInfoOpen?: () => void;
}

export function PomoHeader({
  cyclesCompleted,
  isWork,
  onInfoOpen,
}: PomoHeaderProps) {
  const subtitle = isWork
    ? `${cyclesCompleted} ciclo${cyclesCompleted !== 1 ? "s" : ""} concluído${cyclesCompleted !== 1 ? "s" : ""} - fase de foco ativa`
    : `${cyclesCompleted} ciclo${cyclesCompleted !== 1 ? "s" : ""} concluído${cyclesCompleted !== 1 ? "s" : ""} - pausa para descanso`;

  return (
    <ModuleHeader
      color={getModuleColor("pomodoro")}
      title="Foco & Produtividade"
      subtitle={subtitle}
      icon={Timer}
      actions={
        onInfoOpen
          ? [
              {
                id: "info",
                icon: HelpCircle,
                tooltip: "Guia do Módulo",
                onClick: onInfoOpen,
              },
            ]
          : []
      }
    />
  );
}
