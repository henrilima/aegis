import { DownloadCloud, Plus, ShieldCheck, UploadCloud } from "lucide-react";
import { ToolTip } from "@/components/ui/ToolTipHelper";
import { cn, getColorTheme } from "@/lib/utils";

interface HeaderProps {
  handleImport: () => void;
  handleExport: () => void;
  onAddNew: () => void;
  count?: number;
}

export function Header({
  handleImport,
  handleExport,
  onAddNew,
  count = 0,
}: HeaderProps) {
  const moduleColor = "amber";
  const m = getColorTheme(moduleColor);

  return (
    <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
      <div className="flex items-center gap-3">
        <div
          className={cn("p-2 rounded-xl border transition-all", m.bg, m.border)}
        >
          <ShieldCheck className={cn("w-6 h-6", m.text)} />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight text-foreground">
            Cofre de senhas
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            {count}{" "}
            {count === 1 ? "credencial protegida" : "credenciais protegidas"}{" "}
            localmente
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <ToolTip content="Importar Senhas (CSV)">
          <button
            type="button"
            onClick={handleImport}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent/50 transition-all cursor-pointer text-xs font-bold border border-border text-muted-foreground",
              `hover:${m.text}`,
            )}
          >
            <UploadCloud className="w-4 h-4" />
            Importar
          </button>
        </ToolTip>
        <ToolTip content="Exportar Senhas (CSV)">
          <button
            type="button"
            onClick={handleExport}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl bg-card hover:bg-accent/50 transition-all cursor-pointer text-xs font-bold border border-border text-muted-foreground",
              `hover:${m.text}`,
            )}
          >
            <DownloadCloud className="w-4 h-4" />
            Exportar
          </button>
        </ToolTip>

        <ToolTip content="Adicionar nova credencial ao cofre">
          <button
            type="button"
            onClick={onAddNew}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-black font-bold transition-all cursor-pointer active:scale-95",
              m.solid,
              m.solidHover,
            )}
          >
            <Plus className="w-4 h-4" /> Nova Senha
          </button>
        </ToolTip>
      </div>
    </div>
  );
}
