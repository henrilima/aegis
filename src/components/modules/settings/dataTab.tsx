"use client";

import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Cpu, Database, HardDrive, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

import type { AppConfig } from "./useSettingsLogic";

export function DataTab() {
  const { themeStyles } = useTheme();
  const [customDataDir, setCustomDataDir] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);

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
      const selected = await open({
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

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header Padronizado */}
      <section className="flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10",
            themeStyles.text,
          )}
        >
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Gerenciamento de Dados
          </h2>
          <p className="text-xs text-muted-foreground">
            Configure o local físico de armazenamento do seu perfil e gerencie a
            integridade do banco de dados.
          </p>
        </div>
      </section>

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
