// ============================================================================
// GELCONTROL DESKTOP CLIENT v85 — PROCESSO PRINCIPAL (MAIN PROCESS)
// Caminho de Instalação e Armazenamento Dinâmico (Sem caminhos fixos)
// Isolamento de Contexto, Segurança e Redirecionamento de Dados
// ============================================================================

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// 1. RESOLUÇÃO DINÂMICA DA RAIZ DE INSTALAÇÃO
// Permite F:\GelControl, D:\GelControl, C:\GelControl ou qualquer pasta definida pelo proprietário
function resolveInstallationRoot() {
    // Parâmetro customizado via linha de comando: --install-dir="D:\GelControl"
    const customArg = process.argv.find(arg => arg.startsWith('--install-dir='));
    if (customArg) {
        return path.resolve(customArg.split('=')[1].replace(/"/g, ''));
    }

    if (app.isPackaged) {
        // Em produção: executável reside em <Instalacao>/Programa/GelControl.exe
        return path.resolve(path.dirname(process.execPath), '..');
    }
    
    // Em modo de desenvolvimento no PC 1: se existir F:\GelControl, prioriza F:
    if (fs.existsSync('F:\\GelControl')) {
        return 'F:\\GelControl';
    }
    
    // Fallback relativo para desenvolvimento
    return path.resolve(__dirname, '..');
}

const INSTALL_ROOT = resolveInstallationRoot();
const PROGRAM_DIR = path.join(INSTALL_ROOT, 'Programa');
const DATA_DIR = path.join(INSTALL_ROOT, 'Dados');
const SECRETS_DIR = path.join(INSTALL_ROOT, 'Seguranca');
const BACKUPS_DIR = path.join(INSTALL_ROOT, 'Backups');

// 2. REDIRECIONAR O ARMAZENAMENTO PERSISTENTE ANTES DE INICIALIZAR A SESSÃO
// app.setPath('userData') redireciona localStorage, IndexedDB, Cookies e Cache do Chromium
// diretamente para a pasta Dados na unidade escolhida. Nada vai para C:\Users\AppData.
const CHROMIUM_STORAGE_DIR = path.join(DATA_DIR, 'browser_storage');

[DATA_DIR, CHROMIUM_STORAGE_DIR, SECRETS_DIR, BACKUPS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
    }
});

app.setPath('userData', CHROMIUM_STORAGE_DIR);

console.log('================================================================');
console.log('   GELCONTROL DESKTOP CLIENT v85 (INICIALIZAÇÃO NATIVA)         ');
console.log('================================================================');
console.log('📍 Raiz da Instalação Identificada:', INSTALL_ROOT);
console.log('💾 Dados Persistentes (localStorage):', CHROMIUM_STORAGE_DIR);
console.log('🔒 Pasta de Segredos Administrativos:', SECRETS_DIR);
console.log('================================================================\n');

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        minWidth: 1024,
        minHeight: 600,
        backgroundColor: '#060913',
        title: 'GelControl - Sistema Oficial da Fábrica',
        webPreferences: {
            nodeIntegration: false,        // Proteção contra injeção de Node.js na página web
            contextIsolation: true,       // Isolamento estrito de contexto
            sandbox: false,               // Desabilitado apenas para permitir preload seguro
            webSecurity: true,            // Proteção de segurança web padrão
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Resolução inteligente do index.html (tanto em modo empacotado como em desenvolvimento)
    let appIndexPath = path.join(__dirname, 'index.html');
    if (!fs.existsSync(appIndexPath)) {
        // Fallback para desenvolvimento no repositório:
        appIndexPath = path.resolve(__dirname, '..', 'index.html');
    }
    if (!fs.existsSync(appIndexPath)) {
        // Fallback caso app esteja em resources/app:
        appIndexPath = path.resolve('C:/Users/kissn/OneDrive/GelodoVale-system/App/index.html');
    }

    console.log('📄 Carregando interface oficial de:', appIndexPath);
    mainWindow.loadFile(appIndexPath);

    // Proteção de Navegação: Bloquear redirecionamentos não autorizados para fora do app
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url); // Abre links externos no navegador padrão do sistema
        }
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 3. COMUNICAÇÃO SEGURA VIA IPC (Bridge com Permissões Mínimas)
ipcMain.handle('desktop:get-system-info', () => {
    return {
        isDesktop: true,
        version: 'v85-desktop',
        installRoot: INSTALL_ROOT,
        dataDir: DATA_DIR,
        storageDir: CHROMIUM_STORAGE_DIR,
        isPrincipalStation: fs.existsSync(path.join(SECRETS_DIR, 'Homologacao', 'service-account.json')) || fs.existsSync(path.join(SECRETS_DIR, 'service-account.json'))
    };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

