"use client";

import { Eye, EyeOff, ShieldAlert, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountModalProps {
  username: string;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * Modal de confirmação para exclusão de conta
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
      setError("Senha necessária para confirmar.");
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

  const lc = "text-xs font-medium text-neutral-400 ml-0.5";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-neutral-950 border border-red-500/20 rounded-[28px] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Deletar conta
              </h2>
              <p className="text-xs text-red-500/60 mt-0.5">
                Ação irreversível
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-600 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-3">
            <p className="text-xs font-medium text-red-400 leading-relaxed">
              Você está prestes a excluir permanentemente a conta{" "}
              <span className="text-white font-bold italic">
                {username}
              </span>.
            </p>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-neutral-500 uppercase px-0.5">
                O que será removido:
              </p>
              <ul className="text-xs text-neutral-500 font-medium space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-red-500/40" /> Cofres de senhas
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-red-500/40" /> Histórico de hábitos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-red-500/40" /> Todas as notas e logs
                </li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className={lc}>
                Senha de confirmação
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Insira sua senha mestre"
                  className="bg-neutral-900 border-neutral-800 h-11 rounded-xl text-sm font-medium pr-12 focus:border-red-500/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-white transition-colors cursor-pointer"
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
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 hover:border-red-400 text-red-300 hover:text-red-200 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                disabled={loading || !password}
              >
                {loading ? (
                  "Excluindo..."
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Confirmar exclusão
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm font-medium cursor-pointer transition-colors"
              >
                Agora não
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
