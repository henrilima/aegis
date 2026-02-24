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

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowTermsModal(false)}
                  className="flex-1 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 font-bold cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmRegister}
                  className="flex-1 bg-amber-500 hover:bg-amber-500 text-black font-bold h-10 rounded-lg shadow-lg shadow-amber-500/10 disabled:opacity-50 cursor-pointer"
                  disabled={!acceptedTerms}
                >
                  Criar Conta
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-amber-500">
            Criar Conta Local
          </CardTitle>
          <CardDescription className="text-md mt-[-4] text-neutral-300">
            Cadastre-se para acessar o Aegis de forma offline e segura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateClick}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="username"
                  className="text-neutral-300 text-sm font-bold"
                >
                  Nome de Usuário
                </Label>
                <Input
                  id="username"
                  placeholder="Digite seu nome de usuário"
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="email"
                  className="text-neutral-300 text-sm font-bold"
                >
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="password"
                  className="text-neutral-300 text-sm font-bold"
                >
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha local"
                  className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm font-medium">{error}</p>
              )}
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="bg-amber-500 text-black hover:bg-amber-500 cursor-pointer w-full font-bold mt-6 h-12"
              disabled={loading || checking}
            >
              {loading || checking ? "Processando..." : "Criar Conta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-center w-full text-neutral-400">
            <p className="text-sm">
              Já tem uma conta local?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-amber-500 hover:text-amber-500 underline cursor-pointer font-bold"
              >
                Fazer Login
              </button>
            </p>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
