# Changelog - Aegis

Todas as alterações notáveis, correções e novidades do projeto são documentadas neste arquivo.

## [4.1.0]


### Novidades

- **Global**:
  - **Reordenação das Abas de Módulos**: Aba "Relatórios" posicionada ao final do cabeçalho de cada módulo.

- **Módulo de Flashcards**:
  - **Baralhos Expandidos de 20 Cartões**: 12 baralhos completos com 20 cartões por assunto;
  - **Biblioteca de Templates Organizada por Categorias e Pastas**: Filtros por área do conhecimento no topo da aba de Templates (Todas, Biológicas, Exatas e Natureza, Idiomas e Linguagens, e Humanas e Sociedade);

--- 

### Correções e Melhorias

- **Módulo de Flashcards**:
  - **Tela de Conclusão da Revisão**: Correção no encerramento da revisão diária global e por baralho para manter a exibição da tela de resultado com estatísticas, precisão e registro sem retornar ao menu de configuração;
  - **Projeção de Retenção por Baralho**: Ajuste no gráfico e relatório de memória para calcular a retenção estimada por baralho e filtrar cartões ainda não estudados, destacando a lista de baralhos prioritários para revisão.

- **Painel Principal e Widgets**:
  - **Widget de Desempenho Semanal**:
    - Remoção de bordas e containers internos no estilo card para evitar acúmulo de cartões aninhados;
    - Exibição direta e limpa dos indicadores de consistência, eficiência e métricas de estudo.
  - **Painel de Notificações e Atualizador Automático**:
    - Correção no fluxo de atualização do aplicativo para evitar a reabertura contínua do aviso de instalação;
    - Bloqueio de verificações e downloads sobrepostos durante o progresso da atualização do software;
    - Identificação visual dos canais de versão do aplicativo (Estável, Hotfix, Beta, Alpha e Pré-release) com distintivos coloridos no painel de notificações;
    - Suporte a downgrade de versão, permitindo que usuários utilizando compilações de teste retornem para a versão estável com facilidade.
  - **Widget de Grade Horária**:
    - Separação clara entre "Aula de agora" (com progresso visual, tempo restante em minutos e indicador de aula ao vivo) e "Próxima aula";
    - Exibição de aulas em sequência e busca automática do próximo dia letivo nos finais de semana ou dias sem aulas agendadas;
    - Redirecionamento direto ao clicar no widget para a aba de Horários no módulo de Estudos;
    - Padronização de cores utilizando a paleta de temas do módulo de Estudos.
  - **Personalização do Painel Principal**:
    - Preservação e abertura automática na última aba acessada (Relógio, Cabeçalho, Estética ou Widgets) ao abrir o modal de personalização.
  - **Widget de Eventos e Prazos**:
    - Faixa de cor lateral destacada nos cards de eventos acompanhando a cor configurada no compromisso ou categoria;
    - Destaque nos marcadores de tempo restante (Hoje, Amanhã, Em X dias) e datas formatadas em negrito;
    - Padronização de cores utilizando a paleta de temas do módulo de Calendário.
  - **Configurações do Sistema**:
    - Exibição de informações detalhadas sobre a versão ativa (estágio, canal de lançamento e codinome) com distintivos visuais nas abas de Perfil e Sobre.
    
- **Mapa de Calor**:
  - **Leitura no Cabeçalho**: Exibição em tempo real das informações do dia no próprio cabeçalho do mapa de constância ao passar o cursor sobre qualquer quadradinho nos relatórios de Estudos, Flashcards e Hábitos;
  - **Navegação Suave e Sem Bloqueio**: Ajuste nos balões de dica para permitir a movimentação do cursor entre os dias sem travar a seleção do elemento abaixo;
  - **Ajuste de Fuso Horário nas Datas**: Correção no registro de datas para considerar o fuso horário local do dispositivo, garantindo que atividades realizadas no período noturno fiquem salvas no dia correto.
