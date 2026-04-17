"use client";

import { Key, Lock, Shield, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

interface LockedVaultProps {
  vaultExists: boolean | null;
  masterPassword: string;
  setMasterPassword: (val: string) => void;
  handleVerify: () => void;
  handleStartReset: () => void;
}

export function LockedVault({
  vaultExists,
  masterPassword,
  setMasterPassword,
  handleVerify,
  handleStartReset,
}: LockedVaultProps) {
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <div className="h-full w-full flex items-center justify-center bg-background p-6 ">
      <Card className="w-full max-w-sm bg-card border border-border rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="text-center pt-10 pb-6">
          <div className="mx-auto mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl w-fit">
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-black text-foreground">
            Cofre de segurança
          </CardTitle>
          <CardDescription className="text-xs font-medium text-muted-foreground px-4 mt-1">
            Insira sua senha mestre para descriptografar seus dados
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-8">
          <div className="space-y-1.5">
            <Label htmlFor="master" className={lc}>
              Senha de acesso
            </Label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 dark:text-amber-500/30" />
              <Input
                id="master"
                type="password"
                placeholder={
                  vaultExists
                    ? "Sua senha mestra secreta"
                    : "Defina sua nova senha mestra"
                }
                className="pl-12 h-11 bg-card border-border rounded-xl text-sm font-medium placeholder:text-neutral-700 focus:border-amber-500/40 transition-all"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleVerify}
              className={cn(
                "w-full py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2",
                "bg-amber-600 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400",
              )}
            >
              <Lock className="w-4 h-4" />
              {vaultExists ? "Desbloquear cofre" : "Configurar novo cofre"}
            </button>

            {vaultExists && (
              <button
                type="button"
                onClick={handleStartReset}
                className="w-full py-2 text-neutral-600 hover:text-red-600 dark:text-red-400 text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Esqueci minha senha / Resetar
              </button>
            )}
          </div>
        </CardContent>

        <CardFooter className="pb-10 pt-8 px-10 border-t border-border">
          <div className="text-center space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                Protocolo de Segurança
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                Criptografia{" "}
                <span className="text-muted-foreground">AES-256-GCM</span> com
                derivação
                <span className="text-muted-foreground"> Argon2id</span>. Seus
                dados nunca saem do dispositivo.
              </p>
            </div>
            <p className="text-[10px] text-amber-600 dark:text-amber-500/40 font-medium italic">
              Atenção: Não há recuperação de senha possível.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
