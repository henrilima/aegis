"use client";

import {
  CheckCircle2,
  Edit3,
  FolderOpen,
  HelpCircle,
  X,
  Zap,
} from "lucide-react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface NotesInfoModalProps {
  show: boolean;
  onClose: () => void;
}

export function NotesInfoModal({ show, onClose }: NotesInfoModalProps) {
  useLockBodyScroll(show);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-background border border-border rounded-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-border/60 shrink-0 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <HelpCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-none">
                Bloco de Notas
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Guia para organização de ideias e anotações
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-5 h-4" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          {/* Organização e Pastas */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
              <FolderOpen className="w-5 h-5" />
              <h3 className="font-bold text-foreground">
                Estrutura de Arquivos
              </h3>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-xl p-4 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Mantenha suas notas organizadas em pastas. Você pode mover itens
                arrastando e soltando no gerenciador:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    label: "Pastas Ilimitadas",
                    desc: "Crie hierarquias personalizadas",
                  },
                  {
                    label: "Drag & Drop",
                    desc: "Mova notas e pastas livremente",
                  },
                  {
                    label: "Localização",
                    desc: "Veja o caminho real dos arquivos",
                  },
                  {
                    label: "Acesso Rápido",
                    desc: "Abra a pasta local no sistema",
                  },
                ].map((item) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-2 bg-black/20 p-2.5 rounded-lg border border-border/50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Edição e Markdown */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400">
              <Edit3 className="w-5 h-5" />
              <h3 className="font-bold text-foreground">
                Escrita e Formatação
              </h3>
            </div>
            <div className="bg-card/50 border border-border/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                As notas suportam Markdown, permitindo formatação rica de forma
                simples:
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs p-2 bg-black/20 rounded-lg border border-border/50">
                  <span className="text-muted-foreground">
                    Suporte a Markdown
                  </span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">
                    Títulos, listas e links
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs p-2 bg-black/20 rounded-lg border border-border/50">
                  <span className="text-muted-foreground">
                    Fixação de Notas
                  </span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold">
                    Até 3 notas fixas no topo
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Dica Pro */}
          <div className="bg-orange-600/10 border border-orange-600/20 rounded-xl p-4 flex gap-4">
            <div className="shrink-0 p-2 bg-orange-600/20 rounded-lg h-fit">
              <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-300">
                Poder da Pesquisa
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                Use a barra de pesquisa para filtrar instantaneamente notas em{" "}
                <span className="text-foreground font-medium">
                  qualquer pasta
                </span>
                . O Aegis busca no título e no conteúdo para você nunca perder
                uma ideia.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/60 bg-card/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            Entendido, mãos à obra!
          </button>
        </div>
      </div>
    </div>
  );
}
