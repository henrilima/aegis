"use client";

import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Zap } from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";
import type { ThemeColorKey } from "@/lib/utils";
import { cn, getColorTheme } from "@/lib/utils";

//  Context

interface ModuleColorCtx {
  color: ThemeColorKey;
  theme: ReturnType<typeof getColorTheme>;
}

const ModuleColorContext = createContext<ModuleColorCtx | null>(null);

export function ModuleColorProvider({
  color,
  children,
}: {
  color: ThemeColorKey;
  children: ReactNode;
}) {
  return (
    <ModuleColorContext.Provider value={{ color, theme: getColorTheme(color) }}>
      {children}
    </ModuleColorContext.Provider>
  );
}

export function useModuleColor() {
  const ctx = useContext(ModuleColorContext);
  if (!ctx)
    throw new Error("useModuleColor must be used inside ModuleColorProvider");
  return ctx;
}

//  InfoSection
/**
 * Seção de conteúdo dentro de um InfoModal com ícone e título coloridos.
 *
 * @example
 * <InfoSection icon={TrendingUp} title="Hábitos Positivos">
 *   ...content...
 * </InfoSection>
 */
export function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  const { theme } = useModuleColor();
  return (
    <section className="space-y-4">
      <div className={cn("flex items-center gap-3", theme.textSub)}>
        <Icon className="w-5 h-5" />
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      <div className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-3">
        {children}
      </div>
    </section>
  );
}

//  FeatureGrid
/**
 * Grade de features com ícone CheckCircle colorido e label + descrição.
 *
 * @example
 * <FeatureGrid items={[{ label: "Streaks", desc: "Dias consecutivos" }]} />
 */
export function FeatureGrid({
  items,
}: {
  items: { label: string; desc: string }[];
}) {
  const { theme } = useModuleColor();
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-start gap-2 bg-black/20 p-2.5 rounded-lg border border-border/50"
        >
          <CheckCircle2
            className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", theme.text)}
          />
          <div>
            <p className="text-xs font-bold text-foreground">{item.label}</p>
            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

//  StatRow
/**
 * Par chave/valor estilizado com valor colorido.
 *
 * @example
 * <StatRow label="Velocidade média" value="Páginas por minuto" />
 */
export function StatRow({ label, value }: { label: string; value: string }) {
  const { theme } = useModuleColor();
  return (
    <div className="flex justify-between items-center text-xs p-2 bg-black/20 rounded-lg border border-border/50">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-bold", theme.textSub)}>{value}</span>
    </div>
  );
}

//  ProTip
/**
 * Bloco de dica destacada com fundo colorido e ícone Zap.
 *
 * @example
 * <ProTip title="Lembretes Inteligentes">
 *   Ative as notificações...
 * </ProTip>
 */
export function ProTip({
  title,
  icon: Icon = Zap,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  const { theme } = useModuleColor();
  return (
    <div
      className={cn("rounded-xl p-4 flex gap-4 border", theme.bg, theme.border)}
    >
      <div
        className={cn("shrink-0 p-2 rounded-lg h-fit", theme.bg, theme.border)}
      >
        <Icon className={cn("w-4 h-4", theme.text)} />
      </div>
      <div>
        <p className={cn("text-xs font-bold", theme.textDark)}>{title}</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          {children}
        </p>
      </div>
    </div>
  );
}

//  Highlight
/**
 * Span inline colorido para destacar palavras dentro de um parágrafo.
 */
export function Highlight({ children }: { children: ReactNode }) {
  const { theme } = useModuleColor();
  return <span className={cn("font-medium", theme.text)}>{children}</span>;
}

//  InfoCard
/**
 * Card de destaque dentro de uma InfoSection (sem ícone de seção).
 * Útil para sub-cards coloridos ou avisos.
 */
export function InfoCard({
  title,
  children,
  variant = "default",
}: {
  title?: string;
  children: ReactNode;
  variant?: "default" | "accent";
}) {
  const { theme } = useModuleColor();
  return (
    <div
      className={cn(
        "p-3 rounded-lg border",
        variant === "accent"
          ? cn(theme.bg, theme.border)
          : "bg-black/10 border-border/50",
      )}
    >
      {title && (
        <p className={cn("text-xs font-bold mb-1", theme.text)}>{title}</p>
      )}
      <div className="text-[11px] text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}
