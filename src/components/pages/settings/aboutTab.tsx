import { APP_CONFIG } from "@/app.config";
import { Github, Mail, MessageSquare, User, type LucideIcon } from "lucide-react";
import Image from "next/image";

export function AboutTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold">Sobre o {APP_CONFIG.name}</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Informações sobre a versão atual e suporte do projeto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <User className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-sm font-bold text-neutral-300">Desenvolvedor</span>
          </div>
          <p className="text-lg font-black text-white">{APP_CONFIG.author}</p>
          <p className="text-xs text-neutral-500 italic">© {APP_CONFIG.year} Todos os direitos reservados</p>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <span className="text-[10px] font-black text-amber-500 uppercase">v</span>
            </div>
            <span className="text-sm font-bold text-neutral-300">Versão Atual</span>
          </div>
          <p className="text-lg font-black text-white">{APP_CONFIG.version}</p>
          <p className="text-xs text-neutral-500 uppercase tracking-widest">{APP_CONFIG.stage} • {APP_CONFIG.codename}</p>
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
            label="Discord" 
            value={APP_CONFIG.support.discord}
          />
        </div>
      </div>

      <div className="p-6 bg-linear-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-base font-bold text-amber-500 mb-1">Obrigado por usar o {APP_CONFIG.name}!</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Seu feedback é fundamental para o crescimento deste projeto. 
            Se encontrar bugs ou tiver sugestões, não hesite em nos contatar através dos canais acima.
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Image src="/favicon.ico" alt="Logo" width={128} height={128} className="grayscale" />
        </div>
      </div>
    </div>
  );
}

function SupportLink({ 
  icon: Icon, 
  label, 
  value, 
  href 
}: { 
  icon: LucideIcon, 
  label: string, 
  value: string,
  href?: string
}) {
  const content = (
    <div className="flex items-center justify-between p-3 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:bg-neutral-800/80 transition-all group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-neutral-800 rounded-lg group-hover:bg-amber-500/20 group-hover:text-amber-500 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-neutral-500 font-medium">{label}</p>
          <p className="text-sm font-bold text-neutral-200">{value}</p>
        </div>
      </div>
      {href && (
        <div className="text-[10px] font-black text-neutral-600 uppercase group-hover:text-amber-500 transition-colors">
          Abrir Link
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block outline-none">
        {content}
      </a>
    );
  }

  return content;
}

