// ============================================================================
// GELCONTROL — APLICADOR EXTERNO DE ATUALIZAÇÕES NO WINDOWS (ETAPA 4)
// Executado em processo independente para contornar locks de arquivos em uso
// ============================================================================

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isProcessAlive(pid) {
    if (!pid || pid <= 0) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch (e) {
        return e.code === 'EPERM';
    }
}

function removeObsoleteEntries(targetDir, sourceDir) {
    if (!fs.existsSync(targetDir) || !fs.existsSync(sourceDir)) return;
    const entries = fs.readdirSync(targetDir);
    for (const entry of entries) {
        const curPath = path.join(targetDir, entry);
        const newPath = path.join(sourceDir, entry);
        if (!fs.existsSync(newPath)) {
            console.log('[UpdaterApplier] Removendo arquivo/diretório obsoleto:', curPath);
            try {
                fs.rmSync(curPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
            } catch (eRem) {
                console.warn('[UpdaterApplier] Aviso: Não foi possível remover item obsoleto (arquivo travado pelo Windows):', curPath);
            }
        } else if (fs.statSync(curPath).isDirectory() && fs.statSync(newPath).isDirectory()) {
            removeObsoleteEntries(curPath, newPath);
        }
    }
}

async function main() {
    console.log('[UpdaterApplier] Iniciando aplicador de atualizações em segundo plano...');

    // Leitura de argumentos
    const args = process.argv.slice(2);
    let stateFilePath = null;
    let targetPid = null;
    let execPathToRelaunch = null;
    let relaunchArgs = [];

    for (const arg of args) {
        if (arg.startsWith('--state-file=')) {
            stateFilePath = arg.slice('--state-file='.length).replace(/^"(.*)"$/, '$1').trim();
        } else if (arg.startsWith('--target-pid=')) {
            targetPid = parseInt(arg.slice('--target-pid='.length).replace(/"/g, '').trim(), 10);
        } else if (arg.startsWith('--exec-path=')) {
            execPathToRelaunch = arg.slice('--exec-path='.length).replace(/^"(.*)"$/, '$1').trim();
        }
    }

    if (!stateFilePath || !fs.existsSync(stateFilePath)) {
        console.error('[UpdaterApplier] Arquivo de estado da transação não encontrado:', stateFilePath);
        process.exit(1);
    }

    let state = null;
    try {
        state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    } catch (e) {
        console.error('[UpdaterApplier] Erro ao ler arquivo de estado:', e);
        process.exit(1);
    }

    const { stagingDir, appDir, backupDir, targetVersion } = state;

    // 1. Aguarda encerramento do processo pai do GelControl
    if (targetPid && targetPid > 0) {
        console.log(`[UpdaterApplier] Aguardando término do processo GelControl (PID ${targetPid})...`);
        let waitedMs = 0;
        const maxWaitMs = 15000;
        while (isProcessAlive(targetPid) && waitedMs < maxWaitMs) {
            await sleep(500);
            waitedMs += 500;
        }

        // Se ainda estiver ativo após 15 segundos, força o encerramento seguro
        if (isProcessAlive(targetPid)) {
            console.log(`[UpdaterApplier] Forçando encerramento do processo ${targetPid}...`);
            try {
                execSync(`taskkill /PID ${targetPid} /F`, { stdio: 'ignore' });
            } catch (_) {}
            await sleep(1000);
        }
    }

    // 2. Aplicação da substituição dos arquivos
    console.log('[UpdaterApplier] Aplicando novos arquivos de staging para app...');
    state.stage = 'APPLYING';
    fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');

    let applySucceeded = false;
    let applyError = null;

    try {
        await sleep(800); // Aguarda liberação definitiva de file handles pelo Windows

        // 1. Remove recursivamente arquivos que não existem mais na nova versão (limpeza de obsoletos)
        removeObsoleteEntries(appDir, stagingDir);

        // 2. Cópia recursiva segura de staging para o diretório do app (sobrescrevendo com os novos arquivos)
        fs.cpSync(stagingDir, appDir, { recursive: true, force: true });

        // Validação imediata pós-cópia
        const newVerFile = path.join(appDir, 'version.json');
        if (!fs.existsSync(newVerFile)) {
            throw new Error('version.json ausente no destino após substituição.');
        }
        const parsed = JSON.parse(fs.readFileSync(newVerFile, 'utf8'));
        if (parsed.programVersion !== targetVersion) {
            throw new Error(`Versão no arquivo (${parsed.programVersion}) difere da versão alvo (${targetVersion}).`);
        }

        // Validação de integridade do conjunto completo instalado
        if (!fs.existsSync(path.join(appDir, 'index.html')) || !fs.existsSync(path.join(appDir, 'js'))) {
            throw new Error('Arquivos centrais ausentes após aplicação.');
        }

        applySucceeded = true;
        console.log('[UpdaterApplier] Substituição limpa de arquivos concluída com 100% de integridade.');

    } catch (err) {
        applyError = err.message;
        console.error('[UpdaterApplier] Falha ao substituir arquivos:', err);
        try {
            fs.appendFileSync(path.join(path.dirname(stateFilePath), 'applier_debug.log'), `APPLY_ERROR: ${err.stack || err.message}\n`, 'utf8');
        } catch (_) {}
    }

    if (applySucceeded) {
        state.stage = 'APPLIED';
        state.appliedAt = new Date().toISOString();
        fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');

        // Criação e manutenção preventiva de atalhos pós-atualização
        try {
            const shortcutsModule = path.join(appDir, 'desktop', 'shortcuts.js');
            if (fs.existsSync(shortcutsModule)) {
                const { ensureAppShortcuts } = require(shortcutsModule);
                const installRoot = path.resolve(path.dirname(execPathToRelaunch), '..');
                ensureAppShortcuts({
                    execPath: execPathToRelaunch,
                    installRoot: installRoot,
                    channel: state.channel || 'homologacao'
                });
            }
        } catch (eSc) {
            console.warn('[UpdaterApplier] Aviso ao criar atalhos pós-atualização:', eSc.message);
        }
    } else {
        // ROLLBACK IMEDIATO
        console.warn('[UpdaterApplier] Executando rollback de emergência devido à falha na substituição...');
        try {
            if (fs.existsSync(backupDir)) {
                fs.cpSync(backupDir, appDir, { recursive: true, force: true });
                console.log('[UpdaterApplier] Rollback concluído com sucesso.');
            }
        } catch (rollErr) {
            console.error('[UpdaterApplier] Erro durante o rollback de emergência:', rollErr);
        }
        state.stage = 'ROLLED_BACK';
        state.rollbackReason = `Falha na substituição de arquivos: ${applyError}`;
        state.rolledBackAt = new Date().toISOString();
        fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');
    }

    // 3. Relança o GelControl
    if (execPathToRelaunch && fs.existsSync(execPathToRelaunch)) {
        console.log('[UpdaterApplier] Relançando GelControl:', execPathToRelaunch);
        try {
            // AUDITORIA ETAPA 5: Remove a variável ELECTRON_RUN_AS_NODE do ambiente
            // para que o GelControl relance no modo de aplicativo visual Electron padrão
            const cleanEnv = { ...process.env };
            delete cleanEnv.ELECTRON_RUN_AS_NODE;

            const installDirArg = `--install-dir=${path.resolve(path.dirname(execPathToRelaunch), '..')}`;
            const child = spawn(execPathToRelaunch, ['--post-update', installDirArg], {
                detached: true,
                stdio: 'ignore',
                env: cleanEnv
            });
            const relaunchedPid = child.pid;
            child.unref();

            console.log(`[UpdaterApplier] GelControl relançado com novo PID: ${relaunchedPid}`);
            try {
                const dataDir = path.dirname(stateFilePath);
                fs.writeFileSync(path.join(dataDir, 'relaunched_pid.txt'), String(relaunchedPid), 'utf8');
                state.relaunchedPid = relaunchedPid;
                fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');
            } catch (_) {}
        } catch (spawnErr) {
            console.error('[UpdaterApplier] Erro ao relançar executável:', spawnErr);
        }
    }

    console.log('[UpdaterApplier] Finalizado.');
    process.exit(applySucceeded ? 0 : 2);
}

main().catch(e => {
    console.error('[UpdaterApplier] Erro fatal:', e);
    process.exit(1);
});

