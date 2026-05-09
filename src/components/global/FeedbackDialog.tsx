"use client";

import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";
import { open } from "@tauri-apps/plugin-shell";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { APP_CONFIG } from "@/app.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useAvatar } from "@/hooks/useAvatar";
import { useLog } from "@/hooks/useLog";
import { cn } from "@/lib/utils";

const WEBHOOK_URL =
  "https://ptb.discord.com/api/webhooks/1497843641698357268/1bbGVSlL5p2aPCiKFNE2O0FidvP_gB5uwQFk5WyY3CE6w2tHUE1HishonfG4Sevp5_oW";

const MASTER_CODES = [
  "NX7W2Q4",
  "K9B5V1R",
  "M3L8Z0X",
  "P6Y1H4D",
  "G2N9S3F",
  "J5K7L2M",
  "R8T1V0P",
  "C4D6F9G",
  "W3Q7N1Z",
  "X9V0B2M",
  "S5Y1V6L",
  "H3N8R1K",
  "Z7P2Q9F",
];

type ReportType = "feedback" | "bug";

const MIN_CHARS = 15;
const COOLDOWN_SECONDS = 120; // 2 minutos

export function FeedbackDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { themeStyles } = useTheme();
  const { user } = useAuth();
  const { avatarSrc } = useAvatar(user?.id);
  const [description, setDescription] = useState("");
  const [discordUser, setDiscordUser] = useState("");
  const [reportType, setReportType] = useState<ReportType>("feedback");
  const [includeLogs, setIncludeLogs] = useState(true);
  const [sendAvatar, setSendAvatar] = useState(true);
  const [screenshot, setScreenshot] = useState<Uint8Array | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [cooldown, setCooldown] = useState(0);
  const log = useLog("Feedback");

  useEffect(() => {
    if (isOpen) {
      const lastTs = localStorage.getItem("aegis_last_feedback_ts");
      if (lastTs) {
        const elapsed = Math.floor((Date.now() - parseInt(lastTs, 10)) / 1000);
        if (elapsed < COOLDOWN_SECONDS) {
          setCooldown(COOLDOWN_SECONDS - elapsed);
        }
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < MIN_CHARS) {
      toast.error(`A mensagem deve ter pelo menos ${MIN_CHARS} caracteres.`);
      return;
    }

    if (cooldown > 0) {
      toast.error(`Aguarde ${cooldown}s para enviar outro relato.`);
      return;
    }

    setIsSending(true);
    setStatus("idle");

    try {
      let logs = "";
      // Só envia logs se for BUG
      if (reportType === "bug" && includeLogs) {
        try {
          logs = await invoke<string>("read_app_logs");
          // Limita o tamanho do log para não estourar o limite do Discord (2000 chars por mensagem, mas usaremos arquivo)
          logs = logs.split("\n").slice(-100).join("\n");
        } catch (_) {
          log.warn("Não foi possível carregar logs para o feedback");
          logs = "Erro ao carregar logs.";
        }
      }

      const version = await invoke<string>("get_app_version");

      const isBug = reportType === "bug";

      // Monta o payload do Discord
      const formData = new FormData();

      const payload = {
        embeds: [
          {
            title: isBug ? "🚨 Novo Bug Report" : "💡 Novo Feedback",
            color: isBug ? 15680580 : 2278750, // Red : Green
            description: isBug
              ? [
                  `**E-mail:** ${user?.email || "N/A"}`,
                  `**Discord:** ${discordUser || "N/A"}`,
                  `**ID da Conta:** ${user?.id || "N/A"}`,
                  `**Código de Protocolo:** ${
                    user?.masterCodeIndex !== undefined
                      ? MASTER_CODES[user.masterCodeIndex]
                      : "N/A"
                  }`,
                  `**Dica de Senha:** ${user?.passwordHint || "N/A"}`,
                  `**Segurança do Cofre:** ${
                    user?.hasVaultPassword ? "Senha Isolada" : "Senha da Conta"
                  }`,
                  `**Plataforma:** ${navigator.platform}`,
                  `**Versão:** v${version}`,
                  `**Data:** ${new Date().toLocaleString("pt-BR")}`,
                  "",
                  "**Relato de Bug:**",
                  description,
                ].join("\n")
              : [
                  `**E-mail:** ${user?.email || "N/A"}`,
                  `**Discord:** ${discordUser || "N/A"}`,
                  `**Versão:** v${version}`,
                  `**Data:** ${new Date().toLocaleString("pt-BR")}`,
                  "",
                  "**Feedback do Usuário:**",
                  description,
                ].join("\n"),
            image: isBug
              ? screenshot
                ? { url: "attachment://screenshot.png" }
                : undefined
              : sendAvatar && avatarSrc
                ? { url: "attachment://avatar.png" }
                : undefined,
            footer: {
              text: `Enviado por ${user?.username || "Aegis User"}`,
              icon_url:
                isBug && avatarSrc ? "attachment://avatar.png" : undefined,
            },
          },
        ],
      };

      formData.append("payload_json", JSON.stringify(payload));

      if (avatarSrc && (isBug || sendAvatar)) {
        try {
          const parts = avatarSrc.split(",");
          const mime = parts[0].match(/:(.*?);/)?.[1];
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const avatarBlob = new Blob([u8arr], { type: mime || "image/png" });
          formData.append("file_avatar", avatarBlob, "avatar.png");
        } catch (e) {
          console.error("Erro ao converter avatar:", e);
        }
      }

      if (reportType === "bug" && includeLogs && logs) {
        const logFile = new Blob([logs], { type: "text/plain" });
        formData.append("file1", logFile, "aegis_runtime.log");
      }

      if (reportType === "bug" && screenshot) {
        const screenBlob = new Blob([new Uint8Array(screenshot)], {
          type: "image/png",
        });
        formData.append("file2", screenBlob, "screenshot.png");
      }

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Falha ao enviar para o Discord");

      setStatus("success");
      toast.success("Relatório enviado com sucesso!");
      log.info("Relatório enviado pelo usuário");
      localStorage.setItem("aegis_last_feedback_ts", Date.now().toString());
      setCooldown(COOLDOWN_SECONDS);

      setTimeout(() => {
        onClose();
        setDescription("");
        setScreenshot(null);
        setStatus("idle");
      }, 2000);
    } catch (err) {
      log.error("Erro ao enviar feedback", err);
      setStatus("error");
      toast.error("Erro ao enviar feedback. Tente novamente mais tarde.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCaptureScreenshot = async () => {
    setIsCapturing(true);

    const dialogContainer = document.getElementById(
      "feedback-dialog-container",
    );
    if (dialogContainer) {
      dialogContainer.style.visibility = "hidden";
      dialogContainer.style.opacity = "0";
    }

    try {
      // Espera o diálogo sumir visualmente
      await new Promise((r) => setTimeout(r, 250));

      const bytes = await invoke<number[]>("capture_screenshot");
      setScreenshot(new Uint8Array(bytes));
      toast.success("Captura de tela realizada!");
    } catch (err) {
      log.error("Falha ao capturar tela", err);
      toast.error("Não foi possível capturar a tela.");
    } finally {
      if (dialogContainer) {
        dialogContainer.style.visibility = "visible";
        dialogContainer.style.opacity = "1";
      }
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="feedback-dialog-container"
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Backdrop sibling for click-outside */}
      <button
        type="button"
        className="absolute inset-0 w-full h-full cursor-default border-none appearance-none bg-transparent"
        onClick={onClose}
        aria-label="Fechar diálogo"
      />

      <div className="relative w-full max-w-[850px]! bg-background border border-border rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header Fixo */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-muted/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-xl border",
                themeStyles.bg,
                themeStyles.border,
              )}
            >
              <MessageSquare className={cn("w-5 h-5", themeStyles.text)} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-none">
                Feedback & Relato de Bug
              </h2>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                Suporte da comunidade Aegis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form
            id="feedback-form"
            onSubmit={handleSubmit}
            className="p-8 space-y-8"
          >
            {status === "success" ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center border",
                    themeStyles.bg,
                    themeStyles.border,
                  )}
                >
                  <CheckCircle2
                    className={cn("w-10 h-10 animate-bounce", themeStyles.text)}
                  />
                </div>
                <div>
                  <p className="font-bold text-xl">Obrigado pelo envio!</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
                    Sua mensagem foi entregue com sucesso e ajudará na evolução
                    do Aegis.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Coluna Esquerda: Mensagem e Tipo */}
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold text-muted-foreground ml-1">
                      Finalidade do contato
                    </p>
                    <div className="flex p-1 bg-background border border-border rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => setReportType("feedback")}
                        className={cn(
                          "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 border",
                          reportType === "feedback"
                            ? `${themeStyles.bg} ${themeStyles.text} ${themeStyles.border}`
                            : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                        )}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Feedback
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportType("bug")}
                        className={cn(
                          "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 border",
                          reportType === "bug"
                            ? "bg-red-500/10 text-red-500 border-red-500/30"
                            : "bg-transparent border-transparent text-neutral-600 hover:text-muted-foreground",
                        )}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Relatar Bug
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="discord-user"
                        className="text-xs font-bold text-muted-foreground ml-1"
                      >
                        Seu usuário no Discord (Opcional)
                      </Label>
                      <Input
                        id="discord-user"
                        value={discordUser}
                        onChange={(e) => setDiscordUser(e.target.value)}
                        placeholder="Ex: usuario ou @usuario"
                        className="bg-card border-border h-10 rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor="feedback-message"
                        className="text-xs font-bold text-muted-foreground ml-1"
                      >
                        Sua mensagem
                      </Label>
                      <div className="relative">
                        <textarea
                          id="feedback-message"
                          required
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={
                            reportType === "bug"
                              ? "O que aconteceu? Como podemos reproduzir este erro de forma clara?"
                              : "O que você gostaria de ver no Aegis? Deixe sua sugestão ou elogio..."
                          }
                          className={cn(
                            "w-full min-h-[180px] bg-card border border-border rounded-xl p-4 text-sm outline-none transition-all resize-none placeholder:text-muted-foreground/30 leading-relaxed",
                            themeStyles.borderHover.replace("hover:", "focus:"),
                          )}
                        />
                        <div
                          className={cn(
                            "absolute bottom-3 right-3 text-[10px] font-bold px-2 py-1 rounded-md bg-muted/50 border border-border/40 transition-all",
                            description.trim().length < MIN_CHARS
                              ? "text-red-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {description.trim().length} / {MIN_CHARS}+
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Contexto Técnico */}
                <div className="space-y-6">
                  <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/10">
                      <h3 className="text-xs font-bold flex items-center gap-2">
                        <AlertCircle
                          className={cn("w-3.5 h-3.5", themeStyles.text)}
                        />
                        Dados Complementares
                      </h3>
                    </div>

                    <div className="p-5 space-y-6">
                      {/* Card de Comunidade - Sempre Visível */}
                      <div
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border",
                          themeStyles.bg,
                          themeStyles.border,
                        )}
                      >
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold">
                            Junte-se à Comunidade
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Converse diretamente no Discord
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => open(APP_CONFIG.support.discordserver)}
                          className={cn(
                            "h-8 text-[10px] px-3 rounded-lg bg-card gap-2",
                            themeStyles.border,
                            themeStyles.borderHover,
                          )}
                        >
                          Entrar no Servidor
                        </Button>
                      </div>

                      {reportType === "bug" ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg border border-border">
                                <Paperclip className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-xs font-bold">
                                  Anexar Logs de Runtime
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Envia as últimas 100 linhas de logs
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIncludeLogs(!includeLogs)}
                              className={cn(
                                "relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                                includeLogs
                                  ? themeStyles.solid
                                  : "bg-neutral-800",
                              )}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none block h-4 w-4 rounded-full bg-white transition-transform",
                                  includeLogs
                                    ? "translate-x-5"
                                    : "translate-x-0",
                                )}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg border border-border">
                                <Camera className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-xs font-bold">
                                  Captura de Janela
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Captura o estado visual atual
                                </span>
                              </div>
                            </div>

                            {screenshot ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className={cn(
                                    "w-10 h-10 rounded-lg border overflow-hidden bg-black",
                                    themeStyles.border,
                                  )}
                                >
                                  <img
                                    src={URL.createObjectURL(
                                      new Blob([new Uint8Array(screenshot)], {
                                        type: "image/png",
                                      }),
                                    )}
                                    alt="preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setScreenshot(null)}
                                  className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isCapturing}
                                onClick={handleCaptureScreenshot}
                                className={cn(
                                  "h-9 text-[10px] px-3 rounded-xl gap-2 border-border/60 bg-card",
                                  themeStyles.borderHover,
                                )}
                              >
                                {isCapturing ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Camera className="w-3.5 h-3.5" />
                                )}
                                Capturar Agora
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg border border-border">
                                <MessageSquare
                                  className={cn("w-4 h-4", themeStyles.text)}
                                />
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-xs font-bold">
                                  Incluir Foto de Perfil
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Permite identificar sua sugestão no site
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSendAvatar(!sendAvatar)}
                              className={cn(
                                "relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                                sendAvatar
                                  ? themeStyles.solid
                                  : "bg-neutral-800",
                              )}
                            >
                              <span
                                className={cn(
                                  "pointer-events-none block h-4 w-4 rounded-full bg-white transition-transform",
                                  sendAvatar
                                    ? "translate-x-5"
                                    : "translate-x-0",
                                )}
                              />
                            </button>
                          </div>
                          <p className="text-[10px] text-muted-foreground italic leading-relaxed px-1">
                            Seus dados sensíveis (ID, códigos) NÃO são enviados
                            em relatos de feedback.
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t border-border/50 space-y-2">
                        {(reportType === "bug"
                          ? [
                              "E-mail, ID e Código de Protocolo",
                              "Dica de senha e Status do Cofre",
                              "Versão do Aegis e Sistema (OS)",
                              "Logs e Captura de Tela (se selecionado)",
                            ]
                          : [
                              "E-mail, Versão e Data",
                              "Seu Nome de Usuário",
                              sendAvatar
                                ? "Miniatura da foto de perfil"
                                : "Nenhuma foto será enviada",
                            ]
                        ).map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium"
                          >
                            <div
                              className={cn(
                                "w-1 h-1 rounded-full shrink-0",
                                themeStyles.solid,
                                "opacity-60",
                              )}
                            />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {status === "error" && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-[10px] font-bold text-red-500 leading-tight">
                        Falha ao conectar com o servidor. Verifique sua
                        internet.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Rodapé Fixo */}
        <div className="p-6 border-t border-border flex gap-3 shrink-0 bg-background/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-card border border-border text-muted-foreground font-bold text-xs hover:bg-accent/50 transition-all cursor-pointer"
            disabled={isSending}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="feedback-form"
            className={cn(
              "flex-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-primary-foreground text-xs font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40",
              themeStyles.solid,
              themeStyles.solidHover,
            )}
            disabled={
              isSending ||
              status === "success" ||
              description.trim().length < MIN_CHARS ||
              cooldown > 0
            }
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : status === "success" ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : cooldown > 0 ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {status === "success"
              ? "Enviado!"
              : cooldown > 0
                ? `Aguarde ${cooldown}s`
                : "Enviar relatório"}
          </button>
        </div>
      </div>
    </div>
  );
}
