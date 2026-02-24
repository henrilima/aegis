import { Coins, WifiOff } from "lucide-react";

interface CurrencyHeaderProps {
  isOffline: boolean;
  loading: boolean;
}

export function CurrencyHeader({ isOffline, loading }: CurrencyHeaderProps) {
  return (
    <div className="text-center space-y-1">
      <div className="mx-auto mb-3 p-3 bg-green-500/10 rounded-3xl w-fit border border-green-500/20">
        <Coins
          className={`w-7 h-7 text-green-500 ${loading ? "animate-pulse" : ""}`}
        />
      </div>
      <h1 className="text-2xl font-bold">Câmbio</h1>
      {isOffline ? (
        <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">
          <WifiOff className="w-3 h-3" /> Offline — dados em cache
        </span>
      ) : (
        <p className="text-xs text-neutral-500">Taxas em relação ao USD</p>
      )}
    </div>
  );
}
