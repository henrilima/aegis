import { invoke } from "@tauri-apps/api/core";
import { Power } from "lucide-react";
import * as React from "react";
import { APP_CONFIG } from "@/app.config";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getThemeColor } from "@/lib/utils";

interface SystemTabProps {
  startAtLogin: boolean;
  minimizeOnClose: boolean;
  startMinimized: boolean;
  updateSystemConfig: (
    key: "minimize" | "autostart" | "minimized",
    value: boolean,
  ) => void;
  weekStartDay: number;
  updateWeekStart: (value: number) => Promise<void>;
  handleInternalCommand: (command: string) => Promise<void>;
}

export function SystemTab({
  startAtLogin,
  minimizeOnClose,
  startMinimized,
  updateSystemConfig,
  weekStartDay,
  updateWeekStart,
  handleInternalCommand,
}: SystemTabProps) {
  const [internalCmd, setInternalCmd] = React.useState("");
  const theme = getThemeColor();
  return (
    <div className="space-y-3 max-w-2xl">
      <SectionHeading>Comportamento do App</SectionHeading>
      <p className=" text-neutral-500 mb-4">
        Configure como o {APP_CONFIG.name} interage com o Windows.
      </p>

      <ToggleRow
        label="Auto-start (Login)"
        description="Iniciar automaticamente ao ligar o PC."
        checked={startAtLogin}
        onChange={(v) => updateSystemConfig("autostart", v)}
      />

      <ToggleRow
        label="Iniciar Minimizado"
        description="Ao iniciar com o Windows, abre no Tray sem mostrar a janela."
        checked={startMinimized}
        onChange={(v) => updateSystemConfig("minimized", v)}
      />

      <ToggleRow
        label="Executar em Segundo Plano"
        description="Minimiza para o Tray ao clicar no X."
        checked={minimizeOnClose}
        onChange={(v) => updateSystemConfig("minimize", v)}
      />

      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <span className="text-sm font-bold text-neutral-200">
              Início da Semana
            </span>
            <p className="text-xs text-neutral-500 mt-0.5">
              Define qual o primeiro dia exibido nos módulos de estudo.
            </p>
          </div>
          <div className="flex gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => updateWeekStart(0)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${weekStartDay === 0 ? `${theme.bg} ${theme.text} border ${theme.border}` : "text-neutral-600 hover:text-neutral-400"}`}
            >
              DOM
            </button>
            <button
              type="button"
              onClick={() => updateWeekStart(1)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${weekStartDay === 1 ? `${theme.bg} ${theme.text} border ${theme.border}` : "text-neutral-600 hover:text-neutral-400"}`}
            >
              SEG
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-800 mt-2">
        <SectionHeading>Processo</SectionHeading>
        <p className=" text-neutral-500 mb-4">
          Encerre o {APP_CONFIG.name} completamente. O processo será reiniciado
          automaticamente se estiver configurado para iniciar com o Windows.
        </p>
        <Button
          onClick={() => invoke("quit_app")}
          variant="secondary"
          className="w-full mt-3 justify-center gap-2 text-red-500 hover:text-red-500 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 font-bold cursor-pointer"
        >
          <Power className="w-4 h-4" />
          Encerrar Completamente
        </Button>
      </div>

      <div className="pt-4 border-t border-neutral-800 mt-2 opacity-30 focus-within:opacity-100 transition-opacity">
        <SectionHeading>Configurações Internas</SectionHeading>
        <p className="text-sm text-neutral-200 mb-2">
          <span className="font-bold text-amber-500">
            Área restrita para manutenção e testes do sistema
          </span>
          , não tente utilizar se não for orientado nem souber o que está
          fazendo, pois pode causar instabilidade e perda de dados.
        </p>
        <input
          type="text"
          value={internalCmd}
          onChange={(e) => setInternalCmd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && internalCmd.trim()) {
              handleInternalCommand(internalCmd);
              setInternalCmd("");
            }
          }}
          placeholder="Aguardando comando..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-neutral-400 focus:outline-none focus:border-neutral-700 transition-all"
        />
      </div>
    </div>
  );
}

function SectionHeading({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ElementType;
}) {
  const theme = getThemeColor();
  return (
    <p
      className={`text-xs font-black uppercase ${theme.text} flex items-center gap-1.5`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </p>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const theme = getThemeColor();
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className={`flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-900/80 hover:${theme.border.replace("20", "40")} transition-all group cursor-pointer`}
    >
      <div className="flex-1">
        <span
          className={`text-sm font-bold transition-colors text-neutral-200`}
        >
          {label}
        </span>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
