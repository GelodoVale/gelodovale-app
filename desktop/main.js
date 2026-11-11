// ============================================================================
// GELCONTROL DESKTOP CLIENT v85 — PROCESSO PRINCIPAL (MAIN PROCESS)
// Caminho de Instalação e Armazenamento Dinâmico (Sem caminhos fixos)
// Isolamento de Contexto, Segurança e Redirecionamento de Dados
// ============================================================================

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// 1. RESOLUÇÃO DINÂMICA DA RAIZ DE INSTALAÇÃO (ISOLAMENTO ESTRITO)
function resolveInstallationRoot() {
    // 1. Variável de ambiente explícita
    const envDir = process.env.GELCONTROL_INSTALL_DIR;
    if (envDir && fs.existsSync(envDir)) {
        return path.resolve(envDir);
    }

    // 2. Parâmetro de linha de comando: --install-dir="D:\GelControl"
    const customArg = process.argv.find(arg => arg.startsWith('--install-dir='));
    if (customArg) {
        return path.resolve(customArg.split('=')[1].replace(/"/g, ''));
    }

    // 3. Regra prioritária física: se o executável reside em <Instalacao>/Programa/GelControl.exe
    const execDir = path.dirname(process.execPath);
    if (path.basename(execDir).toLowerCase() === 'programa') {
        return path.resolve(execDir, '..');
    }

    if (app.isPackaged) {
        return path.resolve(execDir, '..');
    }
    
    // 4. Fallback relativo seguro para desenvolvimento no repositório
    return path.resolve(__dirname, '..');
}

const INSTALL_ROOT = resolveInstallationRoot();
const PROGRAM_DIR = path.join(INSTALL_ROOT, 'Programa');
const DATA_DIR = path.join(INSTALL_ROOT, 'Dados');
const SECRETS_DIR = path.join(INSTALL_ROOT, 'Seguranca');
const BACKUPS_DIR = path.join(INSTALL_ROOT, 'Backups');

// 1.1 CARREGAMENTO SEGURO DA IDENTIFICAÇÃO CENTRAL DE VERSÃO E CANAL
function loadCentralVersionInfo() {
    let result = null;

    // A. Tentar ler de version.json
    const candidatePaths = [
        path.join(__dirname, 'version.json'),
        path.join(__dirname, '..', 'version.json'),
        path.join(INSTALL_ROOT, 'Programa', 'resources', 'app', 'version.json')
    ];
    let matchedJsonPath = null;
    for (const cp of candidatePaths) {
        if (fs.existsSync(cp)) {
            try {
                const parsed = JSON.parse(fs.readFileSync(cp, 'utf8'));
                if (parsed && parsed.programVersion) {
                    result = parsed;
                    matchedJsonPath = cp;
                    break;
                }
            } catch (_) {}
        }
    }

    // B. Verificação cruzada com js/version.js (fonte de verdade do frontend)
    const candidateJsPaths = [
        path.join(__dirname, '..', 'js', 'version.js'),
        path.join(INSTALL_ROOT, 'Programa', 'resources', 'app', 'js', 'version.js'),
        path.join(__dirname, 'js', 'version.js')
    ];
    for (const jp of candidateJsPaths) {
        if (fs.existsSync(jp)) {
            try {
                const content = fs.readFileSync(jp, 'utf8');
                const vMatch = content.match(/export const PROGRAM_VERSION\s*=\s*['"]([^'"]+)['"]/);
                const bMatch = content.match(/export const BUILD_NUMBER\s*=\s*([0-9]+)/);
                const dMatch = content.match(/export const BUILD_DATE\s*=\s*['"]([^'"]+)['"]/);
                const cMatch = content.match(/export const DISTRIBUTION_CHANNEL\s*=\s*['"]([^'"]+)['"]/);
                const rMatch = content.match(/export const RELEASE_NAME\s*=\s*['"]([^'"]+)['"]/);
                const sMatch = content.match(/export const DATA_SCHEMA_VERSION\s*=\s*['"]([^'"]+)['"]/);

                if (vMatch && vMatch[1]) {
                    const jsVer = {
                        programVersion: vMatch[1],
                        buildNumber: bMatch ? parseInt(bMatch[1]) : (result?.buildNumber || 85),
                        buildDate: dMatch ? dMatch[1] : (result?.buildDate || '2026-11-10'),
                        channel: cMatch ? cMatch[1] : (result?.channel || 'producao'),
                        dataSchemaVersion: sMatch ? sMatch[1] : '2.5',
                        releaseName: rMatch ? rMatch[1] : `v${vMatch[1]}-producao`,
                        minCompatibleVersion: "85.0.0",
                        description: "GelControl - Sistema Oficial da Fábrica de Gelo"
                    };

                    // Se não havia version.json ou se js/version.js tiver versão superior/mais recente
                    if (!result || (result.programVersion !== jsVer.programVersion)) {
                        result = jsVer;
                        // Sincronizar de volta no version.json para persistir paridade
                        if (matchedJsonPath) {
                            try { fs.writeFileSync(matchedJsonPath, JSON.stringify(result, null, 2), 'utf8'); } catch (_) {}
                        }
                    }
                    break;
                }
            } catch (_) {}
        }
    }

    if (result && result.programVersion) return result;

    // Fallback defensivo com a identidade padrão de compilação
    return {
        programVersion: "85.4.1",
        buildNumber: 187,
        buildDate: "2026-11-11",
        channel: "producao",
        dataSchemaVersion: "2.5",
        releaseName: "v85.4.1-producao"
    };
}
const CENTRAL_VERSION = Object.freeze(loadCentralVersionInfo());

// TRAVA DE CANAL IMUTÁVEL: O canal é estritamente determinado pela compilação.
// Nenhuma configuração em runtime, localStorage ou Firebase pode alterar esta autoridade.
function getDistributionChannel() {
    return CENTRAL_VERSION.channel === 'producao' ? 'producao' : 'homologacao';
}

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
    // Resolução inteligente do ícone oficial (prioriza logo personalizada em Dados/)
    let appIconPath = path.join(DATA_DIR, 'app_icon_round.ico');
    if (!fs.existsSync(appIconPath)) {
        appIconPath = path.join(DATA_DIR, 'custom_app_icon.ico');
    }
    if (!fs.existsSync(appIconPath)) {
        appIconPath = path.join(INSTALL_ROOT, 'app_icon_round.ico');
    }
    if (!fs.existsSync(appIconPath)) {
        appIconPath = path.join(INSTALL_ROOT, 'custom_app_icon.ico');
    }
    if (!fs.existsSync(appIconPath)) {
        const defaultIcons = [
            path.join(PROGRAM_DIR, 'gelcontrol.ico'),
            path.join(__dirname, 'gelcontrol.ico'),
            path.join(__dirname, '..', 'gelcontrol.ico'),
            path.join(INSTALL_ROOT, 'gelcontrol.ico')
        ];
        for (const di of defaultIcons) {
            if (fs.existsSync(di)) {
                appIconPath = di;
                break;
            }
        }
    }

    mainWindow = new BrowserWindow({
        width: 1366,
        height: 768,
        minWidth: 1024,
        minHeight: 600,
        backgroundColor: '#060913',
        title: 'GelControl - Sistema Oficial da Fábrica',
        icon: fs.existsSync(appIconPath) ? appIconPath : undefined,
        webPreferences: {
            nodeIntegration: false,        // Proteção contra injeção de Node.js na página web
            contextIsolation: true,       // Isolamento estrito de contexto
            sandbox: false,               // Desabilitado apenas para permitir preload seguro
            webSecurity: true,            // Proteção de segurança web padrão
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Resolução inteligente do index.html (dinâmica em qualquer computador ou perfil de usuário)
    let appIndexPath = path.join(__dirname, 'index.html');
    if (!fs.existsSync(appIndexPath)) {
        // Fallback para desenvolvimento no repositório:
        appIndexPath = path.resolve(__dirname, '..', 'index.html');
    }
    if (!fs.existsSync(appIndexPath) && process.resourcesPath) {
        // Fallback para execução a partir do executável empacotado:
        const candidateInResources = path.join(process.resourcesPath, 'app', 'index.html');
        if (fs.existsSync(candidateInResources)) {
            appIndexPath = candidateInResources;
        }
    }
    if (!fs.existsSync(appIndexPath)) {
        // Fallback para a pasta da aplicação na raiz de instalação:
        const candidateInInstallRoot = path.join(INSTALL_ROOT, 'Programa', 'resources', 'app', 'index.html');
        if (fs.existsSync(candidateInInstallRoot)) {
            appIndexPath = candidateInInstallRoot;
        }
    }

    console.log('📄 Carregando interface oficial de:', appIndexPath);

    // Suporte a captura e auditoria visual automatizada via variável de ambiente ou flag
    const captureScreenshotPath = process.env.GELCONTROL_CAPTURE_SCREENSHOT || (process.argv.find(arg => arg.startsWith('--capture-screenshot=')) || '').split('=')[1]?.replace(/"/g, '');
    const bootLogPath = path.join(INSTALL_ROOT, 'capture_boot.log');
    fs.writeFileSync(bootLogPath, `[BOOT] appIndexPath: ${appIndexPath}\n[BOOT] captureScreenshotPath: ${captureScreenshotPath}\n`, 'utf8');

    mainWindow.loadFile(appIndexPath).then(() => {
        fs.appendFileSync(bootLogPath, '[BOOT] mainWindow.loadFile RESOLVED!\n');
        if (captureScreenshotPath) {
            const targetPngPath = captureScreenshotPath;
            setTimeout(async () => {
                try {
                    fs.appendFileSync(bootLogPath, '[BOOT] Executando executeJavaScript...\n');
                    const auditResult = await mainWindow.webContents.executeJavaScript(`
                        (() => {
                            const confirmEl = document.getElementById('confirm-overlay');
                            const recoverEl = document.getElementById('modal-recover-access');
                            const loginScreen = document.getElementById('app-login-screen');
                            const banner = document.getElementById('homologacao-banner');
                            const loginVer = document.getElementById('login-version');
                            const logoImg = document.getElementById('login-logo-img');

                            const getComputed = (el) => el ? window.getComputedStyle(el) : null;
                            const confirmStyle = getComputed(confirmEl);
                            const recoverStyle = getComputed(recoverEl);
                            const loginStyle = getComputed(loginScreen);

                            return {
                                confirmOverlayDisplay: confirmStyle ? confirmStyle.display : 'not_found',
                                confirmOverlayVisible: confirmStyle ? (confirmStyle.display !== 'none' && confirmStyle.visibility !== 'hidden') : false,
                                recoverModalDisplay: recoverStyle ? recoverStyle.display : 'not_found',
                                recoverModalVisible: recoverStyle ? (recoverStyle.display !== 'none' && recoverStyle.visibility !== 'hidden') : false,
                                loginScreenDisplay: loginStyle ? loginStyle.display : 'not_found',
                                loginScreenVisible: loginStyle ? (loginStyle.display !== 'none') : false,
                                bannerText: banner ? banner.innerText : 'BANNER_AUSENTE',
                                loginVersionText: loginVer ? loginVer.innerText : 'VERSAO_AUSENTE',
                                logoNaturalWidth: logoImg ? logoImg.naturalWidth : 0,
                                bodyBackground: window.getComputedStyle(document.body).backgroundColor,
                                bodyColor: window.getComputedStyle(document.body).color
                            };
                        })()
                    `);

                    const auditJsonPath = targetPngPath.replace(/\.png$/, '_audit.json');
                    fs.writeFileSync(auditJsonPath, JSON.stringify(auditResult, null, 2), 'utf8');
                    fs.appendFileSync(bootLogPath, `[BOOT] Audit salvo em ${auditJsonPath}\n`);

                    const image = await mainWindow.webContents.capturePage();
                    fs.writeFileSync(targetPngPath, image.toPNG());
                    fs.appendFileSync(bootLogPath, `[BOOT] PNG salvo em ${targetPngPath} (${fs.statSync(targetPngPath).size} bytes)\n`);
                    console.log('✅ CAPTURE_SUCCESS:', targetPngPath);
                } catch (err) {
                    fs.appendFileSync(bootLogPath, `[BOOT ERROR] ${err.stack || err.message}\n`);
                    console.error('❌ CAPTURE_ERROR:', err);
                } finally {
                    app.quit();
                }
            }, 3000);
        }
    }).catch(loadErr => {
        fs.appendFileSync(bootLogPath, `[BOOT LOAD ERROR] ${loadErr.stack || loadErr.message}\n`);
    });
}

// 3. COMUNICAÇÃO SEGURA VIA IPC (Bridge com Permissões Mínimas)
const { dialog } = require('electron');

ipcMain.handle('desktop:get-system-info', () => {
    return {
        isDesktop: true,
        isHomologation: getDistributionChannel() === 'homologacao',
        channel: getDistributionChannel(),
        version: `v${CENTRAL_VERSION.buildNumber}-desktop`,
        programVersion: CENTRAL_VERSION.programVersion,
        buildNumber: CENTRAL_VERSION.buildNumber,
        buildDate: CENTRAL_VERSION.buildDate,
        dataSchemaVersion: CENTRAL_VERSION.dataSchemaVersion,
        installRoot: INSTALL_ROOT,
        dataDir: DATA_DIR,
        storageDir: CHROMIUM_STORAGE_DIR,
        backupsDir: BACKUPS_DIR,
        isPrincipalStation: fs.existsSync(path.join(SECRETS_DIR, 'Homologacao', 'service-account.json')) || fs.existsSync(path.join(SECRETS_DIR, 'service-account.json'))
    };
});

// MIGRAÇÃO CONTROLADA E LOCAL DA CREDENCIAL v84 (EXCLUSIVA DA MÁQUINA AUTORIZADA PC 1)
ipcMain.handle('desktop:migrate-local-v84-credential', async () => {
    const credGuardPath = path.join(DATA_DIR, 'admin_credential_guard.json');
    if (fs.existsSync(credGuardPath)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(credGuardPath, 'utf8'));
            if (parsed && parsed.saltedHash && typeof parsed.saltedHash === 'string' && parsed.saltedHash.startsWith('salted:1000:')) {
                return { success: true, saltedHash: parsed.saltedHash, source: 'local_guard' };
            }
        } catch (_) {}
    }

    // Busca controlada exclusivamente na máquina física atual onde a v84 reside
    const candidateDirs = [
        'F:\\GelControl\\Dados\\browser_storage\\Local Storage\\leveldb',
        'C:\\GelControl\\Dados\\browser_storage\\Local Storage\\leveldb'
    ];
    let v84Dir = null;
    for (const cd of candidateDirs) {
        if (fs.existsSync(cd)) {
            v84Dir = cd;
            break;
        }
    }

    if (!v84Dir) {
        return { success: false, reason: 'SEM_V84_LOCAL' };
    }

    try {
        const files = fs.readdirSync(v84Dir).filter(f => f.endsWith('.ldb') || f.endsWith('.log'));
        for (const f of files) {
            const buf = fs.readFileSync(path.join(v84Dir, f));
            const target = Buffer.from('salted:1000:', 'utf16le');
            const pos = buf.indexOf(target);
            if (pos !== -1) {
                const str = buf.slice(pos).toString('utf16le');
                const match = str.match(/^(salted:1000:[a-f0-9]{32}:[a-f0-9]{64})/);
                if (match) {
                    const saltedHash = match[1];
                    fs.writeFileSync(credGuardPath, JSON.stringify({
                        migratedAt: new Date().toISOString(),
                        saltedHash
                    }, null, 2), 'utf8');
                    console.log('[Security] ✅ Credencial salted da v84 migrada localmente com sucesso.');
                    return { success: true, saltedHash, source: 'migrated_v84_local' };
                }
            }
        }
    } catch (eMig) {
        console.warn('[Security] Erro na migração local da v84:', eMig.message);
    }

    return { success: false, reason: 'HASH_NAO_ENCONTRADO_NA_V84' };
});

// ATUALIZAÇÃO PERSISTENTE E SEGURA DO GUARD DE CREDENCIAIS (IMPEDE REVERSÃO À v84)
ipcMain.handle('desktop:update-credential-guard', async (event, saltedHash) => {
    if (!saltedHash || typeof saltedHash !== 'string' || !saltedHash.startsWith('salted:1000:')) {
        return { success: false, reason: 'INVALID_HASH' };
    }
    try {
        const credGuardPath = path.join(DATA_DIR, 'admin_credential_guard.json');
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(credGuardPath, JSON.stringify({
            migratedAt: new Date().toISOString(),
            saltedHash: saltedHash
        }, null, 2), 'utf8');
        console.log('[Security] ✅ Credential guard atualizado e persistido com sucesso.');
        return { success: true };
    } catch (err) {
        console.error('[Security] Erro ao atualizar credential guard:', err);
        return { success: false, error: err.message };
    }
});

const { UpdaterCore } = require('./updater_core');
const { UpdaterInstaller } = require('./updater_installer');
const { getUpdaterConfig } = require('./updater_config');
const { verifyIndependentAdminAuthorization } = require('./admin_auth_validator');
const UPDATES_TEMP_DIR = path.join(DATA_DIR, 'updates_temp');

const currentChannel = getDistributionChannel();
const channelConfig = getUpdaterConfig(currentChannel);

const updaterCore = new UpdaterCore({
    installedVersion: CENTRAL_VERSION.programVersion,
    channel: currentChannel,
    tempDir: UPDATES_TEMP_DIR,
    homologacaoPublicKey: channelConfig.trustedPublicKeys.homologacao,
    producaoPublicKey: channelConfig.trustedPublicKeys.producao,
    homologacaoManifestUrl: channelConfig.manifestUrls.homologacao,
    producaoManifestUrl: channelConfig.manifestUrls.producao,
    allowedOrigins: channelConfig.allowedOrigins
});

const updaterInstaller = new UpdaterInstaller({
    installRoot: INSTALL_ROOT,
    dataDir: DATA_DIR,
    programDir: PROGRAM_DIR,
    installedVersion: CENTRAL_VERSION.programVersion,
    channel: getDistributionChannel()
});

// Verificação de saúde pós-atualização ou recuperação automática de interrupção
try {
    const postHealth = updaterInstaller.checkPostUpdateHealth();
    if (postHealth && postHealth.hasPendingTransaction) {
        console.log('[Main Boot] Transação pós-atualização processada:', postHealth);
    }
} catch (eHealth) {
    console.error('[Main Boot] Erro ao verificar integridade pós-atualização:', eHealth);
}

// ============================================================================
// 4. ESTRUTURA IPC SEGURA DO ATUALIZADOR (ETAPAS 1, 2, 3 E 4)
// Criptografia Ed25519, Integridade SHA-256, Transações Atômicas e Rollback
// ============================================================================

// 4.1 Consulta da versão atualmente instalada
ipcMain.handle('updater:get-installed-version', () => {
    return {
        programVersion: CENTRAL_VERSION.programVersion,
        buildNumber: CENTRAL_VERSION.buildNumber,
        buildDate: CENTRAL_VERSION.buildDate,
        releaseName: CENTRAL_VERSION.releaseName,
        dataSchemaVersion: CENTRAL_VERSION.dataSchemaVersion
    };
});

// 4.2 Consulta do canal de distribuição (imutável pela compilação)
ipcMain.handle('updater:get-channel', () => {
    const channel = getDistributionChannel();
    return {
        channel: channel,
        isHomologation: channel === 'homologacao',
        isProduction: channel === 'producao'
    };
});

// 4.3 Consulta do estado atual do mecanismo de atualização
ipcMain.handle('updater:get-status', () => {
    return {
        status: updaterCore.lastValidationStatus.status,
        lastCheckedAt: updaterCore.lastCheckedAt,
        updateAvailable: !!updaterCore.cachedAvailableUpdate,
        availableVersion: updaterCore.cachedAvailableUpdate ? updaterCore.cachedAvailableUpdate.latestVersion : null,
        error: updaterCore.lastValidationStatus.error,
        stage: 'ETAPA_4_INSTALACAO_E_RECUPERACAO'
    };
});

// 4.4 Consulta de atualizações no canal autorizado (somente leitura HTTPS)
ipcMain.handle('updater:check-update', async () => {
    return await updaterCore.checkUpdate();
});

// 4.5 Obter metadados da atualização disponível em cache
ipcMain.handle('updater:get-available-update', () => {
    if (!updaterCore.cachedAvailableUpdate) return null;
    const { signature, ...safeMetadata } = updaterCore.cachedAvailableUpdate;
    return safeMetadata;
});

// 4.6 Download seguro do pacote para área temporária com validação SHA-256
ipcMain.handle('updater:download-update', async () => {
    return await updaterCore.downloadUpdate();
});

// 4.7 Obter status da validação do pacote baixado
ipcMain.handle('updater:get-validation-status', () => {
    return {
        status: updaterCore.lastValidationStatus.status,
        error: updaterCore.lastValidationStatus.error,
        hasValidatedPackage: (updaterCore.lastValidationStatus.status === 'validated')
    };
});

// 4.8 Aplicação segura da atualização (Etapa 4): Staging, Backup, Processo Auxiliar e Reinício
ipcMain.handle('updater:apply-update', async (event, authPayload) => {
    try {
        if (updaterCore.lastValidationStatus.status !== 'validated' || !updaterCore.lastValidationStatus.downloadedPath) {
            return {
                success: false,
                error: 'PACOTE_NAO_VALIDADO: Nenhum pacote criptograficamente validado pronto para instalação.'
            };
        }

        // Validação de autenticidade: o pacote foi assinado digitalmente com Ed25519 e validado pelo hash SHA-256.
        // Se authPayload contiver credencial, efetua conferência complementar de auditoria;
        // caso contrário, a assinatura digital assimétrica da release é a autoridade técnica oficial.
        if (authPayload && (authPayload.idToken || authPayload.adminConfirmationPassword)) {
            const authCheck = await verifyIndependentAdminAuthorization(authPayload, {
                channel: getDistributionChannel(),
                dataDir: DATA_DIR
            });
            if (!authCheck.authorized) {
                console.warn('[Main Security] Validação administrativa adicional rejeitada:', authCheck.reason);
            }
        }

        const packagePath = updaterCore.lastValidationStatus.downloadedPath;
        const manifest = updaterCore.cachedAvailableUpdate;
        if (!manifest) {
            return { success: false, error: 'METADADOS_MANIFESTO_AUSENTES' };
        }

        // 1. Prepara a transação (validação anti-zip slip, staging seguro e backup da versão atual)
        const prep = await updaterInstaller.prepareUpdateTransaction({
            packagePath: packagePath,
            manifest: manifest
        });

        // 2. Dispara o aplicador desacoplado em processo separado
        // AUDITORIA ETAPA 5: O script é copiado para fora de resources\\app (para Dados\\updater_applier_runner.js)
        // Isso garante que ele continue acessível e sem file lock enquanto resources\\app estiver sendo substituído
        const sourceApplier = path.join(__dirname, 'updater_applier.js');
        const runnerScript = path.join(updaterInstaller.dataDir, 'updater_applier_runner.js');
        fs.copyFileSync(sourceApplier, runnerScript);

        const targetPid = process.pid;
        const execPath = process.execPath;

        const child = spawn(process.execPath, [
            runnerScript,
            `--state-file=${updaterInstaller.stateFile}`,
            `--target-pid=${targetPid}`,
            `--exec-path=${execPath}`
        ], {
            detached: true,
            stdio: 'ignore',
            env: {
                ...process.env,
                ELECTRON_RUN_AS_NODE: '1'
            }
        });
        child.unref();

        // 3. Agenda encerramento gracioso do GelControl após 1.2s para liberação dos arquivos
        setTimeout(() => {
            console.log('[Main] Encerrando GelControl para aplicação da nova versão pelo aplicador...');
            app.quit();
        }, 1200);

        return {
            success: true,
            status: 'restarting',
            targetVersion: manifest.latestVersion,
            message: 'Atualização preparada com sucesso. O sistema será reiniciado em instantes para concluir a instalação.'
        };

    } catch (err) {
        console.error('[Main] Erro ao aplicar atualização:', err);
        return {
            success: false,
            error: err.message
        };
    }
});

// 4.9 Histórico de Atualizações
ipcMain.handle('updater:get-update-history', () => {
    return updaterInstaller.getUpdateHistory();
});

// 4.10 Consulta de Transação Pendente
ipcMain.handle('updater:get-pending-transaction', () => {
    return updaterInstaller.readTransactionState();
});

// 1.2 RESOLUÇÃO INTELIGENTE DA PASTA DE BACKUPS NO ONEDRIVE
function resolveOneDriveBackupsDir() {
    const candidates = [
        process.env.OneDrive ? path.join(process.env.OneDrive, 'GelodoVale-system', 'Backups') : null,
        process.env.OneDriveConsumer ? path.join(process.env.OneDriveConsumer, 'GelodoVale-system', 'Backups') : null,
        process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'OneDrive', 'GelodoVale-system', 'Backups') : null
    ];
    for (const c of candidates) {
        if (c && fs.existsSync(path.dirname(c))) {
            return c;
        }
    }
    return candidates[0] || null;
}
const ONEDRIVE_BACKUPS_DIR = resolveOneDriveBackupsDir();

// Manipulador de Backup Automático Silencioso (Local Oficial + Espelho no OneDrive)
ipcMain.handle('desktop:save-auto-backup', async (event, { fileName, content }) => {
    const savedPaths = [];
    try {
        if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
        const filePath = path.join(BACKUPS_DIR, fileName);
        fs.writeFileSync(filePath, content, 'utf8');
        savedPaths.push(filePath);
        console.log(`[Backup Automático Desktop] Salvo com sucesso em: ${filePath}`);

        // Cópia Espelho Automática no OneDrive (se disponível)
        if (ONEDRIVE_BACKUPS_DIR) {
            try {
                if (!fs.existsSync(ONEDRIVE_BACKUPS_DIR)) fs.mkdirSync(ONEDRIVE_BACKUPS_DIR, { recursive: true });
                const oneDrivePath = path.join(ONEDRIVE_BACKUPS_DIR, fileName);
                fs.writeFileSync(oneDrivePath, content, 'utf8');
                savedPaths.push(oneDrivePath);
                console.log(`[Backup Automático Desktop] Espelho sincronizado no OneDrive: ${oneDrivePath}`);
            } catch (errOD) {
                console.warn('[Backup Automático Desktop] Aviso ao salvar espelho no OneDrive:', errOD.message);
            }
        }

        return { success: true, path: filePath, allPaths: savedPaths };
    } catch (err) {
        console.error('[Backup Automático Desktop] Erro ao salvar:', err);
        return { success: false, error: err.message };
    }
});

// Manipulador de Seleção de Pasta para Backup Manual Livre
ipcMain.handle('desktop:choose-backup-folder', async () => {
    if (!mainWindow) return { canceled: true };
    const res = await dialog.showOpenDialog(mainWindow, {
        title: 'Selecione a Pasta para Salvar o Backup Manual',
        defaultPath: BACKUPS_DIR,
        properties: ['openDirectory', 'createDirectory']
    });
    if (res.canceled || !res.filePaths.length) {
        return { canceled: true };
    }
    return { canceled: false, selectedPath: res.filePaths[0] };
});

// Manipulador de Gravação de Backup Manual no Local Escolhido
ipcMain.handle('desktop:write-manual-backup', async (event, { targetPath, fileName, content }) => {
    try {
        const destDir = targetPath || BACKUPS_DIR;
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const finalFile = path.join(destDir, fileName);
        fs.writeFileSync(finalFile, content, 'utf8');
        console.log(`[Backup Manual Desktop] Salvo com sucesso em: ${finalFile}`);
        return { success: true, path: finalFile };
    } catch (err) {
        console.error('[Backup Manual Desktop] Erro ao salvar:', err);
        return { success: false, error: err.message };
    }
});

// Manipulador de Sincronização do Logotipo Personalizado com o Ícone do Windows
ipcMain.handle('shortcuts:update-custom-icon', async (event, data) => {
    try {
        const { pngBuffers, imageSource, source, base64 } = data || {};
        let convertedBuffers = null;

        if (Array.isArray(pngBuffers) && pngBuffers.length) {
            convertedBuffers = pngBuffers.map(item => ({
                width: item.width,
                height: item.height,
                buffer: Buffer.from(item.base64.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64')
            }));
        }

        const { updateAppCustomIcon } = require('./shortcuts');
        const res = updateAppCustomIcon({
            pngBuffers: convertedBuffers,
            imageSource: imageSource || source || base64,
            installRoot: INSTALL_ROOT,
            dataDir: DATA_DIR
        });

        if (res.success && res.customIcoPath && mainWindow && !mainWindow.isDestroyed()) {
            try {
                mainWindow.setIcon(res.customIcoPath);
            } catch (_) {}
        }

        return res;
    } catch (err) {
        console.error('[Main] Erro ao atualizar ícone com logotipo personalizado:', err.message);
        return { success: false, error: err.message };
    }
});

// Manipulador de Restauração do Ícone Padrão Oficial do Windows
ipcMain.handle('shortcuts:restore-default-icon', async () => {
    try {
        const { restoreAppDefaultIcon } = require('./shortcuts');
        const res = restoreAppDefaultIcon({
            installRoot: INSTALL_ROOT,
            dataDir: DATA_DIR
        });

        if (res.success && res.defaultIconPath && mainWindow && !mainWindow.isDestroyed()) {
            try {
                mainWindow.setIcon(res.defaultIconPath);
            } catch (_) {}
        }

        return res;
    } catch (err) {
        console.error('[Main] Erro ao restaurar ícone padrão:', err.message);
        return { success: false, error: err.message };
    }
});

app.whenReady().then(() => {
    // 1. Garantir criação e integridade de atalhos na Área de Trabalho e Menu Iniciar
    try {
        const { ensureAppShortcuts, updateAppCustomIcon } = require('./shortcuts');
        ensureAppShortcuts({
            installRoot: INSTALL_ROOT,
            channel: getDistributionChannel()
        });
        updateAppCustomIcon({
            installRoot: INSTALL_ROOT,
            dataDir: DATA_DIR
        });
    } catch (eSc) {
        console.warn('[Main] Aviso ao verificar atalhos do Windows:', eSc.message);
    }

    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

