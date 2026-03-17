import { Signal } from "lucide-react";

export function SpeedtestHeader({ isRunning }: { isRunning: boolean }) {
  return (
    <div className="text-center space-y-1">
      <div
        className={`mx-auto mb-3 p-3 rounded-xl w-fit border transition-all ${isRunning ? "bg-red-500/20 border-red-500/40 animate-pulse" : "bg-red-500/10 border-red-500/20"}`}
      >
        <Signal
          className={`w-7 h-7 text-red-500 ${isRunning ? "animate-pulse" : ""}`}
        />
      </div>
      <h1 className="text-2xl font-bold">Teste de Internet</h1>
      <p className=" text-neutral-500">Teste a velocidade da sua conexão.</p>
    </div>
  );
}
