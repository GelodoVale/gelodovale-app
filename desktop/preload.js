// ============================================================================
// GELCONTROL DESKTOP — PRELOAD SEGURO (CONTEXT ISOLATION)
// Permissões Mínimas Expostas ao Renderer
// ============================================================================

const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

function detectChannel() {
    const candidatePaths = [
        path.join(__dirname, 'version.json'),
        path.join(__dirname, '..', 'version.json')
    ];
    for (const cp of candidatePaths) {
        if (fs.existsSync(cp)) {
            try {
                const parsed = JSON.parse(fs.readFileSync(cp, 'utf8'));
                if (parsed && parsed.channel) return parsed.channel;
            } catch (_) {}
        }
    }
    return 'homologacao';
}
const CURRENT_CHANNEL = detectChannel();
const IS_HOMOLOGATION = (CURRENT_CHANNEL === 'homologacao');

contextBridge.exposeInMainWorld('gelcontrolDesktop', {
    isDesktop: true,
    isHomologation: IS_HOMOLOGATION,
    channel: CURRENT_CHANNEL,
    getSystemInfo: () => ipcRenderer.invoke('desktop:get-system-info'),
    migrateLocalV84Credential: () => ipcRenderer.invoke('desktop:migrate-local-v84-credential'),
    updateCredentialGuard: (saltedHash) => ipcRenderer.invoke('desktop:update-credential-guard', saltedHash),
    saveAutoBackup: (payload) => ipcRenderer.invoke('desktop:save-auto-backup', payload),
    chooseBackupFolder: () => ipcRenderer.invoke('desktop:choose-backup-folder'),
    writeManualBackup: (payload) => ipcRenderer.invoke('desktop:write-manual-backup', payload),

    // --- GERENCIAMENTO DE ATALHOS E ÍCONES DO WINDOWS ---
    shortcuts: {
        updateCustomIcon: (payload) => ipcRenderer.invoke('shortcuts:update-custom-icon', payload),
        restoreDefaultIcon: () => ipcRenderer.invoke('shortcuts:restore-default-icon')
    },

    // --- ESTRUTURA IPC SEGURA DO ATUALIZADOR (ETAPAS 1, 2, 3 E 4) ---
    updater: {
        getInstalledVersion: () => ipcRenderer.invoke('updater:get-installed-version'),
        getChannel: () => ipcRenderer.invoke('updater:get-channel'),
        getStatus: () => ipcRenderer.invoke('updater:get-status'),
        checkUpdate: () => ipcRenderer.invoke('updater:check-update'),
        getAvailableUpdate: () => ipcRenderer.invoke('updater:get-available-update'),
        downloadUpdate: () => ipcRenderer.invoke('updater:download-update'),
        getValidationStatus: () => ipcRenderer.invoke('updater:get-validation-status'),
        applyUpdate: (authPayload) => ipcRenderer.invoke('updater:apply-update', authPayload),
        getUpdateHistory: () => ipcRenderer.invoke('updater:get-update-history'),
        getPendingTransaction: () => ipcRenderer.invoke('updater:get-pending-transaction')
    }
});

// Exibe o banner de homologação exclusivamente quando estiver no canal de homologação
if (IS_HOMOLOGATION) {
    window.addEventListener('DOMContentLoaded', () => {
        function injectBanner() {
            if (!document.getElementById('homologacao-banner')) {
                const banner = document.createElement('div');
                banner.id = 'homologacao-banner';
                banner.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 28px; background: #eab308; color: #000; font-weight: bold; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; gap: 8px; z-index: 9999999; box-shadow: 0 2px 8px rgba(0,0,0,0.4); letter-spacing: 0.5px;';
                banner.innerHTML = '<span>⚠️ AMBIENTE DE HOMOLOGAÇÃO ISOLADO (gelcontrol-homologacao / fabrica_homologacao_sync_v85_teste) — DADOS DE PRODUÇÃO NÃO AFETADOS</span>';
                document.body.prepend(banner);
            }
            document.body.style.paddingTop = '28px';
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.style.top = '28px';
                sidebar.style.height = 'calc(100vh - 28px)';
            }
        }
        injectBanner();
        setTimeout(injectBanner, 300);
        setTimeout(injectBanner, 1500);
    });
}

