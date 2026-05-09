"use client";

import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { DecryptedEntry, PasswordEntry } from "./types";

interface PasswordTableProps {
  filteredPasswords: PasswordEntry[];
  decryptedId: number | null;
  decryptedData: DecryptedEntry | null;
  handleShowPassword: (id: number) => void;
  handleEditStart: (id: number) => void;
  handleDelete: (id: number) => void;
  openExternal: (url: string) => void;
  copyToClipboard: (text: string, label: string) => void;
}

export function PasswordTable({
  filteredPasswords,
  decryptedId,
  decryptedData,
  handleShowPassword,
  handleEditStart,
  handleDelete,
  openExternal,
  copyToClipboard,
}: PasswordTableProps) {
  const color = getModuleColor("passwords");
  const theme = getColorTheme(color);

  return (
    <div className="flex-1 overflow-auto border border-border bg-background/20 rounded-xl backdrop-blur-sm">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-card z-10 border-b border-border">
          <tr>
            <th className="p-4 text-xs font-medium text-muted-foreground">
              Serviço
            </th>
            <th className="p-4 text-xs font-medium text-muted-foreground">
              Usuário
            </th>
            <th className="p-4 text-xs font-medium text-muted-foreground">
              Senha
            </th>
            <th className="p-4 text-xs font-medium text-muted-foreground text-right pr-6">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/50">
          {filteredPasswords.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-0">
                <EmptyState
                  icon={ShieldAlert}
                  title="Cofre vazio"
                  description="Nenhuma credencial foi encontrada. Adicione sua primeira senha para começar a proteger seus dados."
                  className="py-12"
                />
              </td>
            </tr>
          ) : (
            filteredPasswords.map((p) => (
              <tr
                key={p.id}
                className="hover:bg-card/40 transition-colors group"
              >
                <td className="p-4">
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-sm font-bold text-foreground transition-colors",
                        theme.textDarkHover.replace("hover:", "group-hover:"),
                      )}
                    >
                      {String(p.name)}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[180px] font-medium">
                      {p.url}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-medium">
                      {p.username}
                    </span>
                    <ToolTip content="Copiar usuário">
                      <button
                        type="button"
                        className={cn(
                          "p-1 rounded-md text-neutral-600 opacity-0 group-hover:opacity-100 transition-all cursor-pointer",
                          theme.text,
                          theme.bgHover,
                        )}
                        onClick={() => copyToClipboard(p.username, "Usuário")}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </ToolTip>
                  </div>
                </td>
                <td className="p-4">
                  {decryptedId === p.id ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <code
                        className={cn(
                          "px-2.5 py-1 rounded-lg font-mono text-sm border",
                          theme.bg,
                          theme.text,
                          theme.border,
                        )}
                      >
                        {decryptedData?.password}
                      </code>
                      <ToolTip content="Copiar senha">
                        <button
                          type="button"
                          className={cn(
                            "p-1.5 rounded-lg text-muted-foreground transition-all cursor-pointer",
                            theme.textDarkHover,
                            theme.bgHover,
                          )}
                          onClick={() =>
                            decryptedData &&
                            copyToClipboard(decryptedData.password, "Senha")
                          }
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </ToolTip>
                    </div>
                  ) : (
                    <div className="text-neutral-700 font-mono text-xs">
                      ••••••••
                    </div>
                  )}
                </td>
                <td className="p-4 text-right pr-4">
                  <div className="flex items-center justify-end gap-1">
                    <ToolTip
                      content={
                        decryptedId === p.id ? "Ocultar senha" : "Ver senha"
                      }
                    >
                      <button
                        type="button"
                        onClick={() => handleShowPassword(p.id)}
                        className={cn(
                          "p-2 rounded-xl transition-all cursor-pointer",
                          decryptedId === p.id
                            ? cn(theme.text, theme.bg, "border", theme.border)
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                        )}
                      >
                        {decryptedId === p.id ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </ToolTip>
                    {p.url && (
                      <ToolTip content="Abrir link">
                        <button
                          type="button"
                          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all cursor-pointer"
                          onClick={() => {
                            const targetUrl = p.url.startsWith("http")
                              ? p.url
                              : `https://${p.url}`;
                            openExternal(targetUrl);
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </ToolTip>
                    )}
                    <ToolTip content="Editar credencial">
                      <button
                        type="button"
                        onClick={() => handleEditStart(p.id)}
                        className={cn(
                          "p-2 rounded-xl text-muted-foreground transition-all cursor-pointer",
                          theme.textDarkHover,
                          theme.bgHover,
                        )}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </ToolTip>
                    <ToolTip content="Excluir credencial">
                      <button
                        type="button"
                        className="p-2 rounded-xl text-neutral-700 hover:text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </ToolTip>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
