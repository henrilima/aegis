"use client";

import { invoke } from "@tauri-apps/api/core";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  Flame,
  Key,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  Timer,
  Trash2,
  TriangleAlert,
  Type,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useDiscordRpc } from "@/context/DiscordRpcContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import {
  AUTOCOMPLETE_STORAGE_KEY,
  addCustomWord,
  BUILTIN_SNIPPETS,
  expandSnippetTemplate,
  getAllSnippets,
  getCustomWords,
  getUserVocabularySnapshot,
  removeCustomWord,
  removeSnippet,
  type TextSnippet,
  upsertSnippet,
} from "@/lib/wordSuggestions";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-6 h-6", className)}
      aria-label="Discord"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

// ─── Seção: Gestor de Vocabulário ─────────────────────────────────────────────

function VocabularyManager() {
  const { themeStyles } = useTheme();

  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [wordFilter, setWordFilter] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"custom" | "learned">(
    "custom",
  );

  useEffect(() => {
    // Carrega estado do autocomplete
    const stored = localStorage.getItem(AUTOCOMPLETE_STORAGE_KEY);
    setAutocompleteEnabled(stored !== "false");
    // Carrega vocabulário
    setCustomWords(getCustomWords());
    setLearnedWords(getUserVocabularySnapshot().slice(0, 300));
  }, []);

  const handleToggleAutocomplete = (checked: boolean) => {
    localStorage.setItem(AUTOCOMPLETE_STORAGE_KEY, String(checked));
    setAutocompleteEnabled(checked);
    toast.success(
      checked ? "Autocomplete ativado." : "Autocomplete desativado.",
    );
  };

  const handleAddWord = () => {
    const word = newWord.trim().toLowerCase();
    if (!word) return;
    if (word.length < 2) {
      toast.error("A palavra deve ter pelo menos 2 caracteres.");
      return;
    }
    const added = addCustomWord(word);
    if (!added) {
      toast.error("Palavra já existe no vocabulário.");
      return;
    }
    setCustomWords(getCustomWords());
    setNewWord("");
    toast.success(`"${word}" adicionada ao vocabulário.`);
  };

  const handleRemoveWord = (word: string) => {
    removeCustomWord(word);
    setCustomWords(getCustomWords());
    toast.success(`"${word}" removida.`);
  };

  const filteredCustom = useMemo(
    () => customWords.filter((w) => w.includes(wordFilter.toLowerCase())),
    [customWords, wordFilter],
  );

  const filteredLearned = useMemo(
    () => learnedWords.filter((w) => w.includes(wordFilter.toLowerCase())),
    [learnedWords, wordFilter],
  );

  const currentList =
    activeSubTab === "custom" ? filteredCustom : filteredLearned;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-6 border-b border-border/50 flex-wrap sm:flex-nowrap">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className="text-lg font-bold text-foreground">
                Gestor de vocabulário
              </h4>
              <span
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border",
                  autocompleteEnabled
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : "bg-muted text-muted-foreground border-border",
                )}
              >
                {autocompleteEnabled ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Autocomplete ativo
                  </>
                ) : (
                  "Autocomplete inativo"
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-2xl">
              Visualize e gerencie os termos usados para sugestões de texto.
              Adicione palavras personalizadas para enriquecer seu vocabulário.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-center sm:self-auto">
          <span className="text-xs text-muted-foreground">Autocomplete</span>
          <Switch
            checked={autocompleteEnabled}
            onCheckedChange={handleToggleAutocomplete}
            aria-label="Alternar autocomplete"
          />
        </div>
      </div>

      {/* Corpo */}
      <div className="p-6 space-y-5">
        {/* Campo de adicionar palavra */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
            <input
              id="vocab-new-word-input"
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
              placeholder="Adicionar palavra ao vocabulário..."
              className="w-full bg-background border border-border rounded-2xl pl-11 pr-4 h-11 text-sm transition-all outline-none focus:border-primary/50"
            />
          </div>
          <button
            type="button"
            onClick={handleAddWord}
            disabled={!newWord.trim()}
            className={cn(
              "flex items-center gap-2 px-5 h-11 rounded-2xl text-xs font-bold transition-all",
              newWord.trim()
                ? `${themeStyles.bg} ${themeStyles.text}`
                : "bg-muted text-muted-foreground",
            )}
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>

        {/* Filtro e sub-abas */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex rounded-xl bg-muted/50 border border-border/50 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveSubTab("custom")}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeSubTab === "custom"
                  ? `${themeStyles.bg} ${themeStyles.text}`
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Personalizadas ({customWords.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubTab("learned");
                setLearnedWords(getUserVocabularySnapshot().slice(0, 300));
              }}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeSubTab === "learned"
                  ? `${themeStyles.bg} ${themeStyles.text}`
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Aprendidas ({learnedWords.length})
            </button>
          </div>

          <input
            type="text"
            value={wordFilter}
            onChange={(e) => setWordFilter(e.target.value)}
            placeholder="Filtrar palavras..."
            className="flex-1 bg-background border border-border rounded-xl px-4 h-9 text-xs transition-all outline-none focus:border-primary/50"
          />
        </div>

        {/* Lista de palavras */}
        <div className="bg-muted/20 rounded-2xl border border-border/50 min-h-40 max-h-55 overflow-y-auto p-4">
          {currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-30 gap-2 text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground">
                {activeSubTab === "custom"
                  ? "Nenhuma palavra personalizada ainda.\nAdicione palavras para enriquecer o autocomplete."
                  : "Nenhuma palavra aprendida ainda.\nAs palavras das suas notas e tarefas aparecem aqui."}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentList.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background border border-border text-xs font-medium text-foreground group"
                >
                  {word}
                  {activeSubTab === "custom" && (
                    <button
                      type="button"
                      onClick={() => handleRemoveWord(word)}
                      className="text-muted-foreground/40 hover:text-red-500 transition-colors ml-0.5"
                      aria-label={`Remover ${word}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {activeSubTab === "learned" && (
          <p className="text-[10px] text-muted-foreground/50 italic">
            Palavras aprendidas são temporárias e coletadas automaticamente das
            suas notas e tarefas durante a sessão. Máximo de 300 exibidas.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Seção: Atalhos de Texto (Snippets) ───────────────────────────────────────

function SnippetsManager() {
  const { themeStyles } = useTheme();

  const [snippets, setSnippets] = useState<TextSnippet[]>([]);
  const [newTrigger, setNewTrigger] = useState("");
  const [newExpansion, setNewExpansion] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [previewExpanded, setPreviewExpanded] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setSnippets(getAllSnippets());
  }, []);

  const handleAddSnippet = () => {
    if (!newTrigger.trim() || !newExpansion.trim()) {
      toast.error("Preencha o atalho e a expansão.");
      return;
    }

    // Garante que não usa um trigger built-in
    if (BUILTIN_SNIPPETS.some((s) => s.trigger === newTrigger.trim())) {
      toast.error("Este atalho é reservado pelo sistema.");
      return;
    }

    upsertSnippet({
      trigger: newTrigger.trim(),
      expansion: newExpansion.trim(),
      description: newDescription.trim() || undefined,
    });
    setSnippets(getAllSnippets());
    setNewTrigger("");
    setNewExpansion("");
    setNewDescription("");
    setPreviewExpanded("");
    setIsAdding(false);
    toast.success(`Atalho "${newTrigger.trim()}" criado.`);
  };

  const handleRemoveSnippet = (id: string, trigger: string) => {
    removeSnippet(id);
    setSnippets(getAllSnippets());
    toast.success(`Atalho "${trigger}" removido.`);
  };

  const handlePreview = () => {
    if (!newExpansion.trim()) return;
    setPreviewExpanded(expandSnippetTemplate(newExpansion.trim()));
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 p-6 border-b border-border/50">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
          <Zap className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-bold text-foreground">
            Atalhos de texto
          </h4>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-2xl">
            Crie atalhos que expandem automaticamente enquanto você digita. Use
            variáveis como{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-[10px]">
              {"{{data}}"}
            </code>
            ,{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-[10px]">
              {"{{hora}}"}
            </code>
            ,{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-muted text-foreground font-mono text-[10px]">
              {"{{semana}}"}
            </code>{" "}
            para inserir valores dinâmicos.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Lista de snippets */}
        <div className="space-y-2">
          {snippets.map((snippet) => (
            <div
              key={snippet.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/50 group"
            >
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <code className="px-2.5 py-1 rounded-lg bg-background border border-border text-xs font-mono font-bold text-primary shrink-0">
                  {snippet.trigger}
                </code>
                <span className="text-muted-foreground text-xs shrink-0">
                  →
                </span>
                <span className="text-xs text-foreground truncate">
                  {snippet.expansion}
                </span>
                {snippet.description && (
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 hidden sm:block">
                    {snippet.description}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {snippet.isBuiltin ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Sistema
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveSnippet(snippet.id, snippet.trigger)
                    }
                    className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    aria-label={`Remover atalho ${snippet.trigger}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Formulário de novo snippet */}
        {isAdding ? (
          <div className="border border-border/60 rounded-2xl p-5 space-y-4 bg-muted/10">
            <p className="text-xs font-bold text-foreground">Novo atalho</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="snippet-trigger"
                  className="text-[10px] font-bold text-muted-foreground ml-1"
                >
                  Gatilho (trigger)
                </label>
                <input
                  id="snippet-trigger"
                  type="text"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  placeholder="ex: $email, ;;assinatura"
                  className="w-full bg-background border border-border rounded-xl px-4 h-10 text-sm font-mono outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="snippet-desc"
                  className="text-[10px] font-bold text-muted-foreground ml-1"
                >
                  Descrição (opcional)
                </label>
                <input
                  id="snippet-desc"
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="ex: Meu e-mail profissional"
                  className="w-full bg-background border border-border rounded-xl px-4 h-10 text-sm outline-none focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="snippet-expansion"
                className="text-[10px] font-bold text-muted-foreground ml-1"
              >
                Expansão
              </label>
              <textarea
                id="snippet-expansion"
                value={newExpansion}
                onChange={(e) => setNewExpansion(e.target.value)}
                placeholder={
                  "Texto expandido. Use {{data}}, {{hora}}, {{semana}}, {{ano}}..."
                }
                rows={3}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50 transition-all resize-none"
              />
            </div>

            {previewExpanded && (
              <div className="p-3 rounded-xl bg-background border border-primary/20">
                <p className="text-[10px] font-bold text-primary mb-1">
                  Prévia
                </p>
                <p className="text-xs text-foreground font-mono whitespace-pre-wrap">
                  {previewExpanded}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePreview}
                disabled={!newExpansion.trim()}
                className="flex items-center gap-2 px-4 h-10 rounded-xl bg-muted text-muted-foreground text-xs font-bold hover:text-foreground transition-all disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                Prévia
              </button>
              <button
                type="button"
                onClick={handleAddSnippet}
                disabled={!newTrigger.trim() || !newExpansion.trim()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold transition-all",
                  newTrigger.trim() && newExpansion.trim()
                    ? `${themeStyles.bg} ${themeStyles.text}`
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Plus className="w-4 h-4" />
                Salvar atalho
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewTrigger("");
                  setNewExpansion("");
                  setNewDescription("");
                  setPreviewExpanded("");
                }}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed border-border text-muted-foreground text-xs font-semibold hover:border-primary/40 hover:text-foreground transition-all"
          >
            <Plus className="w-4 h-4" />
            Criar atalho de texto
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Tab principal ─────────────────────────────────────────────────────────────

export function IntegrationsTab() {
  const { themeStyles } = useTheme();
  const { isEnabled, isConnected, settings, updateSettings, setEnabled } =
    useDiscordRpc();

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
        // Chave permanece vazia
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

  const tmdbSteps = [
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
      {/* Discord Rich Presence Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-border/50 flex-wrap sm:flex-nowrap">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] shrink-0">
              <DiscordIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h4 className="text-lg font-bold text-foreground">
                  Discord Rich Presence
                </h4>
                {isEnabled ? (
                  isConnected ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Conectado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Activity className="w-3 h-3 animate-pulse" />
                      Ativo
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                    Desativado
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                Exiba seu status de produtividade em tempo real no Discord com
                opções personalizáveis para cada atividade.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-center sm:self-auto">
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => {
                setEnabled(checked);
                if (checked) {
                  toast.success("Discord Rich Presence ativado.");
                } else {
                  toast.info("Discord Rich Presence desativado.");
                }
              }}
              aria-label="Alternar Discord Rich Presence"
            />
          </div>
        </div>

        {/* Granular Feature Toggles */}
        {isEnabled && (
          <div className="p-6 bg-muted/10 space-y-4">
            <p className="text-xs font-bold text-muted-foreground">
              Atividades exibidas
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pomodoro Toggle */}
              <div className="p-4 rounded-xl bg-background border border-border/60 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-500 shrink-0">
                    <Timer className="w-4 h-4" />
                  </div>
                  <Switch
                    checked={settings.showPomodoro}
                    onCheckedChange={(checked) => {
                      updateSettings({ showPomodoro: checked });
                    }}
                    aria-label="Exibir Pomodoro no Discord"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Sessões Pomodoro
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Mostra contagem regressiva ao vivo, foco, pausas e ciclos
                    concluídos.
                  </p>
                </div>
              </div>

              {/* Task Timer Toggle */}
              <div className="p-4 rounded-xl bg-background border border-border/60 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <Switch
                    checked={settings.showTaskTimer}
                    onCheckedChange={(checked) => {
                      updateSettings({ showTaskTimer: checked });
                    }}
                    aria-label="Exibir tarefas no Discord"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Cronômetro de tarefas
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Indica o tempo acumulado durante a execução de tarefas
                    ativas.
                  </p>
                </div>
              </div>

              {/* Module Toggle */}
              <div className="p-4 rounded-xl bg-background border border-border/60 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2 rounded-lg bg-[#5865F2]/10 text-[#5865F2] shrink-0">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <Switch
                    checked={settings.showModule}
                    onCheckedChange={(checked) => {
                      updateSettings({ showModule: checked });
                    }}
                    aria-label="Exibir módulo ativo no Discord"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Módulos em uso
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Exibe quando você estiver em anotações, estudos, leitura,
                    hábitos ou flashcards.
                  </p>
                </div>
              </div>

              {/* Default / Dashboard Status Toggle */}
              <div className="p-4 rounded-xl bg-background border border-border/60 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <Switch
                    checked={settings.showDefault}
                    onCheckedChange={(checked) => {
                      updateSettings({ showDefault: checked });
                    }}
                    aria-label="Exibir painel inicial e status padrão"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Painel & status padrão
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Exibe status no início. Se desativado, o Discord só mostra
                    atividade durante ações específicas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TMDb Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Card header */}
        <div className="flex items-start gap-4 p-6 border-b border-border/50">
          <div className="p-3 rounded-xl bg-[#0d253f]/20 border border-[#0d253f]/30 shrink-0">
            <Film className="w-6 h-6 text-[#01b4e4]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className="text-lg font-bold text-foreground">
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
              Passo a passo
            </p>
            <ol className="space-y-3">
              {tmdbSteps.map((step, i) => (
                <li key={step.id} className="flex items-start gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[#01b4e4]/10 text-[#01b4e4] text-[10px] font-bold flex items-center justify-center mt-0.5">
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
                    <p className="text-[10px] text-amber-500 font-bold">
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
                    {isSaving ? "Validando" : "Salvar chave"}
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

      {/* Gestor de Vocabulário */}
      <VocabularyManager />

      {/* Atalhos de Texto */}
      <SnippetsManager />
    </div>
  );
}
