"use client";

import { ChevronDown, Mail, Shield, User } from "lucide-react";
import { FeedbackSection, TermsContent } from "@/components/forms/TermsContent";

interface ProfileTabProps {
  username: string;
  email: string;
}

export function ProfileTab({ username, email }: ProfileTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-6 p-6 bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />

        <div className="w-20 h-20 rounded-2xl bg-amber-500 flex items-center justify-center text-3xl font-black text-black shrink-0 transition-transform">
          {username[0]?.toUpperCase()}
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white ">{username}</h2>
          <div className="flex items-center gap-2 mt-1.5 p-1 px-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-lg w-fit">
            <Mail className="w-3.5 h-3.5 text-amber-500/70" />
            <span className=" text-neutral-400 font-medium">{email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-bold text-neutral-500 ml-1">
              Informações da conta local
            </p>
            <FieldRow icon={User} label="Nome de Usuário" value={username} />
            <FieldRow icon={Mail} label="Endereço de E-mail" value={email} />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-sm hover:border-neutral-700 transition-all duration-300 group">
            <FeedbackSection />
          </div>
        </div>

        <div className="flex flex-col p-6 bg-neutral-900 border border-neutral-800 rounded-3xl space-y-5 relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Shield className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-neutral-500">
                  Privacidade e dados
                </p>
                <h3 className=" font-bold text-white">Transparência Aegis</h3>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 animate-pulse">
                <ChevronDown className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-500 uppercase">
                  Scroll
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-neutral-950/50 border border-neutral-800/50 rounded-2xl p-4 overflow-hidden relative">
            <TermsContent className="max-h-[350px]" hideFeedback={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl hover:border-neutral-700 transition-colors group shadow-sm">
      <div className="p-2.5 bg-neutral-800 rounded-xl border border-neutral-700 group-hover:border-amber-500/30 group-hover:bg-amber-500/5 transition-all">
        <Icon className="w-4 h-4 text-neutral-500 group-hover:text-amber-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neutral-500 mb-0.5">
          {label}
        </p>
        <p className="font-bold  text-neutral-200 truncate">{value}</p>
      </div>
    </div>
  );
}
