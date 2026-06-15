"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart2,
  Book,
  type LucideIcon,
  Search,
  Timer,
} from "lucide-react";
import { THEME_COLORS_CONFIG } from "@/colors.config";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { useNavigation } from "@/context/NavigationContext";
import { useTheme } from "@/context/ThemeContext";
import { changeModule, cn, getColorTheme, toHoverClass } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { Kbd } from "../ui/kbd";

// Tipos
export interface ModuleTab {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

export interface ModuleAction {
  id: string;
  label?: string;
  icon: LucideIcon;
  tooltip?: string;
  onClick: () => void;
  /** Se true, renderiza como botão primário (sólido com a cor do módulo) */
  primary?: boolean;
  warning?: boolean;
}

// Atalhos de módulos complementares
const _modulesIntegrations = ["dictionary"];

export interface ModuleHeaderProps {
  /** Cor identitária do módulo (ex: "blue", "orange", "violet", "teal", "amber") */
  color: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  actions?: ModuleAction[];
  // Tabs opcionais
  tabs?: ModuleTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  // Barra de pesquisa opcional
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  integrations?: string[];
  onBack?: () => void;
}

interface Integration {
  tooltip: string;
  label: string;
  color: string;
  icon: LucideIcon;
  action: () => void;
  kbd?: string;
}

const integrationsData: Record<string, Integration> = {
  dictionary: {
    tooltip: "Acesse o Módulo de Dicionário",
    label: "Dicionário",
    kbd: "alt+shift+D",
    color: getModuleColor("dictionary"),
    icon: Book,
    action: () => changeModule("dictionary"),
  },
  pomodoro: {
    tooltip: "Acesse o Módulo Pomodoro",
    label: "Pomodoro",
    color: getModuleColor("pomodoro"),
    icon: Timer,
    action: () => changeModule("pomodoro"),
  },
  grades: {
    tooltip: "Simulados & Notas",
    label: "Notas",
    color: getModuleColor("grades"),
    icon: BarChart2,
    action: () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("open-grades-module"));
      }
    },
  },
};

// Componente
export function ModuleHeader({
  color,
  title,
  subtitle,
  icon: Icon,
  actions = [],
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Pesquisar...",
  integrations,
  onBack,
}: ModuleHeaderProps) {
  const m = getColorTheme(color as string);
  const { appMode } = useTheme();
  const { navigate, previousRoute } = useNavigation();

  const filteredActions = actions;

  const iconBox = cn("p-2 rounded-xl border transition-all", m.bg, m.border);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Linha superior: identidade + ações */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Identidade do módulo */}
        <div className="flex items-center gap-3">
          {(appMode !== "default" ||
            onBack ||
            (previousRoute && previousRoute !== "dashboard")) && (
            <ToolTip
              content={
                onBack || previousRoute ? "Voltar" : "Voltar para o início"
              }
            >
              <button
                type="button"
                onClick={() => {
                  if (onBack) {
                    onBack();
                  } else if (previousRoute) {
                    navigate(previousRoute);
                  } else {
                    navigate("dashboard");
                  }
                }}
                className="p-2 rounded-xl border border-border bg-card hover:bg-accent/50 transition-all cursor-pointer mr-1"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
              </button>
            </ToolTip>
          )}
          <div className={iconBox}>
            <Icon className={cn("w-5 h-5", m.text)} />
          </div>
          <div>
            <h1 className="text-xl font-semibold leading-none">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Integrações */}
          {integrations && (
            <div className="flex gap-2 flex-wrap">
              {integrations.map((integrationId) => {
                const integration = integrationsData[integrationId];
                if (!integration) return null;

                const moduleTheme =
                  THEME_COLORS_CONFIG[
                    integration.color as keyof typeof THEME_COLORS_CONFIG
                  ];
                if (!moduleTheme) return null;

                return (
                  <ToolTip
                    key={integration.tooltip}
                    content={integration.tooltip}
                  >
                    <button
                      type="button"
                      onClick={integration.action}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer text-xs font-semibold",
                        moduleTheme.bg,
                        moduleTheme.bgHover,
                        moduleTheme.border,
                        moduleTheme.text,
                      )}
                    >
                      <integration.icon className="w-4 h-4" />
                      {integration.label}
                      {integration.kbd && <Kbd>{integration.kbd}</Kbd>}
                    </button>
                  </ToolTip>
                );
              })}
            </div>
          )}
          {filteredActions.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {filteredActions.map((action) =>
                action.primary ? (
                  <ToolTip
                    key={action.id}
                    content={action.tooltip ?? action.label}
                  >
                    <button
                      type="button"
                      onClick={action.onClick}
                      className={cn(
                        "flex items-center rounded-xl text-white font-semibold text-xs transition-all cursor-pointer active:scale-95",
                        action.label ? "px-4 py-2 gap-2" : "p-2",
                        m.solid,
                        m.solidHover,
                      )}
                    >
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  </ToolTip>
                ) : action.warning ? (
                  <ToolTip
                    key={action.id}
                    content={action.tooltip ?? action.label}
                  >
                    <button
                      type="button"
                      onClick={action.onClick}
                      className={cn(
                        "flex items-center rounded-xl bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer text-xs font-semibold border border-amber-500/20 text-amber-600 dark:text-amber-500",
                        action.label ? "px-3 py-2 gap-2" : "p-2",
                      )}
                    >
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  </ToolTip>
                ) : (
                  <ToolTip
                    key={action.id}
                    content={action.tooltip ?? action.label}
                  >
                    <button
                      type="button"
                      onClick={action.onClick}
                      className={cn(
                        "flex items-center rounded-xl bg-card hover:bg-accent/50 transition-all cursor-pointer text-xs font-semibold border border-border text-muted-foreground",
                        action.label ? "px-3 py-2 gap-2" : "p-2",
                        toHoverClass(m.text),
                      )}
                    >
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  </ToolTip>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Linha inferior: tabs + pesquisa */}
      {(tabs || onSearchChange) && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tabs */}
          {tabs && onTabChange && (
            <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl w-full sm:w-fit h-11 overflow-x-auto scrollbar-none shrink-0">
              <div className="flex items-center gap-1 h-full min-w-max">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onTabChange(t.id)}
                    className={cn(
                      "relative flex items-center justify-center gap-2 px-4 h-full rounded-lg text-xs font-semibold transition-colors cursor-pointer border select-none focus:outline-none z-10",
                      activeTab === t.id
                        ? cn(m.text)
                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    {activeTab === t.id && (
                      <motion.div
                        layoutId="activeHeaderTab"
                        className={cn(
                          "absolute inset-0 rounded-lg -z-10 border",
                          m.bg,
                          m.border,
                        )}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    {t.icon && <t.icon className="w-4 h-4" />}
                    {t.label}
                    {t.count !== undefined && (
                      <span
                        className={cn(
                          "ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold min-w-[20px] text-center flex items-center justify-center transition-all",
                          activeTab === t.id
                            ? cn(m.text, m.bg, m.border)
                            : "bg-muted text-muted-foreground border border-border/50",
                        )}
                      >
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Barra de pesquisa opcional */}
          {onSearchChange && (
            <div className="relative flex-1 min-w-[180px] max-w-xs h-11">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && onSearchChange("")}
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full h-full pl-10 pr-4 text-xs font-medium bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground transition-all outline-none",
                  m.borderHover.replace("hover:", "focus:"),
                )}
              />
            </div>
          )}
        </div>
      )}
      <div className="w-full h-px bg-border/50 mt-1" />
    </div>
  );
}
