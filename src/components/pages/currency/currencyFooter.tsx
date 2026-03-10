import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CurrencyFooterProps {
  lastUpdated: string | null;
  loading: boolean;
  onFetch: (force: boolean) => void;
}

export function CurrencyFooter({
  lastUpdated,
  loading,
  onFetch,
}: CurrencyFooterProps) {
  return (
    <div className="flex justify-between items-center text-xs text-neutral-500 pt-4 border-t mt-6">
      <span>
        Atualizado:{" "}
        {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "---"}
      </span>
      <Button variant="ghost" size="sm" onClick={() => onFetch(true)}>
        <RefreshCw
          className={`w-3 h-3 mr-2 ${loading ? "animate-spin" : ""}`}
        />
        Atualizar
      </Button>
    </div>
  );
}
