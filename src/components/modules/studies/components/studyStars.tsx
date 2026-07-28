"use client";

import { Star } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface StudyStarsProps {
  score: number;
  isPomodoro?: boolean;
  color?: string;
}

export function StudyStars({ score, isPomodoro, color }: StudyStarsProps) {
  const defaultColorName = isPomodoro
    ? getModuleColor("pomodoro")
    : getModuleColor("studies");
  const effectiveColorName = color || defaultColorName;
  const theme = getColorTheme(effectiveColorName);
  const activeColor = cn("fill-current", theme.text);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "w-3 h-3",
            i <= score ? activeColor : "text-neutral-700",
          )}
        />
      ))}
    </div>
  );
}
