import type { User } from "@/context/AuthContext";

interface DashboardHeaderProps {
  time: Date;
  greeting: string;
  user: User | null;
  doneTodayCount: number;
  positiveHabitsCount: number;
  pendingNotesCount: number;
}

export function DashboardHeader({
  time,
  greeting,
  user,
  doneTodayCount,
  positiveHabitsCount,
  pendingNotesCount,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-black uppercase text-neutral-600">
          {time.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
        <h1 className="text-4xl font-black text-neutral-200 leading-none">
          {greeting},{" "}
          <span className="text-amber-500">{user?.username ?? ""}</span>!
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {positiveHabitsCount > 0
            ? `${doneTodayCount} de ${positiveHabitsCount} hábitos feitos · ${pendingNotesCount} nota${pendingNotesCount !== 1 ? "s" : ""} pendente${pendingNotesCount !== 1 ? "s" : ""}`
            : `${pendingNotesCount} nota${pendingNotesCount !== 1 ? "s" : ""} pendente${pendingNotesCount !== 1 ? "s" : ""}`}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end">
        <span className="text-5xl font-black font-mono text-neutral-200 tabular-nums leading-none">
          {time.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="text-sm font-bold text-amber-500 mt-1 tabular-nums">
          {time.getSeconds().toString().padStart(2, "0")}s
        </span>
      </div>
    </div>
  );
}
