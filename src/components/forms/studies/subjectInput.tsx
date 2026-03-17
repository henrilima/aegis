"use client";

import { useEffect, useRef, useState } from "react";

interface SubjectInputProps {
  value: string;
  onChange: (v: string) => void;
  existingSubjects: string[];
  inputClass: string;
}

/**
 * Campo de input inteligente com autocompletar para matérias existentes
 */
export function SubjectInput({
  value,
  onChange,
  existingSubjects,
  inputClass,
}: SubjectInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Sincroniza com valor externo (ex: ao abrir modal de edição)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Gerenciamento de foco do dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = existingSubjects
    .filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  const isNew =
    query.trim() !== "" &&
    !existingSubjects.some((s) => s.toLowerCase() === query.toLowerCase());

  function select(s: string) {
    setQuery(s);
    onChange(s);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <input
        id="sf-subject"
        className={inputClass}
        placeholder="Ex: Direito Administrativo, Matemática..."
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        required
      />

      {/* Dropdown de sugestões */}
      {open && (filtered.length > 0 || isNew) && (
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-1 flex flex-col gap-0.5 max-h-48 overflow-y-auto custom-scrollbar">
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => select(s)}
                className="w-full text-left px-3 py-2 text-[11px] text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-lg transition-all cursor-pointer font-bold"
              >
                {s}
              </button>
            ))}

            {/* Opção para criar nova matéria se não existir na lista */}
            {isNew && (
              <button
                type="button"
                onMouseDown={() => select(query.trim())}
                className="w-full text-left px-3 py-2 text-[11px] text-violet-400 font-bold hover:bg-violet-500/10 rounded-lg transition-all border-t border-neutral-800/20 mt-1 cursor-pointer"
              >
                + Criar "{query.trim()}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
