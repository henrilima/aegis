"use client";

import { Eye, EyeOff, ShieldAlert, Trash2, X } from "lucide-react";
import { useState } from "react";
import { APP_CONFIG } from "@/app.config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountModalProps {
  username: string;
  masterCodeIndex: number;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

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

/**
 * Modal de confirmação para exclusão de conta
 */
export function DeleteAccountModal({
  username,
  masterCodeIndex,
  onConfirm,
  onCancel,
}: DeleteAccountModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modo Master (Forçado)
  const [isMasterMode, setIsMasterMode] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<
    (typeof MASTER_ENTRIES)[0] | null
  >(null);

  const startMasterMode = () => {
    // Busca o código vinculado à conta
    const entry = MASTER_ENTRIES[masterCodeIndex] || MASTER_ENTRIES[4]; // Default Gemini (4)
    setCurrentEntry(entry);
    setIsMasterMode(true);
    setPassword("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(
        isMasterMode
          ? "Chave de Protocolo necessária."
          : "Senha necessária para confirmar.",
      );
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (isMasterMode && currentEntry) {
        if (password.toLowerCase().trim() !== currentEntry.pass) {
          setError("Chave de Protocolo inválida!");
          setLoading(false);
          return;
        }
      }
      await onConfirm(password.toLowerCase().trim());
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  const lc = "text-xs font-medium text-muted-foreground ml-0.5";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-background border border-red-500/20 rounded-xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Gerenciar Conta
              </h2>
              <p className="text-xs text-red-500/60 mt-0.5">
                {isMasterMode
                  ? "Validação de Identidade Nível 2"
                  : "Ação Irreversível"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-accent/50 text-neutral-600 hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!isMasterMode ? (
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl space-y-3">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 leading-relaxed">
                Você solicitou a exclusão permanente dos dados de{" "}
                <span className="text-foreground font-bold italic">
                  {username}
                </span>
                .
              </p>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase px-0.5">
                  Dados afetados:
                </p>
                <ul className="text-[11px] text-muted-foreground font-medium space-y-1.5">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-red-500/40" />{" "}
                    Cofres de chaves e senhas
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-red-500/40" />{" "}
                    Registros de produtividade e hábitos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-red-500/40" /> Notas
                    privadas e logs de sessões
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-3 text-center">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-500">
                Protocolo de Validação
              </p>
              <div className="relative group">
                <h3 className="text-2xl font-black text-foreground font-mono bg-card py-3 rounded-lg border border-border">
                  {currentEntry?.code}
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium px-6 leading-relaxed">
                Para obter a <b>Chave de Protocolo</b> vinculada a este código,
                envie uma mensagem para{" "}
                <span className="text-amber-600 dark:text-amber-500/80 font-bold">
                  {APP_CONFIG.support.email}
                </span>{" "}
                ou acesse nossa comunidade.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="confirm-password" className={lc}>
                  {isMasterMode ? "Chave de Protocolo" : "Senha de acesso"}
                </Label>
                {!isMasterMode && (
                  <button
                    type="button"
                    onClick={startMasterMode}
                    className="text-[10px] font-bold text-neutral-600 hover:text-amber-600 dark:text-amber-500 transition-colors uppercase cursor-pointer pr-1"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    isMasterMode ? "Digite a chave..." : "Sua senha mestra"
                  }
                  className={`bg-card border-border h-11 rounded-xl text-sm font-medium pr-12 transition-all ${isMasterMode ? "focus:border-amber-500/50" : "focus:border-red-500/50"}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {error && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-[10px] font-bold text-center">
                    {error}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer ${
                  isMasterMode
                    ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200"
                    : "bg-red-500/10 hover:bg-red-500/20 border-red-500/40 hover:border-red-400 text-red-300 hover:text-red-200"
                }`}
                disabled={loading || !password}
              >
                {loading ? (
                  "Processando..."
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Finalizar Exclusão
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full text-muted-foreground hover:text-muted-foreground py-2 text-sm font-medium cursor-pointer transition-colors"
                disabled={loading}
              >
                Cancelar Operação
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
