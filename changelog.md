# Aegis v3.1.0

### Novidades

- **Módulo Simulados & Notas**: Registro simplificado de avaliações acadêmicas, simulados e atividades. Suporta múltiplas formas de média: simples, ponderada, por meta (acúmulo de pontos) e personalizado.
- **Gerenciamento de Matérias**: Nova aba dedicada no módulo de Estudos para gerenciar disciplinas. Permite criar grupos com cores personalizadas, renomear disciplinas e organizar as matérias de forma visual.
- **Sincronização e Múltiplas Matérias Ativas**: Novo sistema para favoritar múltiplas matérias ativas ao mesmo tempo, gerando relatórios de metas e painéis de atenção consolidados.
- **Seleção de Diretório de Dados no Login**: Possibilidade de escolher a pasta de leitura/gravação dos dados diretamente da tela de login, permitindo compartilhar o banco de dados entre sistemas operacionais de maneira simples.
- **Migração de Módulos para Headers**: Integração dos atalhos do Dicionário e do Pomodoro nos cabeçalhos dos módulos principais correspondentes e consequente limpeza da barra lateral (deixando Hábitos na categoria "Rotina & Bem-estar").
- **Importação/Exportação Centralizada**: Centralização das ações de importação e exportação de dados (CSV/JSON) de todos os módulos na aba **Dados** de configurações, deixando as headers dos módulos mais limpas.
- **Indicadores KBD nas Tooltips**: Visualização dos atalhos das ações globais e do menu de atalhos em blocos `<kbd>` estilizados.
- **Atalhos Rápidos**: Atalho `Alt+Shift+D` para o Dicionário e `Alt+F` para o formulário de feedback.
- **Ícone do Aplicativo**: Agora é possível definir um ícone personalizado para o Aegis nas configurações de aparência.
- **Guias como Abas nos Módulos**: Os guias de todos os módulos com navegação por abas (Estudos, Sono, Leitura, Filmes, Hábitos, Flashcards e Dicionário) foram migrados do formato modal para uma aba dedicada, tornando o conteúdo acessível sem interromper o fluxo de uso.
- **Botões de Guia Simplificados**: Nos módulos sem abas (Tarefas, Cofre, Anotações, Alarmes, Calendário, Pomodoro), o botão de guia agora exibe apenas o ícone, sem o rótulo de texto, mantendo a barra de ações mais limpa.

### Correções e Estabilidade

- **Animações de Acordeões Aninhados**: Correção de clipping e travamentos de animações do Framer Motion ao expandir accordions dentro de outros accordions na aba de Notas.
- **Detecção de Notas Divididas pela Metade**: Opção para marcar avaliações em que a nota deve ser dividida pela metade no cálculo das médias das matérias.
- **Comunicação Positiva de Rendimento**: Rótulo de status acadêmico atualizado de "Reprovado" para "Ainda não aprovado".
- **Padronização dos Botões de Voltar**: Remoção de botões redundantes e fixação do botão de retorno no canto superior esquerdo para manter a consistência da UI do Aegis.
- **Formatos de Imagem de Ícones**: O ícone personalizado agora aceita imagens nos formatos PNG, JPEG e JPG (convertendo-as internamente no backend para PNG/ICO).
- **Visualização de Ícone nas Configurações**: Correção na política de segurança CSP do Tauri (liberação do protocolo `asset:`) permitindo exibir a prévia da imagem de ícone customizado corretamente nas configurações.
- **Filtro de Notificações**: Tradução do filtro de `"habits"` para `"Hábitos"` nas notificações.
- **Padronização de Relatórios de Texto**: Padronização ortográfica e estrutural dos relatórios exportáveis dos módulos de estudos, leitura, hábitos e flashcards (sem caixas altas ou recuos).
- **Captura de Tela de Feedback**: Correção de bug em que a captura de tela capturava o modal de feedback na frente e vazio devido à refatoração estrutural de modais.
- **Modais Unificados**: Conversão de modais avulsos para o componente global de acessibilidade `ModalShell` (Modais de Metas de Leitura, Resultados do Dicionário, Aviso de Tradução e Diálogo de Feedback).
- **Consistência nas Estatísticas**: Correção no cálculo de consistência do painel de estatísticas — a porcentagem agora considera apenas dias com registros efetivos, eliminando a exibição incorreta de 100% quando não há dados no mês.
- **Status de Estudos sem Registros**: O módulo de estudos agora exibe "Sem registros" quando não há sessões no período, em vez de um status incorreto como "Em recuperação".