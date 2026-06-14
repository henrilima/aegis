# Aegis v3.0.1

### Novidades
- **Seleção de Diretório de Dados no Login**: Possibilidade de escolher a pasta de leitura/gravação dos dados diretamente da tela de login, permitindo compartilhar o banco de dados entre sistemas operacionais de maneira simples.
- **Migração de Módulos para Headers**: Integração dos atalhos do Dicionário e do Pomodoro nos cabeçalhos dos módulos principais correspondentes e consequente limpeza da barra lateral (deixando Hábitos na categoria "Rotina & Bem-estar").
- **Importação/Exportação Centralizada**: Centralização das ações de importação e exportação de dados (CSV/JSON) de todos os módulos na aba **Dados** de configurações, deixando as headers dos módulos mais limpas.
- **Indicadores KBD nas Tooltips**: Visualização dos atalhos das ações globais e do menu de atalhos em blocos `<kbd>` estilizados.
- **Atalhos Rápidos**: Atalho `Alt+Shift+D` para o Dicionário e `Alt+F` para o formulário de feedback.
- **Ícone do Aplicativo**: Agora é possível definir um ícone personalizado para o Aegis nas configurações de aparência.
- **Guias como Abas nos Módulos**: Os guias de todos os módulos com navegação por abas (Estudos, Sono, Leitura, Filmes, Hábitos, Flashcards e Dicionário) foram migrados do formato modal para uma aba dedicada, tornando o conteúdo acessível sem interromper o fluxo de uso.
- **Botões de Guia Simplificados**: Nos módulos sem abas (Tarefas, Cofre, Anotações, Alarmes, Calendário, Pomodoro), o botão de guia agora exibe apenas o ícone, sem o rótulo de texto, mantendo a barra de ações mais limpa.

### Correções e Estabilidade
- **Formatos de Imagem de Ícones**: O ícone personalizado agora aceita imagens nos formatos PNG, JPEG e JPG (convertendo-as internamente no backend para PNG/ICO).
- **Visualização de Ícone nas Configurações**: Correção na política de segurança CSP do Tauri (liberação do protocolo `asset:`) permitindo exibir a prévia da imagem de ícone customizado corretamente nas configurações.
- **Filtro de Notificações**: Tradução do filtro de `"habits"` para `"Hábitos"` nas notificações.
- **Padronização de Relatórios de Texto**: Padronização ortográfica e estrutural dos relatórios exportáveis dos módulos de estudos, leitura, hábitos e flashcards (sem caixas altas ou recuos).
- **Captura de Tela de Feedback**: Correção de bug em que a captura de tela capturava o modal de feedback na frente e vazio devido à refatoração estrutural de modais.
- **Modais Unificados**: Conversão de modais avulsos para o componente global de acessibilidade `ModalShell` (Modais de Metas de Leitura, Resultados do Dicionário, Aviso de Tradução e Diálogo de Feedback).
- **Consistência nas Estatísticas**: Correção no cálculo de consistência do painel de estatísticas — a porcentagem agora considera apenas dias com registros efetivos, eliminando a exibição incorreta de 100% quando não há dados no mês.
- **Status de Estudos sem Registros**: O módulo de estudos agora exibe "Sem registros" quando não há sessões no período, em vez de um status incorreto como "Em recuperação".

---

> [!NOTE]
> O Aegis Prisma marca a chegada oficial do Módulo de Flashcards ao estado de produção, com backend Rust robusto (SQLite via `rusqlite`) e frontend React totalmente integrado ao Tauri v2.