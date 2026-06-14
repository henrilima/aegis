"use client";

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Image, Layout, Palette, RefreshCw, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ThemeColorKey } from "@/colors.config";
import { ColorPicker } from "@/components/global/ColorPicker";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { CHROMATIC_THEMES } from "@/themes.config";

export function ThemesTab() {
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    themeStyles,
    appMode,
    setAppMode,
  } = useTheme();

  const [hasCustomIcon, setHasCustomIcon] = useState(false);
  const [customIconUrl, setCustomIconUrl] = useState<string | null>(null);
  const [isUpdatingIcon, setIsUpdatingIcon] = useState(false);

  const isWindows =
    typeof window !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("win");

  // Verifica se o ícone personalizado já existe na inicialização
  const checkIconStatus = useCallback(async () => {
    try {
      const active = await invoke<boolean>("global_has_custom_icon");
      setHasCustomIcon(active);
      if (active) {
        const path = await invoke<string | null>("global_get_custom_icon_path");
        if (path) {
          setCustomIconUrl(`${convertFileSrc(path)}?t=${Date.now()}`);
        } else {
          setCustomIconUrl(null);
        }
      } else {
        setCustomIconUrl(null);
      }
    } catch (err) {
      console.error("Erro ao verificar status do ícone:", err);
    }
  }, []);

  useEffect(() => {
    checkIconStatus();
  }, [checkIconStatus]);

  // Abre caixa de diálogo para upload de arquivo PNG
  const handleUploadIcon = async () => {
    try {
      const path = await openDialog({
        multiple: false,
        filters: [
          { name: "Imagens do Ícone", extensions: ["png", "jpeg", "jpg"] },
        ],
      });
      if (!path || typeof path !== "string") return;

      setIsUpdatingIcon(true);
      await invoke("global_set_custom_icon", { sourcePath: path });
      // Atualiza o atalho da Área de Trabalho com o .ico gerado (será atualizado no reboot)
      await invoke("global_update_shortcut_icon");
      await checkIconStatus();
    } catch (err) {
      console.error("Erro ao definir ícone personalizado:", err);
    } finally {
      setIsUpdatingIcon(false);
    }
  };

  // Restaura o ícone padrão do Tauri
  const handleResetIcon = async () => {
    try {
      setIsUpdatingIcon(true);
      await invoke("global_set_custom_icon", { sourcePath: null });
      // Remove a referência ao .ico customizado do atalho (volta ao exe padrão)
      await invoke("global_update_shortcut_icon");
      await checkIconStatus();
    } catch (err) {
      console.error("Erro ao restaurar ícone padrão:", err);
    } finally {
      setIsUpdatingIcon(false);
    }
  };

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500">
      {/* Cabeçalho Principal */}
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
            themeStyles.bg,
          )}
        >
          <Palette className={cn("w-7 h-7", themeStyles.text)} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Aparência</h2>
          <p className="text-sm text-muted-foreground">
            Escolha e personalize o estilo base do seu sistema.
          </p>
        </div>
      </div>

      {/* Seção de Temas */}
      <section className="space-y-5">
        <div className="flex flex-col">
          <h3 className="text-lg font-black text-foreground">Tema Base</h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Selecione a paleta estrutural de cores do sistema e personalize a
            cor de destaque se compatível.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHROMATIC_THEMES.map((themeOption) => {
            const isSelected = theme === themeOption.id;
            const supportsAccent = ["default", "midnight", "light"].includes(
              themeOption.id,
            );

            return (
              // biome-ignore lint/a11y/useSemanticElements: Div with role="button" is required here to avoid nesting interactive elements (ColorPicker buttons) inside a native button element.
              <div
                key={themeOption.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!isSelected) {
                    setTheme(themeOption.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (!isSelected) {
                      e.preventDefault();
                      setTheme(themeOption.id);
                    }
                  }
                }}
                className={cn(
                  "p-5 rounded-3xl border transition-all text-left flex flex-col gap-4 group cursor-pointer relative overflow-hidden",
                  isSelected
                    ? `${themeStyles.bg} ${themeStyles.border.replace("20", "50")} border-2`
                    : "bg-card border-border hover:border-border/80 hover:bg-accent/30",
                )}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl shrink-0 border-2 border-border/50"
                    style={{ backgroundColor: themeOption.previewColor }}
                  />
                  {isSelected && (
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        themeStyles.solid,
                      )}
                    />
                  )}
                </div>

                <div className="flex-1">
                  <span
                    className={cn(
                      "text-base font-black",
                      isSelected ? themeStyles.text : "text-foreground",
                    )}
                  >
                    {themeOption.label}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
                    {themeOption.description}
                  </p>
                </div>

                {/* Seletor de Cor de Destaque Embutido (Apenas se selecionado e compatível) */}
                {isSelected && supportsAccent && (
                  <div className="mt-1 pt-4 border-t border-border/20 space-y-2.5 animate-in slide-in-from-top-2 duration-300 w-full">
                    <div className="text-[10px] font-bold text-muted-foreground">
                      COR DE DESTAQUE
                    </div>
                    <ColorPicker
                      value={accentColor}
                      onChange={(c) =>
                        setAccentColor((c || "blue") as ThemeColorKey)
                      }
                      placeholder="Padrão"
                      defaultColor="blue"
                      className="w-full justify-start"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Seção de Estilo do Aplicativo */}
      <section className="space-y-5 pt-10 border-t border-border/20">
        <div className="flex flex-col">
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Layout className="w-5 h-5 shrink-0" /> Estilo do aplicativo
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Escolha como o sistema é estruturado e navegue de forma mais limpa e
            focada.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: "default",
              label: "Modo padrão",
              description:
                "Layout tradicional com a barra lateral de navegação contínua disponível a qualquer momento.",
            },
            {
              id: "no_sidebar",
              label: "Focado (sem barra lateral)",
              description:
                "A barra lateral de navegação é desativada completamente. Configurações e utilitários são movidos para o cabeçalho.",
            },
            {
              id: "portal",
              label: "Portal de módulos",
              description:
                "Barra lateral também é desativada. O painel principal exibe atalhos interativos em grade no lugar dos widgets dinâmicos. Onde antes haviam widgets, agora existem atalhos.",
            },
          ].map((modeOption) => {
            const isSelected = appMode === modeOption.id;

            return (
              // biome-ignore lint/a11y/useSemanticElements: Div with role="button" is required here to maintain consistent layout with elements above without nested button complications.
              <div
                key={modeOption.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  setAppMode(
                    modeOption.id as "default" | "no_sidebar" | "portal",
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setAppMode(
                      modeOption.id as "default" | "no_sidebar" | "portal",
                    );
                  }
                }}
                className={cn(
                  "p-5 rounded-3xl border transition-all text-left flex flex-col gap-3 group cursor-pointer relative overflow-hidden min-h-[130px]",
                  isSelected
                    ? `${themeStyles.bg} ${themeStyles.border.replace("20", "50")} border-2`
                    : "bg-card border-border hover:border-border/80 hover:bg-accent/30",
                )}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={cn(
                      "text-base font-black",
                      isSelected ? themeStyles.text : "text-foreground",
                    )}
                  >
                    {modeOption.label}
                  </span>
                  {isSelected && (
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full shrink-0",
                        themeStyles.solid,
                      )}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-medium">
                  {modeOption.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Seção de Ícone do Aplicativo */}
      <section className="space-y-5 pt-10 border-t border-border/20">
        <div className="flex flex-col">
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Image className="w-5 h-5 shrink-0" /> Ícone do aplicativo
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {isWindows
              ? "Personalize a aparência do Aegis alterando o ícone exibido na barra de tarefas e janela do sistema. O atalho da Área de Trabalho também é atualizado — a mudança fica visível ao reiniciar o computador."
              : "A alteração do ícone do aplicativo é suportada apenas no sistema operacional Windows."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="p-6 rounded-3xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all">
            <div className="flex items-center gap-4 text-left">
              <div
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border border-border/30 shrink-0 overflow-hidden bg-background",
                )}
              >
                {customIconUrl ? (
                  <img
                    src={customIconUrl}
                    className="w-10 h-10 object-contain"
                    alt="Ícone Atual"
                  />
                ) : (
                  <div
                    className={cn(
                      "w-full h-full flex items-center justify-center",
                      themeStyles.bg,
                    )}
                  >
                    <Image className={cn("w-6 h-6", themeStyles.text)} />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-foreground">
                  {!isWindows
                    ? "Recurso indisponível"
                    : hasCustomIcon
                      ? "Ícone personalizado ativo"
                      : "Ícone padrão do sistema"}
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal font-medium">
                  {!isWindows
                    ? "A alteração de ícone de atalho e janela não é compatível com Linux/macOS."
                    : hasCustomIcon
                      ? "Você está utilizando uma imagem PNG personalizada como ícone."
                      : "Selecione uma imagem PNG para substituir o ícone padrão do aplicativo."}
                </p>
              </div>
            </div>

            {isWindows && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleUploadIcon}
                  disabled={isUpdatingIcon}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer",
                    themeStyles.solid,
                    themeStyles.solidHover,
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload de ícone
                </button>

                {hasCustomIcon && (
                  <button
                    type="button"
                    onClick={handleResetIcon}
                    disabled={isUpdatingIcon}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground border border-border bg-card/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Restaurar padrão
                  </button>
                )}
              </div>
            )}
          </div>

          {hasCustomIcon && isWindows && (
            <p className="text-[11px] text-amber-500 font-medium px-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
              ⚠️ Importante: O atalho na área de trabalho e a barra de tarefas do
              Windows serão atualizados apenas após reiniciar o computador.
            </p>
          )}
        </div>
      </section>

      {/* Banner Informativo sobre Personalização do Cabeçalho e Relógio */}
      <div className="p-6 rounded-3xl border border-dashed border-border bg-accent/25 text-left flex flex-col gap-2">
        <span className={cn("text-sm font-black", themeStyles.text)}>
          Buscando a personalização do cabeçalho e relógio?
        </span>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
          Essas opções foram movidas diretamente para a Dashboard para maior
          conveniência. Para configurá-las, volte ao painel principal
          (Dashboard) e clique no botão <strong>Personalizar</strong>.
        </p>
      </div>
    </div>
  );
}
