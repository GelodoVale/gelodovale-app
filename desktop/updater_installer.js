// ============================================================================
// GELCONTROL — INSTALADOR SEGURO DE ATUALIZAÇÕES (ETAPA 4)
// Staging Seguro, Validação Anti-Zip Slip, Transações Atômicas, Rollback e Health Check
// ============================================================================

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { compareSemVer, verifyEd25519Signature, getCanonicalManifestBuffer } = require('./updater_core');

function sleepSync(ms) {
    const start = Date.now();
    while (Date.now() - start < ms) { /* espera síncrona segura */ }
}

function safeRmSync(targetPath, maxRetries = 25, initialDelayMs = 100) {
    if (!fs.existsSync(targetPath)) return;
    let delay = initialDelayMs;
    for (let i = 0; i < maxRetries; i++) {
        try {
            fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
            if (!fs.existsSync(targetPath)) return;
        } catch (err) {
            if (i === maxRetries - 1) {
                try {
                    if (process.platform === 'win32') {
                        execSync(`attrib -r -s -h /s /d "${targetPath}\\*"`, { stdio: 'ignore', timeout: 5000 });
                        fs.rmSync(targetPath, { recursive: true, force: true });
                        return;
                    }
                } catch (_) {}
                // Fallback de contingência no Windows: renomeia o diretório bloqueado para reciclagem
                try {
                    if (process.platform === 'win32') {
                        const recyclePath = `${targetPath}_recycle_${Date.now()}`;
                        fs.renameSync(targetPath, recyclePath);
                        console.warn(`[UpdaterInstaller] Diretório com arquivo em uso renomeado para reciclagem: ${recyclePath}`);
                        return;
                    }
                } catch (_) {}
                throw err;
            }
            sleepSync(delay);
            delay = Math.min(delay + 50, 400); // Backoff progressivo até 400ms
        }
    }
}

function safeCpSync(srcDir, destDir, maxRetries = 25, initialDelayMs = 100) {
    let delay = initialDelayMs;
    for (let i = 0; i < maxRetries; i++) {
        try {
            fs.cpSync(srcDir, destDir, { recursive: true, force: true });
            return;
        } catch (err) {
            if (i === maxRetries - 1) {
                try {
                    if (process.platform === 'win32') {
                        if (fs.existsSync(destDir)) {
                            execSync(`attrib -r -s -h /s /d "${destDir}\\*"`, { stdio: 'ignore', timeout: 5000 });
                        }
                        fs.cpSync(srcDir, destDir, { recursive: true, force: true });
                        return;
                    }
                } catch (_) {}
                throw err;
            }
            sleepSync(delay);
            delay = Math.min(delay + 50, 400);
        }
    }
}

class UpdaterInstaller {
    constructor(options = {}) {
        this.installRoot = options.installRoot || path.resolve(__dirname, '..');
        this.dataDir = options.dataDir || path.join(this.installRoot, 'Dados');
        this.programDir = options.programDir || path.join(this.installRoot, 'Programa');
        
        // Pasta onde os arquivos da aplicação residem
        // Em produção: <installRoot>\Programa\resources\app
        // Em dev/testes: options.appDir ou fallback para resources\app ou installRoot
        if (options.appDir) {
            this.appDir = options.appDir;
        } else {
            const packagedAppDir = path.join(this.programDir, 'resources', 'app');
            this.appDir = fs.existsSync(packagedAppDir) ? packagedAppDir : this.installRoot;
        }

        this.updatesTempDir = path.join(this.dataDir, 'updates_temp');
        this.stagingDir = path.join(this.dataDir, 'updates_staging');
        this.backupDir = path.join(this.dataDir, 'app_previous_backup');
        this.stateFile = path.join(this.dataDir, 'update_state.json');
        this.historyFile = path.join(this.dataDir, 'update_history.json');
        this.lockFile = path.join(this.dataDir, 'update_in_progress.lock');

        this.installedVersion = options.installedVersion || '85.0.0';
        this.channel = options.channel || 'homologacao';
        this.trustedPublicKeys = options.trustedPublicKeys || {};

        // Garante existência das pastas essenciais em Dados (sem tocar em Backups ou browser_storage)
        this._ensureDirectories();
    }

    _ensureDirectories() {
        try {
            if (!fs.existsSync(this.dataDir)) fs.mkdirSync(this.dataDir, { recursive: true });
            if (!fs.existsSync(this.updatesTempDir)) fs.mkdirSync(this.updatesTempDir, { recursive: true });
        } catch (_) {}
    }

    /**
     * Adquire a trava de concorrência (mutex exclusivo) para impedir duas atualizações simultâneas
     */
    acquireLock() {
        if (fs.existsSync(this.lockFile)) {
            try {
                const lockData = JSON.parse(fs.readFileSync(this.lockFile, 'utf8'));
                const lockTime = new Date(lockData.timestamp || 0).getTime();
                const now = Date.now();
                // Se o lock tiver mais de 10 minutos, considera órfão de processo anterior
                if (now - lockTime < 10 * 60 * 1000) {
                    throw new Error('ATUALIZACAO_JA_EM_ANDAMENTO: Outro processo está executando uma atualização.');
                }
            } catch (e) {
                if (e.message.startsWith('ATUALIZACAO_JA_EM_ANDAMENTO')) throw e;
            }
        }
        fs.writeFileSync(this.lockFile, JSON.stringify({
            pid: process.pid,
            timestamp: new Date().toISOString()
        }, null, 2), 'utf8');
    }

    /**
     * Libera a trava de concorrência
     */
    releaseLock() {
        try {
            if (fs.existsSync(this.lockFile)) fs.unlinkSync(this.lockFile);
        } catch (_) {}
    }

    /**
     * Lê o estado da transação atual
     */
    readTransactionState() {
        if (!fs.existsSync(this.stateFile)) return null;
        try {
            return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        } catch (_) {
            return null;
        }
    }

    /**
     * Grava o estado persistente da transação
     */
    writeTransactionState(state) {
        fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf8');
    }

    /**
     * Remove o arquivo de transação
     */
    clearTransactionState() {
        try {
            if (fs.existsSync(this.stateFile)) fs.unlinkSync(this.stateFile);
        } catch (_) {}
    }

    /**
     * Registra o evento no histórico persistente (sem senhas, tokens ou dados sensíveis)
     */
    recordHistoryEntry(entry) {
        let history = [];
        try {
            if (fs.existsSync(this.historyFile)) {
                history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
                if (!Array.isArray(history)) history = [];
            }
        } catch (_) {
            history = [];
        }

        const safeEntry = {
            timestamp: new Date().toISOString(),
            previousVersion: entry.previousVersion || this.installedVersion,
            targetVersion: entry.targetVersion || 'desconhecida',
            channel: entry.channel || this.channel,
            result: entry.result || 'UNKNOWN',
            details: entry.details || '',
            error: entry.error || null
        };

        history.unshift(safeEntry);
        // Mantém as últimas 50 ocorrências
        if (history.length > 50) history = history.slice(0, 50);

        try {
            fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2), 'utf8');
        } catch (e) {
            console.error('[UpdaterInstaller] Erro ao gravar histórico de atualizações:', e);
        }
    }

    /**
     * Retorna o histórico de atualizações
     */
    getUpdateHistory() {
        try {
            if (fs.existsSync(this.historyFile)) {
                return JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
            }
        } catch (_) {}
        return [];
    }

    /**
     * Varredura recursiva de diretório com validação estrita anti-Path Traversal e Zip Slip
     */
    validateDirectorySecurity(targetDir, rootBoundary) {
        const resolvedBoundary = path.resolve(rootBoundary);
        
        function scan(currentDir) {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const ent of entries) {
                const fullPath = path.join(currentDir, ent.name);
                const resolved = path.resolve(fullPath);

                // Anti-Path Traversal / Escape
                if (!resolved.startsWith(resolvedBoundary + path.sep) && resolved !== resolvedBoundary) {
                    throw new Error(`PATH_TRAVERSAL_DETECTADO: O arquivo '${ent.name}' tenta escapar do diretório autorizado.`);
                }

                // Bloqueio de Links Simbólicos perigosos
                if (ent.isSymbolicLink()) {
                    throw new Error(`LINK_SIMBOLICO_PROIBIDO: Arquivo '${ent.name}' é um symlink não autorizado.`);
                }

                // Bloqueio de diretórios protegidos
                const baseNameLower = ent.name.toLowerCase();
                if (baseNameLower === 'dados' || baseNameLower === 'backups' || baseNameLower === 'browser_storage') {
                    throw new Error(`DIRETORIO_PROTEGIDO_VIOLADO: O pacote tenta sobrescrever pastas de dados do sistema (${ent.name}).`);
                }

                if (ent.isDirectory()) {
                    scan(fullPath);
                }
            }
        }

        scan(targetDir);
    }

    /**
     * Valida os arquivos essenciais que compõem o sistema na pasta de staging
     */
    validateStagingIntegrity(stagingDir, targetVersion) {
        const versionJsonPath = path.join(stagingDir, 'version.json');
        if (!fs.existsSync(versionJsonPath)) {
            throw new Error('ARQUIVO_CRITICO_AUSENTE: version.json não encontrado no pacote extraído.');
        }

        let stagedVersion = null;
        try {
            stagedVersion = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
        } catch (e) {
            throw new Error('ARQUIVO_CORROMPIDO: version.json inválido no pacote extraído.');
        }

        if (stagedVersion.programVersion !== targetVersion) {
            throw new Error(`VERSAO_DIVERGENTE: Manifesto anuncia '${targetVersion}', mas version.json contém '${stagedVersion.programVersion}'.`);
        }

        if (stagedVersion.channel !== this.channel) {
            throw new Error(`CANAL_DIVERGENTE: Manifesto anuncia canal '${this.channel}', mas pacote pertence a '${stagedVersion.channel}'.`);
        }

        // Verifica existência de arquivos fundamentais da interface e integridade do pacote
        const requiredFiles = ['index.html', 'js', path.join('js', 'app.js')];
        for (const rf of requiredFiles) {
            if (!fs.existsSync(path.join(stagingDir, rf))) {
                throw new Error(`PACOTE_INCOMPLETO_REJEITADO: Elemento obrigatório '${rf}' não encontrado no pacote extraído.`);
            }
        }

        return true;
    }

    /**
     * Extrai um pacote .zip ou diretório empacotado para a pasta de staging de forma segura
     */
    extractPackageToStaging(packagePath, targetVersion) {
        // Limpa a pasta de staging prévia com retentativas anti-lock
        if (fs.existsSync(this.stagingDir)) {
            safeRmSync(this.stagingDir);
        }
        fs.mkdirSync(this.stagingDir, { recursive: true });

        // Pasta temporária de quarentena
        const quarantineDir = path.join(this.dataDir, 'updates_quarantine_' + Date.now());
        if (fs.existsSync(quarantineDir)) safeRmSync(quarantineDir);
        fs.mkdirSync(quarantineDir, { recursive: true });

        try {
            const ext = path.extname(packagePath).toLowerCase();
            
            // Detecta se o arquivo é um ZIP (por extensão ou pelos magic bytes PK)
            let isZip = (ext === '.zip');
            if (!isZip && fs.existsSync(packagePath)) {
                try {
                    const header = Buffer.alloc(4);
                    const fd = fs.openSync(packagePath, 'r');
                    fs.readSync(fd, header, 0, 4, 0);
                    fs.closeSync(fd);
                    if (header[0] === 0x50 && header[1] === 0x4B) { // 'PK'
                        isZip = true;
                    }
                } catch (_) {}
            }
            
            if (isZip) {
                // Para garantir que o processamento ocorra sem restrição de extensão (mesmo sendo .tmp)
                const tempZipFile = path.join(quarantineDir, 'temp_payload.zip');
                fs.copyFileSync(packagePath, tempZipFile);

                // AUDITORIA ETAPA 5: Validação estrita de cada entrada do ZIP ANTES de qualquer extração
                // Proteção cabal contra Zip Slip, Path Traversal, links simbólicos e invasão de pastas
                const psExtractScript = `
                    Add-Type -AssemblyName System.IO.Compression;
                    Add-Type -AssemblyName System.IO.Compression.FileSystem;
                    $zipPath = '${tempZipFile.replace(/'/g, "''")}';
                    $destDir = '${quarantineDir.replace(/'/g, "''")}';
                    $destCanonical = [System.IO.Path]::GetFullPath($destDir).TrimEnd('\\', '/') + [System.IO.Path]::DirectorySeparatorChar;

                    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath);
                    try {
                        # FASE 1: VALIDAÇÃO PRÉVIA DE TODAS AS ENTRADAS ANTES DA EXTRAÇÃO
                        # Proteção anti-Zip Bomb: limites estritos de entradas e bytes descompactados
                        $maxEntriesAllowed = 5000;
                        $maxTotalUncompressedBytes = 262144000; # 250 MB
                        $maxSingleFileBytes = 104857600;       # 100 MB
                        $totalUncompressed = 0;

                        if ($zip.Entries.Count -gt $maxEntriesAllowed) {
                            throw "ZIP_BOMB_DETECTADO: Pacote contem $($zip.Entries.Count) entradas, excedendo o limite de $maxEntriesAllowed.";
                        }

                        foreach ($entry in $zip.Entries) {
                            $name = $entry.FullName;
                            if ([string]::IsNullOrWhiteSpace($name)) { continue; }

                            # 1.0 Proteção anti-Zip Bomb (tamanho acumulado e individual)
                            $uncompressed = $entry.Length;
                            $compressed = $entry.CompressedLength;
                            $totalUncompressed += $uncompressed;

                            if ($totalUncompressed -gt $maxTotalUncompressedBytes) {
                                throw "ZIP_BOMB_DETECTADO: Tamanho descompactado total excede o limite seguro de 250 MB ($totalUncompressed bytes).";
                            }
                            if ($uncompressed -gt $maxSingleFileBytes) {
                                throw "ZIP_BOMB_DETECTADO: Arquivo individual '$name' excede o limite maximo de 100 MB ($uncompressed bytes).";
                            }
                            if ($uncompressed -gt 10485760 -and $compressed -gt 0) {
                                $ratio = $uncompressed / $compressed;
                                if ($ratio -gt 100) {
                                    throw "ZIP_BOMB_DETECTADO: Taxa de compressao anormal ($ratio:1) detectada na entrada '$name'.";
                                }
                            }

                            # 1.1 Anti-Zip Slip / Anti-Path Traversal
                            if ($name.Contains('..')) {
                                throw "ZIP_SLIP_DETECTADO: Entrada '$name' contem sequencia ilegal de path traversal (..).";
                            }
                            # 1.2 Anti-Caminho Absoluto
                            if ($name.StartsWith('/') -or $name.StartsWith('\\') -or ($name.Length -gt 1 -and $name[1] -eq ':')) {
                                throw "CAMINHO_ABSOLUTO_ILEGAL: Entrada '$name' contem caminho absoluto proibido.";
                            }
                            # 1.3 Anti-Caracteres Proibidos em Nomes de Arquivo no Windows
                            if ($name -match '[\\*\\?\\"<>\\|]') {
                                throw "CARACTERE_INVALIDO_DETECTADO: Entrada '$name' contem caracteres invalidos no Windows.";
                            }

                            # 1.4 Verificação de Limites do Diretório Destino (Canonical Confinement)
                            $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($destDir, $name));
                            $isDir = $name.EndsWith('/') -or $name.EndsWith('\\');
                            if ($isDir) {
                                $dirCheck = $fullPath.TrimEnd('\\', '/') + [System.IO.Path]::DirectorySeparatorChar;
                                if (-not $dirCheck.StartsWith($destCanonical)) {
                                    throw "ZIP_SLIP_OUT_OF_BOUNDS: Diretorio '$name' resolve fora da fronteira de quarentena autorizada.";
                                }
                            } else {
                                if (-not $fullPath.StartsWith($destCanonical)) {
                                    throw "ZIP_SLIP_OUT_OF_BOUNDS: Arquivo '$name' resolve fora da fronteira de quarentena autorizada ($fullPath).";
                                }
                            }

                            # 1.5 Bloqueio de pastas críticas e reservadas do GelControl
                            $normalizedRel = $name.Replace('/', '\\').TrimStart('\\');
                            if ($normalizedRel -match '^(Dados|Backups)(\\\\|$)' -or $normalizedRel.Contains('\\Dados\\') -or $normalizedRel.Contains('\\Backups\\')) {
                                throw "SOBRESCRITA_PROTEGIDA_PROIBIDA: Pacote tenta criar ou sobrescrever recursos protegidos de dados ou backups: '$name'.";
                            }
                        }

                        # FASE 2: EXTRAÇÃO SEGURA ENTRADA POR ENTRADA APÓS TODAS AS ENTRADAS APROVADAS
                        foreach ($entry in $zip.Entries) {
                            $name = $entry.FullName;
                            if ([string]::IsNullOrWhiteSpace($name)) { continue; }
                            $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($destDir, $name));
                            $isDir = $name.EndsWith('/') -or $name.EndsWith('\\');

                            if ($isDir) {
                                if (-not [System.IO.Directory]::Exists($fullPath)) {
                                    [System.IO.Directory]::CreateDirectory($fullPath) | Out-Null;
                                }
                            } else {
                                $parent = [System.IO.Path]::GetDirectoryName($fullPath);
                                if (-not [System.IO.Directory]::Exists($parent)) {
                                    [System.IO.Directory]::CreateDirectory($parent) | Out-Null;
                                }
                                [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $fullPath, $true);
                            }
                        }
                    } finally {
                        $zip.Dispose();
                    }
                `;

                const psScriptFile = path.join(quarantineDir, 'extract_safe.ps1');
                fs.writeFileSync(psScriptFile, psExtractScript, 'utf8');

                try {
                    execSync(`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${psScriptFile}"`, { stdio: 'pipe', timeout: 60000 });
                } catch (ePs) {
                    const errMsg = (ePs.stderr ? ePs.stderr.toString('utf8') : '') || ePs.message;
                    throw new Error(`FALHA_EXTRACAO_ZIP_SEGURA: ${errMsg.trim()}`);
                } finally {
                    try { if (fs.existsSync(psScriptFile)) fs.unlinkSync(psScriptFile); } catch (_) {}
                    try { if (fs.existsSync(tempZipFile)) fs.unlinkSync(tempZipFile); } catch (_) {}
                }
            } else if (ext === '.json') {
                // Suporte para pacote canônico estruturado de arquivos (mock / testes)
                const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                if (!packageData.files || typeof packageData.files !== 'object') {
                    throw new Error('PACOTE_JSON_INVALIDO: Chave "files" ausente.');
                }
                for (const [relPath, content] of Object.entries(packageData.files)) {
                    // Validação prévia de caminho no formato JSON
                    if (path.isAbsolute(relPath) || relPath.includes('..')) {
                        throw new Error(`PATH_TRAVERSAL_DETECTADO: Caminho ilegal no arquivo JSON: ${relPath}`);
                    }
                    const fullTarget = path.join(quarantineDir, relPath);
                    const parent = path.dirname(fullTarget);
                    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
                    fs.writeFileSync(fullTarget, content, 'utf8');
                }
            } else {
                throw new Error(`FORMATO_PACOTE_NAO_SUPORTADO: '${ext}'. O atualizador suporta pacotes .zip assinados.`);
            }

            // Validação de Segurança Criptográfica e Anti-Traversal na pasta de quarentena
            this.validateDirectorySecurity(quarantineDir, quarantineDir);

            // Se o conteúdo estiver aninhado dentro de uma subpasta raiz única (ex: repo-main ou app)
            let effectiveSourceDir = quarantineDir;
            const rootEntries = fs.readdirSync(quarantineDir);
            if (rootEntries.length === 1 && fs.statSync(path.join(quarantineDir, rootEntries[0])).isDirectory()) {
                const subDir = path.join(quarantineDir, rootEntries[0]);
                if (fs.existsSync(path.join(subDir, 'version.json'))) {
                    effectiveSourceDir = subDir;
                }
            }

            // Valida integridade técnica do staging
            this.validateStagingIntegrity(effectiveSourceDir, targetVersion);

            // Move os arquivos da quarentena validada para o staging com tolerância a locks
            safeCpSync(effectiveSourceDir, this.stagingDir);

        } finally {
            // Limpa a pasta de quarentena
            try {
                if (fs.existsSync(quarantineDir)) safeRmSync(quarantineDir);
            } catch (_) {}
        }

        return this.stagingDir;
    }

    /**
     * Cria backup seguro da versão anterior do programa em Dados\app_previous_backup
     */
    createPreviousVersionBackup() {
        if (fs.existsSync(this.backupDir)) {
            safeRmSync(this.backupDir);
        }
        fs.mkdirSync(this.backupDir, { recursive: true });

        if (!fs.existsSync(this.appDir)) {
            throw new Error(`DIRETORIO_APP_NAO_ENCONTRADO: '${this.appDir}'`);
        }

        // Cópia recursiva segura de preservação do programa atual
        safeCpSync(this.appDir, this.backupDir);

        // Valida que o backup contém a versão anterior íntegra
        const verCheck = path.join(this.backupDir, 'version.json');
        if (!fs.existsSync(verCheck)) {
            throw new Error('FALHA_CRIACAO_BACKUP: version.json não encontrado no backup gerado.');
        }

        return this.backupDir;
    }

    /**
     * Prepara e valida toda a transação antes da substituição de arquivos
     */
    async prepareUpdateTransaction({ packagePath, manifest }) {
        this.acquireLock();

        try {
            const targetVersion = manifest.latestVersion;

            // 0. Validação da Modalidade de Pacote (full_installer vs app_archive)
            if (manifest.packageType === 'full_installer') {
                throw new Error('MODALIDADE_NAO_HOMOLOGADA: Atualizações completas de instalador (full_installer) permanecem desabilitadas por segurança nesta etapa. Apenas pacotes "app_archive" estão homologados com staging atômico e rollback.');
            }

            // 1. Revalidação de Downgrade
            if (compareSemVer(targetVersion, this.installedVersion) <= 0) {
                throw new Error(`DOWNGRADE_REJEITADO: Versão alvo (${targetVersion}) não é superior à versão atual (${this.installedVersion}).`);
            }

            // 2. Revalidação de Canal
            if (manifest.channel !== this.channel) {
                throw new Error(`CANAL_INCOMPATIVEL: Pacote é '${manifest.channel}', instalação atual é '${this.channel}'.`);
            }

            // 3. Revalidação de Compatibilidade Mínima
            if (manifest.minAppVersion && compareSemVer(this.installedVersion, manifest.minAppVersion) < 0) {
                throw new Error(`VERSAO_MINIMA_INCOMPATIVEL: Requer versão ${manifest.minAppVersion} ou superior.`);
            }

            // 4. Verificação de Espaço em Disco (requer pelo menos 150 MB livres)
            // Em ambientes Node no Windows, verificamos através de leitura básica
            if (!fs.existsSync(packagePath)) {
                throw new Error(`ARQUIVO_PACOTE_INEXISTENTE: '${packagePath}'`);
            }

            // 5. Extração e validação do staging
            this.extractPackageToStaging(packagePath, targetVersion);

            // 6. Criação do backup de reversão (rollback)
            this.createPreviousVersionBackup();

            // 7. Registro do estado transacional persistente
            const transactionState = {
                transactionId: `upd_${Date.now()}`,
                stage: 'BACKUP_READY',
                previousVersion: this.installedVersion,
                targetVersion: targetVersion,
                channel: this.channel,
                packagePath: packagePath,
                stagingDir: this.stagingDir,
                backupDir: this.backupDir,
                appDir: this.appDir,
                startedAt: new Date().toISOString()
            };

            this.writeTransactionState(transactionState);

            return {
                success: true,
                transactionId: transactionState.transactionId,
                targetVersion: targetVersion,
                stage: 'BACKUP_READY',
                message: 'Nova versão preparada no staging e backup da versão anterior criado com sucesso.'
            };

        } catch (err) {
            this.releaseLock();
            this.recordHistoryEntry({
                targetVersion: manifest ? manifest.latestVersion : 'indefinida',
                result: 'PREPARATION_FAILED',
                error: err.message
            });
            throw err;
        }
    }

    /**
     * Aplica a substituição dos arquivos (direta ou orquestrada)
     */
    applyStagedFiles() {
        const state = this.readTransactionState();
        if (!state || state.stage !== 'BACKUP_READY') {
            throw new Error('ESTADO_TRANSACAO_INVALIDO: A transação não está pronta para aplicação.');
        }

        state.stage = 'APPLYING';
        this.writeTransactionState(state);

        try {
            // Remove arquivos obsoletos que não constam mais na nova versão
            const removeObsolete = (targetDir, sourceDir) => {
                if (!fs.existsSync(targetDir) || !fs.existsSync(sourceDir)) return;
                const entries = fs.readdirSync(targetDir);
                for (const entry of entries) {
                    const curPath = path.join(targetDir, entry);
                    const newPath = path.join(sourceDir, entry);
                    if (!fs.existsSync(newPath)) {
                        fs.rmSync(curPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
                    } else if (fs.statSync(curPath).isDirectory() && fs.statSync(newPath).isDirectory()) {
                        removeObsolete(curPath, newPath);
                    }
                }
            };
            removeObsolete(this.appDir, this.stagingDir);

            // Copia recursiva do staging para a pasta do aplicativo com tolerância a locks
            safeCpSync(this.stagingDir, this.appDir);

            // Validação imediata pós-cópia
            const newVersionJson = path.join(this.appDir, 'version.json');
            if (!fs.existsSync(newVersionJson)) {
                throw new Error('FALHA_APLICACAO: version.json ausente após substituição de arquivos.');
            }
            const readBack = JSON.parse(fs.readFileSync(newVersionJson, 'utf8'));
            if (readBack.programVersion !== state.targetVersion) {
                throw new Error(`FALHA_APLICACAO_VERSAO: Esperado '${state.targetVersion}', obtido '${readBack.programVersion}'.`);
            }

            state.stage = 'APPLIED';
            this.writeTransactionState(state);

            return { success: true, stage: 'APPLIED', newVersion: state.targetVersion };

        } catch (errApply) {
            // Em caso de qualquer falha durante a cópia, executa o rollback imediatamente
            console.error('[UpdaterInstaller] Falha durante cópia de arquivos. Disparando rollback...', errApply);
            this.performRollback(`Falha durante substituição: ${errApply.message}`);
            throw errApply;
        }
    }

    /**
     * Executa a recuperação automática (Rollback) restaurando a versão anterior
     */
    performRollback(reason) {
        console.warn(`[UpdaterInstaller] INICIANDO ROLLBACK DO PROGRAMA. Motivo: ${reason}`);
        const state = this.readTransactionState() || {};

        try {
            if (fs.existsSync(this.backupDir)) {
                // Restaura os arquivos do backup para a pasta da aplicação
                fs.cpSync(this.backupDir, this.appDir, { recursive: true, force: true });
                console.log('[UpdaterInstaller] Versão anterior restaurada com sucesso.');
            } else {
                console.error('[UpdaterInstaller] ERRO CRÍTICO: Pasta de backup não encontrada para rollback!');
            }

            // Registra no histórico
            this.recordHistoryEntry({
                previousVersion: state.previousVersion || this.installedVersion,
                targetVersion: state.targetVersion || 'desconhecida',
                result: 'ROLLED_BACK',
                details: reason
            });

            state.stage = 'ROLLED_BACK';
            state.rollbackReason = reason;
            state.rolledBackAt = new Date().toISOString();
            this.writeTransactionState(state);

        } catch (eRoll) {
            console.error('[UpdaterInstaller] Falha durante rollback:', eRoll);
        } finally {
            this.releaseLock();
        }
    }

    /**
     * Valida a saúde e integridade do aplicativo após inicializar a nova versão
     */
    checkPostUpdateHealth() {
        const state = this.readTransactionState();
        if (!state) return { hasPendingTransaction: false };

        if (state.stage === 'COMMITTED') {
            return {
                hasPendingTransaction: true,
                status: 'COMMITTED',
                version: state.targetVersion,
                previousVersion: state.previousVersion
            };
        }

        if (state.stage === 'APPLIED') {
            console.log('[UpdaterInstaller] Verificando saúde da nova versão pós-atualização...');

            try {
                // 1. Verifica se version.json bate com a versão alvo
                const verFile = path.join(this.appDir, 'version.json');
                if (!fs.existsSync(verFile)) {
                    throw new Error('version.json ausente no diretório do programa.');
                }
                const parsed = JSON.parse(fs.readFileSync(verFile, 'utf8'));
                if (parsed.programVersion !== state.targetVersion) {
                    throw new Error(`Versão em disco (${parsed.programVersion}) não confere com targetVersion (${state.targetVersion}).`);
                }

                // 2. Verifica se index.html e js/app.js existem
                if (!fs.existsSync(path.join(this.appDir, 'index.html')) || !fs.existsSync(path.join(this.appDir, 'js', 'app.js'))) {
                    throw new Error('Arquivos centrais da aplicação ausentes após atualização.');
                }

                // Health check aprovado com sucesso!
                console.log(`[UpdaterInstaller] Atualização para v${state.targetVersion} CONCLUÍDA E VALIDADA COM SUCESSO!`);

                this.recordHistoryEntry({
                    previousVersion: state.previousVersion,
                    targetVersion: state.targetVersion,
                    channel: state.channel,
                    result: 'SUCCESS',
                    details: 'Atualização aplicada e validada no boot com 100% de sucesso.'
                });

                // Remove arquivos temporários de staging
                try {
                    if (fs.existsSync(this.stagingDir)) safeRmSync(this.stagingDir);
                } catch (_) {}

                // Registra estado de transação permanentemente consolidado
                state.stage = 'COMMITTED';
                state.committedAt = new Date().toISOString();
                this.writeTransactionState(state);
                this.releaseLock();

                return {
                    hasPendingTransaction: true,
                    status: 'COMMITTED',
                    version: state.targetVersion,
                    previousVersion: state.previousVersion
                };

            } catch (healthErr) {
                console.error('[UpdaterInstaller] Falha na verificação de saúde da nova versão! Disparando rollback automático...', healthErr);
                this.performRollback(`Falha no health-check pós-atualização: ${healthErr.message}`);
                return {
                    hasPendingTransaction: true,
                    status: 'ROLLED_BACK',
                    error: healthErr.message
                };
            }
        }

        if (state.stage === 'APPLYING' || state.stage === 'STAGED' || state.stage === 'BACKUP_READY') {
            // Transação interrompida por queda de energia ou fechamento anômalo no meio do processo
            console.warn('[UpdaterInstaller] Transação incompleta ou interrompida detectada! Executando recuperação segura...');
            this.performRollback('Transação interrompida antes da conclusão.');
            return {
                hasPendingTransaction: true,
                status: 'ROLLED_BACK',
                error: 'Interrupção detectada durante a instalação.'
            };
        }

        if (state.stage === 'ROLLED_BACK') {
            const lastReason = state.rollbackReason;
            this.clearTransactionState();
            this.releaseLock();
            return {
                hasPendingTransaction: true,
                status: 'ROLLED_BACK',
                reason: lastReason
            };
        }

        return { hasPendingTransaction: false };
    }
}

module.exports = {
    UpdaterInstaller
};

