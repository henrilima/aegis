"use client";

import { Eye, EyeOff, ShieldAlert, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountModalProps {
  username: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * Interface de Purga: Confirmação mestre para exclusão definitiva de perfil
 */
export function DeleteAccountModal({
  username,
  onConfirm,
  onCancel,
}: DeleteAccountModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Autenticação necessária para proceder.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onConfirm(password);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-neutral-950 border border-red-500/20 rounded-3xl shadow-2xl shadow-red-900/10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase">
                Deleção de Registro
              </h2>
              <p className="text-[9px] font-black text-red-500/60 uppercase mt-0.5">
                Operação Irreversível
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-neutral-900 text-neutral-600 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-4">
            <p className="text-xs font-bold text-red-400 leading-relaxed">
              ⚠️ Você está prestes a desintegrar permanentemente a conta{" "}
              <span className="text-white font-black underline underline-offset-4 decoration-red-500/50">
                "{username}"
              </span>{" "}
              do sistema local.
            </p>
            <div className="space-y-2">
              <p className="text-[9px] font-black text-neutral-500 uppercase">
                Impacto da Operação:
              </p>
              <ul className="text-[10px] text-neutral-600 font-bold space-y-1.5 list-none">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-red-500/40" /> Remoção
                  de Cofres de Senhas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-red-500/40" />{" "}
                  Exclusão de Logs Biométricos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-red-500/40" /> Purga
                  de Arquivos de Notas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-red-500/40" /> Reset
                  de Métricas de Performance
                </li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5">
              <Label
                htmlFor="confirm-password"
                className="text-[10px] font-black uppercase text-neutral-600 ml-1"
              >
                Chave de Autorização para Purga
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Insira sua senha mestre"
                  className="bg-neutral-900 border-neutral-800 h-12 rounded-2xl text-white placeholder:text-neutral-800 font-bold pr-12 focus:border-red-500/50 shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-[10px] font-black uppercase text-center">
                    {error}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                className="flex-1 py-6 rounded-2xl text-xs font-black uppercase text-neutral-600 hover:text-white hover:bg-neutral-900 transition-all border-none"
                disabled={loading}
              >
                Abortar
              </Button>
              <Button
                type="submit"
                className="flex-2 py-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase shadow-xl shadow-red-600/20 active:scale-[0.98] transition-all border-none gap-3"
                disabled={loading || !password}
              >
                {loading ? (
                  "Desintegrando..."
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Confirmar Purga
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
