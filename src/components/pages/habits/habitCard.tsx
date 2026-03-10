"use client";

import {
  AlertTriangle,
  Check,
  Clock,
  Edit2,
  Flame,
  RotateCcw,
  Trash2,
  Trophy,
  Zap,
} from "lucide-react";
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
 * Card individual de Hábito: Exibe status, métricas de streak e ações rápidas
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
    isNegative,
    diaAtual,
    recorde,
    canUse,
    timeLeft,
    currentCharges,
    maxCharges,
    chargeTimeLeft,
    totalContagem,
    intervalo,
    actions,
  } = useHabitLogic(habit, onRefresh);

  const accentColor = isNegative ? "text-red-400" : "text-teal-400";
  const accentBg = isNegative
    ? "bg-red-500/10 border-red-500/20"
    : "bg-teal-500/10 border-teal-500/20";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col gap-5 hover:border-neutral-700 transition-all group relative hover:shadow-2xl hover:shadow-black/40 active:scale-[0.99]">
      {/* Cabeçalho do Card */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-4">
          <div
            className={`mt-0.5 p-3 rounded-2xl border ${accentBg} shadow-sm`}
          >
            {isNegative ? (
              <Flame className={`w-6 h-6 ${accentColor}`} />
            ) : (
              <Check className={`w-6 h-6 ${accentColor}`} />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="font-black text-lg leading-tight text-neutral-100">
              {name}
            </h3>
            <p className={`text-[10px] font-black uppercase ${accentColor}`}>
              {isNegative ? "Monitoramento de Vício" : "Hábito Construtivo"}
            </p>
          </div>
        </div>

        {/* Ações Administrativas (Hover) */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconBtn
            onClick={() => habit.id && onEdit(habit)}
            title="Editar Configurações"
          >
            <Edit2 className="w-4 h-4" />
          </IconBtn>
          <IconBtn
            onClick={() => habit.id && onOpenHardResetDialog(habit.id)}
            title="Resetar Histórico"
          >
            <RotateCcw className="w-4 h-4" />
          </IconBtn>
          <IconBtn
            onClick={() => habit.id && onDelete(habit.id)}
            title="Excluir Definitivamente"
            danger
          >
            <Trash2 className="w-4 h-4" />
          </IconBtn>
        </div>
      </div>

      {/* Grid de Estatísticas Principais */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatBadge
          icon={
            <Flame
              className={`w-5 h-5 mb-1 ${diaAtual > 0 ? accentColor : "text-neutral-700"}`}
            />
          }
          label="Sqn."
          value={`${diaAtual}d`}
          active={diaAtual > 0}
        />
        <StatBadge
          icon={
            <Trophy
              className={`w-5 h-5 mb-1 ${recorde > 0 ? "text-amber-500" : "text-neutral-700"}`}
            />
          }
          label="Rec."
          value={`${recorde}d`}
          active={recorde > 0}
        />
        <StatBadge
          icon={
            <Zap
              className={`w-5 h-5 mb-1 ${currentCharges > 0 ? "text-orange-400" : "text-neutral-700"}`}
            />
          }
          label="Vidas"
          value={`${currentCharges}/${maxCharges}`}
          active={currentCharges > 0}
        />
      </div>

      {/* Detalhes de Progresso */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] text-neutral-600 font-black uppercase">
          Total de {isNegative ? "Deslizes" : "Iterações"}:{" "}
          <span className="text-neutral-400">{totalContagem}</span>
        </p>
        {!isNegative && (
          <p className="text-[10px] text-neutral-600 font-black uppercase">
            Janela: <span className="text-neutral-400">{intervalo}d</span>
          </p>
        )}
      </div>

      {/* Seção de Ações de Usuário */}
      <div className="flex flex-col gap-2.5 mt-auto">
        {!isNegative ? (
          // Fluxo para Hábito Positivo
          canUse ? (
            <button
              type="button"
              onClick={() => habit.id && actions.markDone()}
              className="w-full py-4 rounded-2xl bg-teal-600/10 border border-teal-500/20 text-teal-400 text-xs font-black uppercase hover:bg-teal-600/20 transition-all cursor-pointer flex items-center justify-center gap-3 shadow-sm active:scale-95"
            >
              <Check className="w-5 h-5" /> Marcar Registro
            </button>
          ) : (
            <div className="w-full py-4 rounded-2xl bg-neutral-950/40 border border-neutral-800 text-neutral-500 text-[10px] font-black uppercase flex items-center justify-center gap-3">
              <Clock className="w-4 h-4 opacity-40" />
              <span>
                Próxima atualização em:{" "}
                <span className="text-neutral-300 ml-1">{timeLeft}</span>
              </span>
            </div>
          )
        ) : (
          // Fluxo para Controle de Vícios
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => habit.id && onOpenResetDialog(habit.id)}
              className="w-full py-4 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-black uppercase hover:bg-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-3 shadow-sm active:scale-95"
            >
              <AlertTriangle className="w-5 h-5" /> Registrar Quebra
            </button>

            {currentCharges > 0 && (
              <button
                type="button"
                onClick={() => habit.id && actions.handleUseCharge()}
                className="w-full py-4 rounded-2xl bg-orange-600/10 border border-orange-500/20 text-orange-400 text-xs font-black uppercase hover:bg-orange-600/20 transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-95"
              >
                <Zap className="w-4 h-4" /> Usar Carga Protetora
              </button>
            )}

            {chargeTimeLeft && (
              <div className="w-full py-2 flex items-center justify-center gap-2 opacity-40">
                <Clock className="w-3 h-3 text-neutral-500" />
                <span className="text-[9px] font-black uppercase text-neutral-500">
                  Recarga em: {chargeTimeLeft}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Componente interno para exibir métricas com estilo unificado
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
      className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border transition-all ${active ? "bg-neutral-950/40 border-neutral-800 shadow-inner" : "bg-transparent border-transparent opacity-40"}`}
    >
      {icon}
      <span className="text-xl font-black font-mono leading-none text-neutral-100">
        {value}
      </span>
      <span className="text-[9px] text-neutral-600 font-black uppercase leading-none">
        {label}
      </span>
    </div>
  );
}

/**
 * Botão de ícone utilitário para ações no card
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
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-xl transition-all cursor-pointer border border-transparent ${
        danger
          ? "text-neutral-700 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
          : "text-neutral-700 hover:text-neutral-200 hover:bg-neutral-800 hover:border-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}
