"use client";

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
  FileAudio,
  Music,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { stopNotificationSound } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export interface CustomMediaItem {
  id?: number;
  fileName: string;
  displayName: string;
  filePath: string;
  fileSize: number;
  isCustom: boolean;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

function formatTime(seconds: number): string {
  if (!seconds || Number.isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MediaTab() {
  const [mediaList, setMediaList] = useState<CustomMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  // Estados de reprodução do Player
  const [activeMedia, setActiveMedia] = useState<CustomMediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Estado para modal de edição de nome
  const [editingItem, setEditingItem] = useState<CustomMediaItem | null>(null);
  const [editName, setEditName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // Estado para exclusão
  const [deletingItem, setDeletingItem] = useState<CustomMediaItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      if (typeof window !== "undefined" && window.__TAURI_INTERNALS__) {
        const customItems = await invoke<CustomMediaItem[]>(
          "global_list_custom_media",
        );
        const defaultSounds = await invoke<string[]>(
          "global_list_notification_sounds",
        );

        const customFileNames = new Set(customItems.map((i) => i.fileName));
        const builtinItems: CustomMediaItem[] = defaultSounds
          .filter((name) => !customFileNames.has(name))
          .map((name) => ({
            fileName: name,
            displayName: name
              .replace(/\.[^/.]+$/, "")
              .replace(/^alarm_/, "Alarme "),
            filePath: `/sounds/${name}`,
            fileSize: 0,
            isCustom: false,
            createdAt: "",
          }));

        setMediaList([...customItems, ...builtinItems]);
      } else {
        setMediaList([
          {
            id: 1,
            fileName: "Plin.mp3",
            displayName: "Plin (Padrão)",
            filePath: "/sounds/Plin.mp3",
            fileSize: 120000,
            isCustom: false,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("[MediaTab] Erro ao carregar mídias:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Limpeza de áudio ao desmontar
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = (item: CustomMediaItem) => {
    stopNotificationSound();

    if (activeMedia?.fileName === item.fileName) {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (audioRef.current) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const src = item.isCustom
      ? convertFileSrc(item.filePath)
      : item.filePath.startsWith("/")
        ? item.filePath
        : `/sounds/${item.fileName}`;

    const audio = new Audio(src);
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;
    setActiveMedia(item);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.play().catch((err) => {
      console.error("[MediaTab] Erro ao reproduzir áudio:", err);
      setIsPlaying(false);
    });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 0.8;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const handleImport = async () => {
    if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) return;
    setIsImporting(true);

    try {
      const selected = await openDialog({
        multiple: false,
        filters: [
          {
            name: "Arquivos de Áudio",
            extensions: ["mp3", "wav", "ogg", "m4a", "flac", "aac"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        await invoke("global_import_custom_media", {
          sourcePath: selected,
          displayName: null,
        });
        await loadMedia();
      }
    } catch (err) {
      console.error("[MediaTab] Erro ao importar mídia:", err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleOpenRename = (item: CustomMediaItem) => {
    setEditingItem(item);
    setEditName(item.displayName);
  };

  const handleSaveRename = async () => {
    if (!editingItem || !editingItem.id) return;
    setIsRenaming(true);
    try {
      await invoke("global_rename_custom_media", {
        id: editingItem.id,
        newName: editName.trim(),
      });
      await loadMedia();
      setEditingItem(null);
    } catch (err) {
      console.error("[MediaTab] Erro ao renomear mídia:", err);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem || !deletingItem.id) return;
    setIsDeleting(true);
    try {
      if (activeMedia?.id === deletingItem.id && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setActiveMedia(null);
        setIsPlaying(false);
      }

      await invoke("global_delete_custom_media", { id: deletingItem.id });
      await loadMedia();
      setDeletingItem(null);
    } catch (err) {
      console.error("[MediaTab] Erro ao excluir mídia:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações da Seção */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-border/40">
        <h3 className="text-xs font-bold text-muted-foreground px-1">
          Sons e efeitos de áudio
        </h3>
        <Button
          onClick={handleImport}
          disabled={isImporting}
          className="rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-none"
        >
          <Plus className="w-4 h-4" />
          {isImporting ? "Importando..." : "Importar áudio"}
        </Button>
      </div>

      {/* Player de Preview Ativo Integrado */}
      {activeMedia && (
        <div className="bg-card border border-primary/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Music className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate">
                  {activeMedia.displayName}
                </h4>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {activeMedia.fileName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-bold text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-8 w-8 rounded-lg cursor-pointer"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Seeker de Progresso */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePlayPause(activeMedia)}
              className="h-9 w-9 rounded-xl border-border shrink-0 cursor-pointer shadow-none"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-primary" />
              ) : (
                <Play className="w-4 h-4 text-primary fill-primary ml-0.5" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      )}

      {/* Lista de Mídias */}
      {loading ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          Carregando mídias...
        </div>
      ) : mediaList.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-2xl space-y-2">
          <FileAudio className="w-8 h-8 text-muted-foreground/50 mx-auto" />
          <p className="text-xs font-bold text-foreground">
            Nenhum arquivo de mídia encontrado
          </p>
          <p className="text-[11px] text-muted-foreground">
            Clique em &quot;Importar áudio&quot; acima para adicionar seu
            primeiro som customizado.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {mediaList.map((item) => {
            const isThisPlaying =
              activeMedia?.fileName === item.fileName && isPlaying;
            return (
              <div
                key={item.id ? `custom-${item.id}` : `builtin-${item.fileName}`}
                className={cn(
                  "flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/60 transition-all hover:bg-card",
                  activeMedia?.fileName === item.fileName &&
                    "border-primary/50 bg-card",
                )}
              >
                {/* Nome e Ícone */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePlayPause(item)}
                    className={cn(
                      "h-9 w-9 rounded-xl border-border shrink-0 cursor-pointer shadow-none transition-colors",
                      isThisPlaying &&
                        "border-primary text-primary bg-primary/10",
                    )}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-4 h-4 text-primary" />
                    ) : (
                      <Play className="w-4 h-4 text-muted-foreground hover:text-foreground ml-0.5" />
                    )}
                  </Button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-foreground truncate">
                        {item.displayName}
                      </h4>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-bold border shrink-0",
                          item.isCustom
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-muted/40 text-muted-foreground border-border",
                        )}
                      >
                        {item.isCustom ? "Customizado" : "Nativo"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                      {item.fileName}{" "}
                      {item.fileSize > 0 && `• ${formatBytes(item.fileSize)}`}
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  {item.isCustom && (
                    <>
                      <ToolTip content="Editar nome">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenRename(item)}
                          className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </ToolTip>

                      <ToolTip content="Excluir mídia">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingItem(item)}
                          className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </ToolTip>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Editar Nome da Mídia */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent className="max-w-md bg-background border-border rounded-2xl shadow-none">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Renomear arquivo de mídia
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Defina o nome de exibição deste som nos seletores do Aegis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Nome de exibição
            </Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Ex: Alarme de manhã"
              className="bg-card border-border rounded-xl text-xs h-10 shadow-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setEditingItem(null)}
              className="rounded-xl text-xs cursor-pointer shadow-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveRename}
              disabled={isRenaming || !editName.trim()}
              className="rounded-xl text-xs font-bold cursor-pointer shadow-none"
            >
              {isRenaming ? "Salvando..." : "Salvar nome"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <Dialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
      >
        <DialogContent className="max-w-md bg-background border-border rounded-2xl shadow-none">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-rose-500 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Excluir arquivo de mídia
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Tem certeza que deseja apagar a mídia &quot;
              {deletingItem?.displayName}&quot;? Esta ação removerá o arquivo
              local do sistema.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingItem(null)}
              className="rounded-xl text-xs cursor-pointer shadow-none"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl text-xs font-bold cursor-pointer shadow-none bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? "Excluindo..." : "Excluir mídia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
