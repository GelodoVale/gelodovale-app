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
- **Versão Atual em Produção:** **Sistema: `v80` (`05/11/2026` - Antigravity / Fase 7 Concluída) | Dados: `v4.4` | Cache PWA: `gelodovale-v180`**
- **Últimas Implementações Concluídas (Histórico Recente):**
  - **Fase 7D (`05/11/2026` — `COD: REL-V80`):**
    - **Incremento da Build Oficial:** Sistema atualizado para `v80 (05/11/2026 - Antigravity)` em `js/state.js`, `#login-version` e `#app-sidebar-version`.
    - **Invalidação e Renovação de Cache (PWA):** `CACHE_NAME` atualizado para `gelodovale-v180` no `sw.js`.
    - **Cache-Busters Atualizados:** Tags `<script>` e `<link>` em `index.html` incrementadas para `?v=80`.
    - **Consolidação Integral da Etapa 7:** Homologação E2E concluída em navegador isolado (Chrome Headless) com 100% de sucesso. Etapa 7 finalizada. Deploy e envio para o GitHub pendentes de autorização explícita do usuário.
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
