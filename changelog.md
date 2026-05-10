# Aegis v2.5.0 - "Prisma"
**Status:** Versão Estável (Atual)
**Build:** Produção Final

### 🚀 Visão Geral
A versão **v2.5.0** eleva a personalização do Aegis a um novo patamar. Esta atualização introduz o sistema de **Temas Dinâmicos**, permitindo que você escolha sua cor de destaque favorita nos temas base, além de consolidar melhorias críticas em performance, UX e estabilidade em todos os módulos principais.

---

### ✨ Novas Funcionalidades

- **Temas Dinâmicos**: Liberdade total para escolher a cor de destaque principal nos temas *Default*, *Midnight* e *Clarify*.
- **Módulo de Filmes**: Área dedicada para exploração e organização de biblioteca cinematográfica com metadados detalhados via TMDb.
- **Ajustes do app**: F11 agora ativa e desativa o modo tela cheia. Também é possível alterar o zoom do app.
- **Relatório Visual de Hábitos**: Agora você pode exportar seu progresso, ofensivas e estatísticas em um formato visual elegante (Canvas).
- **Gestão de Alarmes em Lote**: Implementação de seleção múltipla para organização e deleção rápida de múltiplos alarmes.
- **Módulo de Dicionário**: Suporte bilíngue avançado e glossário pessoal com títulos no formato "Traduzido (Original)".
- **Sistema de Cores Centralizado**: Identidade visual de todos os módulos unificada em uma única fonte.
- **Gerenciamento de Módulos**: Agora é possível ativar e desativar módulos nas configurações do app, isso oculta o módulo da barra lateral.
- **Clima**: Um novo widget é exibido na header da dashboard com informações do tempo atual da sua região. Pode ser desativado nas configurações.
- **Redesign das Configurações**: Interface de ajustes totalmente reformulada, organizada por módulos, notificações e perfil.
- **Notificações Inteligentes**: Alertas em tempo real, lembretes de hábitos pendentes e resumos matinais integrados.
- **Toaster Customizado**: Sistema de notificações in-app totalmente integrado aos temas e com suporte a gestos.
- **Componentes Globais de Guia**: Introdução do `ModuleInfoModal` para documentação rápida e intuitiva dentro de cada módulo.

---

### 🎨 UX & Performance

- **Skeleton Loading**: Substituição de spinners por skeletons inteligentes nos módulos de Filmes, Hábitos e Dicionário.
- **Animações Fluidas**: Micro-interações e animações de entrada nos cards para uma navegação mais orgânica.
- **Padronização de Modais (ModalShell)**: Todos os modais agora suportam fechamento universal via tecla `ESC` e possuem comportamento consistente.
- **Modularização**: Refatoração de componentes gigantes para melhorar o tempo de resposta e a manutenção do código.

---

### 🔧 Fixes & Estabilidade

- **Sincronização de Fuso (BRT)**: Correção definitiva na lógica de reset de hábitos e notificações para garantir 100% de precisão no horário de Brasília.
- **Integridade de Perfis**: Normalização automática de datas de criação e protocolos de segurança.
- **Estabilidade de Busca**: Limpeza instantânea de filtros ao pressionar `ESC` nos headers.
- **Tratamento de Dados**: Correção de erros `NaN` em gráficos de estatísticas e eliminação de notificações duplicadas.

---

> [!NOTE]
> Este changelog une as inovações da série v2.2 com as melhorias estruturais da v2.3, refletindo a evolução constante do Aegis.