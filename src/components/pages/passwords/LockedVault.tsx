import { Key, Shield, Trash2, Lock } from "lucide-react";
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
  return (
    <div className="h-full w-full flex items-center justify-center bg-neutral-950 p-6">
      <Card className="w-full max-w-md border border-neutral-800 bg-neutral-900 rounded-[32px] overflow-hidden">
        <CardHeader className="text-center pt-10 pb-6 bg-amber-500/5">
          <div className="mx-auto mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl w-fit">
            <Shield className="w-10 h-10 text-amber-500" />
          </div>
          <CardTitle className="text-3xl font-black text-white">
            Cofre de Segurança
          </CardTitle>
          <CardDescription className="text-neutral-500 font-medium px-6">
            Insira sua senha mestra para desbloquear seus dados locais e offline
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-8">
          <div className="space-y-3">
            <Label
              htmlFor="master"
              className="text-[10px] font-black uppercase text-neutral-500 ml-1"
            >
              Senha Mestra de Acesso
            </Label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/50" />
              <Input
                id="master"
                type="password"
                placeholder={
                  vaultExists
                    ? "Sua senha mestra secreta"
                    : "Defina sua nova senha mestra"
                }
                className="pl-12 h-14 bg-neutral-950/50 border-neutral-800 rounded-2xl text-base focus-visible:ring-amber-500/20 focus-visible:border-amber-500/30 transition-all"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleVerify}
            className="w-full h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-black uppercase hover:bg-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <Lock className="w-5 h-5" />
            {vaultExists ? "Desbloquear Cofre" : "Configurar Novo Cofre"}
          </button>

          {vaultExists && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartReset}
                className="w-full py-3 rounded-xl text-red-500/50 hover:text-red-400 text-[10px] font-black uppercase gap-2 flex items-center justify-center transition-all hover:bg-red-500/5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Esqueci minha senha / Resetar
                Cofre
              </button>
            </div>
          )}
        </CardContent>

        <CardFooter className="pb-10 pt-4 px-8">
          <div className="text-center space-y-4">
            <p className="text-[11px] leading-relaxed text-neutral-500">
              <span className="text-amber-500/80 font-black uppercase block mb-1 text-[9px]">
                Aviso de Segurança
              </span>
              A Aegis utiliza criptografia{" "}
              <span className="text-neutral-300 font-bold">AES-256-GCM</span> e
              derivação de chave{" "}
              <span className="text-neutral-300 font-bold">Argon2id</span>. Seus
              dados nunca saem deste dispositivo.{" "}
              <span className="text-neutral-400">
                Salve sua senha em local seguro, pois não há recuperação
                possível.
              </span>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
