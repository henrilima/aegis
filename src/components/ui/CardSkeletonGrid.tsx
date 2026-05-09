"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardSkeletonGridProps {
  /** Quantos cards exibir. Padrão: 6 */
  count?: number;
  /** Layout extra para o card - passa className para o wrapper do card */
  cardClassName?: string;
  /** Se true, exibe um card com layout de poster (filmes). Padrão: false */
  poster?: boolean;
}

/**
 * Grid de skeletons para estado de carregamento de módulos com cards.
 * Imita a estrutura visual dos cards reais para reduzir o layout shift.
 */
export function CardSkeletonGrid({
  count = 6,
  cardClassName,
  poster = false,
}: CardSkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: Skeletons are static and never reordered
          key={i}
          className={cn(
            "bg-card border border-border rounded-2xl p-5 flex flex-col gap-4",
            cardClassName,
          )}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {poster ? (
            // Layout de poster (filmes)
            <>
              <Skeleton className="w-full aspect-2/3 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="flex gap-2 mt-auto">
                <Skeleton className="h-8 flex-1 rounded-xl" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            </>
          ) : (
            // Layout de card padrão (hábitos, dicionário, etc.)
            <>
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
              <Skeleton className="h-10 rounded-xl mt-auto" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
