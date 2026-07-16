# Aegis

### Novidades
- **Dashboard — Capa em Vídeo MP4/WebM**: Suporte a vídeos animados locais no formato MP4 ou WebM como capa da dashboard, copiados automaticamente para o diretório local do app.
  - Implementação de um Callback Ref dinâmico para inicialização e limpeza;
  - Otimização com `IntersectionObserver` que pausa a reprodução do vídeo quando a capa está fora do viewport (scroll);
  - Otimização com `Document Visibility API` que pausa o vídeo se o aplicativo perder foco ou for minimizado, reduzindo o consumo de CPU/GPU a zero em segundo plano;
  - Substituição da seleção de arquivos baseada em Base64 por diálogo nativo de sistema via Tauri Dialog.
- **Regras de Automação entre Módulos**: Nova aba de automações no menu de configurações que permite interligar os módulos do aplicativo sem código.
  - Gatilhos suportados: Sessão de estudos registrada, registro de sono diário, ciclos de Pomodoro finalizados e tarefas concluídas hoje;
  - Operadores lógicos suportados: Maior que (`>`), maior ou igual (`>=`), menor que (`<`), menor ou igual (`<=`) e igual (`=`);
  - Ações suportadas: Marcar um hábito específico como feito automaticamente e criar tarefas de apoio (ex: descanso);
  - Prevenção nativa contra execuções duplicadas no mesmo dia;
  - Interface visual baseada em sentence-builder estruturado e com seletores Radix/Shadcn premium;
  - Envio de notificações in-app instantâneas a cada disparo automático bem-sucedido;
  - Integração total com o sistema de backup local e exportação/importação raw JSON.
- **Módulo de Sono — Aba de Sonolência**: Nova aba que analisa os padrões históricos de sono e estima as janelas de energia e sonolência ao longo do dia com base no ritmo circadiano individual do usuário.
  - Calcula médias de horário de acordar, deitar e duração dos últimos 14 registros;
  - Exibe 4 janelas do ciclo diário: pico matinal, vale circadiano, pico vespertino e pressão de sono pré-dormir;
  - Linha do tempo visual de 24h com marcador da hora atual e janelas coloridas;
  - Banner contextual indicando se o usuário está em um momento de alerta ou de baixa energia agora.
- **Módulo de Sono — Débito Semanal no Widget**: O widget de sono na dashboard agora exibe um alerta de débito acumulado quando o usuário dormiu menos do que a meta em mais de 1h na semana.
- **Módulo de Flashcards — Widget de Estatísticas**: Novo widget na dashboard apresentando o status atual dos estudos de memorização ativa.
  - Exibição de cartões pendentes para revisão no dia;
  - Exibição da quantidade total de cartões cadastrados;
  - Taxa de acerto global obtida a partir das revisões anteriores;
  - Lista rápida com os baralhos que possuem revisões pendentes.
- **Módulo de Flashcards — Curva de Esquecimento Visual**: Gráfico de projeção baseado na Curva de Esquecimento de Ebbinghaus adicionado à aba de relatórios.
  - Projeção visual da retenção de memória média para os próximos 7 dias se nenhuma revisão for feita;
  - Lista de cartões urgentes recomendados para revisão com prioridade e níveis de retenção individual;
  - Gráfico em SVG minimalista, 100% flat e responsivo.
- **Módulo de Flashcards — Seletor de Ícones Global (`IconSelect`)**: Criação de um seletor dinâmico de ícones reutilizável com barra de busca por texto e suporte a mais de 85 ícones do Lucide.
  - O ícone selecionado brilha com a cor do tema configurado para o baralho;
  - O ícone escolhido é renderizado no card de visualização como marca d'água no canto inferior direito;
  - A seleção de ícones é persistida em banco de dados SQLite via backend em Rust.
- **Módulo Pomodoro — Widget Flutuante**: Possibilidade de destacar o temporizador Pomodoro em uma janela secundária nativa.
  - Janela flutuante sempre no topo (`always-on-top`) e redimensionável livremente;
  - Exibe contagem regressiva, tipo de ciclo ativo ("Foco" ou "Pausa") e controles de Iniciar, Pausar e Parar;
  - Sincronização em tempo real de estado do cronômetro entre as janelas do sistema via eventos Tauri.

### Ajustes e Estabilidade
- **Módulo de Sono — Calculadora**: Simplificação visual da aba de Calculadora de Ciclos removendo ícones decorativos desnecessários e eliminando o padrão de card dentro de card nas dicas de higiene do sono.
- **Módulo de Flashcards — Ajustes de Design**: Redesenho do card de baralho para adotar um estilo flat sólido (`bg-card` e hover de borda discreto), evitando vazamentos visuais do dropdown de ações.
- **Unificação de Cores em Relatórios Globais**: Atualização dos módulos de relatórios (Flashcards e Leitura) para adotarem estritamente as cores oficiais de seus respectivos módulos em todo o painel visual, textual e seletores de abas de período, eliminando as antigas variações e inconsistências.