# Aegis

### Novidades
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