import {
  Github,
  Heart,
  type LucideIcon,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import { APP_CONFIG } from "@/app.config";
import { getThemeColor } from "@/lib/utils";

export function AboutTab() {
  const theme = getThemeColor();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold">Sobre o {APP_CONFIG.name}</h2>
        <p className=" text-neutral-500 mt-1">
          Informações sobre a versão atual e suporte do projeto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Developer Card - Modified */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 ${theme.bg} rounded-lg`}>
              <User className={`w-4 h-4 ${theme.text}`} />
            </div>
            <span className=" font-bold text-neutral-300">Desenvolvedor</span>
          </div>
          <p className="text-lg font-black text-white">{APP_CONFIG.author}</p>
          <p className="text-xs text-neutral-500 italic">
            © {APP_CONFIG.year} Todos os direitos reservados
          </p>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`${theme.bg} rounded-lg w-7 h-7 flex items-center justify-center`}
            >
              <span
                className={`text-[14px] font-semibold ${theme.text} uppercase`}
              >
                V
              </span>
            </div>
            <span className=" font-bold text-neutral-300">Versão Atual</span>
          </div>
          <p className="text-lg font-black text-white">{APP_CONFIG.version}</p>
          <p className="text-xs text-neutral-500 uppercase">
            {APP_CONFIG.stage} • {APP_CONFIG.codename}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-black uppercase text-neutral-500 flex items-center gap-1.5">
          Canais de Suporte
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

      {/* Gratitude Section */}
      <div
        className={`mt-8 p-6 border ${theme.border} ${theme.bg} rounded-xl text-center relative overflow-hidden group border-l-4 ${theme.border.replace("border-", "border-l-")}`}
      >
        <Heart className={`w-8 h-8 ${theme.text} mx-auto mb-3`} />

        <div className="relative z-10">
          <h3 className={`text-base font-bold ${theme.text} mb-1`}>
            Obrigado por usar o {APP_CONFIG.name}!
          </h3>
          <p className=" text-neutral-400 leading-relaxed">
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
  const theme = getThemeColor(); // Added theme here
  const content = (
    <div className="flex items-center justify-between p-3 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:bg-neutral-800/80 transition-all group cursor-pointer">
      <div className="flex items-center gap-3">
        {/* SupportLink icon styling - Modified */}
        <div
          className={`p-2 bg-neutral-800 rounded-lg group-hover:${theme.bg} group-hover:${theme.text} transition-colors`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-neutral-500 font-medium">{label}</p>
          <p className=" font-bold text-neutral-200">{value}</p>
        </div>
      </div>
      {href && (
        <div
          className={`text-[10px] font-black text-neutral-600 uppercase group-hover:${theme.text} transition-colors`}
        >
          Abrir Link
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
