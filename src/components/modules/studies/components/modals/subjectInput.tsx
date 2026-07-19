"use client";

import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";
import { resolveColor } from "@/colors.config";
import type {
  SubjectGroup,
  SubjectMeta,
} from "@/components/modules/grades/types";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useAuth } from "@/context/AuthContext";

interface SubjectInputProps {
  value: string;
  onChange: (v: string) => void;
  existingSubjects: string[];
  inputClass: string;
}

/**
 * Campo de input inteligente com autocompletar para matérias existentes,
 * utilizando o SearchableSelect genérico.
 */
export function SubjectInput({
  value,
  onChange,
  existingSubjects,
  inputClass,
}: SubjectInputProps) {
  const { user } = useAuth();
  const uid = user ? String(user.id) : "";

  const [subjectMetas, setSubjectMetas] = useState<SubjectMeta[]>([]);
  const [groups, setGroups] = useState<SubjectGroup[]>([]);

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

  return (
    <SearchableSelect
      items={existingSubjects}
      value={value}
      onChange={(val) => onChange(typeof val === "string" ? val : String(val))}
      placeholder="Selecione a matéria..."
      searchPlaceholder="Buscar matéria..."
      emptyMessage="Nenhuma matéria correspondente"
      getItemKey={(s) => s}
      getItemLabel={(s) => s}
      moduleName="studies"
      mode="combobox"
      inputClass={inputClass}
      onCreateNew={(query) => onChange(query)}
      renderItem={(s) => {
        const cKey = colorMap[s.toLowerCase()] ?? "slate";
        const hex = resolveColor(cKey);
        const gName = groupMap[s.toLowerCase()];

        return (
          <div className="w-full flex items-center gap-2 font-bold py-1">
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
          </div>
        );
      }}
    />
  );
}
