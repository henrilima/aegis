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
import { type ReactNode, useState } from "react";
import { THEME_COLORS_CONFIG } from "@/colors.config";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { type ModuleId, useModules } from "@/context/ModuleContext";
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
  subtitle?: ReactNode;
  icon: LucideIcon;
  /** ID explícito do módulo para recuperar preferências de usuário */
  moduleId?: ModuleId;
  /** Badge/Tag opcional de status ao lado do título */
  badge?: ReactNode;
  /** Fixa o cabeçalho no topo com transparência durante a rolagem */
  sticky?: boolean;
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
  onTitleClick?: () => void;
  titleHoverIcon?: LucideIcon;
  titleTooltip?: string;
  /** Slot para elementos/controles customizados no canto direito */
  rightSlot?: ReactNode;
  children?: ReactNode;
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
    tooltip: "Acesse o módulo de dicionário",
    label: "Dicionário",
    kbd: "alt+shift+D",
    color: getModuleColor("dictionary"),
    icon: Book,
    action: () => changeModule("dictionary"),
  },
  pomodoro: {
    tooltip: "Acesse o módulo Pomodoro",
    label: "Pomodoro",
    color: getModuleColor("pomodoro"),
    icon: Timer,
    action: () => changeModule("pomodoro"),
  },
  grades: {
    tooltip: "Simulados e notas",
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

function resolveModuleId(
  _color: string,
  title: string,
  explicitId?: ModuleId,
): ModuleId | null {
  if (explicitId) return explicitId;
  const t = title.toLowerCase();
  if (t.includes("tarefa")) return "tasks";
  if (t.includes("estudo") || t.includes("matéria")) return "studies";
  if (t.includes("anotaç") || t.includes("nota")) return "notes";
  if (t.includes("pomodoro")) return "pomodoro";
  if (t.includes("leitura") || t.includes("livro")) return "reading";
  if (t.includes("dicionário") || t.includes("dicionario")) return "dictionary";
  if (t.includes("alarme")) return "alarms";
  if (t.includes("sono") || t.includes("sonho")) return "sleep";
  if (t.includes("calendário") || t.includes("calendario")) return "calendar";
  if (t.includes("senha") || t.includes("cofre")) return "passwords";
  if (t.includes("filme")) return "movies";
  if (t.includes("hábito") || t.includes("habito")) return "habits";
  if (t.includes("estatística") || t.includes("estatistica"))
    return "statistics";
  if (t.includes("flashcard")) return "flashcards";
  if (t.includes("conquista")) return "achievements";
  if (t.includes("simulado") || t.includes("nota")) return "grades";
  return null;
}

// Componente
export function ModuleHeader({
  color,
  title,
  subtitle,
  icon: Icon,
  moduleId,
  badge,
  sticky,
  actions = [],
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Pesquisar...",
  integrations,
  onBack,
  onTitleClick,
  titleHoverIcon,
  titleTooltip,
  rightSlot,
  children,
}: ModuleHeaderProps) {
  const m = getColorTheme(color as string);
  const { appMode } = useTheme();
  const { navigate, previousRoute } = useNavigation();
  const { isModuleEnabled, isStickyHeaderEnabled } = useModules();
  const [isTitleHovered, setIsTitleHovered] = useState(false);

  // Mapeia o ID real do módulo a partir de prop, título ou contexto
  const targetModuleId = resolveModuleId(color, title, moduleId);
  const isSticky =
    sticky !== undefined
      ? sticky
      : targetModuleId
        ? isStickyHeaderEnabled(targetModuleId)
        : false;

  const filteredActions = actions;

  const iconBox = cn(
    "p-2.5 rounded-2xl border transition-all duration-300 flex items-center justify-center shrink-0",
    m.bg,
    m.border,
  );
  const TitleIcon = isTitleHovered && titleHoverIcon ? titleHoverIcon : Icon;

  const renderTitleContent = () => (
    <>
      <div
        className={cn(
          iconBox,
          onTitleClick && "group-hover:border-border group-hover:bg-accent/80",
        )}
      >
        <TitleIcon
          className={cn(
            "w-5 h-5 transition-transform duration-300",
            m.text,
            onTitleClick && "group-hover:scale-110",
          )}
        />
      </div>
      <div className="text-left flex flex-col justify-center">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1
            className={cn(
              "text-xl sm:text-2xl font-bold tracking-tight leading-tight flex items-center gap-2 transition-colors duration-200 text-foreground",
              onTitleClick && "group-hover:text-primary",
            )}
          >
            {title}
          </h1>
          {badge && <div className="flex items-center">{badge}</div>}
        </div>
        {subtitle && (
          <div className="text-xs sm:text-sm text-muted-foreground/80 font-medium mt-0.5 transition-colors duration-200">
            {subtitle}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-4 transition-all pt-6 md:pt-8 pb-4 mb-6",
        "w-[calc(100%+3rem)] md:w-[calc(100%+5rem)] -ml-6 md:-ml-10 -mr-6 md:-mr-10 px-6 md:px-10",
        "bg-linear-to-b from-card via-background/95 to-background/80 dark:from-card dark:via-background/95 dark:to-background/80 backdrop-blur-2xl border-b border-border/80",
        m.bg,
        isSticky ? "sticky top-0 z-30" : "relative z-0",
      )}
    >
      {/* Linha superior: Identidade do módulo + Botões de Ação / Slots */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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
                className="p-2.5 rounded-xl border border-border/80 bg-card hover:bg-accent/80 hover:border-border transition-all cursor-pointer shrink-0 text-muted-foreground hover:text-foreground active:scale-95"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </ToolTip>
          )}

          {onTitleClick ? (
            <ToolTip content={titleTooltip || "Clique para abrir"}>
              <button
                type="button"
                onClick={onTitleClick}
                onMouseEnter={() => setIsTitleHovered(true)}
                onMouseLeave={() => setIsTitleHovered(false)}
                className="flex items-center gap-3 group cursor-pointer border-none bg-transparent p-0 outline-none text-left focus:outline-none"
              >
                {renderTitleContent()}
              </button>
            </ToolTip>
          ) : (
            <div className="flex items-center gap-3">
              {renderTitleContent()}
            </div>
          )}
        </div>

        {/* Canto direito: Slots, Integrações e Ações */}
        <div className="flex items-center gap-2.5 flex-wrap ml-auto">
          {rightSlot && (
            <div className="flex items-center gap-2">{rightSlot}</div>
          )}

          {/* Integrações */}
          {integrations && (
            <div className="flex gap-2 flex-wrap">
              {integrations.map((integrationId) => {
                if (
                  (integrationId === "dictionary" ||
                    integrationId === "pomodoro") &&
                  !isModuleEnabled(integrationId)
                ) {
                  return null;
                }

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
                        "flex items-center gap-2 h-10 px-3.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold active:scale-95 hover:brightness-105",
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

          {/* Botões de Ação */}
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
                        "flex items-center rounded-xl text-white font-semibold text-xs transition-all cursor-pointer active:scale-95 border-none",
                        action.label
                          ? "h-10 px-4 gap-2"
                          : "size-10 justify-center",
                        m.solid,
                        m.solidHover,
                      )}
                    >
                      <action.icon className="w-4 h-4 shrink-0" />
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
                        "flex items-center rounded-xl bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer text-xs font-semibold border border-amber-500/20 text-amber-600 dark:text-amber-500 active:scale-95",
                        action.label
                          ? "h-10 px-3.5 gap-2"
                          : "size-10 justify-center",
                      )}
                    >
                      <action.icon className="w-4 h-4 shrink-0" />
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
                        "flex items-center rounded-xl bg-card hover:bg-accent/80 hover:border-border transition-all cursor-pointer text-xs font-semibold border border-border/80 text-muted-foreground hover:text-foreground active:scale-95",
                        action.label
                          ? "h-10 px-3.5 gap-2"
                          : "size-10 justify-center",
                        toHoverClass(m.text),
                      )}
                    >
                      <action.icon className="w-4 h-4 shrink-0" />
                      {action.label}
                    </button>
                  </ToolTip>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Linha Inferior: Abas com generoso Padding + Pesquisa + Children */}
      {(tabs || onSearchChange || children) && (
        <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
          {/* Abas com padding e visual de Segmented Control refinado */}
          {tabs && onTabChange && (
            <div className="flex items-center p-1.5 bg-muted/60 dark:bg-muted/40 border border-border/70 rounded-2xl max-w-full overflow-x-auto scrollbar-none shrink-0 h-11">
              <div className="flex items-center gap-1.5 min-w-max h-full">
                {tabs.map((t) => {
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onTabChange(t.id)}
                      className={cn(
                        "relative flex items-center justify-center gap-2 px-4 h-8 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none focus:outline-none z-10",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/40",
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeModuleHeaderTab"
                          className={cn(
                            "absolute inset-0 rounded-xl -z-10 border transition-colors bg-card shadow-none",
                            m.border,
                          )}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                      {t.icon && (
                        <t.icon
                          className={cn(
                            "w-4 h-4 transition-colors",
                            isActive ? m.text : "text-muted-foreground",
                          )}
                        />
                      )}
                      <span className={cn(isActive && m.text)}>{t.label}</span>
                      {t.count !== undefined && (
                        <span
                          className={cn(
                            "ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold min-w-5 text-center flex items-center justify-center transition-all border",
                            isActive
                              ? cn(m.text, m.bg, m.border)
                              : "bg-muted text-muted-foreground border-border/60",
                          )}
                        >
                          {t.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Barra de Pesquisa Elegante e Espaçosa */}
          {onSearchChange && (
            <div className="relative flex-1 min-w-50 max-w-xs h-10">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && onSearchChange("")}
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full h-full pl-10 pr-9 text-xs font-medium bg-card border border-border/70 rounded-2xl text-foreground placeholder:text-muted-foreground/70 transition-all outline-none focus:border-primary focus:bg-background/95 focus:ring-1 focus:ring-primary/20",
                  m.borderHover.replace("hover:", "focus:"),
                )}
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold"
                  aria-label="Limpar pesquisa"
                >
                  ×
                </button>
              )}
            </div>
          )}

          {/* Children customizados na barra inferior */}
          {children && (
            <div className="flex items-center gap-2 ml-auto">{children}</div>
          )}
        </div>
      )}
    </div>
  );
}
