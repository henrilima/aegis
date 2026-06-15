"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { resolveColor } from "@/colors.config";
import { useAuth } from "@/context/AuthContext";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";
import type { SubjectGroup, SubjectMeta } from "@/components/modules/grades/types";

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
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  const [subjectMetas, setSubjectMetas] = useState<SubjectMeta[]>([]);
  const [groups, setGroups] = useState<SubjectGroup[]>([]);

  const theme = getColorTheme(getModuleColor("studies"));

  // Sincroniza com valor externo (ex: ao abrir modal de edição)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Carrega metadados de matérias e grupos para o autocompletar
  useEffect(() => {
    if (!uid) return;
    Promise.all([
      invoke<SubjectMeta[]>("subjects_list", { userId: uid }),
      invoke<SubjectGroup[]>("subject_groups_list", { userId: uid }),
    ])
      .then(([metas, grps]) => {
        setSubjectMetas(metas);
        setGroups(grps);
      })
      .catch(console.error);
  }, [uid]);

  // Mapeadores para cores e grupos
  const colorMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const meta of subjectMetas) {
      m[meta.name.toLowerCase()] = meta.color;
    }
    return m;
  }, [subjectMetas]);

  const groupMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const g of groups) {
      for (const s of g.subjects) {
        m[s.toLowerCase()] = g.name;
      }
    }
    return m;
  }, [groups]);

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
        <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-card border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 shadow-lg">
          <div className="p-1 flex flex-col gap-0.5 max-h-48 overflow-y-auto custom-scrollbar">
            {filtered.map((s) => {
              const cKey = colorMap[s.toLowerCase()] ?? "slate";
              const hex = resolveColor(cKey);
              const gName = groupMap[s.toLowerCase()];

              return (
                <button
                  key={s}
                  type="button"
                  onMouseDown={() => select(s)}
                  className="w-full text-left px-3 py-2 text-[11px] text-muted-foreground hover:bg-accent/50 hover:text-foreground rounded-lg transition-all cursor-pointer font-bold flex items-center gap-2"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="truncate">{s}</span>
                  {gName && (
                    <span className="text-[10px] text-neutral-600 font-normal ml-auto shrink-0 italic">
                      ({gName})
                    </span>
                  )}
                </button>
              );
            })}

            {/* Opção para criar nova matéria se não existir na lista */}
            {isNew && (
              <button
                type="button"
                onMouseDown={() => select(query.trim())}
                className={cn(
                  "w-full text-left px-3 py-2 text-[11px] font-bold rounded-lg transition-all border-t border-border/20 mt-1 cursor-pointer",
                  theme.text,
                  theme.bgHover
                )}
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
