// --- SISTEMA DE SINCRONIZAÇÃO EM TEMPO REAL (FIREBASE) ---
import { state, updateState, saveStateLocalOnly } from './state.js';
import { renderApp } from './app.js';

let firebaseSDKLoaded = false;
let fbDatabaseRef = null;
let isFirstLoad = true;        // Controla se é a primeira carga (não re-renderiza desnecessariamente)
let isSyncing = false;         // Evita loop de sync (local→nuvem→local→nuvem...)
let pushDebounceTimer = null;  // Debounce para não spammar o Firebase a cada tecla

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
            // ── Primeira carga: quem tiver timestamp mais recente ganha ──
            isFirstLoad = false;
            if (remoteTs > localTs) {
                console.log('[Sync] Nuvem mais recente na abertura — aplicando dados da nuvem...');
                aplicarDadosRemoto(remoteData);
            } else if (localTs > remoteTs) {
                console.log('[Sync] Local mais recente na abertura — enviando para nuvem...');
                pushToFirebaseImediato();
            } else {
                updateSyncStatusUI('success');
            }
        } else {
            // ── Atualização em tempo real: outro dispositivo fez uma alteração ──
            if (remoteTs > localTs) {
                console.log('[Sync] ⚡ Atualização em tempo real recebida de outro dispositivo!');
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

    updateSyncStatusUI('success');

    // Mostrar notificação visual discreta
    mostrarToastSync();
}

// ─── ENVIAR PARA O FIREBASE (COM DEBOUNCE) ─────────────────────────────────
// Debounce de 1.5s: espera o usuário parar de digitar antes de enviar
export function pushToFirebase() {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
        updateSyncStatusUI('disabled');
        return;
    }
    clearTimeout(pushDebounceTimer);
    updateSyncStatusUI('syncing');
    pushDebounceTimer = setTimeout(() => {
        pushToFirebaseImediato();
    }, 1500);
}

// Envio imediato (sem debounce) — usado internamente
function pushToFirebaseImediato() {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) return;

    // SAFEGUARD: Não enviar para a nuvem se o estado local for um estado virgem/vazio (ex: primeira abertura no PC novo)
    // para não correr o risco de zerar os dados que já estão salvos lá.
    if (!state.lastUpdated || state.lastUpdated === 0) {
        console.warn('[Sync] Abortado: estado local parece virgem (sem lastUpdated). Não vamos sobrescrever a nuvem com dados vazios.');
        return;
    }

    if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
        initFirebase();
        return;
    }

    const deviceKey = state.firebaseConfig.deviceKey;
    if (!deviceKey) return;

    isSyncing = true;
    updateSyncStatusUI('syncing');

    firebase.database().ref(`factories/${deviceKey}`).set(state)
        .then(() => {
            updateSyncStatusUI('success');
            console.log('[Sync] ✅ Dados enviados para a nuvem com sucesso.');
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
        alert('Sincronização desativada. Ative nas configurações primeiro.');
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

    state.firebaseConfig = { enabled, apiKey, projectId, databaseURL, deviceKey };

    // Usar pushToFirebaseImediato para não criar loop
    state.lastUpdated = Date.now();
    saveStateLocalOnly();
    if (enabled) initFirebase();

    alert('Configurações do Firebase salvas!');
}

// ─── INDICADOR DE STATUS NO CABEÇALHO ─────────────────────────────────────
export function updateSyncStatusUI(status) {
    const indicator = document.getElementById('cloud-sync-status');
    if (!indicator) return;

    const MAP = {
        success:  { icon: 'cloud',           color: '#00ff64', title: '☁️ Nuvem Ativa — Sincronizado em Tempo Real', spin: false },
        syncing:  { icon: 'refresh-cw',       color: '#ffaa00', title: '🔄 Sincronizando com a Nuvem...', spin: true  },
        error:    { icon: 'alert-triangle',   color: '#ff4d4d', title: '⚠️ Erro de Conexão com a Nuvem', spin: false },
        disabled: { icon: 'cloud-off',        color: 'var(--color-text-muted)', title: 'Sincronização Desativada', spin: false }
    };

    const cfg = MAP[status] || MAP.disabled;
    indicator.title = cfg.title;
    indicator.innerHTML = `<i data-lucide="${cfg.icon}" class="${cfg.spin ? 'spin-anim' : ''}" style="width:18px;height:18px;color:${cfg.color};"></i>`;

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

    if (window.lucide) lucide.createIcons();
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
    if (window.lucide) lucide.createIcons();

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
