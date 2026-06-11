"use client";

import {
  Github,
  Heart,
  Mail,
  MessageSquare,
  ShieldCheck,
  Star,
} from "lucide-react";
import { APP_CONFIG } from "@/app.config";
import { FeedbackSection, TermsContent } from "@/components/auth/TermsContent";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export function AboutTab() {
  const { themeStyles: theme } = useTheme();

  return (
    <div className="space-y-10 w-full animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <section className="space-y-2">
        <h3 className="text-3xl font-black text-foreground">
          Sobre o {APP_CONFIG.name}
        </h3>
        <p className="text-muted-foreground font-medium">
          Criado com foco em produtividade, privacidade e elegância.
        </p>
      </section>

      {/* Grid de Informações da Versão */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AboutCard
          label="Versão"
          value={APP_CONFIG.version}
          subtext={`${APP_CONFIG.stage} • ${APP_CONFIG.codename}`}
        />
        <AboutCard
          label="Desenvolvedor"
          value={APP_CONFIG.author}
          subtext={`© ${APP_CONFIG.year} Aegis Project`}
        />
        <AboutCard
          label="Núcleo"
          value="Rust & Tauri"
          subtext="Segurança em nível nativo"
        />
      </section>

      {/* Seção de Feedback e Suporte (Movida do Perfil) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="p-6 bg-card border border-border rounded-2xl relative overflow-hidden group">
            <div
              className={cn(
                "absolute -right-8 -top-8 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity",
                theme.bg,
              )}
            />
            <div className="flex items-center gap-3 mb-4">
              <Star className={cn("w-5 h-5", theme.text)} />
              <h4 className="text-sm font-bold">Dê sua opinião</h4>
            </div>
            <FeedbackSection />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold px-1">Canais Oficiais</h4>
            <div className="grid grid-cols-1 gap-2">
              <SupportLink
                icon={Github}
                label="GitHub"
                value="Repositório"
                href={APP_CONFIG.support.github}
              />
              <SupportLink
                icon={MessageSquare}
                label="Discord"
                value="Comunidade"
                href={APP_CONFIG.support.discordserver}
              />
              <SupportLink
                icon={Mail}
                label="E-mail"
                value={APP_CONFIG.support.email}
                href={`mailto:${APP_CONFIG.support.email}`}
              />
            </div>
          </div>
        </div>

        {/* Privacidade (Movida do Perfil) */}
        <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className={cn("w-5 h-5", theme.text)} />
            <h4 className="text-sm font-bold">Privacidade e Transparência</h4>
          </div>
          <div className="bg-background/40 border border-border/50 rounded-xl p-4">
            <TermsContent hideFeedback={true} />
          </div>
        </div>
      </section>

      {/* Footer / Love */}
      <footer className="pt-8 border-t border-border flex flex-col items-center text-center gap-4">
        <Heart className={cn("w-6 h-6 animate-pulse", theme.text)} />
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          Obrigado por apoiar software independente e focado no usuário.
        </p>
      </footer>
    </div>
  );
}

function AboutCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="p-6 bg-card border border-border rounded-2xl space-y-2">
      <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
      <p className="text-xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  );
}

function SupportLink({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-accent/50 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "p-2.5 rounded-lg bg-accent group-hover:bg-background transition-colors",
          )}
        >
          <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground">{label}</p>
          <p className="text-sm font-bold text-foreground">{value}</p>
        </div>
      </div>
    </a>
  );
}
