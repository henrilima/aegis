"use client";

import { invoke } from "@tauri-apps/api/core";
import { ArrowRightLeft, Clock, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyHeader } from "./currency-header";
import type { CurrencyRate } from "./types";

const CURRENCY_API = "https://open.er-api.com/v6/latest/USD";

const FAVORITES = [
  "USD",
  "BRL",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "ARS",
];

export default function CurrencyPage() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [targetCurrency, setTargetCurrency] = useState("BRL");
  const [amount, setAmount] = useState<number>(1);
  const [result, setResult] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [nextUpdate, setNextUpdate] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async (forceReload = false) => {
    setLoading(true);
    try {
      const response = await fetch(CURRENCY_API);
      if (!response.ok) throw new Error("Offline");

      const data = await response.json();
      const erRates = data.rates;

      const ratesToSave: CurrencyRate[] = Object.keys(erRates).map((code) => ({
        code: code.toLowerCase(),
        rate: erRates[code],
        last_updated: new Date(data.time_last_update_utc).toISOString(),
      }));

      await invoke("update_currency_rates", { rates: ratesToSave });

      setRates(erRates);
      setLastUpdated(data.time_last_update_utc);
      setNextUpdate(data.time_next_update_utc);
      setIsOffline(false);
      if (forceReload) toast.success("Cotações atualizadas!");
    } catch {
      const dbRates = await invoke<CurrencyRate[]>("get_currency_rates");
      if (dbRates.length > 0) {
        const ratesMap: Record<string, number> = {};
        for (const r of dbRates) ratesMap[r.code.toUpperCase()] = r.rate;
        setRates(ratesMap);
        setLastUpdated(dbRates[0].last_updated);
        setIsOffline(true);
        if (forceReload) toast.info("Usando cache local (Offline)");
      } else {
        toast.error("Sem dados e sem conexão.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  useEffect(() => {
    if (!nextUpdate) return;
    const ms = new Date(nextUpdate).getTime() - Date.now();
    if (ms <= 0) return;
    const t = setTimeout(() => fetchRates(), ms);
    return () => clearTimeout(t);
  }, [nextUpdate, fetchRates]);

  useEffect(() => {
    if (rates[targetCurrency] && rates[baseCurrency]) {
      const inUsd = amount / (rates[baseCurrency] || 1);
      setResult(inUsd * (rates[targetCurrency] || 1));
    }
  }, [amount, baseCurrency, targetCurrency, rates]);

  const handleSwap = () => {
    setBaseCurrency(targetCurrency);
    setTargetCurrency(baseCurrency);
  };

  const sortedCurrencies = Object.keys(rates).sort((a, b) => {
    const ai = FAVORITES.indexOf(a);
    const bi = FAVORITES.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  const fmtDate = (d: string | null) => {
    if (!d) return "---";
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        <CurrencyHeader isOffline={isOffline} loading={loading} />

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase  text-neutral-500">
              De
            </p>
            <div className="flex gap-2">
              <CurrencySelect
                value={baseCurrency}
                onChange={setBaseCurrency}
                currencies={sortedCurrencies}
              />
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1 bg-neutral-950 border-neutral-700 font-mono text-right"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase  text-neutral-500">
              Para
            </p>
            <div className="flex gap-2">
              <CurrencySelect
                value={targetCurrency}
                onChange={setTargetCurrency}
                currencies={sortedCurrencies}
              />
              <div className="flex-1 h-10 px-3 rounded-lg bg-neutral-950 border border-neutral-700 font-mono font-bold text-right flex items-center justify-end text-green-500 text-lg">
                {result.toFixed(2)}
              </div>
            </div>
          </div>

          {rates[baseCurrency] && rates[targetCurrency] && (
            <p className="text-center text-xs text-neutral-600 pt-1">
              1 {baseCurrency} ={" "}
              {(rates[targetCurrency] / rates[baseCurrency]).toFixed(4)}{" "}
              {targetCurrency}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-600 px-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Atualizado: {fmtDate(lastUpdated)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchRates(true)}
            disabled={loading}
            className="text-xs text-neutral-500 hover:text-white cursor-pointer h-7 px-2"
          >
            <RefreshCw
              className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>

        <p className="text-center text-[10px] text-neutral-700">
          OpenER API · atualiza ~1×/dia (plano gratuito)
          {nextUpdate && ` · próxima: ${fmtDate(nextUpdate)}`}
        </p>
      </div>
    </div>
  );
}

function CurrencySelect({
  value,
  onChange,
  currencies,
}: {
  value: string;
  onChange: (v: string) => void;
  currencies: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-24 h-10 rounded-lg border border-neutral-700 bg-neutral-950 px-2 text-sm font-bold text-white focus:outline-none focus:border-green-500/50 cursor-pointer"
    >
      {currencies.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
