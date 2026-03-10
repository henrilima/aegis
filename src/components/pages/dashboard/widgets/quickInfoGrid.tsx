import { Droplet, Lock } from "lucide-react";
import { Widget } from "./ui";

interface QuickInfoGridProps {
  hydrationCount: number;
  passwordsCount: number;
}

export function QuickInfoGrid({
  hydrationCount,
  passwordsCount,
}: QuickInfoGridProps) {
  return (
    <div className="md:col-span-full lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Widget
        title="Hidratação"
        icon={Droplet}
        href="/dashboard/hydration"
        color="blue"
        description="Lembretes diários"
      >
        <div className="flex items-end gap-3 mt-auto h-full pb-2">
          <span className="text-4xl font-black font-mono text-blue-400">
            {hydrationCount}
          </span>
          <span className="text-[11px] font-black uppercase text-white/60 mb-1.5">
            Lembretes
          </span>
        </div>
      </Widget>

      <Widget
        title="Segurança"
        icon={Lock}
        href="/dashboard/passwords"
        color="amber"
        description="Gerenciador de senhas"
      >
        <div className="flex items-end gap-3 mt-auto h-full pb-2">
          <span className="text-4xl font-black font-mono text-amber-500">
            {passwordsCount}
          </span>
          <span className="text-[11px] font-black uppercase text-white/60 mb-1.5">
            Senhas
          </span>
        </div>
      </Widget>
    </div>
  );
}
