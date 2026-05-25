"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Edit2, Eye, EyeOff, Key, Plus, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

// Lista otimizada de 80 palavras em português para o gerador Diceware
const DICEWARE_WORDLIST = [
  "casa",
  "vida",
  "amor",
  "sol",
  "lua",
  "mar",
  "terra",
  "fogo",
  "agua",
  "vento",
  "tempo",
  "livro",
  "porta",
  "janela",
  "chave",
  "mesa",
  "cadeira",
  "prato",
  "copo",
  "garfo",
  "amigo",
  "gente",
  "cidade",
  "carro",
  "trem",
  "planta",
  "flor",
  "fruta",
  "arvore",
  "folha",
  "pedra",
  "areia",
  "ouro",
  "prata",
  "ferro",
  "cobre",
  "azul",
  "verde",
  "amarelo",
  "branco",
  "preto",
  "cinza",
  "luz",
  "sombra",
  "noite",
  "dia",
  "ano",
  "mes",
  "semana",
  "hora",
  "campo",
  "monte",
  "rio",
  "lago",
  "ponte",
  "estrada",
  "caminho",
  "passo",
  "salto",
  "voar",
  "cantar",
  "sorrir",
  "olhar",
  "ouvir",
  "falar",
  "pensar",
  "criar",
  "fazer",
  "saber",
  "querer",
  "novo",
  "belo",
  "forte",
  "livre",
  "doce",
  "quente",
  "frio",
  "claro",
  "escuro",
  "feliz",
];

// Medidor de Força de Senha

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  tip: string;
}

function evaluatePasswordStrength(
  password: string,
  serviceName: string,
  username: string,
): StrengthResult {
  if (!password) {
    return { score: 0, label: "", color: "", tip: "" };
  }

  let score = 0;
  const tips: string[] = [];
  const lower = password.toLowerCase();

  // Pontuação baseada no comprimento
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length < 8) tips.push("Use pelo menos 8 caracteres");

  // Diversidade de caracteres
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const charTypes = [hasLower, hasUpper, hasDigit, hasSpecial].filter(
    Boolean,
  ).length;

  if (charTypes >= 3) score += 1;
  if (charTypes >= 4) score += 1;

  if (!hasUpper) tips.push("Adicione letras maiúsculas");
  if (!hasDigit) tips.push("Adicione números");
  if (!hasSpecial) tips.push("Adicione caracteres especiais (!@#$%)");

  // Penaliza caracteres repetidos (ex: "aaa", "111")
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    tips.push("Evite caracteres repetidos");
  }

  // Penaliza sequências numéricas (ex: "123", "987")
  if (
    /(?:012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/.test(
      password,
    )
  ) {
    score -= 1;
    tips.push("Evite sequências numéricas");
  }

  // Penaliza se a senha contiver o nome do usuário ou do serviço
  if (
    serviceName &&
    serviceName.length >= 3 &&
    lower.includes(serviceName.toLowerCase())
  ) {
    score -= 1;
    tips.push("Não use o nome do serviço na senha");
  }
  if (
    username &&
    username.length >= 3 &&
    lower.includes(username.toLowerCase())
  ) {
    score -= 1;
    tips.push("Não use seu nome de usuário na senha");
  }

  // Limita a pontuação entre 0 e 4
  const finalScore = Math.max(0, Math.min(4, score));

  const levels: Omit<StrengthResult, "tip">[] = [
    { score: 0, label: "Muito fraca", color: "bg-red-500" },
    { score: 1, label: "Fraca", color: "bg-orange-500" },
    { score: 2, label: "Razoável", color: "bg-amber-500" },
    { score: 3, label: "Forte", color: "bg-emerald-500" },
    { score: 4, label: "Excelente", color: "bg-cyan-500" },
  ];

  const level = levels[finalScore];
  return { ...level, tip: tips[0] || "" };
}

function PasswordStrengthMeter({
  password,
  serviceName,
  username,
}: {
  password: string;
  serviceName: string;
  username: string;
}) {
  const strength = useMemo(
    () => evaluatePasswordStrength(password, serviceName, username),
    [password, serviceName, username],
  );

  if (!password) return null;

  const percentage = ((strength.score + 1) / 5) * 100;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-border/60 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              strength.color,
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span
          className={cn(
            "text-[10px] font-bold min-w-[70px] text-right transition-colors",
            strength.score <= 1
              ? "text-red-500"
              : strength.score === 2
                ? "text-amber-500"
                : "text-emerald-500",
          )}
        >
          {strength.label}
        </span>
      </div>
      {strength.tip && (
        <p className="text-[10px] text-muted-foreground/80 font-medium">
          💡 {strength.tip}
        </p>
      )}
    </div>
  );
}

// Modal
interface AddEditModalProps {
  isEditing: boolean;
  newName: string;
  setNewName: (val: string) => void;
  newUrl: string;
  setNewUrl: (val: string) => void;
  newUsername: string;
  setNewUsername: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  newNote: string;
  setNewNote: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function AddEditModal({
  isEditing,
  newName,
  setNewName,
  newUrl,
  setNewUrl,
  newUsername,
  setNewUsername,
  newPassword,
  setNewPassword,
  newNote,
  setNewNote,
  onClose,
  onSave,
}: AddEditModalProps) {
  const color = getModuleColor("passwords");
  const theme = getColorTheme(color);
  const lc = "text-xs font-medium text-muted-foreground ml-0.5";
  const requiredClass = "text-red-500 ml-1";
  const inputStyle = cn(
    "bg-card border-border h-11 rounded-xl text-sm font-medium transition-all placeholder:text-neutral-700",
    theme.borderHover.replace("hover:", "focus:"),
  );

  // Estados para o painel do gerador avançado de senhas
  const [showGenerator, setShowGenerator] = useState(false);
  const [genMode, setGenMode] = useState<"random" | "diceware">("random");
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [diceWordsCount, setDiceWordsCount] = useState(4);
  const [diceSeparator, setDiceSeparator] = useState("-");
  const [showPassword, setShowPassword] = useState(false);

  // Função para gerar senha aleatória ou frase Diceware em português
  const generatePassword = useCallback(() => {
    if (genMode === "random") {
      const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lowers = "abcdefghijklmnopqrstuvwxyz";
      const numbers = "0123456789";
      const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

      let pool = "";
      if (genUpper) pool += uppers;
      if (genLower) pool += lowers;
      if (genNumbers) pool += numbers;
      if (genSymbols) pool += symbols;

      if (!pool) return "";

      let result = "";
      // Garante a presença de pelo menos um caractere de cada conjunto selecionado
      const mandatory: string[] = [];
      if (genUpper)
        mandatory.push(uppers[Math.floor(Math.random() * uppers.length)]);
      if (genLower)
        mandatory.push(lowers[Math.floor(Math.random() * lowers.length)]);
      if (genNumbers)
        mandatory.push(numbers[Math.floor(Math.random() * numbers.length)]);
      if (genSymbols)
        mandatory.push(symbols[Math.floor(Math.random() * symbols.length)]);

      const remainingLength = Math.max(0, genLength - mandatory.length);
      for (let i = 0; i < remainingLength; i++) {
        result += pool[Math.floor(Math.random() * pool.length)];
      }

      // Embaralha o array para maior aleatoriedade
      const finalArray = [...mandatory, ...result.split("")];
      for (let i = finalArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalArray[i], finalArray[j]] = [finalArray[j], finalArray[i]];
      }

      return finalArray.join("");
    } else {
      // Gerador Diceware em português do Brasil
      const chosenWords: string[] = [];
      for (let i = 0; i < diceWordsCount; i++) {
        const randomWord =
          DICEWARE_WORDLIST[
            Math.floor(Math.random() * DICEWARE_WORDLIST.length)
          ];
        chosenWords.push(randomWord);
      }
      return chosenWords.join(diceSeparator);
    }
  }, [
    genMode,
    genLength,
    genUpper,
    genLower,
    genNumbers,
    genSymbols,
    diceWordsCount,
    diceSeparator,
  ]);

  // Atualiza automaticamente o campo de senha ao alterar qualquer parâmetro
  useEffect(() => {
    if (showGenerator) {
      const generated = generatePassword();
      if (generated) {
        setNewPassword(generated);
      }
    }
  }, [showGenerator, generatePassword, setNewPassword]);

  // Ativa automaticamente a visualização em texto simples da senha quando o gerador de senhas é aberto
  useEffect(() => {
    if (showGenerator) {
      setShowPassword(true);
    }
  }, [showGenerator]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[850px]! bg-background border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Cabeçalho - Fixo */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn("p-2 rounded-xl border", theme.bg, theme.border)}
            >
              {isEditing ? (
                <Edit2 className={cn("w-5 h-5", theme.text)} />
              ) : (
                <Plus className={cn("w-5 h-5", theme.text)} />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-none">
                {isEditing ? "Editar credencial" : "Nova credencial"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gestão de acesso
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Área rolável */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <form
            id="password-form"
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-1.5">
                <Label className={lc}>
                  Serviço <span className={requiredClass}>*</span>
                </Label>
                <Input
                  placeholder="Ex: Google, Netflix"
                  className={inputStyle}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className={lc}>
                  Usuário / e-mail <span className={requiredClass}>*</span>
                </Label>
                <Input
                  placeholder="Seu usuário"
                  className={inputStyle}
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className={lc}>URL</Label>
                <Input
                  placeholder="Ex: google.com"
                  className={inputStyle}
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className={lc}>
                    Senha <span className={requiredClass}>*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowGenerator(!showGenerator)}
                    className="text-[10px] text-blue-500 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    {showGenerator ? "Ocultar Gerador" : "Gerar Senha"}
                  </button>
                </div>
                <div className="relative w-full flex items-center">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha de acesso"
                    className={cn(inputStyle, "w-full pr-10")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none flex items-center justify-center"
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <PasswordStrengthMeter
                  password={newPassword}
                  serviceName={newName}
                  username={newUsername}
                />
              </div>

              {/* Gerador de Senhas Acordeão */}
              <AnimatePresence>
                {showGenerator && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 26 }}
                    className="col-span-2 overflow-hidden"
                  >
                    <div className="rounded-xl border border-border bg-card/25 p-5 space-y-4 backdrop-blur-sm">
                      {/* Modo de Abas: Aleatório vs Diceware */}
                      <div className="flex justify-between items-center border-b border-border/40 pb-3">
                        <div className="flex gap-1.5 bg-background/50 p-1 rounded-lg border border-border/40">
                          <button
                            type="button"
                            onClick={() => setGenMode("random")}
                            className={cn(
                              "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                              genMode === "random"
                                ? "bg-card text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            Senha Aleatória
                          </button>
                          <button
                            type="button"
                            onClick={() => setGenMode("diceware")}
                            className={cn(
                              "px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer",
                              genMode === "diceware"
                                ? "bg-card text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            Frase Diceware (pt-BR)
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const generated = generatePassword();
                            if (generated) setNewPassword(generated);
                          }}
                          className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 bg-background border border-border hover:bg-accent/40 rounded-lg text-foreground hover:text-foreground transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Regerar
                        </button>
                      </div>

                      {/* Configurações de acordo com o modo */}
                      {genMode === "random" ? (
                        <div className="space-y-4">
                          {/* Slider de Comprimento */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                              <span>Comprimento da senha:</span>
                              <span
                                className={cn("text-xs font-bold", theme.text)}
                              >
                                {genLength} caracteres
                              </span>
                            </div>
                            <input
                              type="range"
                              min="6"
                              max="64"
                              value={genLength}
                              onChange={(e) =>
                                setGenLength(parseInt(e.target.value, 10))
                              }
                              className="w-full h-1.5 bg-border/60 rounded-lg appearance-none cursor-pointer accent-current"
                              style={{
                                color: `var(--color-${color}-500, #3b82f6)`,
                              }}
                            />
                          </div>

                          {/* Checkboxes de Complexidade */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={genUpper}
                                onChange={(e) => setGenUpper(e.target.checked)}
                                className="rounded border-border bg-background text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <span>Maiúsculas (A-Z)</span>
                            </label>

                            <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={genLower}
                                onChange={(e) => setGenLower(e.target.checked)}
                                className="rounded border-border bg-background text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <span>Minúsculas (a-z)</span>
                            </label>

                            <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={genNumbers}
                                onChange={(e) =>
                                  setGenNumbers(e.target.checked)
                                }
                                className="rounded border-border bg-background text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <span>Números (0-9)</span>
                            </label>

                            <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={genSymbols}
                                onChange={(e) =>
                                  setGenSymbols(e.target.checked)
                                }
                                className="rounded border-border bg-background text-blue-500 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                              />
                              <span>Símbolos (!@#$%)</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Slider de Quantidade de Palavras */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                              <span>Número de palavras:</span>
                              <span
                                className={cn("text-xs font-bold", theme.text)}
                              >
                                {diceWordsCount} palavras
                              </span>
                            </div>
                            <input
                              type="range"
                              min="3"
                              max="8"
                              value={diceWordsCount}
                              onChange={(e) =>
                                setDiceWordsCount(parseInt(e.target.value, 10))
                              }
                              className="w-full h-1.5 bg-border/60 rounded-lg appearance-none cursor-pointer accent-current"
                              style={{
                                color: `var(--color-${color}-500, #3b82f6)`,
                              }}
                            />
                          </div>

                          {/* Separador Customizado */}
                          <div className="flex items-center gap-4 pt-1">
                            <div className="space-y-1">
                              <label
                                htmlFor="custom-separator-input"
                                className="text-[10px] font-bold text-muted-foreground uppercase block"
                              >
                                Separador customizado
                              </label>
                              <input
                                id="custom-separator-input"
                                type="text"
                                maxLength={5}
                                value={diceSeparator}
                                onChange={(e) =>
                                  setDiceSeparator(e.target.value)
                                }
                                placeholder="Ex: -, ., _"
                                className="bg-background border border-border w-24 px-3 py-1.5 rounded-lg text-xs font-bold text-center focus:border-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="col-span-2 space-y-1.5">
                <Label className={lc}>Notas (criptografado)</Label>
                <Input
                  placeholder="Dicas ou observações importantes sobre este acesso..."
                  className={inputStyle}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
            </div>
          </form>
          <div className="mt-4 flex items-center justify-end">
            <span className="text-[10px] text-muted-foreground font-medium">
              <span className={requiredClass}>*</span> Campos obrigatórios
            </span>
          </div>
        </div>

        {/* Rodapé Fixo */}
        <div className="flex gap-3 p-6 border-t border-border shrink-0 bg-background/50">
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
          >
            Cancelar
          </motion.button>
          <motion.button
            type="submit"
            form="password-form"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={cn(
              "flex-2 px-4 py-3 rounded-xl text-white font-bold text-xs transition-all cursor-pointer",
              theme.solid,
              theme.solidHover,
            )}
          >
            {isEditing ? "Salvar alterações" : "Criar credencial"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
