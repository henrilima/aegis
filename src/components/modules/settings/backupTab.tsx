"use client";

import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  AlertTriangle,
  Database,
  Download,
  FileJson,
  FileText,
  HardDriveDownload,
  HardDriveUpload,
  Info,
  Key,
  Lock,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export function BackupTab() {
  const { user } = useAuth();
  const { themeStyles } = useTheme();

  const [backupPassword, setBackupPassword] = useState("");
  const [vaultPassword, setVaultPassword] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExportingUser, setIsExportingUser] = useState(false);
  const [isImportingUser, setIsImportingUser] = useState(false);

  // Estados para o recurso de Backup Automático em JSON
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aegis_auto_backup_enabled") === "true";
    }
    return false;
  });

  const [backupInterval, setBackupInterval] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aegis_auto_backup_interval");
      return saved ? Number(saved) : 7;
    }
    return 7;
  });

  const [backupPath, setBackupPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aegis_auto_backup_path") || "";
    }
    return "";
  });

  const [lastBackupDate, setLastBackupDate] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("aegis_last_backup_date") || "";
    }
    return "";
  });

  const [isRunningManualBackup, setIsRunningManualBackup] = useState(false);
  const [isImportingRawJson, setIsImportingRawJson] = useState(false);

  // Sincroniza as configurações de backup automático com o localStorage
  useEffect(() => {
    localStorage.setItem(
      "aegis_auto_backup_enabled",
      String(autoBackupEnabled),
    );
  }, [autoBackupEnabled]);

  useEffect(() => {
    localStorage.setItem("aegis_auto_backup_interval", String(backupInterval));
  }, [backupInterval]);

  useEffect(() => {
    localStorage.setItem("aegis_auto_backup_path", backupPath);
  }, [backupPath]);

  // Abre caixa de diálogo nativa do Tauri para seleção da pasta local
  const handleSelectBackupDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected) {
        setBackupPath(selected as string);
        toast.success("Diretório de backup selecionado");
      }
    } catch (_e) {
      toast.error("Erro ao selecionar diretório");
    }
  };

  // Executa o backup JSON do perfil
  const handleRunManualBackup = async () => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }
    if (!backupPath) {
      toast.error("Selecione uma pasta de destino");
      return;
    }
    try {
      setIsRunningManualBackup(true);
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `aegis_auto_backup_${user.username}_${dateStr}.json`;
      const fullPath = `${backupPath}/${filename}`;

      await invoke("global_export_raw_user_json", {
        userId: String(user.id),
        path: fullPath,
      });
      toast.success("Backup do perfil gerado com sucesso");

      const nowIso = new Date().toISOString();
      setLastBackupDate(nowIso);
      localStorage.setItem("aegis_last_backup_date", nowIso);
    } catch (e) {
      toast.error(
        `Falha no backup: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsRunningManualBackup(false);
    }
  };

  // Restaura dados do perfil a partir de um backup raw JSON
  const handleImportRawJson = async () => {
    if (!user) return;
    try {
      setIsImportingRawJson(true);
      const filePath = await open({
        filters: [
          { name: "Aegis Profile Backup (JSON)", extensions: ["json"] },
        ],
        multiple: false,
      });

      if (!filePath) {
        setIsImportingRawJson(false);
        return;
      }

      await invoke("global_import_raw_user_json", {
        targetUserId: String(user.id),
        path: filePath,
      });
      toast.success("Dados do perfil mesclados com sucesso! Recarregando...");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e) {
      toast.error(
        `Erro ao restaurar: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsImportingRawJson(false);
    }
  };

  const getHashBytes = async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer));
  };

  const handleExportSystem = async () => {
    if (!backupPassword || backupPassword.length < 4) {
      toast.error("A senha do backup deve ter pelo menos 4 caracteres");
      return;
    }

    try {
      setIsExporting(true);
      const filePath = await save({
        filters: [{ name: "Aegis System Bundle", extensions: ["aegissystem"] }],
        defaultPath: `aegis_backup_completo_${new Date().toISOString().split("T")[0]}.aegissystem`,
      });

      if (!filePath) {
        setIsExporting(false);
        return;
      }

      const keyBytes = await getHashBytes(backupPassword);
      await invoke("global_export_full_system_bundle", {
        path: filePath,
        keyBytes,
      });
      toast.success("Backup do sistema exportado com sucesso");
      setBackupPassword("");
    } catch (e) {
      toast.error(
        `Falha ao exportar: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSystem = async () => {
    if (!backupPassword || backupPassword.length < 4) {
      toast.error("Digite a senha do backup");
      return;
    }

    try {
      setIsImporting(true);
      const filePath = await open({
        filters: [{ name: "Aegis System Bundle", extensions: ["aegissystem"] }],
        multiple: false,
      });

      if (!filePath) {
        setIsImporting(false);
        return;
      }

      const keyBytes = await getHashBytes(backupPassword);
      await invoke("global_import_full_system_bundle", {
        path: filePath,
        keyBytes,
      });
      toast.success("Sistema restaurado! Reiniciando...");
      setBackupPassword("");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e) {
      toast.error(
        `Falha ao restaurar: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportUser = async () => {
    if (!user) return;
    if (!backupPassword || backupPassword.length < 4) {
      toast.error("Digite a senha do pacote de migração");
      return;
    }
    if (!vaultPassword) {
      toast.error("Digite a senha do seu cofre para descriptografar os dados");
      return;
    }

    try {
      setIsExportingUser(true);
      const filePath = await save({
        filters: [{ name: "Aegis User Package", extensions: ["aegisuser"] }],
        defaultPath: `aegis_usuario_${user.username}.aegisuser`,
      });

      if (!filePath) return;

      const keyBytes = await getHashBytes(backupPassword);
      await invoke("global_export_user_package", {
        userId: user.id,
        masterPwd: vaultPassword,
        path: filePath,
        keyBytes,
      });
      toast.success("Dados do usuário exportados com sucesso");
      setBackupPassword("");
      setVaultPassword("");
    } catch (e) {
      toast.error(
        `Erro na exportação: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsExportingUser(false);
    }
  };

  const handleImportUser = async () => {
    if (!user) return;
    if (!backupPassword || backupPassword.length < 4) {
      toast.error("Digite a senha do pacote de migração");
      return;
    }
    if (!vaultPassword) {
      toast.error("Digite a senha do seu cofre para criptografar os dados");
      return;
    }

    try {
      setIsImportingUser(true);
      const filePath = await open({
        filters: [{ name: "Aegis User Package", extensions: ["aegisuser"] }],
        multiple: false,
      });

      if (!filePath) return;

      const keyBytes = await getHashBytes(backupPassword);
      await invoke("global_import_user_package", {
        targetUserId: user.id,
        masterPwd: vaultPassword,
        path: filePath,
        keyBytes,
      });
      toast.success("Dados mesclados no seu perfil! Recarregando...");
      setBackupPassword("");
      setVaultPassword("");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e) {
      toast.error(
        `Erro na importação: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsImportingUser(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header Padronizado */}
      <section className="flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            themeStyles.bg,
          )}
        >
          <HardDriveDownload className={cn("w-6 h-6", themeStyles.text)} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Cópias de segurança
          </h2>
          <p className="text-xs text-muted-foreground">
            Crie backups, exporte perfis ou agende cópias automáticas dos seus
            dados.
          </p>
        </div>
      </section>

      {/* Guia de Formatos de Backup */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Info className={cn("w-3.5 h-3.5", themeStyles.text)} />
          <h3 className="text-xs font-semibold text-muted-foreground">
            Guia de formatos de backup
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Sistema Completo */}
          <div className="p-4 bg-card/40 border border-border/60 rounded-xl flex flex-col justify-between space-y-3 hover:border-border/100 transition-all duration-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "p-2 bg-accent/50 rounded-lg",
                    themeStyles.text,
                  )}
                >
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 bg-accent/40 text-muted-foreground border border-border/40 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Protegido com senha
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Sistema completo (.aegissystem)
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Cópia idêntica do banco de dados do Aegis. Salva todos os
                  usuários, senhas de todos os cofres, notas e configurações
                  globais.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-border/20 text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                Restauração:
              </span>{" "}
              substitui permanentemente todo o sistema atual do aplicativo.
            </div>
          </div>

          {/* Card 2: Perfil Criptografado */}
          <div className="p-4 bg-card/40 border border-border/60 rounded-xl flex flex-col justify-between space-y-3 hover:border-border/100 transition-all duration-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "p-2 bg-accent/50 rounded-lg",
                    themeStyles.text,
                  )}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 bg-accent/40 text-muted-foreground border border-border/40 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Protegido com senha
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Perfil de usuário (.aegisuser)
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Cópia criptografada de um único perfil ativo. Salva hábitos,
                  tarefas, notas, estudos e credenciais criptografadas do cofre.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-border/20 text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                Restauração:
              </span>{" "}
              mescla todas as informações do arquivo diretamente ao perfil
              logado.
            </div>
          </div>

          {/* Card 3: Backup JSON */}
          <div className="p-4 bg-card/40 border border-border/60 rounded-xl flex flex-col justify-between space-y-3 hover:border-border/100 transition-all duration-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "p-2 bg-accent/50 rounded-lg",
                    themeStyles.text,
                  )}
                >
                  <FileJson className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 bg-accent/40 text-muted-foreground border border-border/40 rounded-full flex items-center gap-1">
                  <Unlock className="w-2.5 h-2.5" /> Sem senhas
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Progresso do perfil (.json)
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Exportação em formato aberto. Contém apenas os dados de
                  progresso de uso do perfil. Não exporta senhas por motivos de
                  privacidade.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-border/20 text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                Restauração:
              </span>{" "}
              importa e mescla o progresso JSON a partir da seção abaixo.
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Autenticação para Dados */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground px-1">
            Segurança de pacotes criptografados (.aegissystem / .aegisuser)
          </h3>
          <div className="p-5 bg-card/30 border border-border/60 rounded-xl space-y-5">
            <div className="flex items-center gap-3">
              <div
                className={cn("p-2 bg-accent/50 rounded-lg", themeStyles.text)}
              >
                <Key className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Credenciais de criptografia
                </p>
                <p className="text-xs text-muted-foreground">
                  Senhas requeridas para gerar ou ler os backups protegidos.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between ml-0.5">
                  <label
                    className="text-[11px] font-semibold text-muted-foreground ml-0.5 block"
                    htmlFor="backup-password-input"
                  >
                    Senha do arquivo
                  </label>
                  <span className="text-[10px] text-muted-foreground/60 font-semibold">
                    Obrigatório para sistema & usuário
                  </span>
                </div>
                <input
                  id="backup-password-input"
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  placeholder="Senha para proteger ou descriptografar o pacote"
                  className="w-full h-10 bg-background border border-border/60 rounded-lg px-3 text-xs focus:ring-1 focus:ring-primary/45 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between ml-0.5">
                  <label
                    className="text-[11px] font-semibold text-muted-foreground ml-0.5 block"
                    htmlFor="vault-password-input"
                  >
                    Senha mestra do cofre
                  </label>
                  <span className="text-[10px] text-muted-foreground/60 font-semibold">
                    Apenas para perfil de usuário (.aegisuser)
                  </span>
                </div>
                <input
                  id="vault-password-input"
                  type="password"
                  value={vaultPassword}
                  onChange={(e) => setVaultPassword(e.target.value)}
                  placeholder="Sua senha mestra atual do aplicativo"
                  className="w-full h-10 bg-background border border-border/60 rounded-lg px-3 text-xs focus:ring-1 focus:ring-primary/45 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Operações manuais */}
        <section className="space-y-5">
          {/* Backup do Sistema */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground px-1">
              Ações de sistema completo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportSystem}
                disabled={isExporting}
                className={cn(
                  "flex items-center justify-center p-4 bg-card/40 border border-border/60 rounded-xl gap-2 hover:bg-accent/40 transition-all text-xs font-semibold disabled:opacity-50",
                  isExporting && "animate-pulse",
                )}
              >
                <HardDriveUpload className="w-4 h-4 text-muted-foreground" />
                Exportar sistema
              </button>
              <button
                type="button"
                onClick={handleImportSystem}
                disabled={isImporting}
                className="flex items-center justify-center p-4 bg-card/40 border border-border/60 rounded-xl gap-2 hover:bg-accent/40 transition-all text-xs font-semibold disabled:opacity-50"
              >
                <HardDriveDownload className="w-4 h-4 text-muted-foreground" />
                Restaurar sistema
              </button>
            </div>
          </div>

          {/* Migração de Usuário */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground px-1">
              Ações de perfil de usuário
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportUser}
                disabled={isExportingUser}
                className="flex items-center justify-center p-4 bg-card/40 border border-border/60 rounded-xl gap-2 hover:bg-accent/40 transition-all text-xs font-semibold disabled:opacity-50 text-foreground"
              >
                <Download className="w-4 h-4 text-muted-foreground" />
                Exportar perfil
              </button>
              <button
                type="button"
                onClick={handleImportUser}
                disabled={isImportingUser}
                className="flex items-center justify-center p-4 bg-card/40 border border-border/60 rounded-xl gap-2 hover:bg-accent/40 transition-all text-xs font-semibold disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-muted-foreground" />
                Mesclar perfil
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Card de Backup Automático */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground px-1">
          Backup automático de progresso (JSON)
        </h3>
        <div className="p-5 bg-card/30 border border-border/60 rounded-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={cn("p-2 rounded-lg bg-accent/50", themeStyles.text)}
              >
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Agendamento periódico</p>
                <p className="text-xs text-muted-foreground">
                  Gera cópias periódicas locais contendo apenas progresso de uso
                  (sem senhas).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-semibold">
                {autoBackupEnabled ? "Ativado" : "Desativado"}
              </span>
              <button
                type="button"
                onClick={() => setAutoBackupEnabled((prev) => !prev)}
                className={cn(
                  "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  autoBackupEnabled ? themeStyles.solid : "bg-neutral-800",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out",
                    autoBackupEnabled ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>

          <div className="p-4 bg-accent/20 border border-dashed border-border/60 rounded-xl flex gap-3 items-start text-muted-foreground">
            <Unlock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">
                Informações de conformidade
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                Backups em formato JSON nunca contêm as senhas do seu cofre
                pessoal. Para exportar credenciais, utilize a opção "Exportar
                perfil" acima.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label
                htmlFor="backup-interval-select"
                className="text-[11px] font-semibold text-muted-foreground ml-0.5 block"
              >
                Intervalo de dias
              </label>
              <select
                id="backup-interval-select"
                value={backupInterval}
                onChange={(e) => setBackupInterval(Number(e.target.value))}
                disabled={!autoBackupEnabled}
                className={cn(
                  "w-full h-10 bg-background border border-border/60 rounded-lg px-3 text-xs focus:outline-none transition-all cursor-pointer font-medium disabled:opacity-50",
                )}
              >
                <option value="1">A cada 1 dia</option>
                <option value="3">A cada 3 dias</option>
                <option value="7">A cada 7 dias</option>
                <option value="15">A cada 15 dias</option>
                <option value="30">A cada 30 dias</option>
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="backup-path-input"
                className="text-[11px] font-semibold text-muted-foreground ml-0.5 block"
              >
                Diretório de destino
              </label>
              <div className="flex gap-2">
                <input
                  id="backup-path-input"
                  type="text"
                  readOnly
                  placeholder="Selecione a pasta de destino..."
                  value={backupPath}
                  disabled={!autoBackupEnabled}
                  className="flex-1 h-10 bg-background border border-border/60 rounded-lg px-3 text-xs outline-none truncate disabled:opacity-50 font-medium"
                />
                <button
                  type="button"
                  onClick={handleSelectBackupDirectory}
                  disabled={!autoBackupEnabled}
                  className="px-3 h-10 rounded-lg bg-accent hover:bg-accent/80 text-foreground font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  Selecionar pasta
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border/20">
            <div className="text-[10px] text-muted-foreground font-semibold">
              {lastBackupDate
                ? `Último backup realizado em: ${new Date(lastBackupDate).toLocaleString("pt-BR")}`
                : "Nenhum backup executado ainda"}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleImportRawJson}
                disabled={isImportingRawJson || isRunningManualBackup}
                className={cn(
                  "px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 text-foreground font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5",
                  isImportingRawJson && "animate-pulse",
                )}
              >
                {isImportingRawJson ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  <>
                    <FileJson className="w-3.5 h-3.5" />
                    Importar backup JSON
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRunManualBackup}
                disabled={
                  isRunningManualBackup || isImportingRawJson || !backupPath
                }
                className={cn(
                  "px-4 py-2 rounded-lg text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5",
                  themeStyles.solid,
                  themeStyles.solidHover,
                  isRunningManualBackup && "animate-pulse",
                )}
              >
                {isRunningManualBackup ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <HardDriveUpload className="w-3.5 h-3.5" />
                    Executar agora
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="p-4 bg-accent/20 border border-dashed border-border/60 rounded-xl flex gap-3 text-muted-foreground">
        <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed font-medium">
          <strong>Aviso:</strong> Guarde as senhas dos backups criptografados
          com segurança. Não é possível recuperar os dados sem elas.
        </p>
      </div>
    </div>
  );
}
