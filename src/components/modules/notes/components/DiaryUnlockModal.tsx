"use client";

import { invoke } from "@tauri-apps/api/core";
import { KeyRound, Lock, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ModalShell } from "@/components/ui/ModalShell";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

interface DiaryUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlocked: () => void;
}

export function DiaryUnlockModal({
  isOpen,
  onClose,
  onUnlocked,
}: DiaryUnlockModalProps) {
  const { user } = useAuth();
  const theme = getColorTheme(getModuleColor("notes"));
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const uid = user ? String(user.id) : "";

  const handleUnlock = async () => {
    if (!password.trim()) {
      toast.error("Digite a senha do cofre");
      return;
    }

    try {
      setVerifying(true);
      // Tenta autenticar usando a senha do cofre ou senha mestra
      let isValid = false;
      try {
        isValid = await invoke<boolean>("password_verify_vault", {
          userId: uid,
          password,
        });
      } catch {
        isValid = await invoke<boolean>("global_verify_master", {
          userId: uid,
          masterPassword: password,
        });
      }

      if (isValid) {
        toast.success("Diário desbloqueado!");
        setPassword("");
        onUnlocked();
      } else {
        toast.error("Senha incorreta");
      }
    } catch {
      toast.error("Senha incorreta ou erro na validação");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Diário Protegido
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Digite a senha do seu cofre para acessar
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="diary-vault-password"
            className="text-xs font-medium text-muted-foreground"
          >
            Senha do Cofre / Mestra
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
            <Input
              id="diary-vault-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUnlock();
              }}
              className="pl-9 h-10 bg-card border-border rounded-xl text-sm"
              placeholder="Digite sua senha..."
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted/50 border border-border/50 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleUnlock}
            disabled={verifying}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer",
              theme.solid,
              theme.solidHover,
              verifying && "opacity-50 pointer-events-none",
            )}
          >
            {verifying ? "Verificando..." : "Desbloquear"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
