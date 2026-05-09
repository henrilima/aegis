"use client";

import { Star } from "lucide-react";

interface SleepStarsProps {
  quality: number;
}

export function SleepStars({ quality }: SleepStarsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= quality ? "fill-yellow-400 text-yellow-400" : "text-neutral-700"}`}
        />
      ))}
    </div>
  );
}
