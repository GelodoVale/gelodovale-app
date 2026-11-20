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

async function copyFileResilient(srcFile, destFile, maxAttempts = 15) {
    const parent = path.dirname(destFile);
    if (!fs.existsSync(parent)) {
        fs.mkdirSync(parent, { recursive: true });
    }
    let lastErr = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            fs.copyFileSync(srcFile, destFile);
            return;
        } catch (err) {
            lastErr = err;
            if (attempt >= 5 && process.platform === 'win32' && fs.existsSync(destFile)) {
                try {
                    execSync(`attrib -r -s -h "${destFile}"`, { stdio: 'ignore', timeout: 3000 });
                } catch (_) {}
            }
            await sleep(250);
        }
    }
    throw lastErr || new Error(`Falha ao copiar arquivo: ${destFile}`);
}

async function copyDirectoryResilient(srcDir, destDir) {
    if (!fs.existsSync(srcDir)) return;
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const sPath = path.join(srcDir, entry.name);
        const dPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            await copyDirectoryResilient(sPath, dPath);
        } else if (entry.isFile()) {
            await copyFileResilient(sPath, dPath, 15);
        }
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

/**
 * Localiza exclusivamente os processos em execução pertencentes à raiz desta instalação,
 * prevenindo qualquer impacto sobre instâncias de outros diretórios.
 */
function getTargetInstallationPids(installRoot, targetPid) {
    if (process.platform !== 'win32') return targetPid ? [targetPid] : [];
    const rootNorm = path.resolve(installRoot).toLowerCase();
    const currentPid = process.pid;
    const matchedPids = new Set();
    if (targetPid && targetPid > 0 && targetPid !== currentPid) {
        matchedPids.add(targetPid);
    }

    try {
        const psCmd = `
            $res = @()
            Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -like '*GelControl*' } | ForEach-Object {
                $res += [PSCustomObject]@{
                    Id = $_.ProcessId
                    Path = $_.ExecutablePath
                    ParentId = $_.ParentProcessId
                }
            }
            if ($res.Count -gt 0) { $res | ConvertTo-Json -Compress }
        `;
        const raw = execSync(`powershell.exe -NoProfile -NonInteractive -Command "${psCmd.replace(/\r?\n/g, ' ')}"`, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            timeout: 6000
        }).trim();

        if (raw) {
            let list = [];
            try {
                const parsed = JSON.parse(raw);
                list = Array.isArray(parsed) ? parsed : [parsed];
            } catch (_) {}

            for (const item of list) {
                const pid = parseInt(item.Id, 10);
                const parentId = parseInt(item.ParentId, 10);
                const exePath = item.Path ? path.resolve(item.Path).toLowerCase() : null;

                // REGRA DE SOBREVIVÊNCIA: Nunca incluir o próprio processo do aplicador
                if (pid === currentPid) continue;

                if (exePath && exePath.startsWith(rootNorm)) {
                    matchedPids.add(pid);
                } else if (parentId && matchedPids.has(parentId)) {
                    matchedPids.add(pid);
                }
            }
        }
    } catch (_) {
        // Fallback resiliente via Get-Process com verificação estrita de Path
        try {
            const raw2 = execSync('powershell.exe -NoProfile -NonInteractive -Command "Get-Process -Name \'GelControl\' -ErrorAction SilentlyContinue | Select-Object Id, Path | ConvertTo-Json -Compress"', {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
                timeout: 4000
            }).trim();
            if (raw2) {
                const parsed2 = JSON.parse(raw2);
                const list2 = Array.isArray(parsed2) ? parsed2 : [parsed2];
                for (const item of list2) {
                    const pid = parseInt(item.Id, 10);
                    if (pid === currentPid) continue;
                    const exePath = item.Path ? path.resolve(item.Path).toLowerCase() : null;
                    if (exePath && exePath.startsWith(rootNorm)) {
                        matchedPids.add(pid);
                    }
                }
            }
        } catch (_) {}
    }

    // Blindagem final: garante que o próprio processo aplicador nunca esteja na lista
    matchedPids.delete(currentPid);
    return Array.from(matchedPids);
}

/**
 * Revalida em tempo real se um PID específico ainda existe e pertence estritamente
 * à instalação alvo, evitando atingir PIDs reutilizados pelo Windows ou outras instâncias.
 */
function isPidBelongingToInstall(pid, installRoot) {
    if (!pid || pid <= 0 || pid === process.pid || !isProcessAlive(pid)) return false;
    if (process.platform !== 'win32') return true;
    const rootNorm = path.resolve(installRoot).toLowerCase();
    try {
        const cmd = `Get-Process -Id ${pid} -ErrorAction SilentlyContinue | Select-Object Id, Path | ConvertTo-Json -Compress`;
        const raw = execSync(`powershell.exe -NoProfile -NonInteractive -Command "${cmd}"`, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            timeout: 3000
        }).trim();
        if (!raw) return false;
        const info = JSON.parse(raw);
        if (!info || !info.Path) return false;
        const exePath = path.resolve(info.Path).toLowerCase();
        return exePath.startsWith(rootNorm);
    } catch (_) {
        return false;
    }
}

/**
 * Encerra de forma ordenada e graciosa apenas os processos da instalação alvo,
 * permitindo o flush de dados e respeitando gravações em andamento.
 */
async function gracefullyTerminateInstallationProcesses(pids, installRoot) {
    // Blindagem de segurança: exclui explicitamente o próprio PID do aplicador
    const targetPids = (pids || []).filter(pid => pid !== process.pid && isProcessAlive(pid));
    if (!targetPids.length) return true;

    console.log(`[UpdaterApplier] Gerenciando encerramento ordenado de ${targetPids.length} processo(s) da instalação: ${targetPids.join(', ')}...`);

    // Fase 1: Aguarda término espontâneo (ex: janelas já fechando normalmente)
    let pendingPids = targetPids.filter(pid => isProcessAlive(pid));
    let waitGraceMs = 0;
    while (pendingPids.length > 0 && waitGraceMs < 8000) {
        await sleep(500);
        waitGraceMs += 500;
        pendingPids = pendingPids.filter(pid => isProcessAlive(pid));
    }

    // Fase 2: Solicitação graciosa de fechamento via WM_CLOSE (sem /F)
    if (pendingPids.length > 0) {
        console.log(`[UpdaterApplier] Solicitando fechamento gracioso para processos pendentes: ${pendingPids.join(', ')}...`);
        for (const pid of pendingPids) {
            if (pid === process.pid) continue;
            try {
                // Sem /F: envia comando de fechamento normal do Windows, permitindo salvar dados
                execSync(`taskkill /PID ${pid}`, { stdio: 'ignore' });
            } catch (_) {}
        }

        // Aguarda até 5 segundos para que as operações pendentes e gravações sejam salvas
        let waitCloseMs = 0;
        while (pendingPids.length > 0 && waitCloseMs < 5000) {
            await sleep(500);
            waitCloseMs += 500;
            pendingPids = pendingPids.filter(pid => isProcessAlive(pid));
        }
    }

    // Fase 3: Encerramento forçado estritamente condicional como último recurso,
    // com REVALIDAÇÃO IMEDIATA de identidade por PID para evitar atingir PIDs reutilizados
    if (pendingPids.length > 0) {
        for (const pid of pendingPids) {
            if (pid === process.pid) continue;
            if (isPidBelongingToInstall(pid, installRoot)) {
                console.warn(`[UpdaterApplier] Identidade confirmada. Forçando término estrito do PID validado da instalação: ${pid}...`);
                try {
                    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
                } catch (_) {}
            } else {
                console.log(`[UpdaterApplier] PID ${pid} não pertence mais à instalação alvo (processo já encerrado ou PID reutilizado pelo Windows). Ignorado com segurança.`);
            }
        }
        await sleep(1000);
        pendingPids = pendingPids.filter(pid => pid !== process.pid && isProcessAlive(pid) && isPidBelongingToInstall(pid, installRoot));
    }

    // Pré-condição atômica: se algum processo da instalação ainda estiver ativo, não prossegue com a substituição
    if (pendingPids.length > 0) {
        console.error(`[UpdaterApplier] ERRO CRÍTICO: Não foi possível liberar processos da instalação alvo: ${pendingPids.join(', ')}.`);
        return false;
    }

    console.log('[UpdaterApplier] Todos os processos da instalação alvo foram encerrados com segurança.');
    return true;
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
    const installRoot = execPathToRelaunch ? path.resolve(path.dirname(execPathToRelaunch), '..') : path.resolve(appDir, '..', '..');

    const executionLog = path.join(path.dirname(stateFilePath), 'applier_execution.log');
    try {
        fs.appendFileSync(executionLog, `[${new Date().toISOString()}] INICIADO: PID=${process.pid} | targetPid=${targetPid} | targetVer=${targetVersion}\n`, 'utf8');
    } catch (_) {}

    // 0. Aguarda encerramento gracioso agendado pelo processo principal (app.quit em 1.2s)
    if (targetPid && targetPid > 0 && isProcessAlive(targetPid)) {
        await sleep(1600);
    }

    // 1. Identificação cirúrgica e encerramento ordenado e seguro apenas dos processos desta instalação
    const targetPids = getTargetInstallationPids(installRoot, targetPid);
    const safeToProceed = await gracefullyTerminateInstallationProcesses(targetPids, installRoot);

    if (!safeToProceed) {
        console.error('[UpdaterApplier] Atualização abortada preventivamente para proteger dados da aplicação.');
        state.stage = 'ABORTED';
        state.abortedAt = new Date().toISOString();
        state.abortReason = 'Processos da instalação permaneceram em uso pelo Windows. Nenhuma alteração foi realizada.';
        fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');
        try {
            fs.appendFileSync(executionLog, `[${new Date().toISOString()}] ABORTADO_PREVENTIVAMENTE: Processos em uso\n`, 'utf8');
            const lockFile = path.join(path.dirname(stateFilePath), 'update_in_progress.lock');
            if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
        } catch (_) {}
        if (execPathToRelaunch && fs.existsSync(execPathToRelaunch)) {
            try {
                const cleanEnv = { ...process.env };
                delete cleanEnv.ELECTRON_RUN_AS_NODE;
                const installDirArg = `--install-dir=${path.resolve(path.dirname(execPathToRelaunch), '..')}`;
                const child = spawn(execPathToRelaunch, [installDirArg], { detached: true, stdio: 'ignore', env: cleanEnv });
                child.unref();
            } catch (_) {}
        }
        process.exit(1);
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

        // 2. Cópia recursiva segura arquivo-por-arquivo de staging para app com tolerância individual anti-antivírus
        await copyDirectoryResilient(stagingDir, appDir);

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
        try { fs.appendFileSync(executionLog, `[${new Date().toISOString()}] ARQUIVOS_APLICADOS_SUCESSO\n`, 'utf8'); } catch (_) {}

    } catch (err) {
        applyError = err.message;
        console.error('[UpdaterApplier] Falha ao substituir arquivos:', err);
        try {
            fs.appendFileSync(path.join(path.dirname(stateFilePath), 'applier_debug.log'), `APPLY_ERROR: ${err.stack || err.message}\n`, 'utf8');
            fs.appendFileSync(executionLog, `[${new Date().toISOString()}] ERRO_OU_ROLLBACK: ${err.message}\n`, 'utf8');
        } catch (_) {}
    }

    if (applySucceeded) {
        state.stage = 'APPLIED';
        state.appliedAt = new Date().toISOString();
        fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf8');

        // Criação e manutenção preventiva de atalhos e ícones pós-atualização
        try {
            const dataDir = path.dirname(stateFilePath);
            const roundSrcCandidates = [
                path.join(appDir, 'app_icon_round.ico'),
                path.join(appDir, 'desktop', 'app_icon_round.ico')
            ];
            for (const srcIco of roundSrcCandidates) {
                if (fs.existsSync(srcIco)) {
                    const destRound = path.join(dataDir, 'app_icon_round.ico');
                    const destCustom = path.join(dataDir, 'custom_app_icon.ico');
                    try { fs.copyFileSync(srcIco, destRound); } catch (_) {}
                    try {
                        if (!fs.existsSync(destCustom) || fs.statSync(destCustom).size < 140000) {
                            fs.copyFileSync(srcIco, destCustom);
                        }
                    } catch (_) {}
                    break;
                }
            }

            let shortcutsModule = path.join(appDir, 'desktop', 'shortcuts.js');
            if (!fs.existsSync(shortcutsModule)) {
                shortcutsModule = path.join(appDir, 'shortcuts.js');
            }
            if (fs.existsSync(shortcutsModule)) {
                const { ensureAppShortcuts, updateAppCustomIcon } = require(shortcutsModule);
                const resolvedExecPath = execPathToRelaunch || path.join(installRoot, 'Programa', 'GelControl.exe');
                ensureAppShortcuts({
                    execPath: resolvedExecPath,
                    installRoot: installRoot,
                    channel: state.channel || 'producao',
                    force: true
                });
                updateAppCustomIcon({
                    installRoot: installRoot,
                    dataDir: dataDir,
                    channel: state.channel || 'producao'
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
                await copyDirectoryResilient(backupDir, appDir);
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
                fs.appendFileSync(executionLog, `[${new Date().toISOString()}] RELANCADO_COM_SUCESSO: PID=${relaunchedPid}\n`, 'utf8');
            } catch (_) {}
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

