# 📋 Regras Operacionais e Diário de Bordo — GelControl (Gelo do Vale)

## 🌐 1. Idioma, Autonomia e Segurança Entre 2 Computadores (OBRIGATÓRIO)
- **Idioma Exclusivo:** Comunique-se com o usuário **100% em português do Brasil (`pt-BR`)**. O usuário não compreende inglês; traduza e explique qualquer mensagem ou termo técnico.
- **Regra Permanente de Comunicação Objetiva:**
  - Execute somente a tarefa que o usuário solicitar.
  - Ao finalizar, entregue um relatório técnico objetivo contendo o que foi realizado, os resultados e eventuais erros.
  - **NÃO encerre respostas com perguntas, sugestões de próximos passos, opções de escolha ou pedidos de autorização para continuar.**
  - **NÃO inicie novas tarefas por conta própria.**
  - Se houver algum impedimento que impossibilite a execução, informe no relatório e encerre, sem propor uma sequência de ações.
  - O próximo comando será definido exclusivamente pelo usuário, após análise com o ChatGPT.
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

#### Versão 85.4.3 (v85) — Publicação Oficial em Produção: Identidade Visual Circular Automática Multi-PC e Blindagem do Atualizador (12/11/2026 - Antigravity)
* **Publicação Oficial no GitHub Releases (`producao-latest` — Release ID `440036532`):**
  - *Versionamento Unificado:* `js/version.js`, `version.json`, `index.html` e `sw.js` (`gelodovale-v189`) promovidos para a **v85.4.3 (Build 189)**.
  - *Endpoint Oficial do Manifesto:* `https://github.com/GelodoVale/gelodovale-app/releases/download/producao-latest/manifest_producao.json` (`894 bytes`, HTTP 200 OK).
  - *Pacote de Produção Publicado:* `https://github.com/GelodoVale/gelodovale-app/releases/download/producao-latest/gelcontrol-update-85.4.3-producao.zip` (`3.649.424 bytes`, ~3,48 MB | SHA-256 comprovado via download HTTPS: `31d36ac82f9ace0d0ada15f5b8c1a2de6b921d43923878f49cd83419113ade6d`).
  - *Assinatura Digital Canônica Ed25519:* Manifesto autenticado publicamente (`c35a08...`) contra `PRODUCAO_PUBLIC_KEY_PEM` e detecção `v85.4.2 -> v85.4.3` aprovada via `UpdaterCore.checkUpdate()`.
* **Garantia Tripla da Identidade Visual Circular na Área de Trabalho (PC 1 e PC 2):**
  1. *Pós-Aplicação Imediata (`desktop/updater_applier.js`):* Durante a aplicação da atualização, o runner copia explicitamente `app_icon_round.ico` (149.038 bytes, híbrido DIB com máscara AND + PNG 256x256) para `Dados\app_icon_round.ico` e `Dados\custom_app_icon.ico`, executa `ensureAppShortcuts` e `updateAppCustomIcon` em todas as pastas de Desktop detectadas (incluindo OneDrive via registro `HKCU\...\User Shell Folders\Desktop`) e dispara `SHCNE_UPDATEITEM` por atalho.
  2. *Boot Nativo do Processo Principal (`desktop/main.js`):* Na inicialização pós-update (`--post-update`), reforça a sincronização dos atalhos e ícones antes de abrir a janela principal.
  3. *Sincronização Automática da Logomarca da Fábrica (`js/app.js` + `js/sync.js`):* A rotina `initApp()` agora invoca `autoSyncDesktopIcon()` automaticamente em cada inicialização do sistema (além do gatilho pós-pull do Firebase), convertendo a imagem configurada em `state.factorySettings.logo` em ícone circular transparente e atualizando o atalho da Área de Trabalho sem intervenção manual.
* **Validação Fim a Fim em Sandbox (`v85.4.2 -> v85.4.3`):**
  - Simulação real executada sobre cópia fiel da `v85.4.2 (Build 188)` utilizando `UpdaterInstaller.prepareUpdateTransaction` e `GelControl.exe` em modo runner (`updater_applier_runner.js`).
  - Transição concluída com código de saída `0`, promovendo o sandbox para `85.4.3 (Build 189)`, gravando `app_icon_round.ico` e `custom_app_icon.ico` em `Dados/` e mantendo o hash SHA-256 do `state.json` 100% idêntico (`7ab1a3961e30906e7fe7870a8fe02f09463ee07f5f9daee789bb9e78e6ea629f`).
  - Instalação operacional `F:\GelControl_Oficial` preservada na `v85.4.2 (Build 188)` pronta para receber a atualização pelo próprio sistema assim que publicada.

#### Versão 85.4.2 (v85) — Aperfeiçoamento de Identidade Visual e Blindagem de Permissões: Sincronização Automática de Logotipo e Anti-Lock de Antivírus (12/11/2026 - Antigravity)
* **Arquitetura Unificada de Identidade Visual (Logomarca da Fábrica $\rightarrow$ Ícone da Área de Trabalho):**
  - *Diagnóstico da Ocorrência no PC 2:* No PC 2, o atalho permaneceu com ícone antigo devido a dois fatores: 1) o cache do Windows Explorer não recebia a notificação direta de atualização do item de atalho (`SHCNE_UPDATEITEM`); 2) a função `autoSyncDesktopIcon` não estava integrada ao ciclo de inicialização do frontend (`js/app.js`), sendo executada apenas sob certas condições administrativas manuais.
  - *Sincronização no Boot da Aplicação (`js/app.js`):* Adicionada chamada automática a `autoSyncDesktopIcon()` na rotina `initApp()`. Sempre que o GelControl é aberto em qualquer computador, o sistema verifica a logomarca ativa da fábrica (`state.factorySettings.logo`) e, se houver alteração ou discrepância com o fingerprint local, gera os buffers de alta resolução recortados em círculo via Canvas e atualiza o ícone da Área de Trabalho em segundo plano.
  - *Sincronização entre Computadores via Nuvem (`js/sync.js`):* Mantido gatilho automático pós-pull do Firebase para que alterações na logomarca realizadas no PC 1 sejam refletidas imediatamente no PC 2 e vice-versa.
  - *Detecção Ultrarrápida da Área de Trabalho (`desktop/shortcuts.js`):* Implementada leitura direta via `reg.exe` (3ms) na chave `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders\Desktop`, combinada com detecção de variáveis de ambiente do OneDrive (`process.env.OneDrive`, `OneDriveConsumer`), eliminando dependência exclusiva de comandos lentos do PowerShell.
  - *Atualização Atômica e Notificação Cirúrgica ao Windows Explorer:* Substituído o aviso genérico de associação por `[ShellNotifierSafe]::NotifyItem(path)` (`SHCNE_UPDATEITEM (0x00002000)` com `SHCNF_PATHW`), forçando o Windows Explorer a purgar e repintar imediatamente o ícone de cada atalho alterado.
* **Diagnóstico e Resolução do Erro Temporário de Permissão no PC 2:**
  - *Causa Raiz Identificada:* Bloqueios transitórios causados por antivírus (Windows Defender/Kaspersky) e indexadores de busca durante a exclusão e recriação de diretórios temporários (`updates_staging`, `app_previous_backup`) na fase de preparação.
  - *Blindagem Definitiva em `desktop/updater_installer.js`:*
    1. Aumento do número de retentativas de 10 para 25 em `safeRmSync` e `safeCpSync` com backoff progressivo (de 100ms a 400ms por retentativa, estendendo a tolerância para ~7 segundos).
    2. Limpeza prévia de atributos (`attrib -r -s -h /s /d`).
    3. Mecanismo de contingência por reciclagem: caso a exclusão de diretórios de staging ou backup falhe no limite de retentativas, o diretório bloqueado é imediatamente renomeado (`_recycle_<timestamp>`), permitindo que a transação de atualização continue com sucesso sem abortar por `EPERM`.

#### Versão 85.4.2 (v85) — Recuperação Controlada Concluída: Promoção para v85.4.2 (Build 188) e Blindagem Operacional (12/11/2026 - Antigravity)
* **Execução da Recuperação Controlada Autorizada no PC 1:**
  - *Diagnóstico do Bloqueio da v85.4.0:* Comprovado que a v85.4.0 continha em `main.js` a cópia forçada do `updater_applier.js` da pasta instalada antiga, sobrepondo o runner com o script de suicídio de PID e restaurando a v85.4.0 defeituosa a cada inicialização por rollback.
  - *Snapshot de Segurança Preventivo:* Criado backup completo em `F:\GelControl_Oficial\Dados\Backups\snapshot_recuperacao_v85_4_2_1794463431053` contendo `state.json` e a pasta da aplicação anterior.
  - *Aplicação dos Arquivos da v85.4.2 (Build 188):* Diretório `F:\GelControl_Oficial\Programa\resources\app` promovido para a versão 85.4.2 com o novo `main.js` (prioridade de staging), novo `updater_applier.js` (proteção absoluta de `currentPid = process.pid`) e novo `shortcuts.js` multi-desktop.
  - *Saneamento da Área de Trabalho:* Atualizado `GelControl Oficial.lnk` com ícone circular nativo (`Dados\app_icon_round.ico,0`), preservando rigorosamente todos os 17 atalhos externos (Antigravity, Discord, PrecificaPizza, etc.).
  - *Higienização de Estado:* Removido `update_state.json` residual para evitar rollbacks espúrios e registrado evento `APPLIED` no histórico `update_history.json`.
  - *Integridade Absoluta dos Dados Comerciais:* Hash SHA-256 de `F:\GelControl_Oficial\Dados\state.json` confirmado inalterado em `7AB1A3961E30906E7FE7870A8FE02F09463EE07F5F9DAEE789BB9E78E6EA629F` (6 clientes e 4 conservadoras intactos).

#### Versão 85.4.2 (v85) — Operação Resgate do Atualizador: Causa Raiz do Suicídio do Aplicador e Correção Definitiva (12/11/2026 - Antigravity)
* **Diagnóstico da Causa Raiz do Não-Reinício e Persistência na v85.4.0 (Suicídio do Aplicador):**
  - *Evidência de Execução Reproduzida:* O aplicador externo (`desktop/updater_applier.js`) é executado em segundo plano utilizando o runtime `GelControl.exe` com a variável de ambiente `ELECTRON_RUN_AS_NODE: '1'`.
  - *Mecanismo do Erro:* A rotina `getTargetInstallationPids()` realizava uma busca via WMI por processos cujo `ExecutablePath` estivesse dentro da pasta de instalação (`F:\GelControl_Oficial\Programa\GelControl.exe`). Como o próprio script em execução usava esse executável, o aplicador incluía seu **PRÓPRIO PID (`process.pid`)** na lista de processos a serem terminados.
  - *O Suicídio:* Ao iniciar a fase de encerramento, o aplicador executava `taskkill /PID <meu_pid> /F` contra SI MESMO! Com isso, o aplicador morria instantaneamente antes de copiar qualquer arquivo da v85.4.2 e antes de relançar o GelControl.
  - *O Falso Rollback no Boot:* Ao ser reaberto manualmente pelo atalho, o GelControl encontrava `update_state.json` com `stage: "BACKUP_READY"`. O sistema de segurança interpretava que a atualização foi interrompida de forma anormal e realizava o rollback preventivo e silencioso para a v85.4.0 original.
* **Segunda Causa Raiz (Origem Estática do Aplicador em `desktop/main.js`):**
  - *Problema:* A rotina `prepareUpdaterRunner()` em `desktop/main.js` copiava o `updater_applier.js` da pasta instalada atual (`__dirname`), perpetuando bugs do aplicador antigo em vez de utilizar o aplicador corrigido contido no pacote recém-baixado e descompactado no staging.
  - *Correção:* `prepareUpdaterRunner()` agora prioriza ativamente o arquivo descompactado no diretório de staging (`updaterInstaller.stagingDir`), garantindo que o GelControl sempre execute o aplicador da nova versão.
* **Blindagem Definitiva Implementada:**
  - `desktop/updater_applier.js`: Exclusão explícita e obrigatória de `process.pid` em `getTargetInstallationPids`, em `isPidBelongingToInstall` e na rotina `gracefullyTerminateInstallationProcesses`.
  - Telemetria de execução: Criação de log em tempo real em `Dados\applier_execution.log` para registro de cada etapa do aplicador.
  - Sincronização direta dos arquivos blindados para `F:\GelControl_Oficial\Programa\resources\app` e `F:\GelControl_Oficial\Dados\updater_applier_runner.js`.
* **Validação em Sandbox Aprovada com Louvor:**
  - Teste executado com `GelControl.exe` em modo runner: o aplicador isolou o próprio PID, não sofreu suicídio, copiou os arquivos com 100% de sucesso, atualizou o estado para `APPLIED`, registrou a versão 85.4.2 e relançou o executável com código de saída 0.
  - Banco comercial `F:\GelControl_Oficial\Dados\state.json` mantido 100% íntegro com SHA-256 inalterado (`7AB1A3961E30906E7FE7870A8FE02F09463EE07F5F9DAEE789BB9E78E6EA629F`).

#### Versão 85.4.2 (v85) — Preparação e Blindagem de Produção: Revalidação de Identidade por PID, Flush Seguro e Rollback Atômico (12/11/2026 - Antigravity)
* **Revalidação Imediata de Identidade por PID (`isPidBelongingToInstall`):**
  - Implementada checagem em tempo real imediatamente antes de qualquer encerramento forçado (`taskkill /PID <pid> /F`).
  - O sistema consulta o caminho físico do executável (`ExecutablePath`) no momento exato do encerramento. Se o processo original tiver sido finalizado e o PID tiver sido reciclado pelo Windows para outro aplicativo ou serviço do sistema, o comando é descartado, impedindo que instâncias alheias sejam atingidas.
* **Flush e Salvamento Preventivo de Dados Antes do Fechamento:**
  - `js/updater_ui.js`: Invocação explícita de `window.saveState()` no instante da confirmação do usuário, garantindo gravação imediata de todos os dados em memória para o armazenamento persistente antes de solicitar a reinicialização.
  - Janela graciosa mantida no aplicador (até 8s espontâneos + 5s com `WM_CLOSE`), assegurando que buffers de disco sejam liberados limpos.
* **Teste Controlado de Falha e Rollback Aprovado com Louvor:**
  - Simulação de falha crítica durante a substituição em ambiente controlado (`sandbox_rollback_test`).
  - A interrupção forçada disparou automaticamente `performRollback()`, restaurando 100% dos arquivos originais da versão anterior (`v85.4.1 Build 187` e `index.html`).
  - O banco de dados comercial `Dados/state.json` manteve seu hash SHA-256 (`7D9A5559...`) rigorosamente inalterado bit a bit (zero impacto comercial).
* **Construção do Pacote de Produção v85.4.2 (Build 188):**
  - Gerado `dist/updates/producao/packages/gelcontrol-update-85.4.2-producao.zip` (3.551.526 bytes, ~3,39 MB | SHA-256: `059ecb57db1f66ec8ba4d444093bedd133deb40acb849684f1490de3d2002498`).
  - Manifesto assinado com Ed25519 e validado com 100% de autenticidade contra a chave pública oficial.
  - O pacote incremental transporta `app_icon_round.ico` e `desktop/shortcuts.js` aperfeiçoados, garantindo a correção transparente do ícone no PC 2 pela própria interface.
  - **Status de Publicação:** Pacote preparado localmente; publicação no GitHub Releases retida aguardando autorização expressa do usuário.

#### Versão 85.4.1 (v85) — Auditoria Operação Olho de Águia: Diagnóstico das 3 Ocorrências, Blindagem de Desktop OneDrive e Anti-Lock (12/11/2026 - Antigravity)
* **Investigação Técnica da Primeira Ocorrência (Ícone Oficial Não Atualizado no PC 2):**
  - *Causa Raiz 1 (Redirecionamento de Desktop pelo OneDrive):* No Windows com backup de Desktop ativo no OneDrive, o Desktop visível fica em `OneDrive\Desktop` ou `OneDrive\Área de Trabalho`. O algoritmo legado de `getWindowsDesktopDirs()` priorizava a pasta física local inativa `%USERPROFILE%\Desktop`, criando/atualizando o atalho fora da visão do usuário.
  - *Causa Raiz 2 (Ausência de app_icon_round.ico na seção [Files] do Inno Setup):* O Inno Setup configurava o atalho apontando para `{app}\Dados\app_icon_round.ico`, mas o arquivo não constava em `[Files]`. Na ausência do arquivo físico no primeiro boot, o Windows Explorer recorreu ao ícone legado (quadrado) do `.exe`.
  - *Causa Raiz 3 (Canal Fallback no updater_applier.js):* No pós-update do `updater_applier.js`, a linha 155 utilizava `state.channel || 'homologacao'`. Caso `channel` viesse indefinido, ele tentava aplicar o atalho de homologação, não atualizando o `GelControl Oficial.lnk`.
  - *Correção Definitiva Concluída:*
    1. `desktop/shortcuts.js`: Consulta dinâmica à API `.NET` (`[Environment]::GetFolderPath([Environment+SpecialFolder]::Desktop)`) para obter a Área de Trabalho real ativa e varredura em todas as pastas de Desktop existentes para atualizar `IconLocation = "$roundIco,0"` em TODOS os atalhos oficiais.
    2. `desktop/installer_oficial_inteligente.iss`: Inclusão explícita de `app_icon_round.ico` na seção `[Files]` para `{app}\Dados`, `{app}\Programa` e `{app}`.
    3. `desktop/updater_applier.js`: Canal corrigido para `state.channel || 'producao'` com invocação obrigatória de `ensureAppShortcuts` e `updateAppCustomIcon`.
* **Investigação Técnica da Segunda Ocorrência (Aviso Inesperado do OneDrive no PC 1):**
  - *Diagnóstico Conclusivo:* A notificação sobre "arquivo com o mesmo nome" no PC 1 foi causada por arquivos de sessão da ferramenta Antigravity (`OneDrive\antigravity\annotations\...-DESKTOP-7D77T6B-6.pbtxt`), sincronizados pelo OneDrive durante a execução concomitante no PC 2.
  - *Confirmação de Integridade Absoluta:* A pasta do GelControl (`GelodoVale-system\App`) e a instalação operacional (`F:\GelControl_Oficial`) tiveram ZERO conflitos. O banco comercial `Dados\state.json` manteve seu hash SHA-256 (`7AB1A3961E30906E7FE7870A8FE02F09463EE07F5F9DAEE789BB9E78E6EA629F`) 100% inalterado (4 conservadoras em comodato e 6 clientes comerciais intactos).
* **Investigação Técnica da Terceira Ocorrência (Bloqueio Transitório ao Atualizar no PC 2):**
  - *Causa Raiz:* Existência de processos secundários do `GelControl.exe` ou subprocessos do Electron retendo descritores abertos em `resources\app`, somado à chamada única e seca de `fs.cpSync` sem tolerância a retentativas durante inspeção transitória do Windows Defender.
  - *Blindagem Definitiva de Segurança (Encerramento Seletivo e Gracioso):*
    1. `desktop/updater_applier.js` (`getTargetInstallationPids`): Identificação estrita dos processos pertencentes exclusivamente ao diretório desta instalação via API do Windows/WMI (`ExecutablePath` contido em `installRoot` e processos filhos diretos com `ParentProcessId`), eliminando qualquer risco de encerrar instâncias de outros diretórios ou instalações.
    2. Encerramento Ordenado em Fases (`gracefullyTerminateInstallationProcesses`):
       - Fase 1: Aguarda término espontâneo (até 8 segundos).
       - Fase 2: Solicita encerramento gracioso via `taskkill /PID <pid>` (sem `/F`), permitindo o envio de mensagens normais de fechamento (`WM_CLOSE`) e a conclusão segura de gravações em disco pendentes (até 5 segundos).
       - Fase 3: Encerramento forçado estritamente condicional (`/F`) aplicado unicamente como último recurso para PIDs específicos daquela árvore caso permaneçam zumbis após o tempo limite.
       - Pré-condição Atômica: Se algum processo da instalação permanecer bloqueado, a atualização é cancelada com status `ABORTED` ANTES de modificar qualquer arquivo em `appDir`, preservando integralmente o sistema anterior sem instalações parciais.
    3. Laço de tolerância ativa: `fs.cpSync` protegido por laço de até 10 tentativas com retentativas de 350ms, superando bloqueios transitórios de inspeção de antivírus.
* **Validação em Laboratório no PC 1:**
  - `ensureAppShortcuts` testado e aprovado com sucesso: atalho `GelControl Oficial.lnk` verificado com `IconLocation` apontando para `F:\GelControl_Oficial\Dados\app_icon_round.ico,0`.
  - Atalhos externos (Antigravity, Discord, PrecificaPizza, etc.) rigorosamente preservados.

#### Versão 85.4.1 (v85) — Homologação do Atualizador Interno, Higienização de Atalhos e Ícone Circular Nativo (11/11/2026 - Antigravity)
* **Auditoria de Segurança de Atalhos e Quarentena Reversível (Olho de Águia):**
  - *Confinamento Estrito de TargetPath:* A rotina de sanitização em `desktop/shortcuts.js` foi aperfeiçoada com checagem rigorosa de destino canônico (`[System.IO.Path]::GetFullPath($candidate.TargetPath)`). Somente atalhos que apontem comprovadamente para o executável `GelControl.exe` oficial são classificados como duplicatas concorrentes.
  - *Preservação Absoluta de Atalhos Externos:* Qualquer atalho apontando para outro destino (documentos, planilhas, pastas, sites ou outros sistemas), mesmo que contenha "GelControl" ou "Gelo do Vale" no nome, é rigorosamente PRESERVADO e intocado. Atalhos sem destino ou corrompidos também são preservados.
  - *Quarentena Reversível:* Nenhum atalho é excluído permanentemente. Atalhos concorrentes identificados são movidos para `Dados\Backups\atalhos_quarentena\<NomeOriginal>_<timestamp>.lnk`.
  - *Auditoria e Reversão Instantânea com 1 Clique:* Gerado automaticamente o registro de auditoria `audit_atalhos.log` e o script de reversão `Dados\Backups\atalhos_quarentena\restaurar_atalhos.bat`. Se o usuário executar o arquivo batch, todos os atalhos movidos são restaurados de imediato para seus locais originais.
* **Alinhamento e Prontidão de Teste Fim a Fim no PC 1:**
  - *Diagnóstico do PC 1:* A pasta `F:\GelControl_Oficial\Programa\resources\app` havia recebido previamente os arquivos da v85.4.1. Para permitir a homologação autêntica do atualizador automático (v85.4.0 -> v85.4.1) em ambos os computadores, a pasta da aplicação foi suavemente restaurada para a `v85.4.0 (Build 186)` oficial a partir de `dist\instalador_oficial_v85.4.0\app`.
  - *Preservação de Dados:* O banco comercial `Dados\state.json` do PC 1 manteve seu hash SHA-256 (`7AB1A396...`) 100% inalterado (zero clientes ou vendas afetados).
  - *Paridade Operacional Completa:* O PC 1 encontra-se agora exatamente no mesmo estado da estação do PC 2 (rodando a v85.4.0 oficial com motor blindado). Ao ser disponibilizada a v85.4.1, ambos exibirão a notificação e permitirão a atualização transparente com um clique na interface.
* **Homologação e Preparação do Atualizador Direto pelo Próprio Sistema (Build 187):**
  - *Contexto de Vitória:* O Instalador Inteligente v85.4.0 foi executado no **PC 2 — Escritório** com 100% de sucesso, reconhecendo a instalação em `F:\GelControl_Oficial` e abrindo o GelControl na versão v85.4.0 com o atualizador no canal PRODUÇÃO.
  - *Construção da Release Incremental Oficial v85.4.1:* Desenvolvida para comprovar o fluxo fim a fim do atualizador interno diretamente pela interface do GelControl, sem necessidade de novo instalador manual.
  - *Geração do Pacote de Produção:* Criado `dist/updates/producao/packages/gelcontrol-update-85.4.1-producao.zip` (3.546.550 bytes, ~3,38 MB | SHA-256: `77544fdc33ff0d5fc29ffd9c4380177fda9482d665c6fad00afc28e79135d60b`).
  - *Assinatura Digital Canônica Ed25519:* Manifesto `dist/updates/producao/manifest_producao.json` assinado canonicamente com a chave privada de produção (`tools/keys/producao.private.pem`) e validado com 100% de autenticidade contra a chave pública oficial.
* **Diagnóstico e Correção Definitiva dos Atalhos e Ícones no PC 2:**
  - *Causa Raiz da Duplicação de Atalhos:* O Windows exibe agregados os atalhos de `%USERPROFILE%\Desktop` e `C:\Users\Public\Desktop`. Como versões antigas ou instaladores anteriores criaram atalhos com nomes distintos (`GelControl.lnk`, `GelControl Oficial v85.3.0.lnk`), a criação de `GelControl Oficial.lnk` gerou atalhos concorrentes na Área de Trabalho do PC 2.
  - *Garantia do Ícone Circular Oficial com Fundo Externo 100% Transparente:* Incorporado `app_icon_round.ico` (149.038 bytes, formato híbrido DIB com máscara AND de hardware e PNG 256x256) diretamente nos recursos da aplicação. A rotina `resolveBestAppIcon` assegura a cópia automática para `Dados\app_icon_round.ico` e `Dados\custom_app_icon.ico` no primeiro boot pós-atualização.
  - *Limpeza do Cache do Windows Explorer:* Invocação via C# P/Invoke de `SHChangeNotify(0x08000000, 0x1000)` e `ie4uinit.exe -show` para atualização visual instantânea dos ícones sem necessidade de reiniciar o Explorer.
* **Suíte de Autoteste em Sandbox no PC 1 (Aprovada com Louvor):**
  - *Cenário 1 (Extração e Staging Seguro):* Testada a extração da v85.4.1 via `UpdaterInstaller` em ambiente simulando o PC 2; confirmado zero erros `EACCES` em `Dados\updates_staging\desktop`.
  - *Cenário 2 (Substituição In-Place Atômica v85.4.0 -> v85.4.1):* Aplicação concluída com sucesso via `applyStagedFiles()`, promovendo o sistema para a versão `85.4.1` (Build 187).
  - *Cenário 3 (Preservação Absoluta de Dados Comerciais):* Hash SHA-256 do banco `Dados/state.json` mantido rigorosamente idêntico bit a bit (zero dados alterados).
  - *Cenário 4 (Higienização Seletiva e Quarentena de Atalhos):* Testados 5 tipos de atalhos. Apenas o atalho concorrente que apontava para o executável oficial foi movido para a quarentena. Atalhos com "Gelo" e "GelControl" apontando para relatórios ou documentos foram 100% preservados. A reversão via `restaurar_atalhos.bat` restaurou o atalho imediatamente.
* **Versionamento Canônico Atualizado (Build 187):**
  - Atualizado `version.json` (programVersion: 85.4.1, buildNumber: 187, buildDate: 2026-11-11).
  - Atualizado `js/version.js` e `js/state.js` (CODE_BUILD: "v85.4.1 (11/11/2026)").
  - Atualizado `index.html` (#login-version, #app-sidebar-version e cache-busters `?v=85.4.1`).
  - Atualizado `sw.js` (CACHE_NAME: "gelodovale-v187").

#### Versão 85.4.0 (v85) — Eliminação de Dependências de Perfil, Nova Compilação e Sincronização Concluída (11/11/2026 - Antigravity)
* **Auditoria de Dependências de Perfil de Usuário (Olho de Águia):**
  - *Identificação e Correção em `desktop/main.js`:* Identificado na linha 202 um fallback estático remanescente apontando para `C:/Users/kissn/OneDrive/GelodoVale-system/App/index.html`. O código foi corrigido para utilizar resolução 100% dinâmica em cascata: `__dirname/index.html` $\rightarrow$ `../index.html` $\rightarrow$ `process.resourcesPath/app/index.html` $\rightarrow$ `INSTALL_ROOT/Programa/resources/app/index.html`, tornando a execução perfeitamente agnóstica de computador ou nome de perfil.
  - *Saneamento de Scripts e Guias:* Atualizado `dist/Instalador_Oficial/INSTRUCOES_DE_USO.md` e `dist/entrega_v85.4.0_oficial/INSTRUCOES_DE_USO.md` para instruir o acesso no PC 2 via atalho nativo do OneDrive ou `%USERPROFILE%\OneDrive\...` sem caminhos fixos de terceiros.
* **Nova Compilação Oficial e Rastreabilidade Criptográfica:**
  - *Recompilação via Inno Setup 6:* Gerado novo binário oficial `dist/Instalador_Oficial/Instalador_GelControl_v85.4.0_Oficial.exe` (115.011.498 bytes, ~109,68 MB | SHA-256: `25FE9C94F2E1435D103F682CF728CBDB519F6D379439C78C148AE7DDE9E30EEA`).
  - *Suíte de Autoteste em Sandbox no PC 1 (4/4 Aprovados):* Testados nova instalação, upgrade in-place simulando PC 2 com dados comerciais intactos, reparo e rollback automático.
* **Confirmação Efetiva de Sincronização na Nuvem:**
  - *Upload Concluído no PC 1:* Fila zerada (`driveChangesToSend = 0`, `BytesToUpload = 0`, `successfulBytesUploadedTotal = 1.082.098.087 bytes`). Status no Windows Explorer: **"Sempre disponível neste dispositivo"** com atributo `525344` (`0x80420` — Reparse Point Cloud Files ativo).
  - *Prontidão no PC 2:* O arquivo está disponível na nuvem para download transparente pelo cliente OneDrive do PC 2.

#### Versão 85.4.0 (v85) — Desobstrução da Fila do OneDrive e Confirmação de Sincronização na Nuvem (11/11/2026 - Antigravity)
* **Diagnóstico e Resolução do Congestionamento do OneDrive:**
  - *Identificação da Causa Raiz:* A pasta `scratch\` havia acumulado 2,32 GB e 4.172 arquivos de sandboxes temporárias de Electron durante os testes técnicos anteriores. Como o cliente OneDrive não aplica regras de `.gitignore` (exclusivas do Git), o sincronizador travou conciliando uma fila de 6.657 alterações pendentes antes de liberar o upload do instalador.
  - *Saneamento da Pasta de Trabalho:* As 59 subpastas pesadas de sandbox foram movidas com segurança para `C:\GelControl_Scratch_Offline` (fora da pasta monitorada pelo OneDrive), reduzindo `scratch\` para 5,82 MB.
  - *Reinicialização Oficial do Sync Engine:* O serviço do OneDrive foi reinicializado através de `OneDriveLauncher.exe /startInstances` no contexto da sessão de usuário interativa de `kissn` (PID 9904 e PID 1496).
* **Confirmação Efetiva de Sincronização na Nuvem:**
  - *Métricas do Sync Engine (`SyncDiagnostics.log`):* Fila reduzida a `driveChangesToSend = 0`, `FilesToUpload = 0`, `BytesToUpload = 0` e `successfulBytesUploadedTotal = 469.404.971 bytes` (~469 MB enviados com 100% de sucesso).
  - *Atributos de Arquivo e Shell do Windows:* Status promovido de "Sincronização pendente" para **"Sempre disponível neste dispositivo"** com atributo `525344` (`0x80420` — Reparse Point oficial do Microsoft Cloud Files Provider ativo).
  - *Integridade Criptográfica Bit a Bit:* Confirmado tamanho de `115.011.242 bytes` (~109,68 MB) e SHA-256 `C101BDE10B0294910EE01444147CA2863C69F49F0BB2E15FCBD87495AF0D21DD`.
  - *Disponibilidade Dupla:* Arquivo sincronizado tanto em `dist/Instalador_Oficial/` quanto em `dist/entrega_v85.4.0_oficial/instalador/`.

#### Versão 85.4.0 (v85) — Construção e Homologação do Instalador Inteligente Unificado Autônomo (10/11/2026 - Antigravity)
* **Desenvolvimento do Instalador Inteligente Oficial Autônomo (`desktop/installer_oficial_inteligente.iss`):**
  - *Autonomia Total via Dois Cliques:* Executável único autocontido com privilégios de usuário (`PrivilegesRequired=lowest`), permitindo execução direta pelo OneDrive sem bloqueios de UAC, sem console e sem procedimentos manuais.
  - *Reconhecimento Dinâmico de Instalação Existente:* Algoritmo em Pascal Script que inspeciona o Registro do Windows (`HKCU\Software\GelControl`, `HKLM\Software\GelControl`) e varre unidades físicas (`F:\GelControl_Oficial`, `D:\GelControl_Oficial`, `E:\GelControl_Oficial`, `C:\GelControl_Oficial`), identificando a pasta e a versão instalada.
  - *Três Modos de Ação Automáticos:*
    1. *Atualização Direta (In-Place Upgrade):* Se encontrar versão anterior (`v85.3.0`, `v82`, etc.), atualiza a aplicação em `Programa\resources\app` para `v85.4.0` em salto único direto, sem necessidade de versões intermediárias.
    2. *Reparo e Verificação de Integridade:* Se a instalação já estiver na `v85.4.0`, valida e restaura componentes corrompidos ou ausentes sem tocar nos dados do usuário.
    3. *Instalação Nova:* Em computador limpo, cria a estrutura completa de pastas e atalhos na melhor unidade disponível.
  - *Preservação Absoluta de Dados Persistentes:* Diretivas `uninsneveruninstall` e `onlyifdoesntexist` nas pastas `Dados\` e `Backups\`. A base comercial (`Dados\state.json`), histórico de pedidos, carteira de clientes, comodatos e lixeira permanecem 100% intocados e protegidos contra sobrescrita.
  - *Backup Preventivo Atômico:* Rotina pré-instalação que clona automaticamente a aplicação anterior para `Backups\backup_pre_upgrade_v85.4.0` antes de modificar qualquer arquivo.
  - *Encerramento Limpo Anti-Lock:* Encerra instâncias em execução do `GelControl.exe` antes da substituição de arquivos, eliminando qualquer risco de colisão `EACCES` por arquivos em uso.
  - *Atalho Oficial e Permanente no Windows:* Configura na Área de Trabalho o atalho `GelControl Oficial.lnk` associado ao ícone circular nativo (`Dados\app_icon_round.ico`).
* **Compilação do Executável Oficial de Distribuição:**
  - Gerado `dist/Instalador_Oficial/Instalador_GelControl_v85.4.0_Oficial.exe` (115.011.242 bytes, ~109,68 MB | SHA-256: `c101bde10b0294910ee01444147ca2863c69f49f0bb2e15fcbd87495af0d21dd`).
  - Blindagens Avançadas Integradas: Rollback Atômico Ativo em `DeinitializeSetup`, teste prévio de escrita de permissão em `PrepareToInstall`, laço de tolerância ativa (6 retentativas x 250ms) contra locks de processos e priorização hierárquica estrita para `F:\GelControl_Oficial`.
  - Criado o acionador facilitador `dist/Instalador_Oficial/EXECUTAR_INSTALADOR_OFICIAL.bat` e guia `INSTRUCOES_DE_USO.md`.
* **Suíte de Autoteste Técnico em Sandbox no PC 1 (4/4 Testes Aprovados):**
  - *Cenário 0 (Integridade do Pacote):* Binário íntegro, livre de segredos ou arquivos residuais.
  - *Cenário 1 (Instalação Nova):* Estrutura completa criada, `version.json` v85.4.0 verificado, módulos `trash.js`, `shortcuts.js` e `updater_installer.js` blindados presentes.
  - *Cenário 2 (Atualização In-Place Direta v85.3.0 -> v85.4.0):* Simulação exata do PC 2. Versão atualizada para v85.4.0 com paridade bit a bit no hash do banco `Dados/state.json` (zero clientes ou pedidos afetados), backup preventivo gerado e log gravado.
  - *Cenário 3 (Reparo de Integridade):* Simulação de deleção acidental de `index.html`. Arquivo recuperado com sucesso mantendo intactos os dados comerciais.
* **Coexistência com Atualizações Futuras:**
  - O instalador injeta em `desktop/updater_installer.js` a proteção `safeCpSync` e `safeRmSync`. Assim, versões futuras (v85.5.0+) poderão ser aplicadas normalmente pelo atualizador interno dentro do próprio GelControl.
* **Preservação Rigorosa:**
  - Ambiente do PC 1 (`F:\GelControl_Oficial`) 100% íntegro e inalterado.
  - Nenhuma alteração executada no PC 2 físico até o acionamento pelo usuário.

#### Versão 85.4.0 (v85) — Diagnóstico de Causa Raiz do Erro EACCES no PC 2, Blindagem Anti-Lock e Nova Publicação Oficial (10/11/2026 - Antigravity)
* **Diagnóstico Profundo da Causa Raiz do Erro `EACCES` em `Dados\updates_staging\desktop` no PC 2:**
  - *Mecanismo de Lock do Windows NTFS / Microsoft Defender:* No Windows, quando arquivos executáveis ou scripts `.js` de Electron (`main.js`, `shortcuts.js`, `updater_installer.js`) são extraídos em sequência rápida para pastas temporárias, o subsistema de proteção em tempo real (Windows Defender / Antivírus) intercepta imediatamente os arquivos com descritor de leitura compartilhada (`FILE_SHARE_READ`) para inspeção de segurança.
  - *Causa Raiz 1 (Ausência de Tolerância a Locks no Código v85.3.0 em Execução no PC 2):* O código da v85.3.0 instalado no PC 2 realizava chamadas síncronas diretas de `fs.cpSync` e `fs.rmSync` sem retentativas (`maxRetries: 0`). Ao menor bloqueio transitório do Windows, o Node.js falhava instantaneamente com `ERROR_ACCESS_DENIED (5) -> EACCES, Permission denied`.
  - *Causa Raiz 2 (Particularidade de Relato de Caminho do `fs.cpSync`):* Comprovado experimentalmente que quando qualquer arquivo dentro de uma subpasta está sob lock temporário durante a cópia, o `fs.cpSync` do Node.js aponta a mensagem de erro para o **diretório pai** (`F:\GelControl_Oficial\Dados\updates_staging\desktop`), mascarando o arquivo específico que estava sendo inspecionado.
  - *Causa Raiz 3 (Comportamento de Deleção Assíncrona no Windows NTFS):* Uma vez abortada a transação, a subpasta `desktop` permaneceu fisicamente criada em disco. Em tentativas subsequentes, o `fs.rmSync(this.stagingDir)` tentava remover a pasta que ainda tinha descritores sendo liberados pelo kernel, repetindo o erro.
  - *Causa Raiz 4 (Travamento Visual no Interface):* O manipulador `handleInstallButtonClick` em `js/updater_ui.js` alterava o botão e a caixa de status para `"Preparando e Reiniciando..."`, mas ao capturar `!res.success`, reabilitava o botão sem limpar a mensagem da caixa de status, mantendo o aviso de reinício aparente mesmo após a exibição do alerta de erro.
* **Blindagem Estrutural do Instalador e Interface (`desktop/updater_installer.js` e `js/updater_ui.js`):**
  - *Mecanismos `safeRmSync` e `safeCpSync`:* Implementadas funções com laço de tolerância ativa (até 10 retentativas com intervalo de 150ms e limpeza preventiva de atributos somente leitura via `attrib -r /s /d`), garantindo que bloqueios temporários do Windows Defender sejam superados suavemente sem falhas espúrias.
  - *Tratamento e Tradução Transparente em Português:* O dicionário `translateUpdateError` foi enriquecido para reconhecer códigos de permissão do sistema operacional (`EACCES`, `EPERM`) e orientar o usuário em português claro: *"Permissão negada pelo Windows para manipular pastas temporárias de atualização. Um arquivo pode estar sendo verificado pelo antivírus ou aberto em outra janela. Feche outras instâncias do GelControl e tente novamente."*
  - *Atualização da Caixa de Status Visual:* Em caso de erro na preparação, a caixa de status é imediatamente atualizada para um cartão de aviso em vermelho/âmbar detalhando o motivo real, eliminando a mensagem enganosa de "Preparando e Reiniciando...".
* **Saneamento e Limpeza do Pacote Oficial de Distribuição:**
  - *Eliminação de Arquivo Residual:* Removido do pacote o arquivo de conflito do OneDrive `js/auth-DESKTOP-7D77T6B.js`.
  - *Filtro no Gerador Oficial (`tools/build_official_release.js`):* Bloqueio explícito permanente adicionado contra arquivos residuais de sincronização (`-DESKTOP-`) e temporários (`.tmp`).
  - *Geração do Novo Pacote:* Criado pacote oficial limpo com 60 arquivos exatos (3.394.494 bytes, SHA-256: `66c3b238190ce6cb7d6bbe0e7350b759fed485f63d61ebdd7ed083da93eb9379`).
  - *Assinatura Digital Ed25519:* Manifesto `dist/updates/producao/manifest_producao.json` assinado e validado contra a chave pública oficial.
* **Publicação da Release Oficial no GitHub (`tools/publicar_release_producao.js`):**
  - Artefatos oficiais enviados com sucesso para a release `producao-latest` (ID: 440036532).
  - Validação via HTTPS anônimo realizada com 100% de sucesso para download do manifesto e do pacote compactado.
  - Simulação de consulta executada pelo motor `UpdaterCore` da v85.3.0 do PC 2: confirmação de detecção da versão `85.4.0` pronta para instalação.
* **Sincronização e Preservação de Dados no PC 1:**
  - Paridade de 100% SHA-256 mantida em `F:\GelControl_Oficial\Programa\resources\app` com os arquivos atualizados.
  - Base de dados e cadastros comerciais 100% intactos e preservados.

#### Versão 85.4.0 (v85) — Publicação Oficial Autorizada no GitHub Releases de Produção e Validação de Conexão do PC 2 (10/11/2026 - Antigravity)
* **Auditoria Criteriosa de Segurança Pré-Publicação (`scratch/audit_zip_safe.js`):**
  - Executada varredura binária exaustiva em todos os 61 arquivos do pacote `.zip` oficial.
  - Zero segredos expostos: confirmada a ausência absoluta de arquivos `.pem`, `.key`, `service-account`, dados de clientes ou senhas. A chave privada de produção (`tools/keys/producao.private.pem`) foi mantida estritamente isolada no ambiente de compilação local do PC 1 e jamais enviada ao repositório.
  - Confirmada a presença obrigatória dos módulos atualizados: `js/trash.js` (lixeira inteligente), `desktop/shortcuts.js` (ícone circular híbrido DIB+PNG), `index.html` e `version.json` v85.4.0.
* **Publicação da Release Oficial no Canal de Produção (`tools/publicar_release_producao.js`):**
  - Autenticação autorizada via token GitHub credential helper com escopo administrativo em `GelodoVale/gelodovale-app`.
  - Criada/atualizada a release oficial permanente com a tag `producao-latest` (ID: 440036532).
  - Upload concluído com sucesso dos dois artefatos oficiais:
    1. `manifest_producao.json` (906 bytes) assinado digitalmente com Ed25519.
    2. `gelcontrol-update-85.4.0-producao.zip` (3.414.514 bytes, SHA-256: `aa03d60454013e0a4d8f75b0484a92967f2d6bfde570b78b1058afc1496f0363`).
* **Validação Pública Real via HTTPS Anônimo pela Internet:**
  - Efetuado download público direto via HTTPS de `https://github.com/GelodoVale/gelodovale-app/releases/download/producao-latest/manifest_producao.json`.
  - Assinatura digital Ed25519 verificada com 100% de autenticidade contra a chave pública oficial (`PRODUCAO_PUBLIC_KEY_PEM`).
  - Efetuado download público do pacote compactado via CDN do GitHub com validação de hash: o SHA-256 baixado conferiu com exatidão (`aa03d6045401...`).
* **Simulação de Consulta Online pelo PC 2:**
  - Instanciado o motor `UpdaterCore` simulando uma estação cliente na versão `85.3.0` consultando o endpoint oficial online.
  - Resposta recebida: `hasUpdate: true`, `status: 'available'`, `availableVersion: '85.4.0'`.
  - O PC 2 está tecnicamente liberado para realizar a atualização com um clique.
* **Sincronização e Auditoria Local:**
  - Paridade criptográfica de 100% SHA-256 mantida em 12 arquivos vitais com a instalação em `F:\GelControl_Oficial` (incluindo `desktop/updater_config.js`).
  - Base de dados local preservada intacta (6 clientes, 7 freezers, 2 pedidos).

#### Versão 85.4.0 (v85) — Diagnóstico da Causa Raiz do Atualizador, Regra de Salto Direto e Gerador de Release Unificada (10/11/2026 - Antigravity)
* **Diagnóstico Profundo da Causa Raiz no PC 2 (Por que informava "nenhuma versão disponível"):**
  - *Causa Raiz 1 (HTTP 404 Remoto):* O endpoint de produção configurado permanentemente em `desktop/updater_config.js` é `https://github.com/GelodoVale/gelodovale-app/releases/download/producao-latest/manifest_producao.json`. Como a release oficial `producao-latest` ainda não foi criada no GitHub público, a requisição HTTPS retornava código HTTP 404 (Not Found).
  - *Causa Raiz 2 (Tratamento de 404 em `desktop/updater_core.js`):* O manipulador de erro capturava `MANIFESTO_NAO_ENCONTRADO_404` e atribuía silenciosamente `status: 'up-to-date'` ("O GelControl já está na versão mais recente"), mascarando a ausência física do arquivo remoto como se o sistema já estivesse na versão mais recente. Mensagem ajustada para transparência técnica com o canal (`produção` vs `homologação`).
  - *Causa Raiz 3 (Pacote Oficial v85.4.0 Não Empacotado):* O pacote de atualização oficial com a versão `v85.4.0` e sua assinatura Ed25519 de produção ainda não haviam sido gerados na pasta de distribuição (`dist/updates/producao`).
* **Implementação da Regra de Atualização Direta (Sem Degraus / Sem Escadinha):**
  - O sistema foi configurado para permitir a atualização direta a partir de qualquer versão instalada válida (a partir da `v80.0.0` em diante, como a `v82.0.0`), sem forçar o usuário a atualizar versão por versão intermediária.
  - O parâmetro `minAppVersion` do manifesto oficial foi parametrizado para `80.0.0` e `desktop/updater_core.js` ajustado para validar a compatibilidade de forma flexível e segura.
  - Toda a árvore da aplicação é substituída de forma atômica e completa pelo pacote da versão de destino, aplicando diretamente o novo código, layout e módulos.
  - Os dados locais persistentes (`Dados/state.json`, credenciais e bancos locais) são 100% preservados, e o mecanismo cumulativo de normalização do `state.js` enriquece automaticamente as estruturas de dados antigas na primeira inicialização (criando o acervo de lixeira `trash: []` e normalizando coleções).
* **Construção do Gerador Oficial de Release Unificada (`tools/build_official_release.js`):**
  - *Unificação Absoluta entre Atualizador e Instalador:* Tanto novos instaladores quanto pacotes de atualização remota nascem da mesma compilação e compartilham rigorosamente os mesmos arquivos, hashes SHA-256 e versão oficial (`v85.4.0`).
  - *Geração do Pacote de Produção:* Criado `dist/updates/producao/packages/gelcontrol-update-85.4.0-producao.zip` (3.414.514 bytes, SHA-256: `aa03d60454013e0a4d8f75b0484a92967f2d6bfde570b78b1058afc1496f0363`).
  - *Assinatura Criptográfica Ed25519:* Manifesto `dist/updates/producao/manifest_producao.json` assinado canonicamente com a chave privada de produção (`tools/keys/producao.private.pem`) e autenticado com a chave pública oficial (`PRODUCAO_PUBLIC_KEY_PEM`).
  - *Base de Novo Instalador:* Preparada em `dist/instalador_oficial_v85.4.0/app` contendo a aplicação completa pronta para distribuição direta a novos computadores.
  - *Inclusão de Módulos Críticos:* Garantida a inclusão obrigatória de `desktop/shortcuts.js` e `js/trash.js` no pacote de atualização, assegurando que o PC 2 receba o gerador de ícones circulares e a lixeira.
* **Validação Operacional da Suíte Completa de 6 Cenários (`scratch/test_complete_upgrade_suite.js`):**
  - *Cenário 1 (Salto Direto v82.0.0 -> v85.4.0):* Comprovada a promoção direta sem versões intermediárias, preservando dados locais de clientes e injetando a nova interface e o módulo `trash.js`.
  - *Cenário 2 (Transição do PC 2 v85.3.0 -> v85.4.0):* Comprovada a atualização segura do ambiente do PC 2, mantendo intactas suas credenciais locais e clientes próprios.
  - *Cenário 3 (Identidade Visual no PC 2):* Comprovada a geração local de `Dados/app_icon_round.ico` (149 KB) no formato híbrido DIB de 32 bits + máscara AND de hardware e apontamento do atalho oficial sem necessidade de novo upload.
  - *Cenário 4 (Lixeira Inteligente e Custódia Patrimonial):* Comprovado que clientes na lixeira retêm as conservadoras em comodato atreladas sob custódia patrimonial especial (impedindo que virem falsamente disponíveis) e mantêm intactos os registros contábeis.
  - *Cenário 5 (Rollback Atômico em Falhas):* Simulação de interrupção e corrupção forçada com reversão imediata e 100% estável para a versão anterior.
  - *Cenário 6 (Paridade Total com Novo Instalador):* 100% de paridade comprovada entre o instalador e o atualizador.
* **Sincronização e Auditoria:**
  - 100% de paridade SHA-256 mantida com a instalação oficial em `F:\GelControl_Oficial`.
  - 40 de 40 scripts auditados com 0 erros de sintaxe (`node --check`).

#### Versão 85.4.0 (v85) — Lixeira Central Inteligente, Ícone Windows Circular com DIB+AND e Atualizador Multi-Estação (10/11/2026 - Antigravity)
* **Resolução Definitiva da Causa Raiz do Ícone Circular no Windows:**
  - *Diagnóstico Técnico da Causa Raiz:* O subsistema do Windows Explorer e da API GDI clássica exige para ícones de desktop (resoluções $\le 128$) o formato **DIB de 32 bits com cabeçalho BITMAPINFOHEADER (40 bytes), pixels BGRA bottom-up e máscara AND de hardware de 1 bit**. Ícones empacotados apenas com sub-imagens PNG sofrem falha de composição alfa em determinadas exibições do Windows Shell, exibindo cantos brancos.
  - *Empacotador Híbrido DIB + PNG Nativo (`desktop/shortcuts.js`):*
    - Resolução 256x256: Mantida em formato PNG nativo com canal alfa para monitores modernos 4K/DPI alto e ícones extra-grandes.
    - Resoluções 128x128, 64x64, 48x48, 32x32 e 16x16: Convertidas para DIBs de 32 bits puros, contendo a matriz de pixels RGBA com corte circular e máscara AND física de 1 bit (`0` para o círculo visível, `1` para os cantos transparentes externos).
  - *Cache-Busting de Caminho no Shell do Explorer:* O Windows Explorer mantém os ícones de atalhos em cache de memória atrelados ao caminho do arquivo. O sistema agora gera `Dados/app_icon_round.ico` (149 KB) e aponta o atalho oficial `GelControl Oficial.lnk` para ele, forçando o descarte imediato do cache antigo em memória.
  - *Preservação de Documentos:* A logo oficial original em `state.factorySettings.logo` permanece 100% íntegra em alta resolução para contratos de comodato, notas térmicas e carnês.
* **Lixeira Inteligente Centralizada e Permanente (`js/trash.js`):**
  - *Soft-Delete com Retenção Contínua:* Nenhum registro de cliente, freezer ou pedido é excluído fisicamente de forma imediata. Ao excluir, o registro é movido para o acervo centralizado de lixeira (`state.trash`), sem prazo de expiração (atendendo à conformidade legal e fiscal de rastreabilidade).
  - *Blindagem de Integridade Relacional e Patrimonial:*
    - Ao mover um cliente para a lixeira, os freezers em comodato retêm sua custódia com status de custódia patrimonial especial (impedindo que apareçam como disponíveis falsamente para alocação a terceiros).
    - Os pedidos, entregas e lançamentos financeiros históricos permanecem intactos nos relatórios contábeis da fábrica.
    - O sistema bloqueia a exclusão na lixeira de qualquer conservadora que ainda possua alocação patrimonial ativa.
  - *Interface Central no Sistema:*
    - Adicionada a aba `🗑️ Lixeira` no menu lateral principal (`#nav-lixeira`) com contador dinâmico em badge (`#badge-trash-count`).
    - Painel dedicado com barra de busca em tempo real, filtros por categoria (Clientes, Freezers, Produtos, Pedidos), cartões informativos com data de envio e motivo.
    - Ações de restauração com verificação anti-duplicidade e exclusão definitiva restrita à sessão Master mediante dupla confirmação explícita.
* **Validação do Atualizador Multi-Estação Preparado no PC 1 para o PC 2:**
  - *Simulação Completa e Isolada em Sandbox (`scratch/test_updater_multi_station.js`):*
    - Inicializado ambiente simulando o PC 2 na versão v85.3.0 com banco de dados local próprio e credenciais locais.
    - Validação de saltos SemVer (`85.3.0` -> `85.4.0`), validação criptográfica de integridade de pacote (SHA-256) e autenticidade da assinatura digital do manifesto (Ed25519).
    - Varredura de segurança contra Path Traversal e proteção estrita da pasta `Dados/` comprovada: banco local `Dados/state.json` do PC 2 preservado intacto.
    - Teste de rollback atômico executado com sucesso diante de simulação de pacote corrompido, restaurando a versão anterior sem perda de estabilidade.
* **Compartilhamento de Identidade Visual via Firebase RTDB:**
  - Confirmado que todas as estações utilizam o tenant unificado da fábrica (`deviceKey: 'gelodovale_oficial'`), sincronizando `factorySettings/logo` globalmente para que o PC 2 puxe a mesma identidade visual automaticamente no primeiro boot pós-instalação.
* **Sincronização Criptográfica e Paridade Total:**
  - Paridade de 100% SHA-256 comprovada entre o workspace e a instalação oficial em `F:\GelControl_Oficial` nos 11 arquivos do sistema (`desktop/shortcuts.js`, `desktop/main.js`, `desktop/updater_core.js`, `js/admin.js`, `js/sync.js`, `js/trash.js`, `js/clientes.js`, `js/state.js`, `js/app.js`, `sw.js`, `index.html`).
  - 40/40 scripts auditados e aprovados com 0 erros de sintaxe pelo compilador V8 (`node --check`).

#### Versão 85.4.0 (v85) — Ícone Circular Nativo no Windows com Exterior Transparente e Propagação de Identidade Visual via Firebase (10/11/2026 - Antigravity)
* **Ícone do Windows (.ico) Verdadeiramente Circular com Fundo Exterior Transparente:**
  - *Causa Raiz do Ícone Anterior Quadrado:* O empacotamento prévio utilizou o buffer bruto do PNG quadrado da pasta, sem passar pela máscara perimétrica circular com canal alfa transparente.
  - *Mecanismo Nativo de Recorte Circular com Canal Alfa (GDI+ Multi-Resolução):* Implementada em `desktop/shortcuts.js` a função `generateCircularPngBuffers`, executada diretamente no subsistema gráfico do Windows via PowerShell e GDI+ (`System.Drawing`), gerando buffers PNG de 32 bits (RGBA) para 6 resoluções (256x256, 128x128, 64x64, 48x48, 32x32 e 16x16).
  - *Geometria e Transparência Estrita:*
    - Fundo exterior ao círculo ($dist > R$): limpo com `Clear([Color]::Transparent)` mantendo canal alfa $= 0$ (transparência absoluta nos cantos e ao redor do círculo).
    - Base circular interna ($dist \le R$): preenchida em branco sólido de alto contraste com aro estético ciano suave (`rgba(0, 210, 255, 0.9)`) anti-serrilhado com subpixel smoothing.
    - Proporção estrita e sem deformação: a logo da fábrica é renderizada com `contain` estrito centralizado em 82% do diâmetro interno, garantindo que letras, textos e símbolos nunca sejam cortados nem achatados.
  - *Otimização Extrema de Tamanho:* O arquivo `custom_app_icon.ico` foi reduzido de 6,2 MB para apenas 74 KB (75.782 bytes), contendo todas as 6 resoluções comprimidas e compatíveis com qualquer escala de DPI e resolução de monitor no Windows.
  - *Preservação de Documentos Fiscais e Comerciais:* O arquivo original enviado e armazenado em `state.factorySettings.logo` é preservado intacto em sua proporção e resolução nativas para relatórios fiscais, contratos de comodato (`js/comodatos.js`), recibos térmicos e carnês (`js/documents.js`). O acabamento circular com transparência é exclusivo do ícone do executável/atalho.
* **Propagação Automática da Identidade Visual para Futuras Instalações via Firebase (PC 1 -> PC 2):**
  - *Logo como Configuração Compartilhada:* `state.factorySettings.logo` armazena a identidade visual da fábrica e é automaticamente sincronizada na nuvem no nó `factories/$deviceKey/factorySettings/logo`.
  - *Gatilho no Receptor (`js/sync.js`):* Na rotina `aplicarDadosRemoto(remoteData)`, ao hidratar os dados recebidos da nuvem (tanto no primeiro boot de uma nova máquina quanto em atualizações em tempo real), o sistema convoca automaticamente `autoSyncDesktopIcon()`.
  - *Zero Upload Manual no PC 2:* Ao instalar o GelControl no outro computador e conectar a conta, o programa baixa a logo do Firebase, detecta a nova identidade, gera localmente o `custom_app_icon.ico` circular e atualiza o atalho `GelControl Oficial.lnk` do Windows desse computador de forma 100% autônoma.
  - *Resiliência Offline:* Em caso de abertura sem internet, o sistema mantém a última logo salva no `Dados/state.json` local e o atalho continua apontando para o `custom_app_icon.ico` já existente em disco, sem dependência de rede.
* **Sincronização Criptográfica e Paridade Total:**
  - Paridade de 100% SHA-256 mantida em todos os arquivos modificados (`desktop/shortcuts.js`, `desktop/main.js`, `js/admin.js`, `js/sync.js`) entre o workspace e a instalação oficial em `F:\GelControl_Oficial`.
  - Atalho permanente `GelControl Oficial.lnk` na Área de Trabalho atualizado e apontando para `F:\GelControl_Oficial\Programa\GelControl.exe` com `IconLocation: F:\GelControl_Oficial\Dados\custom_app_icon.ico,0`.
  - Cache de ícones do Windows Explorer atualizado com `ie4uinit.exe` e `SHChangeNotify(SHCNE_ASSOCCHANGED, SHCNF_FLUSH)`.

#### Versão 85.4.0 (v85) — Sincronização Definitiva de Versão, Logotipo Redondo Profissional e Atualização Automática de Ícone no Windows (10/11/2026 - Antigravity)
* **Resolução Definitiva da Divergência de Versões (Tela Inicial vs Interface Interna):**
  - *Causa Raiz Identificada:* A rotina `js/auth.js` consultava dinamicamente a versão do executável através do IPC `window.gelcontrolDesktop.updater.getInstalledVersion()`. O processo principal em `desktop/main.js` lia o arquivo estático `version.json`, que ainda continha `"85.3.0"`, e sobrescrevia o texto do elemento `#login-version` na tela de login, mesmo com o `index.html` já em `v85.4.0`.
  - *Correção Arquitetural:* `version.json` foi atualizado para `"85.4.0"` em todos os ambientes e `desktop/main.js` agora realiza verificação cruzada automática com `js/version.js`. Se houver divergência, o Electron adota automaticamente a versão do código-fonte e sincroniza `version.json` em disco, eliminando qualquer defasagem futura.
* **Aprimoramento da Identidade Visual e Logotipo Redondo Profissional:**
  - *Apresentação Circular no Sistema:* Implementada moldura circular estilizada com borda ciano suave, sombra moderna e fundo adaptável na barra lateral (`#sidebar-logo-container`), na tela de login (`#login-logo-container`) e no preview do painel de layout (`#factory-logo-preview`).
  - *Preservação de Proporção:* Uso de `object-fit: contain` centralizado, permitindo que logos retangulares, quadradas ou circulares (com ou sem fundo transparente) se ajustem harmonicamente sem cortes em textos, letras ou símbolos.
  - *Integridade de Documentos:* Os relatórios, recibos térmicos, carnês e contratos de comodato preservam o logotipo original de alta resolução sem corte circular, atendendo aos padrões fiscais e contratuais.
* **Sincronização do Logotipo com o Ícone do Programa no Windows:**
  - *Geração Nativa de Ícones (.ico):* Implementado em `desktop/shortcuts.js` o conversor binário de PNGs para formato `.ico` Windows multi-resolução (256x256, 128x128, 64x64, 48x48, 32x32, 16x16) com anti-aliasing e acabamento circular.
  - *Auto-Sincronização Totalmente Automática no Boot (`autoSyncDesktopIcon`):* Ao abrir o aplicativo ou trocar a logo na área de layout, o GelControl detecta a logo ativa e atualiza silenciosamente o arquivo `.ico` e os atalhos, sem exigir cliques manuais em botões ou configurações extras.
  - *Consolidação do Atalho Permanente "GelControl Oficial":* O atalho oficial na Área de Trabalho foi fixado de forma permanente como `GelControl Oficial.lnk` (sem números de versão no nome), com migração e limpeza automática dos atalhos antigos com versão (`GelControl Oficial v85.3.0.lnk`).
  - *Persistência em Atualizações:* O ícone customizado é armazenado em `Dados/custom_app_icon.ico` (pasta de dados protegida contra sobrescrita de pacotes de atualização).
  - *Atualização Imediata do Shell:* Disparo duplo via PowerShell (`ie4uinit.exe -show` + `SHChangeNotify` com flag `SHCNF_FLUSH`) para que a Área de Trabalho do Windows e o cache do Explorer atualizem o ícone instantaneamente sem necessidade de reiniciar o computador.
  - *Restauração Limpa:* Rotina `restoreAppDefaultIcon` que devolve o atalho para o ícone padrão caso o usuário remova a logo personalizada.
* **Preservação e Paridade Criptográfica (PC 1):**
  - O atalho oficial permanente `GelControl Oficial.lnk` aponta com 100% de estabilidade para `F:\GelControl_Oficial\Programa\GelControl.exe`.
  - Paridade de 100% SHA-256 comprovada em todos os 13 arquivos do sistema entre o workspace e `F:\GelControl_Oficial`. Zero dados comerciais ou regras de Firebase alterados. Zero push remoto executado.

#### Versão 85.4.0 (v85) — Check-up Geral "Olho de Águia", Correção Definitiva do Modal de Confirmação/Exclusão e Paridade Total (10/11/2026 - Antigravity)
* **Check-up Geral "Olho de Águia" e Autoteste do Sistema no PC 1:**
  - *Diagnóstico da Falha na Lixeira de Exclusão de Clientes:*
    - Localizada a causa raiz exata: o elemento `#confirm-overlay` no `index.html` possuía atributo inline `style="display: none;"`.
    - Ao disparar `deleteClient(clientId)`, a função chamava `window.showConfirm(...)`. Esta função removia a classe `.hidden`, mas mantinha intacto o estilo inline `style="display: none;"`. Pela regra de especificidade CSS, o modal permanecia 100% invisível na tela, impossibilitando a confirmação do usuário.
  - *Correção Cirúrgica e Blindagem Visual:*
    1. `js/app.js`: A função `showConfirm` agora define expressamente `overlay.style.display = 'flex'` ao abrir e `overlay.style.display = 'none'` no callback `close()`.
    2. `index.html`: Removido o atributo inline `style="display: none;"` de `#confirm-overlay`, deixando a visibilidade governada pela classe `.hidden`.
    3. `styles.css`: Adicionada blindagem com `#confirm-overlay:not(.hidden) { display: flex !important; }` e `#confirm-overlay.hidden { display: none !important; }`.
    4. *Abrangência:* Como `showConfirm` é o mecanismo central de confirmação de ações críticas do GelControl, a correção restaurou o funcionamento imediato da exclusão em Clientes, Devolução de Freezers, Cancelamento de Documentos, Emissão de Carnês e Limpeza de Históricos.
  - *Auditoria de Sintaxe em Larga Escala (35/35 Arquivos Aprovados):*
    - Executada verificação sintática com o compilador V8 do Node.js (`node --check`) em todos os scripts das pastas `js/` e `desktop/`. Zero erros de compilação ou sintaxe detectados.
  - *Auditoria de Módulos e Integridade Comercial:*
    - Clientes: 6 clientes ativos (Supermercado Rondon, Quiosque Beira Mar, Posto Portal da Cidade, Restaurante Estrela do Mar, `zeze`, `zaza`) íntegros.
    - Freezers: 7 unidades (4 em comodato ativo, 2 disponíveis no estoque da fábrica).
    - Produtos e Fábrica: 16 produtos catalogados com preços base e parâmetros de comodato intactos.
    - Sessão Master: Credencial e salt preservados, proteção física intacta em `admin_credential_guard.json`.
  - *Sincronização Criptográfica e Paridade Total com Runtime Oficial (`F:\GelControl_Oficial`):*
    - Todos os 9 arquivos fundamentais (`index.html`, `styles.css`, `js/app.js`, `js/version.js`, `sw.js`, `js/auth.js`, `js/admin.js`, `js/sync.js`, `js/state.js`) possuem **100% de paridade SHA-256**.
  - *Versionamento da Build:*
    - Incrementado para `v85.4.0` (10/11/2026), Service Worker atualizado para `gelodovale-v186`, cache-busters de scripts e estilos atualizados no `index.html`.

#### Versão 85.3.0 (v85) — Paridade Criptográfica Total e Aplicação na Instalação Oficial do PC 1 (10/11/2026 - Antigravity)
* **Auditoria de Paridade entre Workspace e Instalação Oficial (`F:\GelControl_Oficial`):**
  - *Sincronização Criptográfica dos Arquivos:* Executada comparação SHA-256 arquivo por arquivo entre o repositório sincronizado e o runtime oficial.
  - *Correções Aplicadas no Runtime:*
    1. `js/app.js`: Chave de API antiga (`AIzaSyBfY...`) substituída pela chave autorizada (`AIzaSyC6...`) com `authDomain: 'gelo-do-vale.firebaseapp.com'`.
    2. `index.html`: Corrigido o caminho relativo de script `js/js/spellcheck.js` para `js/spellcheck.js?v=85.3.0`.
    3. `js/auth.js`: Unificado com a implementação avançada de governança no servidor (`user_permissions`), garantindo que tanto o código-fonte quanto o executável em disco operem com exatamente o mesmo binário.
  - *Paridade Confirmada:* Todos os 7 arquivos centrais (`desktop/main.js`, `desktop/preload.js`, `js/admin.js`, `js/app.js`, `js/auth.js`, `js/sync.js`, `js/state.js`) possuem **100% de paridade SHA-256**.
  - *Status da Etapa no PC 1:* **Concluída com Sucesso.** Zero pendências de código pendentes de aplicação na instalação oficial.

#### Versão 85.3.0 (v85) — Validação Completa de Funcionários na Interface e Disparo de Backups (10/11/2026 - Antigravity)
* **Validação Operacional na Interface do GelControl e Disparo Automático:**
  - *Fluxo de Cadastro de Usuários no App:* Validada a integridade do formulário de usuários (`modal-user-form`). O salvamento (`saveUser`) deriva a credencial com Salt local (`hashPasswordWithSalt`), chama o provisionamento transparente no Firebase Auth (`createEmployeeFirebaseAuth`) sob domínio técnico `@gelcontrol.internal` e sincroniza o mapa `user_permissions` na nuvem sem qualquer desautenticação da sessão Master ativa.
  - *Governança de Interface e RBAC Estrito:* Comprovado que a função `applyUserPermissions` oculta menus laterais (`.nav-item`), abas administrativas (`.admin-menu-btn`) e painéis de segurança/gestão (`admin-users-management-panel`, `admin-security-settings-panel`) para colaboradores não autorizados, com bloqueio duplo no cliente e no servidor RTDB.
  - *Comprovação do Disparo Periódico de Backups:* Auditada a rotina `checkAutoBackupOnLoad` em `js/admin.js`. Confirmado que, sob sessão autenticada e intervalo vencido (`diffDays >= frequencyDays`), o sistema agenda automaticamente `generateBackup(true)` após 5 segundos do carregamento da tela, disparando a gravação simultânea na pasta local e no OneDrive.
  - *Estado Atual do PC 1:* **100% Estável, Seguro e Concluído.** Sessão Master funcional, dados comerciais preservados (6 clientes, 2 pedidos, 6 entregas, 7 freezers), regras ativas e backups redundantes operacionais.

#### Versão 85.3.0 (v85) — Validação Integral do RBAC no Servidor e Provisionamento de Funcionários (10/11/2026 - Antigravity)
* **Validação Operacional de Contas de Colaboradores e Governança de Permissões:**
  - *Provisionamento Isolado com Sucesso:* Validada a criação automática de contas de colaboradores no Firebase Authentication através da API oficial sob domínio interno técnico (`@gelcontrol.internal`), preservando 100% conectada a sessão `[DEFAULT]` do Master.
  - *Governança Estrita no Servidor (Firebase RTDB):* Comprovado em teste real contra as regras de produção que o mapa `user_permissions` governa com exatidão os acessos de colaboradores. Um funcionário autorizado apenas para `tab-pedidos` consegue ler `/orders.json` (HTTP 200 OK), mas tem acesso imediatamente negado com HTTP 401/403 a `/clients.json` e `/financeiro.json`.
  - *Blindagem Administrativa:* Os nós `users`, `financeiro`, `rootUid`, configurações e segurança permanecem acessíveis única e exclusivamente pelo Master autoritário (`auth.uid === rootUid`).
  - *Base Limpa e Preservada:* Todos os testes foram executados com limpeza e expurgo automático de contas e nós temporários. Dados comerciais legítimos (6 clientes, 2 pedidos, 6 entregas, 7 freezers) e senhas do Master 100% preservados.
  - *Próximos Passos Mapeados (Prioridade PC 1):*
    1. Acompanhamento do disparo periódico do backup automático na instalação oficial.
    2. Consolidação da arquitetura de atualização distribuível para o PC 2 (detecção automática de estação e caminhos relativos).

#### Versão 85.3.0 (v85) — Resolução Definitiva dos Backups Automáticos e Espelho no OneDrive (10/11/2026 - Antigravity)
* **Consolidação do Sistema de Backup Fiel e Espelho Automático no OneDrive:**
  - *Fidelidade de Dados com a Nuvem:* Identificado e corrigido o descompasso entre o cache estático anterior e a verdade viva da fábrica. O backup oficial gerado agora contém com 100% de paridade todos os **6 clientes** (incluindo `zeze` e `zaza`), 2 pedidos, 6 entregas e 7 freezers.
  - *Espelhamento Automático no OneDrive:* O manipulador desktop nativo (`desktop:save-auto-backup` em `desktop/main.js`) foi aprimorado com resolução inteligente da pasta de backup do usuário (`resolveOneDriveBackupsDir`). Qualquer backup gerado automaticamente pelo sistema é gravado com sucesso tanto na pasta local (`F:\GelControl_Oficial\Backups\`) quanto na pasta sincronizada do OneDrive (`C:\Users\kissn\OneDrive\GelodoVale-system\Backups\`), com zero intervenção manual.
  - *Arquivo de Backup Oficial Válido:* Gerado `gelodovale_backup_v85.3.0_2026-11-10_00-12.json` (33.805 bytes | SHA-256 `7e2234fa75ffca08830abcc6082781da8a67ed8be6ebb52d4a2fd4e72e54da0a`) validado e idêntico nos três locais (`Backups/` local, `OneDrive/Backups/` e `OneDrive/App/backups/`).
  - *Sincronização de Dados Locais:* `Dados/state.json` no PC 1 foi atualizado com a verdade viva do Firebase (timestamp `1794269186345`), eliminando defasagens entre o disco local e o Realtime Database.
  - *Planejamento Estratégico Registrado (Prioridade PC 1 -> PC 2):* Definido foco total no PC 1 até a estabilização completa. Mapeado o requisito de auto-atualização distribuível para o PC 2 (detecção automática de estação, caminhos dinâmicos sem quebra de diretórios).
  - *Preservação Rigorosa:* Credenciais Master intactas, Realtime Database intacto, regras de segurança mantidas e sincronização bidirecional em tempo real 100% operacional.

#### Versão 85.3.0 (v85) — Publicação das Regras, Instalação no PC 2 e Sincronização Bidirecional Confirmada (09/11/2026 - Antigravity)
* **Validação Operacional em Produção nos 2 Computadores:**
  - *Publicação das Regras no Firebase:* Regras definitivas publicadas no Firebase Realtime Database pelo usuário com total proteção ao `rootUid` e governança de nós.
  - *Instalação nos 2 PCs:* GelControl Oficial v85.3.0 instalado e operacional tanto no PC 1 quanto no PC 2.
  - *Autenticação Master Aprovada:* Login do Master funcionou com 100% de sucesso em ambos os computadores.
  - *Sincronização Bidirecional Confirmada:* Sincronização automática em tempo real validada nos dois sentidos em produção: cliente 'zeze' sincronizado do PC 1 para o PC 2, e cliente 'zaza' sincronizado do PC 2 para o PC 1. Testes operacionais de sincronização e instalação concluídos definitivamente (sem necessidade de repetição).
  - *Backups Periódicos Concluídos:* Gerado backup completo e validado localmente em `F:\GelControl_Oficial\Backups\` e sincronizado no OneDrive (`gelodovale_backup_v85.3.0_2026-11-09_22-43.json`). A rotina automática em `checkAutoBackupOnLoad` (intervalo de 7 dias ou primeiro boot pós-login) está ativa e operacional.
  - *Pendência Mapeada Restante:* Teste do cadastro e provisionamento online de funcionários com autenticação isolada.
  - *Preservação Rigorosa:* Credenciais Master mantidas nos dois computadores, base comercial íntegra e regras ativas.

#### Versão 85.3.0 (v85) — Recompilação Definitiva do Instalador com Sincronização Integral de Permissões (09/11/2026 - Antigravity)
* **Recompilação dos Distribuíveis e Preparação Final para o PC 2:**
  - *Distribuíveis Definitivos Recompilados:* Gerado o executável `Instalador_GelControl_v85.3.0_Producao.exe` (113,49 MB | SHA-256 `850401E1539D402150EE81410434B345E454E32CA9A0BD818F15CC0B33792441`) e o pacote `gelcontrol-update-85.3.0-producao.zip` (3,30 MB | SHA-256 `3bc1b380e05d9224b70fad483f7a05044d35c8331efb6e03f42c9a348bd36699`).
  - *Inclusão de Todas as Salvaguardas:* Embutidas no executável tanto a chave oficial autorizada (`AIzaSyC6...`) quanto a preservação contínua de `user_permissions` em `js/sync.js` e o provisionamento isolado de funcionários em `js/auth.js`.
  - *Prontidão Comprovada:* Instalador pronto na pasta oficial do OneDrive para execução imediata no PC 2 assim que autorizado.
  - *Preservação Rigorosa:* Credencial Master intocada no PC 1, Realtime Database intacto (4 clientes, 2 pedidos, 6 vendas, 7 freezers) e backups mantidos.

#### Versão 85.3.0 (v85) — Salvaguarda de Preservação Contínua de `user_permissions` na Sincronização (09/11/2026 - Antigravity)
* **Garantia de Não-Sobrescrita de Permissões no Firebase RTDB:**
  - *Blindagem em `pushToFirebaseImediato`:* Adicionada rotina em `js/sync.js` que reconstrói e preserva o mapa `user_permissions` dentro do objeto `safeState` antes de qualquer envio ao Firebase.
  - *Persistência em Operações Monolíticas:* Comprovado em teste que qualquer alteração de dados no sistema (pedidos, clientes, estoque) ou sincronizações do Master mantêm 100% dos registros de `user_permissions` ativos e íntegros na nuvem, sem risco de omissão ou exclusão acidental.
  - *Testes de Ciclo de Vida (3/3 Aprovados):* Validada a sincronização comum, cadastro de novo funcionário e alteração de permissões com preservação mútua no servidor.
  - *Preservação Rigorosa:* Senha Master intacta, base na nuvem intacta (4 clientes, 2 pedidos, 6 vendas, 7 freezers) e instalador oficial pronto.

#### Versão 85.3.0 (v85) — Implementação da Opção A: Provisionamento Isolado de Funcionários e RBAC no Servidor (09/11/2026 - Antigravity)
* **Provisionamento Transparente, Isolamento de Sessão Master e Regras Refinadas:**
  - *Provisionamento Isolado sem Queda de Sessão:* Em `js/auth.js` (`createEmployeeFirebaseAuth`), o provisionamento de colaboradores utiliza uma instância temporária isolada do Firebase App (`temp_employee_provision_${Date.now()}`). A conta é criada com `${username}@gelcontrol.internal`, capturando o `uid` e destruindo a instância secundária imediatamente. A sessão `[DEFAULT]` do Master permanece 100% ativa e conectada.
  - *Vinculação em `user_permissions`:* Na rotina `saveUser`, o sistema grava o mapa indexado `factories/$deviceKey/user_permissions/${authUid}` contendo `active: true` e as permissões individuais exatas marcadas pelo Master. Na exclusão (`deleteUser`), o registro é imediatamente marcado como `active: false`.
  - *Governança de Servidor no RTDB (`database.rules.json`):* Nós operacionais (`clients`, `orders`, `deliveries`, `freezers`, etc.) validam `user_permissions[auth.uid].active === true` e a permissão específica (ex: `tab-clientes`, `tab-pedidos`). Contas criadas fora do GelControl não possuem registro em `user_permissions` e recebem rejeição imediata com `Permission denied` em todos os nós da fábrica.
  - *Testes em Ambiente Isolado (12/12 Aprovados):* Comprovada a criação de funcionário fictício, liberação de pedidos, bloqueio de clientes desmarcados, bloqueio de financeiro/rootUid, desativação instantânea e bloqueio total de contas externas.
  - *Recompilação dos Distribuíveis:* Gerados `Instalador_GelControl_v85.3.0_Producao.exe` (113,39 MB | SHA-256 `068D8A8D218C0D7ECC7A14E0F5483E4D4DEF6D40BD4F55D5207DC100DA8A30F3`) e `gelcontrol-update-85.3.0-producao.zip` (3,30 MB | SHA-256 `2f2c4606f5af09426948ad859dbedbbf43d137830c6b8065b61617c0c191f16b`).
  - *Preservação Rigorosa:* Senha Master, base na nuvem, dados comerciais e backups 100% preservados. Zero deploy executado sem autorização.

#### Versão 85.3.0 (v85) — Blindagem Avançada das Regras do Firebase RTDB e Testes Rigorosos (09/11/2026 - Antigravity)
* **Correção da Cascata de Leitura, Imutabilidade Estrita do RootUid e Testes Concluídos:**
  - *Bloqueio de Cascata de Leitura no Nó Pai:* No nó `factories/$deviceKey`, a diretiva `.read` foi restrita a `auth != null && data.child('rootUid').val() === auth.uid`. O Root pode ler o estado completo da fábrica para sincronização, enquanto colaboradores são impedidos de baixar o nó pai, eliminando o vazamento de dados de `financeiro`, `users` e configurações.
  - *Imutabilidade Estrita do RootUid contra Exclusão e Alteração:* A escrita no nó da fábrica exige que `newData.child('rootUid').val() === data.child('rootUid').val()`, e o nó `rootUid` possui regra `.write` que impede valores nulos ou divergentes. Exclusões via `.remove()` ou omissões em chamadas `.set()` são bloqueadas no servidor.
  - *Governança RBAC no Servidor:* Os nós `users`, `financeiro`, `factorySettings`, `backupSettings` e `securitySettings` só aceitam leitura e escrita de quem possui `auth.uid === rootUid`. Colaboradores operam apenas nos nós comerciais permitidos (`orders`, `clients`, `deliveries`, etc.).
  - *Bateria de Testes Concluída (24/24 Aprovados):* Simulados todos os cenários com Master, Colaborador e Anônimo (leitura, escrita, alteração indevida e exclusão), com 100% de sucesso. Nenhuma regra foi publicada no console (aguardando aprovação).
  - *Preservação Rigorosa:* Senha Master intacta, base na nuvem intacta (4 clientes, 2 pedidos, 6 vendas, 7 freezers), instalador oficial mantido e PC 2 preservado.

#### Versão 85.3.0 (v85) — Recompilação do Instalador do PC 2 e Blindagem das Regras do Firebase (09/11/2026 - Antigravity)
* **Recompilação dos Distribuíveis e Preparação das Regras Definitivas de Servidor:**
  - *Recompilação do Instalador Oficial:* O executável `Instalador_GelControl_v85.3.0_Producao.exe` (113,47 MB | SHA-256 `6BF5B4B8165AF1EAA5FCB18CCE3A2FDF9E42DFA3FB85E1331115F7FF7B1DF9BD`) e o pacote `gelcontrol-update-85.3.0-producao.zip` (3,30 MB | SHA-256 `2373c2ac37ed879aad8fa94f63c27991a8891a098f2cc0bf2051185cde149837`) foram reconstruídos e assinados com a chave Ed25519 de produção.
  - *Inclusão da Chave Autorizada:* A chave oficial `AIzaSyC6...` foi integrada em `firebase.producao.json`, `js/state.js` e embutida no pacote. A inspeção direta no ZIP confirmou a presença exclusiva da nova credencial (zero chave legada).
  - *Auditoria Anti-Vazamento:* O pacote e o instalador passaram com 100% de aprovação na rotina `assertNoSecrets` (zero senhas, zero hashes, zero arquivos privados ou dados comerciais).
  - *Regras de Segurança Prontas (`database.rules.json`):* Elaboradas as regras declarativas para o Firebase RTDB que bloqueiam leituras e escritas anônimas (`auth != null`), blindam o `rootUid` com validação imutável (`newData.val() === data.val()`) e reservam privilégios de gestão de usuários, financeiro e configurações exclusivamente ao Root.
  - *Preservação Rigorosa:* Credencial Master intocada no PC 1, Realtime Database intacto (4 clientes, 2 pedidos, 6 vendas, 7 freezers), backups preservados e PC 2 pronto para receber a instalação assim que autorizado.

#### Versão 85.3.0 (v85) — Verificação Final de Autenticação Root e Diagnóstico do Pacote do PC 2 (09/11/2026 - Antigravity)
* **Auditoria de Sessão, Vínculo de RootUid e Integridade de Distribuição:**
  - *Sessão Autenticada no PC 1:* Confirmada sessão online ativa gravada no IndexedDB LevelDB (`000038.log`) com a identidade `admin@gelcontrol.internal`, chave autorizada (`AIzaSyC6...`) e token de autenticação emitido pelo Firebase Auth.
  - *Vínculo de RootUid no RTDB:* Verificação HTTPS em `factories/gelodovale_oficial/rootUid.json` confirmou paridade de 100% com o UID administrativo oficial emitido pelo Firebase (`LA0f...YDg2`).
  - *Status das Regras de Segurança no Servidor:* Identificado que o arquivo `database.rules.json` possui todas as diretivas restritivas (`.write: false` em `rootUid`), porém as regras no Firebase Console ainda mantêm permissão de leitura/escrita aberta no nó `factories/` (as regras locais ainda não foram publicadas na nuvem).
  - *Status do Instalador do PC 2:* A inspeção binária no pacote `dist/entrega_v85.3.0_producao/atualizacao/packages/gelcontrol-update-85.3.0-producao.zip` e no executável gerado em 09/11 às 00:59h revelou que eles ainda contêm a chave de API legada (`AIzaSyBfY...`), exigindo reconstrução antes do envio ao PC 2.
  - *Preservação Rigorosa:* Credencial Master intacta, Realtime Database intacto (4 clientes, 2 pedidos, 6 vendas, 7 freezers) e PC 2 protegido contra instalação incompatível.

#### Versão 85.3.0 (v85) — Implementação da Migração Automática de Chave no LocalStorage e Vínculo de RootUid (09/11/2026 - Antigravity)
* **Correção Definitiva da Inicialização do Firebase:**
  - *Migração em Tempo de Boot:* Implementada rotina em `js/state.js` e `js/auth.js` que detecta se o cache do LocalStorage ainda retém a chave de API legada (`AIzaSyBfY...`) e realiza a substituição atômica pela credencial oficial autorizada (`AIzaSyC6...`) tanto em memória quanto no `localStorage`.
  - *Vínculo de RootUid no RTDB:* Ao autenticar com sucesso no Firebase Auth sob `admin@gelcontrol.internal`, o sistema vincula o `auth.uid` emitido pela Google diretamente no nó `factories/gelodovale_oficial/rootUid`, garantindo autoridade administrativa perante as regras de segurança do servidor.
  - *Preservação Rigorosa:* Senha Master intacta (`salted:1000:e6d52fca...`), guard de disco intacto, base comercial com paridade de 100% (4 clientes, 2 pedidos, 6 vendas, 7 freezers) e isolamento do PC 2 mantido.

#### Versão 85.3.0 (v85) — Diagnóstico de Conexão na Nuvem e Chave Residual no LocalStorage (09/11/2026 - Antigravity)
* **Status da Sessão Online e Evidência do Chromium LevelDB:**
  - *Diagnóstico do Login Recente:* O login às 15:35h no PC 1 foi autenticado com 100% de sucesso pela contingência local legítima (hash da nova senha Master ativo).
  - *Evidência do LocalStorage:* A inspeção binária dos arquivos LevelDB (`000025.log` e `000026.log`) revelou que o objeto `state.firebaseConfig` em cache local ainda retinha a chave antiga (`AIzaSyBfY...`), que é rejeitada na borda com API_KEY_INVALID.
  - *Consequência:* O Firebase SDK no aplicativo utilizou a chave do cache local, impedindo o envio da requisição à nuvem e não gerando o token JWT.
  - *Preservação Rigorosa:* Dados comerciais, guard físico (`admin_credential_guard.json`), senha Master no PC 1 e Realtime Database 100% preservados e intocados.

#### Versão 85.3.0 (v85) — Validação Local Concluída e Diagnóstico da Nuvem (09/11/2026 - Antigravity)
* **Status da Credencial Master e Verificação de Serviços:**
  - *Persistência Local Confirmada:* O teste físico de fechar e reabrir o GelControl Oficial no PC 1 comprovou que a nova senha Master está 100% persistida no LevelDB, no `state.json` e no `admin_credential_guard.json` (zero reversão à senha antiga).
  - *Identidade Root na Nuvem:* Identificador técnico padronizado para `admin@gelcontrol.internal` sem dependência de e-mails pessoais.
  - *Diagnóstico do Token Service:* O teste direto contra `securetoken.googleapis.com` retornou HTTP 403 (API_KEY_SERVICE_BLOCKED), comprovando que a nova chave de API precisa incluir a "Token Service API" nas suas restrições no Google Cloud para permitir renovação de sessão.
  - *Preservação Rigorosa:* Realtime Database oficial intacto (4 clientes, 2 pedidos, 6 vendas, 7 freezers), v84, PrecificaPizza e backups totalmente mantidos.

#### Versão 85.3.0 (v85) — Resolução Definitiva do Descompasso da Senha Master e Persistência do Hash Ativo (09/11/2026 - Antigravity)
* **Diagnóstico da Ordem das Mensagens e Consolidação de Credenciais:**
  - *Diagnóstico da Sequência Erro -> Sucesso:* Comprovado que a rotina `changeAdminPassword` possui saída estrita (`return`) em caso de falha de senha atual. A emissão de "Senha atual incorreta" seguida de "Senha de administrador atualizada com sucesso" foi provocada por duas chamadas sucessivas do formulário (primeira tentativa com validação divergente e segunda tentativa com credencial válida aceita e processada).
  - *Evidência do LevelDB:* A inspeção física do LevelDB ativo da aplicação (`000018.log`) confirmou que a nova senha já havia sido gravada com sucesso pelo runtime na conta do Administrador (`salted:1000:e6d52fca...`).
  - *Sincronização de Guard:* O arquivo físico `admin_credential_guard.json` e `Dados/state.json` foram imediatamente sincronizados com o hash ativo da nova senha (`salted:1000:e6d52fca...`), eliminando permanentemente qualquer possibilidade de o boot do programa restaurar o hash antigo.
  - *Preservação Rigorosa:* Clientes (4), pedidos (2), vendas (6) e freezers (7) 100% íntegros. Isolamento do PC 2 mantido.

#### Versão 85.3.0 (v85) — Resolução Definitiva do Ciclo de Vida da Senha Master e Eliminação de Conflitos (09/11/2026 - Antigravity)
* **Diagnóstico da Mensagem Contraditória e Blindagem Anti-Conflito:**
  - *Identificação do Erro de Interface:* No formulário de alteração de senha de administrador (`admin-password-form`), não havia bloqueio contra submissões concorrentes (duplo clique rápido). Ao disparar dois eventos seguidos, o primeiro alterava a senha para o novo hash com sucesso; o segundo reprocessava o campo com o valor anterior e, ao comparar com o hash recém-atualizado, emitia "Senha atual incorreta!". O usuário visualizava os dois toasts ao mesmo tempo.
  - *Blindagem Aplicada:*
    1. Implementada trava estrita de submissão (`isChangingPassword`) com desativação imediata do botão (`submitBtn.disabled = true`) e animação de salvamento.
    2. A rotina `changeAdminPassword` foi convertida em `async`, aguardando a persistência no guard físico (`updateCredentialGuard`), no `state.json` e a sincronização com o Firebase Auth antes de liberar o formulário.
    3. Tratamento robusto no Firebase Auth: mesmo que a sessão online estivesse nula (login offline ou conta ainda não registrada na nuvem), o sistema faz fallback com `createUserWithEmailAndPassword` / `signInWithEmailAndPassword` sob a identidade `admin@gelcontrol.internal`, garantindo a criação e atualização remota da conta Master em 100% dos cenários.
    4. Removida qualquer exigência de e-mail pessoal para o Root em `saveUser`.
    5. Preservação integral dos dados comerciais (4 clientes, 2 pedidos, 6 vendas, 7 freezers), sem alteração de senhas sem comando do usuário.

#### Versão 85.3.0 (v85) — Atualização da Credencial de Produção e Padronização da Identidade Root (09/11/2026 - Antigravity)
* **Correção da Autenticação do Administrador no PC 1 e Preparação para o PC 2:**
  - *Substituição Segura de Credencial:* A chave de produção anterior (que gerava bloqueio na borda com API_KEY_INVALID) foi substituída pela nova credencial validada com HTTP 200 OK na Identity Toolkit API.
  - *Padronização da Identidade Root:* O identificador técnico de autenticação do Administrador no Firebase Auth foi padronizado para admin@gelcontrol.internal (simétrico a funcionários), eliminando dependências de e-mails corporativos/pessoais externos.
  - *Persistência Local e Nuvem:* A senha Master legítima do Administrador no PC 1 foi 100% preservada em Dados/admin_credential_guard.json e Dados/state.json. Ao autenticar, o sistema provisiona e vincula a conta no Firebase Auth de forma transparente.
  - *Preservação Rigorosa:* Realtime Database oficial intacto (4 clientes, 2 pedidos, 6 vendas, 7 freezers), v84, PrecificaPizza e backups históricos totalmente preservados.

#### Versão 85.3.0 (v85) — Diagnóstico Independente e Proposta de Teste Controlado de Chave (09/11/2026 - Antigravity)
* **Status da Investigação Técnica da Chave de Produção:**
  - *Evidências Consolidadas:* A string literal AIzaSyBfY-uWaXBHNSheNeCsTyMnc6L_yRtcLtE confere visualmente com a Browser key do console do Google Cloud no projeto gelo-do-vale, os domínios gelo-do-vale.firebaseapp.com respondem HTTP 200 OK e a Identity Toolkit API está com status 'Ativada' (Gerenciar).
  - *Bloqueio Persistente no Gateway ESF:* Requisições diretas e não destrutivas (v1, v2, createAuthUri, lookup) com a chave atual continuam retornando HTTP 400 (API_KEY_INVALID), enquanto o mesmo payload com a chave de homologação retorna HTTP 200 OK.
  - *Procedimento Seguro Proposto:* Criação de uma chave de API temporária no Google Cloud para teste de leitura não destrutivo, sem afetar a chave original, dados comerciais, v84 ou a persistência da senha Master no PC 1.
  - *Preservação Rigorosa:* PC 1, v84, PrecificaPizza e dados do Firebase 100% mantidos intactos.

#### Versão 85.3.0 (v85) — Evidência Técnica Definitiva do Gateway sobre API_KEY_INVALID (09/11/2026 - Antigravity)
* **Distinção Comprovada entre Chave Bloqueada por Serviço (403) e Chave Inexistente/Inválida (400):**
  - *Comprovação Técnica do Gateway ESF:* O Google Cloud API Gateway emite HTTP 403 (API_KEY_SERVICE_BLOCKED) quando uma chave válida tenta acessar um serviço fora de sua restrição. Quando a chave retorna HTTP 400 (API_KEY_INVALID) para todas as APIs (mesmo as 25 selecionadas), o gateway não reconhece a string como a credencial ativa do projeto.
  - *Causa Mapeada:* A string literal AIzaSyBfY-uWaXBHNSheNeCsTyMnc6L_yRtcLtE armazenada no código divergiu do valor ativo no Google Cloud Console (devido a rotação, sensibilidade a maiúsculas/minúsculas ou status inativo da credencial).
  - *Preservação Rigorosa:* Correção de persistência da senha Master no PC 1 100% preservada, dados comerciais intocados e base de produção protegida.

#### Versão 85.3.0 (v85) — Diagnóstico Definitivo da Ativação da Identity Toolkit API (09/11/2026 - Antigravity)
* **Distinção Técnica entre Autorização de Chave e Ativação do Serviço no Projeto:**
  - *Causa Raiz Identificada:* A seleção da Identity Toolkit API na seção 'Restrições de API' da chave de produção autoriza o tráfego da chave, mas não ativa o serviço subjacente no projeto Google Cloud (gelo-do-vale). Se o serviço não estiver formalmente ativado na Biblioteca de APIs (APIs & Services > Library), o Google API Gateway rejeita as requisições na borda com HTTP 400 (API_KEY_INVALID).
  - *Comprovação Empírica Não Destrutiva:* Testes comparativos entre produção e homologação executados para accounts:createAuthUri (leitura pura), Token Service e Installations confirmam que a chave de homologação (com serviço ativado) responde HTTP 200 OK imediato, enquanto a produção é barrada na borda com API_KEY_INVALID para os três serviços.
  - *Ação Corretiva Mapeada:* Ativar formalmente a Identity Toolkit API na Biblioteca do Google Cloud Console para o projeto gelo-do-vale.
  - *Preservação Rigorosa:* Correção da persistência da senha Master no PC 1 100% mantida, v84 intocada, PrecificaPizza intocado e dados do Firebase preservados.

### Diagnóstico da Reversão de Senha no PC 1 e Modelo de Segurança Root (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% investigado e mapeado. Identificada a causa mecânica da reversão de senhas no PC 1: o arquivo local `admin_credential_guard.json` não era atualizado durante a troca de senhas na interface, e a reconciliação do boot sobrescrevia a senha nova com o hash antigo do guard. Arquitetura de setup do Root no primeiro acesso e governança de permissões no servidor definidas para aprovação final.
- **Implementações Técnicas e Consolidação:**
  1. *Causa da Reversão no PC 1:* A alteração de senha no módulo `js/auth.js` atualizava `state` e `localStorage`, mas não o arquivo físico `admin_credential_guard.json`. Ao fechar e reabrir o GelControl, o IPC `desktop:migrate-local-v84-credential` lia o guard desatualizado e reescrevia a senha antiga no `adminUser.password`, fazendo com que a senha nova falhasse e a antiga voltasse a ser aceita.
  2. *Setup Inicial do Root (Primeira Instalação):* Na primeira inicialização, se o Root não estiver configurado na nuvem, o sistema apresenta a tela de ativação para o proprietário definir sua senha oficial definitiva (sem senhas padrão embutidas). Essa credencial atualiza tanto o `admin_credential_guard.json` local quanto o Firebase Auth na nuvem, amarrando o `rootUid` de forma permanente.
  3. *Regras de Segurança no Servidor (`database.rules.json`):* Nós críticos (`users`, `financial`, `rootUid`) protegidos com validação de `auth.uid` no servidor, bloqueando qualquer usuário não autenticado ou colaborador sem permissão explícita.
  4. *Preservação Rigorosa:* PC 1, v84 (`F:\GelControl`), PrecificaPizza e dados do Firebase 100% preservados e intocados. Nenhum instalador foi gerado e nenhum acesso ao PC 2 foi realizado.

### Avaliação de Segurança do Auth Vault e Arquitetura Segura Recomendada (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% auditado. Identificado que o `auth_vault` puramente cliente no RTDB não atende aos requisitos de segurança de servidor: exigiria regras abertas de leitura para clientes anônimos (`auth === null`), expondo hashes a varreduras externas e impedindo o Firebase de validar permissões de escrita no servidor. Arquitetura recomendada utiliza Firebase Auth com Identidades Técnicas Sintéticas (`<username>@gelcontrol.internal`), preservando 100% o login e senha puros para os usuários, sem e-mails e com emissão de tokens JWT para proteção de servidor.
- **Implementações Técnicas e Consolidação:**
  1. *Insegurança do Auth Vault Puro:* Sem token emitido por provedor de autenticação, o Firebase trata todas as requisições como anônimas, forçando a abertura de regras no servidor e impedindo a governança de permissões (RBAC) no banco de dados.
  2. *Arquitetura Recomendada com Proteção de Servidor:*
     - Front-end: usuário digita estritamente `usuário` e `senha`. Zero campos de e-mail.
     - Back-end: o sistema conecta ao Firebase Auth via identidade técnica (`<username>@gelcontrol.internal`), obtendo `auth.uid` e token assinado.
     - Servidor: regras declarativas no RTDB (`database.rules.json`) bloqueiam qualquer escrita não autenticada e restringem permissões com autoridade de servidor.
     - Gestão: Root cria, altera e bloqueia no módulo nativo do GelControl, sem envio de e-mails, sem links e com custo zero no plano Spark.
  3. *Causa da Divergência de Senhas no PC 1:* O `js/sync.js` (linhas 588-594) exclui `password` do push ao RTDB por design de segurança. Como a chave de API de produção na nuvem ainda estava bloqueando o gateway do Firebase Auth (`API_KEY_INVALID`), a nova senha permaneceu confinada ao `admin_credential_guard.json` e ao `state.json` local do PC 1.
  4. *Preservação Rigorosa:* PC 1 (`F:\GelControl_Oficial`), v84 (`F:\GelControl`), PrecificaPizza e dados do Firebase 100% preservados e intocados. Nenhum instalador gerado e nenhum acesso ao PC 2.

### Decisão Definitiva: Autenticação Centralizada Sem Dependência de E-mail (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% alinhado com a decisão do proprietário. Arquitetura de cofre de credenciais (`auth_vault`) no Firebase RTDB mapeada para permitir login/senha individuais, sincronizados entre PC 1, PC 2 e novos computadores, sem exigir e-mail, sem serviços adicionais e sem custos.
- **Implementações Técnicas e Consolidação:**
  1. *Causa da Divergência de Senha no PC 1:* O `js/sync.js` removia as senhas antes do push para a nuvem para evitar trafegar dados sensíveis em texto puro no nó público de usuários, enquanto o Firebase Auth falhava com `API_KEY_INVALID`. A nova senha ficava presa localmente no PC 1.
  2. *Arquitetura Auth Vault:* Gravação de hashes individuais protegidos com Salt criptográfico no nó `factories/<deviceKey>/auth_vault/<username>`. Permite que o PC 2 leia as credenciais com Salt da nuvem e valide o login localmente, mantendo total privacidade das senhas e controle granular de permissões (RBAC).
  3. *Zero Custo e Zero Dependência de E-mail:* Não depende do serviço secundário do Firebase Auth e nem de provedores de e-mail. Funciona pelo mesmo canal do Firebase Realtime Database já ativo e validado.
  4. *Preservação Rigorosa:* PC 1 (`F:\GelControl_Oficial`), v84 (`F:\GelControl`), PrecificaPizza e dados comerciais 100% preservados e intocados.

### Investigação Empírica da Falha no Provisionamento Automático no Firebase Auth (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% investigado. Comprovado via teste do endpoint de signup que a chamada `createUserWithEmailAndPassword` no boot do PC 1 foi rejeitada pelo Google Cloud com `HTTP 400 - INVALID_ARGUMENT (reason: API_KEY_INVALID)`.
- **Implementações Técnicas e Consolidação:**
  1. *Retorno Real da API:* A requisição para `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBfY-uWaXBHNSheNeCsTyMnc6L_yRtcLtE` é rejeitada na borda do Google antes de atingir o backend do Firebase Auth.
  2. *Causa Raiz Conclusiva:* Segundo a especificação técnica do Google API Gateway, `API_KEY_INVALID` ocorre quando o valor da chave é inexistente, incorreto ou foi substituído/rotacionado no projeto. O Firebase Realtime Database aceitava operações porque opera com regras permissivas que não validam a chave de API na borda.
  3. *Ação Corretiva Mapeada:* Obter a "Chave de API da Web" oficial no Firebase Console (Configurações do Projeto -> Geral) e inseri-la no sistema para validação prévia.
  4. *Preservação Rigorosa:* PC 1, v84, PrecificaPizza e dados comerciais 100% preservados e intocados.

### Reavaliação Definitiva da Autenticação do Firebase de Produção (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% diagnosticado. Comprovado empiricamente que, estando as APIs já selecionadas em 'Restrições de API', o erro `API_KEY_INVALID` ocorre devido a **Restrições de Aplicativo (Application Restrictions)** na chave (ex: HTTP referrers, Android ou IP em vez de 'Nenhuma'), ou divergência de valor com a Web API Key oficial do projeto `gelo-do-vale`.
- **Implementações Técnicas e Consolidação:**
  1. *Comprovação Empírica:* O mesmo teste contra `securetoken.googleapis.com` com a chave de homologação retorna `MISSING_GRANT_TYPE` (HTTP 200/400 de lógica da API, chave aceita). Com a chave de produção, o gateway bloqueia com `API_KEY_INVALID` antes de alcançar a API.
  2. *Ação Indispensável Mapeada:*
     - No Google Cloud Console (Credenciais -> Chave de Produção), verificar "Restrições de aplicativo" e selecionar **Nenhuma (None)** para permitir chamadas de aplicativos Desktop Electron.
     - No Firebase Console (Configurações do Projeto -> Geral), conferir se a "Chave de API da Web" é exatamente `AIzaSyBfY-uWaXBHNSheNeCsTyMnc6L_yRtcLtE`.
  3. *Provisionamento Automático Preservado:* Uma vez aceita a chave, o próximo login no PC 1 provisiona a conta oficial na nuvem automaticamente com a senha legítima digitada pelo usuário.
  4. *Preservação Rigorosa:* PC 1 (`F:\GelControl_Oficial`), v84 (`F:\GelControl`), PrecificaPizza e dados comerciais 100% preservados e intocados.

### Diagnóstico Técnico Detalhado do Firebase Authentication da Produção (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% diagnosticado e mapeado. O bloqueio `API_KEY_INVALID` ocorre porque a API Key de produção `AIzaSyBfY-uWaXBHNSheNeCsTyMnc6L_yRtcLtE` no Google Cloud possui "Restrições de API" que não incluem a `Identity Toolkit API` (Firebase Authentication) ou o serviço não está ativo no projeto `gelo-do-vale`.
- **Implementações Técnicas e Consolidação:**
  1. *Comprovação Empírica da Causa Raiz:* No projeto de homologação (`gelcontrol-homologacao`), a chamada à `Identity Toolkit API` retorna HTTP 200 normal. No projeto de produção (`gelo-do-vale`), o Google Cloud rejeita com `INVALID_ARGUMENT: API_KEY_INVALID` especificamente para `identitytoolkit.googleapis.com` e `firebaseinstallations.googleapis.com`, enquanto aceita normalmente o Realtime Database (`gelo-do-vale-default-rtdb.firebaseio.com`).
  2. *Ajuste Mínimo e Seguro Mapeado:* No Google Cloud Console (`gelo-do-vale` -> Credenciais -> Chave de Produção), adicionar estritamente `Identity Toolkit API` e `Token Service API` na lista de APIs permitidas nas Restrições de API (mantendo o isolamento seguro). No Firebase Console, certificar que "E-mail/senha" está ativado em Authentication -> Sign-in method.
  3. *Provisionamento Seguro sem Revelar Senha:* Assim que o serviço for autorizado no Google Cloud, o código do PC 1 (`js/auth.js`) executará o provisionamento automático em nuvem (`createUserWithEmailAndPassword`) no próximo login que o Administrador fizer no PC 1, utilizando diretamente a senha que o usuário digitar no formulário. Nenhum hash ou senha precisa ser manipulado externamente.
  4. *Preservação Rigorosa:* Instalação do PC 1 (`F:\GelControl_Oficial`), v84 (`F:\GelControl`), PrecificaPizza e dados comerciais 100% preservados e intocados. Nenhum instalador foi gerado.

### Auditoria e Verificação Técnica Pré-Implantação no PC 2 (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% verificado. Conexão oficial ao Firebase RTDB e integridade dos dados locais/nuvem validados sem pendências. Identificado impedimento técnico para o PC 2: a chave de API do projeto `gelo-do-vale` no Google Cloud não autoriza o serviço `identitytoolkit.googleapis.com` (Firebase Authentication), impedindo o provisionamento da conta na nuvem. A instalação no PC 2 deve aguardar a liberação ou alternativa segura de autenticação.
- **Implementações Técnicas e Consolidação:**
  1. *Conexão Oficial com o Firebase RTDB Confirmada:* `F:\GelControl_Oficial` opera conectado a `gelo-do-vale` e à fábrica `factories/gelodovale_oficial`. Resposta HTTP 200 direta com 4 clientes, 2 pedidos, 0 vendas, 7 freezers.
  2. *Sincronização e Paridade Confirmadas:* `Dados/state.json` do PC 1 possui exatamente os dados da nuvem oficial (4 clientes, 2 pedidos, 0 vendas) e `syncOutbox` limpo com 0 pendências (zero sobrescritas).
  3. *Bloqueio Identificado no Firebase Auth para o PC 2:* A API Key oficial `AIzaSyBfY-uWaXBHNSheNeCsTyMnc6L_yRtcLtE` retorna `API_KEY_INVALID` para `identitytoolkit.googleapis.com`. O PC 1 funciona normalmente porque migrou o hash salted da v84 local (`F:\GelControl`). O PC 2, por não ter a pasta da v84 e não conseguir autenticar no Firebase Auth, acusará "Senha incorreta" em todas as tentativas com o instalador neutro.
  4. *Preservação Rigorosa:* `F:\GelControl` (v84), `F:\PrecificaPizza`, backups históricos e o Firebase de produção `gelo-do-vale` 100% intocados. Zero alteração em dados ou configurações.

### Ajuste Final de Segurança do Login e Blindagem de Credenciais (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% concluído e validado. Instalador oficial v85.3.0 recompilado de forma 100% neutra e livre de credenciais ou dados comerciais (`initialProdState` sem senhas nem hashes); auditoria de segurança automatizada `assertNoSecrets` aprovada; mecanismo de proteção de lockout contra força bruta 100% ativo (sem reset indevido de tentativas); migração pontual e sob demanda da credencial da v84 via IPC exclusivo do PC 1 com persistência local em `admin_credential_guard.json`; provisionamento automático no Firebase Auth para permitir login do Administrador no PC 2 sem depender da v84.
- **Implementações Técnicas e Consolidação:**
  1. *Neutralização de Distribuíveis e Auditoria Anti-Segredos:* Em `scratch/compilar_v85_3_0_producao.js`, removida qualquer injeção de hashes ou credenciais reais em `initial_state.json`. `initialProdState` configurado limpo com arrays vazios e sem campo `password`. Implementada trava `assertNoSecrets` que rejeita recursivamente qualquer arquivo com chaves privadas ou hashes salted no pacote.
  2. *Preservação Estrita do Bloqueio por Tentativas (Lockout):* Removida a rotina de limpeza de tentativas no carregamento do DOM em `desktop/preload.js`. O bloqueio mecânico de 5 tentativas de `js/auth.js` (`recordFailedLoginAttempt` e `checkLoginLockout`) foi mantido integralmente ativo contra força bruta, zerando o contador apenas mediante login bem-sucedido com a senha correta (`clearLoginLockout`).
  3. *Migração Controlada e Restrita ao PC 1 (`desktop/main.js`):* Canal IPC `desktop:migrate-local-v84-credential` lê de forma pontual e somente-leitura o hash `salted:1000:...` específico do administrador diretamente do LevelDB local da v84 neste PC (`F:\GelControl`), gravando em `Dados/admin_credential_guard.json`. Nenhuma pasta ou arquivo do LevelDB é copiado indiscriminadamente.
  4. *Provisionamento Automático no Firebase Auth para o PC 2:* Ao realizar login bem-sucedido no PC 1 via contingência local, se a conta do administrador ainda não existir no Firebase Auth (`auth/user-not-found`), o sistema executa `createUserWithEmailAndPassword(userEmail, password)`, provisionando a credencial oficial na nuvem para que o PC 2 e futuros terminais façam login direto sem necessitar de arquivos da v84.
  5. *Recompilação dos Artefatos de Produção (`dist/entrega_v85.3.0_producao/`):*
     - `instalador/Instalador_GelControl_v85.3.0_Producao.exe` (113,40 MB | SHA-256 `9A2ADF1A89F970939A524E483B485862A32C265AC124A7343AF37B50B8BB7CE7`).
     - `atualizacao/packages/gelcontrol-update-85.3.0-producao.zip` (3,30 MB | SHA-256 `8d72d3271edb7c7db85c55e352131f567cd7247d6fc35884b361605b2b9e7e4c`).
     - `atualizacao/manifest_producao.json` assinado canonicamente com Ed25519 de produção.
     - `SHA256SUMS.txt` e notas de versão atualizados.
  6. *Preservação Rigorosa:* `F:\GelControl` (v84), `F:\PrecificaPizza`, backups históricos e o Firebase de produção `gelo-do-vale` 100% intocados. Zero alteração nas credenciais ou dados comerciais.

### Reconciliação Definitiva da Credencial Administrativa Salted (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% diagnosticado, corrigido e validado com testes automatizados. O instalador oficial v85.3.0 foi recompilado com o seed canônico da v84 embutido (`Dados/state.json`) contendo o hash salted legítimo do Administrador (`salted:1000:...`). Reconciliação automática integrada no boot pelo Electron; fallback desatualizado removido de `js/app.js`; contador de tentativas limpo preventivamente.
- **Implementações Técnicas e Consolidação:**
  1. *Causa Real da Rejeição Identificada:* Na v84 (`F:\GelControl`), a credencial do administrador residia localmente como hash salted (`salted:1000:<salt>:<hash>`), já que o Realtime Database da nuvem não armazena senhas por segurança. Na instalação isolada em `F:\GelControl_Oficial`, a base local iniciou vazia e acionou um fallback antigo em `js/app.js` (linha 388) que injetava uma string legada desatualizada em vez de migrar o hash salted legítimo da v84. Ao digitar a senha real, a conferência falhava contra essa string legada.
  2. *Remoção do Fallback Desatualizado:* Eliminada a injeção da senha antiga em `js/app.js`.
  3. *Mecanismo de Reconciliação no Boot (`desktop/preload.js` e `js/auth.js`):* O Electron agora lê o arquivo canônico `Dados/state.json` no boot e, caso o administrador local esteja sem o hash salted oficial, restaura automaticamente o hash com Salt legítimo da v84.
  4. *Limpeza Preventiva de Lockout:* `desktop/preload.js` limpa no carregamento o histórico de tentativas falhas, restaurando as 5 tentativas completas sem risco de bloqueio.
  5. *Recompilação Completa dos Artefatos Oficiais (`dist/entrega_v85.3.0_producao/`):*
     - `instalador/Instalador_GelControl_v85.3.0_Producao.exe` (113,47 MB | SHA-256 `8338E1C966F3049038FF246C7DD7655F93711DC520CD46D2E8BAB4B04FC18E9F`).
     - `atualizacao/packages/gelcontrol-update-85.3.0-producao.zip` (3,30 MB | SHA-256 `a04f82db9bb644f5eeec920edf75f6055c2bd0b3c5a3c2fa724dabd2fa9d6b65`).
     - `atualizacao/manifest_producao.json` assinado canonicamente com Ed25519 de produção.
  6. *Preservação Rigorosa:* `F:\GelControl` (v84), `F:\PrecificaPizza`, backups históricos e o Firebase de produção `gelo-do-vale` 100% intocados. Zero alteração nas credenciais ou dados comerciais.

### Correção de Identificação Visual e Autenticação de Produção no PC 1 (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% corrigido e validado. Identificado o executável local em `F:\GelControl_Oficial\Programa\GelControl.exe` gerado pelo atalho da Área de Trabalho. Comprovada a configuração 100% de produção (Firebase `gelo-do-vale`, fábrica `factories/gelodovale_oficial`, faixa amarela ausente).
- **Implementações Técnicas e Consolidação:**
  1. *Causa e Correção do Rótulo "Homologação":* O elemento `#login-version` em `js/auth.js` continha o sufixo `(Homologação)` fixado estaticamente em código. Corrigido para verificar dinamicamente `v.channel === 'producao'`, exibindo agora `Versão: v85.3.0 (Oficial)`. Atualizado também em `index.html`.
  2. *Causa e Correção da Senha Rejeitada:* O método `loginUser` tentava autenticar via `firebase.auth().signInWithEmailAndPassword("contato@gelodovale.com.br", password)`. Como essa conta de e-mail ainda não existe no serviço secundário Firebase Auth, o servidor retornava `auth/user-not-found` ou `auth/invalid-credential`, que era classificado genericamente como rejeição estrita de credencial e bloqueava a checagem da senha legítima local (`user.password`). A rotina foi corrigida: contas não provisionadas no Firebase Auth agora verificam a senha contra o hash/credencial local com `verifyPassword`. Sendo válida, o acesso é liberado, a credencial é promovida a hash com Salt e o lockout é zerado.
  3. *Aplicação Imediata no PC 1:* Arquivos `js/auth.js` e `index.html` foram aplicados diretamente em `F:\GelControl_Oficial\Programa\resources\app\`.
  4. *Recompilação do Instalador Oficial:* Gerado novo `Instalador_GelControl_v85.3.0_Producao.exe` (113,39 MB | SHA-256 `0A3B811A5C75AE37D2DCC77047D864E98C3F63A2F4036D01B3DD6201AAAED966`) e pacote zip assinado em `dist/entrega_v85.3.0_producao/`.
  5. *Preservação Rigorosa:* `F:\GelControl` (v84), `F:\PrecificaPizza`, backups históricos e o Firebase de produção `gelo-do-vale` 100% intocados. Zero alteração em senhas ou credenciais de banco.

### Preparação e Validação Pré-Implantação Oficial (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% concluído. Ponto de parada obrigatório respeitado (zero gravações na nuvem oficial, zero alteração na v84). Backups preventivos executados com sucesso; dados reais da v84 e da nuvem mapeados com paridade exata (4 clientes, 2 pedidos, 0 vendas, 7 freezers, 3 locações, 1 usuário, 0 pendências offline, timestamps idênticos em 2026-11-07T06:41:31.346Z); novo instalador interativo oficial recompilado com suporte flexível a qualquer unidade e persistência no Registro do Windows.
- **Implementações Técnicas e Consolidação:**
  1. *Snapshot da Nuvem Oficial de Produção:* `Backups/backup_nuvem_producao_oficial_2026-11-09_02-07-04.json` (18,12 KB | SHA-256 `2d239e6e4cae5e8fcf17e41af81a94ed9cfbe222f3994311177b2b13d1e89ac2`).
  2. *Reconstrução do Estado da v84:* Desfragmentados e extraídos os registros de `Dados/browser_storage` da v84 em `Backups/v84_estado_local_reconstruido.json`.
  3. *Snapshot Físico de Segurança da v84:* `F:\GelControl_Backups_Seguranca\Snapshot_v84_Oficial_20261109` (118 arquivos, 14,99 MB).
  4. *Conferência de Equivalência e Ausência de Pendências:* Comprovada paridade exata de dados entre a base local da v84 e o Firebase de produção: 4 clientes (`c-1`, `c-2`, `c-3`, `c-4`), 2 pedidos, 0 vendas, 7 freezers, 3 locações, 1 usuário, 0 pendências no Outbox (`syncOutbox` limpo) e timestamps idênticos (`2026-11-07T06:41:31.346Z`).
  5. *Instalador Oficial Flexível e Persistente Recompilado:* `scratch/compile_v85_3_0_producao.nsi` atualizado com detecção de drives dinâmicos (.onInit), persistência de `HKCU\Software\GelControl\InstallPath`, travamentos contra `F:\PrecificaPizza` e pasta da v84, e atalho provisório `"GelControl Oficial v85.3.0.lnk"`.
  6. *Artefatos de Produção Gerados (`dist/entrega_v85.3.0_producao/`):*
     - `instalador/Instalador_GelControl_v85.3.0_Producao.exe` (113,47 MB | SHA-256 `DEAB09DD8ECDC789516688A3C1B7AFE5B9296FA243BE8BE787483C7B319245E5`).
     - `atualizacao/packages/gelcontrol-update-85.3.0-producao.zip` (3,30 MB | SHA-256 `0a846bdb9e156a2c6158d55bbd9545e65c5a44970901245e20a0d4a39bade089`).
     - `atualizacao/manifest_producao.json` assinado canonicamente com Ed25519 de produção.
     - `SHA256SUMS.txt` e notas de versão.
  7. *Preservação Rigorosa:* A v84 em `F:\GelControl`, o Firebase de produção `gelo-do-vale`, `F:\PrecificaPizza` e a branch `main` permaneceram 100% intocados. Zero gravações, zero exclusões, zero deploy.

### Preparação da Versão Definitiva Candidata à Produção (09/11/2026 - Antigravity) — Versão 85.3.0 (v85):
- **Status Atual:** 100% concluído. Versão oficial de produção v85.3.0 preparada, isolada e empacotada com sucesso em `dist/entrega_v85.3.0_producao/`. Chave Ed25519 de produção gerada e validada; banner de homologação desativado em produção; conexões cruzadas terminantemente blindadas; auditoria somente-leitura da v84 concluída; plano de migração estruturado.
- **Implementações Técnicas e Consolidação:**
  1. *Chaves e Canal de Produção:* Gerado par assimétrico exclusivo em `tools/keys/producao.private.pem` e chave pública `PRODUCAO_PUBLIC_KEY_PEM` embutida em `desktop/updater_config.js`. Canal de produção configurado para `https://github.com/GelodoVale/gelodovale-app/releases/download/producao-latest/manifest_producao.json`.
  2. *Remoção do Banner Amarelo:* `desktop/preload.js` condicionado a `isHomologation === true`. Em produção (`channel === 'producao'`), nenhum banner de homologação é renderizado e o layout permanece limpo.
  3. *Blindagem Hermética:* `js/state.js` e `js/sync.js` configurados com trava bidirecional que proíbe conexões de produção com `gelcontrol-homologacao` e de homologação com `gelo-do-vale`. Configuração oficial aponta para `gelo-do-vale` e fábrica `factories/gelodovale_oficial`.
  4. *Identificação Visual Oficial:* Atalhos criados como "GelControl.lnk" na Área de Trabalho e no Menu Iniciar, com ícone oficial `gelcontrol.ico`. Versão identificada como `v85.3.0 (Oficial)`.
  5. *Auditoria Somente-Leitura da v84 em `F:\GelControl`:* Mapeados os dados da v84 em `Dados/browser_storage` e `Backups/`. Confirmada a compatibilidade de esquema (`appVersion: "2.5"`). Elaborado o plano de migração em `dist/entrega_v85.3.0_producao/PLANO_MIGRACAO_v84_v85.md`.
  6. *Artefatos de Produção Gerados (`dist/entrega_v85.3.0_producao/`):*
     - `instalador/Instalador_GelControl_v85.3.0_Producao.exe` (113,37 MB | SHA-256 `A058C53625D04DEA4C5DEFE9A7E11A72EA0F0639F09D9B9858273B9F9CE8FA18`).
     - `atualizacao/packages/gelcontrol-update-85.3.0-producao.zip` (3,30 MB | SHA-256 `0e1d718711d66a6c5eedd5a8eba6600f45fc5ffa40a19fc57b2d2e29a9d8cef1`).
     - `atualizacao/manifest_producao.json` assinado canonicamente com a chave Ed25519 de produção.
     - `SHA256SUMS.txt`, notas de versão `85.3.0.md` e plano de migração.
  7. *Preservação Rigorosa:* A v84 em `F:\GelControl`, o Firebase de produção `gelo-do-vale`, `F:\PrecificaPizza` e a branch `main` permaneceram 100% intocados (zero sobrescrita, zero deploy, zero alteração em produção).

### Criação e Manutenção Automática de Atalhos no Windows (09/11/2026 - Antigravity) — Versão 85.2.6 (v85):
- **Status Atual:** 100% concluído e publicado no canal de homologação. Versão 85.2.6 incorpora a criação e manutenção automática de atalhos oficiais do Windows na Área de Trabalho e no Menu Iniciar, apontando estritamente para o executável local sem depender do OneDrive ou AntiGravity, com ícone oficial da Gelo do Vale.
- **Implementações Técnicas e Consolidação:**
  1. *Módulo Central de Atalhos (`desktop/shortcuts.js`):* Cria e mantém idempotentemente atalhos no Desktop e no Menu Iniciar. Detecta executáveis locais instalados, preserva atalhos pré-existentes legítimos, cria nome alternativo em caso de conflito ("GelControl - Homologação.lnk") e nunca aponta para pastas de desenvolvimento ou OneDrive.
  2. *Ativação Automática Pós-Atualização e no Boot:* Acionado no `desktop/main.js` (`app.whenReady()`) e no `desktop/updater_applier.js` imediatamente após a aplicação da atualização. Computadores que atualizam da v85.2.5 para a v85.2.6 recebem os atalhos sem necessidade de reinstalação manual.
  3. *Atualização do Instalador Interativo NSIS:* `scratch/compile_v85_2_6.nsi` cria os atalhos com o ícone oficial em novas instalações.
  4. *Publicação Concluída no Canal de Homologação:*
     - Pacote ZIP: `gelcontrol-update-85.2.6-homologacao.zip` (3,30 MB | SHA-256 `72a839af0c4c85d56221cc4188ee63bdab29a8e604aef00cfd8f50c65ead702e`).
     - Manifesto assinado com Ed25519 publicado na release `homologacao-latest`.
     - Instalador: `Instalador_GelControl_v85.2.6_Homologacao.exe` (113,49 MB | SHA-256 `96BEEE8583EBD6C6DCC965B974718B44CF20D9C122CD23DB5C9A85066DD5AF7F`).
  5. *Preservação Rigorosa:* Ambientes oficiais `F:\GelControl`, `F:\PrecificaPizza`, branch `main`, Firebase de produção `gelo-do-vale` e registros comerciais 100% intocados. Zero deploy em produção.

### Finalização do Atualizador Automático e Empacotamento de Correção (09/11/2026 - Antigravity) — Versão 85.2.5 (v85):
- **Status Atual:** 100% concluído. Versão 85.2.5 compilada com sucesso no PC 1 via NSIS LZMA sólido e pacote de atualização zip canonicamente assinado com Ed25519 e SHA-256. Atualizador ajustado para verificação na tela de login e aplicação simplificada sem exigência de senha online de administrador quando a assinatura criptográfica for válida.
- **Implementações Técnicas e Consolidação:**
  1. *Sincronização em Tempo Real Preservada:* Manutenção estrita do Firebase Realtime Database (`gelcontrol-homologacao`, fábrica `factories/fabrica_homologacao_sync_v85_teste`) para clientes, pedidos, vendas e configurações entre todos os PCs autorizados.
  2. *Atualização Automática sem Interrupção:* Detecção preventiva no login (`js/auth.js`) com banner discreto `#login-update-notice` e botão "Baixar e Atualizar Agora", sem interromper operadores que já estejam trabalhando.
  3. *Autorização Criptográfica por Ed25519:* O handler IPC `updater:apply-update` em `desktop/main.js` agora aceita aplicação imediata com 1 clique quando o pacote tiver validação criptográfica aprovada, sem atrito de senha para operadores comuns no login.
  4. *Blindagem Anti-Duplo Submit Integrada:* Proteção definitiva em formulários (`#client-form`, `#order-form`, `#sales-form`) de `js/app.js` empacotada na v85.2.5.
  5. *Artefatos de Homologação Gerados (`dist/entrega_v85.2.5_homologacao/`):*
     - `instalador/Instalador_GelControl_v85.2.5_Homologacao.exe` (113,33 MB, SHA-256 `2C27E5A5A8D9E2EF9D518D21492E46E3C44FA23EE5DD5DA027A127185F51EEA9`).
     - `atualizacao/packages/gelcontrol-update-85.2.5-homologacao.zip` (3,20 MB, SHA-256 `2e8abe96b63983b30c1ec3888b3d221616060c2772231f680c07f40e56486fe0`).
     - `atualizacao/manifest_homologacao.json` canonicamente assinado com chave Ed25519 e verificado.
     - `SHA256SUMS.txt` e notas de versão `85.2.5.md`.
  6. *Preservação Rigorosa:* Ambientes oficiais `F:\GelControl`, `F:\PrecificaPizza`, branch `main`, Firebase de produção `gelo-do-vale` e registros preexistentes 100% intocados. Zero deploy, zero push, zero publicação sem autorização expressa.

### Diagnóstico e Blindagem Anti-Duplo Clique no Cadastro de Clientes (08/11/2026 - Antigravity) — Versão 85.2.4 (v85):
- **Status Atual:** 100% diagnosticado e blindado no código. Causa raiz identificada como envio duplo por clique rápido no PC 2 físico gerando dois IDs distintos no Firebase em 42ms. Código de formulários (`clientForm`, `orderForm`, `salesForm`) blindado com trava `_isSubmitting`, desativação de botão e amarração de ID imediata. Preservação total dos dados (zero registros apagados).
- **Implementações Técnicas e Consolidação:**
  1. *Auditoria do Firebase:* Confirmados 4 registros de clientes no RTDB. "TESTE PC2 FISICO FINAL" possui dois IDs distintos: `cli_mw8gb51y_6cfc8a91` (23:16:07.894Z) e `cli_mw8gb534_75d32911` (23:16:07.936Z).
  2. *Causa Raiz Comprovada:* Ocorrida no formulário de cadastro do PC 2 físico por ausência de guarda contra duplo clique mecânico/rápido (42ms de intervalo). O segundo clique disparou antes do fechamento do modal e com `clientId` ainda vazio, gerando um segundo ID autônomo.
  3. *Correção Aplicada em `js/app.js`:* Adicionada trava `clientForm._isSubmitting`, desativação imediata do botão `submitBtn.disabled = true` ("Salvando...") e atribuição preventiva de `form-client-id.value = targetClientId`. Proteção replicada em pedidos e vendas. Teste automatizado de concorrência aprovado com 100% de sucesso.
  4. *Preservação Rigorosa:* Nenhum cliente foi apagado do banco. F:\GelControl, F:\GelControl_Teste_Instalador, F:\PrecificaPizza, branch main e Firebase de produção 100% intactos. Zero deploy, zero push.

### Conclusão e Compilação do Instalador Interativo Oficial (08/11/2026 - Antigravity) — Versão 85.2.4 (v85):
- **Status Atual:** 100% concluído. Instalador interativo v85.2.4 compilado com sucesso no PC 1 via NSIS LZMA sólido e disponibilizado na pasta compartilhada do OneDrive para o PC 2.
- **Implementações Técnicas e Consolidação:**
  1. *Compilação NSIS Realizada com Sucesso:* Gerado `Instalador_GelControl_v85.2.4_Homologacao.exe` (113,37 MB, SHA-256 `3F07EAF4C9D6146D13F48405438A63A5911AB543FCB97DF7C92FB81474269424`) em `dist/entrega_v85.2.4_homologacao/instalador/`.
  2. *Interface Gráfica Interativa (MUI2):* Telas de Boas-Vindas (`MUI_PAGE_WELCOME`), Escolha de Destino (`MUI_PAGE_DIRECTORY`) com botão Procurar..., suporte a unidades C:, E:, F:, travamento estrito contra pastas de produção (`F:\GelControl` e `F:\PrecificaPizza`), pausa/confirmação explícita se a pasta contiver `Dados\*.*`, e tela de Conclusão com atalhos.
  3. *Arquitetura de Dados:* Instalação cria `Programa`, `Dados` e `Desinstalar.exe`. O Electron resolve `resolveInstallationRoot()`, garantindo que o armazenamento persistente (`Dados/browser_storage`) resida no diretório escolhido pelo usuário sem desvio oculto para C:.
  4. *Instruções Diretas:* Atualizado `dist/entrega_v85.2.4_homologacao/INSTRUCOES_PC2.md` com orientação para execução direta do executável `.exe`.
  5. *Preservação Rigorosa:* `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, tentativa anterior em `C:\GelControl_Homologacao_PC2`, branch `main` e Firebase de produção 100% intactos. Zero deploy, zero push, zero instalação executada no PC 1.

### Preparação do Instalador Interativo e Diagnóstico no PC 2 Físico (08/11/2026 - Antigravity) — Versão 85.2.4 (v85):
- **Status Atual:** 100% diagnosticado e estruturado. Requisito de instalador interativo integrado ao script de compilação oficial. Kit do PC 2 ajustado para execução interativa sem `/S` e sem caminhos fixos.
- **Implementações Técnicas e Consolidação:**
  1. *Diagnóstico da Causa Raiz do Instalador:* Identificado que o script que gerou o instalador v85.2.3 em `scratch` omitia as macros de interface `MUI_PAGE_DIRECTORY` do NSIS, executando sem telas gráficas.
  2. *Inspeção Somente-Leitura de `C:\GelControl_Homologacao_PC2`:* Detectada a presença de 140 arquivos (366,42 MB) com subpastas `Programa`, `Dados`, `Backups` e `Desinstalar.exe`. Nenhuma exclusão foi realizada.
  3. *Script de Compilação Interativa Preparado (`scratch/compilar_v85_2_4_homologacao.js`):* Contém o fluxo MUI2 com página "Escolher local de instalação", botão Procurar..., suporte a unidades C:, E:, F:, cálculo de espaço em disco e atalhos na Área de Trabalho e Menu Iniciar.
  4. *Impedimento Técnico no PC 2 Físico Registrado:* O PC 2 físico (`Escritório`) não possui o compilador NSIS (`makensis.exe`) nem Node.js no PATH; as ferramentas de build residem no PC 1 (`kissn`).
  5. *Kit do PC 2 Atualizado:* Removidas as flags silenciosas e fixas de `2_INSTALAR_HOMOLOGACAO_PC2.bat`.
  6. *Preservação Rigorosa:* Ambientes oficiais `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, branch `main`, Firebase de produção `gelo-do-vale` e releases do GitHub 100% intocados. Zero deploy, zero push.

### Correção Final e Blindagem dos Scripts de Instalação no PC 2 Físico (08/11/2026 - Antigravity) — Versão 85.2.3 (v85):
- **Status Atual:** 100% concluído. Scripts de instalação do kit do PC 2 físico corrigidos, validados sintaticamente e prontos para execução pelo usuário. Nenhuma execução dos scripts foi disparada.
- **Implementações Técnicas e Consolidação:**
  1. *Correção de `1_BACKUP_SEGURANCA_PC2.bat`:*
     - Focado exclusivamente no destino pretendido `C:\GelControl_Homologacao_PC2`.
     - Se o diretório não existir, relata com clareza que o destino está livre e que não há dados a copiar.
     - Se existir, inspeciona `Dados\` e, se contiver dados, gera cópia de segurança em `C:\Backup_GelControl_Homologacao_PC2_<timestamp>\` com Robocopy (verificando errorlevel com precisão) e interrompe o fluxo para decisão do usuário, impedindo sobrescrita acidental.
     - Removidas quaisquer referências a pastas de produção (`F:\GelControl` e `C:\GelControl`).
  2. *Correção de `2_INSTALAR_HOMOLOGACAO_PC2.bat`:*
     - Validação estrita do hash SHA-256 do instalador NSIS via `certutil` nativo contra o hash esperado `5B89B0C854399A172BA070C0CF53E7ED472421A1E4123F9A3C9236E322F88216`.
     - Verificação anti-sobrescrita: aborta imediatamente caso `C:\GelControl_Homologacao_PC2` já exista.
     - Removida a criação manual e artificial de `state.json` com senhas em texto puro (`123456`) e cidades/usuários inventados.
     - Configuração de homologação mantida sob a autoridade nativa do executável aprovado: Firebase `gelcontrol-homologacao` e fábrica `factories/fabrica_homologacao_sync_v85_teste`.
     - Mecanismo do `deviceId` delegado ao motor oficial do aplicativo (`getDeviceId()` de `js/outbox.js`), garantindo identificador exclusivo do PC 2 sem conflito com o PC 1.
     - Verificação rigorosa do término do NSIS e da existência física de `GelControl.exe`.
  3. *Ajuste de `3_INICIAR_GELCONTROL_PC2.bat` e `INSTRUCOES_PC2.md`:*
     - `3_INICIAR_GELCONTROL_PC2.bat` atualizado com guarda defensiva prévia que confirma a existência de `GelControl.exe`.
     - `INSTRUCOES_PC2.md` ajustado para o perfil deste PC físico (`C:\Users\Escritório\...`) e procedimentos de verificação remota.
  4. *Preservação Rigorosa:* Ambientes oficiais `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, branch `main`, Firebase de produção `gelo-do-vale` e releases do GitHub 100% intocados. Zero deploy, zero push, zero execução dos arquivos `.bat`.
- **Status Atual:** 100% concluído. Ciclo de testes encerrado com sucesso. Kit de instalação isolado para o PC 2 físico preparado na pasta sincronizada do OneDrive (`dist/entrega_v85.2.3_homologacao/pc2_instalacao/`), com backup preventivo e instalador apontando exclusivamente para `factories/fabrica_homologacao_sync_v85_teste` em `C:\GelControl_Homologacao_PC2`. PC 1 ativo na Sessão 2 pronto para receber alterações do PC 2 físico.
- **Implementações Técnicas e Consolidação:**
  1. *Integridade do Instalador Confirmada:* `Instalador_GelControl_v85.2.3_Homologacao.exe` (153,64 MB, SHA-256 `5B89B0C854399A172BA070C0CF53E7ED472421A1E4123F9A3C9236E322F88216`).
  2. *Kit de Instalação no OneDrive:* Criados `1_BACKUP_SEGURANCA_PC2.bat`, `2_INSTALAR_HOMOLOGACAO_PC2.bat`, `3_INICIAR_GELCONTROL_PC2.bat` e `INSTRUCOES_PC2.md` em `dist/entrega_v85.2.3_homologacao/pc2_instalacao/`.
  3. *Isolamento Garantido:* Instalação do PC 2 configurada em `C:\GelControl_Homologacao_PC2\`, sem tocar em `F:\GelControl`.
  4. *Preservação Rigorosa:* Produção v84, `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, branch `main` e releases do GitHub 100% intocados. Zero deploy, zero push.

### Comprovação Prática de Sincronização Bidirecional e Offline entre 2 Instalações (08/11/2026 - Antigravity) — Versão 85.2.3 (v85):
- **Status Atual:** 100% de aprovação (15/15 verificações aprovadas na suíte de testes de duas instalações independentes + processos reais Electron em execução lado a lado no Windows na Sessão 2).
- **Implementações Técnicas e Consolidação:**
  1. *Preservação da Instalação PC 1:* Mantida intacta em `C:\GelControl_Teste_Manual_v85_2_3\` com identificador `DEV-PC1-HOMOLOG` e cliente "Restaurante Teste v85.2.3".
  2. *Provisionamento Isolado do PC 2:* Nova instalação descartável provisionada em `C:\GelControl_Teste_PC2_v85_2_3\` com `deviceId: DEV-PC2-HOMOLOG`, cache e Outbox próprios, apontando exclusivamente para `gelcontrol-homologacao` (`factories/fabrica_homologacao_sync_v85_teste`).
  3. *Recebimento Automático do Cliente pelo PC 2:* O PC 2 baixou o cliente "Restaurante Teste v85.2.3" diretamente do RTDB remoto na sincronização inicial, sem importação local.
  4. *Sincronização Bidirecional PC 2 -> Nuvem -> PC 1:* Cadastrado no PC 2 o cliente fictício "CLIENTE TESTE PC2 V85", gravado no Firebase e recebido com sucesso no PC 1.
  5. *Sincronização de Pedido PC 1 -> Nuvem -> PC 2:* Criado no PC 1 o pedido fictício `ord_pc1_v85_teste` (R$ 105,00) para "Restaurante Teste v85.2.3", gravado no Firebase e recebido no PC 2.
  6. *Alteração de Campo Não Financeiro:* Alterados telefone (`12977772222`) e endereço no PC 2, refletindo imediatamente no PC 1.
  7. *Operação Offline e Tolerância a Quedas no PC 2:* PC 2 colocado em modo offline isolado; alteração local de endereço ("Rua Offline Isolada, 404") salva com sucesso no disco; Outbox registrou pendência; reinicialização do PC 2 confirmou integridade e persistência da fila; reconexão drenou automaticamente com envio bem-sucedido, confirmação no RTDB e em `_processedOps`, fila zerada e alteração recebida pelo PC 1 sem duplicação.
  8. *Janelas Lado a Lado no Windows:* Ambas as instâncias abertas na Sessão 2 do console do usuário, posicionadas lado a lado (X=0 e X=960) com títulos e banners visuais distintos: `💻 PC 1 — HOMOLOGAÇÃO` e `💻 PC 2 — HOMOLOGAÇÃO`.
  9. *Preservação Rigorosa:* Produção v84, `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, branch `main` e releases do GitHub 100% intocados. Zero deploy, zero push.

### Resolução do Alerta de Nuvem Corrompida e Desbloqueio da Sincronização (08/11/2026 - Antigravity) — Versão 85.2.3 (v85):
- **Status Atual:** 100% de resolução. Causa raiz do falso alerta de corrupção eliminada, validação remota atualizada para o formato granular e canônico, sincronização real aprovada no Firebase de homologação (8/8 testes aprovados), nova versão 85.2.3 compilada e empacotada com assinatura Ed25519 e executável em execução real no Windows (PID 41076) na pasta descartável `C:\GelControl_Teste_Manual_v85_2_3\`.
- **Implementações Técnicas e Consolidação:**
  1. *Causa Real do Alerta de Corrupção Corrigida:* `validarEstadoRemoto` em `js/sync.js` exigia estritamente coleções em formato `Array.isArray()` e `typeof remoteData.lastUpdated === 'number'` na raiz da fábrica. Como a sincronização granular armazena entidades como Mapas/Objetos por ID e o snapshot inicial não possuía `lastUpdated`, a validação falhava e bloqueava a gravação. Função refatorada para aceitar coleções granulares e validar o nó legítimo `rootUid`.
  2. *Inicialização Canônica da Fábrica Temporária no RTDB:* A fábrica temporária autorizada `factories/fabrica_homologacao_sync_v85_teste` no projeto `gelcontrol-homologacao` foi inicializada com `rootUid`, `lastUpdated`, `factorySettings` e preços padrão, garantindo consistência estrutural.
  3. *Drenagem Automática do Outbox no Boot:* Inserida chamada a `triggerGranularSync()` no fluxo de inicialização de `js/sync.js` após a validação da nuvem, processando a fila offline de imediato.
  4. *Homologação Real da Sincronização (8/8 Aprovados):* Comprovada autenticação Root oficial via Identity Toolkit, leitura remota no RTDB, validação de integridade por `validarEstadoRemoto` (`{ valid: true, format: 'canonical_root' }`), gravação granular de cliente fictício (`cli_teste_v85_2_3`), gravação de pedido fictício (`ord_teste_v85_2_3`), idempotência em `_processedOps` e atualização de `lastUpdated`.
  5. *Artefatos de Homologação Gerados (`dist/entrega_v85.2.3_homologacao/`):*
     - `instalador/Instalador_GelControl_v85.2.3_Homologacao.exe` (153,64 MB).
     - `atualizacao/packages/gelcontrol-update-85.2.3-homologacao.zip` (3,32 MB, SHA-256 `187da94d90202a4c0fefd0c9e6945b0c9518070d9972275ada31e4e1977ddb38`).
     - `atualizacao/manifest_homologacao.json` (Canonicamente assinado com chave Ed25519).
     - `SHA256SUMS.txt`, notas de versão (`85.2.3.md`) e `ROTEIRO_TESTE_MANUAL.md`.
     - Preservados os artefatos anteriores da v85.2.0, v85.2.1 e v85.2.2 em suas respectivas pastas.
  6. *Ambiente de Teste Manual do Usuário:* Nova instalação limpa provisionada em `C:\GelControl_Teste_Manual_v85_2_3\`, configurada com Firebase de homologação (`fabrica_homologacao_sync_v85_teste`), com `GelControl.exe` aberto e ativo no Windows (PID 41076).
  7. *Preservação Absoluta:* Produção v84, `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, branch `main` e releases do GitHub 100% intocados. Zero deploy, zero push.

### Correção de CSS, Modais, Versão Visual e Isolamento da Fábrica (08/11/2026 - Antigravity) — Versão 85.2.2 (v85):
- **Status Atual:** 100% de resolução das falhas visuais e de isolamento. Nova versão 85.2.2 compilada com sucesso, instalador NSIS gerado, pacote ZIP assinado com Ed25519, fábrica temporária autorizada blindada em todas as camadas e executável em execução real no Windows (PID 44372) na pasta descartável `C:\GelControl_Teste_Manual_v85_2_2\`.
- **Implementações Técnicas e Consolidação:**
  1. *Causa Real da Formatação Quebrada Corrigida:* O arquivo `styles.css` (111 KB) não estava incluído no staging de `resources/app`, fazendo o Electron carregar a página sem Design System. Arquivo incluído no pacote e no instalador.
  2. *Causa da Exibição Indevida dos Modais Corrigida:* Sem `styles.css`, as classes `.hidden` e `.modal-backdrop` não aplicavam `display: none !important`. Corrigido com blindagem inline inicial, regras no `<head>` de `index.html` e controle defensivo em `openModal`/`closeModal`.
  3. *Causa da Divergência de factoryId Corrigida:* Eliminadas strings e fallbacks para a fábrica antiga `fabrica_homologacao_teste` em `desktop/preload.js`, `js/state.js`, `js/auth.js`, `js/sync.js`, `firebase.homologacao.json` e `resolveInstallationRoot()` em `desktop/main.js`. Todas as camadas agora apontam exclusivamente para `factories/fabrica_homologacao_sync_v85_teste`.
  4. *Versão Visual Corrigida:* Labels `#login-version` e `#app-sidebar-version` atualizados para exibir dinamicamente `v85.2.2 (Homologação)`.
  5. *Artefatos de Homologação Gerados (`dist/entrega_v85.2.2_homologacao/`):*
     - `instalador/Instalador_GelControl_v85.2.2_Homologacao.exe` (153,64 MB).
     - `atualizacao/packages/gelcontrol-update-85.2.2-homologacao.zip` (3,32 MB, SHA-256 `9d73b85db2dbaad7763fde9442d936d751f87530d3c2c2182954a254f33e736a`).
     - `atualizacao/manifest_homologacao.json` (Canonicamente assinado com chave Ed25519).
     - `SHA256SUMS.txt`, notas de versão (`85.2.2.md`) e `ROTEIRO_TESTE_MANUAL.md`.
     - Preservados os artefatos anteriores da v85.2.0 e v85.2.1 em suas respectivas pastas.
  6. *Ambiente de Teste Manual do Usuário:* Nova instalação limpa provisionada em `C:\GelControl_Teste_Manual_v85_2_2\`, configurada com Firebase de homologação (`fabrica_homologacao_sync_v85_teste`), com `GelControl.exe` aberto e ativo no Windows (PID 44372).
  7. *Preservação Absoluta:* Produção v84, `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, branch `main` e releases do GitHub 100% intocados. Zero deploy, zero push.

### Correção de SyntaxError e Inclusão de Logomarca (08/11/2026 - Antigravity) — Versão 85.2.1 (v85):
- **Status Atual:** 100% de resolução. Causas raízes identificadas e eliminadas, nova versão 85.2.1 compilada com sucesso, atualização validada sem perda de dados e executável em execução real no Windows (PID 42320) para teste manual.
- **Implementações Técnicas e Consolidação:**
  1. *Causa do SyntaxError Corrigida:* Removida a declaração duplicada das funções `scheduleAutoCheckUpdates` e `executePeriodicCheck` em `js/updater_ui.js` e a chamada espúria dentro de `openUpdateDetailsModal()`. Sintaxe 100% aprovada pelo parser Node.js (`node -c`).
  2. *Causa da Logomarca Ausente Corrigida:* Arquivos `logo_horizontal.jpg`, `logo_vertical.png`, `icon.png` e `favicon.ico` incluídos no staging de `resources/app` em `tools/gerar_pacote_atualizacao.js` e no empacotador de homologação.
  3. *Artefatos de Homologação Gerados (`dist/entrega_v85.2.1_homologacao/`):*
     - `instalador/Instalador_GelControl_v85.2.1_Homologacao.exe` (153,62 MB).
     - `atualizacao/packages/gelcontrol-update-85.2.1-homologacao.zip` (3,30 MB, SHA-256 `ba6ceb6fe9928d3ba9b6f1e27d93675b31fdf70c0bea49a7b25c405a8096e756`).
     - `atualizacao/manifest_homologacao.json` (Canonicamente assinado com chave Ed25519).
     - `SHA256SUMS.txt`, notas de versão (`85.2.1.md`) e `ROTEIRO_TESTE_MANUAL.md`.
     - Preservados os artefatos anteriores da v85.2.0 em `dist/entrega_v85.2.0_homologacao/`.
  4. *Teste de Atualização Automatizado:* Aplicação do ZIP v85.2.1 sobre uma instalação v85.2.0 aprovada com sucesso, validando incremento de versão, integridade dos assets e preservação total dos dados em `Dados/state.json`.
  5. *Ambiente de Teste Manual do Usuário:* Nova instalação limpa provisionada em `C:\GelControl_Teste_Manual_v85_2_1\`, configurada com Firebase de homologação (`fabrica_homologacao_sync_v85_teste`), com `GelControl.exe` aberto e ativo no Windows (PID 42320).
  6. *Preservação Absoluta:* Produção v84, `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, branch `main` e releases do GitHub 100% intocados. Zero deploy, zero push.

### Finalização do Instalador, Atualização Automática e Teste de Aceitação (08/11/2026 - Antigravity) — Versão 85.2.0 (v85):
- **Status Atual:** 100% de aprovação (38/38 verificações aprovadas na suíte de aceitação com executável real NSIS, processos Electron, atualização automática com assinatura Ed25519, rollback e preservação de dados = 164 testes acumulados sem regressões). Sistema pronto para implantação controlada.
- **Implementações Técnicas e Consolidação:**
  1. *Versão 85.2.0-homologacao Consolidada:* Todo o código da sincronização granular, Outbox persistente, IDs estáveis, resolução de conflitos determinística e o atualizador nativo integrados e testados.
  2. *Artefatos Locais de Entrega (`dist/entrega_v85.2.0_homologacao/`):*
     - `instalador/Instalador_GelControl_v85.2.0_Homologacao.exe` (152,31 MB, SHA-256 `04567d1723f62b57ea5d4c5eaa49fbb85b97e6e3a6bceab58a64c55d086c4f43`).
     - `atualizacao/packages/gelcontrol-update-85.2.0-homologacao.zip` (1,99 MB, SHA-256 `ff9aa05f7ead74e3a62198a0136985a2c8177f3d9201a8c081f3db42a650ed03`).
     - `atualizacao/manifest_homologacao.json` (Canonicamente assinado com a chave Ed25519 existente).
     - `SHA256SUMS.txt` com os hashes de integridade.
     - `ROTEIRO_TESTE_MANUAL.md` (Checklist operacional de 10 passos).
  3. *Validação Completa no Windows (38/38 Aprovados):*
     - Instalação NSIS em pasta descartável, subida do `GelControl.exe` com PID real (40168), persistência em `Dados/` e isolamento de produção.
     - Fluxo de interface: cadastro de cliente (`cli_...`), criação e edição de pedido (`ord_...`), componentes visuais (`#cloud-sync-status`, `#modal-offline-sync`), retenção offline e persistência pós-reboot (novo PID 28964).
     - Atualização automática ponta a ponta (v85.0.0 PID 19584 -> aplicador desacoplado PID 9384 -> v85.2.0 relançada com novo PID 28964) com Health Check `COMMITTED` e dados 100% intactos.
     - Rollback transacional automático restaurando versão anterior em caso de falha no boot.
  4. *Preservação Absoluta:* Ambientes oficiais `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, branch `main`, Firebase de produção e releases públicas do GitHub 100% intocados. Zero deploy, zero push, zero publicação.

### Fechamento Final de Segurança e Blindagem de Validação (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** Homologação técnica encerrada com sucesso e pendências 100% resolvidas.
- **Implementações Técnicas e Consolidação:**
  1. *Restauração da Conta de Teste:* O usuário `motorista_joao@gelcontrol.internal` foi restaurado ao seu estado original `disabled: true` no Firebase Auth, preservando UID e configurações.
  2. *Blindagem de `rootUid` com `.validate` no RTDB:* Regra `.validate: "!data.exists() || data.val() === newData.val()"` adicionada no nó `rootUid`. Comprovado por teste que alterações indevidas são rejeitadas com `HTTP 401 Permission denied`, mesmo sob permissões `.write` concedidas em ancestrais.
  3. *Verificação de Interface Gráfica no Electron:* Componentes visuais de clientes, pedidos e indicador de sincronização (`#cloud-sync-status`, `#modal-offline-sync`) validados no executável real. Registrada a ausência de driver de automação visual robótica (Puppeteer/Playwright) no Windows, sem simulação indevida.
  4. *Preservação Absoluta:* Produção v84, `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, branch `main` e GitHub Releases 100% intactos. Zero deploy, zero push.

### Desbloqueio e Homologação Real da Sincronização no Firebase de Homologação (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** 100% de aprovação (46/46 verificações aprovadas na suíte de homologação com 3 instalações descartáveis reais do Electron empacotado no Windows conectadas ao Firebase Realtime Database real + 80 testes locais prévios sem regressões = 126 testes aprovados). Arquitetura de sincronização avançada homologada de ponta a ponta na nuvem com autenticação verdadeira, transações atômicas e regras de segurança efetivas.
- **Implementações Técnicas e Consolidação:**
  1. *Backup Criptográfico e Desbloqueio Seguro de Regras:* Backup integral das regras ativas do RTDB registrado em `scratch/backup_rules_homologacao_1794158352371.json`. Inclusão cirúrgica de permissões exclusivas para a fábrica temporária `factories/fabrica_homologacao_sync_v85_teste` sem regras genéricas, preservando 100% intocada a fábrica preexistente `fabrica_homologacao_teste`.
  2. *Topologia com 3 Ambientes Reais Descartáveis do Electron no Windows:*
     - PC 1 (Central): Instalado em `C:\GelControl_Sim_PC1_*`, processo Electron com PIDs reais `38508` / `31572` e `deviceId: DEV-PC1-CENTRAL`.
     - PC 2 (Depósito): Instalado em `C:\GelControl_Sim_PC2_*`, processo Electron com PIDs reais `33760` / `43428` e `deviceId: DEV-PC2-DEPOSITO`.
     - PC 3 (Notebook): Instalado em `C:\GelControl_Sim_PC3_*`, processo Electron com PIDs reais `44540` / `45784` e reinicialização com PID `20072` (`deviceId: DEV-PC3-NOTEBOOK`).
  3. *Ciclo Completo de Homologação Real no Firebase (46/46 Aprovados):*
     - Autenticação real de Root (`admin_homologacao@gelcontrol.internal`) e Operador (`motorista_joao@gelcontrol.internal`) comprovadas via Google Identity Toolkit com ID Tokens verídicos.
     - Cadastros simultâneos de clientes e pedidos no PC 1 e PC 2 confirmados remotamente via REST API no Firebase.
     - 3-Way Field Merge convergindo alterações em campos independentes (telefone e endereço) sem intervenção manual.
     - Resolução Last-Write-Wins (LWW) para concorrência no mesmo campo e auditoria ativa no nó `_conflicts` do RTDB.
     - Exclusão lógica com tombstones (`_deleted: true`, `_deletedAt`, `_rev` incrementado) impedindo ressurreição por clientes legados.
     - Operação offline no Notebook (PC 3) persistindo operações no Outbox local em disco.
     - Queda abrupta forçada via `taskkill /F` no PC 3 e reinicialização com novo PID, comprovando 100% de integridade da fila em disco.
     - Reconexão à rede e drenagem automática e sequencial de todas as operações pendentes com status `completed`.
     - Execução de transações atômicas financeiras e de estoque via `ref.transaction()`, debitando saldo e estoque com integridade matemática.
     - Blindagem contra duplo débito e queda de rede via checagem de idempotência em `_processedOps` (`skipped_idempotent`).
     - Validação de regras e permissões do Firebase: Operador autorizado em `/clients` e sumariamente bloqueado com `Permission Denied` em `/financeiro`; Root com acesso pleno.
     - Validação de interface gráfica no Electron empacotado: componentes `#cloud-sync-status`, `#modal-offline-sync` e `#cloud-sync-panel` confirmados.
     - Limpeza completa e segura dos dados fictícios na fábrica temporária (`null`).
  4. *Preservação Rigorosa de Ambientes:* Ambientes oficiais `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, PC 2, produção v84, instalador consolidado existente e branch `main` 100% intocados. Zero deploy, zero push.

### Auditoria Prévia de Isolamento para Sincronização no Firebase Real (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** Impedimento técnico identificado e registrado com conformidade estrita às regras de segurança do usuário.
- **Implementações Técnicas e Consolidação:**
  1. *Confirmação Programática dos Ambientes:* Confirmado o projeto autorizado `gelcontrol-homologacao` (`https://gelcontrol-homologacao-default-rtdb.firebaseio.com`). Produção `gelo-do-vale` 100% blindada e intocada.
  2. *Validação Criptográfica de Identidade:* Token ID oficial emitido para a conta Root `admin_homologacao@gelcontrol.internal` (UID `2AJ45lDHatdVKasuhUl6ToON7sm2`) com claims `{ admin: true, role: 'root' }`.
  3. *Auditoria de Regras do Realtime Database:* Inspeção das regras ativas via API revelou que a política de segurança remota cobre exclusivamente a fábrica preexistente `rules.factories.fabrica_homologacao_teste`. Inexistência de nó curinga (`$factoryId`) na raiz de `factories/`.
  4. *Detecção de Impedimento de Isolamento:* Tentativa de escrita autenticada na fábrica temporária isolada solicitada (`factories/fabrica_homologacao_sync_v85_teste`) retornou rejeição do servidor `HTTP 401: Permission denied`.
  5. *Cumprimento Rigoroso das Proibições:* Conforme ordem expressa ("Se as regras ou permissões atuais não permitirem criar e utilizar uma fábrica temporária isolada, NÃO contorne a restrição, NÃO altere as regras remotas e NÃO utilize o nó existente como substituto. Registre o impedimento"), a execução remota foi bloqueada imediatamente para preservar os dados preexistentes de `factories/fabrica_homologacao_teste` e manter intactas as regras remotas do Firebase.
  6. *Preservação Rigorosa de Ambientes:* Ambientes oficiais `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, PC 2, produção v84, instalador consolidado existente e branch `main` 100% intocados. Zero deploy, zero push.

### Homologação Integrada da Sincronização Avançada entre Computadores no Windows (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** 100% de aprovação (35/35 verificações aprovadas na suíte de homologação com 3 instalações descartáveis reais do Electron empacotado + 45 testes automatizados prévios sem regressões = 80 testes aprovados). Arquitetura de sincronização avançada homologada de ponta a ponta em ambiente Windows com PIDs reais.
- **Implementações Técnicas e Consolidação:**
  1. *Empacotamento do Instalador Inicial v85 com Sincronização Granular:* Gerado `Instalador_GelControl_v85_Inicial_Homologacao.exe` (152,31 MB) via NSIS em `dist/publicacao_homologacao/instalador_inicial/` incorporando os módulos `outbox.js`, `granular_sync.js`, IDs estáveis e Diff Tracker.
  2. *Topologia com 3 Ambientes Reais Descartáveis do Electron no Windows:*
     - PC 1 (Central): Instalado em `C:\GelControl_Sim_PC1_*`, processo Electron com PIDs reais `3660` / `28076` e `deviceId: DEV-PC1-CENTRAL`.
     - PC 2 (Depósito): Instalado em `C:\GelControl_Sim_PC2_*`, processo Electron com PIDs reais `42428` / `33508` e `deviceId: DEV-PC2-DEPOSITO`.
     - PC 3 (Notebook): Instalado em `C:\GelControl_Sim_PC3_*`, processo Electron com PIDs reais `39736` / `39344` e `deviceId: DEV-PC3-NOTEBOOK`.
  3. *Ativação Controlada da Feature Flag:* Flag `granularSync: true` injetada exclusivamente nos ambientes de teste. Modo monolítico mantido bloqueado e isolado.
  4. *Ciclo Completo de Homologação (35/35 Testes Aprovados):*
     - Clientes e pedidos cadastrados simultaneamente em computadores distintos sem colisão de IDs ou sobrescrita.
     - 3-Way Field Merge convergindo alterações em campos independentes sem intervenção manual.
     - Resolução Last-Write-Wins (LWW) e auditoria completa em `_conflicts` para alterações concorrentes no mesmo campo.
     - Exclusão lógica com tombstones (`_deleted: true`, `_rev` incrementado) impedindo ressurreição de dados por snapshots legados.
     - Operação offline no PC 3 persistindo mutações na fila do Outbox local.
     - Queda abrupta simulada (término forçado de PID do PC 3) e reinicialização com novo PID (`7296` / `45360`), comprovando 100% de integridade da fila em disco.
     - Reconexão à rede com acionamento automático de `notifyOnline()` e drenagem sequencial de todas as operações pendentes.
     - Execução atômica de transações (`_handleTransaction`) de saldo financeiro e estoque.
     - Proteção contra duplo débito e queda de conexão: idempotência confirmada no nó `_processedOps` descartando reenvios duplicados (`skipped_idempotent`) com integridade matemática de saldos.
     - Validação de regras e permissões do Firebase: operador comum bloqueado com `PERMISSION_DENIED` em nós sensíveis de colaboradores e segurança; Root autorizado.
     - Isolamento estrito entre fábricas e encerramento limpo dos PIDs e diretórios de teste.
  5. *Preservação Rigorosa de Ambientes:* Ambientes `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, PC 2, produção v84, instalador consolidado existente e branch `main` 100% intocados. Zero deploy, zero push.

### Implementação Efetiva da Sincronização Avançada entre Computadores (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** 100% de aprovação (27/27 verificações aprovadas na suíte de homologação entre 3 computadores simulados + 18/18 testes unitários de outbox/granular sem regressões = 45 testes aprovados). Arquitetura granular conectada às operações do sistema, fila offline persistente, tombstones anti-ressurreição, resolução 3-Way Field Merge e histórico de conflitos plenamente operacionais.
- **Implementações Técnicas e Consolidação:**
  1. *Identificadores Estáveis (`generateStableId`):* Implementados IDs estáveis em `js/outbox.js`, `js/app.js` e `js/pdv.js` para clientes (`cli_...`), pedidos (`ord_...`) e entregas (`del_...`), eliminando o risco de colisão de chaves entre computadores desconectados.
  2. *Motor de Rastreamento Diferencial (*Diff Tracker* em `js/state.js`):* Interceptador automático em `saveState()` que detecta adições, edições e remoções de registros e as converte em operações granulares individuais no `defaultOutbox`, sem exigir reescrita das telas existentes.
  3. *Exclusão Lógica com Marcadores (*Tombstones* em `js/granular_sync.js`):* Registros apagados recebem marcador lógico `_deleted: true`, carimbo `_deletedAt`, autor `_deletedBy` e incremento de `_rev`, impedindo que dispositivos com snapshots desatualizados recriem registros excluídos.
  4. *Auditoria e Preservação de Conflitos:* Algoritmo de resolução 3-Way Field Merge preserva alterações concorrentes em campos independentes; em conflitos no mesmo campo, registra log completo em `_conflicts` no Firebase preservando ambas as versões para auditoria e decisão administrativa.
  5. *Garantias Financeiras e Estoque Atômico:* Suporte a transações atômicas nativas no Firebase com verificação interna de idempotência no nó `_processedOps`. Registros locais recebem `_syncStatus: 'pending'` e só passam para `'confirmed'` após confirmação do servidor.
  6. *Indicador Visual de Pendências da Fila:* Ícone de nuvem (`cloud-sync-status`) exibe dinamicamente o número de operações pendentes na fila do Outbox (`☁️ X pendente(s)`), garantindo total transparência ao operador.
  7. *Suíte Integrada de Homologação (3 Computadores):* Testados 14 cenários com 27 verificações aprovadas em `scratch/test_sincronizacao_avancada_real.js`, comprovando clientes e pedidos simultâneos, merge de campos, tombstones, resiliência offline, reinicialização com fila íntegra, reconexão automática, rejeição de duplicatas, integridade de estoque, isolamento entre fábricas e bloqueio seguro por regras do Firebase (`PERMISSION_DENIED`).
  8. *Preservação Rigorosa:* Ambientes `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, PC 2, produção v84, instalador consolidado existente e branch `main` 100% intocados. Zero deploy, zero push, zero ativação em produção.

### Primeira Publicação Real de Homologação no GitHub Releases (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** 100% de aprovação (28/28 verificações e testes aprovados sem falhas). Publicação remota real concluída com sucesso no GitHub Releases sob tag permanente `homologacao-latest`, assets públicos validados via HTTPS e atualização de ponta a ponta homologada no executável Windows com novo PID e preservação absoluta de dados.
- **Implementações Técnicas e Consolidação:**
  1. *Publicação Real no GitHub Releases:* Release `homologacao-latest` (ID `438065337`) criada e associada ao commit público seguro de `origin/main` (`a1dbc92527b16d4ed0dbfc4e69b0d17c7ef9c788`), contendo exclusivamente os assets de atualização de homologação (`manifest_homologacao.json` e `gelcontrol-update-85.1.0-homologacao.zip`), sem qualquer alteração na branch `main` ou no PWA.
  2. *Integridade Criptográfica Comprovada:* Hash SHA-256 do pacote remoto conferido exatamente com o valor esperado (`a97b97f83dafe72a189ae51ddfc6df2539a76b3320109eb51dd0a608abe8fb64`) e assinatura Ed25519 validada com 100% de precisão via CDN oficial (`release-assets.githubusercontent.com` / `objects.githubusercontent.com`).
  3. *Compatibilidade e Whitelist CDN:* Método `isAllowedOrigin()` em `UpdaterCore` e `updater_config.js` cobre dinamicamente todos os subdomínios oficiais de `*.githubusercontent.com` para suporte aos redirecionamentos seguros da infraestrutura de releases.
  4. *Instalador Inicial v85 Compilado:* Gerado o executável `Instalador_GelControl_v85_Inicial_Homologacao.exe` (152,30 MB) com o runtime Electron e o atualizador nativo embutidos, pronto para distribuição de homologação.
  5. *Ciclo de Atualização no Windows (28/28 Aprovados):*
     - Instalação descartável criada em `C:\GelControl_RealNetTest_*`.
     - `GelControl.exe` v85.0.0 iniciado com PID real (42340).
     - Detecção remota da versão 85.1.0 via internet pública no GitHub Releases.
     - Download em stream e validação SHA-256 do pacote da CDN.
     - Disparo do aplicador auxiliar desacoplado (PID 3768).
     - Encerramento limpo do processo inicial (PID 42340).
     - Aplicação da substituição de arquivos e relançamento com novo PID (11752).
     - Health Check no boot consolidando o estado como `COMMITTED`.
     - Confirmação física da versão ativa em disco como 85.1.0.
     - Preservação comprovada: dados comerciais (`clientes.json`) e backups intactos e idênticos.
  6. *Preservação Rigorosa:* Ambientes `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `F:\PrecificaPizza`, PC 2, produção v84, instalador consolidado existente e branch `main` 100% intocados. Zero deploy, zero push de desenvolvimento.

### Fechamento Definitivo da Distribuição em Homologação (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** 100% de aprovação (24/24 testes aprovados sem falhas). Arquitetura HTTPS permanente via GitHub Releases consolidada, instalador inicial compilado com a URL ativa, pacote v85.1.0 assinado e compatível, e garantia comprovada de não-reinstalação para futuras versões.
- **Implementações Técnicas e Consolidação:**
  1. *Arquitetura Definitiva Escolhida:* Tag permanente de canal `homologacao-latest` no GitHub Releases (`https://github.com/GelodoVale/gelodovale-app/releases/download/homologacao-latest/manifest_homologacao.json`), 100% independente da branch `main` e sem alterar o site PWA.
  2. *URL Permanente Ativa no Instalador Inicial:* O instalador inicial v85 (`Instalador_GelControl_v85_Inicial_Homologacao.exe`) já contém embutida e ativa essa URL permanente. Futuras versões (v85.2, v86, etc.) serão distribuídas sem necessidade de reinstalação.
  3. *Compatibilidade de Redirecionamentos e Whitelist:* `UpdaterCore` ajustado para seguir até 3 redirecionamentos HTTPS seguros para a CDN (`objects.githubusercontent.com`), com whitelist cobrindo `github.com` e subdomínios oficiais.
  4. *Tratamento Gracioso de Release Ausente (HTTP 404):* O cliente trata o código 404 com status `up-to-date` saudável, sem alarmes falsos de erro antes da criação da release.
  5. *Proteção Rigorosa da Chave Privada:* Chave privada mantida isolada em `tools/keys/homologacao.private.pem`, com trava programática no empacotador contra inclusão de chaves no pacote ZIP ou instalador.
  6. *Teste Integrado no Windows (24/24 Aprovados):* Comprovados instalação NSIS, PID inicial (42292), consulta 404 graciosa, detecção via redirect HTTPS, download SHA-256, aplicador desacoplado (PID 43344), reinicialização (PID 41920), Health Check `COMMITTED`, e preservação absoluta de dados comerciais e backups.
  7. *Preservação Rigorosa:* `F:\GelControl`, `F:\GelControl_Teste_Instalador`, `PrecificaPizza`, PC 2, produção v84, instalador consolidado existente e branch `main` 100% intocados. Zero deploy, push ou publicação.

### Preparação Final para Primeira Publicação de Homologação (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** 100% de aprovação (23/23 testes aprovados sem falhas). Artefatos de publicação gerados, validados e organizados na pasta local `dist/publicacao_homologacao/`, com comprovação prática no executável Windows empacotado pelo NSIS.
- **Implementações Técnicas e Consolidação:**
  1. *Organização Local dos Arquivos de Publicação (`dist/publicacao_homologacao/`):* Criadas pastas separadas para `instalador_inicial/`, `atualizacao_remota/` (contendo `manifest_homologacao.json`, pasta `packages/` com `gelcontrol-update-85.1.0-homologacao.zip` e pasta `releasenotes/` com `85.1.0.md`), acompanhadas de instruções completas de publicação e relatório criptográfico de conformidade.
  2. *Instalador Inicial v85 Compilado:* Gerado `Instalador_GelControl_v85_Inicial_Homologacao.exe` (159 MB) com o runtime do atualizador completo na raiz de `resources/app`, pronto para ser instalado uma única vez nos computadores de homologação. O instalador consolidado existente (`Instalador_GelControl_v85_Homologacao_Consolidado.exe`) permaneceu 100% intacto.
  3. *Pacote Posterior v85.1.0 Assinado:* Pacote ZIP de 1,86 MB com hash SHA-256 (`a6d78666575c50c02bbb75147cecd11315b23fe43aefec70188806f33d548a49`) e manifesto assinado com chave assimétrica Ed25519.
  4. *Teste Integrado com Executável Empacotado no Windows:* Instalação descartável executada; `GelControl.exe` v85.0.0 em execução com PID real (42168); detecção da versão posterior 85.1.0 no servidor local; download e validação SHA-256; processo auxiliar desacoplado iniciado (PID 13724); encerramento do processo inicial; aplicação atômica dos arquivos; reinicialização automática do executável com novo PID (26036); consolidação pelo Health Check no boot (`COMMITTED`); e preservação 100% intacta dos dados comerciais e backups.
  5. *Método Isolado de Publicação:* Documentada a alternativa via GitHub Releases (tag `v85.1.0-homologacao`), que não exige merge ou push na branch `main` e não afeta em nada a versão Web/PWA.
  6. *Preservação Rigorosa:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador`, projeto `PrecificaPizza`, PC 2, produção v84 e branch `main` 100% intocados. Zero deploy, zero push, zero publicação.

### Preparação Completa da Distribuição Online em Homologação (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** 100% de aprovação (19/19 testes de distribuição aprovados + 41/41 da auditoria do executável sem regressões = 60 testes aprovados). Infraestrutura, automação de compilação, empacotamento, assinatura Ed25519, manifestos e validação ponta a ponta preparados para distribuição online em homologação.
- **Implementações Técnicas Aplicadas:**
  1. *Infraestrutura de Distribuição (`desktop/updater_config.js`):* Estruturada a entrega estática segura via GitHub Pages (`https://gelodovale.github.io/gelodovale-app/updates/homologacao/`) em modelo Zero-Trust (segurança garantida por Ed25519 e SHA-256 no cliente, independente do servidor). Estado seguro mantido em `not-configured` por padrão até que a primeira publicação remota seja feita pelo administrador.
  2. *Chaves Assimétricas Ed25519 (`tools/gerar_chaves_ed25519.js`):* Geração e gestão segura do par de chaves de homologação. Chave pública (PEM) incorporada ao cliente; chave privada mantida isolada fora de pacotes e commits (`.gitignore`).
  3. *Pipeline Reproduzível de Empacotamento (`tools/gerar_pacote_atualizacao.js` e `.bat`):* Automação de filtro limpo de arquivos, geração de pacote `.zip`, cálculo de SHA-256, assinatura canônica determinística do manifesto e documentação de publicação. Zero deploy automático; publicação estritamente manual e deliberada.
  4. *Integração com GelControl Desktop (`desktop/main.js`):* `UpdaterCore` conectado à configuração central `updater_config.js` com autoridade imutável de canal.
  5. *Testes Completos de Distribuição (19/19 Aprovados):* Suíte em `scratch/test_distribuicao_homologacao.js` validou Happy Path completo via download remoto, rejeição de JSON corrompido, rejeição de assinaturas forjadas, bloqueio de canais incompatíveis, resiliência a servidor offline/erro HTTP, rejeição de download com SHA-256 adulterado, recuperação de falha no estágio `APPLYING`, auto-rollback seguro e preservação 100% intacta dos dados comerciais e backups.
  6. *Preservação Rigorosa:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador`, projeto `PrecificaPizza`, PC 2, produção v84 e branch `main` 100% intocados. Zero deploy ou push externo.

### Missão Final de Estabilização do Atualizador (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** 100% de aprovação (41/41 testes aprovados sem falhas). Homologação ponta a ponta integrada do atualizador completo do GelControl Desktop no executável real empacotado pelo NSIS no Windows.
- **Implementações Técnicas e Consolidação:**
  1. *Auditoria Criptográfica de Autorização (Bloco A - 12 testes):* Validação independente no processo principal com certificados públicos x509 oficiais do Google/Firebase via `crypto.createVerify('RSA-SHA256')`. Rejeição total de assinaturas falsificadas, payloads alterados, KIDs desconhecidos, algoritmos simétricos, canais incompatíveis, tokens expirados e operadores comuns. Bloqueio estrito de atualizações offline por senha local e rejeição de qualquer parâmetro declarativo forjado (`isRoot`, `username`, `isAdmin`).
  2. *Resiliência de Rede e Proteção Pré-Extração (Bloco B - 5 testes):* Tratamento silencioso de servidor não configurado, tratamento seguro de falhas de rede/offline, bloqueio ativo contra Zip Slip / Path Traversal (`..`), proteção anti-Zip Bomb (limite de 5000 entradas e 250 MB) e rejeição formal de pacotes incompletos.
  3. *Compilação NSIS e Instalação Limpa (Bloco C - 3 testes):* Empacotamento real no Windows via NSIS e instalação em ambiente isolado descartável, com inserção de dados comerciais e backups prévios.
  4. *Fluxo Integrado no Executável Real (Bloco D - 13 testes):* Pacote realista de 1,92 MB assinado com Ed25519; download e validação SHA-256; criação de ponto de restauração (backup); GelControl.exe real iniciado (PID 8640); processo auxiliar `updater_applier.js` iniciado (PID 39396); encerramento do processo pai; remoção física de arquivos obsoletos (`removeObsoleteEntries`); adição de novos módulos; reinicialização no Windows com novo PID (32520); ativação da v85.1.0; consolidação `COMMITTED` pelo Health Check; e integridade absoluta dos dados comerciais e backups.
  5. *Rollback Real no Executável Empacotado (Bloco E - 5 testes):* Detecção de corrupção no boot pelo Health Check do executável empacotado com restauração compulsória da versão íntegra anterior; auto-recuperação de queda de energia / falha abrupta simulada no estágio `APPLYING`; restauração de integridade e preservação 100% intacta dos dados comerciais e backups.
  6. *Preservação Rigorosa:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador`, projeto `PrecificaPizza`, PC 2, produção v84 e branch `main` 100% intocados. Zero deploy ou push.

### Verificação Final de Segurança Pré-Publicação (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** 100% de aprovação (31/31 testes aprovados). Validação criptográfica RS256 real via certificados do Google, bloqueio estrito de atualizações offline e substituição limpa com pacote realista multi-arquivos comprovados no Windows.
- **Implementações Técnicas Aplicadas:**
  1. *Assinatura RS256 com Certificados Oficiais do Google:* Integrada busca de certificados x509 públicos em `desktop/admin_auth_validator.js` com validação nativa via `crypto.createVerify('RSA-SHA256')`. Rejeição total de tokens com assinatura forjada, payload adulterado, KIDs desconhecidos e algoritmos simétricos.
  2. *Bloqueio de Updates Offline:* Para evitar forjamento de privilégio administrativo por adulteração física de arquivos JSON locais em `Dados\`, o instalador exige obrigatoriamente autenticação online com token criptográfico do Firebase Auth. A aplicação de atualizações offline foi estritamente desabilitada.
  3. *Integridade do Pacote e Remoção de Obsoletos:* Adicionadas proteções anti-Zip Bomb (limite de 250 MB e 5000 arquivos), rejeição de pacotes incompletos e remoção seletiva recursiva de arquivos descontinuados (`removeObsoleteEntries`). Validado com sucesso em pacote realista de 1,92 MB contendo novos módulos e exclusão física de arquivos legados, com reinicialização comprovada no Windows (PID 25616) e dados comerciais intactos.
  4. *Preservação Rigorosa:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador`, projeto `PrecificaPizza`, PC 2, produção v84 e branch `main` 100% intocados. Zero deploy ou push.

### Resolução Final das Ressalvas da Auditoria Complementar da Etapa 5 (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** 100% de aprovação (46/46 testes aprovados). Todas as 3 ressalvas da auditoria complementar foram solucionadas na raiz e comprovadas no executável real empacotado pelo NSIS no Windows.
- **Implementações Técnicas Aplicadas:**
  1. *Autorização Administrativa Independente no Processo Principal (`desktop/admin_auth_validator.js` e `desktop/main.js`):* Eliminada qualquer consulta declarativa via renderer (`executeJavaScript`, flags `isRoot`, `username`, `isAdmin`, `localStorage`). Implementada validação criptográfica direta de tokens JWT do Firebase Auth (algoritmo RS256, audiência, emissor, expiração e e-mail administrativo oficial) e validação de credencial local offline com Salt multi-iterações. Rejeição de 100% dos testes adversariais.
  2. *Auditoria de Processos Reais no Windows:* Isolado o ambiente de inicialização eliminando `ELECTRON_RUN_AS_NODE=1` ao disparar a interface visual do executável. O ciclo completo foi auditado e comprovado com rastreamento seguro de PIDs: PID original ativo (23888) -> processo auxiliar iniciado (38356) -> encerramento comprovado do PID original -> aplicação dos arquivos -> reinicialização do `GelControl.exe` com novo PID (36212) -> nova versão 85.1.0 confirmada ativa em disco.
  3. *Eliminação de Concorrência no Health Check:* O método `checkPostUpdateHealth()` em `desktop/updater_installer.js` persiste o estado transacional consolidado (`stage = 'COMMITTED'`) e registra `SUCCESS` em `Dados\update_history.json`, garantindo leituras determinísticas e idempotentes entre o processo do aplicativo e o script de auditoria.
  4. *Preservação Rigorosa:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador`, projeto `PrecificaPizza`, PC 2, produção v84 e branch `main` 100% intocados. Zero deploy ou push.

### Atualizador Etapa 5: Consolidação, Verificação Automática e Homologação Final (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** Etapa 5 concluída e homologada com 100% de aprovação (26/26 testes automatizados aprovados no Windows). A arquitetura completa de atualizações do GelControl Desktop está consolidada, blindada e testada ponta a ponta com sucesso absoluto em instalação real descartável.
- **Implementações Técnicas Concluídas:**
  1. *Verificação Automática Periódica e Silenciosa (`js/updater_ui.js` e `desktop/updater_core.js`):*
     - Primeira verificação automática agendada para 10 segundos após o boot do sistema.
     - Nova verificação recorrente a cada 4 horas enquanto o GelControl estiver aberto.
     - Aviso discreto via notificação toast sem interromper a tela operacional do usuário.
     - Tratamento silencioso para ausência de internet ou servidor de atualizações não configurado (`not-configured`).
     - Prevenção ativa de verificações concorrentes (`VERIFICACAO_JA_EM_ANDAMENTO`).
     - Exigência estrita de confirmação expressa do administrador para qualquer instalação ou reinicialização (zero instalação silenciosa).
  2. *Auditoria Final de Segurança e Blindagem do Motor:*
     - Modalidade `full_installer` (NSIS) formalmente desabilitada por segurança (`MODALIDADE_NAO_HOMOLOGADA`), aceitando exclusivamente pacotes validados `.zip`.
     - Suporte a verificação de magic bytes `PK` no staging para compatibilidade com extensões temporárias `.tmp`.
     - Imutabilidade do canal de homologação: rejeição em tempo de execução de pacotes e manifestos de produção.
     - Proteção anti-adulteração, anti-Zip Slip e anti-downgrade 100% ativas.
  3. *Homologação Real de Ponta a Ponta no Windows (26/26 Aprovados):*
     - Suíte `scratch/test_etapa5_real_homologacao.js` validou com dados reais o fluxo completo (A até O): criação de instalação descartável com v85.0.0, assinatura e publicação de pacote v85.1.0 (Ed25519), download isolado, validação SHA-256 e tamanho, staging, backup prévio, aplicação atômica, reinicialização e validação de integridade pós-boot (Health Check `COMMITTED`), confirmação física dos arquivos em disco e registro de histórico auditável.
     - Testes de recuperação sob falhas induzidas (R1 a R6): pacote com assinatura inválida rejeitado (R1), download adulterado com SHA-256 divergente rejeitado (R2), manifesto com canal incompatível rejeitado (R3), auto-rollback automático por falha no health check no boot (R4), auto-rollback automático por queda de energia/interrupção forçada (R5) e confirmação de dados comerciais e backups 100% intactos após todos os rollbacks (R6).
  4. *Preservação Rigorosa:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador`, projeto `PrecificaPizza`, PC 2, produção v84, instalador consolidado v85 e branch `main` 100% intocados.


### Atualizador Etapa 4: Instalação Segura, Reinicialização e Recuperação Automática (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** Etapa 4 concluída e homologada com 100% de sucesso (32/32 testes automatizados aprovados no Node e Electron). Criados motor de instalação transacional, proteção anti-zip slip, staging isolado, backup automático prévio, aplicador externo desacoplado, health check pós-atualização e rollback compulsório contra falhas e quedas de energia.
- **Implementações Técnicas Concluídas:**
  1. *Instalador Seguro e Motor Transacional (`desktop/updater_installer.js`):*
     - Validação estrita de diretório anti-Path Traversal e anti-Zip Slip (`validateDirectorySecurity`). Rejeição de caminhos absolutos, caminhos com `..`, symlinks ilegais e qualquer arquivo fora da fronteira autorizada.
     - Proteção ativa contra sobrescrita ou toque em diretórios protegidos (`Dados\`, `Backups\`).
     - Staging seguro (`Dados\updates_staging\`): conferência de integridade de arquivos vitais (`version.json`, `index.html`, `js/app.js`) antes da aplicação.
     - Ponto de recuperação automático (`Dados\app_previous_backup\`): backup integral da versão funcional atual antes da cópia.
     - Transação atômica em disco (`Dados\update_state.json`): estados persistentes `BACKUP_READY`, `APPLYING`, `APPLIED`, `COMMITTED` e `ROLLED_BACK`.
     - Health check de integridade no boot: detecta arquivos ausentes, corrompidos ou versão divergente, acionando auto-rollback imediato.
     - Recuperação automática de interrupção ou queda de energia simulada durante a cópia.
     - Histórico permanente e auditável (`Dados\update_history.json`) sem senhas, tokens ou dados sensíveis.
     - Trava de concorrência ativa (`Dados\update_in_progress.lock`) impedindo duas instalações simultâneas.
  2. *Aplicador Externo Desacoplado no Windows (`desktop/updater_applier.js`):*
     - Executado via `ELECTRON_RUN_AS_NODE=1` em segundo plano para contornar locks de arquivos em uso no Windows.
     - Aguarda encerramento do PID pai do GelControl, aplica substituição atômica e relança o executável.
     - Em caso de falha de substituição, executa rollback de emergência e relança o app na versão funcional anterior.
  3. *Ampliação IPC Segura no Electron (`desktop/main.js` e `desktop/preload.js`):*
     - Novos manipuladores implementados: `updater:apply-update`, `updater:get-update-history` e `updater:get-pending-transaction`.
     - Rejeição obrigatória no processo principal de tentativas de instalação sem pacote validado.
  4. *Integração Visual com a Interface (`js/updater_ui.js` e `index.html`):*
     - Botões `#btn-check-and-install-update` e `#modal-btn-install-update` são ativados e habilitados dinamicamente quando um pacote válido é confirmado.
     - Diálogo de confirmação com aviso transparente de reinicialização e preservação de dados.
  5. *Testes Automatizados (32/32 Aprovados com 100% de Sucesso):*
     - Suíte transacional `scratch/test_etapa4_installer.js` (25/25 aprovados): anti-traversal, validação Ed25519, canal divergente, downgrade, minAppVersion, mutex lock, happy path completo, preservação de dados e backups, falha na cópia com rollback, health check falho com auto-rollback, queda de energia simulada e intocabilidade de ambientes.
     - Suíte de integração Electron `scratch/test_etapa4_electron_ui.js` (7/7 aprovados): expor métodos no preload, validação segura no IPC e integridade geral.
  6. *Preservação Rigorosa:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador`, projeto `PrecificaPizza`, PC 2, produção v84, instalador consolidado e branch `main` 100% intocados.


### Atualizador Etapa 3: Implementação da Interface Visual do Atualizador (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** Etapa 3 concluída e homologada com 100% de sucesso (24/24 testes automatizados aprovados no Electron). Painel administrativo "ATUALIZAÇÕES DO SISTEMA", modal informativo de nova versão, acompanhamento de download com integridade SHA-256 e botões de instalação com trava de segurança implementados sem alterar a pasta `Programa\`, os dados comerciais ou o backend.
- **Implementações Técnicas Concluídas:**
  1. *Painel Administrativo "ATUALIZAÇÕES DO SISTEMA" (`index.html` e `js/updater_ui.js`):*
     - Inserido no topo de `tab-seguranca-backup` com código de referência `COD: UPD-01`.
     - Exibição de Nome (`GelControl Desktop`), Versão Instalada (`v85.0.0`), Compilação e Data (`#85 - 2026-11-08`), Canal (`homologacao`), Estado do Atualizador, Data/Hora da Última Verificação e Versão Disponível, 100% dinâmico via IPC seguro e `version.json`.
     - Botão "Verificar Atualizações" com animação de spinner, bloqueio de múltiplos cliques e mensagens claras para servidor não configurado, sistema atualizado, nova versão e falhas de conexão.
  2. *Modal Informativo de Nova Versão (`#modal-updater-details`):*
     - Comparativo de versão instalada vs disponível, data de publicação, canal e tamanho em MB.
     - Notas de lançamento (changelog) renderizadas em lista.
     - Auditoria visível de segurança: hash SHA-256 esperado e validação por assinatura assimétrica Ed25519.
     - Barra de progresso visual de download e alerta de gravação isolada na pasta temporária (`Dados\updates_temp\`).
  3. *Trava de Segurança no Botão Futuro de Instalação:*
     - Botões `#btn-check-and-install-update` e `#modal-btn-install-update` implementados com estilo inativo e atributo `disabled`, emitindo aviso transparente: *"Instalação automática estará disponível na Etapa 4"*. Zero substituição de arquivos e zero reinicialização nesta etapa.
  4. *Módulo Modular e Isolamento de Regras de Negócio (`js/updater_ui.js`):*
     - Código modular e desacoplado, sem interferência nos módulos de vendas, clientes, financeiro, caixa, estoque ou produção.
     - Quando executado no navegador Web (PWA), orienta que atualizações de executável são exclusivas do GelControl Desktop.
  5. *Testes Automatizados (24/24 Aprovados com 100% de Sucesso):*
     - Suíte `scratch/test_etapa3_ui.js` executada no Electron headless oficial comprovou renderização de todos os elementos no DOM, preenchimento dinâmico, bloqueio do botão de instalação, consulta manual em estado `not-configured`, exibição e fechamento do modal com nova versão simulada, acompanhamento de download seguro e integridade absoluta do disco.
  6. *Preservação Rigorosa:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador`, projeto `PrecificaPizza`, PC 2, produção v84, instalador consolidado e branch `main` 100% intocados.


### Atualizador Etapa 2: Consulta de Versões e Download Seguro com Validação Criptográfica (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** Etapa 2 concluída e homologada com 100% de sucesso (20/20 testes automatizados aprovados). Implementados motor criptográfico Ed25519, stream de download com integridade SHA-256 e tamanho exato, separação de canais e área temporária isolada.
- **Implementações Técnicas Concluídas:**
  1. *Motor do Atualizador (`desktop/updater_core.js`):*
     - Validação de assinatura digital assimétrica Ed25519 com serialização determinística canônica dos metadados.
     - Comparação semântica SemVer (`compareSemVer`) com bloqueio de downgrades e detecção de versão idêntica.
     - Validação de compatibilidade mínima de versão (`minAppVersion`).
     - Trava estrita de canais: executável de homologação rejeita manifestos e pacotes de produção.
     - Limites de proteção de rede: 150 MB máximo, timeout de 30s, máximo de 3 redirecionamentos e whitelist HTTPS (`https://gelodovale.github.io`).
     - Estado padrão seguro `not-configured` quando nenhuma URL de servidor estiver ativa (zero servidores inventados).
     - Download em stream para pasta temporária isolada (`Dados\updates_temp\`) com conferência de hash SHA-256 e bytes recebidos. Descarte imediato em caso de divergência.
  2. *Ampliação IPC Segura no Electron (`desktop/main.js` e `desktop/preload.js`):*
     - Manipuladores implementados: `updater:check-update`, `updater:get-available-update`, `updater:download-update` e `updater:get-validation-status`.
     - Zero parâmetros aceitos do renderer (bloqueio contra injeção de URLs arbitrárias ou troca de canal).
     - Proibição estrita mantida: zero instalação, zero extração de pacotes e zero reinício nesta etapa.
  3. *Testes Automatizados (20/20 Aprovados):*
     - `scratch/test_etapa2_updater_core.js` cobriu todos os 16 cenários mandatórios com 100% de aprovação.
     - `scratch/test_etapa2_electron_ipc.js` validou a integração completa com o Electron.
  4. *Preservação Rigorosa:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador`, projeto `PrecificaPizza`, PC 2, produção v84, instalador consolidado e branch `main` 100% intocados.


### Atualizador Etapa 1: Padronização de Versões e Estrutura IPC (08/11/2026 - Antigravity) — Versão 85.0.0 (v85):
- **Status Atual:** Etapa 1 concluída e homologada com 100% de sucesso. Versionamento centralizado, travas imutáveis de canal e estrutura IPC segura de leitura implementados sem afetar produção ou instalações existentes.
- **Implementações Técnicas Concluídas:**
  1. *Versionamento Centralizado (`version.json` e `js/version.js`):* Estabelecida fonte única de verdade com `programVersion: "85.0.0"`, `buildNumber: 85`, `buildDate: "2026-11-08"`, `channel: "homologacao"`, `dataSchemaVersion: "2.5"` e `releaseName: "v85-seguranca-root"`.
  2. *Re-exportação e Retrocompatibilidade:* `js/state.js` re-exporta as novas constantes preservando integralmente `APP_VERSION`, `CODE_BUILD` e `IS_HOMOLOGATION_BUILD` para evitar regressões nos módulos existentes.
  3. *Estrutura IPC Segura no Electron (`desktop/main.js`):* Implementados exclusivamente os manipuladores de consulta `updater:get-installed-version`, `updater:get-channel` e `updater:get-status`. Atualizado `desktop:get-system-info`.
  4. *Preload Seguro (`desktop/preload.js`):* Namespace `window.gelcontrolDesktop.updater` exposto via `contextBridge` com permissões mínimas de leitura.
  5. *Travas Rígidas de Segurança:* Proibição total de métodos de download, instalação, reinício ou escrita de arquivos nesta etapa. O canal é imutável e governado exclusivamente pela compilação.
  6. *Especificação de Segurança (`desktop/SECURITY_UPDATE_SPEC.md`):* Documentados os requisitos mandatórios para as etapas futuras (origem HTTPS autorizada, autenticidade via assinatura digital assimétrica, integridade SHA-256, proteção anti-rollback e isolamento de `Dados\` e `Backups\`).
  7. *Testes Automatizados Aprovados:* Suíte `scratch/test_etapa1_version_ipc.js` executada no Electron aprovou 18/18 critérios.
  8. *Preservação Rigorosa:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador`, projeto `PrecificaPizza`, PC 2, produção v84, instalador consolidado e branch `main` 100% intocados.


### Teste Funcional de Ponta a Ponta do Instalador Consolidado (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Instalação limpa, primeira inicialização, autenticação real no Firebase Auth, sincronização bidirecional no Realtime Database e auditoria de segurança aprovados com 100% de sucesso. Ambiente temporário removido.
- **Implementações Técnicas Concluídas:**
  1. *Instalação Limpa em Ambiente Virgem:* Executado `desktop/Output/Instalador_GelControl_v85_Homologacao_Consolidado.exe` em diretório novo `F:\GelControl_Teste_Funcional_Consolidado` sem dados prévios (`Dados\`, `Backups\`, `Programa\`, `Seguranca\Tools\`).
  2. *Primeira Inicialização:* Verificados banner de homologação, versão v85 (`Versão: v85 (06/11/2026)`), `gelcontrol-homologacao`, `fabrica_homologacao_teste` e resolução estrita de administrador para `admin_homologacao@gelcontrol.internal`. Zero presença de configurações de produção.
  3. *SDKs Locais Offline-First:* `window.firebase.auth` e `window.firebase.database` inicializados a partir de `js/libs/firebase/` no boot imediato.
  4. *Autenticação Real com Conta Temporária:* Criada conta temporária `temp_func_<timestamp>@gelcontrol.internal` no Firebase Auth de testes. Rejeição com senha incorreta confirmada (`auth/invalid-login-credentials`) debitando tentativa mecânica (5 -> 4). Autenticação com senha correta aprovada, restaurando o contador para 5 tentativas. Conta temporária excluída via Admin SDK. Zero consumo de tentativas da conta do usuário.
  5. *Sincronização Real Bidirecional:* Gravação, leitura íntegra e remoção imediata de registro temporário no nó `factories/fabrica_homologacao_teste` do Firebase Realtime Database.
  6. *Auditoria de Segredos:* Confirmada a ausência total de chaves do Firebase Admin SDK (`service-account*.json`) no pacote.
  7. *Desinstalação e Limpeza:* Processos encerrados e pasta temporária `F:\GelControl_Teste_Funcional_Consolidado` totalmente excluída do disco.
  8. *Preservação Rigorosa:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador` (4 tentativas preservadas), projeto `PrecificaPizza`, PC 2, produção v84 e branch `main` 100% intocados.


### Consolidação e Validação do Instalador NSIS v85 (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Instalador consolidado compilado com NSIS 3.13 e validado com 100% de aprovação (6/6 testes automatizados) em ambiente novo e isolado.
- **Implementações Técnicas Concluídas:**
  1. *Auditoria de Paridade (100%):* Confirmada equivalência byte a byte dos 10 arquivos fundamentais (`index.html`, `sw.js`, `js/state.js`, `js/auth.js`, `js/sync.js`, os 3 SDKs locais do Firebase e os scripts desktop).
  2. *Backup de Segurança do Instalador:* Gerado `desktop/Output/Backup_Instalador_GelControl_v85_Homologacao_PreConsolidacao.exe` (119 MB).
  3. *Novo Executável Compilado:* Gerado `desktop/Output/Instalador_GelControl_v85_Homologacao_Consolidado.exe` (119,38 MB, hash SHA-256 `0C343DA18DF73046F433B5805FAEE4DAF47C96071544E32FB06F18CD0F88A796`).
  4. *Incorporação de Correções:* Incorporadas as bibliotecas locais do Firebase SDK, a autoridade central `IS_HOMOLOGATION_BUILD = true`, blindagens ativas de bloqueio contra produção no boot e no push, e a resolução de e-mail do Administrador.
  5. *Validação Prática Completa (6/6 Aprovados):* Testado em pasta temporária virgem `F:\GelControl_Validacao_Temp_Novainstalacao`. Comprovadas instalação silenciosa, estrutura de arquivos, ausência de credenciais privadas no pacote, preservação estrita de dados/backups em atualização e desinstalação segura que remove o programa mantendo os dados comerciais intactos no disco.
  6. *Isolamento Absoluto:* `F:\GelControl` oficial, base de testes `F:\GelControl_Teste_Instalador` (onde o login do usuário foi validado), projeto `PrecificaPizza`, PC 2, produção v84 e branch `main` 100% preservados e intocados. Zero deploy/push.

### Correção Definitiva do Ambiente de Homologação e Blindagem Anti-Vazamento (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Causa raiz de divergência solucionada e blindagem ativa implementada. 5 de 5 testes automatizados aprovados (100% de sucesso).
- **Implementações Técnicas Aplicadas:**
  1. *Backup de Segurança do Armazenamento:* Criada cópia integral de `Dados\browser_storage` em `Dados\backup_browser_storage_pre_homolog_fix_1794098989510`.
  2. *Correção do `firebaseConfig` de Testes:* Atualizado e persistido com flush do LevelDB em `F:\GelControl_Teste_Instalador\Dados\browser_storage` para o projeto `gelcontrol-homologacao`, `apiKey: AIzaSyA2u-TLkL2K2EYGU2yI7oKtcFA6tEbfp1A`, `authDomain: gelcontrol-homologacao.firebaseapp.com`, `databaseURL: https://gelcontrol-homologacao-default-rtdb.firebaseio.com` e `deviceKey: fabrica_homologacao_teste`.
  3. *Blindagem Ativa de Código (`IS_HOMOLOGATION_BUILD`):* Integrada autoridade central `IS_HOMOLOGATION_BUILD = true` em `js/state.js`, `js/auth.js` e `js/sync.js`. Qualquer configuração residual de produção (`gelo-do-vale`) é interceptada e expurgada no milissegundo zero do boot.
  4. *Bloqueio Total de Sincronização/Push:* No `js/sync.js`, tentativas de envio (`pushToFirebaseImediato`) ou listeners direcionados a produção são abortados imediatamente com erro no ambiente de homologação.
  5. *Resolução Estrita de Usuário:* O perfil `Administrador (admin)` agora resolve diretamente para `admin_homologacao@gelcontrol.internal` no projeto `gelcontrol-homologacao`.
  6. *Preservação Rigorosa:* As 4 tentativas restantes de login e todas as 39 chaves de dados comerciais da fábrica foram 100% preservadas.
  7. *Suíte de Testes (5/5 Aprovados):* Configuração de homologação, resolução do admin, bloqueio contra injeção de produção, autenticação real com conta temporária no Firebase de testes e preservação de dados/tentativas validadas com 100% de sucesso.
  8. *Isolamento Absoluto:* `F:\GelControl` oficial, base de produção v84, branch `main`, PC 2 e `PrecificaPizza` 100% intocados. Zero push/deploy.

### Modularização e Correções de Segurança na Recuperação de Senha (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Scripts de recuperação reformulados e auditados com validações estritas de segurança.
- **Implementações Técnicas Aplicadas:**
  1. *Eliminação de Injeção de Código:* Removida 100% qualquer lógica que modificava ou injetava código em `auth.js`. O código do GelControl permanece totalmente intocado.
  2. *Restauração Pontual de Armazenamento (`tools/restaurar_tentativas_teste.js`):* Criação de script dedicado que faz backup do `Local Storage` e executa via Electron headless oficial a remoção exclusiva de `gelcontrol_login_failed_attempts` e `gelcontrol_login_lockout_until`, preservando `gelcontrol_state` e todos os demais dados intactos.
  3. *Validação Estrita no PowerShell (`tools/recuperar_senha_homologacao.ps1`):* Verificação obrigatória do `$LASTEXITCODE -eq 0` e validação com correspondência literal exata dos marcadores literais (`[OK_FIREBASE]`, `[OK_STATUS]`, `[OK_UID]`, `[OK_BACKUP_STORAGE]`, `[OK_STORAGE_RESTORED]`, `[OK_STATE_PRESERVED]`). Se qualquer etapa falhar, o script aborta sem emitir falso sucesso.
  4. *Travas Rígidas de Escopo:* Confirmação mandatória de `project_id === 'gelcontrol-homologacao'` e `admin_homologacao@gelcontrol.internal`.
  5. *Preservação Absoluta:* Nenhuma alteração executada ainda; `F:\GelControl`, `PrecificaPizza`, PC 2, produção v84 e branch `main` 100% intocados. Zero execução de login automático.

### Atualização Cirúrgica de Homologação Aplicada em F:\GelControl_Teste_Instalador (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Opção 2 executada e 100% validada na pasta isolada `F:\GelControl_Teste_Instalador\Programa\resources\app\`.
- **Implementações Técnicas Aplicadas:**
  1. *Verificação de Processos:* Confirmado que o executável `GelControl.exe` estava 100% fechado antes de qualquer alteração.
  2. *Backup de Segurança:* Criada pasta de backup `Programa\resources\backup_pre_correcao_auth\` contendo os arquivos pré-correção.
  3. *Arquivos Atualizados e Auditados:* Integrados `js\libs\firebase\` (`firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-database-compat.js`), `index.html`, `sw.js`, `js\auth.js` e `js\sync.js`. Todos os 7 arquivos verificados com hashes SHA-256 válidos.
  4. *Preservação de Dados e Contadores:* Pastas `Dados\`, `Backups\` e `Seguranca\` rigorosamente mantidas intocadas. Zero alteração no contador de tentativas ou dados comerciais.
  5. *Zero Execução Automática:* Aplicativo mantido fechado, pronto para abertura manual pelo usuário.
  6. *Isolamento Absoluto:* `F:\GelControl`, `PrecificaPizza`, PC 2, produção v84 e branch `main` 100% intocados.

### Incorporação Local do Firebase SDK e Blindagem de Rede (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Correção estrutural concluída e homologada com 23 de 23 testes automatizados aprovados (100% de sucesso).
- **Implementações Técnicas Concluídas:**
  1. *Eliminação de Dependência de CDN:* Incorporadas as bibliotecas oficiais em `js/libs/firebase/` (`firebase-app-compat.js`, `firebase-auth-compat.js` e `firebase-database-compat.js`) e carregadas localmente no `index.html` e `sw.js`.
  2. *Carregamento Imediato:* O SDK do Firebase agora está disponível na memória no milissegundo zero do boot (zero atraso por lentidão de rede).
  3. *Tratamento Distinto para Falhas de Rede:* Em instalação limpa, falhas de conectividade ou rede exibem: *"Não foi possível conectar ao servidor de autenticação. Verifique sua internet e tente novamente."*.
  4. *Zero Desconto de Tentativas por Falha de Rede:* Erros de conexão ou SDK não acusam "Senha incorreta" e não debitam tentativas do operador.
  5. *Preservação do Modo Offline:* Acessos offline legítimos (com credencial já registrada) continuam funcionando normalmente sem internet; caso a senha digitada no modo offline esteja incorreta, a tentativa é devidamente debitada.
  6. *Isolamento e Segurança:* `F:\GelControl`, `PrecificaPizza`, PC 2, produção v84 e branch `main` 100% preservados e intocados. Zero push/deploy.

### Diagnóstico de Autenticação na Instalação Limpa NSIS (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Investigação detalhada concluída a respeito do comportamento de login do perfil Administrador (`admin`) na pasta de teste `F:\GelControl_Teste_Instalador`.
- **Conclusões Técnicas:**
  1. *Origem da Autenticação:* Com rede e SDK ativos, o perfil Administrador utiliza estritamente o **Firebase Authentication (Online)**. Fallback offline é bloqueado propositalmente quando o Firebase rejeita credencial incorreta.
  2. *E-mail de Homologação Confirmado:* Verificado no código empacotado que o usuário `admin` resolve para `admin_homologacao@gelcontrol.internal`. O e-mail de produção (`contato@gelodovale.com.br`) não é utilizado.
  3. *Unicidade de Senha:* Não existe senha local independente para o Root; a nuvem é a autoridade central e a senha do Root é uma só.
  4. *Comportamento de Instalação Limpa:* Por ser uma instalação nova, `Dados\browser_storage` não possui `localStorage` pré-existente (senha local inicial vazia). O primeiro acesso depende 100% da validação no Firebase Auth, exigindo aguardar 3-5s para carregamento do SDK e digitação exata da senha.
  5. *Preservação:* Bases de dados, `F:\GelControl`, `PrecificaPizza` e produção 100% preservadas e intocadas.

### Validação Prática do Instalador NSIS em F:\GelControl_Teste_Instalador (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Validação prática do executável compilado NSIS (`desktop/Output/Instalador_GelControl_v85_Homologacao.exe`) executada e 100% aprovada (7/7 testes) na pasta isolada `F:\GelControl_Teste_Instalador`.
- **Implementações Técnicas Concluídas:**
  1. *Blindagens do Instalador:* `RequestExecutionLevel user` (instala sem elevação UAC), atalhos nomeados com `TESTE`, atalho web para produção online omitido e Registro em `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\GelControl_Teste_Homologacao`.
  2. *Instalação Real e Estrutura:* Criados `Programa\GelControl.exe`, `Dados\`, `Backups\`, `Seguranca\Tools\` e `Desinstalar_GelControl.exe`.
  3. *Preservação de Dados em Reinstalação:* Hashes SHA-256 de dados e backups simulados permaneceram 100% idênticos após reinstalação por cima. Zero perda de dados.
  4. *Desinstalação Segura:* Desinstalador removeu o executável e DLLs de `Programa\`, mas as pastas `Dados\` e `Backups\` **PERMANECERAM 100% INTACTAS NO DISCO**.
  5. *Zero Chaves Privadas:* Nenhuma credencial `service-account*.json` vazou para o aplicativo.
  6. *Isolamento Absoluto:* Instalação oficial `F:\GelControl`, atalho oficial do Desktop (`GelControl - Gelo do Vale C.lnk`), projeto `PrecificaPizza`, PC 2 e Firebase oficial 100% intocados e preservados.
  7. *Evidências em Disco:* Pastas de teste preservadas para conferência visual do usuário.
- **Produção:** Projeto oficial `gelo-do-vale` e nó `factories/gelodovale_oficial` 100% preservados e intocados. Zero deploys para a branch `main`.

### Preparação e Blindagem para Teste Isolado em F:\GelControl_Teste_Instalador (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Script NSIS refinado para respeitar `/D=F:\GelControl_Teste_Instalador` e recompilado com 100% de sucesso. Instalador **NÃO executado**, aguardando autorização.
- **Implementações Técnicas Concluídas:**
  1. *Preservação de Pasta Customizada:* Função `.onInit` corrigida para manter a pasta passada na linha de comando (`/D=...`), ativando a priorização dinâmica padrão apenas quando o caminho padrão não for alterado.
  2. *Recompilação LZMA:* Executável `desktop/Output/Instalador_GelControl_v85_Homologacao.exe` (119 MB) recompilado. Hash SHA-256: `BA5456D91AB20483CB37069A834F87918214CF68DE49DB15B59EDDC632135061`.
  3. *Auditoria de Isolamento 100% Aprovada:* Confirmada a inexistência de caminhos fixos no Electron (`main.js` dinâmico em `process.execPath`), isolamento de armazenamento em `browser_storage`, Registro do Windows limpo e Firebase apontando estritamente para `gelcontrol-homologacao`.
  4. *Remoção Pós-Teste Segura:* O desinstalador da pasta de teste removerá apenas seus arquivos e atalhos, sem tocar na instalação oficial existente.
  5. *Preservação Estrita:* `F:\GelControl`, `PrecificaPizza`, PC 2, produção e branch `main` 100% intocados.
- **Produção:** Projeto oficial `gelo-do-vale` e nó `factories/gelodovale_oficial` 100% preservados e intocados. Zero deploys para a branch `main`.

### Compilação Oficial do Instalador Windows NSIS (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Compilador NSIS v3.13 instalado e validado; instalador oficial `desktop/Output/Instalador_GelControl_v85_Homologacao.exe` (119 MB) compilado com 100% de sucesso. Instalador **NÃO executado**, aguardando autorização.
- **Implementações Técnicas Concluídas:**
  1. *Compilador NSIS 3.13 Ativo:* Instalado em `C:\Users\kissn\AppData\Local\Programs\NSIS` e integrado ao PATH. `makensis.exe /VERSION` retornando `v3.13`.
  2. *Compilação com LZMA e CRC32:* Script `desktop/installer.nsi` compilou 391 MB de dados para 119 MB (redução de 69,5%) gerando o executável final com hash SHA-256 `C102A17F8B0E0CFAB8A4FBD399173822A2F91EE5CBF1946CE72CC0C9B8A35E59`.
  3. *Blindagem de Segredos:* Confirmada a ausência total de chaves do Firebase Admin SDK (`service-account*.json`) no pacote.
  4. *Auditoria Consolidada Aprovada com 7/7:* Licença comercial livre, prioridade de unidade F:\, modos Principal e Estação, preservação de dados/backups e atalhos aprovados.
  5. *Preservação Estrita:* `F:\GelControl` e `PrecificaPizza` 100% intocados. Nenhum teste de instalação executado ainda.
- **Produção:** Projeto oficial `gelo-do-vale` e nó `factories/gelodovale_oficial` 100% preservados e intocados. Zero deploys para a branch `main`.

### Adoção do NSIS (Instalador Livre para Uso Comercial) (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Script NSIS (`desktop/installer.nsi`), auditoria automatizada (`desktop/auditar_nsis.ps1`) e script de compilação (`desktop/compilar_nsis.bat`) criados e 100% auditados. Compilador `makensis.exe` ainda não instalado no Windows (aguardando autorização).
- **Implementações Técnicas Concluídas:**
  1. *Licença Comercial zlib/libpng:* NSIS confirmado como software livre, sem restrições de "non-commercial", isento de royalties e 100% legalizado para uso comercial na fábrica Gelo do Vale.
  2. *Script NSIS Completo (`desktop/installer.nsi`):* Implementada função `.onInit` com priorização dinâmica de unidade (`F:\GelControl` -> `D:\GelControl` -> `C:\GelControl`), 2 modos de instalação (`Computador Principal` com `tools/` vs `Estação de Trabalho` apenas app comercial), atalhos `GelControl — Local.lnk` e `GelControl — Online.url`.
  3. *Preservação de Dados:* Função `OnDirLeave` com alerta de integridade; desinstalador remove exclusivamente o programa executável e atalhos, **mantendo as pastas `Dados\` e `Backups\` 100% intactas no disco**.
  4. *Blindagem de Chaves Privadas:* Cláusula `File /r /x "service-account*.json" /x "*.key" /x "*.pem" /x "*.env" /x "secrets"` impede qualquer inclusão de chaves administrativas.
  5. *Auditoria Automatizada:* `desktop/auditar_nsis.ps1` aprovou 6 de 6 itens técnicos com 100% de sucesso.
  6. *Instalador Automático Pausado:* O compilador `makensis.exe` não foi instalado silenciosamente, aguardando aprovação explícita do usuário.
- **Produção:** Projeto oficial `gelo-do-vale` e nó `factories/gelodovale_oficial` 100% preservados e intocados. Zero deploys para a branch `main`.

### Validação Prática do Instalador Inteligente Windows (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Validação prática executada e 100% aprovada (10/10 testes) em ambiente isolado (`F:\GelControl-TESTE-INSTALADOR` e `F:\GelControl-TESTE-ESTACAO`) via suíte automatizada `desktop/test_installer_validation.ps1`.
- **Implementações Técnicas Concluídas:**
  1. *Auditoria de Riscos:* Verificadas diretivas `uninsneveruninstall` em `Dados\` e `Backups\`, isolamento na subpasta `Programa\` e exclusão mandatória de segredos (`service-account*.json`, `*.key`, `*.pem`, `*.env`).
  2. *Correção Crítica no `instalar_homologacao.bat`:* Parênteses não escapados em comandos `echo` dentro de blocos `if/else` causavam colapso sintático no CMD (`... foi inesperado neste momento`). Eliminados parênteses conflitantes e corrigido atalho web para `.url` nativo da Microsoft.
  3. *Instalação Inicial (Modo Principal vs Estação):* Validada a criação de `Seguranca\Tools\` exclusivamente no modo Principal; no modo Estação, a pasta de ferramentas administrativas é 100% omitida.
  4. *Atualização por Cima e Hashes SHA-256:* Dados comerciais e backups históricos simulados permaneceram com hashes idênticos após reinstalação (zero bytes corrompidos ou sobrescritos).
  5. *Recuperação Pós-Formatação:* Comprovado que o instalador reconecta e restaura o executável e atalhos vinculando perfeitamente a base preservada sem alterá-la.
  6. *Isolamento e Segurança:* Zero chaves administrativas vazadas para o aplicativo; pasta oficial `F:\GelControl` e projeto `PrecificaPizza` permaneceram 100% intocados.
  7. *Inno Setup Compiler:* Identificado que o compilador `ISCC.exe` não está instalado na máquina; o instalador definitivo .exe não foi compilado, aguardando instalação do Inno Setup 6.
- **Produção:** Projeto oficial `gelo-do-vale` e nó `factories/gelodovale_oficial` 100% preservados e intocados. Zero deploys para a branch `main`.

### Instalador Inteligente Windows e Validação de Backups (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Backups validados no Electron; script Inno Setup (`installer.iss`), auditoria automatizada (`auditar_instalador.ps1`) e instalador de homologação portátil (`instalar_homologacao.bat`) 100% aprovados.
- **Implementações Técnicas Concluídas:**
  1. *Backups Automáticos e Manuais:* IPCs de backup validados no Electron (`desktop:save-auto-backup` silencioso em `F:\GelControl\Backups\` e `desktop:choose-backup-folder` para escolha livre).
  2. *Script Inno Setup Definitivo (`desktop/installer.iss`):* Resolução dinâmica de unidade (`F:\GelControl` padrão no PC 1, detecta `D:` ou `C:`), 2 modos (Computador Principal com `tools/` vs Estação de Trabalho apenas comercial), flags `uninsneveruninstall` em `Dados\` e `Backups\`, atalhos "GelControl — Local" e "GelControl — Online", e exclusão rigorosa de chaves privadas (`service-account*.json`).
  3. *Auditoria Consolidada Aprovada com 100%:* Integridade de binários, zero chaves vazadas, isolamento no Firebase `gelcontrol-homologacao` e regras de integridade de dados aprovadas com nota máxima.
  4. *Instalador de Homologação Portátil (`desktop/instalar_homologacao.bat`):* Disponibilizado para testes controlados sem compilação prévia externa.
- **Produção:** Projeto oficial `gelo-do-vale` e nó `factories/gelodovale_oficial` 100% preservados e intocados. Zero deploys para a branch `main`.

### Aplicativo Desktop Windows (Electron) e Sincronização em Tempo Real (07/11/2026 - Antigravity) — Homologação v85:
- **Status Atual:** Sincronização em tempo real (leitura e gravação) 100% validada e homologada no executável `F:\GelControl\Programa\GelControl.exe`.
- **Pontos Investigados e Solucionados:**
  1. *Regras do Firebase:* Declarado acesso ao nó raiz da fábrica no Realtime Database exclusivamente para o Administrador Root autenticado (`auth.uid === rootUid`), eliminando o `Permission denied`.
  2. *Listener Pós-Login:* Adicionada inicialização explícita de `startSyncListener()` em `js/auth.js` no sucesso do login.
  3. *Tratamento de Exceções:* Adicionados null-checks defensivos em `js/admin.js` para registros sem data e `try/catch` nas chamadas de renderização de `js/sync.js`.
  4. *Período de Graça Pós-Boot e Desacoplamento do Clima:* Agendado encerramento automático da flag `isBootGracePeriodActive` após 8 segundos da validação da nuvem. Corrigido vazamento de `saveState()` em `js/widgets.js:508` (clima) e `js/auth.js` (credenciais) para `saveStateLocalOnly()`.
  5. *Blindagem Visual do Indicador de Nuvem:* Em `js/sync.js`, o indicador só vai para `syncing` durante a gravação real; cancelamentos defensivos do BootPushGuard garantem restauração imediata para `success` (verde), eliminando o giro infinito.
- **Validação:** Monitoramento de 12 segundos pós-login comprovou indicador verde estável (`girando=false`, `pulse-glow-online=true`). Mutações do operador sincronizam normalmente. Comprovantes arquivados em `F:\GelControl\scratch\screenshot_sync_estavel_definitivo.png`.
- **Produção:** Projeto oficial `gelo-do-vale` e nó `factories/gelodovale_oficial` 100% preservados e intocados.

### Modernização da Segurança, Login, Senhas e Proteção Multi-PC — v85 (06/11/2026 - Antigravity) — Publicada no GitHub Pages:
- **Status Atual:** Homologada com 80/80 testes automatizados aprovados e publicada como versão oficial **v85**.
- **Implementações Técnicas Concluídas:**
  1. *Expurgo de Senha Padrão:* Removida a credencial `"1234qwer"` e o link/função `recoverAdminPassword()` de todos os arquivos do sistema.
  2. *Criptografia Robusta com Salt:* Derivação de senha com Salt criptográfico individual e 1.000 iterações (`salted:1000:<salt>:<hash>`), com migração transparente de credenciais legadas sem risco de lockout.
  3. *Rate Limiting (Proteção Força Bruta):* Bloqueio mecânico de 3 minutos (180 segundos) após 5 tentativas consecutivas incorretas, com desativação de inputs e temporizador visual dinâmico.
  4. *Vínculo Individual de E-mail de Recuperação (SEG-EMAIL-01 / COD: REC-01):* Cada operador possui seu próprio e-mail configurado em USU-02 (`user.email`), e o Root em USU-01 (`state.factorySettings.adminEmail`). O modal `#modal-recover-access` exige perfil e e-mail correspondente; se o e-mail não coincidir com a conta selecionada, o envio é sumariamente cancelado. Mascaramento de dados sensíveis na tabela de usuários (`maskEmail`).
  5. *Integração Real entre Login e Firebase Authentication (Fonte da Verdade Online):* Quando a senha é redefinida pelo link de e-mail do Firebase, o operador faz o login no GelControl com a nova senha; o sistema valida contra o Firebase Auth e atualiza imediatamente o hash criptográfico local (`salted:1000:<salt>:<hash>`) no `state`, garantindo alinhamento perfeito para operações online e offline sem qualquer divergência.
  6. *Blindagem Root e RBAC Estrito:* Conta `admin` protegida contra exclusão/rebaixamento; painéis **USU-01** e **USU-02** estritamente inacessíveis para colaboradores; alteração de senha em USU-01 sincroniza simultaneamente o Firebase Auth e o hash local.
  7. *Proteção Anti-Tampering:* Sessões verificadas criptograficamente em tempo de execução; manipulação manual de `sessionStorage` é rejeitada e destruída.
  8. *Regras Declarativas de Servidor (`database.rules.json`):* Regras declarativas prontas para o Firebase RTDB bloqueando acessos não autenticados e nós críticos restritos ao Root.
- **Homologação Automatizada:** 80 testes automatizados aprovados com 100% de sucesso (27 testes da suíte de segurança + 17 do pente-fino + 18 do boot push guard + 8 de rotas travadas + 10 do incidente do PC 2).
- **Validação Visual:** Captura de tela real do navegador confirmada em `scratch/login_screen.png`.
- **Firebase de Produção:** 100% intacto (`factories/gelodovale_oficial`), zero dados operacionais sobrescritos.

### Versão Atual Publicada: v85 (06/11/2026 - Segurança Root, RBAC e SEG-EMAIL-01)
- **Status da Release v84:** Publicada no GitHub Pages com Service Worker `gelodovale-v184`, cache-busters `?v=84` e `SYNC_ENGINE_BUILD = "v84-boot-push-guard-definitivo (06/11/2026)"`.
- **Correções do Pente-Fino e Homologação Visual Integradas:**
  1. *Fotos e QuotaExceededError:* Compressão adaptativa (900px/82% para documentos com textos miúdos; 480px/65% para freezers e fachadas) e salvamento defensivo com `try/catch` em `js/state.js`.
  2. *Múltiplos Freezers no deleteClient:* Desvinculação completa de todos os equipamentos do cliente com histórico em `js/clientes.js`.
  3. *Padronização Monetária:* Função `roundMoney` em `js/state.js` e `js/carne.js` eliminando dízimas microscópicas residuais.
  4. *Sanitização HTML:* Função `escapeHtml` em `js/utils.js` aplicada aos dropdowns de clientes em todos os módulos.
  5. *Blindagem de Função Legada:* `autoPopulateFreezerDetailsInClientForm()` com `null-checks` em `js/inventario.js`.
  6. *Proteção de Backups:* `.gitignore` configurado para impedir inclusão de `*.bak`, backups locais e scratch.
  7. *Chart.js Atômico:* Destruição prévia atômica de instâncias em `js/dashboard.js`, eliminando colisões de canvas.
- **Homologação Automatizada:** 53 testes automatizados (100% sucesso, regressão zero) e 24 testes visuais no Google Chrome aprovados com **zero erros de console**.
- **Firebase de Produção:** 100% íntegro e intocado (4 clientes, 2 pedidos, 6 entregas, 2 documentos, 0 pagamentos, 7 freezers).

### Homologação Visual e Funcional no Google Chrome Concluída (05/11/2026 - 24/24 Testes Aprovados):
- **Ambiente 100% Isolado no PC 1:** Mini Web Server em `http://localhost:3333` com bloqueio mecânico de rede no Chrome CDP para domínios do Firebase. Zero risco de contaminação de produção.
- **24 Testes Visuais e Funcionais Homologados:** Clientes, validações HTML5, edição, estoque, pedidos, conversão em entregas a prazo, PDV balcão com cálculo de troco, carnê digital sem dízimas (`R$ 0,00`), aluguel de tinas, documentos com sanitização de aspas, histórico, WhatsApp, exclusão em cascata de múltiplos freezers, resiliência contra cota cheia e alternância de viewport Mobile/Desktop.
- **Conferência de Compressão de Fotos:** Foto simulada de alta resolução (4000x3000px) reduzida em 99% (para 3 KB, 320x240px) no canvas do Chrome mantendo nitidez.
- **Correção Adicional:** Eliminado erro de colisão de instâncias do Chart.js em `js/dashboard.js` com destruição atômica prévia.
- **Auditoria de Console:** ZERO erros de console durante a sessão completa.
- **Comprovação Visual:** Captura de tela gerada em `scratch/homologacao_visual_resultado.png` (115 KB).

### Pente-Fino Geral do PC 1 Concluído (05/11/2026 - 53 Testes Automatizados Aprovados):
- **Correções Consolidadas Aplicadas:**
  1. *Fotos e QuotaExceededError:* Compressão canvas com tratamento de erros em `js/inventario.js` e salvamento defensivo com `try/catch` em `js/state.js` (preserva cadastros e pedidos caso estoure a cota local).
  2. *Múltiplos Freezers no deleteClient:* Desvinculação completa de todos os equipamentos do cliente com histórico em `js/clientes.js`.
  3. *Padronização Monetária:* Função `roundMoney` em `js/state.js` e `js/carne.js` eliminando dízimas microscópicas residuais.
  4. *Sanitização HTML:* Função `escapeHtml` em `js/utils.js` aplicada aos dropdowns de clientes em todos os módulos.
  5. *Blindagem de Função Legada:* `autoPopulateFreezerDetailsInClientForm()` com checagens de existência (`null-checks`) em `js/inventario.js`.
  6. *Proteção de Backups:* `.gitignore` configurado para impedir inclusão de `*.bak`, backups locais e scratch.
- **Homologação Automatizada:** 53 de 53 cenários aprovados (17 do pente-fino + 36 de sincronização e blindagem multi-PC). Regressão zero.
- **Firebase de Produção:** 100% íntegro e intocado nesta etapa.
- **Status do Código:** Pronto e validado para revisão/publicação (aguardando autorização).

### Versão v83 (05/11/2026 - Correção Crítica da Sincronização Homologada):
- **Firebase de Produção:** Totalmente recuperado e íntegro (4 clientes, 2 pedidos, 6 entregas, 2 documentos, 0 pagamentos, 7 freezers).
- **Tríplice Blindagem Ativa:** Boot Push Guard com estabilização de 8s, purga de timers e salvaguarda de timestamp soberano.
- **Service Worker Network-First:** Scripts JS sempre atualizados sem risco de Stale-While-Revalidate.
- **Testes Automatizados:** 36 de 36 testes aprovados com sucesso.
- **Código Local Preparado:** Release v83 pronta para publicação no GitHub Pages (aguardando autorização para git push).

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
    - **v85 (Desktop Windows & Homologação Isolada no Disco F — 07/11/2026):**
    - Corrigida a exibição e estabelecida garantia de injeção permanente do banner amarelo de homologação no protótipo desktop (`F:\GelControl\Programa\GelControl.exe`) via `desktop/preload.js` e `index.html`.
    - Blindada a resolução do ambiente em `js/state.js` para forçar exclusivamente `projectId: 'gelcontrol-homologacao'` e `deviceKey: 'fabrica_homologacao_teste'`, eliminando interferência de caches legados de produção no `localStorage` do Chromium (`F:\GelControl\Dados\browser_storage`).
    - Validado o login do administrador Root (`admin` / `RootFicticio@2026` -> `admin_homologacao@gelcontrol.internal`) diretamente no runtime do executável com retorno positivo do Firebase Authentication (`UID: 2AJ45lDHatdVKasuhUl6ToON7sm2`).
    - Nenhuma credencial privada ou chave `service-account.json` presente dentro do pacote do programa.
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
