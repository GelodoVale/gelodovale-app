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

