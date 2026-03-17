"use client";

import { invoke } from "@tauri-apps/api/core";
import { Shield, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getThemeColor } from "@/lib/utils";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { TermsContent } from "./TermsContent";

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export default function RegisterComponent({ onSwitchToLogin }: RegisterProps) {
  const theme = getThemeColor();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordHint: "",
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleCreateClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Por favor, insira um e-mail válido.");
      toast.error("E-mail inválido");
      return;
    }

    if (!formData.username || !formData.password || !formData.passwordHint) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setChecking(true);
    try {
      await invoke("check_user_availability", {
        username: formData.username,
        email: formData.email,
      });

      setShowTermsModal(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(message);
    } finally {
      setChecking(false);
    }
  };

  const handleConfirmRegister = async () => {
    if (!acceptedTerms) {
      toast.error("Você precisa aceitar os termos para continuar.");
      return;
    }

    setLoading(true);
    setShowTermsModal(false);

    try {
      const userId = await invoke<string>("local_register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        passwordHint: formData.passwordHint,
      });

      toast.success("Conta local criada com sucesso!");
      await login(userId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  const lc = "text-xs font-medium text-neutral-400 ml-0.5";

  return (
    <>
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 ${theme.bg} rounded-xl border ${theme.border}`}
                >
                  <Shield className={`w-5 h-5 ${theme.textSub}`} />
                </div>
                <h2 className="text-base font-bold text-white">
                  Privacidade & Termos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <TermsContent className="custom-scrollbar" />

              <div className="flex items-start gap-3 p-4 bg-neutral-900/40 border border-neutral-800 rounded-xl">
                <input
                  id="modal-terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className={`w-5 h-5 mt-0.5 rounded-lg border-neutral-700 bg-neutral-800 ${theme.text} focus:ring-${theme.text.split("-")[1]}-500 cursor-pointer`}
                />
                <Label
                  htmlFor="modal-terms"
                  className="text-xs font-semibold text-neutral-400 cursor-pointer select-none leading-relaxed"
                >
                  Confirmo que meus dados são armazenados localmente e aceito os
                  termos da versão Aegis Beta.
                </Label>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmRegister}
                  className={`w-full py-4 rounded-xl ${theme.bg} ${theme.bgHover} border ${theme.border} ${theme.borderHover.replace("hover:", "hover:border-")} ${theme.text} ${theme.textDarkHover.replace("hover:", "hover:text-")} text-sm font-black uppercase transition-all active:scale-[0.98] disabled:opacity-30 cursor-pointer shadow-lg shadow-${theme.text.split("-")[1]}-500/5`}
                  disabled={!acceptedTerms}
                >
                  Criar Identidade
                </button>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="w-full text-neutral-500 hover:text-neutral-300 py-2 text-sm font-medium cursor-pointer transition-colors"
                >
                  Agora não
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="w-full bg-neutral-900/50 backdrop-blur-xl border-neutral-800/50 shadow-2xl shadow-black/40 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        <CardHeader className="space-y-1.5 pb-8 p-10 shrink-0 text-center md:text-left">
          <CardTitle className="text-3xl font-black text-white">
            Nova <span className={theme.text}>Identidade</span>
          </CardTitle>
          <CardDescription className="text-neutral-400 font-medium text-sm leading-relaxed">
            Configure seu cofre criptografado para iniciar o ecossistema Aegis
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 overflow-y-auto custom-scrollbar flex-1">
          <form onSubmit={handleCreateClick} className="space-y-6 pb-2">
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className={lc}>
                  Nome de usuário
                </Label>
                <Input
                  id="username"
                  placeholder="Seu nome de usuário"
                  className={`bg-neutral-900 border-neutral-800 h-11 rounded-xl text-sm font-medium placeholder:text-neutral-700 focus:${theme.border.split(" ")[0]}`}
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className={lc}>
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  className={`bg-neutral-900 border-neutral-800 h-11 rounded-xl text-sm font-medium placeholder:text-neutral-700 focus:${theme.border.split(" ")[0]}`}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className={lc}>
                  Senha mestre
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Defina uma senha"
                  className={`bg-neutral-900 border-neutral-800 h-11 rounded-xl text-sm font-medium placeholder:text-neutral-700 focus:${theme.border.split(" ")[0]}`}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="passwordHint" className={lc}>
                  Dica de senha (Obrigatório)
                </Label>
                <Input
                  id="passwordHint"
                  placeholder="Um lembrete para sua senha"
                  className={`bg-neutral-900 border-neutral-800 h-11 rounded-xl text-sm font-medium placeholder:text-neutral-700 focus:${theme.border.split(" ")[0]}`}
                  value={formData.passwordHint}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-xs font-medium text-center">
                    {error}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-3 rounded-xl ${theme.bg} ${theme.bgHover} border ${theme.border} ${theme.borderHover.replace("hover:", "hover:border-")} ${theme.textDark} ${theme.textDarkHover.replace("hover:", "hover:text-")} text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer`}
                disabled={loading || checking}
              >
                {loading || checking
                  ? "Validando..."
                  : "Criar identidade local"}
              </button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center p-10 pt-6 border-t border-neutral-800/40 shrink-0">
          <p className="text-[11px] font-bold text-neutral-500 uppercase leading-relaxed">
            Já possui acesso?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className={`${theme.text} ${theme.textDarkHover.replace("hover:", "hover:text-")} underline font-black cursor-pointer transition-colors`}
            >
              Autenticar
            </button>
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
