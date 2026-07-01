"use client";

import { invoke } from "@tauri-apps/api/core";
import { open as openDialog, save } from "@tauri-apps/plugin-dialog";
import {
  Activity,
  Book,
  BookOpen,
  Brain,
  Cpu,
  DownloadCloud,
  Film,
  HardDrive,
  Info,
  ListTodo,
  type LucideIcon,
  Moon,
  Trophy,
  UploadCloud,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { type ModuleId, useModules } from "@/context/ModuleContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

import type { AppConfig } from "./useSettingsLogic";

interface ModuleDataConfig {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  format: "CSV" | "JSON";
  importCmd?: string;
  exportCmd: string;
  importFileParam?: string;
  exportFileParam: string;
}

const MODULE_DATA_LIST: ModuleDataConfig[] = [
  {
    id: "tasks",
    label: "Tarefas",
    icon: ListTodo,
    format: "CSV",
    importCmd: "import_tasks_csv",
    exportCmd: "export_tasks_csv",
    importFileParam: "path",
    exportFileParam: "path",
  },
  {
    id: "studies",
    label: "Estudos",
    icon: BookOpen,
    format: "CSV",
    importCmd: "estudos_import_csv",
    exportCmd: "estudos_export_csv",
    importFileParam: "filePath",
    exportFileParam: "destPath",
  },
  {
    id: "sleep",
    label: "Sono",
    icon: Moon,
    format: "CSV",
    importCmd: "sono_import_csv",
    exportCmd: "sono_export_csv",
    importFileParam: "filePath",
    exportFileParam: "destPath",
  },
  {
    id: "reading",
    label: "Leitura",
    icon: Book,
    format: "JSON",
    importCmd: "reading_import_json",
    exportCmd: "reading_export_json",
    importFileParam: "filePath",
    exportFileParam: "destPath",
  },
  {
    id: "movies",
    label: "Filmes",
    icon: Film,
    format: "JSON",
    importCmd: "movies_import_json",
    exportCmd: "movies_export_json",
    importFileParam: "path",
    exportFileParam: "path",
  },
  {
    id: "habits",
    label: "Hábitos",
    icon: Activity,
    format: "CSV",
    importCmd: "habit_import_habits_csv",
    exportCmd: "habit_export_habits_csv",
    importFileParam: "path",
    exportFileParam: "path",
  },
  {
    id: "flashcards",
    label: "Flashcards",
    icon: Brain,
    format: "JSON",
    importCmd: "flashcards_import_json",
    exportCmd: "flashcards_export_json",
    importFileParam: "path",
    exportFileParam: "path",
  },
  {
    id: "dictionary",
    label: "Dicionário",
    icon: Book,
    format: "CSV",
    importCmd: "dictionary_import_csv",
    exportCmd: "dictionary_export_csv",
    importFileParam: "path",
    exportFileParam: "path",
  },
  {
    id: "achievements",
    label: "Trophy Hall (XP & Conquistas)",
    icon: Trophy,
    format: "CSV",
    exportCmd: "stats_export_xp_history_csv",
    exportFileParam: "path",
  },
];

export function DataTab() {
  const { themeStyles } = useTheme();
  const { user } = useAuth();
  const { isModuleEnabled } = useModules();
  const [customDataDir, setCustomDataDir] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);

  const uid = user ? String(user.id) : "";

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await invoke<AppConfig>("global_get_app_config");
        setCustomDataDir(config.customDataDir || "");
      } catch (e) {
        console.error("Erro ao obter config de diretório", e);
      }
    };
    fetchConfig();
  }, []);

  const handleChangeDataDirectory = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: "Selecione a pasta para os dados do Aegis",
      });
      if (selected) {
        const path = selected as string;
        toast.info(
          "Configurando diretório e migrando dados. O Aegis irá reiniciar...",
        );
        await invoke("global_set_custom_data_dir", { newPath: path });
      }
    } catch (e) {
      toast.error(
        `Erro ao alterar diretório: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const handleResetDataDirectory = async () => {
    try {
      toast.info("Restaurando local padrão. O Aegis irá reiniciar...");
      await invoke("global_set_custom_data_dir", { newPath: null });
    } catch (e) {
      toast.error(
        `Erro ao restaurar diretório padrão: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const handleOptimizeDatabase = async () => {
    try {
      setIsOptimizing(true);
      const res = await invoke<string>("global_apply_internal_command", {
        command: "db optimize",
        userId: uid,
      });
      toast.success(res || "Banco de dados otimizado com sucesso");
    } catch (e) {
      toast.error(
        `Falha na otimização: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExport = async (mod: ModuleDataConfig) => {
    if (!uid) {
      toast.error("Usuário não autenticado");
      return;
    }
    try {
      const filePath = await save({
        filters: [{ name: mod.format, extensions: [mod.format.toLowerCase()] }],
        defaultPath: `aegis_${mod.id}_backup.${mod.format.toLowerCase()}`,
      });

      if (!filePath) return;

      await invoke(mod.exportCmd, {
        userId: uid,
        [mod.exportFileParam]: filePath,
      });
      toast.success(`Exportação de ${mod.label} concluída!`);
    } catch (e) {
      toast.error(
        `Falha ao exportar: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const handleImport = async (mod: ModuleDataConfig) => {
    if (!uid) {
      toast.error("Usuário não autenticado");
      return;
    }
    if (!mod.importCmd || !mod.importFileParam) {
      toast.error("Este módulo não suporta importação direta");
      return;
    }
    try {
      const filePath = await openDialog({
        multiple: false,
        filters: [{ name: mod.format, extensions: [mod.format.toLowerCase()] }],
      });
      if (filePath && typeof filePath === "string") {
        const count = await invoke<number>(mod.importCmd, {
          userId: uid,
          [mod.importFileParam]: filePath,
        });
        toast.success(`${count} registros de ${mod.label} importados!`);
      }
    } catch (e) {
      toast.error(
        `Erro ao importar: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const enabledModules = MODULE_DATA_LIST.filter((mod) =>
    isModuleEnabled(mod.id),
  );

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Localização dos Dados */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground px-1">
          Localização dos dados do perfil
        </h3>
        <div className="p-5 bg-card/30 border border-border/60 rounded-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
            <div className="flex items-center gap-3">
              <div
                className={cn("p-2 rounded-lg bg-primary/10", themeStyles.text)}
              >
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Diretório de armazenamento local
                </p>
                <p className="text-xs text-muted-foreground">
                  Selecione uma pasta (ex: partição dual-boot ou pasta
                  sincronizada na nuvem) para compartilhar notas, hábitos e
                  tarefas.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="data-path-input"
              className="text-[11px] font-semibold text-muted-foreground ml-0.5 block"
            >
              Caminho do banco de dados e notas
            </label>
            <div className="flex gap-2">
              <input
                id="data-path-input"
                type="text"
                readOnly
                placeholder="Pasta padrão do Aegis (armazenamento local padrão)..."
                value={customDataDir}
                className="flex-1 h-10 bg-background border border-border/60 rounded-lg px-3 text-xs outline-none truncate font-medium text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleChangeDataDirectory}
                className="px-4 h-10 rounded-lg bg-accent hover:bg-accent/80 text-foreground font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
              >
                Alterar pasta
              </button>
              {customDataDir && (
                <button
                  type="button"
                  onClick={handleResetDataDirectory}
                  className="px-4 h-10 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  Restaurar padrão
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Exportação e Importação de Módulos */}
      {enabledModules.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground px-1">
            Exportação e importação por módulo
          </h3>
          <div className="p-5 bg-card/30 border border-border/60 rounded-xl space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Exporte e importe os dados específicos de seus módulos habilitados
              nos formatos CSV ou JSON.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enabledModules.map((mod) => (
                <div
                  key={mod.id}
                  className="flex items-center justify-between p-4 bg-background/50 border border-border/40 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg bg-muted",
                        themeStyles.text,
                      )}
                    >
                      <mod.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {mod.label}
                      </p>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        {mod.format}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {mod.importCmd && (
                      <button
                        type="button"
                        onClick={() => handleImport(mod)}
                        className="px-3 h-8 rounded-lg bg-accent hover:bg-accent/80 text-foreground font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <UploadCloud className="w-3 h-3" />
                        Importar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleExport(mod)}
                      className="px-3 h-8 rounded-lg bg-accent hover:bg-accent/80 text-foreground font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <DownloadCloud className="w-3 h-3" />
                      Exportar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Otimização de Banco de Dados */}
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground px-1">
          Manutenção do banco de dados
        </h3>
        <div className="p-5 bg-card/30 border border-border/60 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn("p-2 rounded-lg bg-primary/10", themeStyles.text)}
              >
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Otimização e compactação
                </p>
                <p className="text-xs text-muted-foreground">
                  Reorganiza o banco de dados desfragmentando tabelas e
                  reduzindo espaço em disco.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOptimizeDatabase}
              disabled={isOptimizing}
              className={cn(
                "px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 text-foreground font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5",
                isOptimizing && "animate-pulse",
              )}
            >
              {isOptimizing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                  Otimizando...
                </>
              ) : (
                "Otimizar agora"
              )}
            </button>
          </div>
        </div>
      </section>

      <div className="p-4 bg-violet-500/5 border border-dashed border-violet-500/10 rounded-xl flex gap-3">
        <Info className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
          O banco de dados de configurações locais (`config.db`) continuará fixo
          no seu sistema para manter zoom, layout e preferências do sistema
          atual, de forma que as preferências da tela não entrem em conflito.
        </p>
      </div>
    </div>
  );
}
