# 📋 Regras Operacionais e Diário de Bordo — GelControl (Gelo do Vale)

## 🌐 1. Idioma, Autonomia e Segurança Entre 2 Computadores (OBRIGATÓRIO)
- **Idioma Exclusivo:** Comunique-se com o usuário **100% em português do Brasil (`pt-BR`)**. O usuário não compreende inglês; traduza e explique qualquer mensagem ou termo técnico.
- **Execução Sequencial (Anti-Travamento Antigravity 2.0):** Execute ferramentas de leitura e comandos **um de cada vez (sequencialmente)**, nunca disparando múltiplos terminais em paralelo. Prefira `read_file`, `edit_file` e `write_file` nativos.
- **Separação Estrita de Projetos:** Nunca misture arquivos ou dados entre os dois sistemas do usuário:
  1. **Gelo do Vale (GelControl):** Pasta oficial sincronizada na nuvem: `C:\Users\kissn\OneDrive\GelodoVale-system\App` (GitHub: `https://github.com/GelodoVale/gelodovale-app.git`). **ATENÇÃO:** Nunca utilize a cópia antiga `F:\GelodoVale-system\App` (parada na `v68` de Junho/2026).
  2. **PrecificaPizza:** Pasta local `F:\PrecificaPizza` e espelho no OneDrive `C:\Users\kissn\OneDrive\PrecificaPizza`.
- **Sincronização Entre 2 PCs (Memória Compartilhada):**
  - O usuário trabalha em **2 computadores diferentes**, e o histórico de chat do Antigravity não sincroniza entre eles.
  - Por isso, **ANTES de iniciar qualquer melhoria**, o agente **DEVE ler as primeiras 100 linhas do arquivo `HISTORICO_MUDANCAS.md`** nesta pasta para saber exatamente o que foi feito na última sessão (mesmo que tenha sido feita no outro PC).
  - E **APÓS concluir qualquer alteração**, o agente **DEVE atualizar este arquivo (`.agents/AGENTS.md`) e o `HISTORICO_MUDANCAS.md`** imediatamente.

---

## 📌 2. Regra de Versionamento Obrigatório (`COD: VER-RULE`)
Sempre que fizer qualquer alteração no código do sistema, **por menor que seja** (correção de bug, ajuste visual, nova funcionalidade ou refatoração):

1. **Incrementar a versão da Build:**
   - Atualizar a etiqueta de versão em `index.html` (ex: `v79` -> `v80`, tanto na tela de login `#login-version` quanto no rodapé `#sidebar-version-label`).
   - Atualizar `CODE_BUILD` em `js/state.js`.
2. **Atualizar Cache do Service Worker (PWA):**
   - Incrementar o `CACHE_NAME` em `sw.js` (ex: `gelodovale-v179` -> `gelodovale-v180`).
3. **Atualizar Cache-Busters no `index.html`:**
   - Incrementar os parâmetros `?v=XX` nas tags `<script>` e `<link>` do `index.html`.
4. **Registrar no `HISTORICO_MUDANCAS.md` e em `.agents/AGENTS.md`:**
   - Escrever o cabeçalho da nova versão com data e detalhar exatamente o que foi modificado, quais arquivos foram alterados e por quê.
5. **Realizar Deploy para o GitHub Pages:**
   - Fazer `git commit` e `git push origin main` para que o código online `gelodovale.github.io/gelodovale-app/` e o outro PC recebam a atualização.
6. **Notificar o Usuário:**
   - Sempre informar explicitamente no final da resposta o **número exato da versão atualizada** (ex: *"Esta alteração foi publicada na versão **v80**"*), orientando o usuário a verificar a versão no rodapé após o `Ctrl + F5`.

---

## 📖 3. Resumo do Estado Atual (Onde Paramos)
- **Versão Atual em Produção:** **Sistema: `v81` (`05/11/2026` - Antigravity / Publicada) | Dados: `v4.4` | Cache PWA: `gelodovale-v181`**
- **Últimas Implementações Concluídas (Histórico Recente):**
  - **Etapa 9 — Validação Multi-Computador e Testes Reais (05/11/2026 - Em Andamento):**
    - **Passo 9.3D (Preparação e Pré-Publicação Controlada da v82 - COD: GELCONTROL-ETAPA9.3D):** Preparada a versão `v82` com bump no `index.html`, `js/state.js`, Service Worker `gelodovale-v182` e cache-busters `?v=82`. Criado `SYNC_ENGINE_BUILD` em `js/sync.js` para auditoria do motor real via console. 44 testes automatizados aprovados (regressão zero). Git commit, push e deploy no GitHub Pages sob bloqueio aguardando autorização final.
    - **Passo 9.3B (Implementação Segura do Boot Push Guard - COD: GELCONTROL-ETAPA9.3B):** Implementada blindagem ativa de escrita em `js/sync.js`. Bloqueio total e preventivo de `pushToFirebase`, `pushToFirebaseImediato`, `triggerGranularSync` e `forceManualSync` enquanto o snapshot da nuvem não for validado e aplicado no estado local. Extinto envio automático destrutivo por timestamps/versões. Criada gravação automática de backups locais de emergência em chaves exclusivas (`emergency_divergence_boot`) em caso de divergência ou alterações offline no boot. Nuvem nula, corrompida ou erros de rede mantêm a trava ativa (`BLOCKED_ERROR`). Homologado com 26 testes automatizados aprovados (18 unitários e 8 de bloqueio de rotas). Backups prévios verificados em `backups_pre_etapa9_3b/`. Zero push, deploy ou ativação no PC 2 nesta fase.
    - **Passo 9.2 (Homologação Plena do Backup Físico do PC 2 - COD: GELCONTROL-ETAPA9.2G):** Executado diagnóstico definitivo às 19h24 no PC 2 (`DESKTOP-47I1V20`). Homologação 100% concluída e comprovada: 117 de 117 arquivos locais do GelControl preservados em `Backups_Seguros_GelControl_PC2`, 31 arquivos de banco LevelDB preservados de todos os 4 perfis do Chrome (`Default`, `Guest Profile`, `Profile 1`, `System Profile`), com confirmação explícita de que os dados reais do GelControl residem no perfil `Default`. Versão local confirmada como `v81` e commit `b8b1406`. Declarado o encerramento com sucesso do Passo 9.2 sem pendências.
    - **Passo 9.1 (Preparação Segura do Segundo Computador - COD: GELCONTROL-ETAPA9.1):** Elaborado roteiro operacional estrito para o Computador 2, prevendo diagnóstico preliminar em modo 100% leitura, salvaguarda compulsória do `localStorage` local antes de qualquer sincronização, blindagem contra sobrescrita temporal de dados pelo Firebase (`remoteTs > localTs`), protocolo de validação da release `v81` (PWA `gelodovale-v181`), ambiente de teste bidirecional neutro e confirmação "TUDO SINCRONIZADO — PODE DESLIGAR". Feature flag mantida desligada (`granularSync = false`).
  - **Release v81 Publicada no GitHub Pages (05/11/2026 — `COD: REL-V81`):** Commit `b8b1406` com 8 arquivos oficiais, incluindo motor de fila persistente `js/outbox.js`, adaptador `js/granular_sync.js`, Service Worker `gelodovale-v181` e salvaguarda `clearOperationsUpTo`. Produção ativa no modo legado monolítico com `granularSync: false`.
  - **Etapa 8 — Sincronização Granular, Resiliência Offline e Concorrência Multi-PC (Concluída - 41 testes aprovados):**
    - **Fase 8A (Backup Físico do Firebase):** Snapshot completo do nó de produção `factories/gelodovale_oficial` extraído exclusivamente via leitura HTTP GET e gravado fora da pasta pública em `backups_firebase/firebase_backup_gelodovale_oficial_2026-11-05_16-27-53.json` (18.411 bytes, 17,98 KB), com hash SHA-256 `46F49D1BB1BDFF16C2226C44F5A5745B901ACFA6BC36823E127E370C21096ADC` validado.
    - **Fase 8B (Motor de Fila Offline - Outbox Pattern):** Implementado módulo `js/outbox.js` com identificador único (`opId` UUID v4), identificação fixa de dispositivo (`deviceId`), persistência em storage, ordenação sequencial FIFO, descarte idempotente de duplicatas, retentativa com backoff exponencial (1s a 30s), Dead-Letter Queue para falhas permanentes e reconexão reativa (`online`). 10 de 10 testes aprovados.
    - **Fase 8C (Adaptador de Sincronização Granular):** Implementado módulo `js/granular_sync.js` com roteamento atômico por nó de entidade, idempotência no lado remoto (`_processedOps/{opId}`), resolução de conflitos por 3-Way Field-Level Merge, transações atômicas de estoque (`ref.transaction()`) e compatibilidade total com o estado de arrays do GelControl v80 (`hydrateGelControlState`). 8 de 8 testes aprovados.
    - **Fase 8D (Integração Segura e Validação em Navegador Real):** Feature flag desenhada como desativada por padrão (`granularSync: false`), garantindo 100% de preservação do mecanismo de sincronização monolítico atual em produção. Comprovada a atomicidade de mutações e idempotência via multi-path updates, resolução determinística de colisão no mesmo campo, exclusões simultâneas e integridade de saldos concorrentes de estoque. Validação cruzada executada no Node.js (7 testes) e em navegador real Chrome Headless V8 (4 testes em DOM e localStorage nativo), somando 29 testes aprovados com 100% de sucesso.
    - **Fase 8E (Homologação Controlada e Blindagem de Concorrência):**
      - **Integração no Código Oficial:** Módulos `js/outbox.js` e `js/granular_sync.js` integrados em `js/state.js` e `js/sync.js` com a feature flag `state.featureFlags.granularSync = false` desativada por padrão (produção v80 continua no fluxo monolítico sem descontinuar a operação existente).
      - **Base de Homologação Isolada:** Testes executados no nó exclusivo `factories/homologacao_gelcontrol_etapa8e` com verificação no log de acessos comprovando zero toques na base de produção `factories/gelodovale_oficial`.
      - **Concorrência Extrema com Mesmo opId (Condição 4):** Testadas duas chamadas disparadas no exato mesmo milissegundo com o mesmo `opId`. Comprovado que o registro não é duplicado e transações de estoque rejeitam segundas tentativas (`skipped_idempotent`), impedindo duplicidade de baixa de estoque.
      - **Compatibilidade com Backup Real v80:** Carregado o arquivo real `backup_gelcontrol_2026-11-05_16-03-11.json` (32 KB do OneDrive), validando exportação granular e re-hidratação com 100% dos 4 clientes, 7 freezers, 2 pedidos e 16 produtos intactos.
      - **Total Acumulado da Etapa 8:** 36 testes automatizados aprovados com 100% de sucesso. Deploy e push não realizados.
    - **Fase 8F (Verificação Final, Blindagem de Corrida e Homologação em Firebase Real):**
      - **Blindagem Atômica Interna de Transação (Ponto 1):** Eliminada a janela de condição de corrida (TOCTOU). A verificação e o registro do `opId` foram embutidos diretamente no nó atômico da transação (`_processedOps` interno com `return undefined` em caso de duplicidade). Testado com duas chamadas disparadas em paralelo real: a primeira aplicou a dedução (-35) e a segunda foi abortada atomicamente como `skipped_idempotent`.
      - **Homologação em Firebase Real (Ponto 2):** Esclarecido o mapa de testes (Fases 8B..8E utilizaram Mocks e Chrome Headless; a Fase 8F executou **chamadas reais via rede contra a nuvem Firebase** no nó isolado `factories/homologacao_etapa8f`). O nó de produção `factories/gelodovale_oficial` permaneceu 100% inalterado (confirmado via consulta HTTP).
      - **Segurança no Retorno ao Modo Legado (Salvaguarda Cirúrgica clearOperationsUpTo):** Substituída a limpeza indiscriminada da fila por `defaultOutbox.clearOperationsUpTo(pushStartedAt)`. Apenas as operações enfileiradas até o instante em que o snapshot `safeState` foi capturado são removidas; qualquer operação nova gerada pelo usuário enquanto o envio trafega na rede é 100% PRESERVADA.
      - **Total Geral Consolidado:** 41 testes automatizados aprovados (4 no Firebase real na nuvem, 4 em Chrome Headless nativo e 33 no Node.js sandbox).
      - **Preparação da Release v81 (COD: GELCONTROL-V81):** Ajustados rótulos para `v81 (05/11/2026)`, Service Worker `gelodovale-v181` e cache-busters `?v=81` em `index.html`. Feature flag mantida desligada (`granularSync: false`). Nenhum commit, push ou deploy realizado. Pronto para autorização final.
  - **Fase 7D (`05/11/2026` — `COD: REL-V80` e `COD: BACKUP-FSAPI`):**
    - **Backup Direto via File System Access API:** Implementado salvamento nativo diretamente na pasta do OneDrive ou disco local pelo seletor de arquivos do Windows (`showSaveFilePicker`), eliminando necessidade de mover arquivos manualmente.
    - **Backup Direto via Directory Picker com Proteção Ativa contra Sobrescrita:** Homologado na prática em 05/11/2026 com o arquivo real `backup_gelcontrol_2026-11-05_16-03-11.json` (32 KB gravados com sucesso na pasta `OneDrive/GelodoVale-system`). Operador seleciona a pasta de destino uma única vez (`showDirectoryPicker`). A existência de arquivos é verificada previamente com `{ create: false }`. Havendo coincidência de nome (com dados ou 0 bytes), o sistema incrementa automaticamente o sufixo numérico `_(1).json`, `_(2).json`, gravando o novo backup em arquivo exclusivo com validação pós-escrita (`size > 0`) e mantendo todos os arquivos pré-existentes 100% intactos. Caso atinja 100 tentativas, a rotina cancela sem modificar nenhum arquivo.
    - **Cancelamento e Fallback Assistido:** Cancelamento voluntário aborta sem downloads automáticos; falha de permissão em disco aciona download de emergência carimbado.
    - **Transparência de Status:** Ícone do cabeçalho redefinido para `hard-drive-download` e rótulo claro de backup manual sob demanda.
    - **Incremento da Build Oficial:** Sistema atualizado para `v80 (05/11/2026 - Antigravity)` em `js/state.js`, `#login-version` e `#app-sidebar-version`.
    - **Invalidação e Renovação de Cache (PWA):** `CACHE_NAME` atualizado para `gelodovale-v180` no `sw.js`.
    - **Cache-Busters Atualizados:** Tags `<script>` e `<link>` em `index.html` incrementadas para `?v=80`.
    - **Consolidação Integral da Etapa 7:** Homologação E2E concluída em navegador isolado (Chrome Headless) e unitários com 100% de sucesso. Etapa 7 finalizada. Deploy e envio para o GitHub pendentes de autorização explícita do usuário.
  - **Fase 7C.2A (`05/11/2026` — `COD: SYNC-7C2A`):**
    - **Eliminação da Importação Automática Perigosa:** Removido o `fetch("../state_backup.json")` e `updateState(actualData)` no boot do app, eliminando risco de sobrescrita acidental de dados operacionais.
    - **Neutralização do Status do OneDrive:** Indicador de nuvem neutralizado para reportar exclusivamente localização de pasta física (`folder`), com remoção da animação de pulso.
    - **Stub Informativo de Transição:** Botão "Puxar Backup Salvo (Ler)" atualizado para chamar `handleBotaoLerBackupOneDrive()`, alertando sobre aprimoramento de segurança.
    - **Salvaguardas Registradas:** Backups permanentes validados em `backups/v79_seguranca_etapa7c/` e verificação funcional E2E no Chrome Headless aprovada.
  - **Fase 7C.2B — Concluída e Auditada em Produção (`05/11/2026` — `COD: RESTORE-7C2B`):**
    - **Compatibilidade com Backups Reais:** Suporte a ambos os formatos (encapsulado e plano `state_backup.json`), validado com os 9 backups reais do OneDrive.
    - **Modal de Inspeção Prévia (`#modal-preview-restore-backup`):** Interface Glassmorphic integrada no `index.html`, com banner de diagnóstico (vermelho para downgrade com contagem exata de dias), tabela comparativa (diff de clientes, freezers, pedidos, contratos) e trava obrigatória de consentimento via checkbox.
    - **Salvaguarda Compulsória Prévia:** Criação automática de ponto de emergência (`snap_pre_restore_...`) no histórico local de backups antes de qualquer alteração no `state`.
    - **Instalação Atômica Concluída:** Instalador `aplicar_fase7c2b.ps1` executado com código de saída 0. Salvaguardas gravadas em `backups/v79_seguranca_etapa7c/` e sintaxe V8 (`node --check`) aprovada com 0 erros.
    - **Auditoria Pós-Instalação:** 10 de 10 verificações estruturais aprovadas com sucesso.
    - **Status da Fase 7:** **~90% Concluída**. Fase 7C finalizada. Pendente exclusivamente a **Fase 7D** (versionamento `v80`, bump do Service Worker e deploy no GitHub). Não iniciar a Fase 7D sem autorização.
  - **v79 (`08/08/2026` — `COD: SPELL-V79`):** Eliminação do travamento de 4s do corretor ortográfico (`js/spellcheck.js`) substituindo `setTimeout` fixo por `requestIdleCallback` (timeout 15s) e gatilho inteligente `focusin`.
  - **v78 (`08/08/2026` — `COD: MP-V78`):** Novo Modal de Checkout do Mercado Pago (`#modal-mp-checkout-link`) sem disparo automático no WhatsApp (permite copiar/testar link antes de enviar), rótulo `MP (Pix/Boleto/Cartão)`, abertura automática do comprovante ao salvar e timeout de 1,5s na captura de GPS (`js/orders.js` e `js/pdv.js`) para não travar no PC.
  - **v76 e v77 (`06/08/2026` — `COD: HELP-V76`):** Central de Ajuda Contextual Hiper-Detalhada (`js/help.js` e `js/help_content.js`) mapeada card por card com códigos oficiais (`COD: KPI-01`..`04`, `DASH-00`, `WID-01`..`06`, `CLT`, `FRZ`, `LOC`, `DOC`, `PED`, `HIS`, `PRC`, `VIA`, `INS`, `ROI`, `REC`, `INT`, `WTP`, `SEG`, `USU`, `PDV`, `AJU`) e botões `?` circulares em todos os cabeçalhos e modais.
  - **v74 (`19/06/2026`):** Venda "A Prazo (Carnê)" no PDV (`js/pdv.js`), criptografia de senhas em SHA-256 com migração automática (`js/auth.js`), filtro de performance no corretor e indicador de sincronização em tempo real `#cloud-sync-status` (`js/sync.js`).
  - **v70 a v73 (`19/06/2026`):** Correção do arraste de widgets flutuantes (`styles.css` e `js/layout.js`), autoria de notas com `sessionStorage`, estoque mínimo dinâmico por insumo e faturamento zero para entregas de cortesia.
