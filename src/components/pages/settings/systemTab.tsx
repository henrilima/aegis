import { invoke } from "@tauri-apps/api/core";
import { Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SystemTabProps {
  startAtLogin: boolean;
  minimizeOnClose: boolean;
  startMinimized: boolean;
  updateSystemConfig: (
    key: "minimize" | "autostart" | "minimized",
    value: boolean,
  ) => void;
}

export function SystemTab({
  startAtLogin,
  minimizeOnClose,
  startMinimized,
  updateSystemConfig,
}: SystemTabProps) {
  return (
    <div className="space-y-3 max-w-2xl">
      <SectionHeading>Comportamento do App</SectionHeading>
      <p className="text-sm text-neutral-500 mb-4">
        Configure como o Aegis interage com o Windows.
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

      <div className="pt-4 border-t border-neutral-800 mt-2">
        <SectionHeading>Processo</SectionHeading>
        <p className="text-sm text-neutral-500 mb-4">
          Encerre o Aegis completamente. O processo será reiniciado
          automaticamente se estiver configurado para iniciar com o Windows.
        </p>
        <Button
          onClick={() => invoke("quit_app")}
          variant="secondary"
          className="w-full mt-3 justify-center gap-2 text-red-500 hover:text-red-500 bg-red-500/10 hover:bg-red-500/25 font-bold cursor-pointer"
        >
          <Power className="w-4 h-4" />
          Encerrar Completamente
        </Button>
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
  return (
    <p className="text-xs font-black uppercase  text-neutral-500 flex items-center gap-1.5">
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
  return (
    <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-900/80 transition-colors">
      <div>
        <Label className="text-sm font-bold cursor-pointer">{label}</Label>
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
