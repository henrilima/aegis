"use client";

import {
  ArrowRight,
  Clock,
  Edit2,
  Flame,
  RotateCcw,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { Habit } from "./types";
import { useHabitLogic } from "./useHabitLogic";

interface HabitCardProps {
  habit: Habit;
  onRefresh: () => void;
  onEdit: (habit: Habit) => void;
  onOpenResetDialog: (id: number) => void;
  onOpenHardResetDialog: (id: number) => void;
  onDelete: (id: number) => void;
  onOpenSoberDetail?: (habit: Habit) => void;
}

/**
 * Card individual de Hábito: Exibe status e ações focados em Controle de Vício
 */
export function HabitCard({
  habit,
  onRefresh,
  onEdit,
  onOpenResetDialog: _onOpenResetDialog,
  onOpenHardResetDialog,
  onDelete,
  onOpenSoberDetail,
}: HabitCardProps) {
  const { name, diaAtual, recorde, currentCharges, maxCharges, totalContagem } =
    useHabitLogic(habit, onRefresh);

  const color = getModuleColor("habits");
  const _theme = getColorTheme(color);

  const accentColor = "text-red-600 dark:text-red-400";
  const accentBg = "bg-red-500/10 border-red-500/20";

  const hasCharges = maxCharges > 0;

  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const lastSlipTime = new Date(habit.lastSlip).getTime();
      const nowTime = Date.now();
      const diff = nowTime - lastSlipTime;

      if (diff <= 0) {
        setTimeStr("00d 00h 00m");
        return;
      }

      const min = Math.floor((diff / (1000 * 60)) % 60);
      const hr = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const day = Math.floor(diff / (1000 * 60 * 60 * 24));

      const dStr = String(day).padStart(2, "0");
      const hStr = String(hr).padStart(2, "0");
      const mStr = String(min).padStart(2, "0");

      setTimeStr(`${dStr}d ${hStr}h ${mStr}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [habit.lastSlip]);

  return (
    // biome-ignore lint/a11y/useSemanticElements: O card contém outros botões clicáveis internamente
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenSoberDetail?.(habit)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenSoberDetail?.(habit);
        }
      }}
      className="w-full text-left bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-red-500/20 transition-all group relative cursor-pointer select-none shadow-none"
    >
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 p-2.5 rounded-xl border ${accentBg}`}>
            <Flame className={`w-5 h-5 ${accentColor}`} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="font-bold text-base leading-tight text-foreground">
              {name}
            </h3>
            <p
              className={`text-xs font-medium ${accentColor} opacity-70 flex items-center gap-1.5`}
            >
              <span>Controle de Vício</span>
              {habit.targetTime && (
                <span className="flex items-center gap-0.5 text-muted-foreground font-semibold">
                  • <Clock className="w-3 h-3 ml-0.5 text-red-500" />
                  {habit.targetTime}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Ações Administrativas (Hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconBtn onClick={() => habit.id && onEdit(habit)} title="Editar">
            <Edit2Icon className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn
            onClick={() => habit.id && onOpenHardResetDialog(habit.id)}
            title="Resetar histórico"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </IconBtn>
          <IconBtn
            onClick={() => habit.id && onDelete(habit.id)}
            title="Excluir"
            danger
          >
            <Trash2 className="w-3.5 h-3.5" />
          </IconBtn>
        </div>
      </div>

      {/* Barra de Progresso (se tiver meta) */}
      {habit.goalDays
        ? habit.goalDays > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                <span className="text-muted-foreground">Progresso da Meta</span>
                <span className={accentColor}>
                  {Math.min(100, Math.round((diaAtual / habit.goalDays) * 100))}
                  %
                </span>
              </div>
              <div className="h-1.5 w-full bg-background border border-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min(100, (diaAtual / habit.goalDays) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[9px] text-center text-muted-foreground/60 font-medium">
                {diaAtual} de {habit.goalDays} dias sem recaídas
              </p>
            </div>
          )
        : null}

      {/* Painel do Cronômetro Simplificado */}
      <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3.5 flex flex-col items-center justify-center text-center gap-1 select-none">
        <span className="text-[9px] uppercase font-bold text-red-500/80 tracking-wider">
          Tempo de Abstinência
        </span>
        <span className="text-xl font-bold font-mono text-foreground tabular-nums leading-none">
          {timeStr || "00d 00h 00m"}
        </span>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-3 gap-2">
        <StatBadge
          icon={
            <Flame
              className={`w-4 h-4 mb-1 ${diaAtual > 0 ? accentColor : "text-neutral-700"}`}
            />
          }
          label="Sequência"
          value={`${diaAtual}d`}
          active={diaAtual > 0}
        />
        <StatBadge
          icon={
            <Trophy
              className={`w-4 h-4 mb-1 ${recorde > 0 ? "text-amber-600 dark:text-amber-500" : "text-neutral-700"}`}
            />
          }
          label="Recorde"
          value={`${recorde}d`}
          active={recorde > 0}
        />
        <StatBadge
          icon={
            <Zap
              className={`w-4 h-4 mb-1 ${currentCharges > 0 ? "text-orange-500" : "text-muted-foreground/30"}`}
            />
          }
          label="Cargas"
          value={hasCharges ? `${currentCharges}/${maxCharges}` : "-"}
          active={currentCharges > 0}
        />
      </div>

      {/* Rodapé / Link de Gerenciamento de Sobriedade */}
      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] text-neutral-600 font-medium">
            Deslizes Totais:{" "}
            <span className="text-muted-foreground">{totalContagem}</span>
          </p>
        </div>

        <div className="w-full text-center py-2.5 rounded-xl border border-red-500/20 text-red-500 text-xs font-bold bg-red-500/5 group-hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
          <span>Acessar Diário & Pactos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

/**
 * Badge de estatística individual
 */
function StatBadge({
  icon,
  label,
  value,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 py-3.5 rounded-xl border transition-all ${active ? "bg-background/40 border-border" : "bg-transparent border-transparent opacity-30"}`}
    >
      {icon}
      <span className="text-lg font-bold font-sans leading-none text-foreground">
        {value}
      </span>
      <span className="text-[9px] text-muted-foreground/60 font-semibold leading-none">
        {label}
      </span>
    </div>
  );
}

/**
 * Botão de ícone para ações administrativas do card
 */
function IconBtn({
  onClick,
  title,
  danger,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ToolTip content={title}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
        className={`p-1.5 rounded-lg transition-all cursor-pointer border border-transparent ${
          danger
            ? "text-neutral-700 hover:text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
            : "text-neutral-700 hover:text-foreground hover:bg-accent/50 hover:border-border"
        }`}
      >
        {children}
      </button>
    </ToolTip>
  );
}

/**
 * Icone de Editar inline
 */
function Edit2Icon({ className }: { className?: string }) {
  return <Edit2 className={className} />;
}
