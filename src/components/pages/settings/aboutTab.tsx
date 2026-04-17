import {
  Github,
  Heart,
  type LucideIcon,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import { APP_CONFIG } from "@/app.config";
import { useTheme } from "@/context/ThemeContext";

export function AboutTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <p className="text-xl font-bold">Sobre o {APP_CONFIG.name}</p>
        <p className="text-md text-muted-foreground mt-1">
          Informações sobre a versão atual e suporte do projeto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-card border border-border rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 bg-accent rounded-lg`}>
              <User className={`w-4 h-4 text-muted-foreground`} />
            </div>
            <span className=" font-medium text-muted-foreground">
              Desenvolvedor
            </span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {APP_CONFIG.author}
          </p>
          <p className="text-xs text-muted-foreground">
            © {APP_CONFIG.year} Todos os direitos reservados
          </p>
        </div>

        <div className="p-4 bg-card border border-border rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`bg-accent rounded-lg w-7 h-7 flex items-center justify-center`}
            >
              <span
                className={`text-[14px] font-medium text-muted-foreground uppercase`}
              >
                V
              </span>
            </div>
            <span className=" font-medium text-muted-foreground">
              Versão Atual
            </span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {APP_CONFIG.version}
          </p>
          <p className="text-xs text-muted-foreground uppercase">
            {APP_CONFIG.stage} • {APP_CONFIG.codename}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
          Canais de suporte
        </p>

        <div className="grid grid-cols-1 gap-2">
          <SupportLink
            icon={Github}
            label="GitHub Repository"
            value={APP_CONFIG.support.github}
            href={APP_CONFIG.support.github}
          />
          <SupportLink
            icon={Mail}
            label="E-mail de Suporte"
            value={APP_CONFIG.support.email}
            href={`mailto:${APP_CONFIG.support.email}`}
          />
          <SupportLink
            icon={MessageSquare}
            label="Servidor no Discord"
            value={APP_CONFIG.support.discordserver}
            href={APP_CONFIG.support.discordserver}
          />
        </div>
      </div>

      {/* Seção de agradecimento */}
      <div
        className={`mt-8 p-6 rounded-xl text-center relative overflow-hidden group`}
      >
        <Heart className={`w-8 h-8 text-foreground mx-auto mb-3`} />

        <div className="relative z-10">
          <h3 className={`text-base font-bold text-foreground mb-1`}>
            Obrigado por usar o {APP_CONFIG.name}!
          </h3>
          <p className=" text-muted-foreground leading-relaxed">
            Seu feedback é fundamental para o crescimento deste projeto. Se
            encontrar bugs ou tiver sugestões, não hesite em nos contatar
            através dos canais acima.
          </p>
        </div>
      </div>
    </div>
  );
}

function SupportLink({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  const { themeStyles: theme } = useTheme();
  const content = (
    <div className="flex items-center justify-between p-3 bg-card/50 border border-border rounded-xl hover:bg-accent/50/80 transition-all group cursor-pointer">
      <div className="flex items-center gap-3">
        {/* Link de suporte */}
        <div
          className={`p-2 bg-accent  rounded-lg group-hover:${theme.bg} group-hover:${theme.text} transition-colors`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className=" font-bold text-foreground">{value}</p>
        </div>
      </div>
      {href && (
        <div
          className={`text-[10px] font-bold text-muted-foreground group-hover:${theme.text} transition-colors`}
        >
          Abrir link
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block outline-none"
      >
        {content}
      </a>
    );
  }

  return content;
}
