import { Key, Shield, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
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
    <div className="h-full w-full flex items-center justify-center">
      <Card className="w-full max-w-md border-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-3xl w-fit">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Cofre de Senhas Aegis
          </CardTitle>
          <CardDescription>
            Insira sua senha mestra para desbloquear seus dados de modo offline
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="master">Senha Mestra</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              <Input
                id="master"
                type="password"
                placeholder={
                  vaultExists
                    ? "Sua senha mestra"
                    : "Defina uma nova senha mestra"
                }
                className="pl-10"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </div>
          </div>
          <Button
            onClick={handleVerify}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
          >
            {vaultExists ? "Desbloquear Cofre" : "Configurar Novo Cofre"}
          </Button>

          {vaultExists && (
            <div className="pt-4 border-t border-neutral-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartReset}
                className="w-full text-red-500 hover:text-red-500 text-xs gap-2"
              >
                <Trash2 className="w-3 h-3" /> Esqueci minha senha / Resetar
                Cofre
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-center text-sm text-neutral-500 flex flex-col gap-2 mt-12">
          <p className="text-neutral-400">
            <span className="font-bold text-neutral-200">
              <span className="text-amber-500">Atenção:</span> É sua
              responsabilidade guardar sua senha mestra em segurança.
            </span>{" "}
            A Aegis utiliza criptografia de nível militar (AES-256-GCM) e
            derivação de chave Argon2id. Seus dados nunca saem deste
            dispositivo. Exporte seus dados e salve em um local seguro caso
            decida trocar de dispostivo ou formatar, pois não há recuperação.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
