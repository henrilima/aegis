"use client";

import { Input } from "@/components/ui/input";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

export const GOAL_LABELS: Record<string, string> = {
  weekly_hours: "Horas semanais",
  monthly_hours: "Horas mensais",
  weekly_questions: "Questões semanais",
  monthly_questions: "Questões mensais",
  weekly_pages: "Páginas semanais",
  monthly_pages: "Páginas mensais",
};

export const GOAL_UNITS: Record<string, string> = {
  weekly_hours: "h",
  monthly_hours: "h",
  weekly_questions: "q",
  monthly_questions: "q",
  weekly_pages: "p",
  monthly_pages: "p",
};

interface GoalPanelProps {
  vals: Record<string, string>;
  setVals: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function GoalPanel({ vals, setVals }: GoalPanelProps) {
  const color = getModuleColor("studies");
  const theme = getColorTheme(color);
  const goalTypes = [
    "weekly_hours",
    "monthly_hours",
    "weekly_questions",
    "monthly_questions",
    "weekly_pages",
    "monthly_pages",
  ] as const;

  const ic = cn(
    "flex-1 bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground placeholder:text-neutral-700 focus:outline-none transition-all",
    theme.borderHover.replace("hover:", "focus:").replace("500", "500/50"),
    theme.textSub
      .replace("text-", "focus:ring-1 focus:ring-")
      .replace("400", "500/20"),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
        {goalTypes.map((type) => (
          <div key={type} className="group flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-muted-foreground">
                {GOAL_LABELS[type]}
              </span>
              <span className="text-[10px] font-bold text-neutral-600">
                {GOAL_UNITS[type] === "h"
                  ? "Horas"
                  : GOAL_UNITS[type] === "q"
                    ? "Questões"
                    : "Páginas"}
              </span>
            </div>
            <div className="flex items-center gap-3 relative">
              <Input
                type="number"
                min="0"
                className={ic}
                placeholder={GOAL_UNITS[type] === "h" ? "Ex: 40" : "Ex: 300"}
                value={vals[type] ?? ""}
                onChange={(e) =>
                  setVals((v) => ({ ...v, [type]: e.target.value }))
                }
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                <div className="w-px h-4 bg-border mx-1" />
                <span className={cn("text-xs font-bold", theme.text)}>
                  {GOAL_UNITS[type]}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
