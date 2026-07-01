"use client";

interface StatsPanelProps {
  stats: {
    activeDaysTotal: number;
    totalPasswords: number;
    completedTasksTotal: number;
    totalTasks: number;
    totalPomodorosToday: number;
    totalPomodoros: number;
    studyHoursToday: number;
    readingPagesToday: number;
  };
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="p-5 rounded-2xl border border-border/70 bg-card/30 flex flex-col gap-4 w-full h-full">
      <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 text-left">
        Estatísticas Gerais
      </h3>
      <div className="grid grid-cols-2 gap-3 text-left flex-1 items-stretch">
        <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 flex flex-col justify-center">
          <span className="text-xs text-muted-foreground block font-medium">
            Dias Ativos
          </span>
          <span className="text-lg font-extrabold text-foreground mt-0.5">
            {stats.activeDaysTotal}
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 flex flex-col justify-center">
          <span className="text-xs text-muted-foreground block font-medium">
            Senhas no Cofre
          </span>
          <span className="text-lg font-extrabold text-foreground mt-0.5">
            {stats.totalPasswords}
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 flex flex-col justify-center">
          <span className="text-xs text-muted-foreground block font-medium">
            Tarefas Feitas
          </span>
          <span className="text-lg font-extrabold text-foreground mt-0.5">
            {stats.completedTasksTotal}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              / {stats.totalTasks}
            </span>
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 flex flex-col justify-center">
          <span className="text-xs text-muted-foreground block font-medium">
            Pomodoros (Hoje)
          </span>
          <span className="text-lg font-extrabold text-foreground mt-0.5">
            {stats.totalPomodorosToday}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({stats.totalPomodoros})
            </span>
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 flex flex-col justify-center">
          <span className="text-xs text-muted-foreground block font-medium">
            Estudos (Hoje)
          </span>
          <span className="text-lg font-extrabold text-foreground mt-0.5">
            {stats.studyHoursToday}h
          </span>
        </div>
        <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 flex flex-col justify-center">
          <span className="text-xs text-muted-foreground block font-medium">
            Páginas Lidas
          </span>
          <span className="text-lg font-extrabold text-foreground mt-0.5">
            {stats.readingPagesToday}
          </span>
        </div>
      </div>
    </div>
  );
}
