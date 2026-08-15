/**
 * ranks.config.ts
 *
 * Configurações de Ranks Globais, Títulos de Nível e Estilos de Bordas
 */

export interface RankTitle {
  title: string;
  minLevel: number;
}

export interface RankBorderConfig {
  rankName: string;
  borderColor: string; // Classe CSS para a cor da borda
  gemColor: string; // Classe CSS para a cor da pedra/gem
  clipPath: string; // Forma geométrica da joia/badge por rank (usando clip-path)
}

// Lista de títulos desbloqueados a cada 5 níveis (com a primeira letra de cada palavra em maiúscula)
export const RANK_TITLES: RankTitle[] = [
  { title: "Sem Título", minLevel: 1 },
  { title: "Recruta do Tempo", minLevel: 1 },
  { title: "Aprendiz da Ordem", minLevel: 5 },
  { title: "Buscador de Hábitos", minLevel: 10 },
  { title: "Praticante Consistente", minLevel: 15 },
  { title: "Guardião da Disciplina", minLevel: 20 },
  { title: "Arquivista do Saber", minLevel: 25 },
  { title: "Guardião do Conhecimento", minLevel: 30 },
  { title: "Arquivista Sênior", minLevel: 35 },
  { title: "Mestre do Tempo", minLevel: 40 },
  { title: "Grafeno Indestrutível", minLevel: 45 },
  { title: "Centurião Aegis", minLevel: 50 },
  { title: "Estrategista de Elite", minLevel: 55 },
  { title: "Vanguardista do Foco", minLevel: 60 },
  { title: "Soberano da Ordem", minLevel: 65 },
  { title: "Erudito do Tempo", minLevel: 70 },
  { title: "Lendário da Consistência", minLevel: 75 },
  { title: "Imperador de Hábitos", minLevel: 80 },
  { title: "Monarca da Disciplina", minLevel: 85 },
  { title: "Titã da Produtividade", minLevel: 90 },
  { title: "Oráculo do Tempo", minLevel: 95 },
  { title: "Divindade Aegis", minLevel: 100 },
  { title: "Eterno do Conhecimento", minLevel: 105 },
  { title: "Soberano do Tempo", minLevel: 110 },
  { title: "Sentinela do Infinito", minLevel: 115 },
  { title: "Grafeno Absoluto", minLevel: 120 },
];

// Configuração visual de borda e detalhe para cada rank (cores originais harmonizadas)
export const RANK_BORDERS: Record<string, RankBorderConfig> = {
  Ferro: {
    rankName: "Ferro",
    borderColor: "border-neutral-400 dark:border-neutral-500",
    gemColor: "bg-neutral-500",
    clipPath: "circle(50% at 50% 50%)", // Redonda
  },
  Bronze: {
    rankName: "Bronze",
    borderColor: "border-amber-600 dark:border-amber-500",
    gemColor: "bg-amber-600",
    clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)", // Triangular
  },
  Prata: {
    rankName: "Prata",
    borderColor: "border-slate-400 dark:border-slate-300",
    gemColor: "bg-slate-400",
    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", // Losangular
  },
  Ouro: {
    rankName: "Ouro",
    borderColor: "border-yellow-500 dark:border-yellow-400",
    gemColor: "bg-yellow-400",
    clipPath: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)", // Pentagonal
  },
  Platina: {
    rankName: "Platina",
    borderColor: "border-cyan-500 dark:border-cyan-400",
    gemColor: "bg-cyan-400",
    clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)", // Hexagonal
  },
  Esmeralda: {
    rankName: "Esmeralda",
    borderColor: "border-emerald-500 dark:border-emerald-400",
    gemColor: "bg-emerald-500",
    clipPath:
      "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)", // Octogonal
  },
  Diamante: {
    rankName: "Diamante",
    borderColor: "border-blue-500 dark:border-blue-400",
    gemColor: "bg-blue-400",
    clipPath: "polygon(20% 0%, 80% 0%, 100% 40%, 50% 100%, 0% 40%)", // Joia lapidada
  },
  Titânio: {
    rankName: "Titânio",
    borderColor: "border-purple-500 dark:border-purple-400",
    gemColor: "bg-purple-500",
    clipPath: "polygon(0% 0%, 100% 0%, 100% 60%, 50% 100%, 0% 60%)", // Escudo
  },
  Grafeno: {
    rankName: "Grafeno",
    borderColor: "border-stone-500 dark:border-stone-400",
    gemColor: "bg-stone-500",
    clipPath:
      "polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)", // Estrela/Spark
  },
};

/**
 * Obtém todos os títulos desbloqueados por um usuário com base no seu nível.
 */
export function getUnlockedTitles(level: number): string[] {
  return RANK_TITLES.filter((t) => level >= t.minLevel).map((t) => t.title);
}
