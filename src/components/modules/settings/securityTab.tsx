"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

function PwdInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-xs font-bold text-muted-foreground ml-1"
      >
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="bg-background border-border h-11 text-sm placeholder:text-muted-foreground/40 pr-10 rounded-xl"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export function SecurityTab() {
  const { themeStyles: theme } = useTheme();
  const { user } = useAuth();

  const [acpCurrent, setAcpCurrent] = useState("");
  const [acpNew, setAcpNew] = useState("");
  const [acpConfirm, setAcpConfirm] = useState("");
  const [acpLoading, setAcpLoading] = useState(false);

  const [hasVaultPwd, setHasVaultPwd] = useState(false);
  const [vaultCurrent, setVaultCurrent] = useState("");
  const [vaultNew, setVaultNew] = useState("");
  const [vaultConfirm, setVaultConfirm] = useState("");
  const [_revertMaster, _setRevertMaster] = useState("");
  const [vaultLoading, setVaultLoading] = useState(false);

  const loadVaultStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const has = await invoke<boolean>("global_has_separate_vault_password", {
        userId: user.id,
      });
      setHasVaultPwd(has);
    } catch (err) {
      console.error("[SECURITY] Erro ao carregar status do cofre:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    loadVaultStatus();
  }, [loadVaultStatus]);

  const handleChangeAccountPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (acpNew !== acpConfirm)
      return toast.error("As novas senhas não coincidem.");
    if (acpNew.length < 6) return toast.error("Mínimo 6 caracteres.");
    if (!user?.id) return;
    setAcpLoading(true);
    try {
      await invoke("global_change_account_password", {
        userId: user.id,
        currentPassword: acpCurrent,
        newPassword: acpNew,
      });
      toast.success("Senha da conta alterada com sucesso.");
      setAcpCurrent("");
      setAcpNew("");
      setAcpConfirm("");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setAcpLoading(false);
    }
  };

  const handleSetVaultPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vaultNew !== vaultConfirm)
      return toast.error("As senhas do cofre não coincidem.");
    if (vaultNew.length < 6) return toast.error("Mínimo 6 caracteres.");
    if (!user?.id) return;
    setVaultLoading(true);
    try {
      await invoke("global_change_vault_password", {
        userId: user.id,
        currentVaultPwd: vaultCurrent,
        newVaultPwd: vaultNew,
      });
      toast.success(
        hasVaultPwd
          ? "Senha do cofre atualizada."
          : "Senha isolada do cofre definida.",
      );
      setVaultCurrent("");
      setVaultNew("");
      setVaultConfirm("");
      await loadVaultStatus();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setVaultLoading(false);
    }
  };

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      {/* Header Padronizado */}
      <section className="flex items-center gap-5">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            theme.bg,
          )}
        >
          <ShieldCheck className={cn("w-7 h-7", theme.text)} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Segurança</h2>
          <p className="text-sm text-muted-foreground">
            Proteja sua conta e isole seus dados sensíveis.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Senha da Conta */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground px-1">
            Autenticação
          </h3>
          <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-accent/50 rounded-xl">
                <KeyRound className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">Senha de Acesso</p>
                <p className="text-xs text-muted-foreground">
                  Senha mestra para login no sistema.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangeAccountPassword} className="space-y-4">
              <PwdInput
                id="acp-current"
                label="Senha Atual"
                value={acpCurrent}
                onChange={setAcpCurrent}
                placeholder="••••••••"
                disabled={acpLoading}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PwdInput
                  id="acp-new"
                  label="Nova Senha"
                  value={acpNew}
                  onChange={setAcpNew}
                  placeholder="Mínimo 6"
                  disabled={acpLoading}
                />
                <PwdInput
                  id="acp-confirm"
                  label="Confirmar"
                  value={acpConfirm}
                  onChange={setAcpConfirm}
                  placeholder="Repita"
                  disabled={acpLoading}
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-foreground text-background font-bold text-[10px] hover:opacity-90 transition-opacity"
                disabled={acpLoading || !acpCurrent || !acpNew || !acpConfirm}
              >
                {acpLoading ? "Processando..." : "Atualizar Senha Mestra"}
              </button>
            </form>
          </div>
        </section>

        {/* Senha do Cofre */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-muted-foreground">
              Isolamento do Cofre
            </h3>
            {hasVaultPwd && (
              <span className="text-[9px] font-bold px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full">
                Ativo
              </span>
            )}
          </div>

          <div className="p-6 bg-card border border-border rounded-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-accent/50 rounded-xl">
                {hasVaultPwd ? (
                  <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ShieldOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold">Senha do Cofre</p>
                <p className="text-xs text-muted-foreground">
                  Isole seus dados do login principal.
                </p>
              </div>
            </div>

            <form onSubmit={handleSetVaultPassword} className="space-y-4">
              <PwdInput
                id="vault-cur"
                label={
                  hasVaultPwd ? "Senha Atual do Cofre" : "Senha de Login Atual"
                }
                value={vaultCurrent}
                onChange={setVaultCurrent}
                placeholder="••••••••"
                disabled={vaultLoading}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PwdInput
                  id="vault-new"
                  label="Nova Senha"
                  value={vaultNew}
                  onChange={setVaultNew}
                  placeholder="Mínimo 6"
                  disabled={vaultLoading}
                />
                <PwdInput
                  id="vault-conf"
                  label="Confirmar"
                  value={vaultConfirm}
                  onChange={setVaultConfirm}
                  placeholder="Repita"
                  disabled={vaultLoading}
                />
              </div>

              {!hasVaultPwd && (
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl flex gap-3">
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-500/80 font-medium leading-relaxed">
                    Definir uma senha isolada aumenta drasticamente a segurança
                    dos seus registros.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className={cn(
                  "w-full h-11 rounded-xl font-bold text-[10px] transition-opacity",
                  theme.bg,
                  theme.text,
                )}
                disabled={
                  vaultLoading || !vaultCurrent || !vaultNew || !vaultConfirm
                }
              >
                {vaultLoading
                  ? "Salvando..."
                  : hasVaultPwd
                    ? "Atualizar Isolamento"
                    : "Ativar Senha Isolada"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
