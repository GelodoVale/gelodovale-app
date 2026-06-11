# 📜 Histórico de Atualizações do Sistema (GelControl)

Este arquivo é o registro oficial de todas as alterações feitas no código pelo **Antigravity**. Ele permite que o assistente faça varreduras instantâneas e saiba exatamente o estado do sistema a qualquer momento.

---

### 🚀 Últimas Alterações Realizadas

#### v55 (11/06/2026 - Antigravity)
* **Correção de Codificação de Caracteres (COD: ACE-01):**
  - **Arquivo `index.html`:** Corrigido problema de codificação double-UTF8 no painel de Acerto de Carga (COD: ACE-01), alterando "OdÃ´metro" para "Odômetro" com a acentuação correta e limpa nas labels e cabeçalhos de KM inicial e final.
  - **Verificação Geral:** Escaneado o projeto em busca de outras anomalias de codificação semelhantes, confirmando que a ocorrência estava isolada a essa seção.
  - **Bumped build** para `v55` e cache SW `gelodovale-v148`.

#### v54 (11/06/2026 - Antigravity)
* **Correção no Layout dos Cards de Clientes (COD: CLI-02):**
  - **Módulo `js/clientes.js`:** Corrigido desalinhamento crítico na exibição dos cards de clientes. Resolvido o fechamento precoce da tag `div` de `.client-card` que ocorria logo após o cabeçalho, o que fazia com que o conteúdo do card (dados do freezer, estoque, contatos e botões) ficasse órfão de layout e desalinhado, quebrando o grid de clientes.
  - **Organização do Cabeçalho:** Estruturado o painel `.client-name-details` em uma coluna flexível que agrupa o nome, nome fantasia, código do freezer e badges de atividade/documento de forma limpa.
  - **Bumped build** para `v54` e cache SW `gelodovale-v147`.

#### v53 (11/06/2026 - Antigravity)
* **Central de WhatsApp & Formulário Público do Cliente (COD: WA-01):**
  - **Módulo `js/whatsapp.js`:** Criado central com 10 templates customizáveis e suporte a placeholders dinâmicos (Nome, Valor, Link, etc.) com geração de links encriptados Base64.
  - **Formulário Público (`form.html`):** Criada página autônoma responsiva com captura GPS, busca rápida de CEP por API e compressão automática de fotos de fachada/documento antes do envio ao Firebase.
  - **Preferência do Cliente:** Adicionado toggle "🚫 Bloquear WhatsApp Automático" no cadastro do cliente com ícone indicador no card do cliente.
  - **Aprovação Admin:** Adicionado aba "Central do WhatsApp" nas configurações para rever cadastros preenchidos por clientes e aprovar diretamente no sistema, limpando do Firebase ao salvar.
  - **Sininho & Botões Rápidos:** Notificação automática ao receber cadastros públicos com navegação direta para a aba de aprovação. Botões de "Enviar WA" inline adicionados às notificações de estoque, aniversários e dívidas.
  - Bumped build para v53 e cache SW gelodovale-v146.

#### v52 (11/06/2026 - Antigravity)
* **Central de Notificações Expandida — 9 Tipos de Alertas (COD: NOTIF-01):**
  - Expandido o módulo js/notifications.js com 6 novos tipos de alerta: Aluguel Atrasado, Divida em Aberto/Alta, Comodato Pendente, Aniversario Hoje, Recibo Nao Pago e Insumo Baixo/Zerado.
  - Adicionado campo label em cada notificacao para exibir a categoria no canto da notificacao.
  - Bumped build para v52 e cache SW gelodovale-v145.

#### v51 (11/06/2026 - Antigravity)
* **Correcao Definitiva do Sininho - onclick Direto no HTML (COD: NOTIF-01):**
  - Substituido addEventListener por onclick direto no elemento do HTML, eliminando perda de listener por re-renderizacoes.
  - Exposta window.toggleNotificationsPopover() para uso via onclick inline.
  - Deduplicacao do listener de fechar ao clicar fora com flag window._notifClickOutsideAdded.
  - Bumped build para v51 e cache SW gelodovale-v144.

#### v50 (11/06/2026 - Antigravity)
* **Widget de Clima com Fallback Offline e Reconexao Automatica (COD: WID-02):**
  - Funcao renderWeatherFromCache(): exibe dados salvos com badge aviso quando API falha.
  - Botao Tentar novamente quando nao ha cache algum.
  - Reconexao automatica em background a cada 30 segundos apos falha de rede.
  - Bumped build para v50 e cache SW gelodovale-v143.

#### v49 (11/06/2026 - Antigravity)
* **Correcao do Popover do Sininho - Display Invisivel e Toggle Quebrado (COD: NOTIF-01):**
  - Corrigido bug onde display:none seguido de display:flex no mesmo style fazia popover aparecer automaticamente ao entrar.
  - Corrigido toggle que comparava === none mas valor era flex, nunca abrindo o popover.
  - Bumped build para v49 e cache SW gelodovale-v142.
#### v48 (11/06/2026 - Antigravity)
* **Central de Notificações Dinâmicas (Sininho de Alertas - COD: NOTIF-01):**
  - Criado o novo módulo `js/notifications.js` que consolida alertas operacionais de estoque baixo, clientes inativos (risco de churn) e pedidos pendentes de entrega em um único feed de atualizações.
  - Adicionado o botão de sininho (`#btn-notifications`) no cabeçalho superior (`index.html`) com um badge vermelho que indica a quantidade de notificações e alertas ativos.
  - Implementado o popover de notificações interativas: clicar em qualquer notificação redireciona automaticamente o usuário para a aba correspondente e filtra/pesquisa o cliente em foco no campo de busca para ação imediata.
  - Adicionado suporte offline no Service Worker (`sw.js`) para cachear o módulo `js/notifications.js` e bumped build do sistema para `v48` com cache `gelodovale-v141`.

#### v47 (11/06/2026 - Antigravity)
* **Correção do Layout de Atalhos Rápidos (COD: DASH-00):**
  - Corrigido o bug visual no painel de atalhos rápidos (`#dashboard-quick-actions-panel`) onde os botões ocupavam uma linha inteira cada e ficavam esticados verticalmente. O problema ocorria quando o painel era redimensionado ou possuía configurações de layout salvas, fazendo o gerenciador de layout (`js/layout.js`) envolvê-los em um contêiner `.panel-content-scrollable` que aplica `flex-direction: column !important`.
  - Excluído o painel de atalhos rápidos da lógica de empacotamento flex no gerenciador de layout (`js/layout.js`), impedindo a criação do contêiner flex vertical.
  - Customizados os estilos do painel de atalhos e seus botões em `styles.css` para garantir um layout horizontal (`flex-direction: row !important`, `flex-wrap: wrap !important`), alinhamento flexível e tamanho compacto dos botões (`width: auto`, `padding: 6px 12px`).
  - Bumped build do sistema para `v47` e cache do Service Worker para `gelodovale-v140`.

#### v46 (11/06/2026 - Antigravity)
* **Busca por Endereço e Ordenação Completa na Gestão de Comodatos (COD: COM-02):**
  - Implementada a ordenação dinâmica na tabela da Gestão de Comodatos (`js/comodatos.js`). O usuário agora pode ordenar comodatos por Nome, Data de Início, Data de Retorno, Endereço/Local, Código do Freezer ou Status, em ordem Crescente (▲) ou Decrescente (▼).
  - Adicionadas opções no HTML da barra de ações/filtros (`index.html`) para selecionar a coluna de ordenação (`comodato-sort-key`) e o sentido (`comodato-sort-order`).
  - Adicionado suporte para busca por Endereço/Local do cliente no campo de pesquisa de comodatos.
  - Corrigido bug de layout na tabela de comodatos (ajustado `colspan` da mensagem de resultado vazio de 7 para 8 colunas).
  - Bumped build do sistema para `v46` e cache do Service Worker para `gelodovale-v139`.

#### v45 (11/06/2026 - Antigravity)
* **Clima em Cache na Tela de Login (COD: WID-02):**
  - Ajustada a inicialização do clima pré-login em `initWeatherLogic()` (`js/widgets.js`) para usar a cidade em cache (ex: Registro - SP) salva anteriormente no estado, em vez de redefinir temporariamente para São José dos Campos.
  - Isso garante consistência visual imediata na tela de login e previne loops de geolocalização desnecessários.
  - Bumped build do sistema para `v45` e cache do Service Worker para `gelodovale-v138`.

#### v44 (11/06/2026 - Antigravity)
* **IP-Geolocalização Ativa pós-Login e Fallback Manual do Clima (COD: WID-02):**
  - Adicionado gatilho imediato de atualização de clima pós-autenticação em `loginUser()` (`js/auth.js`): assim que o usuário faz login, a API de Clima tenta autodetectar a cidade dele silenciosamente por IP, sem esperar por recarregamento de página.
  - Implementado o fallback de IP no botão manual "Detectar Local" em `detectUserLocation()` (`js/utils.js`): se o usuário clicar no botão e a permissão do GPS do navegador falhar ou for bloqueada (comum em `file:///`), o sistema tenta autodetectar a localização por IP em segundo plano, evitando travamentos e exibindo um toast informativo de sucesso via IP.
  - Bumped build do sistema para `v44` e cache do Service Worker para `gelodovale-v137`.

#### v43 (11/06/2026 - Antigravity)
* **Prevenção de loop de São José dos Campos e Geolocalização por IP Silenciosa (COD: WID-02):**
  - Implementado fallback inteligente para o endpoint de geolocalização reversa por IP do **BigDataCloud** (sem passar parâmetros de latitude/longitude) quando o GPS do navegador nega/falha na inicialização do clima (`js/widgets.js`).
  - Isso remove o loop em que o erro de geolocalização no protocolo `file:///` forçava as coordenadas padrão de São José dos Campos no estado local, travando o widget de clima e forçando prompts repetitivos a cada carregamento de página. Com o salvamento das coordenadas reais obtidas por IP (ex: Registro - SP), reloads subsequentes usam o cache sem novos prompts.
  - Adicionado controle `saveToState` em `fetchWeatherData()` para garantir que a tela de login (pré-login) exiba apenas placeholders sem persistir coordenadas padrão no estado.
  - Bumped build do sistema para `v43` e cache do Service Worker para `gelodovale-v136`.

#### v42 (11/06/2026 - Antigravity)
* **Resolução Forçada de Cidades Travadas em "Auto (GPS)" (COD: WID-02):**
  - Implementado o geocódigo reverso corretivo automático em `updateWeatherFromAPI()`: se o estado local possui coordenadas de latitude/longitude válidas salvas, mas o nome do local está travado como `"Auto (GPS)"` ou `"Local Detectado"`, o sistema agora realiza uma chamada automática em segundo plano para o **BigDataCloud API** para resolver o nome correto (ex: `"Registro - SP"`) e atualiza o estado local e o Firebase.
  - Isso corrige o cenário onde usuários com coordenadas válidas em cache continuavam visualizando `"Auto (GPS)"` permanentemente na lateral devido a dados legados no estado local ou remoto.
  - Bumped build do sistema para `v42` e cache do Service Worker para `gelodovale-v135`.

#### v41 (11/06/2026 - Antigravity)
* **Prevenção de Prompts Repetitivos de Localização (Login Screen Guard) e Geolocalização Reversa Confiável (COD: WID-02):**
  - Substituído o serviço de geolocalização reversa Nominatim (OpenStreetMap) pela API gratuita do **BigDataCloud**, resolvendo o problema de requisições bloqueadas com status `403 Forbidden` quando o app é executado sob o protocolo local `file:///` no Chrome. A localização agora resolve corretamente para `"Registro - SP"` em vez de ficar travada como `"Auto (GPS)"`.
  - Adicionada uma trava na inicialização automática do clima: o sistema bloqueia solicitações de GPS (`getCurrentPosition`) se o usuário ainda não estiver logado (evitando o popup de permissão incômodo na tela de login).
  - Atualizada a gravação de clima para usar `saveState()` (sincronizando coordenadas no Firebase), garantindo que todos os dispositivos conectados à mesma conta herdem as coordenadas e evitem prompts repetitivos.
  - Bumped build do sistema para `v41` e cache do Service Worker para `gelodovale-v134`.

#### v39 (11/06/2026 - Antigravity)
* **Múltiplos Emojis/Ícones nos Produtos & Emojis de Hortelã/Ervas (COD: CAT-04):**
  - Implementada a seleção acumulativa de múltiplos emojis para os produtos (ex: "🧊🍍🌿" para gelo saborizado de abacaxi com hortelã). Ao selecionar emojis no seletor, o sistema agora os concatena no campo de ícone em vez de sobrescrever. Imagens/Base64 continuam com comportamento de substituição padrão.
  - A janela do seletor de emojis permanece aberta durante a seleção de emojis para permitir múltiplas seleções sequenciais, adicionando um botão "Concluído" nas ações do modal para fechá-lo quando terminar.
  - Adicionados novos emojis rápidos de ervas e folhas ("🌿", "🌱", "🍃") no grupo de Frutas/Sabores/Doces do seletor e indexados no dicionário de busca com termos como "hortela", "hortelã", "menta" e "erva".
  - Bumped build do sistema para `v39` e cache do Service Worker para `gelodovale-v132`.

#### v38 (11/06/2026 - Antigravity)
* **Correção da Tabela Vazia de Catálogo (COD: CAT-03):**
  - Corrigido o bug visual "sumiu tudo" em que a tabela do "Catálogo de Itens" aparecia em branco após recarregar a página. O problema ocorria porque a função `renderProductsCatalog()` era executada apenas no salvamento ou exclusão de um produto, mas não ao inicializar a aba de configurações ou ao alternar para a sub-aba de catálogo.
  - Adicionada a chamada automática de `renderProductsCatalog()` ao carregar a aba de configurações (`renderPrecos()`) e ao selecionar a sub-aba do Catálogo (`switchAdminSubTab('tab-catalogo')`).
  - Bumped build do sistema para `v38` e cache do Service Worker para `gelodovale-v131`.

#### v37 (11/06/2026 - Antigravity)
* **Exclusão Definitiva de Itens no Catálogo (COD: CAT-02):**
  - Implementada a exclusão permanente de produtos em duas etapas. Se o item estiver ativo, clicar na lixeira o inativa (mantendo o histórico comercial e ocultando-o do PDV). Se o item já estiver inativo, clicar na lixeira novamente exibe a opção de excluí-lo definitivamente do banco de dados de forma irreversível.
  - Bumped build para `v37` e Service Worker cache para `gelodovale-v130`.

#### v36 (11/06/2026 - Antigravity)
* **Ampliação de Emojis, Ícones e Filtro Inteligente (COD: FAB-05):**
  - Expandido o catálogo de emojis rápidos disponíveis no modal de seleção, agrupando-os em 6 categorias completas (Gelo/Fábrica, Frutas/Doces, Bebidas/Copos, Negócios/Financeiro, Clientes/Entrega e Símbolos/Extras).
  - Implementado o mapeamento inteligente de palavras-chave (`EMOJI_KEYWORDS`) para todos os novos emojis, permitindo que a pesquisa por termos em português (ex: "melancia", "dinheiro", "moto", "entrega", "limao") filtre instantaneamente os símbolos correspondentes.
  - Bumped build para `v36` e Service Worker cache para `gelodovale-v129`.

#### v35 (11/06/2026 - Antigravity)
* **Correção da Seleção Vazia de Usuários no Login (COD: AUTH-01):**
  - Garantido que a função `initUserAccessControl()` seja chamada em `renderApp()` antes de construir a tela de login (`initLoginScreen()`). Isso previne que a lista de usuários no menu suspenso fique em branco em novos acessos ou após re-sincronizações do Firebase.
  - Adicionada a mesma garantia ao importar backups via `applyBackupData()`, impedindo que backups inconsistentes apaguem o usuário administrador do estado ativo.
  - Bumped build para `v35` e Service Worker cache para `gelodovale-v128`.

#### v34 (11/06/2026 - Antigravity)
* **Sincronização Automática em Tempo Real (Firebase Auto-Sync) (COD: SYNC-01):**
  - Ativado o Firebase Realtime Database por padrão (`enabled: true`) para todos os dispositivos. Antes estava desativado por padrão, bloqueando todo o sistema de sync já implementado.
  - Adicionada migração automática: dispositivos existentes que tinham `enabled: false` com as credenciais preenchidas são automaticamente ativados na próxima abertura (sem perda de dados).
  - Adicionada flag `_manuallyDisabled` para preservar a preferência do usuário que optar por desativar manualmente o sync pelo painel de configurações.
  - Qualquer alteração de dados (clientes, pedidos, vendas PDV, backups, pontos de restauração) agora sincroniza automaticamente para a nuvem em tempo real. Todos os dispositivos conectados recebem a atualização em 1-2 segundos.
* **Auto-Push de Código para GitHub Pages (COD: DEV-01):**
  - Criado o hook Git `post-commit` que executa `git push origin main` automaticamente após cada commit do Antigravity, eliminando a necessidade de rodar o `atualizar_github.bat` manualmente.
  - Com isso, o site online (GitHub Pages) atualiza automaticamente sempre que o Antigravity faz alguma alteração no código.
* Bumped cache para `gelodovale-v127` e build para `v34`.


* **Alinhamento do Cabeçalho Superior e Suporte de Resizing Lateral (COD: Layout):**
  - Otimizado o cabeçalho superior (`.top-header` e `.header-actions`) no `styles.css` para utilizar `flex-wrap: nowrap` no contêiner principal e truncamento inteligente (`ellipsis`) nos textos longos como `"Frente de Caixa (PDV Balcão)"`, impedindo desalinhamento visual e quebras de linha bagunçadas em telas desktop.
  - Adicionado `flex-wrap: wrap` e gap otimizado para `0.5rem` nos botões da barra de ações, permitindo que os botões se organizem perfeitamente sem deformar o título.
  - Implementada a validação e reset automático de versão de layout no método `applyBackupData` em `js/admin.js`. Isso garante que restaurar backups de versões de layout antigas (< 5) limpe automaticamente as coordenadas e reposicione os painéis do PDV (`COD: PDV-01` e `COD: PDV-02`) em modo grade fixo, prevenindo que eles fiquem sobrepostos ou fora de foco.
  - Resolvido o problema de carregamento de estilos antigos definindo a importação como `styles.css?v=33` no `index.html` e limpando cache no PWA com `gelodovale-v126` em `sw.js`.

#### v32 (11/06/2026 - Antigravity)
* **Prevenção de Desalinhamento de Layout e Recuperação de Painéis (COD: PDV-02):**
  - Implementado reset automático na inicialização do Gerenciador de Layout (`js/layout.js`) caso o usuário tenha um layout com versão desatualizada (menor que `5`).
  - Isso corrige o problema onde a remoção do cabeçalho redundante do PDV (que fez o conteúdo da aba subir verticalmente) deslocava o painel do Carrinho de Compras (`COD: PDV-02`) para fora da área visível do topo da tela devido a coordenadas de translate salvas no localStorage.
  - Atualizada a versão de cache do Service Worker para `gelodovale-v124` e o build do sistema para `v32`.

#### v31 (11/06/2026 - Antigravity)
* **Correção do Painel de Configurações de Backup e Versão (COD: SEG-04):**
  - Corrigido o erro estrutural de fechamento de tags no `index.html` na seção de backup, onde a abertura do painel de Pontos de Restauração (`COD: SEG-05`) havia sido incorretamente injetada dentro do formulário e cortado o botão de importar JSON e a tag de envio.
  - Reintegrados os botões "Importar Backup (JSON)" e "Salvar Configurações" com suas respectivas tags e submissão do formulário (`backup-settings-form`) restauradas.
  - Corrigido o bug onde a digitação de novas versões de dados (ex: mudando de 0.9 para 1.0) não persistia no estado da aplicação por ausência do botão e ação de salvar o formulário.
  - Atualizada a versão de cache do Service Worker para `gelodovale-v123` e o build do sistema para `v31`.

#### v30 (11/06/2026 - Antigravity)
* **Unificação do Cabeçalho e Limpeza Visual da Aba PDV (Frente de Caixa):**
  - Removido o cabeçalho interno redundante e duplicado (`<h2>` e `<p>`) na seção Frente de Caixa (`#pdv` no `index.html`).
  - Alinhada a aba de PDV com a arquitetura limpa de outras telas do sistema (como Histórico de Entregas), deixando que apenas a barra superior global (`.top-header`) gerencie e exiba o título no canto superior esquerdo e a barra de ações no canto superior direito de forma fixada e sem quebras de linha indesejadas.
  - Atualizada a versão de cache do Service Worker para `gelodovale-v122` e o build do sistema para `v30`.

#### v29 (11/06/2026 - Antigravity)
* **Ajuste de Redimensionamento Horizontal dos Painéis do PDV (COD: PDV-01):**
  - Adicionado suporte completo para redimensionamento horizontal lateral dos painéis em modo Grade (`grid`) e Janelas Flutuantes (`floating`) no Gerenciador de Layout (`js/layout.js` e `styles.css`).
  - Corrigido o conflito onde a propriedade padrão `align-items: stretch` do flexbox pai e `max-width: 100%` nos painéis anulavam a largura inline configurada pelo usuário ao tentar esticar lateralmente.
  - Implementado o ajuste dinâmico com `align-self: flex-start !important` e `max-width: none !important` no CSS para painéis com largura modificada em tempo real, garantindo que o catálogo de produtos (`COD: PDV-01`) possa se expandir em múltiplas colunas responsivas (`repeat(auto-fill, minmax(130px, 1fr))`).
  - Atualizada a versão de cache do Service Worker para `gelodovale-v121` e o build do sistema para `v29`.

#### v28 (11/06/2026 - Antigravity)
* **Galeria de Ícones & Emojis e Abas Customizadas (Admin Only) (COD: FAB-04):**
  - Implementada a **Biblioteca de Ícones Global** na aba Configurações de Fábrica & Aparência, permitindo o upload de fotos locais e gerenciamento em lote.
  - Desenvolvido o modal reutilizável **Seletor de Ícones e Emojis** para produtos e abas de menu, com pesquisa instantânea e filtros por categorias (Frutas, Bebidas, Objetos, Gelo).
  - Unificada a renderização visual do catálogo no PDV e das listagens administrativas para suportar ícones e imagens Base64 dinâmicas através da função `getProductEmoji`.
  - Adicionada a customização dos ícones das abas laterais da sidebar de navegação com salvamento offline persistente no estado global do GelControl.
  - Atualizada a versão do PWA para `v28` (cache `gelodovale-v120` e arquivos `?v=28`).

#### v27 (11/06/2026 - Antigravity)
* **Pontos de Restauração Nomeados e Diário de Bordo Dinâmico (COD: SEG-05/SEG-07):**
  - Implementado o sistema de **Pontos de Restauração** (Navegador) permitindo que o usuário dê nomes/descrições personalizadas (ex: "Antes de reajustar preços") ao invés de usar datas/códigos crus.
  - Criada a funcionalidade do **Diário de Bordo Dinâmico** (`loadSystemChangelog` em `js/admin.js`) que lê o arquivo markdown `HISTORICO_MUDANCAS.md` diretamente e o renderiza em HTML estruturado com listas e negrito na tela do app, centralizando o controle de versão e mantendo o histórico sempre sincronizado.
  - Atualizada a versão do PWA para `v27` (cache `gelodovale-v119` e arquivos `?v=27`).

#### v26 (11/06/2026 - Antigravity)
* **Customização Visual e Ajustes do Logotipo da Fábrica (COD: FAB-01/FAB-02):**
  - Adicionados controles deslizantes (sliders) e seletores de cor no painel de Aparência (`COD: FAB-02`) para permitir o ajuste visual completo do logotipo da fábrica.
  - Implementada a pré-visualização em tempo real (live preview) para os ajustes de: Fundo Transparente, Cor de Fundo do Logo, Largura Máxima (30% a 100%), Altura Máxima (20px a 150px), Espaçamento Interno (Padding, 0px a 40px) e Arredondamento (Border Radius, 0px a 30px).
  - Configurada a persistência dessas preferências visuais em `state.appearance.logoSettings`, aplicando as mesmas dinamicamente no menu lateral esquerdo e na caixa do logotipo da tela de login.
  - Atualizada a versão do PWA para `v26` (cache `gelodovale-v118` e arquivos `?v=26`).

#### v25 (10/06/2026 - Antigravity)
* **Correção de Abas Administrativas Ocultas:**
  * Corrigida a tag `</div>` de fechamento ausente no container `dashboard-row` da aba de **Segurança & Backup** no arquivo `index.html`. 
  * Este erro fazia com que as sub-abas seguintes ("Gerenciar Usuários & Senhas" e "Integrações") fossem incorretamente aninhadas dentro da seção de segurança, fazendo com que ficassem ocultas (tela preta/vazia) ao alternar de aba no menu.
  * Atualizada a versão de cache do Service Worker para `gelodovale-v117` e o parâmetro de cache-busting em scripts do `index.html` para `?v=25`.

#### v24 (05/06/2026 - Antigravity)
* **Defensiva de JavaScript e Null-Safety em Configurações:**
  * Adicionada verificação de nulos (`null-safety`) em todas as atribuições diretas de `.value = ...` da função `renderPrecos()` em `js/admin.js` para campos comerciais (como nome, CNPJ, telefone, etc.) que podiam não existir em certas renderizações.
  * Envelopamento com `try-catch` e proteções na função `switchAdminSubTab()` para garantir que erros em renderizações secundárias não travem o script global do painel.
  * Atualizada a versão do PWA para `v24` (cache `gelodovale-v116` e script `?v=24`).

#### v23 (05/06/2026 - Antigravity)
* **Exclusão de Sub-abas Administrativas do Layout Manager:**
  * Corrigida a falha na função `getActivePanels()` no gerenciador de layout (`js/layout.js`). Sub-abas administrativas que consistem de formulários e configurações (como `tab-usuarios`, `tab-integracoes`, `tab-dados-fabrica`, `tab-impressao`, `tab-seguranca-backup` e `tab-precos`) foram explicitamente excluídas do comportamento de janelas flutuantes/redimensionáveis.
  * Isso manteve o layout dessas seções estático por padrão, evitando conflitos de salvamento de posições.

#### v22 (05/06/2026 - Antigravity)
* **Segurança e Robustez no Layout Manager:**
  * Adicionado encapsulamento defensivo em blocos `try-catch` em todas as principais operações do Layout Manager (`js/layout.js`) para evitar que qualquer erro isolado de posicionamento quebre a execução de outros módulos javascript do sistema.

#### v21 (05/06/2026 - Antigravity)
* **Correção de Crashes em Painéis Aninhados:**
  * Restringida a lógica de `wrapPanelContents()` e `unwrapPanelContents()` para atuar apenas sobre filhos diretos do painel principal, evitando erros em painéis que contêm outros elementos aninhados em sua estrutura.

#### v20 (05/06/2026 - Antigravity)
* **Auto-formatação de Conteúdo em Painéis Redimensionados:**
  * Adicionado suporte para envelopar automaticamente o conteúdo de painéis em contêineres de rolagem (`.panel-content-scrollable`) ao serem redimensionados, prevenindo estouros visuais.

#### v19 (05/06/2026 - Antigravity)
* **Aplicação Automática de Layout em Alternâncias:**
  * Configurada a chamada automática do Layout Manager ao trocar de sub-abas administrativas para repintar e reinjetar alças de redimensionamento instantaneamente na sub-aba ativada.

#### v18 (05/06/2026 - Antigravity)
* **Restauração de Handles e Limpeza de Logs:**
  * Corrigido o sumiço das alças de redimensionamento em painéis ao mudar de abas e removida a camada visual de logs de depuração do layout manager que ficava sobreposta na tela.

#### v17 (05/06/2026 - Antigravity)

#### v16 (05/06/2026 - Antigravity)
* **Prevenção Definitiva de Tremor & Atualização de Cache PWA:**
  * Forçado `transition: none !important;` nas classes `.dashboard-panel.layout-floating-active` e `.widget-card.layout-floating-active` no CSS, prevenindo que qualquer transição herdada (como a do `.widget-card`) atrase a renderização da posição `transform` durante o arraste de qualquer widget do dashboard.
  * Atualizada a versão do cache do Service Worker (`sw.js`) para `gelodovale-v108` e atualizados os parâmetros de cache-busting do `index.html` para `v16`. Isso garante que o navegador do usuário recarregue os novos estilos e scripts sem reter versões em cache.

#### v15 (05/06/2026 - Antigravity)
* **Correção de Drag & Tremor no Dashboard:**
  * Removido a transição `transform` do painel flutuante ativo no CSS (`styles.css`), eliminando o efeito de tremor/stutter causado por atrasos de animação durante o movimento do ponteiro.
  * Desativada a escuta de eventos nativos de reordenamento HTML5 de widgets (`widgets.js`) quando o modo de layout ativo não for `'fixed'` (ou seja, quando for `'grid'` ou `'floating'`). Isso evita conflitos de arraste duplo com o gerenciador de layout principal (`layout.js`) e corrige o problema do painel ficar preso ao mouse.

#### v14 (04/06/2026 - Antigravity)
* **Correção do Backup & Sincronização:**
  * Adicionado suporte para salvar/restaurar as posições personalizadas dos painéis (`layoutSettings`).
  * Adicionado suporte para salvar/restaurar o bloco de notas (`notepadText`), notas do calendário (`calendarNotes`), eventos locais (`localEvents`) e alertas ignorados (`ignoredSpikes`).
  * Adicionado suporte para salvar/restaurar preferências de impressão (`printSettings`) e logística.
  * O sistema agora aplica e renderiza o layout de painéis imediatamente após a restauração de um backup.
* **Separação de Versão no Rodapé:**
  * O rodapé lateral agora exibe separadamente a versão dos dados carregados (`Dados: vX.X`) e a versão atualizada do código (`Sistema: vXX`).

#### v13 (04/06/2026 - Antigravity)
* **Resolução de Overflow nos Cards (CLI-02 e outros):**
  * **Clientes:** Divisão das ações do card de cliente em duas linhas organizadas (Linha 1: Contrato, Assinar, Ligar, WhatsApp, Editar; Linha 2: Desvincular e Excluir). Redução dos botões de ícone para `28px x 28px`.
  * **Inventário/Equipamentos & Aluguéis:** Adicionado `flex-wrap: wrap` nos contêineres de botões de ações para evitar vazamento em telas estreitas ou painéis encolhidos.
  * **Documentos/Recibos:** Adicionado `flex-wrap: wrap` nas ações de documentos emitidos.

#### v12 (04/06/2026 - Antigravity)
* **Adaptabilidade de Altura dos Painéis (PED-02):**
  * **Mapa de Rotas:** O mapa interativo (`#leaflet-route-map`) agora tem uma altura mínima de `150px` e escala proporcionalmente.
  * **Lista Textual de Paradas:** Adicionado scroll vertical automático (`overflow-y: auto`) na lista de paradas (`#leaflet-route-fallback`), evitando vazamento do card.
  * **Listas do Dashboard:** Configurado scroll automático para as sugestões de visitas, devedores, agendamentos e alertas de reabastecimento.
  * **Layout Flex:** Impedido que parágrafos, botões e alertas estiquem artificialmente ao redimensionar os painéis.

