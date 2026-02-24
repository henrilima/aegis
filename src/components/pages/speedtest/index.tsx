"use client";

import { Button } from "@/components/ui/button";
import { SpeedtestHeader } from "./speed-header";
import { SpeedMetrics } from "./speed-metrics";
import { useSpeedtestLogic } from "./use-speedtest-logic";

export default function Speedtest() {
  const { status, loading, error, pingRef, downloadRef, uploadRef, startTest } =
    useSpeedtestLogic();

  const isRunning = loading;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <SpeedtestHeader isRunning={isRunning} />

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="text-center">
            <span className="text-xs font-black uppercase  text-neutral-500">
              Status
            </span>
            <p
              className={`text-sm font-semibold mt-0.5 ${error ? "text-red-400" : isRunning ? "text-amber-500 animate-pulse" : "text-neutral-400"}`}
            >
              {error || status}
            </p>
          </div>

          <SpeedMetrics
            pingRef={pingRef}
            downloadRef={downloadRef}
            uploadRef={uploadRef}
          />
        </div>

        <Button
          onClick={startTest}
          disabled={isRunning}
          className="w-full font-bold cursor-pointer bg-red-500 hover:bg-red-400 text-white h-11"
        >
          {isRunning ? "Testando..." : "Iniciar Teste"}
        </Button>
      </div>
    </div>
  );
}
