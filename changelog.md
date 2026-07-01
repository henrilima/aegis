# Aegis v3.4.0

### Novidades

- **Mascote Aegis (Companion System)**: Introdução de mascotes virtuais interativos (Pets) com nome personalizável e balão de fala reativo com frases personalizadas por estado.
- **Animações Dinâmicas dos Pets**: Estados visuais animados de Idle, Walk, Attack e Death com efeito de fundo parallax no painel.
- **XP de Pet e Desafios Diários**: Novo sistema de progressão independente de nível para o pet, alimentado exclusivamente pela conclusão de Desafios Diários.
- **Sistema de Auditoria de XP (Ledger)**: Implementação de um Ledger seguro no banco de dados para todas as transações de XP, dividindo o progresso em XP Global e XP de Pet.
- **Capa Personalizada da Dashboard**: Suporte a imagens de capa customizadas no cabeçalho do Dashboard, com ajustes finos de escala, zoom, saturação, blur e eixos X/Y.
- **Animação Global de Level Up**: Sistema de comemoração disparado em tempo real em qualquer tela do aplicativo ao subir de nível.
- **Títulos de Perfil e Ranks de Avatar**: Desbloqueio e exibição de títulos honoríficos e bordas de rank dinâmicas ao redor do avatar do usuário e na barra lateral.
- **Reorganização do Trophy Hall**: Novo layout com medalhas agrupadas por categorias em cards padronizados posicionados abaixo do card de rank.
- **Histórico de XP com Cores e Alinhamento**: Tags de histórico de XP estilizadas com cores exclusivas e largura fixa (76px) para evitar desalinhamento da UI: esmeralda ("XP de Pet"), âmbar ("Conquista") e ciano ("XP Global").
- **Atalho do Modal de Novidades**: Atalho global `Ctrl + Shift + D` para abrir manualmente o painel com as informações de lançamento.
- **Novo Modal de Personalização**: Painel de gerenciamento, ordenação e visualização de widgets ativos no Dashboard totalmente reformulado.

### Ajustes e Estabilidade

- **Modais de Metas Padronizados**: Conversão e normalização dos modais de metas (Estudos, Sono, Leitura) para o wrapper `ModalShell`, aplicando a cor de fundo contrastante e cabeçalho/rodapé distintos.
- **Eliminação de Cards Aninhados**: Remoção de card interno duplicado na aba de Metas de Estudos, deixando os inputs de formulário limpos e alinhados.
- **Alinhamento do Trophy Hall**: Ajuste de altura do card de estatísticas gerais para se igualar à soma dos cards de rank e medalhas.
- **Estilização da Barra Lateral**: Visual na barra lateral com novas cores de destaque e ajuste de bordas.
- **Refatoração dos Canvas de Relatório**: Globalização e unificação do mapeamento de cores dos canvas de compartilhamento de relatórios (Flashcards, Hábitos, Leitura), eliminando redundâncias.
- **Tipagem de Configurações Globais**: Correção de tipagem em chamadas Tauri com `AppConfig` no gerenciador de módulos, eliminando avisos de linter.
- **Organização de Comentários**: Higienização geral de comentários obsoletos.