# 🛡️ Aegis - Seu Centro de Produtividade & Privacidade (v3.0.0 "Prisma")

Aegis é um dashboard de produtividade "all-in-one" desenvolvido para ser rápido, seguro e absolutamente **impecável**. Construído com a robustez inabalável do **Rust (Tauri)** e a agilidade estonteante do **Next.js**, ele oferece um ambiente centralizado para gerenciar sua rotina diretamente no seu desktop com privacidade absoluta e um design que é puro luxo.

---

## 🚀 Novidades da Versão 3.0.0 "Prisma"

A versão **Prisma** consolida o Aegis como uma plataforma de aprendizagem e produtividade de elite, introduzindo novos recursos de customização de dashboard, flashcards, acessibilidade e melhorias profundas de contraste:

- **🖼️ 5 Estilos de Header**: Escolha em *Configurações -> Aparência* entre 5 novos layouts incríveis para o topo da sua Dashboard (*Padrão, Compacto, Focado, Mínimo* e *Acolhedor*), totalmente responsivos e animados.
- **✨ Header Acolhedor**: Redesenhado do zero como uma *Glassmorphic Hero Card* com efeito de aura brilhante e dinâmica que se adapta à cor de destaque activa do tema, além de uma barra de status horizontal fluida integrando clima, data e progresso diário de tarefas e hábitos.
- **🌓 Contraste Perfeito no Tema Claro**: Reformulação profunda nas cores de texto, cards, ícones e trilhas de progresso de todos os widgets, garantindo legibilidade perfeita e refinamento estético absoluto no tema claro, sem alterar a suavidade do tema escuro.
- **🎴 Módulo de Flashcards Totalmente Funcional**: Memorização ativa com baralhos personalizáveis, revisão diária global integrada, flip 3D animado, etiquetas inteligentes e relatórios visuais dinâmicos (diário, semanal e mensal).
- **🎬 Canvas de Memória Cinematográfica**: Nova funcionalidade no módulo de Filmes para gerar um canvas de alta fidelidade no formato stories (1080x1920) mostrando o pôster do filme assistido, sua avaliação pessoal por estrelas, seu avatar de usuário e detalhes da obra.
- **🔑 Backup Automático com Senhas**: Nova opção para incluir credenciais do cofre nos backups automáticos formatados em JSON, criptografando-as de forma robusta localmente com chave de serviço AES-256-GCM.
- **📤 Exportação e Importação de Módulos**: Backup e restauração independentes em múltiplos módulos (Estudos, Sono, Tarefas e Flashcards), garantindo flexibilidade total para migração e controle de dados.
- **♿ Acessibilidade Corrigida (A11y)**: Correção completa no linter `Static Elements should not be interactive` no *TasksWidget* através da conversão para elementos estáticos semânticos e tratamento centralizado de intercepção no *BaseWidget*.
- **🎨 ColorPicker Refatorado**: Seletor de cores centralizado redesenhado em painel retrátil suave (acordeão via Framer Motion), com feedback dinâmico no hover e estabilidade total no Tauri.
- **📐 Escala e Alinhamento do Relógio**: Redução de escala em 15%–20% no relógio centralizado (layout focado) para proporções ideais, aumento na escala de fonte do *Texto Literário* e respiro horizontal de 6px (`mx-1.5`) nos dois-pontos (:) de todos os relógios digitais.
- **🧹 Limpeza e Consolidação Estética**: Remoção dos modelos antigos de relógio *Cyber Terminal* e *Ultra Minimalista* para consolidar uma identidade visual uniforme de alto padrão.
- **📱 Novos Modos/Estilos de App (Focado & Portal)**: Adicionados estilos modernos para a aplicação — o modo *Focado* (que remove a barra lateral permitindo foco total na tarefa, com botões inteligentes de navegação "Voltar" e atalho utilitário flutuante) e o modo *Portal de Módulos* (que remove a sidebar e substitui a Dashboard por cartões de módulos grandes, elegantes e responsivos no estilo de aplicativos modernos).
- **🕹️ Dropdown de Utilitários Flutuante nos Módulos**: Novo menu retrátil animado via Framer Motion no canto inferior direito que condensa ferramentas importantes (Configurações, Notificações com badge dinâmico discreto, Feedbacks e Guia de atalhos) em um único acionador `Plus` com micro-interação de rotação em 135° (virando um `x` ao expandir). Exibido estritamente nos modos *Focado* e *Portal* dentro dos módulos para manter a tela limpa e sem poluição.
- **🧹 Cabeçalho de Módulos Simplificado**: Remoção completa de botões redundantes no topo de todos os cabeçalhos de módulo, consolidando as ações utilitárias dentro do novo dropdown flutuante inteligente.
- **🔔 Atalho Alt + N Aprimorado**: O atalho Alt + N agora atua como um interruptor de alternância (toggle) completo, fechando o painel de notificações suavemente e com animações de saída caso ele já esteja aberto.
- **🐧 Compatibilidade com Linux**: Distribuição oficial nativa para Linux via Tauri v2, expandindo o app para além do ecossistema Windows.
- **🖱️ Tooltips Click-Through**: Correção de usabilidade nas tooltips globais através da adição da classe CSS `pointer-events-none`. Agora as tooltips são completamente transparentes a eventos do mouse, impedindo que a presença visual delas bloqueie o clique ou interações em botões e elementos posicionados diretamente atrás.

---

## 🛠️ Stack Tecnológica

O projeto utiliza o que há de mais moderno e poderoso no mercado:

- **Frontend**: [Next.js 16](https://nextjs.org/) + [React 19](https://react.dev/)
- **Core Engine**: [Tauri v2](https://tauri.app/) (A força e segurança do Rust 🦀)
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Qualidade de Código**: [Biome](https://biomejs.dev/) para um linting impecável.

---

## 🛡️ Privacidade & Segurança

O Aegis não brinca em serviço: todos os seus dados são processados localmente. Suas métricas, notas e senhas permanecem no seu computador através da infraestrutura segura e criptografada do Tauri. Seus dados, suas regras.

---

## 🪟🐧 Compatibilidade

O Aegis é **otimizado para Windows** (10 e 11) e **Linux**, com integrações profundas nas APIs de cada sistema operacional para garantir uma performance que não aceita menos que a perfeição.

---

## 📜 Licença

Este projeto está sob a licença **MIT**. Sinta-se à vontade para estudar o código, brilhar nas contribuições e levar a produtividade ao próximo nível!

---

> [!NOTE]
> Todo o código, documentação e changelog foram revisados meticulosamente para garantir consistência, clareza técnica e uma experiência de usuário de altíssimo nível.

Feito com carinho por [José Henrique](https://github.com/henrilima) e revisado por IA.