// ============================================================================
// GELCONTROL — VALIDADOR INDEPENDENTE DE AUTORIZAÇÃO ADMINISTRATIVA
// Executado exclusivamente no processo principal (Main Process) do Electron
// Não confia em flags do renderer, variáveis de janela, localStorage ou IPC manipulável
// Validação criptográfica de Firebase Auth ID Token com certificados oficiais do Google (RS256)
// ============================================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const https = require('https');

// URL oficial dos certificados x509 públicos do Google para o Firebase Auth
const GOOGLE_FIREBASE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

// Cache em memória de certificados públicos do Google com expiração (TTL)
let cachedGoogleCerts = null;
let certsCacheExpiresAt = 0;

/**
 * Obtém os certificados públicos oficiais do Google para verificação de assinaturas RS256
 */
async function fetchGooglePublicCertificates(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedGoogleCerts && now < certsCacheExpiresAt) {
        return cachedGoogleCerts;
    }

    return new Promise((resolve, reject) => {
        const req = https.get(GOOGLE_FIREBASE_CERTS_URL, { timeout: 10000 }, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`GOOGLE_CERTS_HTTP_ERROR_${res.statusCode}`));
            }

            // Lê cabeçalho de cache (max-age) do Google se disponível
            let maxAgeSec = 14400; // 4 horas padrão
            const cacheControl = res.headers['cache-control'];
            if (cacheControl) {
                const match = cacheControl.match(/max-age=(\d+)/i);
                if (match) maxAgeSec = parseInt(match[1], 10);
            }

            let rawData = '';
            res.on('data', chunk => rawData += chunk);
            res.on('end', () => {
                try {
                    const certs = JSON.parse(rawData);
                    if (!certs || typeof certs !== 'object' || Object.keys(certs).length === 0) {
                        return reject(new Error('GOOGLE_CERTS_INVALIDOS: Resposta vazia ou malformatada.'));
                    }
                    cachedGoogleCerts = certs;
                    certsCacheExpiresAt = now + (maxAgeSec * 1000);
                    resolve(certs);
                } catch (eParse) {
                    reject(new Error(`FALHA_PARSE_GOOGLE_CERTS: ${eParse.message}`));
                }
            });
        });

        req.on('error', (err) => reject(new Error(`ERRO_REDE_GOOGLE_CERTS: ${err.message}`)));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('TIMEOUT_CONEXAO_GOOGLE_CERTS'));
        });
    });
}

/**
 * Função criptográfica segura de conferência de senha com Salt e multi-iterações
 */
function verifySaltedPassword(password, storedPassword) {
    if (!storedPassword || typeof storedPassword !== 'string' || !password || typeof password !== 'string') {
        return false;
    }

    if (storedPassword.startsWith('salted:')) {
        const parts = storedPassword.split(':');
        if (parts.length === 4) {
            const iterations = parseInt(parts[1], 10) || 1000;
            const salt = parts[2];
            const expectedHash = parts[3];

            let computed = crypto.createHash('sha256').update(salt + ':' + password).digest('hex');
            for (let i = 1; i < iterations; i++) {
                computed = crypto.createHash('sha256').update(computed + ':' + salt).digest('hex');
            }
            return computed === expectedHash;
        }
    }

    // Formato legado SHA-256 simples
    if (/^[a-f0-9]{64}$/i.test(storedPassword)) {
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        return hash.toLowerCase() === storedPassword.toLowerCase();
    }

    return false;
}

/**
 * Validação independente, rigorosa e criptográfica de autorização administrativa
 * 
 * @param {Object} authPayload Dados de autenticação enviados para comprovação
 * @param {Object} options Configurações de canal, certificados, e opções de teste
 * @returns {Promise<{ authorized: boolean, reason?: string, method?: string, email?: string }>}
 */
async function verifyIndependentAdminAuthorization(authPayload, options = {}) {
    if (!authPayload || typeof authPayload !== 'object') {
        return {
            authorized: false,
            reason: 'CREDENCIAL_AUSENTE: Nenhum dado de autenticação foi fornecido.'
        };
    }

    const channel = options.channel || 'homologacao';
    const expectedProject = (channel === 'producao') ? 'gelo-do-vale' : 'gelcontrol-homologacao';
    const expectedAdminEmail = (channel === 'producao') ? 
        'contato@gelodovale.com.br' : 'admin_homologacao@gelcontrol.internal';

    // ── 1. BLOQUEIO ESTRITO DE FORJAMENTO DECLARATIVO ─────────────────────────
    // Se o operador enviar apenas flags declarativas de privilégio sem comprovação criptográfica
    const isOnlyDeclarative = (authPayload.isRoot !== undefined || authPayload.username !== undefined || authPayload.isAdmin !== undefined || authPayload.role !== undefined) &&
                              !authPayload.idToken && !authPayload.adminConfirmationPassword;
    if (isOnlyDeclarative) {
        return {
            authorized: false,
            reason: 'FORJAMENTO_DECLARATIVO_REJEITADO: Parâmetros declarativos (isRoot/username/isAdmin/role) não constituem comprovação de privilégio.'
        };
    }

    // ── 2. VALIDAÇÃO CRIPTOGRÁFICA DE ID TOKEN DO FIREBASE AUTH (RS256) ──────
    if (authPayload.idToken && typeof authPayload.idToken === 'string') {
        try {
            const tokenParts = authPayload.idToken.split('.');
            if (tokenParts.length !== 3) {
                return {
                    authorized: false,
                    reason: 'TOKEN_JWT_MALFORMATADO: O token fornecido não possui 3 partes válidas de JWT.'
                };
            }

            // 2.1 Decodifica Header e Payload
            let header = null;
            let payload = null;
            try {
                header = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString('utf8'));
                payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString('utf8'));
            } catch (eParse) {
                return {
                    authorized: false,
                    reason: 'TOKEN_JWT_CORROMPIDO: Falha ao decodificar partes Base64URL.'
                };
            }

            // 2.2 Validação do Algoritmo e Identificador de Chave (kid)
            if (!header || header.alg !== 'RS256') {
                return {
                    authorized: false,
                    reason: 'ALGORITMO_TOKEN_INVALIDO: O token não foi assinado com o algoritmo esperado (RS256).'
                };
            }

            if (!header.kid || typeof header.kid !== 'string') {
                return {
                    authorized: false,
                    reason: 'TOKEN_SEM_KID: O cabeçalho do token não especifica o identificador da chave pública (kid).'
                };
            }

            // 2.3 Obtenção do Certificado Público Oficial Confiável do Google
            let publicCert = null;
            if (options.customPublicCertificates && options.customPublicCertificates[header.kid]) {
                // Suporte isolado para testes unitários controlados com par de chaves RSA gerado localmente
                publicCert = options.customPublicCertificates[header.kid];
            } else {
                try {
                    const googleCerts = await fetchGooglePublicCertificates(false);
                    publicCert = googleCerts[header.kid] || null;
                } catch (eCerts) {
                    return {
                        authorized: false,
                        reason: `FALHA_CHAVES_GOOGLE: Não foi possível obter os certificados públicos oficiais do Google: ${eCerts.message}`
                    };
                }
            }

            if (!publicCert) {
                return {
                    authorized: false,
                    reason: `CHAVE_GOOGLE_NAO_ENCONTRADA: O identificador de chave '${header.kid}' não consta entre as chaves oficiais confiáveis do Google/Firebase.`
                };
            }

            // 2.4 VALIDAÇÃO CRIPTOGRÁFICA DA ASSINATURA RS256 COM A CHAVE PÚBLICA
            const signingInput = `${tokenParts[0]}.${tokenParts[1]}`;
            const signatureBuffer = Buffer.from(tokenParts[2], 'base64url');

            const verifier = crypto.createVerify('RSA-SHA256');
            verifier.update(signingInput);
            const isSignatureValid = verifier.verify(publicCert, signatureBuffer);

            if (!isSignatureValid) {
                return {
                    authorized: false,
                    reason: 'ASSINATURA_CRIPTOGRAFICA_INVALIDA: A assinatura digital RS256 do token não confere com o certificado oficial do Google. Token forjado ou adulterado.'
                };
            }

            // 2.5 Validação de Audiência (aud) e Emissor (iss)
            const expectedIssuer = `https://securetoken.google.com/${expectedProject}`;
            if (payload.aud !== expectedProject) {
                return {
                    authorized: false,
                    reason: `AUDIENCIA_TOKEN_INCOMPATIVEL: Token emitido para '${payload.aud}', esperado '${expectedProject}'.`
                };
            }
            if (!payload.iss || payload.iss !== expectedIssuer) {
                return {
                    authorized: false,
                    reason: `EMISSOR_TOKEN_INVALIDO: Emissor '${payload.iss}' não confere com o projeto autorizado '${expectedIssuer}'.`
                };
            }

            // 2.6 Validação de Expiração (exp) e Emissão (auth_time / iat)
            const nowSec = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < nowSec) {
                return {
                    authorized: false,
                    reason: 'TOKEN_EXPIRADO: A sessão de autenticação administrativa expirou.'
                };
            }
            if (payload.iat && payload.iat > (nowSec + 300)) {
                return {
                    authorized: false,
                    reason: 'TOKEN_EMISSAO_FUTURA: O token possui data de emissão no futuro.'
                };
            }

            // 2.7 Validação da Identidade Administrativa Oficial
            if (!payload.email || payload.email.toLowerCase() !== expectedAdminEmail.toLowerCase()) {
                return {
                    authorized: false,
                    reason: `EMAIL_NAO_ADMINISTRATIVO: O usuário autenticado (${payload.email || 'desconhecido'}) não é o Administrador oficial autorizado.`
                };
            }

            // Aprovação Criptográfica Plena
            return {
                authorized: true,
                method: 'firebase_auth_jwt_rs256_verified',
                email: payload.email,
                kid: header.kid
            };

        } catch (eJwt) {
            return {
                authorized: false,
                reason: `ERRO_VALIDACAO_JWT: ${eJwt.message}`
            };
        }
    }

    // ── 3. AUDITORIA DA AUTENTICAÇÃO ADMINISTRATIVA OFFLINE (ITEM 2) ──────────
    // Se o operador fornecer senha administrativa local em vez de token criptográfico:
    if (authPayload.adminConfirmationPassword && typeof authPayload.adminConfirmationPassword === 'string') {
        // DIRETRIZ DE SEGURANÇA OBRIGATÓRIA:
        // Arquivos locais no cliente (browser_storage/JSON) podem ser modificados por operadores com acesso ao disco.
        // Portanto, a senha local NÃO constitui uma fronteira confiável para instalação de executáveis do sistema.
        // A instalação de atualizações é ESTRITAMENTE BLOQUEADA se não houver autenticação online confiável.
        if (!options.allowOfflineUpdateAuthorization) {
            return {
                authorized: false,
                reason: 'AUTORIZACAO_OFFLINE_BLOQUEADA: A aplicação de atualizações do programa exige comprovação criptográfica online do Administrador via Firebase/Google (RS256). A autorização por senha local offline foi desabilitada para prevenir forjamento por adulteração de arquivos em disco.'
            };
        }

        // Caso expressamente autorizado para testes unitários com banco de senhas em memória:
        const dataDir = options.dataDir || path.join(process.cwd(), 'Dados');
        const storageDir = path.join(dataDir, 'browser_storage');
        let storedHash = options.storedAdminPasswordHash || null;

        if (!storedHash) {
            const candidateFiles = [
                path.join(storageDir, 'gelcontrol_comercial_state.json'),
                path.join(dataDir, 'admin_credential_guard.json')
            ];
            for (const cf of candidateFiles) {
                if (fs.existsSync(cf)) {
                    try {
                        const parsed = JSON.parse(fs.readFileSync(cf, 'utf8'));
                        if (parsed.adminPassword) {
                            storedHash = parsed.adminPassword;
                            break;
                        }
                    } catch (_) {}
                }
            }
        }

        if (storedHash) {
            const matches = verifySaltedPassword(authPayload.adminConfirmationPassword, storedHash);
            if (matches) {
                return {
                    authorized: true,
                    method: 'local_salted_password_verified',
                    username: 'admin'
                };
            } else {
                return {
                    authorized: false,
                    reason: 'SENHA_ADMINISTRATIVA_INCORRETA: A senha informada não confere com a credencial administrativa do sistema.'
                };
            }
        } else {
            return {
                authorized: false,
                reason: 'CREDENCIAL_LOCAL_NAO_ENCONTRADA: Nenhuma credencial administrativa local configurada para conferência.'
            };
        }
    }

    // ── 4. BLOQUEIO PADRÃO (FAIL-CLOSED) ─────────────────────────────────────
    return {
        authorized: false,
        reason: 'ACESSO_NEGADO: A identidade e a autorização administrativa não puderam ser comprovadas de forma independente.'
    };
}

module.exports = {
    verifyIndependentAdminAuthorization,
    verifySaltedPassword,
    fetchGooglePublicCertificates
};
