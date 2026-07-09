/**
 * pets.config.ts
 *
 * Configurações Unificadas de Mascotes (Pets), Regras de Desbloqueio e Frases de Interação
 */

export interface PetPhrases {
  Idle?: string[];
  Walk?: string[];
  Attack?: string[];
  Death?: string[];
}

export interface PetConfig {
  petId: string;
  name: string;
  minLevel: number;
  rankName: string;
  type: "dog" | "cat" | "rat" | "bird" | "slime";
  basePhrases: PetPhrases;
  phraseOverrides?: PetPhrases;
}

const BASE_DOG: PetPhrases = {
  Idle: ["Woof woof!", "Au au!", "Grrr", "*abana o rabo*", "Brincar?", "Au!"],
  Walk: [
    "*correndo atrás do próprio rabo*",
    "*tentando morder o vento*",
    "*corrida extrema de 2 centímetros*",
    "*velocidade máxima de um caracol*",
    "*farejando pistas inexistentes*",
    "Passeio!",
  ],
  Attack: ["Grrrr!", "Au AU!", "*avança*", "Woof!"],
  Death: [
    "*mortinho da silva*",
    "*desmaia brutalmente*",
    "*finge-se de tapete*",
  ],
};

const BASE_CAT: PetPhrases = {
  Idle: ["Miau~", "*ronrona*", "Ignore-me", "Zzzz", "Hmph.", "Mrrrow."],
  Walk: [
    "*andando com elegância duvidosa*",
    "*planejando a dominação mundial a passos lentos*",
    "*calculando o pulo mais desastroso da história*",
    "*desfilando com desdém*",
    "*correndo de um fantasma invisível*",
  ],
  Attack: ["MIAU!", "*arranha*", "Hsss!", "Fss!"],
  Death: [
    "*desfalece dramaticamente*",
    "Fin.",
    "miau",
    "*reiniciando as 7 vidas*",
  ],
};

const BASE_RAT: PetPhrases = {
  Idle: ["Eek!", "*fareja*", "Queijo?", "Squeak!", "*espreita*"],
  Walk: [
    "*correndo como se o gato estivesse acordado*",
    "*velocidade da luz versão miniatura*",
  ],
  Death: ["Sem queijo hoje", "*capotou o fiat uno*", "*virou petisco de gato*"],
};

const BASE_BIRD: PetPhrases = {
  Idle: ["Piu piu!", "*bate asas*", "Tweet!", "*canta*", "Piuuu~"],
  Walk: [
    "*pulinhos sincronizados de pura ansiedade*",
    "*fingindo que está voando baixo*",
    "*marcha militar de passarinho*",
    "*correndo atrás de uma migalha imaginária*",
  ],
  Death: ["piu", "*plop*", "*caiu como um tijolo alado*", "piiu"],
};

const BASE_SLIME: PetPhrases = {
  Idle: ["*escorrega*", "*poin oin oin oin*", "Eu não sou uma poça d'água!"],
  Walk: [
    "*salta desajeitadamente*",
    "*derrete um pouco*",
    "*tropeça*",
    "Eu não sou um slime malvado!",
  ],
  Death: [
    "*se desfaz lentamente*",
    "*seca até virar pó*",
    "*vira uma poça d'água*",
  ],
};

export const PETS_CONFIG: Record<string, PetConfig> = {
  doberman: {
    petId: "doberman",
    name: "Doberman",
    minLevel: 1,
    rankName: "Ferro",
    type: "dog",
    basePhrases: BASE_DOG,
    phraseOverrides: {
      Idle: ["Au au! Sou o Doberman mais leal!", "*alerta*", "Proteger cofre!"],
    },
  },
  gato_cerveja: {
    petId: "gato_cerveja",
    name: "Gato Cerveja",
    minLevel: 1,
    rankName: "Ferro",
    type: "cat",
    basePhrases: BASE_CAT,
    phraseOverrides: {
      Idle: [
        "Miau! Onde está minha cerveja de brinquedo?",
        "*observa com sono*",
      ],
    },
  },
  shiba: {
    petId: "shiba",
    name: "Shiba",
    minLevel: 10,
    rankName: "Bronze",
    type: "dog",
    basePhrases: BASE_DOG,
    phraseOverrides: {
      Idle: ["Woof! Sou um Shiba muito fofo!", "*sorri*", "Muito doge, uau!"],
    },
  },
  gato_preto: {
    petId: "gato_preto",
    name: "Gato Preto",
    minLevel: 15,
    rankName: "Prata",
    type: "cat",
    basePhrases: BASE_CAT,
    phraseOverrides: {
      Idle: ["Mrrrow... As sombras me acolhem.", "*olhos brilhando no escuro*"],
    },
  },
  slime: {
    petId: "slime",
    name: "Slime",
    minLevel: 20,
    rankName: "Ouro",
    type: "slime",
    basePhrases: BASE_SLIME,
  },
  rato_marrom: {
    petId: "rato_marrom",
    name: "Rato Marrom",
    minLevel: 25,
    rankName: "Platina",
    type: "rat",
    basePhrases: BASE_RAT,
    phraseOverrides: {
      Idle: [
        "Squeak! Guardando seus segredos pixelados!",
        "Mais queijo por favor!",
      ],
    },
  },
  rato_azul: {
    petId: "rato_azul",
    name: "Rato Azul",
    minLevel: 30,
    rankName: "Esmeralda",
    type: "rat",
    basePhrases: BASE_RAT,
    phraseOverrides: {
      Idle: ["Eek! Um rato azul do futuro!", "Vroom vroom!"],
    },
  },
  passaro: {
    petId: "passaro",
    name: "Pássaro",
    minLevel: 35,
    rankName: "Diamante",
    type: "bird",
    basePhrases: BASE_BIRD,
    phraseOverrides: {
      Idle: ["Piu piu! Cantando para o seu sucesso!", "Voar alto!"],
    },
  },
  pombo: {
    petId: "pombo",
    name: "Pombo",
    minLevel: 40,
    rankName: "Titânio",
    type: "bird",
    basePhrases: BASE_BIRD,
    phraseOverrides: {
      Idle: ["Pombo do Aegis na escuta! Coo coo!", "*procura migalhas*"],
    },
  },
};

// Retorna a lista mesclada (base + overrides) de frases para um pet e estado específicos
export function getPetPhrases(
  petId: string,
  state: "Idle" | "Walk" | "Attack" | "Death",
): string[] {
  const config = PETS_CONFIG[petId];
  if (!config) {
    return ["..."];
  }

  const basePhrases = config.basePhrases[state] ?? ["..."];
  const overridePhrases = config.phraseOverrides?.[state];

  if (overridePhrases && overridePhrases.length > 0) {
    return [...basePhrases, ...overridePhrases];
  }

  return basePhrases;
}

// Frases gerais de motivação e incentivo (quando ainda há desafios pendentes)
export const GENERAL_MOTIVATIONAL_PHRASES = [
  "Não sabote seu próprio futuro. Um passo de cada vez!",
  "A jornada de mil milhas começa com um único passo.",
  "Você já bebeu água hoje?",
  "Lembre-se: consistência supera a intensidade!",
  "Um dia sem aprender é um dia desperdiçado.",
  "Seja mais forte do que a sua melhor desculpa.",
  "Foco no presente. O resto se resolve.",
  "A procrastinação é a ladra do tempo. Não a deixe vencer!",
  "A determinação é a chave para superar qualquer obstáculo!",
  "Um guerreiro não foge dos seus deveres!",
  "Que tal focar em uma tarefa agora? Estou torcendo por você!",
  "O tempo voa, mas você é o piloto. Vamos decolar!",
  "Grandes coisas levam tempo. Seja paciente e persistente.",
  "Feito é melhor que perfeito. Vamos começar?",
  "Apenas 15 minutos de foco já fazem a diferença. Tente!",
];

// Frases especiais de incentivo/referência quando TODAS as tarefas diárias foram concluídas
export const COMPLETED_TODAY_PHRASES = [
  "Saber que tudo agora está feito... Isso não te enche de determinação?",
  "Missões concluídas! Que tal descansar um pouco?",
  "Trabalho feito! Você é absolutamente incrível!",
  "O dia foi super produtivo. Amanhã continuamos a jornada!",
  "Desafio superado! Hora de comemorar com um bom descanso!",
  "Você fez o seu melhor hoje. Estou muito orgulhoso!",
  "Missão cumprida! Seu esforço de hoje valeu muito a pena.",
  "Tudo feito! Hora de repor as energias para amanhã.",
];

export interface PetParticleConfig {
  id: string;
  name: string;
  description: string;
  minLevel: number;
  rankName: string;
  type: "image" | "css";
  images?: string[];
  emoji?: string;
}

export const PARTICLES_CONFIG: Record<string, PetParticleConfig> = {
  none: {
    id: "none",
    name: "Nenhum",
    description: "Sem efeitos visuais ao redor do mascote.",
    minLevel: 1,
    rankName: "Ferro",
    type: "css",
  },
  hearts: {
    id: "hearts",
    name: "Corações",
    description: "Pequenos corações flutuantes que demonstram afeto.",
    minLevel: 10,
    rankName: "Bronze",
    type: "css",
    emoji: "❤️",
  },
  stars: {
    id: "stars",
    name: "Estrelas Cintilantes",
    description: "Estrelas brilhantes que piscam ao redor do seu pet.",
    minLevel: 15,
    rankName: "Prata",
    type: "css",
    emoji: "⭐",
  },
  undertale: {
    id: "undertale",
    name: "Almas (Undertale)",
    description: "As 7 almas humanas de Undertale flutuando com determinação.",
    minLevel: 20,
    rankName: "Ouro",
    type: "image",
    images: [
      "/pets/particles/undertale/Red_SOUL_sprite.webp",
      "/pets/particles/undertale/Light_Blue_SOUL_sprite.webp",
      "/pets/particles/undertale/Orange_SOUL_sprite.webp",
      "/pets/particles/undertale/Blue_SOUL_sprite.webp",
      "/pets/particles/undertale/Purple_SOUL_sprite.webp",
      "/pets/particles/undertale/Green_SOUL_sprite.webp",
      "/pets/particles/undertale/Yellow_SOUL_sprite_Shooter_Mode.webp",
    ],
    emoji: "❤️",
  },
};

export interface PetBackgroundConfig {
  id: "cyclic" | "day" | "afternoon" | "night";
  name: string;
  description: string;
}

export const PET_BACKGROUNDS: PetBackgroundConfig[] = [
  {
    id: "cyclic",
    name: "Cíclico",
    description: "Muda automaticamente com a hora do dia.",
  },
  {
    id: "day",
    name: "Dia",
    description: "Mantém o cenário no período do dia.",
  },
  {
    id: "afternoon",
    name: "Tarde",
    description: "Mantém o cenário no entardecer.",
  },
  {
    id: "night",
    name: "Noite",
    description: "Mantém o cenário no período noturno.",
  },
];
