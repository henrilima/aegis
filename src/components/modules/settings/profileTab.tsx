"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Calendar,
  Camera,
  Check,
  Cpu,
  Edit2,
  Fingerprint,
  Loader2,
  type LucideIcon,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useAvatar } from "@/hooks/useAvatar";
import { cn } from "@/lib/utils";

// Protocolo de segurança (conforme definido no sistema de recuperação)
const MASTER_ENTRIES = [
  { code: "NX7W2Q4", pass: "aquarius" },
  { code: "K9B5V1R", pass: "pisces" },
  { code: "M3L8Z0X", pass: "aries" },
  { code: "P6Y1H4D", pass: "taurus" },
  { code: "G2N9S3F", pass: "gemini" },
  { code: "J5K7L2M", pass: "cancer" },
  { code: "R8T1V0P", pass: "leo" },
  { code: "C4D6F9G", pass: "virgo" },
  { code: "W3Q7N1Z", pass: "libra" },
  { code: "X9V0B2M", pass: "scorpio" },
  { code: "S5Y1V6L", pass: "sagittarius" },
  { code: "H3N8R1K", pass: "capricorn" },
  { code: "Z7P2Q9F", pass: "ophiuchus" },
];

interface ProfileTabProps {
  username: string;
  email: string;
}

export function ProfileTab({
  username: initialUsername,
  email,
}: ProfileTabProps) {
  const { themeStyles: theme } = useTheme();
  const { user, updateUsername } = useAuth();
  const {
    avatarSrc,
    loading: avatarLoading,
    pickAvatar,
    removeAvatar,
  } = useAvatar(user?.id);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(initialUsername);
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Foca o input ao abrir o modo de edição
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  // Data de criação formatada (vinda do backend)
  const rawDate = user?.createdAt || "";
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Não disponível";

  // Código de Protocolo Técnico (Não o signo/senha)
  const protocolCode =
    user?.masterCodeIndex !== undefined
      ? MASTER_ENTRIES[user.masterCodeIndex]?.code
      : "N/A";

  const handleRename = async () => {
    if (!newName || newName === user?.username) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      await invoke("global_change_username", {
        userId: user?.id,
        newUsername: newName,
      });
      updateUsername(newName);
      setIsEditingName(false);
      toast.success("Nome de usuário atualizado!");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="space-y-10 w-full animate-in fade-in duration-500">
      {/* Cabeçalho de Perfil */}
      <section className="flex flex-col md:flex-row items-center gap-8 p-8 bg-card border border-border rounded-2xl relative overflow-hidden">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "w-28 h-28 rounded-2xl flex items-center justify-center text-4xl font-bold text-accent-foreground overflow-hidden border-4 border-background",
              theme.solid,
            )}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              initialUsername[0]?.toUpperCase()
            )}
          </div>

          {/* Controles de Avatar */}
          <div className="absolute -bottom-2 -right-2 flex gap-1">
            <button
              type="button"
              onClick={pickAvatar}
              className="p-2 bg-background border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
              title="Alterar foto"
            >
              <Camera className="w-4 h-4 text-foreground" />
            </button>
            {avatarSrc && (
              <button
                type="button"
                onClick={removeAvatar}
                className="p-2 bg-background border border-border rounded-lg hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                title="Remover foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {avatarLoading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Informações Principais */}
        <div className="flex-1 text-center md:text-left space-y-3">
          {isEditingName ? (
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <input
                ref={nameInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1 text-xl font-bold focus:ring-1 focus:ring-primary outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
              <button
                type="button"
                onClick={handleRename}
                disabled={isSavingName}
                className="p-2 hover:bg-green-500/10 text-green-500 rounded-lg"
              >
                {isSavingName ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 justify-center md:justify-start group/name">
              <h2 className="text-3xl font-bold text-foreground">
                {initialUsername}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="p-1.5 opacity-0 group-hover/name:opacity-100 hover:bg-accent rounded-md transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          )}

          <p className="text-muted-foreground font-medium">{email}</p>

          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
            <span className="px-3 py-1 bg-accent border border-border rounded-lg text-[10px] font-bold uppercase">
              Sessão Local Ativa
            </span>
          </div>
        </div>
      </section>

      {/* Cards de Informação */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          icon={ShieldCheck}
          label="Protocolo de Segurança"
          value={protocolCode}
        />
        <InfoCard
          icon={Calendar}
          label="Data de Criação"
          value={formattedDate}
        />
        <InfoCard icon={Cpu} label="Versão do Núcleo" value="v2.2.0-stable" />
        <InfoCard
          icon={Fingerprint}
          label="Status da Conta"
          value="Local-Only"
        />
      </section>

      {/* Rodapé de Integridade */}
      <section className="p-6 bg-card border border-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn("w-2 h-2 rounded-full", theme.solid)} />
          <div>
            <p className="text-sm font-bold">Integridade dos Dados</p>
            <p className="text-xs text-muted-foreground">
              Seu cofre está sincronizado com o banco de dados nativo.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="p-5 bg-card border border-border rounded-2xl group transition-colors hover:border-primary/20">
      <Icon className="w-5 h-5 text-muted-foreground mb-3" />
      <p className="text-[10px] font-bold text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-sm font-bold text-foreground mt-1 truncate">{value}</p>
    </div>
  );
}
