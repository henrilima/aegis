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
import { APP_CONFIG } from "@/app.config";
import { HEX_COLORS } from "@/colors.config";
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
  const hexColor =
    HEX_COLORS[theme.name as keyof typeof HEX_COLORS] || HEX_COLORS.blue;
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
    <div className="relative space-y-6 w-full animate-in fade-in duration-500 min-h-full pb-8">
      {/* Card Principal de Perfil (Showcase Centralizado) */}
      <section
        className="bg-linear-to-b from-white/[0.07] to-white/1 dark:from-white/5 dark:to-white/0.5 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-white/20 dark:hover:border-white/10 flex flex-col items-center text-center w-full"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 0%, ${hexColor}15, transparent 55%)`,
        }}
      >
        {/* Linha de brilho superior no vidro (chanfro de luz) */}
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

        {/* Avatar redondo destacado e centralizado */}
        <div className="relative group/avatar mb-6">
          {/* Glow traseiro do avatar sutil */}
          <div
            className="absolute inset-0 rounded-full opacity-25 blur-md scale-95 transition-all duration-500 group-hover/avatar:scale-105 group-hover/avatar:opacity-40"
            style={{ backgroundColor: hexColor }}
          />
          <div
            className={cn(
              "w-32 h-32 rounded-full flex items-center justify-center text-5xl font-black text-accent-foreground overflow-hidden border border-white/10 dark:border-white/5 bg-background shadow-2xl relative z-10 transition-transform duration-300 group-hover/avatar:scale-[1.02]",
              !avatarSrc && theme.solid,
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

          {/* Controles de Avatar (no canto inferior direito do círculo) */}
          <div className="absolute bottom-0 right-0 flex gap-1.5 z-20">
            <button
              type="button"
              onClick={pickAvatar}
              className="p-2 bg-background border border-border rounded-full hover:bg-accent transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
              title="Alterar foto"
            >
              <Camera className="w-3.5 h-3.5 text-foreground" />
            </button>
            {avatarSrc && (
              <button
                type="button"
                onClick={removeAvatar}
                className="p-2 bg-background border border-border rounded-full hover:bg-red-500/10 text-red-500 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                title="Remover foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {avatarLoading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-full flex items-center justify-center z-30">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Informações do Usuário centralizadas */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          {isEditingName ? (
            <div className="flex items-center gap-2 justify-center w-full max-w-xs">
              <input
                ref={nameInputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-background/50 border border-border rounded-xl px-3 py-1.5 text-xl font-bold text-center focus:ring-1 focus:ring-primary focus:border-primary outline-none backdrop-blur-md w-full"
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleRename}
                  disabled={isSavingName}
                  className="p-2 hover:bg-green-500/10 text-green-500 rounded-lg transition-colors"
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
                  className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 justify-center group/name">
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                {initialUsername}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="p-1 opacity-0 group-hover/name:opacity-100 hover:bg-white/10 rounded-lg transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          )}
          <p className="text-muted-foreground font-medium text-sm sm:text-base">
            {email}
          </p>
        </div>

        {/* Badges alinhados de forma centralizada */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4 mt-2 border-t border-white/5 w-full max-w-sm">
          <span className="px-3 py-1 bg-white/5 dark:bg-neutral-950/20 border border-white/10 dark:border-white/5 rounded-xl text-[11px] font-bold text-muted-foreground">
            Sessão local ativa
          </span>
          <span className="px-3 py-1 bg-white/5 dark:bg-neutral-950/20 border border-white/10 dark:border-white/5 rounded-xl text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Criado em {formattedDate}
          </span>
        </div>
      </section>

      {/* Card de Integridade dos Dados de Largura Total */}
      <section
        className="p-6 bg-linear-to-b from-white/[0.07] to-white/1 dark:from-white/5 dark:to-white/0.5 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-2xl flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden shadow-md transition-all duration-300 hover:border-white/20 dark:hover:border-white/10"
        style={{
          backgroundImage: `radial-gradient(circle at 5% 50%, ${hexColor}15, transparent 40%)`,
        }}
      >
        {/* Linha de brilho superior no vidro */}
        <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

        {/* Escudo de Segurança Pulsante Garantido */}
        <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
          <div
            className="absolute inset-0 rounded-full opacity-15 animate-pulse"
            style={{ backgroundColor: hexColor }}
          />
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 dark:bg-black/20 border border-white/10 shadow-sm relative z-10">
            <ShieldCheck
              className="w-5 h-5 text-foreground animate-pulse"
              style={{ color: hexColor }}
            />
          </div>
        </div>

        {/* Texto de Status */}
        <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5 w-full">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: hexColor }}
            />
            <p className="text-[10px] font-extrabold tracking-widest uppercase text-muted-foreground">
              Integridade do Cofre Aegis
            </p>
          </div>
          <p className="text-sm font-bold text-foreground">
            Criptografia Local e Banco de Dados Protegidos
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            Seu cofre está sincronizado localmente com o banco de dados nativo
            em tempo real.
          </p>
        </div>
      </section>

      {/* Grid de Parâmetros de Informação do Sistema (4 colunas) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          icon={Fingerprint}
          label="Protocolo de Segurança"
          value={protocolCode}
          themeTextClass={theme.text}
          hexColor={hexColor}
        />
        <InfoCard
          icon={Calendar}
          label="Data de Criação"
          value={formattedDate}
          themeTextClass={theme.text}
          hexColor={hexColor}
        />
        <InfoCard
          icon={Cpu}
          label="Versão do Núcleo"
          value={`v${APP_CONFIG.version}-${APP_CONFIG.stage}`}
          themeTextClass={theme.text}
          hexColor={hexColor}
        />
        <InfoCard
          icon={ShieldCheck}
          label="Status da Conta"
          value="Local-Only"
          themeTextClass={theme.text}
          hexColor={hexColor}
        />
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  themeTextClass,
  hexColor,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  themeTextClass: string;
  hexColor: string;
}) {
  return (
    <div
      className="p-5 bg-linear-to-b from-white/4 to-transparent dark:from-white/2 dark:to-transparent backdrop-blur-2xl border border-white/5 dark:border-white/3 rounded-2xl group transition-all duration-300 hover:from-white/7 dark:hover:from-white/4 hover:border-white/15 dark:hover:border-white/10 hover:-translate-y-0.5 hover:shadow-xl relative overflow-hidden cursor-default"
      style={{
        backgroundImage: `radial-gradient(circle at 0% 0%, ${hexColor}0d, transparent 50%)`,
      }}
    >
      {/* Linha de brilho superior no vidro (acende no hover) */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <Icon
        className={cn(
          "w-5 h-5 text-muted-foreground transition-colors mb-3 group-hover:animate-pulse",
          themeTextClass,
        )}
      />
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-black text-foreground mt-1.5 truncate">
        {value}
      </p>
    </div>
  );
}
