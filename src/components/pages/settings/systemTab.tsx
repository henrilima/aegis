import { invoke } from "@tauri-apps/api/core";
import { type LucideIcon, Power } from "lucide-react";
import * as React from "react";
import { APP_CONFIG } from "@/app.config";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/context/ThemeContext";
import type { getThemeColor } from "@/lib/utils";
import { CHROMATIC_THEMES } from "@/themes.config";

type ThemeStyles = ReturnType<typeof getThemeColor>;

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
  const { theme, setTheme, themeStyles } = useTheme();

  return (
    <div className="max-w-2xl space-y-6">
      {/* Comportamento do Aplicativo */}
      <section className="space-y-4">
        <div>
          <SectionHeading>Comportamento do app</SectionHeading>
          <p className="text-xs text-muted-foreground mt-1">
            Configure como o {APP_CONFIG.name} se comporta no Windows.
          </p>
        </div>

        <div className="space-y-2">
          <ToggleRow
            label="Auto-start (Login)"
            description="Iniciar automaticamente ao ligar o PC."
            checked={startAtLogin}
            onChange={(v) => updateSystemConfig("autostart", v)}
            themeStyles={themeStyles}
          />
          <ToggleRow
            label="Iniciar Minimizado"
            description="Abre no Tray sem mostrar a janela principal."
            checked={startMinimized}
            onChange={(v) => updateSystemConfig("minimized", v)}
            themeStyles={themeStyles}
          />
          <ToggleRow
            label="Executar em Segundo Plano"
            description="Minimiza para o Tray ao clicar no botão de fechar (X)."
            checked={minimizeOnClose}
            onChange={(v) => updateSystemConfig("minimize", v)}
            themeStyles={themeStyles}
          />
        </div>

        <SettingBox>
          <div className="flex-1">
            <span className="text-sm font-bold">Início da Semana</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Primeiro dia exibido nos módulos de organização.
            </p>
          </div>
          <div className="flex gap-1 p-1 bg-background border border-border rounded-lg">
            {[
              { id: 0, label: "Dom" },
              { id: 1, label: "Seg" },
            ].map((day) => (
              <button
                key={day.id}
                type="button"
                onClick={() => updateWeekStart(day.id)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  weekStartDay === day.id
                    ? `${themeStyles.bg} ${themeStyles.text} border ${themeStyles.border}`
                    : "text-neutral-500 hover:text-muted-foreground"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </SettingBox>
      </section>

      {/* Aparência */}
      <section className="pt-4 border-t border-border space-y-4">
        <SectionHeading>Temas do Aegis</SectionHeading>
        <p className="text-xs text-muted-foreground mt-1">
          Escolha a paleta de cores que define a identidade visual do Aegis.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHROMATIC_THEMES.map((themeOption) => (
            <button
              key={themeOption.id}
              type="button"
              onClick={() => setTheme(themeOption.id)}
              className={`p-4 rounded-xl border transition-all text-left flex gap-3 group cursor-pointer ${
                theme === themeOption.id
                  ? `${themeStyles.bg} ${themeStyles.border.replace("20", "50")}`
                  : "bg-card border-border hover:border-border"
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg shrink-0 border border-border"
                style={{ backgroundColor: themeOption.previewColor }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${theme === themeOption.id ? themeStyles.text : "text-foreground"}`}
                  >
                    {themeOption.label}
                  </span>
                  {theme === themeOption.id && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${themeStyles.solid}`}
                    />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {themeOption.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Operações */}
      <section className="pt-4 border-t border-border space-y-4 text-center">
        <div className="text-left">
          <SectionHeading>Sistema</SectionHeading>
          <p className="text-xs text-muted-foreground mt-1">
            Operações de encerramento do processo.
          </p>
        </div>
        <Button
          onClick={() => invoke("quit_app")}
          variant="secondary"
          className="w-full justify-center gap-2 text-red-500 hover:text-red-500 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 font-bold cursor-pointer"
        >
          <Power className="w-4 h-4" />
          Encerrar Aegis
        </Button>
      </section>

      {/* Manutenção (Debug) */}
      <section className="pt-4 border-t border-border opacity-30 focus-within:opacity-100 transition-opacity space-y-3">
        <SectionHeading>Área Restrita</SectionHeading>
        <p className="text-[11px] text-red-500/80 font-medium">
          Apenas para manutenção e suporte técnico.
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
          placeholder="Comando de sistema..."
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground focus:outline-none focus:border-border transition-all"
        />
      </section>
    </div>
  );
}

// Subcomponentes para Limpeza

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold text-foreground">{children}</h3>;
}

function SettingBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  themeStyles,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  themeStyles: ThemeStyles;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className={`w-full flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-card/80 hover:${themeStyles.border.replace("20", "40")} transition-all cursor-pointer`}
    >
      <div className="flex-1 pr-4">
        <span className="text-sm font-bold">{label}</span>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function _ActionRow({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-accent rounded-xl shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
