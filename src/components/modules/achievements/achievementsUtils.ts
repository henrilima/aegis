import { ACHIEVEMENTS, DAILY_CHALLENGES } from "@/config/achievements.config";

export function formatXPTitle(source: string): string {
  if (source.startsWith("Conquista: ")) {
    const id = source.replace("Conquista: ", "").trim();
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    return ach ? `Conquista: ${ach.title}` : `Conquista: ${id}`;
  }
  if (source.startsWith("Desafio Diário: ")) {
    const id = source.replace("Desafio Diário: ", "").trim();
    const ch = DAILY_CHALLENGES.find((c) => c.id === id);
    return ch ? `Desafio Diário: ${ch.title}` : `Desafio Diário: ${id}`;
  }
  return source;
}

export function formatXPDescription(source: string): string | null {
  if (source.startsWith("Conquista: ")) {
    const id = source.replace("Conquista: ", "").trim();
    const ach = ACHIEVEMENTS.find((a) => a.id === id);
    return ach ? ach.description : null;
  }
  if (source.startsWith("Desafio Diário: ")) {
    const id = source.replace("Desafio Diário: ", "").trim();
    const ch = DAILY_CHALLENGES.find((c) => c.id === id);
    return ch ? ch.description : null;
  }
  return null;
}

export function formatXPSideText(amount: number, source: string): string {
  if (source.startsWith("Conquista: ")) {
    return `+${amount} XP de conquista`;
  }
  if (source.startsWith("Desafio Diário: ")) {
    return `+${amount} XP de desafio diário`;
  }

  const mapping: Record<string, string> = {
    "Registro de Sono": "sono",
    "Sessão de Estudos": "estudos",
    "Novo Livro Adicionado": "novo livro",
    "Sessão de Leitura": "leitura",
    "Filme Assistido": "filme",
    "Nova Palavra Dicionário": "dicionário",
    "Novo Deck Flashcard": "flashcards",
    "Nova Anotação": "anotação",
    Geral: "atividade",
  };

  const type = mapping[source] || "atividade";
  return `+${amount} XP de ${type}`;
}

export function formatXPDate(timestampStr: string): string {
  if (!timestampStr) return "";

  let date: Date;
  if (!timestampStr.includes("T") && !timestampStr.includes("Z")) {
    const formattedStr = timestampStr.replace(" ", "T");
    date = new Date(formattedStr);
  } else {
    date = new Date(timestampStr);
  }

  if (Number.isNaN(date.getTime())) {
    return timestampStr;
  }

  const day = date.getDate();
  const year = date.getFullYear();
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");

  const monthNames = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const monthName = monthNames[date.getMonth()];

  return `${day} de ${monthName} de ${year} às ${hour}:${minute}`;
}

export function getProgressBarGradient(colorName: string): string {
  const gradients: Record<string, string> = {
    blue: "from-blue-500 to-sky-400",
    sky: "from-sky-500 to-cyan-400",
    cyan: "from-cyan-500 to-teal-400",
    indigo: "from-indigo-500 to-blue-400",
    violet: "from-violet-500 to-purple-400",
    purple: "from-purple-500 to-fuchsia-400",
    fuchsia: "from-fuchsia-500 to-pink-400",
    pink: "from-pink-500 to-rose-400",
    rose: "from-rose-500 to-pink-400",
    red: "from-red-500 to-orange-400",
    orange: "from-orange-500 to-yellow-400",
    amber: "from-amber-500 to-yellow-400",
    yellow: "from-yellow-500 to-amber-400",
    lime: "from-lime-500 to-green-400",
    green: "from-green-500 to-emerald-400",
    emerald: "from-emerald-500 to-teal-400",
    teal: "from-teal-500 to-cyan-400",
    slate: "from-slate-500 to-zinc-400",
    zinc: "from-zinc-500 to-neutral-400",
    neutral: "from-neutral-500 to-stone-400",
    stone: "from-stone-500 to-neutral-400",
  };
  return gradients[colorName] || "from-blue-500 to-sky-400";
}

export const rankStyles: Record<
  string,
  { bg: string; border: string; text: string; solidBg: string }
> = {
  Ferro: {
    bg: "bg-neutral-500/10",
    border: "border-neutral-500/25",
    text: "text-neutral-400",
    solidBg: "bg-neutral-500",
  },
  Bronze: {
    bg: "bg-amber-700/10",
    border: "border-amber-700/25",
    text: "text-amber-700",
    solidBg: "bg-amber-700",
  },
  Prata: {
    bg: "bg-slate-300/10",
    border: "border-slate-300/25",
    text: "text-slate-300",
    solidBg: "bg-slate-400",
  },
  Ouro: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/25",
    text: "text-yellow-500",
    solidBg: "bg-yellow-500",
  },
  Platina: {
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/25",
    text: "text-cyan-400",
    solidBg: "bg-cyan-500",
  },
  Esmeralda: {
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/25",
    text: "text-emerald-400",
    solidBg: "bg-emerald-500",
  },
  Diamante: {
    bg: "bg-blue-400/10",
    border: "border-blue-400/25",
    text: "text-blue-400",
    solidBg: "bg-blue-500",
  },
  Titânio: {
    bg: "bg-purple-400/10",
    border: "border-purple-400/25",
    text: "text-purple-400",
    solidBg: "bg-purple-500",
  },
  Grafeno: {
    bg: "bg-stone-300/10",
    border: "border-stone-300/25",
    text: "text-stone-300",
    solidBg: "bg-stone-500",
  },
};
