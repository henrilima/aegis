import { Zap } from "lucide-react";
import { Widget } from "./ui";

interface ProductivityCardProps {
  username?: string;
  progress: number;
  doneCount: number;
  totalCount: number;
}

export function ProductivityCard({
  username,
  progress,
  doneCount,
  totalCount,
}: ProductivityCardProps) {
  return (
    <Widget
      title="Status de Produtividade"
      icon={Zap}
      href="/dashboard/habits"
      color="amber"
      description="Resumo do dia"
    >
      <div className="flex flex-col justify-between h-full pt-2">
        <div>
          <h2 className="text-2xl font-black leading-tight text-white mb-2">
            Mantenha o foco,{" "}
            {/* Extrai apenas o primeiro nome para uma saudação mais pessoal */}
            <span className="text-white/60">{username?.split(" ")[0]}!</span>
          </h2>
          <div className="flex items-end gap-3 mt-4">
            <span className="text-5xl font-black font-mono text-amber-500">
              {Math.round(progress)}%
            </span>
            <span className="text-[11px] font-black uppercase text-white/50 mb-2">
              {doneCount}/{totalCount} Hábitos
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
            {/* Define uma largura mínima de 5% para visibilidade inicial */}
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              style={{ width: `${Math.max(5, progress)}%` }}
            />
          </div>
        </div>
      </div>
    </Widget>
  );
}
