"use client";

import { ChevronDown, Edit2, Mail, Shield, User } from "lucide-react";
import { useState } from "react";
import ChangeUsernameModal from "@/components/forms/ChangeUsernameModal";
import { FeedbackSection, TermsContent } from "@/components/forms/TermsContent";
import { getThemeColor } from "@/lib/utils";

interface ProfileTabProps {
  username: string;
  email: string;
}

export function ProfileTab({ username, email }: ProfileTabProps) {
  const theme = getThemeColor();
  const [showEditName, setShowEditName] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {showEditName && (
        <ChangeUsernameModal onClose={() => setShowEditName(false)} />
      )}

      <div className="flex items-center gap-6 p-6 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden relative group">
        <div
          className={`absolute top-0 right-0 w-32 h-32 ${theme.bg.replace("10", "5")} blur-3xl rounded-full -mr-16 -mt-16 group-hover:${theme.bg} transition-colors`}
        />

        <div
          className={`w-20 h-20 rounded-xl ${theme.solid} flex items-center justify-center text-3xl font-black text-black shrink-0 transition-transform`}
        >
          {username[0]?.toUpperCase()}
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white ">{username}</h2>
          <div className="flex items-center gap-2 mt-1.5 p-1 px-2.5 bg-neutral-800/50 border border-neutral-700/50 rounded-lg w-fit">
            <Mail className={`w-3.5 h-3.5 ${theme.text}/70`} />
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
            <FieldRow
              icon={User}
              label="Nome de Usuário"
              value={username}
              onEdit={() => setShowEditName(true)}
            />
            <FieldRow icon={Mail} label="Endereço de E-mail" value={email} />
          </div>

          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl shadow-sm hover:border-neutral-700 transition-all duration-300 group">
            <FeedbackSection />
          </div>
        </div>

        <div className="flex flex-col p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-5 relative">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 ${theme.bg} rounded-xl border ${theme.border}`}
            >
              <Shield className={`w-4 h-4 ${theme.text}`} />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-neutral-500">
                  Privacidade e dados
                </p>
                <h3 className=" font-bold text-white">Transparência Aegis</h3>
              </div>
              <div
                className={`flex items-center gap-1.5 px-2 py-1 ${theme.bg} rounded-lg border ${theme.border} animate-pulse`}
              >
                <ChevronDown className={`w-3 h-3 ${theme.text}`} />
                <span
                  className={`text-[10px] font-bold ${theme.text} uppercase`}
                >
                  Scroll
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-neutral-950/50 border border-neutral-800/50 rounded-xl p-4 overflow-hidden relative">
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
  onEdit,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  const theme = getThemeColor();
  return (
    <div className="flex items-center gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors group shadow-sm">
      <div
        className={`p-2.5 bg-neutral-800 rounded-xl border border-neutral-700 group-hover:${theme.border.replace("20", "30")} group-hover:${theme.bg.replace("10", "5")} transition-all`}
      >
        <Icon
          className={`w-4 h-4 text-neutral-500 group-hover:${theme.text}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-neutral-500 mb-0.5">{label}</p>
        <p className="font-bold  text-neutral-200 truncate">{value}</p>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={`px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-[10px] font-black text-neutral-500 uppercase hover:text-white hover:border-neutral-500 transition-all flex items-center gap-2 cursor-pointer group/btn`}
        >
          <Edit2 className="w-3 h-3 group-hover/btn:scale-110 transition-transform" />
          Alterar
        </button>
      )}
    </div>
  );
}
