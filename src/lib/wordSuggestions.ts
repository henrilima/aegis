/**
 * wordSuggestions.ts
 *
 * Sistema ultra-leve de autocompletação de palavras (Ghost Text / Inline Completion)
 * para campos de texto no Aegis.
 *
 * Combina termos reais dos módulos do usuário (Anotações, Tarefas, etc.) com
 * um vocabulário leve em português, operando 100% em memória para resposta instantânea (<0.05ms).
 *
 * Também inclui um sistema de expansão de atalhos (snippets) que substituem
 * termos especiais como $data, $hora, etc. por valores dinâmicos.
 */

import { invoke } from "@tauri-apps/api/core";

// Chave para persistir a preferência no localStorage
export const AUTOCOMPLETE_STORAGE_KEY = "aegis_word_autocomplete_enabled";
// Chave para palavras personalizadas do usuário
export const CUSTOM_WORDS_KEY = "aegis_custom_vocabulary";
// Chave para atalhos de texto personalizados
export const SNIPPETS_KEY = "aegis_text_snippets";

// Conjunto em memória para palavras aprendidas do ecossistema do usuário
const userVocabulary = new Set<string>();

// Dicionário essencial de palavras frequentes em português (~1.500 termos comuns)
const BASE_PTBR_WORDS: string[] = [
  "abaixo",
  "aberto",
  "abril",
  "abrir",
  "absoluto",
  "academia",
  "acesso",
  "achar",
  "acima",
  "acompanhar",
  "acontecer",
  "acordo",
  "acreditar",
  "acumular",
  "adiante",
  "administrar",
  "agenda",
  "agosto",
  "agora",
  "agradecer",
  "ajuda",
  "ajudar",
  "alcançar",
  "alerta",
  "algo",
  "algum",
  "alguma",
  "alinhamento",
  "almoço",
  "alongamento",
  "alterar",
  "altura",
  "amanhã",
  "ambiente",
  "amigo",
  "amizade",
  "amor",
  "análise",
  "analisar",
  "andar",
  "anotação",
  "anotar",
  "aniversário",
  "anual",
  "apenas",
  "aplicativo",
  "aplicar",
  "apoio",
  "aprender",
  "aprendizado",
  "apresentação",
  "aproveitar",
  "arquivo",
  "área",
  "argumento",
  "arte",
  "artigo",
  "aspecto",
  "assunto",
  "atender",
  "atenção",
  "atividade",
  "ativo",
  "atual",
  "atualizar",
  "aulas",
  "aumento",
  "autor",
  "avançar",
  "avançado",
  "avaliação",
  "banco",
  "base",
  "básico",
  "bastante",
  "bateria",
  "beleza",
  "benefício",
  "biblioteca",
  "bloco",
  "boas",
  "boleto",
  "bom",
  "breve",
  "busca",
  "buscar",
  "cabeça",
  "cada",
  "café",
  "caixa",
  "cálculo",
  "calendário",
  "caminho",
  "campanha",
  "campo",
  "canal",
  "capacidade",
  "capital",
  "capítulo",
  "caráter",
  "card",
  "carga",
  "carreira",
  "carta",
  "cartão",
  "casa",
  "caso",
  "categoria",
  "causa",
  "cenário",
  "central",
  "centro",
  "certo",
  "certeza",
  "chamada",
  "chamar",
  "chance",
  "chave",
  "checar",
  "chegar",
  "ciclo",
  "ciência",
  "cidade",
  "cinema",
  "clareza",
  "claro",
  "classe",
  "cliente",
  "cobertura",
  "código",
  "coisa",
  "colega",
  "coleta",
  "colocar",
  "coluna",
  "comando",
  "combinação",
  "começar",
  "começo",
  "comentário",
  "comércio",
  "como",
  "companhia",
  "comparar",
  "completo",
  "completar",
  "complexo",
  "componente",
  "comportamento",
  "compra",
  "comprar",
  "compromisso",
  "computador",
  "comum",
  "comunicação",
  "comunidade",
  "conceito",
  "conclusão",
  "concluir",
  "concurso",
  "condição",
  "conectar",
  "conexão",
  "conferir",
  "confiança",
  "configuração",
  "configurar",
  "confirmar",
  "conflito",
  "conhecer",
  "conhecimento",
  "conjunto",
  "conquista",
  "conseguir",
  "conselho",
  "considerar",
  "constância",
  "construir",
  "consulta",
  "consultar",
  "consumo",
  "conta",
  "contato",
  "conteúdo",
  "contexto",
  "continuar",
  "contínuo",
  "contrato",
  "controle",
  "controlar",
  "conversa",
  "conversar",
  "convite",
  "copiar",
  "corpo",
  "correto",
  "correção",
  "corrente",
  "corrida",
  "costume",
  "criação",
  "criar",
  "criativo",
  "critério",
  "cronograma",
  "cuidado",
  "cuidadoso",
  "cultura",
  "cumprir",
  "curso",
  "custo",
  "dados",
  "data",
  "debaixo",
  "decisão",
  "decidir",
  "declaração",
  "decorrer",
  "dedicar",
  "definição",
  "definir",
  "deixar",
  "delegação",
  "demanda",
  "demais",
  "demonstrar",
  "departamento",
  "depender",
  "depois",
  "depósito",
  "descanso",
  "descrever",
  "descrição",
  "descoberta",
  "descobrir",
  "desconto",
  "desde",
  "desejo",
  "desempenho",
  "desenho",
  "desenvolver",
  "desenvolvimento",
  "desafio",
  "despesa",
  "destaque",
  "destinar",
  "destino",
  "detalhe",
  "determinar",
  "dever",
  "devolução",
  "dezembro",
  "dia",
  "diálogo",
  "diário",
  "dieta",
  "diferença",
  "diferente",
  "difícil",
  "dificuldade",
  "digital",
  "dimensão",
  "dinâmica",
  "dinheiro",
  "direito",
  "direção",
  "direto",
  "diretoria",
  "disciplina",
  "discussão",
  "discutir",
  "disponível",
  "distância",
  "distribuição",
  "diverso",
  "dívida",
  "divisão",
  "documento",
  "domingo",
  "domínio",
  "dúvida",
  "durante",
  "duração",
  "economia",
  "edição",
  "editar",
  "editor",
  "educação",
  "efeito",
  "eficaz",
  "eficiência",
  "elaborar",
  "elemento",
  "elevação",
  "email",
  "emergência",
  "emissão",
  "emoção",
  "empresa",
  "encontro",
  "energia",
  "enfrentar",
  "engenharia",
  "enorme",
  "ensino",
  "entender",
  "entendimento",
  "então",
  "entrada",
  "entrar",
  "entrega",
  "entregar",
  "entrevista",
  "envio",
  "enviar",
  "episódio",
  "equilíbrio",
  "equipe",
  "equivalente",
  "erro",
  "escala",
  "escolha",
  "escolher",
  "escopo",
  "escrever",
  "escrita",
  "escritório",
  "esforço",
  "espaço",
  "especial",
  "específico",
  "espera",
  "esperar",
  "esporte",
  "esquema",
  "estabilidade",
  "estabelecer",
  "estação",
  "estado",
  "estatística",
  "estratégia",
  "estrutura",
  "estudo",
  "estudar",
  "etapa",
  "evento",
  "evolução",
  "exame",
  "exemplo",
  "execução",
  "executar",
  "exercício",
  "exibição",
  "exigência",
  "existir",
  "expectativa",
  "experiência",
  "explicação",
  "explicar",
  "exposição",
  "expressão",
  "extensão",
  "extra",
  "fácil",
  "facilidade",
  "fato",
  "fator",
  "fazer",
  "fechado",
  "fechar",
  "fevereiro",
  "fidelidade",
  "figura",
  "filme",
  "fim",
  "final",
  "finalizar",
  "finanças",
  "financeiro",
  "físico",
  "fixo",
  "fluxo",
  "foco",
  "folha",
  "fonte",
  "força",
  "forma",
  "formação",
  "formato",
  "fórmula",
  "fornecer",
  "fórum",
  "foto",
  "fração",
  "frase",
  "frequência",
  "frente",
  "fronteira",
  "função",
  "funcionamento",
  "funcionar",
  "fundamental",
  "futuro",
  "ganho",
  "garantia",
  "garantir",
  "gasto",
  "geração",
  "geral",
  "gerar",
  "gerenciamento",
  "gestão",
  "global",
  "governo",
  "gráfico",
  "grande",
  "gratidão",
  "grau",
  "grupo",
  "guia",
  "habilidade",
  "hábito",
  "história",
  "histórico",
  "hoje",
  "homem",
  "hora",
  "horário",
  "horizonte",
  "hospital",
  "humor",
  "ideia",
  "identificação",
  "identificar",
  "idioma",
  "igual",
  "ilustração",
  "imagem",
  "impacto",
  "implantação",
  "implementar",
  "importância",
  "importante",
  "imposto",
  "impressão",
  "imprevisto",
  "inclusão",
  "incluir",
  "indicação",
  "indicar",
  "índice",
  "indivíduo",
  "informação",
  "informar",
  "inglês",
  "início",
  "iniciar",
  "inicial",
  "iniciativa",
  "inovação",
  "inserir",
  "insight",
  "inspeção",
  "instalação",
  "instrução",
  "instrumento",
  "integração",
  "integrar",
  "inteligência",
  "intenção",
  "interesse",
  "interface",
  "intermediário",
  "internet",
  "intervalo",
  "intervenção",
  "investimento",
  "investir",
  "janeiro",
  "janela",
  "jogo",
  "jornada",
  "jovem",
  "julho",
  "junho",
  "junto",
  "juros",
  "justiça",
  "lançamento",
  "lançar",
  "largura",
  "laudo",
  "leitura",
  "lembrete",
  "lembrar",
  "ler",
  "levantamento",
  "liberdade",
  "liberação",
  "liberar",
  "licença",
  "líder",
  "liderança",
  "limite",
  "linha",
  "link",
  "lista",
  "listar",
  "literatura",
  "livre",
  "livro",
  "local",
  "localização",
  "lógica",
  "longo",
  "lote",
  "lucro",
  "lugar",
  "maio",
  "maior",
  "maioria",
  "mais",
  "maneira",
  "manhã",
  "manual",
  "manutenção",
  "mapa",
  "marca",
  "marcar",
  "março",
  "margem",
  "matemática",
  "matéria",
  "material",
  "máximo",
  "medida",
  "médio",
  "meditação",
  "melhor",
  "melhoria",
  "memória",
  "mensagem",
  "menos",
  "mental",
  "mercado",
  "mês",
  "meta",
  "método",
  "metodologia",
  "métrica",
  "meio",
  "membro",
  "micro",
  "mínimo",
  "minuto",
  "missão",
  "modelo",
  "modificação",
  "módulo",
  "momento",
  "monitoramento",
  "monitorar",
  "montagem",
  "motivação",
  "motivo",
  "movimento",
  "mudança",
  "mudar",
  "muito",
  "multimídia",
  "mundo",
  "nacional",
  "natureza",
  "necessidade",
  "necessário",
  "negócio",
  "nível",
  "nome",
  "normal",
  "norma",
  "nota",
  "notícia",
  "notificação",
  "noturno",
  "novembro",
  "novo",
  "número",
  "nunca",
  "nuvem",
  "objetivo",
  "objeto",
  "obra",
  "obrigação",
  "obrigado",
  "observação",
  "observar",
  "obtenção",
  "obter",
  "ocasião",
  "ocorrer",
  "outubro",
  "ocupação",
  "oficial",
  "oferecer",
  "oferta",
  "olhar",
  "online",
  "opção",
  "operação",
  "operador",
  "oportunidade",
  "oposição",
  "orçamento",
  "ordem",
  "organização",
  "organizar",
  "orientação",
  "origem",
  "otimização",
  "otimizar",
  "outro",
  "outra",
  "ouvir",
  "pacote",
  "padrão",
  "página",
  "pagamento",
  "pagar",
  "painel",
  "palavra",
  "papel",
  "parâmetro",
  "parceria",
  "parcela",
  "parte",
  "participação",
  "participar",
  "partir",
  "passado",
  "passagem",
  "passar",
  "passo",
  "pausa",
  "pedido",
  "pedir",
  "pendência",
  "pendente",
  "pensamento",
  "pensar",
  "pequeno",
  "percentual",
  "percepção",
  "perda",
  "perfil",
  "período",
  "permissão",
  "permitir",
  "personalização",
  "personalizar",
  "pesquisa",
  "pesquisar",
  "pessoa",
  "pessoal",
  "plano",
  "planejamento",
  "planejar",
  "plataforma",
  "ponto",
  "pontuação",
  "população",
  "porquê",
  "portal",
  "porte",
  "posição",
  "possibilidade",
  "possível",
  "postura",
  "potencial",
  "pouco",
  "prática",
  "praticar",
  "prático",
  "prazo",
  "preço",
  "precisão",
  "preciso",
  "preferência",
  "preparação",
  "preparar",
  "presença",
  "pressão",
  "previsão",
  "primeiro",
  "principal",
  "princípio",
  "prioridade",
  "priorizar",
  "privacidade",
  "privado",
  "problema",
  "procedimento",
  "processo",
  "processamento",
  "produção",
  "produtividade",
  "produto",
  "professor",
  "profissional",
  "programa",
  "programação",
  "progresso",
  "projeto",
  "promoção",
  "pronto",
  "proposta",
  "propósito",
  "proteção",
  "prova",
  "próximo",
  "publicação",
  "público",
  "quadro",
  "qualidade",
  "qualquer",
  "quando",
  "quantidade",
  "quanto",
  "quarta",
  "quase",
  "questão",
  "quinta",
  "ranqueamento",
  "rápido",
  "razão",
  "reação",
  "real",
  "realidade",
  "realização",
  "realizar",
  "recebimento",
  "receita",
  "recente",
  "recheio",
  "reclamar",
  "recolher",
  "recomendação",
  "recomendar",
  "recompensa",
  "reconhecimento",
  "recurso",
  "redação",
  "rede",
  "redução",
  "reduzir",
  "referência",
  "reflexão",
  "registro",
  "registrar",
  "regra",
  "regular",
  "relacionamento",
  "relatório",
  "relevante",
  "relógio",
  "rendimento",
  "reparação",
  "repetição",
  "repetir",
  "repouso",
  "requisito",
  "reserva",
  "resolução",
  "resolver",
  "respeito",
  "resposta",
  "responsabilidade",
  "resultado",
  "resumo",
  "resumir",
  "retorno",
  "reunião",
  "revisão",
  "revisar",
  "revista",
  "risco",
  "rotina",
  "sábado",
  "saída",
  "sair",
  "saldo",
  "saúde",
  "salvar",
  "satisfação",
  "seção",
  "secretaria",
  "século",
  "segunda",
  "segundo",
  "segurança",
  "seguro",
  "seleção",
  "selecionar",
  "semana",
  "semestre",
  "sempre",
  "senhor",
  "sensação",
  "sentido",
  "sentimento",
  "separação",
  "sequência",
  "série",
  "serviço",
  "servidor",
  "sessão",
  "setembro",
  "setor",
  "significado",
  "silêncio",
  "simples",
  "sinal",
  "sincronização",
  "sincronizar",
  "síntese",
  "sistema",
  "situação",
  "sobre",
  "social",
  "software",
  "solicitação",
  "solução",
  "solucionar",
  "soma",
  "sonho",
  "sono",
  "sorte",
  "status",
  "subir",
  "sucesso",
  "sugestão",
  "sugerir",
  "suporte",
  "tabela",
  "tag",
  "tamanho",
  "também",
  "tarefa",
  "taxa",
  "teatro",
  "técnica",
  "técnico",
  "tecnologia",
  "tela",
  "tema",
  "tempo",
  "tendência",
  "tentativa",
  "teoria",
  "terceiro",
  "termo",
  "teste",
  "testar",
  "texto",
  "tipo",
  "título",
  "total",
  "trabalho",
  "trabalhar",
  "tradução",
  "tráfego",
  "treinamento",
  "treino",
  "triagem",
  "trilha",
  "troca",
  "último",
  "unidade",
  "único",
  "urgência",
  "urgente",
  "usuário",
  "utilidade",
  "utilizar",
  "vaga",
  "validade",
  "validação",
  "validar",
  "valor",
  "vantagem",
  "variável",
  "venda",
  "vencer",
  "velocidade",
  "verão",
  "verdade",
  "verificação",
  "verificar",
  "versão",
  "viagem",
  "vida",
  "vídeo",
  "visão",
  "visita",
  "visual",
  "visualização",
  "vitalidade",
  "vitória",
  "você",
  "vontade",
  "voto",
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TextSnippet {
  id: string;
  trigger: string; // ex: "$data", ";;email"
  expansion: string; // texto ou template com variáveis como {{data}}, {{hora}}
  description?: string;
  isBuiltin?: boolean;
}

// ─── Atalhos built-in ─────────────────────────────────────────────────────────

export const BUILTIN_SNIPPETS: TextSnippet[] = [
  {
    id: "builtin_date",
    trigger: "$data",
    expansion: "{{data}}",
    description: "Data atual (DD/MM/AAAA)",
    isBuiltin: true,
  },
  {
    id: "builtin_time",
    trigger: "$hora",
    expansion: "{{hora}}",
    description: "Hora atual (HH:MM)",
    isBuiltin: true,
  },
  {
    id: "builtin_datetime",
    trigger: "$agora",
    expansion: "{{data}} às {{hora}}",
    description: "Data e hora atuais",
    isBuiltin: true,
  },
  {
    id: "builtin_week",
    trigger: "$semana",
    expansion: "Semana {{semana}} de {{ano}}",
    description: "Número da semana atual",
    isBuiltin: true,
  },
];

// ─── Funções de persistência de vocabulário ────────────────────────────────────

/**
 * Retorna a lista de palavras personalizadas salvas pelo usuário.
 */
export function getCustomWords(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_WORDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/**
 * Salva a lista de palavras personalizadas do usuário.
 */
export function saveCustomWords(words: string[]) {
  if (typeof window === "undefined") return;
  const unique = Array.from(
    new Set(
      words.map((w) => w.trim().toLowerCase()).filter((w) => w.length >= 2),
    ),
  );
  localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(unique));
  // Atualiza o vocabulário em memória
  for (const w of unique) {
    userVocabulary.add(w);
  }
}

/**
 * Adiciona uma palavra personalizada ao vocabulário persistido.
 */
export function addCustomWord(word: string): boolean {
  const clean = word.trim().toLowerCase();
  if (clean.length < 2 || clean.length > 50) return false;
  const existing = getCustomWords();
  if (existing.includes(clean)) return false;
  saveCustomWords([...existing, clean]);
  return true;
}

/**
 * Remove uma palavra personalizada do vocabulário persistido.
 */
export function removeCustomWord(word: string) {
  const existing = getCustomWords();
  saveCustomWords(existing.filter((w) => w !== word.toLowerCase()));
  userVocabulary.delete(word.toLowerCase());
}

/**
 * Retorna quantas palavras foram aprendidas dos conteúdos do usuário (em memória).
 */
export function getUserVocabularySnapshot(): string[] {
  return Array.from(userVocabulary).sort();
}

// ─── Funções de snippets ───────────────────────────────────────────────────────

/**
 * Retorna todos os atalhos de texto salvos (built-in + personalizados).
 */
export function getAllSnippets(): TextSnippet[] {
  const custom = getCustomSnippets();
  return [...BUILTIN_SNIPPETS, ...custom];
}

/**
 * Retorna apenas os atalhos personalizados do usuário.
 */
export function getCustomSnippets(): TextSnippet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SNIPPETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TextSnippet[];
  } catch {
    return [];
  }
}

/**
 * Salva a lista de atalhos personalizados.
 */
export function saveCustomSnippets(snippets: TextSnippet[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
}

/**
 * Adiciona ou atualiza um atalho personalizado.
 */
export function upsertSnippet(
  snippet: Omit<TextSnippet, "id" | "isBuiltin">,
): TextSnippet {
  const existing = getCustomSnippets();
  const id = `custom_${Date.now()}`;
  const newSnippet: TextSnippet = { ...snippet, id, isBuiltin: false };
  // Verifica se o trigger já existe e atualiza
  const idx = existing.findIndex((s) => s.trigger === snippet.trigger);
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...snippet };
    saveCustomSnippets(existing);
    return existing[idx];
  }
  saveCustomSnippets([...existing, newSnippet]);
  return newSnippet;
}

/**
 * Remove um atalho personalizado pelo ID.
 */
export function removeSnippet(id: string) {
  const existing = getCustomSnippets();
  saveCustomSnippets(existing.filter((s) => s.id !== id));
}

/**
 * Expande um template de snippet com valores dinâmicos.
 * Substitui {{data}}, {{hora}}, {{semana}}, {{ano}}.
 */
export function expandSnippetTemplate(template: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = String(now.getFullYear());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());

  // Calcula número da semana
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7,
  );

  return template
    .replace(/\{\{data\}\}/g, `${day}/${month}/${year}`)
    .replace(/\{\{hora\}\}/g, `${hours}:${minutes}`)
    .replace(/\{\{ano\}\}/g, year)
    .replace(/\{\{semana\}\}/g, String(weekNum));
}

/**
 * Tenta expandir um atalho no texto. Retorna o texto com o atalho expandido,
 * ou null se nenhum atalho for encontrado.
 *
 * Funciona detectando o último "token" digitado que bata com um trigger.
 */
export function applySnippetExpansion(
  text: string,
): { expanded: string; triggerUsed: string } | null {
  const snippets = getAllSnippets();

  // Encontra o trigger mais longo que termina o texto
  let best: { snippet: TextSnippet; start: number } | null = null;
  for (const snippet of snippets) {
    if (text.endsWith(snippet.trigger)) {
      const start = text.length - snippet.trigger.length;
      if (!best || snippet.trigger.length > snippets[0].trigger.length) {
        best = { snippet, start };
      }
    }
  }

  if (!best) return null;

  const expansion = expandSnippetTemplate(best.snippet.expansion);
  const expanded = text.slice(0, best.start) + expansion;
  return { expanded, triggerUsed: best.snippet.trigger };
}

// ─── Vocabulário ──────────────────────────────────────────────────────────────

/**
 * Adiciona textos ao vocabulário do usuário de forma assíncrona/não bloqueante
 */
export function addTextsToVocabulary(texts: (string | undefined | null)[]) {
  for (const text of texts) {
    if (!text || typeof text !== "string") continue;

    // Divide por pontuações e espaços, preservando caracteres acentuados
    const tokens = text.split(/[\s,.;:!?()[\]{}"'\\/|`~@#$%^&*+=<>_-]+/);
    for (const token of tokens) {
      const clean = token.trim().toLowerCase();
      // Apenas palavras com tamanho significativo e sem números puros
      if (clean.length >= 3 && clean.length <= 30 && !/^\d+$/.test(clean)) {
        userVocabulary.add(clean);
      }
    }
  }
}

/**
 * Busca uma sugestão para o texto que está sendo digitado.
 * Retorna null se não houver sugestão válida ou se o recurso estiver desativado.
 */
export function getWordSuggestion(fullText: string): {
  prefix: string;
  suffix: string;
  suggestion: string;
  completedText: string;
} | null {
  if (!fullText || typeof fullText !== "string") return null;

  // Verifica se o usuário desativou a autocompletação
  if (typeof window !== "undefined") {
    const isEnabled = localStorage.getItem(AUTOCOMPLETE_STORAGE_KEY);
    if (isEnabled === "false") return null;
  }

  // Extrai a última palavra digitada
  const lastSpaceIndex = Math.max(
    fullText.lastIndexOf(" "),
    fullText.lastIndexOf("\n"),
    fullText.lastIndexOf("\t"),
  );

  const textBefore =
    lastSpaceIndex >= 0 ? fullText.slice(0, lastSpaceIndex + 1) : "";
  const currentToken =
    lastSpaceIndex >= 0 ? fullText.slice(lastSpaceIndex + 1) : fullText;

  // Sugere apenas a partir de 2 letras
  if (currentToken.length < 2) return null;

  const lowerPrefix = currentToken.toLowerCase();

  // 1º Prioridade: Termos do vocabulário do próprio usuário (Tarefas, Notas, etc.)
  let matchedWord: string | null = null;

  for (const word of userVocabulary) {
    if (word.startsWith(lowerPrefix) && word.length > lowerPrefix.length) {
      matchedWord = word;
      break;
    }
  }

  // 2º Prioridade: Dicionário geral da língua portuguesa
  if (!matchedWord) {
    for (const word of BASE_PTBR_WORDS) {
      if (word.startsWith(lowerPrefix) && word.length > lowerPrefix.length) {
        matchedWord = word;
        break;
      }
    }
  }

  if (!matchedWord) return null;

  // Preserva a capitalização do usuário:
  // - "Am" -> "Amor"
  // - "AM" -> "AMOR"
  // - "am" -> "amor"
  let formattedSuggestion = matchedWord;
  const isAllUpper = currentToken === currentToken.toUpperCase();
  const isFirstUpper = currentToken[0] === currentToken[0].toUpperCase();

  if (isAllUpper) {
    formattedSuggestion = matchedWord.toUpperCase();
  } else if (isFirstUpper) {
    formattedSuggestion =
      matchedWord.charAt(0).toUpperCase() + matchedWord.slice(1);
  }

  const suffix = formattedSuggestion.slice(currentToken.length);
  if (!suffix) return null;

  return {
    prefix: currentToken,
    suffix,
    suggestion: formattedSuggestion,
    completedText: textBefore + formattedSuggestion,
  };
}

/**
 * Indexa silenciosamente notas e tarefas do usuário em segundo plano.
 * Roda de forma totalmente assíncrona sem travar nenhuma thread do navegador.
 */
export async function indexAppVocabulary(userId?: string) {
  if (!userId) return;

  // Carrega palavras personalizadas persistidas
  const customWords = getCustomWords();
  for (const w of customWords) {
    userVocabulary.add(w);
  }

  try {
    // 1. Carrega títulos e trechos de anotações
    try {
      const notes = await invoke<{ title?: string; content?: string }[]>(
        "note_list_notes",
        {
          userId: String(userId),
        },
      );
      if (Array.isArray(notes)) {
        const textSnippets: string[] = [];
        for (const note of notes) {
          if (note.title) textSnippets.push(note.title);
          // Amostra leve do conteúdo da nota
          if (note.content) {
            textSnippets.push(note.content.slice(0, 1000));
          }
        }
        addTextsToVocabulary(textSnippets);
      }
    } catch {
      // Ignora silenciosamente se o módulo ou comando não estiver acessível
    }

    // 2. Carrega títulos de tarefas
    try {
      const tasks = await invoke<{ title?: string; description?: string }[]>(
        "tasks_list",
        {
          userId: String(userId),
        },
      );
      if (Array.isArray(tasks)) {
        const taskSnippets: string[] = [];
        for (const task of tasks) {
          if (task.title) taskSnippets.push(task.title);
          if (task.description) taskSnippets.push(task.description);
        }
        addTextsToVocabulary(taskSnippets);
      }
    } catch {
      // Ignora silenciosamente
    }
  } catch (_e) {
    // Segurança total contra falhas em tempo de execução
  }
}
