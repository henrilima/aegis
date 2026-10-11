"use client";

import { FileText, Layout, Lightbulb, Users, X } from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { cn, getColorTheme } from "@/lib/utils";
import { getModuleColor } from "@/modules.config";

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  title: string;
  content: string;
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: "blank",
    name: "Nota em Branco",
    description: "Inicie um documento totalmente limpo para suas ideias.",
    icon: FileText,
    title: "Nova Anotação",
    content: "",
  },
  {
    id: "meeting",
    name: "Ata de Reunião",
    description: "Estrutura para registrar participantes, pauta e decisões.",
    icon: Users,
    title: "Reunião: [Tema da Reunião]",
    content: `## Informações Gerais
- **Data**: ${new Date().toLocaleDateString("pt-BR")}
- **Participantes**: 

## Pauta Principal
- [ ] Tópico 1
- [ ] Tópico 2

## Discussões & Apontamentos
Escreva aqui os principais pontos discutidos durante a reunião...

## Ações & Próximos Passos
- [ ] **Ação 1** (Responsável: / Prazo: )
- [ ] **Ação 2** (Responsável: / Prazo: )`,
  },
  {
    id: "cornell",
    name: "Método Cornell",
    description: "Técnica de estudos com palavras-chave, anotações e síntese.",
    icon: Layout,
    title: "Estudo: [Nome da Matéria/Tópico]",
    content: `## Palavras-chave / Dúvidas
- Conceito 1
- Dúvida importante
- Termo chave

## Anotações Principais
Detalhe aqui os conceitos explicados durante a aula ou leitura...

---

## Resumo / Síntese
Escreva um resumo conciso de 2 a 3 frases sintetizando todo o aprendizado.`,
  },
  {
    id: "diary",
    name: "Diário Pessoal",
    description: "Reflexão sobre sentimentos, conquistas e gratidão do dia.",
    icon: Lightbulb,
    title: `Diário: ${new Date().toLocaleDateString("pt-BR")}`,
    content: `## Reflexão do Dia
Como foi o meu dia e como estou me sentindo...

## Maiores Conquistas de Hoje
- 

## Aprendizados & Insights
- 

## Gratidão
- 3 coisas pelas quais sou grato hoje:`,
  },
];

interface NoteTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: NoteTemplate) => void;
}

export function NoteTemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate,
}: NoteTemplateSelectorProps) {
  const theme = getColorTheme(getModuleColor("notes"));

  if (!isOpen) return null;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl border", theme.bg, theme.border)}>
            <Layout className={cn("w-5 h-5", theme.text)} />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Modelos de Anotações
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Escolha um modelo pronto para acelerar sua escrita
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {NOTE_TEMPLATES.map((tmpl) => {
          const IconComponent = tmpl.icon;
          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => {
                onSelectTemplate(tmpl);
                onClose();
              }}
              className="p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-muted/30 hover:border-amber-500/50 transition-all text-left flex flex-col gap-2 group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <IconComponent className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground group-hover:text-amber-500 transition-colors">
                  {tmpl.name}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tmpl.description}
              </p>
            </button>
          );
        })}
      </div>
    </ModalShell>
  );
}
