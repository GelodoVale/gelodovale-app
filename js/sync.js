// --- SISTEMA DE SINCRONIZAÇÃO EM TEMPO REAL (FIREBASE) ---
import { state, updateState, saveStateLocalOnly, APP_VERSION } from './state.js';
import { renderApp } from './app.js';
import { defaultOutbox } from './outbox.js';
import { GranularSyncAdapter } from './granular_sync.js';

let firebaseSDKLoaded = false;
let fbDatabaseRef = null;
let isFirstLoad = true;        // Controla se é a primeira carga (não re-renderiza desnecessariamente)
let isSyncing = false;         // Evita loop de sync (local→nuvem→local→nuvem...)
let pushDebounceTimer = null;  // Debounce para não spammar o Firebase a cada tecla
let lastSeenRemoteVersion = null; // Guarda a versão do banco de dados na nuvem para evitar downgrades

let granularAdapterInstance = null;

// ─── FEATURE FLAG: SINCRONIZAÇÃO GRANULAR (FASE 8E) ─────────────────────────
// Por padrão, DESATIVADA (false). Quando false, o sistema utiliza 100% o mecanismo
// monolítico v80 sem nenhuma alteração no comportamento de produção.
export function isGranularSyncActive() {
    return !!(state && state.featureFlags && state.featureFlags.granularSync);
}

export function getGranularAdapter() {
    if (!granularAdapterInstance) {
        granularAdapterInstance = new GranularSyncAdapter({
            deviceKey: (state.firebaseConfig && state.firebaseConfig.deviceKey) || 'gelodovale_oficial'
        });
    }
    return granularAdapterInstance;
}

function normalizeVersion(ver) {
    const v = parseFloat(ver);
    if (isNaN(v)) return 1.0;
    return v;
}

// ─── CARREGAR SDK DO FIREBASE ──────────────────────────────────────────────
export function loadFirebaseSDK(callback) {
    if (firebaseSDKLoaded || (window.firebase && window.firebase.database)) {
        firebaseSDKLoaded = true;
        if (callback) callback();
        return;
    }

    const scriptApp = document.createElement('script');
    scriptApp.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
    scriptApp.onload = () => {
        const scriptDB = document.createElement('script');
        scriptDB.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
        scriptDB.onload = () => {
            firebaseSDKLoaded = true;
            if (callback) callback();
        };
        scriptDB.onerror = () => updateSyncStatusUI('error');
        document.head.appendChild(scriptDB);
    };
    scriptApp.onerror = () => updateSyncStatusUI('error');
    document.head.appendChild(scriptApp);
}

// ─── LISTENER EM TEMPO REAL ────────────────────────────────────────────────
// Fica "escutando" o Firebase 24/7. Quando qualquer dispositivo salvar algo,
// todos os outros recebem a atualização automaticamente em 1-2 segundos.
export function startSyncListener() {
    if (!state.firebaseConfig || !state.firebaseConfig.deviceKey) return;

    const deviceKey = state.firebaseConfig.deviceKey;
    fbDatabaseRef = firebase.database().ref(`factories/${deviceKey}`);

    updateSyncStatusUI('syncing');

    // Remove listener anterior para não duplicar
    fbDatabaseRef.off();
    isFirstLoad = true;

    fbDatabaseRef.on('value', snapshot => {
        // Ignorar atualizações que VIeram deste próprio dispositivo (evita loop)
        if (isSyncing) return;

        const remoteData = snapshot.val();
        
        if (remoteData && remoteData.backupSettings) {
            lastSeenRemoteVersion = remoteData.backupSettings.currentVersion || "1.0";
        }

        // ── Sem dados na nuvem: este dispositivo envia os dados locais ──
        if (!remoteData) {
            console.log('[Sync] Nuvem vazia — enviando dados locais...');
            pushToFirebaseImediato();
            isFirstLoad = false;
            return;
        }

        const localTs  = state.lastUpdated || 0;
        const remoteTs = remoteData.lastUpdated || 0;

        if (isFirstLoad) {
            // ── Primeira carga: quem tiver timestamp mais recente ganha, respeitando a versão do banco ──
            isFirstLoad = false;
            const isFreshInstall = !state.lastUpdated || state.lastUpdated === 0;
            
            let localVer = normalizeVersion(state.backupSettings?.currentVersion);
            let remoteVer = normalizeVersion(lastSeenRemoteVersion);

            if (localVer > remoteVer) {
                console.log(`[Sync] Local tem versão de dados mais recente (${localVer} vs ${remoteVer}) — atualizando nuvem.`);
                pushToFirebaseImediato();
            } else if (isFreshInstall || remoteVer > localVer) {
                console.log(`[Sync] Nuvem tem versão de dados mais recente (${remoteVer} vs ${localVer}) ou cache limpo — aplicando dados da nuvem.`);
                aplicarDadosRemoto(remoteData);
            } else if (remoteTs > localTs) {
                console.log('[Sync] Nuvem mais recente na abertura — aplicando dados da nuvem...');
                aplicarDadosRemoto(remoteData);
            } else if (localTs > remoteTs) {
                console.log('[Sync] Local mais recente na abertura — enviando para nuvem...');
                pushToFirebaseImediato();
            } else {
                updateSyncStatusUI('success');
            }
        } else {
            // ── Sincronização em tempo real: comparar versões e timestamps ──
            let localVer = normalizeVersion(state.backupSettings?.currentVersion);
            let remoteVer = normalizeVersion(lastSeenRemoteVersion);

            if (remoteVer > localVer) {
                console.log(`[Sync] ⚡ Versão mais recente na nuvem (${remoteVer} vs ${localVer}) — aplicando atualização.`);
                aplicarDadosRemoto(remoteData);
            } else if (localVer > remoteVer) {
                console.warn(`[Sync] ⚡ Ignorada atualização de versão antiga da nuvem (${remoteVer} vs ${localVer}).`);
                const timeStr = new Date().toLocaleTimeString('pt-BR');
                updateSyncStatusUI('success', `☁️ Dados Locais Preservados contra Concorrência (${timeStr})`);
                
                // Mostrar aviso amigável sem loopar (uma vez a cada 30 segundos no máximo)
                const lastToastTime = window._lastVersionWarningTime || 0;
                if (Date.now() - lastToastTime > 30000) {
                    window._lastVersionWarningTime = Date.now();
                    window.showToast("Aviso: Outro dispositivo está com versão antiga do sistema. Por favor, use 'Limpar Cache e Forçar Recarga' nos outros aparelhos.", "warning");
                }
            } else if (remoteTs > localTs) {
                console.log('[Sync] ⚡ Sincronização em tempo real recebida de outro dispositivo!');
                aplicarDadosRemoto(remoteData);
            } else {
                updateSyncStatusUI('success');
            }
        }
    }, error => {
        console.error('[Sync] Erro no listener:', error);
        updateSyncStatusUI('error');
    });
}

// ─── APLICAR DADOS RECEBIDOS DA NUVEM ─────────────────────────────────────
function aplicarDadosRemoto(remoteData) {
    // Preservar configuração Firebase local (não sobrescrever com a da nuvem)
    const cfgLocal = state.firebaseConfig;

    updateState(remoteData);

    // Sempre manter Firebase ativo com credenciais corretas
    state.firebaseConfig = cfgLocal;

    saveStateLocalOnly();
    renderApp();
    
    // Atualizar visual (Aparência) e campos de configurações se estiverem abertos
    if (window.applyAppearanceTheme) window.applyAppearanceTheme();
    if (window.renderPrecos) window.renderPrecos();

    const timeStr = new Date().toLocaleTimeString('pt-BR');
    updateSyncStatusUI('success', `☁️ Atualização Recebida em ${timeStr}`);

    // Mostrar notificação visual discreta
    mostrarToastSync();
}

export async function triggerGranularSync() {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) return;
    if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
        initFirebase(() => triggerGranularSync());
        return;
    }

    const adapter = getGranularAdapter();
    defaultOutbox.registerSyncHandler(async (op) => {
        return await adapter.applyOperation(firebase.database(), op);
    });

    updateSyncStatusUI('syncing');
    try {
        const res = await defaultOutbox.processQueue();
        if (res.status === 'completed') {
            const timeStr = new Date().toLocaleTimeString('pt-BR');
            updateSyncStatusUI('success', `☁️ Sincronização Granular (${timeStr})`);
        }
    } catch (e) {
        console.warn('[Sync] Erro no processamento granular do outbox:', e);
        updateSyncStatusUI('error');
    }
}

// ─── ENVIAR PARA O FIREBASE (COM DEBOUNCE) ─────────────────────────────────
// Debounce de 1.5s: espera o usuário parar de digitar antes de enviar
export function pushToFirebase() {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
        updateSyncStatusUI('disabled');
        return;
    }

    // FEATURE FLAG: Se granularSync estiver desativada (padrão v80), mantém fluxo legado exato
    if (!isGranularSyncActive()) {
        clearTimeout(pushDebounceTimer);
        updateSyncStatusUI('syncing');
        pushDebounceTimer = setTimeout(() => {
            pushToFirebaseImediato();
        }, 1500);
        return;
    }

    // Fluxo Granular Seguro (Fase 8E) quando habilitado
    triggerGranularSync();
}

// Envio imediato (sem debounce) — usado internamente
function pushToFirebaseImediato() {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) return;

    // SAFEGUARD: Não enviar para a nuvem se o estado local for um estado virgem/vazio (ex: primeira abertura no PC novo)
    // para não correr o risco de zerar os dados que já estão salvos lá.
    const hasLocalData = !!localStorage.getItem("gelcontrol_state");
    if (!hasLocalData || !state.lastUpdated || state.lastUpdated === 0) {
        console.warn('[Sync] Abortado: estado local parece virgem ou sem dados no localStorage. Não vamos sobrescrever a nuvem com dados vazios.');
        return;
    }

    // SAFEGUARD 2: Não enviar para a nuvem se a versão local for menor que a última versão da nuvem observada
    if (lastSeenRemoteVersion) {
        let localVer = normalizeVersion(state.backupSettings?.currentVersion);
        let remoteVer = normalizeVersion(lastSeenRemoteVersion);
        
        if (remoteVer > localVer) {
            console.warn(`[Sync] Abortado: A nuvem possui uma versão de dados mais recente (${remoteVer}) que a local (${localVer}). Sobrescrita cancelada para evitar regressão.`);
            const timeStr = new Date().toLocaleTimeString('pt-BR');
            updateSyncStatusUI('error', `⚠️ Nuvem tem versão mais recente (${timeStr})`);
            return;
        }
    }

    if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
        initFirebase();
        return;
    }

    const deviceKey = state.firebaseConfig.deviceKey;
    if (!deviceKey) return;

    isSyncing = true;
    updateSyncStatusUI('syncing');

    // Para permitir login de colaboradores e manter a mesma senha de administrador
    // em múltiplos aparelhos conectados, sincronizamos o estado com as senhas preservadas.
    const pushStartedAt = Date.now();
    const safeState = JSON.parse(JSON.stringify(state));
    firebase.database().ref(`factories/${deviceKey}`).set(safeState)
        .then(() => {
            const timeStr = new Date().toLocaleTimeString('pt-BR');
            updateSyncStatusUI('success', `☁️ Nuvem Atualizada em ${timeStr}`);
            console.log('[Sync] ✅ Dados enviados para a nuvem com sucesso.');
            // Salvaguarda cirúrgica de transição: limpa estritamente as operações enfileiradas ATÉ
            // o instante pushStartedAt em que o safeState foi capturado. Qualquer operação nova
            // que tenha sido gerada pelo usuário enquanto o envio estava trafegando na rede é 100% PRESERVADA!
            if (defaultOutbox && typeof defaultOutbox.clearOperationsUpTo === 'function') {
                defaultOutbox.clearOperationsUpTo(pushStartedAt);
            }
        })
        .catch(err => {
            console.error('[Sync] Erro ao enviar:', err);
            updateSyncStatusUI('error');
        })
        .finally(() => {
            // Liberar flag após pequeno delay para não capturar o próprio evento
            setTimeout(() => { isSyncing = false; }, 2000);
        });
}

// ─── INICIALIZAR FIREBASE ──────────────────────────────────────────────────
export function initFirebase(callback) {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
        updateSyncStatusUI('disabled');
        if (callback) callback();
        return;
    }

    const { apiKey, projectId, databaseURL, deviceKey } = state.firebaseConfig;
    if (!apiKey || !projectId || !databaseURL || !deviceKey) {
        updateSyncStatusUI('error');
        if (callback) callback();
        return;
    }

    updateSyncStatusUI('syncing');

    loadFirebaseSDK(() => {
        try {
            const config = { apiKey, projectId, databaseURL };
            if (firebase.apps.length === 0) {
                firebase.initializeApp(config);
            }
            startSyncListener();
            if (callback) callback();
        } catch (error) {
            console.error('[Sync] Erro ao inicializar Firebase:', error);
            updateSyncStatusUI('error');
            if (callback) callback();
        }
    });
}

// ─── FORÇAR SINCRONIZAÇÃO MANUAL ──────────────────────────────────────────
export function forceManualSync() {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
        window.showToast('Sincronização desativada. Ative nas configurações primeiro.', 'warning');
        return;
    }
    state.lastUpdated = Date.now();
    saveStateLocalOnly();

    if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
        initFirebase(() => pushToFirebaseImediato());
    } else {
        pushToFirebaseImediato();
    }
}

// ─── TOGGLE FIREBASE ON/OFF ────────────────────────────────────────────────
export function toggleFirebaseSync(checked) {
    if (!state.firebaseConfig) {
        state.firebaseConfig = { enabled: false, apiKey: '', projectId: '', databaseURL: '', deviceKey: '' };
    }
    state.firebaseConfig.enabled = checked;
    // Se o usuário desativou manualmente, marcamos para não reativar automático
    if (!checked) {
        state.firebaseConfig._manuallyDisabled = true;
    } else {
        state.firebaseConfig._manuallyDisabled = false;
    }
    saveStateLocalOnly();
    if (checked) {
        initFirebase();
    } else {
        if (fbDatabaseRef) fbDatabaseRef.off();
        updateSyncStatusUI('disabled');
    }
}

// ─── SALVAR CONFIGURAÇÕES FIREBASE DO PAINEL ADMIN ────────────────────────
export function saveFirebaseSettings() {
    const enabled    = document.getElementById('cfg-fb-enabled').checked;
    const apiKey     = document.getElementById('cfg-fb-api-key').value.trim();
    const projectId  = document.getElementById('cfg-fb-project-id').value.trim();
    const databaseURL= document.getElementById('cfg-fb-db-url').value.trim();
    const deviceKey  = document.getElementById('cfg-fb-device-key').value.trim();

    // Validar se todos os campos estão preenchidos ao ativar
    if (enabled && (!apiKey || !projectId || !databaseURL || !deviceKey)) {
        window.showToast('Preencha todas as configurações do Firebase antes de ativar a sincronização.', 'warning');
        return;
    }

    state.firebaseConfig = { enabled, apiKey, projectId, databaseURL, deviceKey };

    // Usar pushToFirebaseImediato para não criar loop
    if (state.lastUpdated && state.lastUpdated !== 0) {
        state.lastUpdated = Date.now();
    }
    saveStateLocalOnly();
    if (enabled) initFirebase();

    window.showToast('Configurações do Firebase salvas!', 'success');
}

let lastSyncMessage = "";

export function updateSyncStatusUI(status, customMsg = "") {
    const indicator = document.getElementById('cloud-sync-status');
    if (!indicator) return;

    if (customMsg) {
        lastSyncMessage = customMsg;
    }

    const MAP = {
        success:  { icon: 'cloud',           color: '#00ff64', title: lastSyncMessage || '☁️ Nuvem Ativa — Sincronizado em Tempo Real', spin: false },
        syncing:  { icon: 'refresh-cw',       color: '#ffaa00', title: '🔄 Sincronizando com a Nuvem...', spin: true  },
        error:    { icon: 'alert-triangle',   color: '#ff4d4d', title: lastSyncMessage || '⚠️ Erro de Conexão com a Nuvem', spin: false },
        disabled: { icon: 'cloud-off',        color: 'var(--color-text-muted)', title: 'Sincronização Desativada', spin: false }
    };

    const cfg = MAP[status] || MAP.disabled;
    indicator.title = cfg.title;
    indicator.setAttribute('data-title', cfg.title);
    indicator.innerHTML = `<i data-lucide="${cfg.icon}" class="${cfg.spin ? 'spin-anim' : ''}" style="width:18px;height:18px;color:${cfg.color};"></i>`;

    indicator.classList.remove('pulse-glow-online', 'pulse-glow-syncing', 'pulse-glow-error');
    if (status === 'success') {
        indicator.classList.add('pulse-glow-online');
    } else if (status === 'syncing') {
        indicator.classList.add('pulse-glow-syncing');
    } else if (status === 'error') {
        indicator.classList.add('pulse-glow-error');
    }

    const btnSync = document.getElementById('btn-force-sync');
    if (btnSync) {
        if (status === 'syncing') {
            btnSync.innerHTML = `<i data-lucide="refresh-cw" class="spin-anim" style="width:14px;height:14px;"></i> Sincronizando...`;
            btnSync.disabled = true;
        } else {
            btnSync.innerHTML = `<i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Forçar Sincronização Agora`;
            btnSync.disabled = false;
        }
    }

    if (window.lucide) window.lucide.createIcons();
}

// ─── TOAST DE NOTIFICAÇÃO QUANDO RECEBE ATUALIZAÇÃO ──────────────────────
function mostrarToastSync() {
    // Não mostrar na primeira carga
    const existing = document.getElementById('sync-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'sync-toast';
    toast.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        background: rgba(0,255,100,0.15); border: 1px solid rgba(0,255,100,0.35);
        color: #00ff64; padding: 10px 20px; border-radius: 12px; font-size: 0.85rem;
        font-weight: 600; backdrop-filter: blur(12px); z-index: 99999;
        display: flex; align-items: center; gap: 8px;
        animation: fadeIn 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(0,255,100,0.2);
    `;
    toast.innerHTML = `<i data-lucide="zap" style="width:15px;height:15px;"></i> Atualização recebida de outro dispositivo!`;
    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// ─── SINCRONIZAÇÃO ONEDRIVE LOCAL ──────────────────────────────────────────
export function updateOneDriveStatusUI(status) {
    const indicator = document.getElementById("onedrive-sync-status");
    if (!indicator) return;
    
    // Indicador funcional de Backup Sob Demanda (OneDrive / Disco)
    const title = "Fazer Backup do Sistema (Salvar no OneDrive / Disco)";
    indicator.title = title;
    indicator.setAttribute("data-title", title);
    indicator.style.borderColor = "rgba(0, 240, 255, 0.4)";
    indicator.style.background = "rgba(0, 240, 255, 0.05)";
    indicator.innerHTML = `<i data-lucide="hard-drive-download" style="width: 18px; height: 18px; color: #00f0ff;"></i>`;
    indicator.classList.remove("pulse-glow-onedrive");
    
    if (window.lucide) window.lucide.createIcons();
}

export async function checkOneDriveSync() {
    updateOneDriveStatusUI("ready");
}

export function handleBotaoLerBackupOneDrive() {
    let input = document.getElementById('onedrive-backup-file-input');
    if (!input) {
        input = document.createElement('input');
        input.id = 'onedrive-backup-file-input';
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        input.onchange = (e) => {
            if (typeof window.handleFileSelectedForPreview === 'function') {
                window.handleFileSelectedForPreview(e, 'onedrive');
            } else {
                window.showToast("Módulo de restauração segura em carregamento...", "warning");
            }
        };
        document.body.appendChild(input);
    }
    input.value = '';
    input.click();
}

export async function saveStateToOneDrive() {
    try {
        state.lastUpdated = Date.now();
        saveStateLocalOnly();
        
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const dateStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
        const timeStr = pad(now.getHours()) + '-' + pad(now.getMinutes()) + '-' + pad(now.getSeconds());
        const suggestedName = `backup_gelcontrol_${dateStr}_${timeStr}.json`;
        
        const backupPayload = {
            version: state.backupSettings?.currentVersion || APP_VERSION,
            date: window.getBrazilTimeISO ? window.getBrazilTimeISO() : now.toISOString(),
            data: state
        };
        const contentStr = JSON.stringify(backupPayload, null, 2);

        // Tentativa de gravação direta na pasta do OneDrive via File System Access API
        if ('showDirectoryPicker' in window) {
            try {
                // Solicita ao operador que selecione a pasta de backup (OneDrive ou local)
                const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });

                let finalName = suggestedName;
                let attempts = 0;

                // PROTEÇÃO ABSOLUTA: Varredura de existência prévia com { create: false }
                // Se o arquivo já existir no diretório (com dados ou vazio), gera sufixo exclusivo incremental
                while (attempts < 100) {
                    let fileExists = false;
                    try {
                        const existingHandle = await dirHandle.getFileHandle(finalName, { create: false });
                        if (existingHandle) {
                            fileExists = true;
                        }
                    } catch (checkErr) {
                        if (checkErr.name === 'NotFoundError') {
                            fileExists = false; // Arquivo não existe: nome exclusivo confirmado
                        } else {
                            throw checkErr;
                        }
                    }

                    if (!fileExists) break;

                    attempts++;
                    const extIdx = suggestedName.lastIndexOf('.');
                    const namePart = suggestedName.substring(0, extIdx);
                    const extPart = suggestedName.substring(extIdx);
                    finalName = `${namePart}_(${attempts})${extPart}`;
                }

                if (attempts >= 100) {
                    console.warn('[Backup] Limite de 100 tentativas esgotado sem encontrar nome vago.');
                    window.showToast("Gravação cancelada por segurança: limite de tentativas para nome exclusivo esgotado. Nenhum arquivo foi modificado.", "warning");
                    return;
                }

                // Cria o arquivo garantidamente novo e exclusivo no disco
                const fileHandle = await dirHandle.getFileHandle(finalName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(contentStr);
                await writable.close();

                // Validação física pós-gravação: confirma dados preenchidos no disco
                if (typeof fileHandle.getFile === 'function') {
                    const savedFile = await fileHandle.getFile();
                    if (!savedFile || savedFile.size === 0) {
                        throw new Error("O arquivo gravado resultou em 0 bytes.");
                    }
                }

                if (!state.backupSettings) state.backupSettings = {};
                state.backupSettings.lastBackupDate = new Date().toISOString();
                saveStateLocalOnly();

                showOneDriveToast(`Backup gravado com sucesso: ${finalName}`);
                return;
            } catch (dirErr) {
                // Caso o operador feche o seletor de pasta sem escolher, encerra silenciosamente
                if (dirErr.name === 'AbortError') {
                    console.log('[Backup] Seleção de pasta cancelada pelo usuário.');
                    return;
                }
                console.warn('[Backup] Falha ao gravar via Directory Picker, acionando alternativa:', dirErr);
                window.showToast("Falha na gravação na pasta selecionada. Gerando download alternativo...", "warning");
            }
        }

        // Fallback robusto com nome único (para navegadores sem suporte ou em caso de erro na API)
        const blob = new Blob([contentStr], { type: 'application/json;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", blobUrl);
        downloadAnchor.setAttribute("download", suggestedName);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

        if (!state.backupSettings) state.backupSettings = {};
        state.backupSettings.lastBackupDate = new Date().toISOString();
        saveStateLocalOnly();

        showOneDriveToast(`Backup baixado com sucesso: ${suggestedName}`);
    } catch (e) {
        console.error('[Backup] Erro ao executar backup:', e);
        window.showToast("Erro ao gerar backup: " + e.message, "error");
    }
}

function showOneDriveToast(msg) {
    const existing = document.getElementById('onedrive-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'onedrive-toast';
    toast.style.cssText = `
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: rgba(0,114,255,0.15); border: 1px solid rgba(0,114,255,0.35);
        color: #00f0ff; padding: 10px 20px; border-radius: 12px; font-size: 0.85rem;
        font-weight: 600; backdrop-filter: blur(12px); z-index: 99999;
        display: flex; align-items: center; gap: 8px;
        animation: fadeIn 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(0,114,255,0.2);
    `;
    toast.innerHTML = `<i data-lucide="hard-drive-download" style="width:15px;height:15px;"></i> ${msg}`;
    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// ─── EXPORTS GLOBAIS ───────────────────────────────────────────────────────
window.toggleFirebaseSync   = toggleFirebaseSync;
window.saveFirebaseSettings = saveFirebaseSettings;
window.forceManualSync      = forceManualSync;
window.updateSyncStatusUI   = updateSyncStatusUI;
window.pushToFirebase       = pushToFirebase;
window.initFirebase         = initFirebase;
window.updateOneDriveStatusUI = updateOneDriveStatusUI;
window.checkOneDriveSync     = checkOneDriveSync;
window.saveStateToOneDrive   = saveStateToOneDrive;
window.handleBotaoLerBackupOneDrive = handleBotaoLerBackupOneDrive;
window.isGranularSyncActive  = isGranularSyncActive;
window.getGranularAdapter    = getGranularAdapter;
window.triggerGranularSync   = triggerGranularSync;
