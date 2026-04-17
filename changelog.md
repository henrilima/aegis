# 🛡️ Aegis v2.0.0 — "Medusa"
**Status:** Versão Estável 🐍 <br/>
**Build:** 🧪 Produção (Revisado)

### 🚀 Visão Geral
A versão **Medusa** consolida o núcleo em Rust com uma interface refinada, garantindo privacidade absoluta e uma experiência de produtividade fluida e moderna.

---

### 📂 Desenvolvimento e Módulos

#### 📋 Novidades:
- **Novo Sistema de Temas e Customização Visual**: Pela primeira vez o Aegis ganha suporte nativo a perfis cromáticos dinâmicos! Os usuários agora podem alternar entre robustos temas Dark (como *Dracula*, *Midnight* e *Nordic*) e perfis claros estonteantes como o *Clarity*, alterando completamente a experiência nativa.
- **Módulo de Leitura**: Gestão de biblioteca pessoal com integração à Open Library para busca automática de dados. Inclui rastreamento de progresso (páginas/porcentagem) e histórico detalhado de sessões de leitura.
- **Módulo de Tarefas (To-Do)**: Sistema dedicado para gestão de tarefas diárias rápidas, integrado à sidebar para foco imediato.
- **Gerenciamento Hierárquico em Notas**: Novo sistema de pastas com suporte a Drag and Drop robusto via `@dnd-kit/core`. Permite organizar anotações em estruturas complexas com feedback visual de movimentação.
- **Central de Avisos**: Monitoramento de atualizações via GitHub integrado. Detecta versões Beta e inclui mensagens inteligentes sobre a saúde da sua build.

#### 🔄 Mudanças e Melhorias:
- **Módulo de Calendário**: Integração completa com os feriados oficiais do Brasil via BrasilAPI e fallback de cálculo local (Butcher-Meeus). Sincroniza datas comemorativas automaticamente em apenas um clique.
- **Widget de Calendário Otimizado**: O dashboard agora exibe feriados nacionais com indicadores visuais dedicados, facilitando a visualização de compromissos futuros.
- **Editor Markdown em Split View**: Redesign completo do modal de criação de notas, incluindo visualização em tempo real (Split View) e suporte a formatação rica antes de salvar.
- **Lembrete de Sono**: Implementação de lembretes ativos para o ponto de recolhimento ideal, com notificações críticas despachadas via backend.
- **Gestor de Notas Refinado**: Padronização da interface do módulo de notas. Remoção de modos de visualização redundantes em favor de uma grade (Grid) premium, consistente e focada na produtividade.
- **Expansão Dinâmica de Módulos**: Remoção das restrições de contenção de largura (max-width) nos módulos base de Estatísticas, Calendário, Pomodoro e Hidratação, escalando as interfaces fluidamente para o total proveito do monitor do usuário.
- **Correções Visuais no Calendário**: Unificação da lógica que detecta Feriados Oficiais; badges aumentadas e padding melhorado para leitura ampliada na ficha dos meses.

---

### 🎨 Design e Interface
- **Refinamento UI**: Melhoria geral na interface do usuário.
- **Refatoração da Sidebar**: Layout totalmente redesenhado com agrupamentos lógicos (Gestão, Performance, Qualidade de Vida e Ferramentas) e micro-animações.
- **Paleta Temática Reativa**: Limpa massiva de cores estáticas antigas (hardcoded blues). Central de notificações, ícones, hovers, disparadores da sidebar e URL's internas agora traqueiam injetores temáticos reativos (consumindo nativamente cores complexas ao trocar de tema).
- **Navegação Fluida**: Indicadores de estado ativo e transições de hover otimizadas na sidebar.
- **Transições de Módulos High-End**: Implementação de animações baseadas em `popLayout` com easing e efeitos de desfoque cross-fading, proporcionando uma troca de módulos suave.
- **Paleta**: Padronização visual completa com acentos temáticos.

---

### 🔧 Fixes e Estabilidade
- **Persistência de Dados**: Correção no salvamento e edição de eventos no SQLite; os parâmetros agora são mapeados integralmente pelo Rust, evitando falhas de integridade.
- **Migrações Automáticas**: Implementada lógica de auto-migração que atualiza automaticamente feriados ao iniciar a aplicação.
- **Crash Prevention**: Adicionadas travas de segurança (`safety checks`) no painel de detalhes do calendário para evitar erros de renderização com listas de eventos vazias ou indefinidas.
- **Lógica de Hábitos**: Refatoração completa do sistema de streaks e cargas. Corrigida a inflação de iterações (resets de hábitos positivos não contam mais como progresso), implementada a persistência de streaks dinâmicos para hábitos negativos e suporte a recarga diária (intervalo de 1 dia). Corrigida também a disponibilidade do botão de conclusão após o uso de cargas de proteção.
- **Estabilização Global de Scroll**: Refatoração profunda do hook `useLockBodyScroll` e implementação de "Safety Net" no layout global. Resolve problemas de travamento de interface que impediam a rolagem em diversos módulos do app.
- **Arquitetura de Scroll Rígida**: Implementação de `scrollbar-gutter: stable` e limpeza da hierarquia de overflows aninhados no Dashboard. Elimina o efeito de "pulo" visual da barra de rolagem durante a transição entre conteúdos de diferentes alturas.
- **Ticker de Notificações**: Otimização do consumo de recursos no loop de alertas do sistema.

---

> [!NOTE]
> Este changelog foi gerado e escrito por uma inteligência artificial e revisado por um humano, garantindo a precisão técnica e a clareza na comunicação das melhorias.