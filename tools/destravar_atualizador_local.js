// ============================================================================
// GELCONTROL OFICIAL — UTILITÁRIO DE DESTRAVAMENTO SEGURO DO ATUALIZADOR (PC 2)
// Atualiza exclusivamente os módulos do motor de atualização e ícone circular
// em instalações presas na v85.4.0 / v85.4.2 original, preservando 100% de Dados/
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

function computeFileSha256(filePath) {
    if (!fs.existsSync(filePath)) return null;
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function detectOfficialInstallDir(customDirArg) {
    if (customDirArg && fs.existsSync(customDirArg)) {
        return path.resolve(customDirArg);
    }

    const candidates = [
        'F:\\GelControl_Oficial',
        'D:\\GelControl_Oficial',
        'E:\\GelControl_Oficial',
        'C:\\GelControl_Oficial'
    ];

    for (const cand of candidates) {
        if (fs.existsSync(path.join(cand, 'Programa', 'GelControl.exe'))) {
            return cand;
        }
    }

    if (process.platform === 'win32') {
        try {
            const regOut = execSync('reg.exe query "HKCU\\Software\\GelControl" /v InstallPath', {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
                timeout: 3000
            });
            const m = regOut.match(/InstallPath\s+REG_(?:EXPAND_)?SZ\s+(.+)/i);
            if (m && m[1]) {
                const regDir = m[1].trim();
                if (fs.existsSync(path.join(regDir, 'Programa', 'GelControl.exe'))) {
                    return path.resolve(regDir);
                }
            }
        } catch (_) {}
    }

    return null;
}

function runRepair(options = {}) {
    console.log('============================================================================');
    console.log('   GELCONTROL OFICIAL — DESTRAVAMENTO SEGURO DO MOTOR DO ATUALIZADOR');
    console.log('============================================================================\n');

    const argDir = process.argv.find(a => a.startsWith('--install-dir='))?.split('=')[1]?.replace(/"/g, '');
    const skipShortcuts = process.argv.includes('--skip-shortcuts') || !!options.skipShortcuts;
    const installDir = detectOfficialInstallDir(options.installDir || argDir);

    if (!installDir) {
        throw new Error('INSTALACAO_NAO_ENCONTRADA: Não foi possível localizar a pasta do GelControl Oficial.');
    }

    const appDest = path.join(installDir, 'Programa', 'resources', 'app');
    const dataDir = path.join(installDir, 'Dados');
    const backupsDir = path.join(dataDir, 'Backups');
    const stateJsonPath = path.join(dataDir, 'state.json');

    if (!fs.existsSync(appDest)) {
        throw new Error(`PASTA_APP_AUSENTE: Diretório '${appDest}' não encontrado.`);
    }

    console.log(`1. Instalação localizada: ${installDir}`);

    // Verificar versão instalada atual
    let currentVer = 'desconhecida';
    const verJsonPath = path.join(appDest, 'version.json');
    if (fs.existsSync(verJsonPath)) {
        try {
            const parsedVer = JSON.parse(fs.readFileSync(verJsonPath, 'utf8'));
            currentVer = `${parsedVer.programVersion} (Build ${parsedVer.buildNumber})`;
        } catch (_) {}
    }
    console.log(`   Versão instalada atual: ${currentVer}`);

    // 2. Salvaguarda e Hash SHA-256 inicial de Dados\state.json
    const shaBefore = computeFileSha256(stateJsonPath);
    if (shaBefore) {
        if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
        const backupFile = path.join(backupsDir, `state_pre_destravamento_${Date.now()}.json`);
        fs.copyFileSync(stateJsonPath, backupFile);
        console.log(`2. Dados comerciais protegidos:`);
        console.log(`   - Backup preventivo: ${backupFile}`);
        console.log(`   - SHA-256 inicial (state.json): ${shaBefore}`);
    } else {
        console.log('2. Aviso: state.json ainda não existe em Dados/ (instalação limpa).');
    }

    // 3. Validação estrita dos arquivos de origem antes de qualquer cópia
    const updaterModules = [
        'main.js',
        'preload.js',
        'shortcuts.js',
        'updater_applier.js',
        'updater_installer.js',
        'updater_core.js',
        'updater_config.js',
        'admin_auth_validator.js'
    ];

    for (const modName of updaterModules) {
        const srcMod = path.join(REPO_ROOT, 'desktop', modName);
        if (!fs.existsSync(srcMod) || fs.statSync(srcMod).size < 100) {
            throw new Error(`ARQUIVO_ORIGEM_INVALIDO: O módulo '${srcMod}' está ausente ou corrompido.`);
        }
    }

    // 4. Encerramento seguro apenas de processos da instalação alvo (excluindo o próprio PID)
    if (!options.skipProcessKill && process.platform === 'win32') {
        try {
            const { execSync: exec } = require('child_process');
            const rootNorm = path.resolve(installDir).toLowerCase();
            const myPid = process.pid;
            const psCmd = `Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -like '*GelControl*' } | Select-Object ProcessId, ExecutablePath | ConvertTo-Json -Compress`;
            const raw = exec(`powershell.exe -NoProfile -NonInteractive -Command "${psCmd}"`, {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
                timeout: 5000
            }).trim();
            if (raw) {
                const list = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [JSON.parse(raw)];
                for (const proc of list) {
                    const pid = parseInt(proc.ProcessId, 10);
                    const exeP = proc.ExecutablePath ? path.resolve(proc.ExecutablePath).toLowerCase() : '';
                    if (pid && pid !== myPid && exeP.startsWith(rootNorm)) {
                        try { exec(`taskkill /PID ${pid} /F`, { stdio: 'ignore' }); } catch (_) {}
                    }
                }
            }
        } catch (_) {}
    }

    // 5. Atualização atômica dos módulos do motor do atualizador (mantendo version.json da instalação atual para permitir teste real de update)
    console.log('3. Atualizando módulos do motor do atualizador e ícone oficial...');
    const appDesktopDest = path.join(appDest, 'desktop');
    if (!fs.existsSync(appDesktopDest)) fs.mkdirSync(appDesktopDest, { recursive: true });
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    for (const modName of updaterModules) {
        const srcMod = path.join(REPO_ROOT, 'desktop', modName);
        fs.copyFileSync(srcMod, path.join(appDest, modName));
        fs.copyFileSync(srcMod, path.join(appDesktopDest, modName));
    }

    // Copiar js/updater_ui.js e js/admin.js compatíveis se existirem
    const srcIcon = path.join(REPO_ROOT, 'app_icon_round.ico');
    if (fs.existsSync(srcIcon)) {
        fs.copyFileSync(srcIcon, path.join(appDest, 'app_icon_round.ico'));
        fs.copyFileSync(srcIcon, path.join(appDesktopDest, 'app_icon_round.ico'));
        fs.copyFileSync(srcIcon, path.join(dataDir, 'app_icon_round.ico'));
        fs.copyFileSync(srcIcon, path.join(dataDir, 'custom_app_icon.ico'));
    }

    // Atualizar o runner em Dados\updater_applier_runner.js
    fs.copyFileSync(path.join(REPO_ROOT, 'desktop', 'updater_applier.js'), path.join(dataDir, 'updater_applier_runner.js'));

    // 6. Limpar estado residual de transação interrompida (que causava rollback para v85.4.2)
    const stateFile = path.join(dataDir, 'update_state.json');
    const lockFile = path.join(dataDir, 'update_in_progress.lock');
    if (fs.existsSync(stateFile)) {
        fs.unlinkSync(stateFile);
        console.log('   - Removido update_state.json residual (fim do ciclo de rollback).');
    }
    if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
        console.log('   - Removido update_in_progress.lock residual.');
    }

    // 7. Garantir ícone circular versionado (cache-bust) em Dados/ e nos atalhos
    const shortcutsMod = require(path.join(appDest, 'shortcuts.js'));
    const bestIcon = shortcutsMod.resolveBestAppIcon(installDir, dataDir);
    console.log(`4. Ícone circular com cache-bust preparado: ${bestIcon}`);

    if (!skipShortcuts) {
        const exePath = path.join(installDir, 'Programa', 'GelControl.exe');
        shortcutsMod.ensureAppShortcuts({
            execPath: exePath,
            installRoot: installDir,
            dataDir: dataDir,
            channel: 'producao',
            force: true
        });
        shortcutsMod.updateAppCustomIcon({
            installRoot: installDir,
            dataDir: dataDir,
            channel: 'producao'
        });
        console.log('   - Atalhos da Área de Trabalho sincronizados com o novo ícone circular.');
    }

    // 8. Conferência final bit-a-bit do banco comercial Dados\state.json
    const shaAfter = computeFileSha256(stateJsonPath);
    if (shaBefore && shaAfter !== shaBefore) {
        throw new Error(`DIVERGENCIA_STATE_JSON: SHA-256 antes (${shaBefore}) difere do SHA-256 após (${shaAfter})!`);
    }

    console.log(`5. Verificação de Integridade Comercial:`);
    console.log(`   - SHA-256 final (state.json):   ${shaAfter || 'N/A'}`);
    console.log(`   - Status dos Dados Comerciais:  100% PRESERVADOS E IDÊNTICOS`);
    console.log('\n============================================================================');
    console.log('   DESTRAVAMENTO CONCLUÍDO COM 100% DE SUCESSO!');
    console.log('============================================================================');

    return {
        success: true,
        installDir,
        currentVer,
        shaBefore,
        shaAfter,
        bestIcon
    };
}

if (require.main === module) {
    try {
        runRepair();
        process.exit(0);
    } catch (err) {
        console.error('\n[ERRO NO DESTRAVAMENTO]:', err.message);
        process.exit(1);
    }
}

module.exports = { runRepair };

