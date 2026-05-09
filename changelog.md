# Aegis v2.3.0 - "Eos"
**Status:** Versão Estável (Atual)
**Build:** Produção Final

### 🚀 Visão Geral
A versão **v2.3.0** consolida o Aegis como uma central completa de produtividade. Esta atualização traz uma harmonia visual sem precedentes com o novo sistema de cores centralizado, expande as capacidades dos módulos de Hábitos e Alarmes, e refina a experiência de uso com carregamentos inteligentes e animações fluidas.

---

### ✨ Novas Funcionalidades

- **Módulo de Filmes**: Área dedicada para exploração e organização de biblioteca cinematográfica com metadados detalhados via TMDb.
- **Relatório Visual de Hábitos**: Agora você pode exportar seu progresso, ofensivas e estatísticas em um formato visual elegante (Canvas).
- **Gestão de Alarmes em Lote**: Implementação de seleção múltipla para organização e deleção rápida de múltiplos alarmes.
- **Módulo de Dicionário**: Suporte bilíngue avançado e glossário pessoal com títulos no formato "Traduzido (Original)".
- **Sistema de Cores Centralizado**: Identidade visual de todos os módulos unificada em uma única fonte de verdade (`modules.config.ts`).
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