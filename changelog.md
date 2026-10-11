# Changelog - Aegis

Todas as alterações notáveis, correções e novidades do projeto são documentadas neste arquivo.

## [5.0.0 - Supernova]

### Novidades

- **Integração com Discord**:
  - **Status de Atividade em Tempo Real**: Exibição dinâmica das atividades no perfil do Discord com tempo regressivo ao vivo de sessões e intervalos do Pomodoro, cronômetro de tarefas ativas e módulo em uso, com controle de ativação na aba de Integrações.
- **Módulo de Pomodoro & Cronômetro**:
  - **Módulo Global no Menu Lateral**: Retorno do Pomodoro como módulo global de primeiro nível na barra de navegação, desvinculado da cabeçalho de estudos.
  - **Modo Cronômetro Integrado**: Nova aba dedicada para contagem progressiva de alta precisão com suporte a registro de voltas e laps.
  - **Vínculo com Tarefas em Tempo Real**: Associação de tarefas em andamento às sessões de foco e ao cronômetro, com exibição dinâmica e atualização contínua do tempo investido segundo a segundo, sem precisar recarregar ou trocar de aba.
  - **Preservação de Tempo em Ciclos Interrompidos**: Registro no histórico do tempo real trabalhado mesmo em sessões pausadas ou encerradas antes do ciclo completo, garantindo que nenhum minuto de concentração seja perdido.
- **Módulo de Flashcards**:
  - **Repetição Espaçada com Quatro Níveis de Avaliação**: Algoritmo inteligente com opções Errei, Difícil, Mediano e Fácil, atalhos de teclado de 1 a 4, tecla Espaço para virar cartões e cálculo da taxa de retenção da sessão.
  - **Novos Formatos de Cartão**: Suporte completo a cartões com omissão de palavras (onde você seleciona quais termos esconder), afirmações de Verdadeiro ou Falso com resposta rápida e Quiz de múltipla escolha com quatro alternativas.
- **Módulo de Cofre de Senhas**:
  - **Auditor de Segurança e Saúde do Cofre**: Avaliação automática com pontuação de saúde (0 a 100%) que identifica senhas curtas ou fracas, senhas repetidas entre contas e credenciais antigas sem alteração há mais de 90 dias, com botão direto para atualizar cada credencial.
- **Módulo de Hábitos & Metas de Longo Prazo**:
  - **Metas de Longo Prazo (`goals`)**: Nova aba dedicada para metas anuais, semestrais e trimestrais com cálculo dinâmico de percentual de conclusão e divisão em marcos acionáveis (*milestones*).
  - **Conexão Direta com Tarefas**: Possibilidade de criar e vincular marcos acionáveis a tarefas práticas do módulo de Tarefas, sincronizando o status de conclusão automaticamente.
  - **Limpeza da Rotina Diária & Padronização de Relatórios**: Remoção do mapa de calor da visualização dos hábitos diários (preservado exclusivamente na aba de relatórios) e padronização dos períodos de resumo de desempenho para 7D, 14D, 30D, 60D e 90D, alinhados aos demais módulos.
- **Módulo de Tarefas**:
  - **Ocultar Tarefas Concluídas & Timestamp**: Opção de alternar a visibilidade de tarefas concluídas no módulo de tarefas e salvamento automático do momento exato de conclusão (`completedAt`).
  - **Matriz de Eisenhower**: Visualização e organização de tarefas divididas em quatro quadrantes de prioridade e urgência.
  - **Tarefas Recorrentes**: Configuração de repetição automática diária, semanal ou mensal com reagendamento dinâmico de datas ao concluir.
- **Módulo de Filmes e Séries**:
  - **Data de Exibição & Recomendação de Reexibição**: Registro da data em que a obra foi assistida e marcador visual de obras que valem a pena ser reassistidas.
  - **Nova Aba "Vale a Pena Ver de Novo"**: Destaque automático para obras de alta avaliação ou marcadas para rever.
- **Módulo de Conquistas & Mascote**:
  - **Novo Display Estilo Console Retrô**: Redesign completo do habitat do mascote inspirado em molduras de arcades/consoles portáteis clássicos, com LED indicador animado, tela pixel-art com efeito CRT sutil, barra de status HUD e barra de XP estilo RPG, preservando com exatidão as proporções dos sprites.
  - **Estúdio de Customização Unificado**: Reorganização da aba do Mascote em duas colunas amplas com sub-abas organizadas (*Mascote*, *Auras*, *Cenários* e *Guia*), tornando a personalização ágil, fluida e compacta.
  - **Cenários de Fundo Personalizáveis**: Seleção e troca de cenários do habitat do mascote com desbloqueio gradual por nível do usuário e integração unificada com controle de período do dia (modo cíclico, dia, tarde e noite).
  - **Refinamento Visual dos Seletores & Desafios**: Indicador unificado de "Ativo" em pets, partículas e cenários, além de novo visual estilizado para o painel de desafios diários na Visão Geral.
  - **Salão de Troféus & Ranks**: Estrutura renovada com foco no Rank Global, medalhas por categoria e trilha de progresso dos próximos níveis.
- **Módulo de Hábitos**:
  - **Mapa de Calor de Consistência**: Gráfico anual em matriz de pontos para acompanhar a frequência diária e sequências de hábitos.
- **Módulo de Anotações**:
  - **Aprimoramento nos Cards de Notas**: Ajuste no layout dos cards para evitar corte de textos na altura, com altura mínima dinâmica e visualização fluida de linhas e prévias.
  - **Título Maior no Editor de Notas**: Campo de título do arquivo de nota com tipografia ampliada (`text-xl`), foco visual destacado em âmbar e digitação muito mais legível e confortável.
  - **Links Bidirecionais**: Criação de referências clicáveis entre notas para navegação rápida de ideias conectadas.
  - **Visualização em Grafo**: Mapa interativo de conexões com personalização de distância entre nós, espessura de linhas, tamanho e exibição de rótulos.
  - **Modo Foco Zen**: Interface de escrita limpa em tela cheia para concentração total.
  - **Criação de Flashcards**: Transformação de trechos e conceitos de notas diretamente em cartões de memorização.
  - **Modelos de Notas**: Criação acelerada de documentos a partir de estruturas prontas para reuniões, estudos e planejamento.
  - **Diário Pessoal em Formato de Livro**: Reestruturação do diário em páginas organizadas por semanas e dias, permitindo registrar e consultar memórias como um livro cronológico.
  - **Criptografia do Diário Pessoal**: Proteção criptográfica nas notas do diário para assegurar que o conteúdo não fique exposto em arquivos de texto no disco.
- **Painel Principal & Widgets**:
  - **Novo Widget de Mascote & Missões**: Widget dedicado na dashboard com habitat em miniatura do pet, exibição do sprite com cenário ativo, nível, barra de XP e lista de missões diárias com progresso e status em tempo real.
  - **Nome Personalizado do Mascote**: Exibição prioritária do apelido escolhido para o pet no widget, mantendo a espécie e o rank como informações complementares.
  - **Novo Layout dos Blocos do Painel**: Estrutura solta, dividida e arejada em todos os módulos, com eliminação de caixas aninhadas e leitura mais limpa.
- **Interface e Navegação**:
  - **Barra de Acesso e Status Inferior**: Acompanhamento de cronômetro ativo em tempo real, status de conexão e atalhos rápidos.
  - **Indicadores Dinâmicos de Navegação**: Transição fluida entre abas e rotas, contadores em tempo real na barra lateral e atalhos rápidos de pesquisa.
  - **Janelas e Diálogos de Confirmação**: Transição de abertura mais suave e confirmação de ações rápida pelo teclado.
  - **Autocompletação de Palavras com Tecla Tab**: Sugestão inteligente de termos enquanto você digita em campos de texto, integrando vocabulário pessoal de anotações e tarefas com palavras frequentes em português, preenchendo a palavra instantaneamente com a tecla Tab ou Seta Direita sem popups invasivos.

--- 

### Correções e Melhorias

- **Campos de Entrada e Sugestões do Navegador**: Desativação do histórico e preenchimento automático nativo do navegador/webview em todos os campos de texto, buscas e formulários, evitando sobreposição de valores anteriores.
- **Contraste Visual do Mascote**: Ajuste de iluminação e opacidade do cenário no widget para contraste equilibrado e legibilidade tanto no tema claro quanto no escuro.
- **Filmes e Séries em Destaque**: Refinamento na listagem de obras para rever, exibindo apenas títulos assistidos ou marcados com datas válidas.
- **Integração com Discord RPC**: Adicionada reconexão automática em segundo plano para restabelecer o status de atividade no perfil sempre que o Discord for aberto ou reiniciado.
- **Ajustes Visuais e de Usabilidade**: Remoção de sombras e refinamento do espaçamento de texto para uma interface mais limpa e consistente.
