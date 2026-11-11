// ============================================================================
// GELCONTROL — MOTOR DO ATUALIZADOR (ETAPA 2: CONSULTA E DOWNLOAD SEGURO)
// Criptografia Ed25519, Integridade SHA-256, Validação de Canais e SemVer
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const https = require('https');

// Limites rígidos de segurança
const MAX_PACKAGE_SIZE = 150 * 1024 * 1024; // 150 MB máximo
const DEFAULT_TIMEOUT_MS = 30000;          // 30 segundos de timeout
const MAX_REDIRECTS = 3;

/**
 * Comparador semântico de versões (SemVer: major.minor.patch)
 * Retorna:
 *   1 se v1 > v2 (upgrade válido)
 *   0 se v1 === v2 (versão idêntica)
 *  -1 se v1 < v2 (downgrade)
 */
function compareSemVer(v1, v2) {
    if (!v1 || !v2) return 0;
    const clean1 = String(v1).replace(/^v/i, '').trim();
    const clean2 = String(v2).replace(/^v/i, '').trim();

    const parts1 = clean1.split('.').map(n => parseInt(n, 10) || 0);
    const parts2 = clean2.split('.').map(n => parseInt(n, 10) || 0);

    for (let i = 0; i < 3; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

/**
 * Cria o buffer canônico determinístico dos campos do manifesto para assinatura e verificação.
 * Garante que a ordem dos campos não altere o resultado criptográfico.
 */
function getCanonicalManifestBuffer(manifest) {
    const canonicalObject = {
        channel: String(manifest.channel || ''),
        latestVersion: String(manifest.latestVersion || ''),
        buildDate: String(manifest.buildDate || ''),
        minAppVersion: String(manifest.minAppVersion || ''),
        packageUrl: String(manifest.packageUrl || ''),
        packageSize: Number(manifest.packageSize) || 0,
        sha256: String(manifest.sha256 || '').toLowerCase().trim()
    };
    return Buffer.from(JSON.stringify(canonicalObject, Object.keys(canonicalObject).sort()), 'utf8');
}

/**
 * Validação criptográfica da assinatura digital Ed25519
 */
function verifyEd25519Signature(manifest, publicKeyPemOrDer) {
    if (!manifest || !manifest.signature || !publicKeyPemOrDer) return false;
    try {
        const canonicalBuffer = getCanonicalManifestBuffer(manifest);
        const sigBuffer = Buffer.from(manifest.signature, 'hex');
        return crypto.verify(null, canonicalBuffer, publicKeyPemOrDer, sigBuffer);
    } catch (e) {
        return false;
    }
}

/**
 * Classe Central do Motor do Atualizador
 */
class UpdaterCore {
    constructor(options = {}) {
        this.installedVersion = options.installedVersion || "85.0.0";
        this.channel = options.channel || "homologacao"; // imutável pela compilação
        this.tempDir = options.tempDir || path.join(process.cwd(), 'scratch', 'updates_temp');

        // Chaves públicas de canais (nesta etapa preparatória, deixadas vazias ou injetáveis via opções de teste)
        this.trustedPublicKeys = {
            homologacao: options.homologacaoPublicKey || null,
            producao: options.producaoPublicKey || null
        };

        // URLs oficiais de consulta por canal (nesta etapa: null = NÃO CONFIGURADO)
        this.manifestUrls = {
            homologacao: options.homologacaoManifestUrl || null,
            producao: options.producaoManifestUrl || null
        };

        // Whitelist de origens autorizadas para manifestos e downloads (GitHub Releases, CDN e Pages)
        this.allowedOrigins = options.allowedOrigins || [
            'https://github.com',
            'https://objects.githubusercontent.com',
            'https://raw.githubusercontent.com',
            'https://gelodovale.github.io'
        ];
        this.allowLocalhostForTesting = !!options.allowLocalhostForTesting;
        this.allowLocalFiles = !!options.allowLocalFiles;

        // Estado em memória
        this.lastCheckedAt = null;
        this.cachedAvailableUpdate = null;
        this.lastValidationStatus = {
            status: 'idle', // 'idle' | 'checking' | 'available' | 'up-to-date' | 'downloading' | 'validated' | 'error' | 'not-configured'
            error: null,
            downloadedPath: null
        };
    }

    /**
     * Valida se uma URL pertence às origens HTTPS autorizadas
     */
    isAllowedOrigin(urlStr) {
        try {
            const parsed = new URL(urlStr);
            if (this.allowLocalFiles && parsed.protocol === 'file:') {
                return true;
            }
            if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') {
                return this.allowLocalhostForTesting;
            }
            if (parsed.protocol !== 'https:') return false;

            const hostname = parsed.hostname.toLowerCase();
            const origin = parsed.origin.toLowerCase();

            // 1. Verificação direta na lista
            if (this.allowedOrigins.some(ao => origin === ao.toLowerCase())) {
                return true;
            }

            // 2. Verificação de subdomínios oficiais da infraestrutura do GitHub
            if (hostname === 'github.com' || hostname.endsWith('.github.com')) {
                return true;
            }
            if (hostname === 'githubusercontent.com' || hostname.endsWith('.githubusercontent.com')) {
                return true;
            }
            if (hostname === 'gelodovale.github.io') {
                return true;
            }

            return false;
        } catch (_) {
            return false;
        }
    }

    /**
     * Valida a estrutura formal, semântica e criptográfica de um manifesto
     */
    validateManifest(manifest, activePublicKey) {
        if (!manifest || typeof manifest !== 'object') {
            return { valid: false, error: 'FORMATO_MANIFESTO_INVALIDO' };
        }

        // 1. Campos obrigatórios
        const requiredFields = ['channel', 'latestVersion', 'buildDate', 'minAppVersion', 'releaseNotes', 'packageUrl', 'packageSize', 'sha256', 'signature'];
        for (const f of requiredFields) {
            if (manifest[f] === undefined || manifest[f] === null || manifest[f] === '') {
                return { valid: false, error: `CAMPO_OBRIGATORIO_AUSENTE: ${f}` };
            }
        }

        // 2. Separação Estrita de Canais
        if (manifest.channel !== this.channel) {
            return {
                valid: false,
                error: `CANAL_INCOMPATIVEL: manifesto é '${manifest.channel}', mas o executável é '${this.channel}'`
            };
        }

        // 3. Validação de Tamanho e Formato do Hash
        if (typeof manifest.packageSize !== 'number' || manifest.packageSize <= 0 || manifest.packageSize > MAX_PACKAGE_SIZE) {
            return { valid: false, error: 'TAMANHO_PACOTE_INVALIDO' };
        }
        if (!/^[a-f0-9]{64}$/i.test(manifest.sha256)) {
            return { valid: false, error: 'HASH_SHA256_MALFORMATADO' };
        }

        // 4. Validação da URL do Pacote e Origem
        try {
            if (!this.isAllowedOrigin(manifest.packageUrl)) {
                return { valid: false, error: `ORIGEM_NAO_AUTORIZADA: ${manifest.packageUrl}` };
            }
        } catch (eUrl) {
            return { valid: false, error: 'URL_PACOTE_INVALIDA' };
        }

        // 5. Comparação Semântica de Versão
        const versionCmp = compareSemVer(manifest.latestVersion, this.installedVersion);
        if (versionCmp <= 0) {
            return {
                valid: false,
                isUpToDate: (versionCmp === 0),
                isDowngrade: (versionCmp < 0),
                error: versionCmp === 0 ? 'SISTEMA_JA_ATUALIZADO' : 'DOWNGRADE_REJEITADO'
            };
        }

        // 6. Compatibilidade Mínima de Versão
        if (compareSemVer(this.installedVersion, manifest.minAppVersion) < 0) {
            return {
                valid: false,
                error: `VERSAO_INCOMPATIVEL: versão atual (${this.installedVersion}) é inferior ao requisito mínimo (${manifest.minAppVersion})`
            };
        }

        // 7. Validação da Assinatura Digital Assimétrica (Ed25519)
        if (!activePublicKey) {
            return { valid: false, error: 'CHAVE_PUBLICA_NAO_CONFIGURADA' };
        }
        const signatureValid = verifyEd25519Signature(manifest, activePublicKey);
        if (!signatureValid) {
            return { valid: false, error: 'ASSINATURA_DIGITAL_INVALIDA' };
        }

        return { valid: true };
    }

    /**
     * Consulta o manifesto de atualizações
     */
    async checkUpdate() {
        if (this.lastValidationStatus.status === 'checking') {
            return {
                hasUpdate: false,
                status: 'error',
                error: 'VERIFICACAO_JA_EM_ANDAMENTO',
                message: 'Uma verificação já está em andamento.'
            };
        }

        this.lastCheckedAt = Date.now();
        const manifestUrl = this.manifestUrls[this.channel];

        // Estado seguro se o servidor de publicação ainda não estiver configurado
        if (!manifestUrl) {
            this.lastValidationStatus = {
                status: 'not-configured',
                error: 'Servidor de atualizações não configurado para este canal.',
                downloadedPath: null
            };
            return {
                hasUpdate: false,
                status: 'not-configured',
                currentVersion: this.installedVersion,
                channel: this.channel,
                error: 'Servidor de atualizações não configurado para este canal.'
            };
        }

        this.lastValidationStatus.status = 'checking';
        this.lastValidationStatus.error = null;

        try {
            const rawBody = await this._httpFetchWithTimeout(manifestUrl, DEFAULT_TIMEOUT_MS);
            let manifest = null;
            try {
                manifest = JSON.parse(rawBody);
            } catch (eJson) {
                throw new Error('RESPOSTA_SERVIDOR_NAO_E_JSON');
            }

            const activePubKey = this.trustedPublicKeys[this.channel];
            const validation = this.validateManifest(manifest, activePubKey);

            if (!validation.valid) {
                if (validation.isUpToDate) {
                    this.lastValidationStatus.status = 'up-to-date';
                    this.cachedAvailableUpdate = null;
                    return {
                        hasUpdate: false,
                        status: 'up-to-date',
                        currentVersion: this.installedVersion,
                        channel: this.channel,
                        message: 'O GelControl já está na versão mais recente.'
                    };
                }
                this.lastValidationStatus.status = 'error';
                this.lastValidationStatus.error = validation.error;
                return {
                    hasUpdate: false,
                    status: 'error',
                    currentVersion: this.installedVersion,
                    channel: this.channel,
                    error: validation.error
                };
            }

            // Atualização Válida Encontrada
            this.cachedAvailableUpdate = manifest;
            this.lastValidationStatus.status = 'available';

            return {
                hasUpdate: true,
                status: 'available',
                currentVersion: this.installedVersion,
                availableVersion: manifest.latestVersion,
                buildDate: manifest.buildDate,
                channel: manifest.channel,
                releaseNotes: Array.isArray(manifest.releaseNotes) ? manifest.releaseNotes : [manifest.releaseNotes],
                packageSize: manifest.packageSize,
                sha256: manifest.sha256
            };

        } catch (errNet) {
            // Tratamento quando a release/manifesto ainda não foi publicada no servidor remoto (HTTP 404)
            if (errNet.message.includes('MANIFESTO_NAO_ENCONTRADO_404')) {
                this.lastValidationStatus.status = 'up-to-date';
                const channelName = this.channel === 'producao' ? 'produção' : 'homologação';
                return {
                    hasUpdate: false,
                    status: 'up-to-date',
                    currentVersion: this.installedVersion,
                    channel: this.channel,
                    message: `Nenhuma nova versão oficial publicada no servidor de ${channelName}.`
                };
            }

            this.lastValidationStatus.status = 'error';
            this.lastValidationStatus.error = errNet.message;
            return {
                hasUpdate: false,
                status: 'error',
                currentVersion: this.installedVersion,
                channel: this.channel,
                error: errNet.message
            };
        }
    }

    /**
     * Download seguro do pacote para área temporária isolada
     */
    async downloadUpdate() {
        if (!this.cachedAvailableUpdate) {
            return { success: false, error: 'NENHUMA_ATUALIZACAO_VERIFICADA' };
        }

        const manifest = this.cachedAvailableUpdate;
        this.lastValidationStatus.status = 'downloading';
        this.lastValidationStatus.error = null;

        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }

        const tempFileName = `pkg_${manifest.channel}_v${manifest.latestVersion}_${Date.now()}.tmp`;
        const tempFilePath = path.join(this.tempDir, tempFileName);

        try {
            const downloadResult = await this._downloadToFile({
                url: manifest.packageUrl,
                destPath: tempFilePath,
                expectedSize: manifest.packageSize,
                expectedSha256: manifest.sha256,
                timeoutMs: DEFAULT_TIMEOUT_MS
            });

            this.lastValidationStatus.status = 'validated';
            this.lastValidationStatus.downloadedPath = tempFilePath;

            return {
                success: true,
                status: 'validated',
                version: manifest.latestVersion,
                fileSize: downloadResult.bytesReceived,
                sha256: downloadResult.computedSha256,
                message: 'Pacote baixado e validado com sucesso na área temporária. Pronto para futura aplicação.'
            };

        } catch (errDl) {
            // Em caso de qualquer falha, remove imediatamente o arquivo temporário
            try { if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); } catch (_) { }
            this.lastValidationStatus.status = 'error';
            this.lastValidationStatus.error = errDl.message;
            return {
                success: false,
                status: 'error',
                error: errDl.message
            };
        }
    }

    // ── MÉTODOS AUXILIARES DE REDE E STREAM ────────────────────────────────────

    _httpFetchWithTimeout(targetUrl, timeoutMs, redirectCount = 0) {
        return new Promise((resolve, reject) => {
            let parsed = null;
            try {
                parsed = new URL(targetUrl);
            } catch (e) {
                return reject(new Error('URL_INVALIDA'));
            }

            if (!this.isAllowedOrigin(targetUrl)) {
                return reject(new Error(`ORIGEM_NAO_AUTORIZADA: ${targetUrl}`));
            }

            const client = parsed.protocol === 'https:' ? https : (this.allowLocalhostForTesting ? http : null);
            if (!client) {
                return reject(new Error('PROTOCOLO_INSEGURO: requer HTTPS'));
            }

            const req = client.get(targetUrl, { timeout: timeoutMs, headers: { 'User-Agent': 'GelControl-Updater/85.0' } }, (res) => {
                // Suporte a redirecionamentos HTTPS seguros (ex: GitHub Releases -> CDN)
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    if (redirectCount >= MAX_REDIRECTS) {
                        res.resume();
                        return reject(new Error('EXCESSO_REDIRECIONAMENTOS_MANIFESTO'));
                    }
                    const redirectedUrl = new URL(res.headers.location, targetUrl).href;
                    res.resume();
                    return this._httpFetchWithTimeout(redirectedUrl, timeoutMs, redirectCount + 1)
                        .then(resolve)
                        .catch(reject);
                }

                if (res.statusCode === 404) {
                    res.resume();
                    return reject(new Error('MANIFESTO_NAO_ENCONTRADO_404'));
                }

                if (res.statusCode !== 200) {
                    res.resume();
                    return reject(new Error(`FALHA_HTTP_STATUS_${res.statusCode}`));
                }

                let body = '';
                res.setEncoding('utf8');
                res.on('data', chunk => {
                    body += chunk;
                    if (body.length > 512 * 1024) { // Manifesto não pode exceder 512KB
                        req.destroy();
                        reject(new Error('MANIFESTO_EXCEDE_LIMITE_TAMANHO'));
                    }
                });
                res.on('end', () => resolve(body));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('TIMEOUT_CONEXAO'));
            });

            req.on('error', (err) => reject(new Error(`ERRO_REDE: ${err.message}`)));
        });
    }

    _downloadToFile({ url, destPath, expectedSize, expectedSha256, timeoutMs }) {
        return new Promise((resolve, reject) => {
            let parsed = null;
            try {
                parsed = new URL(url);
            } catch (e) {
                return reject(new Error('URL_INVALIDA'));
            }

            if (!this.isAllowedOrigin(url)) {
                return reject(new Error(`ORIGEM_NAO_AUTORIZADA: ${url}`));
            }

            const client = parsed.protocol === 'https:' ? https : (this.allowLocalhostForTesting ? http : null);
            if (!client) {
                return reject(new Error('PROTOCOLO_INSEGURO'));
            }

            const fileStream = fs.createWriteStream(destPath);
            const hash = crypto.createHash('sha256');
            let bytesReceived = 0;
            let redirectCount = 0;

            const executeGet = (requestUrl) => {
                const req = client.get(requestUrl, { timeout: timeoutMs, headers: { 'User-Agent': 'GelControl-Updater/85.0' } }, (res) => {
                    // Proteção contra múltiplos redirecionamentos
                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        redirectCount++;
                        if (redirectCount > MAX_REDIRECTS) {
                            fileStream.close();
                            return reject(new Error('EXCESSO_REDIRECIONAMENTOS'));
                        }
                        const redirectedUrl = new URL(res.headers.location, requestUrl).href;
                        if (!this.isAllowedOrigin(redirectedUrl)) {
                            fileStream.close();
                            return reject(new Error(`ORIGEM_REDIRECIONAMENTO_NAO_AUTORIZADA: ${redirectedUrl}`));
                        }
                        res.resume();
                        return executeGet(redirectedUrl);
                    }

                    if (res.statusCode !== 200) {
                        res.resume();
                        fileStream.close();
                        return reject(new Error(`FALHA_HTTP_DOWNLOAD_${res.statusCode}`));
                    }

                    res.on('data', (chunk) => {
                        bytesReceived += chunk.length;
                        if (bytesReceived > MAX_PACKAGE_SIZE || bytesReceived > expectedSize) {
                            req.destroy();
                            fileStream.close();
                            return reject(new Error('TAMANHO_EXCEDIDO'));
                        }
                        hash.update(chunk);
                        fileStream.write(chunk);
                    });

                    res.on('end', () => {
                        fileStream.end();
                    });

                    res.on('error', (err) => {
                        fileStream.close();
                        reject(new Error(`ERRO_STREAM_DOWNLOAD: ${err.message}`));
                    });
                });

                req.on('timeout', () => {
                    req.destroy();
                    fileStream.close();
                    reject(new Error('TIMEOUT_DOWNLOAD'));
                });

                req.on('error', (err) => {
                    fileStream.close();
                    reject(new Error(`ERRO_CONEXAO_DOWNLOAD: ${err.message}`));
                });
            };

            fileStream.on('finish', () => {
                // Verificação de tamanho exato
                if (bytesReceived !== expectedSize) {
                    return reject(new Error(`DOWNLOAD_INCOMPLETO: recebidos ${bytesReceived} bytes, esperado ${expectedSize}`));
                }

                // Verificação de hash SHA-256
                const computedSha256 = hash.digest('hex').toLowerCase();
                if (computedSha256 !== String(expectedSha256).toLowerCase().trim()) {
                    return reject(new Error(`HASH_SHA256_DIVERGENTE: esperado ${expectedSha256}, obtido ${computedSha256}`));
                }

                resolve({ bytesReceived, computedSha256 });
            });

            fileStream.on('error', (err) => {
                reject(new Error(`ERRO_GRAVACAO_ARQUIVO: ${err.message}`));
            });

            executeGet(url);
        });
    }
}

module.exports = {
    UpdaterCore,
    compareSemVer,
    getCanonicalManifestBuffer,
    verifyEd25519Signature
};

