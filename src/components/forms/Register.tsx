"use client";

import { invoke } from "@tauri-apps/api/core";
import { Shield, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { TermsContent } from "./TermsContent";

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export default function RegisterComponent({ onSwitchToLogin }: RegisterProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
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

    if (!formData.username || !formData.password) {
      setError("Preencha todos os campos.");
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

  return (
    <>
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-5 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Shield className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Privacidade e Termos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <TermsContent className="max-h-[400px]" />

              <div className="flex items-start gap-3 p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                <input
                  id="modal-terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
                <Label
                  htmlFor="modal-terms"
                  className="text-sm text-neutral-300 cursor-pointer select-none leading-relaxed"
                >
                  Eu compreendo que este software está em versão beta e que meus
                  dados são armazenados exclusivamente neste dispositivo. Aceito
                  os termos de uso.
                </Label>
              </div>

              <div className="flex gap-4 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowTermsModal(false)}
                  className="flex-1 py-6 rounded-2xl text-[10px] font-black uppercase text-neutral-600 hover:text-white hover:bg-neutral-900 transition-all border-none"
                >
                  Abortar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmRegister}
                  className="flex-2 py-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all border-none disabled:opacity-30"
                  disabled={!acceptedTerms}
                >
                  Consolidar Identidade
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="w-full bg-neutral-900 border-neutral-800 shadow-2xl shadow-black/60 rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-1 pb-8">
          <CardTitle className="text-3xl font-black text-amber-500">
            Nova Matriz Local
          </CardTitle>
          <CardDescription className="text-neutral-500 font-bold uppercase text-[10px]">
            Provisione uma nova credencial de segurança para o seu ecossistema
            Aegis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateClick} className="space-y-6">
            <div className="grid gap-5">
              <div className="grid gap-2.5">
                <Label
                  htmlFor="username"
                  className="text-[10px] font-black uppercase text-neutral-600 ml-1"
                >
                  Identidade do Operador
                </Label>
                <Input
                  id="username"
                  placeholder="Nome de usuário para o cofre"
                  className="bg-neutral-950 border-neutral-800 h-12 rounded-2xl text-white placeholder:text-neutral-800 font-bold focus:border-amber-500/50 shadow-inner"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2.5">
                <Label
                  htmlFor="email"
                  className="text-[10px] font-black uppercase text-neutral-600 ml-1"
                >
                  Ponto de Contato (E-mail)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Seu endereço de e-mail institucional"
                  className="bg-neutral-950 border-neutral-800 h-12 rounded-2xl text-white placeholder:text-neutral-800 font-bold focus:border-amber-500/50 shadow-inner"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2.5">
                <Label
                  htmlFor="password"
                  className="text-[10px] font-black uppercase text-neutral-600 ml-1"
                >
                  Chave de Criptografia Base
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Defina uma senha robusta"
                  className="bg-neutral-950 border-neutral-800 h-12 rounded-2xl text-white placeholder:text-neutral-800 font-bold focus:border-amber-500/50 shadow-inner"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-500 text-[10px] font-black uppercase text-center">
                    {error}
                  </p>
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="w-full py-7 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all border-none mt-4"
              disabled={loading || checking}
            >
              {loading || checking
                ? "Validando Parâmetros..."
                : "Sincronizar Nova Identidade"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 text-center pt-8 border-t border-neutral-800/50 pb-8">
          <p className="text-[10px] font-black uppercase text-neutral-600 leading-relaxed">
            Já possui uma interface de acesso?{" "}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-amber-500 hover:text-amber-400 underline cursor-pointer"
            >
              Autenticar-se
            </button>
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
