"use client";

import { Star } from "lucide-react";

interface StudyStarsProps {
  score: number;
}

export function StudyStars({ score }: StudyStarsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= score ? "fill-violet-400 text-violet-600 dark:text-violet-400" : "text-neutral-700"}`}
        />
      ))}
    </div>
  );
}
