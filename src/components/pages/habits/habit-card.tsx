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
import { useHabitLogic } from "./use-habit-logic";

interface HabitCardProps {
  habit: Habit;
  onRefresh: () => void;
  onEdit: (habit: Habit) => void;
  onOpenResetDialog: (id: number) => void;
  onOpenHardResetDialog: (id: number) => void;
}

export function HabitCard({
  habit,
  onRefresh,
  onEdit,
  onOpenResetDialog,
  onOpenHardResetDialog,
}: HabitCardProps) {
  const {
    name,
    isNegative,
    diaAtual,
    recorde,
    canUse,
    timeLeft,
    totalContagem,
    intervalo,
    labels,
    actions,
  } = useHabitLogic(habit, onRefresh);

  const accentColor = isNegative ? "text-red-400" : "text-teal-400";
  const accentBg = isNegative
    ? "bg-red-500/10 border-red-500/20"
    : "bg-teal-500/10 border-teal-500/20";

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-4 hover:border-neutral-700 transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className={`mt-0.5 p-2 rounded-xl border ${accentBg}`}>
            {isNegative ? (
              <Flame className={`w-6! h-6! ${accentColor}`} />
            ) : (
              <Check className={`w-6! h-6! ${accentColor}`} />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="font-black text-lg leading-tight">{name}</h3>
            <p className={`text-[11px] font-black uppercase  ${accentColor}`}>
              {isNegative ? "Controle de Vício" : "Hábito Positivo"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconBtn onClick={() => habit.id && onEdit(habit)} title="Editar">
            <Edit2 className="w-4 h-4" />
          </IconBtn>
          <IconBtn
            onClick={() => habit.id && onOpenHardResetDialog(habit.id)}
            title="Zerar tudo"
          >
            <RotateCcw className="w-4 h-4" />
          </IconBtn>
          <IconBtn
            onClick={() => habit.id && actions.deleteHabit()}
            title="Deletar"
            danger
          >
            <Trash2 className="w-4 h-4" />
          </IconBtn>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatBadge
          icon={
            <Flame
              className={`w-6 h-6 mb-2 ${diaAtual > 0 ? accentColor : "text-neutral-700"}`}
            />
          }
          label={isNegative ? "Sequência" : "Atual"}
          value={`${diaAtual}d`}
        />
        <StatBadge
          icon={
            <Trophy
              className={`w-6 h-6 mb-2 ${recorde > 0 ? "text-amber-500" : "text-neutral-700"}`}
            />
          }
          label="Recorde"
          value={`${recorde}d`}
        />
        <StatBadge
          icon={<Clock className="w-6 h-6 mb-2 text-neutral-600" />}
          label={isNegative ? "Deslizes" : "Feitos"}
          value={String(totalContagem)}
        />
      </div>

      {timeLeft && (
        <div
          className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border ${accentBg} text-xs font-mono font-bold ${accentColor}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{isNegative ? "Carga em" : "Próxima em"}</span>
          <span className="font-black ">{timeLeft}</span>
        </div>
      )}

      {isNegative ? (
        canUse ? (
          <button
            type="button"
            onClick={() => habit.id && actions.handleUseCharge()}
            className="w-full h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black uppercase  hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center justify-center gap-3"
          >
            {/* Permite usar uma 'carga' de proteção para vícios controlados */}
            <Zap className="w-5 h-5" /> {labels.action}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => habit.id && onOpenResetDialog(habit.id)}
            className="w-full h-11 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase  hover:bg-red-500/20 transition-colors cursor-pointer flex items-center justify-center gap-3"
          >
            {/* Botão de alerta para quando o vício é consumido (zerar sequência) */}
            <AlertTriangle className="w-5 h-5" /> Registrar Deslize
          </button>
        )
      ) : canUse ? (
        <button
          type="button"
          onClick={() => habit.id && actions.markDone()}
          className="w-full h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-black uppercase  hover:bg-teal-500/20 transition-colors cursor-pointer flex items-center justify-center gap-3"
        >
          <Check className="w-5 h-5" /> Marcar Concluído
        </button>
      ) : (
        <div className="w-full h-11 rounded-xl bg-neutral-800/50 border border-neutral-800 text-neutral-500 text-xs font-black uppercase  flex items-center justify-center gap-3">
          <Check className="w-5 h-5" /> Meta Batida
        </div>
      )}

      <p className="text-xs text-neutral-500 font-medium text-center">
        Intervalo: {intervalo} dia{intervalo !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 py-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
      <div className="flex items-center gap-1.5">{icon}</div>
      <span className="text-lg font-black font-mono leading-none ">
        {value}
      </span>
      <span className="text-[10px] text-neutral-500 font-bold uppercase ">
        {label}
      </span>
    </div>
  );
}

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
      className={`p-1.5 rounded-lg transition-all cursor-pointer ${danger ? "text-neutral-600 hover:text-red-400 hover:bg-red-500/10" : "text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800"}`}
    >
      {children}
    </button>
  );
}
