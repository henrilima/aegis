"use client";

import { invoke } from "@tauri-apps/api/core";
import { Eye, EyeOff, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

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
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={lc}>
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
          className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-muted-foreground cursor-pointer transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-bold text-foreground">{children}</p>;
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
  const [revertMaster, setRevertMaster] = useState("");
  const [vaultLoading, setVaultLoading] = useState(false);

  const loadVaultStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const has = await invoke<boolean>("has_separate_vault_password", {
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
      await invoke("change_account_password", {
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
      await invoke("change_vault_password", {
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

  const handleRevertVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setVaultLoading(true);
    try {
      await invoke("revert_vault_to_master", {
        userId: user.id,
        currentVaultPwd: vaultCurrent,
        masterPwd: revertMaster,
      });
      toast.success("Cofre revertido para usar a senha da conta.");
      setVaultCurrent("");
      setRevertMaster("");
      await loadVaultStatus();
    } catch (err) {
      toast.error(String(err));
    } finally {
      setVaultLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent rounded-lg shrink-0">
            <KeyRound className={`w-5 h-5 text-muted-foreground`} />
          </div>
          <div>
            <SectionLabel>Senha da conta</SectionLabel>
            <p className="text-xs text-muted-foreground mt-0.5">
              Usada para fazer login. Se o cofre não tiver senha isolada, os
              registros serão re-encriptados automaticamente.
            </p>
          </div>
        </div>

        <form
          id="change-account-pwd-form"
          onSubmit={handleChangeAccountPassword}
          className="p-5 bg-card border border-border rounded-xl space-y-4"
        >
          <PwdInput
            id="acp-current"
            label="Senha Atual"
            value={acpCurrent}
            onChange={setAcpCurrent}
            placeholder="••••••••"
            disabled={acpLoading}
          />
          <PwdInput
            id="acp-new"
            label="Nova Senha"
            value={acpNew}
            onChange={setAcpNew}
            placeholder="Mínimo 6 caracteres"
            disabled={acpLoading}
          />
          <PwdInput
            id="acp-confirm"
            label="Confirmar Nova Senha"
            value={acpConfirm}
            onChange={setAcpConfirm}
            placeholder="Repita a nova senha"
            disabled={acpLoading}
          />
          <button
            type="submit"
            className={`w-full py-3 rounded-xl bg-accent text-foreground font-bold text-xs cursor-pointer hover:bg-accent/80`}
            disabled={acpLoading || !acpCurrent || !acpNew || !acpConfirm}
          >
            {acpLoading ? "Alterando..." : "Alterar senha da conta"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg shrink-0 bg-accent`}>
            {hasVaultPwd ? (
              <ShieldCheck className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ShieldOff className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <SectionLabel>Senha isolada do cofre</SectionLabel>
              {hasVaultPwd && (
                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full ml-1">
                  Ativa
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasVaultPwd
                ? "Cofre usa senha diferente da senha de login."
                : "Por padrão o cofre usa a mesma senha de login. Você pode definir uma senha exclusiva."}
            </p>
          </div>
        </div>

        {hasVaultPwd ? (
          <div className="p-5 bg-card border border-border rounded-xl space-y-6">
            <form
              id="update-vault-pwd-form"
              onSubmit={handleSetVaultPassword}
              className="space-y-4"
            >
              <p className="text-xs font-bold text-muted-foreground">
                Alterar senha do cofre
              </p>
              <PwdInput
                id="vault-cur"
                label="Senha Atual do Cofre"
                value={vaultCurrent}
                onChange={setVaultCurrent}
                placeholder="••••••••"
                disabled={vaultLoading}
              />
              <PwdInput
                id="vault-new"
                label="Nova Senha do Cofre"
                value={vaultNew}
                onChange={setVaultNew}
                placeholder="Mínimo 6 caracteres"
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
              <button
                type="submit"
                className={`w-full py-3 rounded-xl bg-accent text-foreground font-bold text-xs cursor-pointer hover:bg-accent/80`}
                disabled={
                  vaultLoading || !vaultCurrent || !vaultNew || !vaultConfirm
                }
              >
                {vaultLoading ? "Salvando..." : "Atualizar senha do cofre"}
              </button>
            </form>

            <form
              id="revert-vault-form"
              onSubmit={handleRevertVault}
              className="space-y-4 pt-5 border-t border-border"
            >
              <p className="text-xs font-bold text-muted-foreground">
                Remover senha isolada (voltar ao padrão)
              </p>
              <PwdInput
                id="vault-cur-r"
                label="Senha Atual do Cofre"
                value={vaultCurrent}
                onChange={setVaultCurrent}
                placeholder="••••••••"
                disabled={vaultLoading}
              />
              <PwdInput
                id="master-r"
                label="Senha de Login (conta)"
                value={revertMaster}
                onChange={setRevertMaster}
                placeholder="Senha usada para entrar no Aegis"
                disabled={vaultLoading}
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-red-600 dark:text-red-500 hover:bg-red-500/10 transition-all font-bold text-xs cursor-pointer"
                disabled={vaultLoading || !vaultCurrent || !revertMaster}
              >
                {vaultLoading ? "Processando..." : "Remover senha isolada"}
              </button>
            </form>
          </div>
        ) : (
          <form
            id="set-vault-pwd-form"
            onSubmit={handleSetVaultPassword}
            className="p-5 bg-card border border-border rounded-xl space-y-4"
          >
            <PwdInput
              id="vault-cur-n"
              label="Confirmar com Senha de Login Atual"
              value={vaultCurrent}
              onChange={setVaultCurrent}
              placeholder="Sua senha de login"
              disabled={vaultLoading}
            />
            <PwdInput
              id="vault-new-n"
              label="Nova Senha Exclusiva do Cofre"
              value={vaultNew}
              onChange={setVaultNew}
              placeholder="Mínimo 6 caracteres"
              disabled={vaultLoading}
            />
            <PwdInput
              id="vault-conf-n"
              label="Confirmar Senha do Cofre"
              value={vaultConfirm}
              onChange={setVaultConfirm}
              placeholder="Repita a senha"
              disabled={vaultLoading}
            />
            <p
              className={`text-xs ${theme.text}/70 ${theme.bg.replace("10", "5")} border ${theme.border.replace("20", "10")} rounded-lg p-3`}
            >
              ⚠️ Após definir, você precisará desta senha para acessar o cofre.
              Guarde-a em local seguro.
            </p>
            <button
              type="submit"
              className={`w-full py-3 rounded-xl bg-accent hover:bg-accent/80 text-xs font-semibold cursor-pointer`}
              disabled={
                vaultLoading || !vaultCurrent || !vaultNew || !vaultConfirm
              }
            >
              {vaultLoading ? "Definindo..." : "Definir senha isolada"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
