import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CurrencyConverterProps {
  rates: Record<string, number>;
  baseCurrency: string;
  setBaseCurrency: (val: string) => void;
  targetCurrency: string;
  setTargetCurrency: (val: string) => void;
  amount: number;
  setAmount: (val: number) => void;
  result: number;
  handleSwap: () => void;
}

export function CurrencyConverter({
  rates,
  baseCurrency,
  setBaseCurrency,
  targetCurrency,
  setTargetCurrency,
  amount,
  setAmount,
  result,
  handleSwap,
}: CurrencyConverterProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label>De</Label>
        <div className="flex gap-2">
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="flex h-10 w-[100px] rounded-md border border-input bg-background px-3 py-2 "
          >
            {Object.keys(rates)
              .sort()
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="ghost" size="icon" onClick={handleSwap}>
          <ArrowRightLeft className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Para</Label>
        <div className="flex gap-2">
          <select
            value={targetCurrency}
            onChange={(e) => setTargetCurrency(e.target.value)}
            className="flex h-10 w-[100px] rounded-md border border-input bg-background px-3 py-2 "
          >
            {Object.keys(rates)
              .sort()
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
          <div className="flex-1 h-10 px-3 py-2 border rounded-md bg-neutral-50 dark:bg-neutral-900 font-bold flex items-center">
            {result.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
