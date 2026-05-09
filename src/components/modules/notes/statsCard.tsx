import { FileText } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface StatsCardProps {
  count: number;
}

/**
 * Card de estatística simples para o resumo de notas
 */
export function StatsCard({ count }: StatsCardProps) {
  const theme = getColorTheme(getModuleColor("notes"));
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
      <div
        className={cn("p-3 rounded-full border mb-3", theme.bg, theme.border)}
      >
        <FileText className={cn("w-6 h-6", theme.text)} />
      </div>
      <h3 className="text-3xl font-black text-foreground leading-none">
        {count}
      </h3>
      <p className="text-[10px] font-bold text-muted-foreground mt-2">
        Notas Registradas
      </p>
    </div>
  );
}
