/**
 * achievements.config.ts
 *
 * Configurações de Conquistas, Desafios Diários e Progressão de Nível
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xp: number;
  secret: boolean;
  category: "productivity" | "knowledge" | "health" | "security" | "system";
  icon: string; // Nome do ícone da Lucide ou emoji
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  type: "pomodoro" | "task" | "study" | "reading" | "habit" | "note" | "sleep";
  target: number; // quantidade alvo hoje
}

// Retorna o XP necessário para passar do nível atual para o próximo
export function getXPForLevel(level: number): number {
  if (level <= 5) return 200; // Ferro (Level 1-5)
  if (level <= 10) return 400; // Bronze (Level 6-10)
  if (level <= 15) return 800; // Prata (Level 11-15)
  if (level <= 20) return 1500; // Ouro (Level 16-20)
  if (level <= 25) return 2500; // Platina (Level 21-25)
  if (level <= 30) return 4000; // Esmeralda (Level 26-30)
  if (level <= 35) return 6000; // Diamante (Level 31-35)
  if (level <= 40) return 9000; // Titânio (Level 36-40)
  return 12000; // Grafeno (Level 41+)
}

// Retorna o XP acumulado total necessário para atingir um determinado nível
export function getTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
}

export interface RankInfo {
  name: string;
  minLevel: number;
  maxLevel: number;
  xpPerLevel: number;
  color: string;
  description: string;
}

export const RANKS: RankInfo[] = [
  {
    name: "Ferro",
    minLevel: 1,
    maxLevel: 5,
    xpPerLevel: 200,
    color: "text-neutral-400 bg-neutral-500/10 border-neutral-500/20",
    description:
      "O ponto de partida. Aqui você forja a disciplina inicial e estabelece seus primeiros hábitos fundamentais.",
  },
  {
    name: "Bronze",
    minLevel: 6,
    maxLevel: 10,
    xpPerLevel: 400,
    color: "text-amber-700 bg-amber-700/10 border-amber-700/20",
    description:
      "Mais forte que o ferro. Você começa a consolidar sua rotina diária de estudos e sono regrado.",
  },
  {
    name: "Prata",
    minLevel: 11,
    maxLevel: 15,
    xpPerLevel: 800,
    color: "text-slate-300 bg-slate-300/10 border-slate-300/20",
    description:
      "Brilho e refinamento. Suas metas diárias tornam-se consistentes e você já apresenta excelente ritmo.",
  },
  {
    name: "Ouro",
    minLevel: 16,
    maxLevel: 20,
    xpPerLevel: 1500,
    color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    description:
      "O padrão dourado de produtividade. Hábitos, leituras e focos estão totalmente integrados à sua vida.",
  },
  {
    name: "Platina",
    minLevel: 21,
    maxLevel: 25,
    xpPerLevel: 2500,
    color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    description:
      "Inquebrável. Nível avançado de organization pessoal, alta taxa de foco e memorização impecável.",
  },
  {
    name: "Esmeralda",
    minLevel: 26,
    maxLevel: 30,
    xpPerLevel: 4000,
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    description:
      "Raridade e valor. Você se destaca por sessões de estudo profundas e hábitos extraordinariamente sólidos.",
  },
  {
    name: "Diamante",
    minLevel: 31,
    maxLevel: 35,
    xpPerLevel: 6000,
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    description:
      "Lapidado sob extrema pressão. Produtividade máxima em todas as frentes com foco inabalável.",
  },
  {
    name: "Titânio",
    minLevel: 36,
    maxLevel: 40,
    xpPerLevel: 9000,
    color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    description:
      "Resistência suprema. Você domina sua mente e seu tempo com maestria inquestionável.",
  },
  {
    name: "Grafeno",
    minLevel: 41,
    maxLevel: 999,
    xpPerLevel: 12000,
    color: "text-stone-300 bg-stone-300/10 border-stone-300/20 font-bold",
    description:
      "O material mais forte do mundo. O ápice do auto-aperfeiçoamento e da resiliência contínua.",
  },
];

export function getRankForLevel(level: number): {
  name: string;
  color: string;
  minLevel: number;
  maxLevel: number;
  xpPerLevel: number;
  description: string;
  nextRank?: string;
  levelsToNext?: number;
} {
  const index = RANKS.findIndex(
    (r) => level >= r.minLevel && level <= r.maxLevel,
  );
  const currentRank = index !== -1 ? RANKS[index] : RANKS[RANKS.length - 1];
  const nextRank =
    index !== -1 && index < RANKS.length - 1 ? RANKS[index + 1] : undefined;
  const levelsToNext = nextRank ? nextRank.minLevel - level : undefined;

  return {
    ...currentRank,
    nextRank: nextRank?.name,
    levelsToNext,
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  // Sistema / Geral
  {
    id: "first_login",
    title: "Primeiro Aegis",
    description: "Entre no aplicativo pela primeira vez.",
    xp: 50,
    secret: false,
    category: "system",
    icon: "Shield",
  },
  {
    id: "easter_egg_version",
    title: "Curioso das Versões",
    description: "Você clicou 5 vezes seguidas na versão do app!",
    xp: 150,
    secret: true,
    category: "system",
    icon: "Fingerprint",
  },
  {
    id: "easter_egg_theme",
    title: "Camaleão do Aegis",
    description: "Personalizou a identidade visual trocando de tema 5 vezes.",
    xp: 100,
    secret: true,
    category: "system",
    icon: "Palette",
  },

  // Segurança (Cofre)
  {
    id: "first_password",
    title: "Chave Mestra",
    description:
      "Adicione sua primeira credencial com segurança local no cofre.",
    xp: 100,
    secret: false,
    category: "security",
    icon: "KeyRound",
  },
  {
    id: "ten_passwords",
    title: "Cofre Inviolável",
    description: "Guarde 10 ou mais senhas criptografadas no cofre.",
    xp: 250,
    secret: false,
    category: "security",
    icon: "Lock",
  },

  // Produtividade (Tarefas & Pomodoro)
  {
    id: "first_task",
    title: "Lista de Afazeres",
    description: "Crie sua primeira tarefa de organização pessoal.",
    xp: 50,
    secret: false,
    category: "productivity",
    icon: "PlusCircle",
  },
  {
    id: "first_task_done",
    title: "Feito!",
    description: "Marque sua primeira tarefa como concluída.",
    xp: 100,
    secret: false,
    category: "productivity",
    icon: "CheckCircle2",
  },
  {
    id: "ten_tasks_done",
    title: "Produtividade Máxima",
    description: "Conclua 10 tarefas no gerenciador do Aegis.",
    xp: 250,
    secret: false,
    category: "productivity",
    icon: "ListTodo",
  },
  {
    id: "first_pomodoro",
    title: "Foco Iniciado",
    description: "Conclua com sucesso seu primeiro ciclo Pomodoro.",
    xp: 100,
    secret: false,
    category: "productivity",
    icon: "Timer",
  },
  {
    id: "five_pomodoros",
    title: "Mestre do Foco",
    description: "Conclua 5 sessões de foco no temporizador Pomodoro.",
    xp: 250,
    secret: false,
    category: "productivity",
    icon: "Flame",
  },
  {
    id: "secret_night_pomo",
    title: "Morcego do Foco",
    description:
      "Foco na calada da noite! Concluiu um Pomodoro entre 3h e 5h da manhã.",
    xp: 200,
    secret: true,
    category: "productivity",
    icon: "Moon",
  },

  // Conhecimento (Estudos, Notas, Leitura, Dicionário, Flashcards)
  {
    id: "first_study",
    title: "Primeiro Aprendizado",
    description: "Registre sua primeira sessão de estudo por matéria.",
    xp: 100,
    secret: false,
    category: "knowledge",
    icon: "BookOpen",
  },
  {
    id: "study_5_hours",
    title: "Doutorando do Aegis",
    description: "Acumule um total de 5 horas de estudo registradas.",
    xp: 300,
    secret: false,
    category: "knowledge",
    icon: "GraduationCap",
  },
  {
    id: "first_note",
    title: "Diário de Bordo",
    description: "Crie sua primeira nota estruturada em Markdown.",
    xp: 50,
    secret: false,
    category: "knowledge",
    icon: "FileText",
  },
  {
    id: "first_book",
    title: "Leitor Iniciante",
    description: "Adicione o primeiro livro físico ou digital à sua estante.",
    xp: 80,
    secret: false,
    category: "knowledge",
    icon: "Book",
  },
  {
    id: "read_100_pages",
    title: "Devorador de Livros",
    description: "Registre a leitura de 100 páginas acumuladas.",
    xp: 200,
    secret: false,
    category: "knowledge",
    icon: "Library",
  },
  {
    id: "first_dictionary",
    title: "Glossário Bilíngue",
    description: "Adicione sua primeira palavra ou termo ao dicionário local.",
    xp: 50,
    secret: false,
    category: "knowledge",
    icon: "Languages",
  },
  {
    id: "first_flashcard_deck",
    title: "Baralho de Memorização",
    description: "Crie seu primeiro baralho de flashcards.",
    xp: 50,
    secret: false,
    category: "knowledge",
    icon: "Layers",
  },

  // Estilo de vida & Bem-estar (Hábitos & Sono & Filmes)
  {
    id: "first_habit",
    title: "Nova Rotina",
    description: "Crie seu primeiro hábito diário no Aegis.",
    xp: 50,
    secret: false,
    category: "health",
    icon: "Activity",
  },
  {
    id: "habit_streak_5",
    title: "Consistência Pura",
    description: "Alcance uma sequência de 5 dias em qualquer hábito ativo.",
    xp: 200,
    secret: false,
    category: "health",
    icon: "TrendingUp",
  },
  {
    id: "first_sleep",
    title: "Descanse em Paz",
    description: "Registre seu primeiro relatório de ciclo de sono.",
    xp: 50,
    secret: false,
    category: "health",
    icon: "MoonStar",
  },
  {
    id: "secret_long_sleep",
    title: "Sono de Hibernação",
    description:
      "Dormiu feito uma pedra! Registrou uma noite de sono de mais de 10 horas.",
    xp: 150,
    secret: true,
    category: "health",
    icon: "Sparkles",
  },
  {
    id: "secret_short_sleep",
    title: "Insônia Criativa",
    description:
      "Madrugada em claro. Registrou uma noite de sono de menos de 4 horas.",
    xp: 150,
    secret: true,
    category: "health",
    icon: "Zap",
  },
  {
    id: "first_movie",
    title: "Cinefilia Local",
    description: "Adicione seu primeiro filme ou série de entretenimento.",
    xp: 50,
    secret: false,
    category: "health",
    icon: "Film",
  },
];

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: "challenge_pomodoro_1",
    title: "Foco Diário",
    description: "Conclua pelo menos 1 ciclo de Pomodoro hoje.",
    xp: 80,
    type: "pomodoro",
    target: 1,
  },
  {
    id: "challenge_task_2",
    title: "Produtor Ativo",
    description: "Conclua 2 tarefas pendentes hoje.",
    xp: 100,
    type: "task",
    target: 2,
  },
  {
    id: "challenge_study_30",
    title: "Estudo Focado",
    description: "Estude por pelo menos 30 minutos (0.5h) hoje.",
    xp: 120,
    type: "study",
    target: 30, // em minutos
  },
  {
    id: "challenge_reading_10",
    title: "Hábito Literário",
    description: "Registre a leitura de 10 páginas hoje.",
    xp: 80,
    type: "reading",
    target: 10,
  },
  {
    id: "challenge_habit_1",
    title: "Rotina Consistente",
    description: "Marque pelo menos 1 hábito diário como concluído hoje.",
    xp: 70,
    type: "habit",
    target: 1,
  },
  {
    id: "challenge_note_1",
    title: "Registrador de Ideias",
    description: "Crie ou atualize uma nota pessoal hoje.",
    xp: 50,
    type: "note",
    target: 1,
  },
  {
    id: "challenge_sleep_1",
    title: "Sono do Dia",
    description: "Registre o seu sono de hoje no painel de sono.",
    xp: 60,
    type: "sleep",
    target: 1,
  },
];

// Sorteia os desafios diários com base na data, módulos ativos, estatísticas e preserva os já concluídos
export function getDailyChallenges(
  dateString: string,
  enabledModuleIds: string[],
  completedChallengeIds: string[] = [],
  stats?: RealtimeGlobalStats,
): DailyChallenge[] {
  // Converte a string "YYYY-MM-DD" em uma semente numérica
  const parts = dateString.split("-");
  const year = parseInt(parts[0], 10) || 2026;
  const month = parseInt(parts[1], 10) || 6;
  const day = parseInt(parts[2], 10) || 24;

  const seed = year * 372 + month * 31 + day;

  // Mapeamento de tipo de desafio para o ModuleId correspondente
  const typeToModule: Record<string, string> = {
    pomodoro: "pomodoro",
    task: "tasks",
    study: "studies",
    reading: "reading",
    habit: "habits",
    note: "notes",
    sleep: "sleep",
  };

  const result: DailyChallenge[] = [];

  // 1. Sempre preserva desafios que já foram concluídos hoje, mesmo se o módulo correspondente foi desativado
  for (const c of DAILY_CHALLENGES) {
    if (completedChallengeIds.includes(c.id)) {
      result.push(c);
    }
  }

  if (result.length >= 3) {
    return result.slice(0, 3);
  }

  // 2. Filtra apenas os desafios cujos módulos correspondentes estão ativados e que não foram sorteados
  // E verifica se o usuário possui itens criados (tarefas, hábitos, livros) caso tenhamos as estatísticas
  const pool = DAILY_CHALLENGES.filter((c) => {
    if (result.some((r) => r.id === c.id)) return false;

    const moduleId = typeToModule[c.type];
    if (moduleId && !enabledModuleIds.includes(moduleId)) return false;

    if (stats) {
      if (c.type === "habit" && stats.totalHabits === 0) return false;
      if (c.type === "task" && stats.totalTasks === 0) return false;
      if (c.type === "reading" && stats.readingBooksTotal === 0) return false;
    }

    return true;
  });

  let currentSeed = seed;
  const nextRandom = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };

  // Preenche as vagas restantes até obter 3 desafios diários
  const countToDraw = Math.min(3 - result.length, pool.length);
  for (let i = 0; i < countToDraw; i++) {
    const index = Math.floor(nextRandom() * pool.length);
    result.push(pool[index]);
    pool.splice(index, 1); // Remove para evitar duplicados no sorteio do mesmo dia
  }

  return result;
}

export interface RealtimeGlobalStats {
  totalPasswords: number;
  totalTasks: number;
  completedTasksTotal: number;
  completedTasksToday: number;
  totalNotes: number;
  notesCreatedToday: number;
  totalPomodorosToday: number;
  totalPomodoros: number;
  totalHabits: number;
  habitsCompletedToday: number;
  sleepLoggedTodayHours: number;
  studyHoursToday: number;
  readingPagesToday: number;
  readingBooksTotal: number;
  activeDaysTotal: number;
  currentXp: number;
  level: number;
  treeXp: number;
  treeLevel: number;
  xpToday: number;
  totalGlossaryWords: number;
  totalFlashcardDecks: number;
  totalMovies: number;
  maxHabitStreak: number;
  hasNightPomodoro: boolean;
}

export function checkAchievementsToUnlock(
  stats: RealtimeGlobalStats,
  unlockedIds: string[],
): string[] {
  const toUnlock: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition && !unlockedIds.includes(id)) {
      toUnlock.push(id);
    }
  };

  // 1. Primeiro Login
  check("first_login", true);

  // 2. Senhas
  check("first_password", stats.totalPasswords >= 1);
  check("ten_passwords", stats.totalPasswords >= 10);

  // 3. Pomodoro
  check("first_pomodoro", stats.totalPomodoros >= 1);
  check("five_pomodoros", stats.totalPomodoros >= 5);
  check("secret_night_pomo", stats.hasNightPomodoro);

  // 4. Tarefas
  check("first_task", stats.totalTasks >= 1);
  check("first_task_done", stats.completedTasksTotal >= 1);
  check("ten_tasks_done", stats.completedTasksTotal >= 10);

  // 5. Estudos
  check("first_study", stats.studyHoursToday > 0 || stats.activeDaysTotal >= 1);
  check("study_5_hours", stats.activeDaysTotal >= 5);

  // 6. Notas & Dicionário / Flashcards
  check("first_note", stats.totalNotes >= 1);
  check("first_dictionary", stats.totalGlossaryWords >= 1);
  check("first_flashcard_deck", stats.totalFlashcardDecks >= 1);

  // 7. Livros
  check("first_book", stats.readingBooksTotal >= 1);
  check("read_100_pages", stats.readingPagesToday >= 100);

  // 8. Hábitos
  check("first_habit", stats.totalHabits >= 1);
  check("habit_streak_5", stats.maxHabitStreak >= 5);

  // 9. Sono
  check("first_sleep", stats.sleepLoggedTodayHours > 0);
  check(
    "secret_short_sleep",
    stats.sleepLoggedTodayHours > 0 && stats.sleepLoggedTodayHours < 4,
  );
  check("secret_long_sleep", stats.sleepLoggedTodayHours > 10);

  // 10. Filmes
  check("first_movie", stats.totalMovies >= 1);

  return toUnlock;
}
