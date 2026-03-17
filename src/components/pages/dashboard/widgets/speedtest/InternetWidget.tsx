"use client";

import { Activity, ArrowDown, ArrowUp, Wifi } from "lucide-react";
import { BaseWidget } from "../BaseWidget";

interface InternetWidgetProps {
  // Dados simulados ou reais do último teste
  lastDownload?: string;
  lastUpload?: string;
  lastPing?: string;
  status: string;
  isEditMode?: boolean;
}

export function InternetWidget({
  lastDownload = "---",
  lastUpload = "---",
  lastPing = "---",
  status,
  isEditMode,
}: InternetWidgetProps) {
  return (
    <BaseWidget
      title="Conexão & Rede"
      icon={Wifi}
      iconColor="text-red-400"
      route="speedtest"
      isEditMode={isEditMode}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <Activity className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase">
              Status Atual
            </p>
            <p className="text-sm font-bold text-white transition-all">
              {status || "Conectado"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-neutral-800/30 border border-neutral-800/50 flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <ArrowDown className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-bold text-neutral-500">
                DOWNLOAD
              </span>
            </div>
            <p className="text-base font-black text-white">
              {lastDownload}{" "}
              <span className="text-[10px] font-bold text-neutral-600">
                Mbps
              </span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-800/30 border border-neutral-800/50 flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3 text-blue-400" />
              <span className="text-[9px] font-bold text-neutral-500">
                UPLOAD
              </span>
            </div>
            <p className="text-base font-black text-white">
              {lastUpload}{" "}
              <span className="text-[10px] font-bold text-neutral-600">
                Mbps
              </span>
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800">
            <span className="text-[10px] font-bold text-neutral-500">
              LATÊNCIA
            </span>
            <span className="text-[10px] font-bold text-red-400">
              {lastPing} ms
            </span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
}
