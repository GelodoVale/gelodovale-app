// --- SISTEMA DE SINCRONIZAÇÃO EM NUVEM (FIREBASE) ---
import { state, updateState, saveStateLocalOnly, saveState } from './state.js';
import { renderApp } from './app.js';
import { migrateLegacyComodatos } from './comodatos.js';
import { initUserAccessControl } from './auth.js';

let firebaseSDKLoaded = false;
let fbDatabaseRef = null;

export function loadFirebaseSDK(callback) {
    if (firebaseSDKLoaded || (window.firebase && window.firebase.database)) {
        firebaseSDKLoaded = true;
        if (callback) callback();
        return;
    }
    
    const scriptApp = document.createElement("script");
    scriptApp.src = "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js";
    scriptApp.onload = () => {
        const scriptDB = document.createElement("script");
        scriptDB.src = "https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js";
        scriptDB.onload = () => {
            firebaseSDKLoaded = true;
            if (callback) callback();
        };
        scriptDB.onerror = (err) => {
            console.error("Erro ao carregar SDK de Banco de Dados do Firebase:", err);
            updateSyncStatusUI("error");
        };
        document.head.appendChild(scriptDB);
    };
    scriptApp.onerror = (err) => {
        console.error("Erro ao carregar SDK Base do Firebase:", err);
        updateSyncStatusUI("error");
    };
    document.head.appendChild(scriptApp);
}

export function startSyncListener() {
    if (!state.firebaseConfig || !state.firebaseConfig.deviceKey) return;
    
    const deviceKey = state.firebaseConfig.deviceKey;
    fbDatabaseRef = firebase.database().ref(`factories/${deviceKey}`);
    
    updateSyncStatusUI("syncing");
    
    fbDatabaseRef.off();
    
    fbDatabaseRef.on("value", snapshot => {
        const remoteData = snapshot.val();
        if (!remoteData) {
            pushToFirebase();
            return;
        }
        
        const localLastUpdated = state.lastUpdated || 0;
        const remoteLastUpdated = remoteData.lastUpdated || 0;
        
        if (remoteLastUpdated > localLastUpdated) {
            console.log("Detectado dados mais recentes no Firebase. Sincronizando localmente...");
            updateState(remoteData);
            saveStateLocalOnly();
            renderApp();
            updateSyncStatusUI("success");
        } else if (localLastUpdated > remoteLastUpdated) {
            console.log("Local é mais recente. Enviando para o Firebase...");
            pushToFirebase();
        } else {
            updateSyncStatusUI("success");
        }
    }, error => {
        console.error("Erro no listener do Firebase:", error);
        updateSyncStatusUI("error");
    });
}

export function pushToFirebase() {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
        updateSyncStatusUI("disabled");
        return;
    }
    
    if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
        initFirebase();
        return;
    }
    
    const deviceKey = state.firebaseConfig.deviceKey;
    if (!deviceKey) return;
    
    updateSyncStatusUI("syncing");
    
    firebase.database().ref(`factories/${deviceKey}`).set(state)
        .then(() => {
            updateSyncStatusUI("success");
            console.log("Estado sincronizado com o Firebase com sucesso!");
        })
        .catch(err => {
            console.error("Erro ao enviar dados para o Firebase:", err);
            updateSyncStatusUI("error");
        });
}

export function initFirebase(callback) {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
        updateSyncStatusUI("disabled");
        if (callback) callback();
        return;
    }
    
    const { apiKey, projectId, databaseURL, deviceKey } = state.firebaseConfig;
    if (!apiKey || !projectId || !databaseURL || !deviceKey) {
        console.warn("Configurações do Firebase incompletas.");
        updateSyncStatusUI("error");
        if (callback) callback();
        return;
    }
    
    updateSyncStatusUI("syncing");
    
    loadFirebaseSDK(() => {
        try {
            const config = { apiKey, projectId, databaseURL };
            if (firebase.apps.length === 0) {
                firebase.initializeApp(config);
            }
            startSyncListener();
            if (callback) callback();
        } catch (error) {
            console.error("Erro ao inicializar Firebase:", error);
            updateSyncStatusUI("error");
            if (callback) callback();
        }
    });
}

export function toggleFirebaseSync(checked) {
    if (!state.firebaseConfig) {
        state.firebaseConfig = { enabled: false, apiKey: '', projectId: '', databaseURL: '', deviceKey: '' };
    }
    state.firebaseConfig.enabled = checked;
    saveStateLocalOnly();
    if (checked) {
        initFirebase();
    } else {
        if (fbDatabaseRef) {
            fbDatabaseRef.off();
        }
        updateSyncStatusUI("disabled");
    }
}

export function saveFirebaseSettings() {
    const enabled = document.getElementById("cfg-fb-enabled").checked;
    const apiKey = document.getElementById("cfg-fb-api-key").value.trim();
    const projectId = document.getElementById("cfg-fb-project-id").value.trim();
    const databaseURL = document.getElementById("cfg-fb-db-url").value.trim();
    const deviceKey = document.getElementById("cfg-fb-device-key").value.trim();
    
    state.firebaseConfig = { enabled, apiKey, projectId, databaseURL, deviceKey };
    saveState();
    
    alert("Configurações do Firebase salvas!");
}

export function forceManualSync() {
    if (!state.firebaseConfig || !state.firebaseConfig.enabled) {
        alert("Sincronização desativada. Ative nas configurações primeiro.");
        return;
    }
    
    state.lastUpdated = Date.now();
    saveStateLocalOnly();
    
    if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
        initFirebase(() => {
            pushToFirebase();
        });
    } else {
        pushToFirebase();
    }
}

export function updateSyncStatusUI(status) {
    const indicator = document.getElementById("cloud-sync-status");
    if (!indicator) return;
    
    let iconName = "cloud-off";
    let iconColor = "var(--color-text-muted)";
    let titleText = "Sincronização Desativada";
    let isSpinning = false;
    
    switch (status) {
        case "success":
            iconName = "cloud";
            iconColor = "#00ff64";
            titleText = "Nuvem Ativa e Sincronizada";
            break;
        case "syncing":
            iconName = "refresh-cw";
            iconColor = "#ffaa00";
            titleText = "Sincronizando com a Nuvem...";
            isSpinning = true;
            break;
        case "error":
            iconName = "alert-triangle";
            iconColor = "#ff4d4d";
            titleText = "Erro de Conexão/Sincronização";
            break;
        case "disabled":
        default:
            iconName = "cloud-off";
            iconColor = "var(--color-text-muted)";
            titleText = "Sincronização na Nuvem Desativada";
            break;
    }
    
    indicator.title = titleText;
    indicator.innerHTML = `<i data-lucide="${iconName}" class="${isSpinning ? 'spin-anim' : ''}" style="width: 18px; height: 18px; color: ${iconColor};"></i>`;
    
    const btnSync = document.getElementById("btn-force-sync");
    if (btnSync) {
        if (status === "syncing") {
            btnSync.innerHTML = `<i data-lucide="refresh-cw" class="spin-anim" style="width: 14px; height: 14px;"></i> Sincronizando...`;
            btnSync.disabled = true;
        } else {
            btnSync.innerHTML = `<i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> Forçar Sincronização Agora`;
            btnSync.disabled = false;
        }
    }
    
    lucide.createIcons();
}

// Bind global variables for HTML accessibility
window.toggleFirebaseSync = toggleFirebaseSync;
window.saveFirebaseSettings = saveFirebaseSettings;
window.forceManualSync = forceManualSync;
window.updateSyncStatusUI = updateSyncStatusUI;
window.pushToFirebase = pushToFirebase;
window.initFirebase = initFirebase;
