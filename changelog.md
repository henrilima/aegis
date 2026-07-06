# Aegis

### Novidades

- **Módulo de Hábitos**: Implementação de novos painéis de relatórios gráficos, componente de visualização semanal e tabela de desempenho com taxas de conclusão individuais.
- **Módulo de Notas**: Introdução de paleta de cores personalizada, salvamento automático contínuo com feedback dinâmico no cabeçalho e simplificação do fluxo de salvamento.

### Ajustes e Estabilidade

- **Módulo de Notas**: Correção na navegação por setas do teclado (subir/descer) no menu `/`, correção do comportamento de abertura ao digitar URLs ou caminhos de arquivos, ajuste de alturas iguais para notas e pastas, suporte a fixação de pastas antes das notas fixadas em ordem alfabética e correção da abertura acidental ao clicar nos três pontinhos.
- **Módulo de Hábitos**: Correção na Taxa de Foco do relatório de desempenho para avaliar todo o período selecionado de acordo com a data simulada da aplicação, e atualização do widget de hábitos no dashboard para ler streaks do back-end, filtrar arquivados/não agendados e permitir concluir tarefas.
- **Ajustes do Sistema**: Tratamento de exceções e maior resiliência em chamadas de APIs nativas do Tauri ao executar a aplicação em navegadores convencionais, redução de logs extensos de erros de rede no GlobalScheduler, implementação de botões de fechamento imediato (topo e continuação) no modal de subir de nível ("Level Up"), otimização drástica de E/S do SQLite no loop em segundo plano (caching em memória do time offset e dos estados ativos do Pomodoro) para resolver travamentos e lentidões no Linux, e remoção de transição indesejada de layout (padding/spacing animado) ao carregar/entrar no Dashboard.