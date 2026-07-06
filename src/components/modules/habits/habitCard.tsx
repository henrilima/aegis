"use client";

import {
  AlertTriangle,
  Edit2,
  Flame,
  RotateCcw,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react";
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
}

/**
 * Card individual de Hábito: Exibe status e ações focados em Controle de Vício
 */
export function HabitCard({
  habit,
  onRefresh,
  onEdit,
  onOpenResetDialog,
  onOpenHardResetDialog,
  onDelete,
}: HabitCardProps) {
  const {
    name,
    diaAtual,
    recorde,
    currentCharges,
    maxCharges,
    totalContagem,
    isActionPending,
    actions,
  } = useHabitLogic(habit, onRefresh);

  const color = getModuleColor("habits");
  const _theme = getColorTheme(color);

  const accentColor = "text-red-600 dark:text-red-400";
  const accentBg = "bg-red-500/10 border-red-500/20";

  const hasCharges = maxCharges > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:border-border hover:bg-accent/50/20 transition-all group relative shadow-none">
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
            <p className={`text-xs font-medium ${accentColor} opacity-70`}>
              Controle de Vício
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

      {/* Seção de Ações e Detalhes do Vício */}
      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] text-neutral-600 font-medium">
            Deslizes:{" "}
            <span className="text-muted-foreground">{totalContagem}</span>
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => habit.id && onOpenResetDialog(habit.id)}
            disabled={isActionPending}
            className="w-full py-3 rounded-xl border border-red-500/30 text-red-600 dark:text-red-500 text-sm font-medium hover:bg-red-500/10 bg-red-500/5 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertTriangle className="w-3.5 h-3.5" />{" "}
            {isActionPending ? "Processando..." : "Registrar falha"}
          </button>

          {currentCharges > 0 && (
            <button
              type="button"
              onClick={() => habit.id && actions.handleUseCharge()}
              disabled={isActionPending}
              className="w-full py-2 rounded-xl text-orange-600 dark:text-orange-500 text-xs font-medium hover:bg-orange-500/10 bg-orange-500/5 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-3 h-3" />{" "}
              {isActionPending ? "Processando..." : "Usar carga protetora"}
            </button>
          )}
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
  onClick: () => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ToolTip content={title}>
      <button
        type="button"
        onClick={onClick}
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
