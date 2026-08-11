export interface TemplateCard {
  front: string;
  back: string;
}

export interface DeckTemplate {
  id: string;
  name: string;
  description: string;
  category: "Biológicas" | "Exatas" | "Idiomas" | "Humanas";
  icon: string;
  color: string;
  cardsCount: number;
  tags: string[];
  cards: TemplateCard[];
}

export const TEMPLATE_CATEGORIES = [
  { id: "all", label: "Todas", icon: "sparkles" },
  { id: "Biológicas", label: "Biológicas", icon: "dna" },
  { id: "Exatas", label: "Exatas & Natureza", icon: "calculator" },
  { id: "Idiomas", label: "Idiomas & Linguagens", icon: "languages" },
  { id: "Humanas", label: "Humanas & Sociedade", icon: "landmark" },
] as const;

export const FLASHCARD_TEMPLATES: DeckTemplate[] = [
  // --- BIOLÓGICAS ---
  {
    id: "genetica-fundamental",
    name: "Genética Fundamental & Mendel",
    description:
      "20 conceitos essenciais de genética: Leis de Mendel, DNA/RNA, alelos, codominância, mutações e biotecnologia.",
    category: "Biológicas",
    icon: "dna",
    color: "emerald",
    cardsCount: 20,
    tags: ["Biologia", "Genética", "Mendel", "Vestibular"],
    cards: [
      {
        front: "Primeira Lei de Mendel",
        back: "Lei da Segregação dos Fatores: Cada característica é determinada por um par de fatores que se separam na formação dos gametas.",
      },
      {
        front: "Segunda Lei de Mendel",
        back: "Lei da Segregação Independente: Fatores para duas ou mais características se segregam de forma independente durante a formação dos gametas.",
      },
      {
        front: "Genótipo vs. Fenótipo",
        back: "Genótipo: Constituição genética do indivíduo (ex: AA, Aa).\nFenótipo: Características observáveis resultantes da interação do genótipo com o meio ambiente.",
      },
      {
        front: "Homozigoto vs. Heterozigoto",
        back: "Homozigoto: Possui alelos iguais para um gene (ex: AA ou aa).\nHeterozigoto: Possui alelos diferentes para o mesmo gene (ex: Aa).",
      },
      {
        front: "Alelo Dominante vs. Recessivo",
        back: "Dominante: Expressa seu fenótipo mesmo em dose simples (ex: A em Aa).\nRecessivo: Só se expressa em dose dupla (ex: aa).",
      },
      {
        front: "Codominância",
        back: "Situação genética em que ambos os alelos de um heterozigoto se expressam totalmente no fenótipo (ex: Sangue tipo AB no sistema ABO).",
      },
      {
        front: "Dominância Incompleta",
        back: "Fenótipo do heterozigoto é intermediário entre os fenótipos dos homozigotos (ex: Flor vermelha + branca = flor rosa).",
      },
      {
        front: "Sistema ABO (Tipos Sanguíneos)",
        back: "Determinado por alelos múltiplos (IA, IB, i). IA e IB são codominantes entre si e dominantes sobre o alelo i.",
      },
      {
        front: "Fator Rh",
        back: "Herança autossômica dominante. Rh+ (genótipo RR ou Rr) possui o antígeno D nas hemácias; Rh- (rr) não possui.",
      },
      {
        front: "Eritroblastose Fetal",
        back: "Doença hemolítica do recém-nascido. Ocorre quando mãe Rh- sensibilizada produz anticorpos contra o feto Rh+.",
      },
      {
        front: "Estrutura do DNA",
        back: "Dupla hélice de nucleotídeos (desoxirribose + fosfato + base nitrogenada). Bases: Adenina-Timina (A-T) e Citosina-Guanina (C-G).",
      },
      {
        front: "Estrutura do RNA",
        back: "Fita simples de nucleotídeos (ribose + fosfato + base nitrogenada). Bases: Adenina-Uracila (A-U) e Citosina-Guanina (C-G).",
      },
      {
        front: "Transcrição Genética",
        back: "Processo pelo qual a enzima RNA polimerase sintetiza uma molécula de RNA a partir de um molde de DNA.",
      },
      {
        front: "Tradução Genética",
        back: "Processo em que os ribossomos leem a sequência de códons do mRNA para sintetizar uma proteína específica.",
      },
      {
        front: "Códons e Código Genético",
        back: "Códon: Sequência de 3 bases nitrogenadas no mRNA que codifica um aminoácido específico. O código é degenerado/redundante.",
      },
      {
        front: "Mutação Genética",
        back: "Alteração permanente na sequência de nucleotídeos do DNA. Pode ser silenciosa, neutra, benéfica ou prejudicial.",
      },
      {
        front: "Herança Ligada ao Sexo",
        back: "Genes localizados nos cromossomos sexuais (especialmente no X). Ex: Daltonismo e Hemofilia.",
      },
      {
        front: "Pleiotropia",
        back: "Fenômeno em que um único par de genes influencia diversas características fenotípicas distintas no organismo.",
      },
      {
        front: "Epistasia",
        back: "Interação gênica em que um gene (epistático) inibe a expressão de outro gene não alelo (hipostático).",
      },
      {
        front: "Engenharia Genética / CRISPR",
        back: "Técnica de edição genômica de precisão que permite cortar, modificar ou inserir sequências específicas de DNA.",
      },
    ],
  },
  {
    id: "citologia-celular",
    name: "Citologia & Biologia Celular",
    description:
      "20 estruturas e processos celulares fundamentais: organelas, membrana plasmática, mitose, meiose e bioenergética.",
    category: "Biológicas",
    icon: "microscope",
    color: "green",
    cardsCount: 20,
    tags: ["Biologia", "Citologia", "Célula", "Organelas"],
    cards: [
      {
        front: "Membrana Plasmática",
        back: "Modelo do Mosaico Fluido: Bicamada fosfolipídica com proteínas integrais e periféricas com permeabilidade seletiva.",
      },
      {
        front: "Transporte Passivo (Difusão e Osmose)",
        back: "Passagem de substâncias a favor do gradiente de concentração sem gasto de energia (ATP). Osmose: movimento de água em direção ao meio hipertônico.",
      },
      {
        front: "Transporte Ativo (Bomba de Na+/K+)",
        back: "Passagem de íons ou moléculas contra o gradiente de concentração com consumo de ATP (ex: 3 Na+ para fora, 2 K+ para dentro).",
      },
      {
        front: "Mitocôndria",
        back: "Organela responsável pela respiração celular aeróbica e produção da maior parte do ATP da célula. Possui DNA próprio.",
      },
      {
        front: "Ribossomos",
        back: "Complexos de RNA ribossômico e proteínas responsáveis pela síntese proteica (tradução) na célula.",
      },
      {
        front: "Retículo Endoplasmático Rugoso (RER)",
        back: "Possui ribossomos aderidos à sua superfície. Atua na síntese, dobramento e transporte de proteínas exportáveis.",
      },
      {
        front: "Retículo Endoplasmático Liso (REL)",
        back: "Não possui ribossomos. Atua na síntese de lipídios (esteroides, fosfolipídios) e na desintoxicação celular.",
      },
      {
        front: "Complexo de Golgi",
        back: "Organela formada por sáculos achatados. Modifica, empacota e secreta proteínas e lipídios, formando o acrossomo do espermatozoide.",
      },
      {
        front: "Lisossomos",
        back: "Vesículas com enzimas digestivas (hidrolases) responsáveis pela digestão intracelular, autofagia e autólise.",
      },
      {
        front: "Peroxissomos",
        back: "Organelas com enzimas (como a catalase) que degradam o peróxido de hidrogênio (água oxigenada) e ácidos graxos.",
      },
      {
        front: "Citosqueleto",
        back: "Rede de microtúbulos, microfilamentos de actina e filamentos intermediários que dão forma, sustentação e mobilidade à célula.",
      },
      {
        front: "Cloroplastos",
        back: "Organelas presentes em células vegetais e algas contendo clorofila, responsáveis pela realização da fotossíntese.",
      },
      {
        front: "Fotossíntese (Fase Clara vs. Escura)",
        back: "Fase Clara (Tilocoides): Quebra da água por luz, liberação de O2 e geração de ATP/NADPH.\nFase Escura (Estroma): Ciclo de Calvin, fixação de CO2 para formar glicose.",
      },
      {
        front: "Respiração Celular (Etapas)",
        back: "1. Glicólise (Citoplasma) -> 2. Ciclo de Krebs (Matriz Mitocondrial) -> 3. Fosforilação Oxidativa (Cristas Mitocôndriais).",
      },
      {
        front: "Fermentação Lática e Alcoólica",
        back: "Processos anatóxicos no citoplasma.\nLática: Produz ácido lático (músculos/bactérias).\nAlcoólica: Produz etanol e CO2 (leveduras).",
      },
      {
        front: "Mitose (Fases)",
        back: "Divisão celular equacional (2n -> 2n). Fases: Prófase, Metáfase (cromossomos no equador), Anáfase (separação de cromátides), Telófase.",
      },
      {
        front: "Meiose (Objetivo)",
        back: "Divisão celular reducional (2n -> n) que produz 4 gametas/esporos haploides. Garante a variabilidade genética.",
      },
      {
        front: "Crossing-Over (Permutação)",
        back: "Troca de pedaços de DNA entre cromátides homólogas não irmãs durante a Prófase I da Meiose, aumentando a diversidade genética.",
      },
      {
        front: "Núcleo Celular e Nucléolo",
        back: "Núcleo: Armazena o material genético (cromatina/DNA).\nNucléolo: Região densa onde são sintetizadas as subunidades dos ribossomos.",
      },
      {
        front: "Apoptose",
        back: "Morte celular programada controlada geneticamente, essencial para o desenvolvimento embrionário e renovação tecidual sem inflamação.",
      },
    ],
  },
  {
    id: "ecologia-meio-ambiente",
    name: "Ecologia & Meio Ambiente",
    description:
      "20 temas de ecologia: cadeias alimentares, biomas, relações ecológicas, ciclos biogeoquímicos e impactos ambientais.",
    category: "Biológicas",
    icon: "leaf",
    color: "teal",
    cardsCount: 20,
    tags: ["Biologia", "Ecologia", "Meio Ambiente", "ENEM"],
    cards: [
      {
        front: "Nicho Ecológico vs. Habitat",
        back: "Habitat: O local físico onde a espécie vive (seu endereço).\nNicho Ecológico: O papel funcional que a espécie desempenha no ecossistema (seus hábitos).",
      },
      {
        front: "Cadeia Alimentar",
        back: "Sequência linear de transferência de matéria e energia: Produtores (autótrofos) -> Consumidores Primários (herbívoros) -> Consumidores Secundários -> Decompositores.",
      },
      {
        front: "Fluxo de Energia no Ecossistema",
        back: "O fluxo de energia é unidirecional e decrescente a cada nível trófico, dissipando-se na forma de calor.",
      },
      {
        front: "Biomassa vs. Pirâmides Ecológicas",
        back: "Pirâmide de Números, Biomassa e Energia. A pirâmide de energia NUNCA é invertida em ecossistemas naturais.",
      },
      {
        front: "Relação Harmônica Intraespecífica",
        back: "Sociedade (indivíduos independentes organizados, ex: abelhas) e Colônia (indivíduos anatomicamente unidos, ex: corais).",
      },
      {
        front: "Relação Harmônica Interespecífica",
        back: "Mutualismo (obrigatório, ambos se beneficiam), Protocooperação (não obrigatório), Comensalismo (uma beneficia sem prejudicar a outra).",
      },
      {
        front: "Relação Desarmônica Interespecífica",
        back: "Predatismo, Parasitismo, Amensalismo (uma inibe outra, ex: fungo Penicillium) e Competição Interespecífica.",
      },
      {
        front: "Sucessão Ecológica (Primária vs. Secundária)",
        back: "Primária: Ocorre em ambiente virgem sem vida prévia (ex: rocha nua).\nSecundária: Ocorre em área anteriormente habitada que sofreu distúrbio (ex: queimada).",
      },
      {
        front: "Comunidade Clímax",
        back: "Estágio final e estável da sucessão ecológica, com alta biodiversidade, grande biomassa e teias alimentares complexas.",
      },
      {
        front: "Ciclo do Nitrogênio (Etapas)",
        back: "1. Fixação (bactérias Rhizobium) -> 2. Nitrificação (Amônia -> Nitrito -> Nitrato) -> 3. Assimilação -> 4. Desnitrificação.",
      },
      {
        front: "Ciclo do Carbono",
        back: "Fixação do CO2 atmosférico pela fotossíntese e liberação de CO2 pela respiração celular, decomposição e queima de combustíveis fósseis.",
      },
      {
        front: "Efeito Estufa Natural vs. Antrópico",
        back: "Efeito natural mantém a Terra aquecida. A intensificação antrópica (pela queima de CO2 e CH4) gera o aquecimento global.",
      },
      {
        front: "Eutrofização",
        back: "Enriquecimento da água por nutrientes (nitrato/fosfato) -> Proliferação de algas -> Bloqueio de luz -> Morte de plantas aquáticas -> Decomposição consome O2 -> Morte de peixes.",
      },
      {
        front: "Magnificação Trófica (Bioacumulação)",
        back: "Acúmulo progressivo de poluentes não biodegradáveis (ex: mercúrio, DDT) ao longo dos níveis tróficos, concentrando-se mais no topo.",
      },
      {
        front: "Bioma Amazônia",
        back: "Maior floresta tropical do mundo, latifoliada, elevada umidade, clima equatoriado e alta biodiversidade.",
      },
      {
        front: "Bioma Cerrado",
        back: "Savana brasileira, árvores cascudas de troncos tortuosos, solo ácido rico em alumínio, estiva seca marcada e hotspot de biodiversidade.",
      },
      {
        front: "Bioma Caatinga",
        back: "Exclusivo do Brasil, clima semiárido, vegetação xerófila (cactos e arbustos espinhosos) adaptada à aridez.",
      },
      {
        front: "Bioma Mata Atlântica",
        back: "Floresta tropical úmida de encosta, hoje reduzida a fragmentos (hotspot), com alto índice de endemismo.",
      },
      {
        front: "Bioma Pantanal",
        back: "Maior planície de inundação contínua do planeta, com fauna rica e influência de múltiplos biomas limítrofes.",
      },
      {
        front: "Bioma Pampa (Campos Sulinos)",
        back: "Predomínio de gramíneas e vegetação rasteira, clima temperado/subtropical, propício para a pecuária.",
      },
    ],
  },
  {
    id: "fisiologia-humana",
    name: "Fisiologia Humana & Sistemas",
    description:
      "20 conceitos dos principais sistemas do corpo humano: circulatório, digestório, nervoso, imunológico e renal.",
    category: "Biológicas",
    icon: "activity",
    color: "rose",
    cardsCount: 20,
    tags: ["Biologia", "Fisiologia", "Corpo Humano", "Saúde"],
    cards: [
      {
        front: "Sistema Circulatório (Pequena e Grande)",
        back: "Pequena Circulação: Coração -> Pulmões (hematose/oxigenação) -> Coração.\nGrande Circulação: Coração (Ventrículo Esquerdo) -> Corpo -> Coração.",
      },
      {
        front: "Artérias vs. Veias",
        back: "Artérias: Transportam sangue que sai do coração (paredes espessas e elásticas).\nVeias: Transportam sangue de volta ao coração (possuem válvulas para evitar refluxo).",
      },
      {
        front: "Hemácias, Leucócitos e Plaquetas",
        back: "Hemácias: Transporte de O2 (hemoglobina).\nLeucócitos: Defesa imunológica.\nPlaquetas: Coagulação sanguínea.",
      },
      {
        front: "Digestão de Carboidratos",
        back: "Inicia-se na boca com a ptialina (amilase salivar) e continua no intestino delgado com a amilase pancreática.",
      },
      {
        front: "Digestão de Proteínas",
        back: "Inicia-se no estômago através da pepsina (em meio ácido com HCl) e é finalizada no intestino delgado pela tripsina.",
      },
      {
        front: "Digestão de Lipídios e Bile",
        back: "O fígado produz a bile (armazenada na vesícula biliar), que emulsifica as gorduras para que as lipases atuem no intestino.",
      },
      {
        front: "Sistema Respiratório (Hematose)",
        back: "Troca gasosa de CO2 por O2 por difusão simples nos alvéolos pulmonares.",
      },
      {
        front: "Controle da Respiração",
        back: "Controlada pelo bulbo encefálico sensível ao aumento de CO2 e redução do pH sanguíneo (acidose metabólica).",
      },
      {
        front: "Nêfron e Filtragem Renal",
        back: "Unidade funcional do rim. Etapas: Filtração glomerular -> Reabsorção tubular (glicose/água) -> Secreção.",
      },
      {
        front: "Hormônio ADH (Vasopressina)",
        back: "Produzido no hipotálamo e secretado pela neuro-hipófise; aumenta a reabsorção de água nos rins, reduzindo a diurese.",
      },
      {
        front: "Imunidade Ativa vs. Passiva",
        back: "Ativa: O corpo produz seus próprios anticorpos e memória (ex: Vacinas ou Infecção natural).\nPassiva: O corpo recebe anticorpos prontos (ex: Soros ou Leite materno).",
      },
      {
        front: "Vacina vs. Soro",
        back: "Vacina: Preventiva, contém antígenos atenuados/mortos para estimular memória imunológica.\nSoro: Curativo, contém anticorpos prontos para neutralizar toxinas urgentes.",
      },
      {
        front: "Linfócitos T e B",
        back: "Linfócito B: Produz anticorpos (imunidade humoral).\nLinfócito T CD4: Coordena a resposta imunológica.\nLinfócito T CD8: Destrói células infectadas.",
      },
      {
        front: "Sinapse Nervosa e Neurotransmissores",
        back: "Comunicação entre neurônios via fenda sináptica através de mensageiros químicos (ex: Acetilcolina, Dopamina, Serotonina).",
      },
      {
        front: "Sistema Nervoso Simpático vs. Parassimpático",
        back: "Simpático: Ativa respostas de luta ou fuga (dilata pupilas, acelera coração).\nParassimpático: Ativa estado de repouso e digestão.",
      },
      {
        front: "Insulina vs. Glucagon",
        back: "Insulina (Células Beta do Pâncreas): Reduz glicose no sangue (hipoglicemiante).\nGlucagon (Células Alfa): Aumenta glicose no sangue promovendo a glicogenólise.",
      },
      {
        front: "Hormônios da Tireoide (T3 e T4)",
        back: "Regulam a taxa do metabolismo basal do corpo humano. Exigem iodo para sua síntese.",
      },
      {
        front: "Arco Reflexo",
        back: "Resposta involuntária e ultra-rápida a um estímulo, intermediada pela medula espinhal antes de chegar ao cérebro.",
      },
      {
        front: "Homeostase",
        back: "Capacidade do organismo de manter o meio interno em equilíbrio dinâmico constante (temperatura, pH, glicemia, hidratação).",
      },
      {
        front: "Sistema Linfático",
        back: "Rede de vasos e linfonodos que drena o excesso de fluido intersticial, transporta gorduras e atua na defesa imunológica.",
      },
    ],
  },
  {
    id: "curiosidades-biologicas",
    name: "Curiosidades & Fatos Biológicos",
    description:
      "20 fatos impressionantes sobre a vida, o corpo humano, microorganismos e o reino animal.",
    category: "Biológicas",
    icon: "sparkles",
    color: "amber",
    cardsCount: 20,
    tags: ["Biologia", "Curiosidades", "Fatos", "Conhecimentos Gerais"],
    cards: [
      {
        front: "Qual o maior órgão do corpo humano?",
        back: "A pele! Ela representa cerca de 16% do peso corporal total de um adulto.",
      },
      {
        front: "Qual é a única ave que consegue voar para trás?",
        back: "O Beija-flor! Suas asas conseguem bater em formato de 8, permitindo voo multidirecional.",
      },
      {
        front: "Por que as folhas das plantas são verdes?",
        back: "Devido à presença do pigmento clorofila, que absorve as luzes azul e vermelha e reflete a luz verde.",
      },
      {
        front: "Quantos ossos tem um ser humano adulto?",
        back: "206 ossos. Bebês nascem com cerca de 300 ossos, mas muitos se fundem durante o crescimento.",
      },
      {
        front: "Qual o animal mais forte do mundo em proporção ao tamanho?",
        back: "O Besouro-Esterco! Ele consegue puxar até 1.141 vezes o seu próprio peso corporal.",
      },
      {
        front: "Quantos litros de sangue um adulto possui em média?",
        back: "Entre 4,5 e 5,5 litros de sangue, circulando continuamente pelos vasos sanguíneos.",
      },
      {
        front: "Qual o único mamífero capaz de voar de verdade?",
        back: "O morcego! Outros chamados 'voadores' (como esquilos) apenas aplanam.",
      },
      {
        front: "O que são tardígrados (ursos-d'água)?",
        back: "Microorganismos ultrarresistentes capazes de sobreviver ao vácuo do espaço, radiação e temperaturas extremas.",
      },
      {
        front: "O cérebro humano sente dor?",
        back: "Não! O cérebro não possui receptores de dor (nociceptores), apenas as meninges e vasos ao seu redor.",
      },
      {
        front: "Por que os tubarões não possuem ossos?",
        back: "O esqueleto dos tubarões é composto inteiramente por cartilagem, o que o torna mais leve e flexível.",
      },
      {
        front: "Qual a velocidade do impulso nervoso humano?",
        back: "Impulsos nervosos em axônios mielinizados podem viajar a mais de 400 km/h!",
      },
      {
        front: "O que é bioluminescência?",
        back: "Produção e emissão de luz por um organismo vivo através de reações químicas (ex: pirilampos e seres abissais).",
      },
      {
        front: "Como os fungos se alimentam?",
        back: "Por absorção! Eles secretam enzimas digestivas no meio externo e absorvem os nutrientes digeridos.",
      },
      {
        front: "Quantos neurônios o cérebro humano tem?",
        back: "Aproximadamente 86 bilhões de neurônios, realizando trilhões de conexões sinápticas.",
      },
      {
        front: "Qual o menor osso do corpo humano?",
        back: "O Estribo, localizado no ouvido médio, medindo apenas cerca de 3 milímetros.",
      },
      {
        front: "O que é mimetismo?",
        back: "Estratégia evolucionária em que uma espécie inofensiva imita a aparência ou aviso de outra espécie perigosa/tóxica.",
      },
      {
        front: "Quantas batidas por dia o coração humano realiza?",
        back: "Em média 100.000 batimentos por dia, bombeando cerca de 7.500 litros de sangue.",
      },
      {
        front: "O que é o microbioma humano?",
        back: "O conjunto de trilhões de bactérias, fungos e vírus que vivem no corpo, especialmente no trato gastrointestinal.",
      },
      {
        front: "Qual é o animal mais longevo do planeta?",
        back: "A esponja-do-mar e certas espécies de tubarão da Groenlândia (que vivem mais de 400 anos).",
      },
      {
        front: "Como as plantas carnívoras capturam presas?",
        back: "Elas vivem em solos pobres em nitrogênio e usam folhas modificadas como armadilhas para digerir insetos.",
      },
    ],
  },

  // --- EXATAS & NATUREZA ---
  {
    id: "math-formulas",
    name: "Fórmulas da Matemática",
    description:
      "20 fórmulas e teoremas essenciais da matemática: álgebra, geometria, PA/PG, probabilidade e matemática financeira.",
    category: "Exatas",
    icon: "calculator",
    color: "cyan",
    cardsCount: 20,
    tags: ["Matemática", "Fórmulas", "Geometria", "ENEM"],
    cards: [
      {
        front: "Fórmula de Bhaskara",
        back: "x = (-b ± √(b² - 4ac)) / (2a)\nDelta (Δ) = b² - 4ac",
      },
      {
        front: "Teorema de Pitágoras",
        back: "a² = b² + c²\n(O quadrado da hipotenusa é igual à soma dos quadrados dos catetos)",
      },
      { front: "Área do Triângulo (Geral)", back: "A = (base · altura) / 2" },
      { front: "Área do Triângulo Equilátero", back: "A = (L² · √3) / 4" },
      { front: "Área do Círculo", back: "A = π · r²" },
      { front: "Comprimento da Circunferência", back: "C = 2 · π · r" },
      {
        front: "Área do Trapézio",
        back: "A = ((Base Maior + Base menor) · altura) / 2",
      },
      { front: "Volume do Cilindro", back: "V = π · r² · h" },
      { front: "Volume do Cone", back: "V = (π · r² · h) / 3" },
      { front: "Volume da Esfera", back: "V = (4/3) · π · r³" },
      {
        front: "Termo Geral da P.A. (Progressão Aritmética)",
        back: "an = a1 + (n - 1) · r",
      },
      { front: "Soma dos Termos da P.A.", back: "Sn = ((a1 + an) · n) / 2" },
      {
        front: "Termo Geral da P.G. (Progressão Geométrica)",
        back: "an = a1 · q^(n - 1)",
      },
      { front: "Soma da P.G. Infinita (|q| < 1)", back: "S = a1 / (1 - q)" },
      {
        front: "Fórmula dos Juros Simples",
        back: "J = C · i · t\nMontante (M) = C + J",
      },
      { front: "Fórmula dos Juros Compostos", back: "M = C · (1 + i)^t" },
      {
        front: "Probabilidade Evento Simples",
        back: "P(A) = (Número de casos favoráveis) / (Número de casos possíveis)",
      },
      {
        front: "Arranjo Simples vs. Combinação Simples",
        back: "Arranjo (A ordem importa): An,k = n! / (n - k)!\nCombinação (A ordem NÃO importa): Cn,k = n! / (k! · (n - k)!)",
      },
      {
        front: "Distância entre dois Pontos (Plano Cartesiano)",
        back: "d = √((x2 - x1)² + (y2 - y1)²)",
      },
      {
        front: "Soma dos Ângulos Internos de um Polígono",
        back: "Si = (n - 2) · 180°",
      },
    ],
  },
  {
    id: "physics-laws",
    name: "Fórmulas & Leis da Física",
    description:
      "20 conceitos e equações fundamentais da física: mecânica, gravitação, termologia, ondulatória e eletricidade.",
    category: "Exatas",
    icon: "zap",
    color: "orange",
    cardsCount: 20,
    tags: ["Física", "Mecânica", "Eletricidade", "Fórmulas"],
    cards: [
      { front: "Velocidade Média (Cinemática)", back: "v = Δs / Δt" },
      {
        front: "Equação Horária da Posição no MRUV (Sorvetão)",
        back: "s = s0 + v0·t + (a·t²)/2",
      },
      { front: "Equação de Torricelli", back: "v² = v0² + 2·a·Δs" },
      {
        front: "Segunda Lei de Newton (Princípio Fundamental)",
        back: "F = m · a",
      },
      { front: "Força Peso", back: "P = m · g" },
      { front: "Trabalho de uma Força", back: "W = F · d · cos(θ)" },
      { front: "Energia Cinética", back: "Ec = (m · v²) / 2" },
      { front: "Energia Potencial Gravitacional", back: "Epg = m · g · h" },
      { front: "Potência Mecânica", back: "P = W / Δt" },
      {
        front: "Primeira Lei de Ohm",
        back: "V = R · I (Voltagem = Resistência × Corrente)",
      },
      { front: "Segunda Lei de Ohm", back: "R = ρ · (L / A)" },
      { front: "Potência Elétrica", back: "P = V · I = R · I² = V² / R" },
      {
        front: "Equação Fundamental da Ondulatória",
        back: "v = λ · f (Velocidade = Comprimento de Onda × Frequência)",
      },
      { front: "Período e Frequência", back: "f = 1 / T" },
      {
        front: "Calorimetria (Calor Sensível - Qmacete)",
        back: "Q = m · c · ΔT",
      },
      { front: "Calorimetria (Calor Latente - Qmole)", back: "Q = m · L" },
      {
        front: "Equação Geral dos Gases Perfeitos",
        back: "(P1 · V1) / T1 = (P2 · V2) / T2",
      },
      {
        front: "Empuxo (Princípio de Arquimedes)",
        back: "E = d_líquido · V_submerso · g",
      },
      {
        front: "Pressão Hidrostática (Lei de Stevin)",
        back: "P = P0 + d · g · h",
      },
      {
        front: "Lei da Gravitação Universal de Newton",
        back: "F = G · (m1 · m2) / r²",
      },
    ],
  },
  {
    id: "quimica-geral",
    name: "Química & Tabela Periódica",
    description:
      "20 conceitos essenciais de química: ligações, tabela periódica, estequiometria, ácido-base e oxirredução.",
    category: "Exatas",
    icon: "flask-conical",
    color: "purple",
    cardsCount: 20,
    tags: ["Química", "Ciências", "Tabela Periódica", "ENEM"],
    cards: [
      {
        front: "Tabela Periódica (Períodos vs. Famílias)",
        back: "Períodos (Linhas Horizontais): Número de camadas eletrônicas.\nFamílias (Colunas Verticais): Número de elétrons na camada de valência.",
      },
      {
        front: "Ligação Iônica",
        back: "Transferência definitiva de elétrons entre um Metal (doador/cátion) e um Ametal (receptor/ânion).",
      },
      {
        front: "Ligação Covalente",
        back: "Compartilhamento de pares de elétrons entre Ametais ou entre Ametal e Hidrogênio.",
      },
      {
        front: "Número de Avogadro (Mol)",
        back: "1 mol = 6,02 × 10²³ entidades (átomos, moléculas ou íons).",
      },
      {
        front: "Massa Molar (M)",
        back: "Massa em gramas presente em 1 mol de uma substância (g/mol).",
      },
      {
        front: "Conceito de Ácido (Arrhenius)",
        back: "Substância que em solução aquosa sofre ionização e produz o cátion H+ (H3O+).",
      },
      {
        front: "Conceito de Base (Arrhenius)",
        back: "Substância que em solução aquosa sofre dissociação iônica e libera o ânion OH- (hidróxida).",
      },
      {
        front: "Escala de pH",
        back: "pH < 7: Ácido.\npH = 7: Neutro.\npH > 7: Básico/Alcalino.\npH = -log[H+].",
      },
      {
        front: "Oxidação vs. Redução (Nox)",
        back: "Oxidação: Perda de elétrons (aumento do Nox).\nRedução: Ganho de elétrons (diminuição do Nox).",
      },
      { front: "Reação de Neutralização", back: "Ácido + Base -> Sal + Água." },
      {
        front: "Princípio de Le Chatelier",
        back: "Quando um sistema em equilíbrio sofre uma perturbação externa (pressão, temperatura ou concentração), ele se desloca para anular essa variação.",
      },
      {
        front: "Endotérmico vs. Exotérmico",
        back: "Endotérmico (ΔH > 0): Absorve calor do ambiente.\nExotérmico (ΔH < 0): Libera calor para o ambiente.",
      },
      {
        front: "Concentração Comum vs. Molaridade",
        back: "Concentração Comum: C = m / V (g/L).\nMolaridade: M = n / V (mol/L).",
      },
      {
        front: "Função Orgânica Alcano",
        back: "Hidrocarbonetos de cadeia aberta contendo apenas ligações simples C-C (fórmula CnH2n+2).",
      },
      {
        front: "Função Orgânica Álcool",
        back: "Possui o grupo funcional hidroxila (-OH) ligado a um carbono saturado.",
      },
      {
        front: "Função Orgânica Ácido Carboxílico",
        back: "Possui o grupo funcional carboxila (-COOH) na extremidade da cadeia.",
      },
      {
        front: "Isomeria Plana (Tipos)",
        back: "Cadeia, Posição, Função, Metameria (compensação) e Tautometria.",
      },
      {
        front: "Leis Ponderais (Lavoisier)",
        back: "Lei da Conservação da Massa: Na natureza nada se cria, nada se perde, tudo se transforma.",
      },
      {
        front: "Eletrolise",
        back: "Processo não espontâneo que utiliza corrente elétrica externa para provocar reações de oxirredução.",
      },
      {
        front: "Catalisador",
        back: "Substância que acelera uma reação química ao diminuir a energia de ativação, sem ser consumida na reação.",
      },
    ],
  },

  // --- IDIOMAS & LINGUAGENS ---
  {
    id: "english-essential",
    name: "Inglês Essencial & Phrasal Verbs",
    description:
      "30 termos, phrasal verbs e expressões em inglês usados em conversação diária e artigos acadêmicos.",
    category: "Idiomas",
    icon: "languages",
    color: "blue",
    cardsCount: 30,
    tags: ["Inglês", "Vocabulário", "Idiomas", "Conversação"],
    cards: [
      {
        front: "Achieve",
        back: "Alcançar, atingir uma meta ou objetivo.\nEx: She worked hard to achieve her goals.",
      },
      {
        front: "Acknowledge",
        back: "Reconhecer, admitir a existência de algo.\nEx: He acknowledged his mistake during the meeting.",
      },
      {
        front: "Avoid",
        back: "Evitar, esquivar-se de algo.\nEx: You should avoid eating too much sugar.",
      },
      {
        front: "Behavior",
        back: "Comportamento, conduta.\nEx: His behavior at school has improved greatly.",
      },
      {
        front: "Challenge",
        back: "Desafio, tarefa complexa que exige esforço.\nEx: Learning a new language is a great challenge.",
      },
      {
        front: "Convenient",
        back: "Conveniente, prático, acessível.\nEx: It is very convenient to buy groceries online.",
      },
      {
        front: "Decision",
        back: "Decisão, escolha tomada.\nEx: Making a big decision takes time and thought.",
      },
      {
        front: "Encourage",
        back: "Incentivar, encorajar alguém.\nEx: Teachers encourage students to ask questions.",
      },
      {
        front: "Environment",
        back: "Meio ambiente, entorno.\nEx: We must protect the environment for future generations.",
      },
      {
        front: "Improve",
        back: "Melhorar, aprimorar algo.\nEx: Practice every day to improve your English.",
      },
      {
        front: "Knowledge",
        back: "Conhecimento, sabedoria acumulada.\nEx: Knowledge is power in the modern world.",
      },
      {
        front: "Maintain",
        back: "Manter, sustentar em bom estado.\nEx: It is important to maintain a healthy lifestyle.",
      },
      {
        front: "Necessary",
        back: "Necessário, indispensável.\nEx: Sleep is necessary for good mental health.",
      },
      {
        front: "Opportunity",
        back: "Oportunidade, chance favorável.\nEx: Don't miss the opportunity to study abroad.",
      },
      {
        front: "Provide",
        back: "Fornecer, prover, disponibilizar.\nEx: The hotel provides free Wi-Fi for all guests.",
      },
      {
        front: "Require",
        back: "Exigir, requerer como condição.\nEx: This job requires three years of experience.",
      },
      {
        front: "Solution",
        back: "Solução, resposta para um problema.\nEx: We need to find a solution to this issue quickly.",
      },
      {
        front: "Understand",
        back: "Compreender, entender o sentido.\nEx: Do you understand the instructions for the exam?",
      },
      {
        front: "Valuable",
        back: "Valioso, precioso, de grande utilidade.\nEx: Time is your most valuable resource.",
      },
      {
        front: "Willing",
        back: "Disposto, intencionado a fazer algo.\nEx: She is willing to help us with the project.",
      },
      {
        front: "Give up",
        back: "Desistir de algo.\nEx: Never give up on your dreams.",
      },
      {
        front: "Look forward to",
        back: "Estar ansioso/aguardando com expectativa algo.\nEx: I look forward to meeting you soon.",
      },
      {
        front: "Figure out",
        back: "Compreender ou resolver um problema por raciocínio.\nEx: I need to figure out how this machine works.",
      },
      {
        front: "Carry on",
        back: "Continuar fazendo algo.\nEx: Please carry on with your presentation.",
      },
      {
        front: "Run out of",
        back: "Ficar sem algo (esgotar estoque).\nEx: We ran out of coffee this morning.",
      },
      {
        front: "Bring up",
        back: "Mencionar um assunto na conversa.\nEx: Don't bring up politics at dinner.",
      },
      {
        front: "Turn out",
        back: "Resultar, acabar sendo de determinada forma.\nEx: The party turned out to be amazing.",
      },
      {
        front: "Put off",
        back: "Adiar um compromisso ou tarefa.\nEx: Don't put off what you can do today.",
      },
      {
        front: "Call off",
        back: "Cancelar um evento.\nEx: They had to call off the match due to rain.",
      },
      {
        front: "Break down",
        back: "Quebrar (mecanismo) ou desmoronar emocionalmente.\nEx: The car broke down on the highway.",
      },
    ],
  },
  {
    id: "espanol-basico",
    name: "Espanhol Básico & Expressões",
    description:
      "20 vocábulos e 'falsos amigos' (heterosemânticos) essenciais do espanhol para viagens e conversação.",
    category: "Idiomas",
    icon: "globe",
    color: "red",
    cardsCount: 20,
    tags: ["Espanhol", "Idiomas", "Viagem", "Vocabulário"],
    cards: [
      {
        front: "Embarazada",
        back: "Grávida (Falso amigo! Não significa envergonhada).\nEx: Ella está embarazada de tres meses.",
      },
      {
        front: "Exquisito",
        back: "Delicioso, saboroso (Falso amigo! Não significa esquisito).\nEx: La comida de este restaurante es exquisita.",
      },
      {
        front: "Polvo",
        back: "Poeira/Pó (Falso amigo! Polvo em espanhol é 'Pulpo').\nEx: Hay mucho polvo sobre la mesa.",
      },
      {
        front: "Sobrenombre",
        back: "Apelido (Falso amigo! Sobrenome em espanhol é 'Apellido').\nEx: Su sobrenombre entre amigos es Pepe.",
      },
      {
        front: "Brincos",
        back: "Saltos/Pulos (Falso amigo! Brincos de orelha são 'Pendientes').\nEx: Los niños dan brincos de alegría.",
      },
      {
        front: "Cachorro",
        back: "Filhote de qualquer mamífero (Cão em espanhol é 'Perro').\nEx: El cachorro de león es muy juguetón.",
      },
      {
        front: "Oficina",
        back: "Escritório (Oficina mecânica é 'Taller').\nEx: Trabajo en una oficina en el centro.",
      },
      {
        front: "Copa",
        back: "Taça de vidro para bebidas (Copo é 'Vaso').\nEx: ¿Quieres una copa de vino?",
      },
      {
        front: "Largo",
        back: "Longo/Comprido (Largo em espanhol é 'Ancho').\nEx: Este camino es muy largo.",
      },
      {
        front: "Prejuicio",
        back: "Preconceito (Prejuízo financeiro é 'Perjuicio').\nEx: Debemos combatir los prejuicios en la sociedad.",
      },
      {
        front: "Dirección",
        back: "Endereço ou sentido de direção.\nEx: ¿Me puede dar la dirección del hotel?",
      },
      {
        front: "Cerca vs. Lejos",
        back: "Cerca: Perto.\nLejos: Longe.\nEx: El supermercado está muy cerca.",
      },
      {
        front: "Todavía vs. Ya",
        back: "Todavía: Ainda (ex: Todavía no sé).\nYa: Já (ex: Ya llegué).",
      },
      {
        front: "Desayuno",
        back: "Café da manhã.\nEx: Tomamos el desayuno a las 8 de la mañana.",
      },
      {
        front: "Almuerzo",
        back: "Almoço.\nEx: El almuerzo está listo en el comedor.",
      },
      { front: "Cena", back: "Jantar.\nEx: Vamos a cenar juntos esta noche." },
      {
        front: "Cotidianidad",
        back: "Cotidiano/Dia a dia.\nEx: La rutina en la cotidianidad.",
      },
      {
        front: "Disculpe / Con permiso",
        back: "Com licença / Desculpe (usado para pedir passagem ou chamar atenção).",
      },
      {
        front: "Sin embargo",
        back: "No entanto / Porém.\nEx: Estudió mucho, sin embargo no aprobó.",
      },
      {
        front: "Agradecimiento (Gracias)",
        back: "Obrigado/Obrigada. Resposta: 'De nada' ou 'No hay de qué'.",
      },
    ],
  },

  // --- HUMANAS & SOCIEDADE ---
  {
    id: "historia-brasil",
    name: "História do Brasil & Geral",
    description:
      "20 eventos e períodos fundamentais da História do Brasil e Mundial: Colônia, Império, República e Guerras.",
    category: "Humanas",
    icon: "landmark",
    color: "amber",
    cardsCount: 20,
    tags: ["História", "Brasil", "ENEM", "Humanas"],
    cards: [
      {
        front: "Tratado de Tordesilhas (1494)",
        back: "Acordo entre Portugal e Espanha dividindo as terras descobertas fora da Europa por um meridiano a 370 léguas de Cabo Verde.",
      },
      {
        front: "Capitanias Hereditárias",
        back: "Primeiro sistema de administração colonial do Brasil (1534), dividindo o território em 15 lotes doados a donatários.",
      },
      {
        front: "Ciclo do Açúcar e Engenhos",
        back: "Economia colonial baseada no latifúndio, monocultura açucareira, mão de obra escravizada e exportação para a Europa.",
      },
      {
        front: "Inconfidência Mineira (1789)",
        back: "Movimento separatista em Minas Gerais motivado pela Derrama (cobrança de impostos do ouro). Líder: Tiradentes.",
      },
      {
        front: "Vinda da Família Real (1808)",
        back: "Chegada de D. João VI ao Brasil fugindo de Napoleão. Abertura dos Portos às Nações Amigas e fim do Pacto Colonial.",
      },
      {
        front: "Independência do Brasil (1822)",
        back: "Proclamada por D. Pedro I às margens do Ipiranga, estabelecendo o Primeiro Império do Brasil como monarquia.",
      },
      {
        front: "Lei Áurea (1888)",
        back: "Assinada pela Princesa Isabel em 13 de maio de 1888, abolindo oficialmente a escravidão no Brasil.",
      },
      {
        front: "Proclamação da República (1889)",
        back: "Golpe militar liderado pelo Marechal Deodoro da Fonseca que derrubou a Monarquia de D. Pedro II.",
      },
      {
        front: "Era Vargas (1930 - 1945)",
        back: "Período governado por Getúlio Vargas marcado pela modernização trabalhista (CLT), industrialização e o Estado Novo (ditadura).",
      },
      {
        front: "Ditadura Militar (1964 - 1985)",
        back: "Período autoritário iniciado com o golpe de 64, caracterizado pelo AI-5, censura, tortura e milagre econômico.",
      },
      {
        front: "Constituição de 1988 (Cidadã)",
        back: "Atual Carta Magna do Brasil, elaborada após a redemocratização, garantindo direitos fundamentais e o SUS.",
      },
      {
        front: "Revolução Industrial (Século XVIII)",
        back: "Pioneirismo inglês na transição da manufatura para a maquinofatura a vapor, surgindo o capitalismo industrial e a classe operária.",
      },
      {
        front: "Revolução Francesa (1789)",
        back: "Queda do Absolutismo sob o lema 'Liberdade, Igualdade, Fraternidade', marcando o início da Idade Contemporânea.",
      },
      {
        front: "Primeira Guerra Mundial (1914 - 1918)",
        back: "Conflito entre Tríplice Entente e Tríplice Aliança motivado pelo imperialismo. Marcado pela guerra de trincheiras.",
      },
      {
        front: "Revolução Russa (1917)",
        back: "Queda do Czarismo e ascensão dos Bolcheviques liderados por Lênin, criando o primeiro estado socialista do mundo (URSS).",
      },
      {
        front: "Crise de 1929 (Crash da Bolsa)",
        back: "Superprodução nos EUA e quebra da Bolsa de NY, gerando uma grande depressão econômica global.",
      },
      {
        front: "Segunda Guerra Mundial (1939 - 1945)",
        back: "Conflito global entre Aliados e o Eixo (Nazifascismo). Marcada pelo Holocausto e o uso de bombas atômicas em Hiroshima/Nagasaki.",
      },
      {
        front: "Guerra Fria (1947 - 1991)",
        back: "Disputa ideológica, econômica e militar indireta entre EUA (Capitalismo) e URSS (Socialismo) sem confronto direto.",
      },
      {
        front: "Iluminismo (Século XVIII)",
        back: "Movimento intelectual que defendia a razão, a liberdade individual, o secularismo e criticava o Absolutismo Real.",
      },
      {
        front: "Feudalismo",
        back: "Sistema político, econômico e social da Idade Média baseado em feudos, servidão e relações de suserania e vassalagem.",
      },
    ],
  },
  {
    id: "filosofia-sociologia",
    name: "Filosofia & Sociologia",
    description:
      "20 pensadores e conceitos clássicos da filosofia e sociologia: Sócrates, Platão, Kant, Marx, Durkheim e Weber.",
    category: "Humanas",
    icon: "brain",
    color: "violet",
    cardsCount: 20,
    tags: ["Filosofia", "Sociologia", "Conhecimentos", "ENEM"],
    cards: [
      {
        front: "Maiêutica de Sócrates",
        back: "Método socrático de fazer perguntas para fazer o interlocutor 'partorir' suas próprias ideias e verdades contidas em si.",
      },
      {
        front: "Mito da Caverna de Platão",
        back: "Alegoria que ilustra a passagem do mundo sensível (ilusão das sombras) para o mundo inteligível (a verdade das ideias iluminada pelo Sol).",
      },
      {
        front: "Mesa da Virtude de Aristóteles (Justo Meio)",
        back: "A virtude é a justa medida ou equilíbrio entre dois extremos viciosos (ex: Coragem é o meio entre a covardia e a imprudência).",
      },
      {
        front: "Imperativo Categórico de Kant",
        back: "Aja de tal modo que a máxima de sua ação possa ser transformada em lei universal de conduta moral.",
      },
      {
        front: "Contratualismo (Thomas Hobbes)",
        back: "O homem no estado de natureza é violento ('o homem é o lobo do homem'). Necessita do Estado Leviatã para garantir a paz.",
      },
      {
        front: "Contratualismo (John Locke)",
        back: "Pai do Liberalismo. O Estado deve ser um contrato para proteger os direitos naturais inalienáveis: Vida, Liberdade e Propriedade.",
      },
      {
        front: "Contratualismo (Jean-Jacques Rousseau)",
        back: "O homem nasce bom e a sociedade o corrompe. Defende a Vontade Geral e a soberania popular direta.",
      },
      {
        front: "Fato Social de Émile Durkheim",
        back: "Maneiras de agir, pensar e sentir exteriores ao indivíduo, dotadas de poder coercitivo e de generalidade na sociedade.",
      },
      {
        front: "Ação Social de Max Weber",
        back: "Qualquer conduta humana dotada de um sentido subjetivo elaborado pelo agente e orientada em relação ao comportamento dos outros.",
      },
      {
        front: "Materialismo Histórico Dialético (Karl Marx)",
        back: "A história da sociedade humana é a história da luta de classes entre exploradores (burguesia) e explorados (proletariado).",
      },
      {
        front: "Mais-Valia (Karl Marx)",
        back: "A diferença entre o valor produzido pelo trabalho do operário e o salário pago pelo capitalista, sendo a fonte de lucro do capital.",
      },
      {
        front: "Indústria Cultural (Escola de Frankfurt)",
        back: "Termo de Adorno e Horkheimer para a transformação da arte e cultura em mercadorias padronizadas de consumo de massa.",
      },
      {
        front: "Modernidade Líquida (Zygmunt Bauman)",
        back: "Conceito que descreve a fragilidade, instabilidade e fluidez das relações humanas e instituições no mundo contemporâneo.",
      },
      {
        front: "Poder Executivo, Legislativo e Judiciário (Montesquieu)",
        back: "Teoria da tripartição dos poderes para evitar a tirania e garantir o equilíbrio de freios e contrapesos.",
      },
      {
        front: "Utilitarismo (Bentham e Mill)",
        back: "Doutrina ética em que a ação correta é aquela que promove a maior quantidade de felicidade/prazer para o maior número de pessoas.",
      },
      {
        front: "Nihilismo e Super-homem (Nietzsche)",
        back: "Crítica à moral cristã tradicional. O 'Übermensch' (Super-homem) cria seus próprios valores livre de dogmas impostos.",
      },
      {
        front: "Bio-poder e Vigiar e Punir (Michel Foucault)",
        back: "Análise de como as instituições modernas (prisões, hospitais, escolas) exercem o controle e adestramento dos corpos.",
      },
      {
        front: "Razão Comunicativa (Jürgen Habermas)",
        back: "Busca do consenso ético e político através do diálogo racional e livre de coação na esfera pública.",
      },
      {
        front: "Banalidade do Mal (Hannah Arendt)",
        back: "Fenômeno em que indivíduos cometem atos desumanos ou burocráticos sem reflexão crítica, apenas cumprindo ordens institucionais.",
      },
      {
        front: "Etnocentrismo vs. Relativismo Cultural",
        back: "Etnocentrismo: Julgar outra cultura usando os padrões da sua própria cultura como superiores.\nRelativismo: Compreender hábitos culturais em seu próprio contexto.",
      },
    ],
  },
];
