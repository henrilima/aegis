"use client";

import { invoke } from "@tauri-apps/api/core";
import { ArrowRightLeft, Clock, Coins, RefreshCw, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolTip } from "@/components/ui/ToolTipHelper";
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

/**
 * Módulo de Câmbio: Conversão de moedas em tempo real com suporte offline
 */
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

  // Sincronização de taxas via API ou Cache Local
  // Nota: fetch() padrão é usado aqui pois a URL (open.er-api.com) está na allowlist de rede do Tauri.
  // Se a CSP for restringida no futuro, migrar para @tauri-apps/plugin-http.
  const fetchRates = useCallback(async (forceReload = false) => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(CURRENCY_API, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

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
      if (forceReload) toast.success("Mercado atualizado com sucesso!");
    } catch {
      // Fallback para cache local no banco SQLite
      const dbRates = await invoke<CurrencyRate[]>("get_currency_rates");
      if (dbRates.length > 0) {
        const ratesMap: Record<string, number> = {};
        for (const r of dbRates) ratesMap[r.code.toUpperCase()] = r.rate;
        setRates(ratesMap);
        setLastUpdated(dbRates[0].last_updated);
        setIsOffline(true);
        if (forceReload) toast.info("Operando em Modo Offline (Cache)");
      } else {
        toast.error("Sem conexão e sem cache disponível.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Agendamento da próxima atualização automática
  useEffect(() => {
    if (!nextUpdate) return;
    const ms = new Date(nextUpdate).getTime() - Date.now();
    if (ms <= 0) return;
    const t = setTimeout(() => fetchRates(), ms);
    return () => clearTimeout(t);
  }, [nextUpdate, fetchRates]);

  // Cálculo reativo da conversão
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
    <div className="h-full w-full flex flex-col items-center justify-center animate-in fade-in duration-700 p-4">
      <div className="w-full max-w-sm space-y-5">
        {/* Cabeçalho */}
        <div className="text-center space-y-1">
          <div className="mx-auto mb-3 p-3 bg-green-500/10 rounded-xl w-fit border border-green-500/20">
            <Coins
              className={`w-7 h-7 text-green-500 ${loading ? "animate-pulse" : ""}`}
            />
          </div>
          <h1 className="text-2xl font-bold">Câmbio</h1>
          {isOffline ? (
            <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">
              <WifiOff className="w-3 h-3" /> Offline — dados em cache
            </span>
          ) : (
            <p className="text-xs text-muted-foreground">
              Taxas em relação ao USD
            </p>
          )}
        </div>

        {/* Console de Conversão */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          {/* Campo de Origem */}
          <div className="space-y-1.5">
            <label
              htmlFor="currency-amount"
              className="text-xs font-bold text-muted-foreground ml-1 uppercase block"
            >
              Moeda Base
            </label>
            <div className="flex gap-2">
              <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                <SelectTrigger className="w-24 bg-background border-border rounded-xl h-[46px] font-bold text-xs focus:ring-green-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-60">
                  {sortedCurrencies.map((c) => (
                    <SelectItem
                      key={c}
                      value={c}
                      className="text-xs font-bold py-2"
                    >
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                id="currency-amount"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 font-mono font-black text-right text-foreground outline-none focus:border-green-500/30 transition-all"
              />
            </div>
          </div>

          {/* Botão de Inversão */}
          <div className="flex justify-center -my-2 relative z-10">
            <ToolTip content="Inverter Moedas">
              <button
                type="button"
                onClick={handleSwap}
                className="p-3 rounded-xl bg-neutral-800 hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-90"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </ToolTip>
          </div>

          {/* Campo de Destino */}
          <div className="space-y-1.5">
            <label
              htmlFor="currency-target"
              className="text-xs font-bold text-muted-foreground ml-1 uppercase block"
            >
              Resultado
            </label>
            <div className="flex gap-2">
              <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                <SelectTrigger className="w-24 bg-background border-border rounded-xl h-[46px] font-bold text-xs focus:ring-green-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border max-h-60">
                  {sortedCurrencies.map((c) => (
                    <SelectItem
                      key={c}
                      value={c}
                      className="text-xs font-bold py-2"
                    >
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div
                id="currency-target"
                className="flex-1 h-[46px] px-4 rounded-xl bg-background/50 border border-border font-mono font-black text-right flex items-center justify-end text-green-400 text-xl"
              >
                {result.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Taxa Informativa */}
          {rates[baseCurrency] && rates[targetCurrency] && (
            <div className="text-center pt-2">
              <p className="text-xs text-neutral-600 font-bold">
                1 {baseCurrency} ≈{" "}
                {(rates[targetCurrency] / rates[baseCurrency]).toFixed(4)}{" "}
                {targetCurrency}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé e Sincronização */}
        <div className="flex items-center justify-between text-[10px] text-neutral-600 font-bold px-1">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-neutral-700" />
            Atualizado em: {fmtDate(lastUpdated)}
          </span>
          <button
            type="button"
            onClick={() => fetchRates(true)}
            disabled={loading}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-30"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </button>
        </div>

        {/* API Info */}
        <div className="text-center opacity-20 hover:opacity-100 transition-opacity">
          <p className="text-[9px] font-bold uppercase text-neutral-700">
            Open Exchange Rates API
          </p>
          {nextUpdate && (
            <p className="text-[8px] font-bold uppercase text-neutral-800 mt-0.5">
              Próxima sync: {fmtDate(nextUpdate)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
