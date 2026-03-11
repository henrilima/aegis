"use client";

import { invoke } from "@tauri-apps/api/core";
import { Eye, EyeOff, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

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
  const lc = "text-xs font-medium text-neutral-400 ml-0.5";
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className={lc}
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
          className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-700 pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300 cursor-pointer transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-neutral-500">{children}</p>
  );
}

export function SecurityTab() {
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
          <div className="p-2 bg-neutral-800 rounded-lg border border-neutral-700 shrink-0">
            <KeyRound className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <SectionLabel>Senha da Conta</SectionLabel>
            <p className="text-xs text-neutral-500 mt-0.5">
              Usada para fazer login. Se o cofre não tiver senha isolada, os
              registros serão re-encriptados automaticamente.
            </p>
          </div>
        </div>

        <form
          id="change-account-pwd-form"
          onSubmit={handleChangeAccountPassword}
          className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4"
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
            className="w-full py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
            disabled={acpLoading || !acpCurrent || !acpNew || !acpConfirm}
          >
            {acpLoading ? "Alterando..." : "Alterar senha da conta"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg border shrink-0 ${hasVaultPwd ? "bg-green-500/10 border-green-500/20" : "bg-neutral-800 border-neutral-700"}`}
          >
            {hasVaultPwd ? (
              <ShieldCheck className="w-4 h-4 text-green-400" />
            ) : (
              <ShieldOff className="w-4 h-4 text-neutral-500" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <SectionLabel>Senha Isolada do Cofre</SectionLabel>
              {hasVaultPwd && (
                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full ml-1">
                  Ativa
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {hasVaultPwd
                ? "Cofre usa senha diferente da senha de login."
                : "Por padrão o cofre usa a mesma senha de login. Você pode definir uma senha exclusiva."}
            </p>
          </div>
        </div>

        {hasVaultPwd ? (
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-6">
            <form
              id="update-vault-pwd-form"
              onSubmit={handleSetVaultPassword}
              className="space-y-4"
            >
              <p className="text-xs font-bold text-neutral-500">
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
                className="w-full py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
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
              className="space-y-4 pt-5 border-t border-neutral-800"
            >
              <p className="text-xs font-bold text-neutral-500">
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
                className="w-full py-3 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all font-semibold text-sm cursor-pointer"
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
            className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4"
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
            <p className="text-xs text-amber-500/70 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
              ⚠️ Após definir, você precisará desta senha para acessar o cofre.
              Guarde-a em local seguro.
            </p>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer"
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
