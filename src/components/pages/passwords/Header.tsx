import { Download, Plus, ShieldCheck, Upload } from "lucide-react";

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
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 pb-2">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <ShieldCheck className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight text-neutral-100">
            Cofre de senhas
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            {count}{" "}
            {count === 1 ? "credencial protegida" : "credenciais protegidas"}{" "}
            localmente
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleImport}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 border border-neutral-800 transition-all cursor-pointer text-xs font-bold h-auto"
        >
          <Download className="w-4 h-4" />
          Importar
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-amber-400 border border-neutral-800 transition-all cursor-pointer text-xs font-bold h-auto"
        >
          <Upload className="w-4 h-4" />
          Exportar
        </button>

        <button
          type="button"
          onClick={onAddNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors cursor-pointer shadow-lg shadow-amber-900/10"
        >
          <Plus className="w-4 h-4" /> Nova Senha
        </button>
      </div>
    </div>
  );
}
