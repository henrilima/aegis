"use client";

import { Star } from "lucide-react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface StudyStarsProps {
  score: number;
  isPomodoro?: boolean;
}

export function StudyStars({ score, isPomodoro }: StudyStarsProps) {
  const theme = getColorTheme(getModuleColor("studies"));
  const pomoTheme = getColorTheme(getModuleColor("pomodoro"));
  const activeColor = isPomodoro
    ? cn("fill-current", pomoTheme.text)
    : cn("fill-current", theme.text);

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
