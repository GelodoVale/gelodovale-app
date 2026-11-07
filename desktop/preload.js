// ============================================================================
// GELCONTROL DESKTOP — PRELOAD SEGURO (CONTEXT ISOLATION)
// Permissões Mínimas Expostas ao Renderer
// ============================================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gelcontrolDesktop', {
    isDesktop: true,
    getSystemInfo: () => ipcRenderer.invoke('desktop:get-system-info'),
    saveAutoBackup: (payload) => ipcRenderer.invoke('desktop:save-auto-backup', payload),
    chooseBackupFolder: () => ipcRenderer.invoke('desktop:choose-backup-folder'),
    writeManualBackup: (payload) => ipcRenderer.invoke('desktop:write-manual-backup', payload)
});

// Garante exibição permanente do banner de homologação no cliente desktop
window.addEventListener('DOMContentLoaded', () => {
    function injectBanner() {
        if (!document.getElementById('homologacao-banner')) {
            const banner = document.createElement('div');
            banner.id = 'homologacao-banner';
            banner.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 28px; background: #eab308; color: #000; font-weight: bold; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; gap: 8px; z-index: 9999999; box-shadow: 0 2px 8px rgba(0,0,0,0.4); letter-spacing: 0.5px;';
            banner.innerHTML = '<span>⚠️ AMBIENTE DE HOMOLOGAÇÃO ISOLADO (gelcontrol-homologacao / fabrica_homologacao_teste) — DADOS DE PRODUÇÃO NÃO AFETADOS</span>';
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

