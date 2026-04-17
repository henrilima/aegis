import { Clock, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HydrationReminder } from "./types";

interface ReminderCardProps {
  reminder: HydrationReminder;
  onDelete: (id: number) => void;
}

export function ReminderCard({ reminder: r, onDelete }: ReminderCardProps) {
  return (
    <div className="flex items-center justify-between p-3 border border-border bg-card rounded-xl transition-all hover:border-border hover:bg-accent/50/20">
      <div className="flex items-center gap-3">
        {r.reminder_type === "Interval" ? (
          <Timer className="w-4 h-4 text-blue-500" />
        ) : (
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500" />
        )}
        <div>
          <div className="font-bold ">
            {r.reminder_type === "Interval" ? `${r.value} min` : r.value}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase font-semibold">
            {/* Exibe o horário de início se for intervalo ou apenas 'Fixo' */}
            {r.reminder_type === "Interval"
              ? `Início: ${r.start_time}`
              : "Fixo"}
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => r.id && onDelete(r.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
