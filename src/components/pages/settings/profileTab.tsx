"use client";

import { Edit2, Mail, Shield, User } from "lucide-react";
import { useState } from "react";
import ChangeUsernameModal from "@/components/forms/ChangeUsernameModal";
import { FeedbackSection, TermsContent } from "@/components/forms/TermsContent";
import { useTheme } from "@/context/ThemeContext";
import { getThemeColor } from "@/lib/utils";

interface ProfileTabProps {
  username: string;
  email: string;
}

export function ProfileTab({ username, email }: ProfileTabProps) {
  const { themeStyles: theme } = useTheme();
  const [showEditName, setShowEditName] = useState(false);

  return (
    <div className="space-y-6 ">
      {showEditName && (
        <ChangeUsernameModal onClose={() => setShowEditName(false)} />
      )}

      <div className="flex items-center gap-6 p-6 bg-card border border-border rounded-xl overflow-hidden relative group">
        <div
          className={`absolute top-0 right-0 w-32 h-32 ${theme.bg.replace("10", "5")} blur-3xl rounded-full -mr-16 -mt-16 group-hover:${theme.bg} transition-colors`}
        />

        <div
          className={`w-20 h-20 rounded-xl ${theme.solid} flex items-center justify-center text-3xl font-bold text-accent-foreground shrink-0 transition-transform`}
        >
          {username[0]?.toUpperCase()}
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-foreground">{username}</h2>
          <div className="flex items-center gap-2 mt-1.5 p-1 px-2.5 bg-accent rounded-lg w-fit">
            <Mail className={`w-3.5 h-3.5 text-accent-foreground`} />
            <span className=" text-accent-foreground font-medium">{email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground ml-1">
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

          <div className="p-4 bg-card border border-border rounded-xl hover:border-border transition-all duration-300 group">
            <FeedbackSection />
          </div>
        </div>

        <div className="flex flex-col p-6 bg-card border border-border rounded-xl space-y-5 relative">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 ${theme.bg} rounded-xl border ${theme.border}`}
            >
              <Shield className={`w-4 h-4 ${theme.text}`} />
            </div>
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-muted-foreground">
                  Privacidade e dados
                </p>
                <h3 className=" font-bold text-foreground">
                  Transparência Aegis
                </h3>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-background/50 border border-border/50 rounded-xl p-4 overflow-hidden relative">
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
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-border transition-colors group">
      <div
        className={`p-2.5 bg-accent rounded-xl group-hover:${theme.border.replace("20", "30")} group-hover:${theme.bg.replace("10", "5")} transition-all`}
      >
        <Icon
          className={`w-4 h-4 text-muted-foreground group-hover:${theme.text}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className="font-bold  text-foreground truncate">{value}</p>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={`px-3 py-1.5 rounded-lg bg-accent text-xs font-bold text-muted-foreground hover:bg-accent/80 flex items-center gap-2 cursor-pointer`}
        >
          <Edit2 className="w-3 h-3" />
          Alterar
        </button>
      )}
    </div>
  );
}
