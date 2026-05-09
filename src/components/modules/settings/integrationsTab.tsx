"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  Key,
  Loader2,
  Puzzle,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export function IntegrationsTab() {
  const { themeStyles } = useTheme();
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadKey = async () => {
      try {
        const key = await invoke<string>("get_tmdb_api_key");
        setSavedKey(key);
        setApiKey(key);
      } catch {
        // key just stays empty
      } finally {
        setIsLoading(false);
      }
    };
    loadKey();
  }, []);

  const handleSave = async () => {
    if (apiKey === savedKey) {
      toast.info("Chave não foi alterada.");
      return;
    }
    setIsSaving(true);
    try {
      await invoke("set_tmdb_api_key", { apiKey });
      setSavedKey(apiKey);
      toast.success(
        apiKey
          ? "Chave TMDb salva e validada com sucesso!"
          : "Chave TMDb removida.",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setApiKey("");
    setIsSaving(true);
    try {
      await invoke("set_tmdb_api_key", { apiKey: "" });
      setSavedKey("");
      toast.success("Chave TMDb removida.");
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const isActive = !!savedKey;
  const isDirty = apiKey !== savedKey;

  const steps = [
    {
      id: "signup",
      content: (
        <>
          Crie uma conta em{" "}
          <a
            href="https://www.themoviedb.org/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#01b4e4] font-bold hover:underline"
          >
            themoviedb.org
          </a>
          .
        </>
      ),
    },
    {
      id: "settings",
      content: (
        <>
          Acesse seu <strong>Perfil → Configurações → API</strong>.
        </>
      ),
    },
    {
      id: "copy",
      content: (
        <>
          Copie a sua <strong>API Key (v3 auth)</strong>.
        </>
      ),
    },
    { id: "paste", content: <>Cole a chave no campo ao lado e salve.</> },
  ];

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      {/* Header Padronizado */}
      <section className="flex items-center gap-5">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            themeStyles.bg,
          )}
        >
          <Puzzle className={cn("w-7 h-7", themeStyles.text)} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Integrações</h2>
          <p className="text-sm text-muted-foreground">
            Conecte serviços externos para enriquecer seus dados.
          </p>
        </div>
      </section>

      {/* TMDb Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Card header */}
        <div className="flex items-start gap-4 p-6 border-b border-border/50">
          <div className="p-3 rounded-xl bg-[#0d253f]/20 border border-[#0d253f]/30 shrink-0">
            <Film className="w-6 h-6 text-[#01b4e4]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className="text-lg font-black text-foreground">
                The Movie Database (TMDb)
              </h4>
              {isActive ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Conectado
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <TriangleAlert className="w-3 h-3" />
                  Pendente
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Habilite a busca inteligente de filmes com posters em alta
              resolução e dados em português.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Guide */}
          <div className="p-6 bg-muted/10 border-r border-border/50 space-y-4">
            <p className="text-xs font-bold text-muted-foreground">
              Passo a Passo
            </p>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={step.id} className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#01b4e4]/10 text-[#01b4e4] text-[10px] font-black flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {step.content}
                  </span>
                </li>
              ))}
            </ol>

            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-[#01b4e4]/10 border border-[#01b4e4]/20 text-[#01b4e4] text-xs font-bold hover:bg-[#01b4e4]/20 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Configurar API
            </a>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground text-xs animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                Sincronizando...
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <label
                    htmlFor="tmdb-key-input"
                    className="text-[10px] font-bold text-muted-foreground ml-1"
                  >
                    API Key (v3 auth)
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 pointer-events-none" />
                    <input
                      id="tmdb-key-input"
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSave()}
                      placeholder="Sua chave aqui..."
                      className={cn(
                        "w-full bg-background border border-border rounded-2xl pl-11 pr-12 h-12 text-sm font-mono transition-all outline-none",
                        isDirty
                          ? "border-amber-500/50"
                          : isActive
                            ? "border-emerald-500/40"
                            : "focus:border-primary/50",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground"
                    >
                      {showKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {isDirty && (
                    <p className="text-[10px] text-amber-500 font-bold uppercase">
                      Pendência de salvamento
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !isDirty}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl text-[10px] font-bold transition-all",
                      isSaving || !isDirty
                        ? "bg-muted text-muted-foreground"
                        : `${themeStyles.bg} ${themeStyles.text}`,
                    )}
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {isSaving ? "Validando" : "Salvar Chave"}
                  </button>

                  {isActive && (
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={isSaving}
                      className="p-3 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </>
            )}

            <p className="text-[10px] text-muted-foreground/40 leading-relaxed italic">
              Sua privacidade é prioridade. A chave nunca sai do seu dispositivo
              para outros fins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
