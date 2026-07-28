"use client";

import {
  BookOpen,
  Calendar,
  Clock,
  Gauge,
  Info,
  Lightbulb,
  Sparkles,
} from "lucide-react";

export function StatisticsGuide() {
  const glossary = [
    {
      symbol: "h",
      name: "Horas",
      desc: "Representa a duração de tempo total registrada. É a métrica padrão para horas estudadas (Estudos) ou horas dormidas (Sono).",
      icon: Clock,
      color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    },
    {
      symbol: "%",
      name: "Porcentagem",
      desc: "Indica proporções relativas. No Aegis, mede a taxa de acerto de questões (questões corretas dividido pelo total) e a consistência de registros.",
      icon: Gauge,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      symbol: "p.p.",
      name: "Pontos percentuais",
      desc: "Mede a diferença aritmética absoluta entre duas porcentagens. Exemplo: se sua taxa de acerto anterior era 70% e agora é 75%, houve um aumento de +5 p.p. (e não 5%).",
      icon: Sparkles,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      symbol: "p / pág",
      name: "Páginas",
      desc: "Contagem de páginas físicas ou digitais lidas em suas sessões de leitura ativa.",
      icon: BookOpen,
      color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    },
    {
      symbol: "PPM",
      name: "Páginas por minuto",
      desc: "Ritmo médio de leitura. É calculado dividindo as páginas lidas pelo tempo gasto na sessão.",
      icon: TargetIcon, // Definido localmente ou importado
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Como funciona o Comparativo */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent/50 rounded-lg text-muted-foreground">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">
              Como funciona a comparação de períodos?
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
              Entenda a metodologia por trás das nossas métricas de tendência
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
          <p>
            A aba de <strong>Comparativo</strong> analisa sua performance
            dividindo o intervalo de tempo selecionado em dois períodos
            contíguos e de tamanhos iguais:
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 p-4 bg-muted/20 rounded-xl border border-border/40 my-3 text-center md:text-left">
            <div className="flex-1 p-3 bg-muted/40 rounded-lg">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
                Período anterior (Passado)
              </span>
              <span className="text-xs font-semibold text-foreground">
                Dias N+1 até 2N atrás
              </span>
              <span className="block text-[9px] text-muted-foreground mt-1">
                Ex: do dia 28 ao dia 15 anterior
              </span>
            </div>

            <div className="text-muted-foreground font-black text-lg">➔</div>

            <div className="flex-1 p-3 bg-muted/40 rounded-lg">
              <span className="block text-[10px] font-bold text-violet-400 uppercase mb-1">
                Período atual (Recente)
              </span>
              <span className="text-xs font-semibold text-foreground">
                Últimos N dias até hoje
              </span>
              <span className="block text-[9px] text-muted-foreground mt-1">
                Ex: dos últimos 14 dias até hoje
              </span>
            </div>
          </div>

          <p>
            Ao selecionar <strong>14 dias (14d)</strong>, por exemplo, o Aegis
            analisa os dados dos últimos 14 dias (período atual) e os compara
            com os 14 dias imediatamente anteriores a esse bloco (dias 15 a 28
            atrás). Isso nos dá a variação exata para saber se suas horas de
            estudo, sono, leitura e foco estão progredindo ou regredindo em
            comparação com seu próprio histórico recente.
          </p>
        </div>
      </div>

      {/* Glossário de Métricas */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/50 rounded-lg text-muted-foreground">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">
              Glossário de siglas e métricas
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
              Identificação dos termos e unidades de medida utilizados no módulo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {glossary.map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.symbol}
                className="p-4 bg-card/40 border border-border/60 rounded-xl flex items-start gap-4"
              >
                <div className={`p-2.5 rounded-xl border shrink-0 ${g.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-foreground">
                      {g.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-accent/60 text-muted-foreground border border-border/40 rounded-md">
                      {g.symbol}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {g.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dicas e Melhores Práticas */}
      <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent/50 rounded-lg text-muted-foreground">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">
              Dicas de interpretação
            </h2>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
              Conselhos práticos para tirar o melhor proveito das suas análises
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs leading-relaxed text-muted-foreground">
          <div className="space-y-2">
            <h3 className="font-bold text-foreground">
              Consistência é a chave
            </h3>
            <p>
              A consistência mede a frequência dos seus registros. Manter esse
              número acima de 70% garante que os seus relatórios e gráficos
              sejam estatisticamente confiáveis e livres de lacunas.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-foreground">
              Entenda as correlações
            </h3>
            <p>
              O Aegis cruza automaticamente seu sono e foco com sua taxa de
              acerto em estudos. Uma correlação positiva indica que dormir
              melhor está aumentando diretamente seu rendimento nas disciplinas.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-foreground">
              Mude de escala temporal
            </h3>
            <p>
              Use períodos menores (7d ou 14d) para avaliar o efeito imediato de
              novas rotinas. Use períodos maiores (60d ou 90d) para ver
              tendências duradouras de evolução a longo prazo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ícone de alvo customizado para leitura
function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Alvo"
      {...props}
    >
      <title>Alvo</title>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
