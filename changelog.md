# Aegis v2.1.0 — "Medusa"
**Status:** Versão Estável<br/>
**Build:** Produção (Refatorada)

### 🚀 Visão Geral
A atualização **v2.1.0** eleva o Aegis a um novo patamar de estabilidade e funcionalidade. Focamos em robustez no backend (Rust), portabilidade de dados e uma experiência de usuário mais interativa e conectada.

---

### ✨ Novas Funcionalidades

- **Módulo de Alarmes e Alertas**: Evolução completa do sistema de alertas. Agora suporta horários fixos e repetições por intervalos (técnica de micro-pausas), com ícones, cores e sons personalizáveis. Inclui um guia de produtividade integrado.
- **Personalização de Áudio**: Agora você pode escolher sons customizados para suas notificações diretamente da biblioteca do Aegis. O sistema gerencia arquivos `.mp3` e `.wav` de forma inteligente.
- **Busca Avançada nas Notas**: O sistema de pesquisa agora varre o conteúdo (Markdown) das suas notas em tempo real, com suporte a snippets de prévia no card e normalização de texto (ignora acentos).
- **Refatoração do Calendário**: Renomeação de "Deadlines" para "Prazos" com novas categorias (Estudo, Reunião, Pessoal, etc.). Adicionada proteção contra deleção de feriados nacionais e filtro inteligente em backups.
- **Sistema de Feedback Inteligente**: 
    - Integração premium com Discord via Webhook.
    - Lógica de privacidade: dados sensíveis são enviados apenas em Bug Reports, nunca em Feedbacks.
    - Sistema anti-spam com cooldown de 120s e limite mínimo de caracteres.
- **Busca Global (Ctrl+K)**: Implementação de um *Command Palette* para navegação instantânea entre módulos e um widget de ajuda interativo (Ctrl+Shift+?) com guia de atalhos.
- **Widgets Interativos**: Os cards de *Tarefas*, *Hábitos* e *Pomodoro* no Dashboard agora são mini-aplicativos funcionais, permitindo interações diretas.
- **Auto-Updater Nativo**: Sistema de atualização automática integrado com download in-app e barra de progresso.
- **Portabilidade e Backup**: Exportação/Importação de CSV e backup criptografado do banco SQLite.

---

### 🔧 Fixes e Estabilidade

- **Otimização de Alertas**: Refatorada a lógica de disparos para preservar o estado do banco de dados, evitando notificações repetitivas indesejadas após edições estéticas.
- **Robustez no Backend**: Refatoração massiva do código Rust, eliminando riscos de crash (*panics*) em diversos módulos (Pomodoro, Estudos, Senhas).
- **Privacidade e Sessão**: Migração de dados sensíveis para o `tauri-plugin-store` (armazenamento criptografado).
- **Sincronização de Tempo**: Todos os módulos agora respeitam o tempo simulado do Aegis.
- **Timezones**: Datas de notificações agora seguem o padrão ISO/UTC (Z) em todas as tabelas SQLite.
- **Backup Automático**: Cópia de segurança automática dos seus dados realizada antes de qualquer atualização de sistema.

---

### 🎨 UX / Design e Acessibilidade

- **Design System "Premium"**: Padronização de todos os modais (Configurações, Feedback, Alarmes) para o formato de 850px com Cabeçalho e Rodapé fixos, garantindo fluidez e foco no conteúdo.
- **Refinamento Visual Minimalista**: Redução de sombras excessivas e ajuste de pesos tipográficos para um visual mais moderno e "flat".
- **Seletor de Sons Premium**: Substituição de controles nativos por componentes customizados do Shadcn UI para uma experiência tátil superior.
- **Micro-animações**: Feedback visual fluido em notificações e transições de painéis.
- **Contraste WCAG**: Melhoria na legibilidade do Tema Claro, com reforço de contraste.
- **Acessibilidade Pro**: Implementação de *Focus Trap* em modais e correção integral de ARIA Roles.
- **Performance**: *Lazy Loading* em módulos pesados e polling de notificações otimizado para consumo zero de CPU.

---

> [!NOTE]
> Este changelog reflete o compromisso do Aegis com a transparência e a evolução constante, unindo a performance do Rust com a fluidez do Next.js.