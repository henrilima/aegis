import Link from "next/link";
import type { ElementType } from "react";

interface QuickStat {
  icon: ElementType;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  border: string;
}

interface QuickStatsBarProps {
  stats: QuickStat[];
}

export function QuickStatsBar({ stats }: QuickStatsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`flex items-center gap-3 p-4 bg-neutral-900 border ${s.border} rounded-2xl`}
        >
          <div className={`p-2 rounded-xl ${s.bg} shrink-0`}>
            <s.icon className={`w-4 h-4 ${s.color}`} />
          </div>
          <div>
            <div
              className={`text-2xl font-black font-mono leading-none ${s.color}`}
            >
              {s.value}
            </div>
            <div className="text-[10px] font-bold text-neutral-600 uppercase  mt-0.5">
              {s.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ModuleItem {
  label: string;
  icon: ElementType;
  href: string;
  color: string;
  count: number | null;
  sub: string;
}

interface ModuleGridProps {
  modules: readonly ModuleItem[];
  colorConfig: Record<string, { text: string; bg: string; border: string }>;
}

export function ModuleGrid({ modules, colorConfig }: ModuleGridProps) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase  text-neutral-600 mb-3">
        Módulos
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {modules.map((m) => {
          const c = colorConfig[m.color];
          return (
            <Link
              key={m.label}
              href={m.href}
              className={`group flex flex-col gap-3 p-4 bg-neutral-900 border border-neutral-800 hover:${c.border} rounded-2xl transition-all duration-300 hover:bg-neutral-800/60`}
            >
              <div
                className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <m.icon className={`w-4 h-4 ${c.text}`} />
              </div>
              <div>
                <div className="text-sm font-bold text-neutral-200 leading-none">
                  {m.label}
                </div>
                <div className="text-[10px] text-neutral-600 mt-0.5">
                  {m.sub}
                </div>
              </div>
              {m.count !== null && (
                <div
                  className={`text-xl font-black font-mono ${c.text} leading-none`}
                >
                  {m.count}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
