"use client";

import { SpeedtestHeader } from "./speedHeader";
import { SpeedMetrics } from "./speedMetrics";
import { useSpeedtestLogic } from "./useSpeedtestLogic";

/**
 * Módulo Speedtest: Medição de performance de rede (Ping, Download e Upload)
 */
export default function Speedtest() {
  const { status, loading, error, pingRef, downloadRef, uploadRef, startTest } =
    useSpeedtestLogic();

  const isRunning = loading;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center animate-in fade-in duration-700 p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Cabeçalho Visual */}
        <SpeedtestHeader isRunning={isRunning} />

        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-2xl shadow-black/40">
          {/* Status do Mecanismo */}
          <div className="text-center relative">
            <span className="text-[10px] font-black uppercase text-neutral-600 block mb-2">
              Status da Conexão
            </span>
            <p
              className={`text-xs font-black uppercase transition-all duration-300 ${
                error
                  ? "text-red-500"
                  : isRunning
                    ? "text-amber-500 animate-pulse"
                    : "text-neutral-500"
              }`}
            >
              {error || status}
            </p>
          </div>

          {/* Métricas em Tempo Real */}
          <SpeedMetrics
            pingRef={pingRef}
            downloadRef={downloadRef}
            uploadRef={uploadRef}
          />
        </div>

        {/* Acionador do Teste */}
        <button
          type="button"
          onClick={startTest}
          disabled={isRunning}
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase transition-all duration-300 shadow-xl cursor-pointer active:scale-[0.98] ${
            isRunning
              ? "bg-neutral-800 text-neutral-600 border border-neutral-700 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/10"
          }`}
        >
          {isRunning ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-ping" />
              Sincronizando Rede...
            </span>
          ) : (
            "Iniciar Diagnóstico"
          )}
        </button>
      </div>
    </div>
  );
}
