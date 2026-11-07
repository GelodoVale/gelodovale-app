// ============================================================================
// GELCONTROL DESKTOP — PRELOAD SEGURO (CONTEXT ISOLATION)
// Permissões Mínimas Expostas ao Renderer
// ============================================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gelcontrolDesktop', {
    isDesktop: true,
    getSystemInfo: () => ipcRenderer.invoke('desktop:get-system-info')
});

