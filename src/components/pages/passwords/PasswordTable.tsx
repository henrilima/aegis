import { Copy, ExternalLink, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
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
  return (
    <Card className="flex-1 overflow-auto border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
      <CardContent className="p-0">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-neutral-800/90 backdrop-blur-md z-10">
            <tr>
              <th className="p-4 font-semibold text-neutral-300">Serviço</th>
              <th className="p-4 font-semibold text-neutral-300">Usuário</th>
              <th className="p-4 font-semibold text-neutral-300">Senha</th>
              <th className="p-4 font-semibold text-neutral-300">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {filteredPasswords.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-neutral-500">
                  Nenhuma credencial encontrada.
                </td>
              </tr>
            ) : (
              filteredPasswords.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-neutral-800/30 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-amber-50 group-hover:text-amber-500 transition-colors">
                        {String(p.name)}
                      </span>
                      <span className="text-xs text-neutral-500 truncate max-w-[200px]">
                        {p.url}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-300">{p.username}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-6 h-6 hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(p.username, "Usuário")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-4">
                    {decryptedId === p.id ? (
                      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <code className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded font-mono">
                          {decryptedData?.password}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 hover:text-amber-500"
                          onClick={() =>
                            decryptedData &&
                            copyToClipboard(decryptedData.password, "Senha")
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-neutral-600 font-mono ">
                        ••••••••
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleShowPassword(p.id)}
                        className={
                          decryptedId === p.id ? "text-amber-500" : "text-white"
                        }
                      >
                        {decryptedId === p.id ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      {p.url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-neutral-400"
                          onClick={() => {
                            const targetUrl = p.url.startsWith("http")
                              ? p.url
                              : `https://${p.url}`;
                            openExternal(targetUrl);
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditStart(p.id)}
                        className="text-neutral-400 hover:text-amber-500"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-900/50 hover:text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
