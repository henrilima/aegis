# Aegis v3.0.0 - "Prisma"

### Atualizacoes Recentes

- **Saude do Sistema**: Configuracoes agora tem uma aba diagnostica na categoria Desenvolvedor, com validacao nativa de notificacoes, audio, banco local, logs e backup.
- **Proximo Disparo de Alarmes**: Alarmes fixos e intervalados exibem o proximo horario no modulo e no widget da dashboard.
- **Resolucao de Sons Centralizada**: Frontend passou a usar uma API compartilhada para listar, validar e tocar sons de notificacao.
- **Notificacoes Rastreaveis**: Eventos emitidos pelo backend agora carregam origem e payload padronizado, evitando duplicidade de som entre notificacao nativa e painel.
- **Dashboard Mais Densa**: Widgets receberam bordas, espacamento e altura minima mais contidos para leitura rapida.
- **RootLayout Modularizado**: Providers e efeitos globais foram separados em `AppProviders`, reduzindo a responsabilidade direta do layout raiz.
- **Estatisticas Reorganizadas**: O modulo de Estatisticas recebeu um painel de periodo mais claro, novos cards de leitura rapida, tooltips explicando calculos e um mapa temporal com hover alinhado ao ponto real.
- **Widgets da Dashboard**: Cards internos do widget de Habitos agora ocupam toda a largura disponivel, melhorando escaneabilidade e toque em layouts estreitos.
- **Alarmes Duplicados**: O scheduler agora ignora alarmes de usuarios inexistentes e limpa registros orfaos, evitando disparos invisiveis na lista do usuario atual.
- **Sons de Notificacao Removidos**: Alarmes e notificacoes agora caem para um som valido quando um arquivo antigo nao existe mais, evitando referencias quebradas.
- **Som Global em Alarmes**: Disparos de alarme nao tocam mais o som global junto do som proprio do alarme.
- **Build com Turbopack**: Remocao da dependencia de `next/font/google` no layout para evitar falha de build com o modulo interno de fontes do Turbopack.
- **Modos de Exibição do App**: Novos estilos de layout Focado (sem sidebar) e Portal de Módulos (com navegação fluida por cards de alta fidelidade e botão voltar).
- **Dropdown de Utilitários Flutuante nos Módulos**: Agrupamento em um dropdown expansível que abre para cima com micro-interações de rotação (135°) e indicador sutil de notificações. Exibido estritamente nos modos Focado e Portal nos módulos.
- **Design Limpo de Cabeçalho**: Simplificação e remoção de botões redundantes de utilitários do topo de todos os cabeçalhos de módulo.
- **Atalho Alt + N Aperfeiçoado**: A tecla de atalho Alt + N agora atua como um toggle perfeito para o painel de notificações, fechando-o suavemente com animação de saída caso já esteja aberto.
- **Personalização Dinâmica do Portal**: Ocultação automática do botão "Personalizar" da Dashboard em todos os 5 layouts de cabeçalho quando o modo Portal de Módulos está ativo.

**Status:** Versão Estável (Atual)
**Build:** Produção Final

### 🚀 Visão Geral
A versão **v3.0.0** de codinome **Prisma** transforma o Aegis em uma plataforma de aprendizado ainda mais poderosa. O destaque absoluto desta release é o **Módulo de Flashcards** totalmente funcional — com repetição espaçada, revisão diária global e relatórios visuais completos. Além disso, a atualização consolida exportação e importação de dados em múltiplos módulos, melhora o seletor de cores global e expande a compatibilidade do app para **Linux**.

---

### ✨ Novas Funcionalidades

- **Módulo de Flashcards**: Sistema completo de memorização ativa com baralhos personalizáveis, cartões frente/verso, algoritmo de repetição espaçada e flip 3D animado.
- **Revisão Diária Global**: Fila unificada que consolida todos os cartões devidos de todos os baralhos ativos em uma única sessão de estudos.
- **Tags em Baralhos**: Suporte a hashtags nas descrições dos baralhos com filtro visual interativo na tela principal.
- **Sessão de Estudo Configurável**: Antes de cada sessão, escolha a quantidade de cartões (selecionando em lista de 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 ou todos) e a ordem (aleatória ou cronológica).
- **Relatórios de Flashcards**: Aba de relatórios com visões diária, semanal e mensal — incluindo canvas visual exportável, distribuição por dia da semana e conquistas.
- **Exportação e Importação de Flashcards**: Backup completo de baralhos e cartões em formato JSON com restauração sem perda de dados.
- **Exportação/Importação de Senhas (CSV)**: Importe e exporte credenciais do cofre em formato CSV compatível com gestores externos.
- **Exportação de Dados (Estudos, Sono, Tarefas)**: Módulos de Estudos, Sono e Tarefas agora permitem exportar dados em CSV para análise externa.
- **Backup Automático**: A rotina de backup automático permite que o sistema salve automaticamente seus dados do app (não são inclusas as senhas e notas).
- **Compatibilidade com Linux**: O Aegis agora é distribuído oficialmente para Linux via Tauri v2, além de Windows.
- **Estilos de App (Focado & Portal)**: Adicionados os modos de app Focado (sem sidebar, permitindo foco absoluto com botão voltar para home) e Portal de Módulos (que substitui o dashboard por cards grandes e responsivos no estilo de aplicativos modernos).
- **Grupo de Utilitários Flutuante nos Módulos**: Menu retrátil flutuante que reúne todas as ferramentas úteis em um dropdown vertical para economizar espaço e evitar repetições na header do app.
- **Canvas de Memória Cinematográfica (Filmes)**: Nova funcionalidade no módulo de Filmes para gerar um canvas elegante no formato story (1080x1920) mostrando o pôster do filme assistido, sua avaliação pessoal por estrelas, seu avatar de usuário e detalhes da obra.

---

### 🎨 UX & Performance

- **ColorPicker Refatorado**: Seletor de cores global completamente redesenhado — painel retrátil suave (acordeão) com animação via Framer Motion, hover tracking dinâmico com nome da cor e sem popovers instáveis no Tauri.
- **Transição Física de Abas**: Indicador deslizante contínuo ao navegar entre abas em múltiplos módulos.

---

### 🔧 Fixes & Estabilidade

- **Cor Padrão no ColorPicker**: Correção da duplicação visual da cor padrão ao abrir o seletor de cores.
- **Toggle de Notificações Alt + N**: Correção da lógica de interceptação do atalho Alt + N no painel de notificações para alternar de forma confiável e executar animações de saída sem conflito de foco.
- **Personalizações Dinâmicas do Portal**: Desativação reativa do botão Personalizar na Dashboard em todos os 5 layouts de cabeçalho quando o appMode for "portal".
- **Switches Globais de Estilo de App**: Refatoração das configurações de Modo/Estilo de App na aba de Temas para utilizar o componente Switch dinâmico padrão do sistema.
- **Eventos do Mouse em Tooltips**: Adição da classe CSS `pointer-events-none` no componente de conteúdo da tooltip (`TooltipContent`), tornando as tooltips click-through e impedindo que a presença visual delas bloqueie a interação ou o clique do mouse em qualquer botão ou elemento posicionado diretamente atrás.


---

> [!NOTE]
> O Aegis Prisma marca a chegada oficial do Módulo de Flashcards ao estado de produção, com backend Rust robusto (SQLite via `rusqlite`) e frontend React totalmente integrado ao Tauri v2.