"use client";

import { Banknote, Clock, TrendingDown, TrendingUp } from "lucide-react";
import { BaseWidget } from "../BaseWidget";

interface CurrencyWidgetProps {
  rates: Record<string, number>;
  lastUpdated?: string | null;
  isEditMode?: boolean;
}

export function CurrencyWidget({
  rates,
  lastUpdated,
  isEditMode,
}: CurrencyWidgetProps) {
  const getRate = (code: string, invert = false) => {
    if (!rates.BRL || !rates[code]) return null;
    if (invert) {
      // Quanto 1 Moeda Estrangeira vale em BRL
      return (rates.BRL / rates[code]).toFixed(2);
    }
    // Quanto 1 BRL vale na moeda estrangeira
    const val = rates[code] / rates.BRL;
    return val < 1 ? val.toFixed(4) : val.toFixed(2);
  };

  const currencies = [
    { code: "USD", name: "Dólar Comercial", trend: "up" },
    { code: "EUR", name: "Euro Comercial", trend: "down" },
    { code: "JPY", name: "Iene Japonês", trend: "down" },
  ];

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "---";
    try {
      return new Date(d).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "---";
    }
  };

  return (
    <BaseWidget
      title="Mercado & Câmbio"
      icon={Banknote}
      iconColor="text-emerald-600 dark:text-emerald-400"
      route="currency"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          {currencies.map((c) => {
            const brlToForeign = getRate(c.code, false);
            const foreignToBrl = getRate(c.code, true);

            return (
              <div
                key={c.code}
                className="px-4 py-2.5 rounded-xl bg-neutral-800/20 border border-border/40 flex flex-col gap-2 transition-colors hover:bg-accent/50/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-foreground uppercase">
                      {c.name}
                    </span>
                    {c.trend === "up" ? (
                      <TrendingUp className="w-2.5 h-2.5 text-rose-500/70" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5 text-emerald-500/70" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      1 {c.code} vale
                    </span>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">
                      R$ {foreignToBrl || "---"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">
                      R$ 1,00 vale
                    </span>
                    <p className="text-base font-bold text-foreground leading-none mt-0.5">
                      {brlToForeign || "---"}{" "}
                      <span className="text-[10px] text-neutral-600 ml-0.5">
                        {c.code}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-1 p-2 rounded-lg bg-card/50 border border-border/50 flex items-center justify-between">
          <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-neutral-700" />
            Atualizado em
          </span>
          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400/80 uppercase">
            {fmtDate(lastUpdated)}
          </span>
        </div>
      </div>
    </BaseWidget>
  );
}
