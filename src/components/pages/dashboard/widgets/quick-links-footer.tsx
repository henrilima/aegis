import Link from "next/link";

export function QuickLinksFooter() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-8 border-t border-neutral-800/50">
      <div className="flex items-center gap-6">
        <p className="text-[10px] font-black text-neutral-500 uppercase ">
          Links Rápidos
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/currency"
            className="px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] font-bold uppercase text-green-500 bg-green-500/5"
          >
            Câmbio
          </Link>
          <Link
            href="/dashboard/speedtest"
            className="px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-neutral-600 transition-colors text-[10px] font-bold uppercase text-red-500 bg-red-500/5"
          >
            Internet
          </Link>
        </div>
      </div>
    </div>
  );
}
