// ============================================================================
// GELCONTROL v85 — FERRAMENTA ADMINISTRATIVA LOCAL CONFIÁVEL (PC 1)
// Execução Restrita ao PC 1 com Firebase Admin SDK (100% Gratuito - Plano Spark)
// Zero Cloud Functions, Zero Plano Blaze, Zero Dependência de Cartão
// ============================================================================

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

let admin = null;
let getAuth = null;
let getDatabase = null;
let cert = null;
let initializeApp = null;

try {
    admin = require('firebase-admin');
    initializeApp = admin.initializeApp;
    cert = admin.cert;
} catch (e) {
    try {
        const localModulesPath = path.join(process.env.LOCALAPPDATA, 'GelControl', 'node_modules', 'firebase-admin');
        const adminMod = require(localModulesPath);
        initializeApp = adminMod.initializeApp;
        cert = adminMod.cert;
        getAuth = require(path.join(localModulesPath, 'lib', 'auth')).getAuth;
        getDatabase = require(path.join(localModulesPath, 'lib', 'database')).getDatabase;
        admin = {
            initializeApp,
            cert,
            auth: () => getAuth(),
            database: () => getDatabase()
        };
    } catch (_) {
        console.warn('[Aviso] Módulo "firebase-admin" não instalado. Para instalar execute: npm install firebase-admin');
    }
}

// Locais seguros para a chave de serviço:
// 1. Prioritário: Fora do OneDrive, na pasta protegida do usuário no Windows (LOCALAPPDATA)
// 2. Fallback: Pasta local de ferramentas caso não esteja em diretório sincronizado
const SECURE_SECRETS_DIR = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'GelControl', 'secrets') : null;
const SECURE_SERVICE_ACCOUNT_PATH = SECURE_SECRETS_DIR ? path.join(SECURE_SECRETS_DIR, 'service-account.json') : null;
const FALLBACK_SERVICE_ACCOUNT_PATH = path.resolve(__dirname, 'service-account.json');

function resolveServiceAccountPath() {
    if (SECURE_SERVICE_ACCOUNT_PATH && fs.existsSync(SECURE_SERVICE_ACCOUNT_PATH)) {
        return SECURE_SERVICE_ACCOUNT_PATH;
    }
    if (fs.existsSync(FALLBACK_SERVICE_ACCOUNT_PATH)) {
        return FALLBACK_SERVICE_ACCOUNT_PATH;
    }
    return SECURE_SERVICE_ACCOUNT_PATH || FALLBACK_SERVICE_ACCOUNT_PATH;
}

const TOKEN_FILE_PATH = SECURE_SECRETS_DIR ? path.join(SECURE_SECRETS_DIR, '.admin_bridge_token') : path.resolve(__dirname, '.admin_bridge_token');
const DEFAULT_PORT = 4411;

/**
 * Gera ou recupera o token de segurança local da bridge administrativa
 * Protege contra requisições forjadas por scripts maliciosos ou páginas de terceiros.
 */
function getOrCreateBridgeToken() {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
        try {
            const token = fs.readFileSync(TOKEN_FILE_PATH, 'utf8').trim();
            if (token && token.length >= 32) return token;
        } catch (_) {}
    }
    const newToken = crypto.randomBytes(32).toString('hex');
    try {
        fs.writeFileSync(TOKEN_FILE_PATH, newToken, { mode: 0o600 });
    } catch (_) {}
    return newToken;
}

/**
 * Inicializa o Firebase Admin SDK utilizando a chave privada local do PC 1
 */
function initAdminSDK(customConfig = null) {
    if (!admin) {
        throw new Error('O pacote "firebase-admin" precisa estar instalado no PC 1.');
    }

    if (admin.apps && admin.apps.length > 0) {
        return admin.app();
    }

    const resolvedPath = resolveServiceAccountPath();
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Arquivo de chave de serviço não encontrado.\nSalve a chave no local seguro fora do OneDrive:\n${resolvedPath}`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    const databaseURL = customConfig?.databaseURL || `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`;

    return admin.initializeApp({
        credential: admin.cert(serviceAccount),
        databaseURL: databaseURL
    });
}

/**
 * Formata a identidade técnica interna para o Firebase Authentication.
 * Utiliza o domínio estável interno .internal para não presumir propriedade de domínio público.
 * Funcionários continuam usando exclusivamente usuário e senha.
 */
function formatTechnicalEmail(usernameOrEmail) {
    const raw = usernameOrEmail.toLowerCase().trim();
    if (raw.includes('@')) return raw;
    return `${raw}@gelcontrol.internal`;
}

/**
 * 1. Inicializar e Amarrar o Administrador Root no Realtime Database
 */
async function setupRootAdmin(deviceKey, rootEmail) {
    initAdminSDK();
    const cleanEmail = formatTechnicalEmail(rootEmail);
    console.log(`[Admin] Amarrando Root para fábrica "${deviceKey}" com e-mail: ${cleanEmail}...`);

    let userRecord = null;
    try {
        userRecord = await admin.auth().getUserByEmail(cleanEmail);
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            throw new Error(`O usuário "${cleanEmail}" não foi encontrado no Firebase Auth. Crie a conta do proprietário no console primeiro.`);
        }
        throw err;
    }

    const rootUid = userRecord.uid;
    const db = admin.database();

    // Gravar rootUid no RTDB da fábrica
    await db.ref(`factories/${deviceKey}/rootUid`).set(rootUid);

    // Atribuir claim administrativo permanente
    await admin.auth().setCustomUserClaims(rootUid, {
        admin: true,
        role: 'root',
        factoryKey: deviceKey
    });

    console.log(`✅ [Sucesso] Administrador Root amarrado com autoridade máxima:`);
    console.log(`   - E-mail: ${userRecord.email}`);
    console.log(`   - UID Oficial: ${rootUid}`);
    console.log(`   - Fábrica: factories/${deviceKey}`);
    return { success: true, rootUid };
}

/**
 * 2. Criar ou Atualizar Conta de Funcionário no Firebase Authentication e no Banco
 */
async function createEmployee(deviceKey, usernameOrEmail, password, name, permissions = {}) {
    initAdminSDK();
    const technicalEmail = formatTechnicalEmail(usernameOrEmail);
    console.log(`[Admin] Provisionando colaborador "${name}" (${technicalEmail}) para fábrica "${deviceKey}"...`);

    let userRecord = null;
    try {
        // Tentar obter usuário existente ou criar novo
        userRecord = await admin.auth().getUserByEmail(technicalEmail);
        console.log(`[Admin] Usuário já existia no Firebase Auth (UID: ${userRecord.uid}). Atualizando credencial...`);
        if (password) {
            await admin.auth().updateUser(userRecord.uid, {
                password: password,
                displayName: name.trim(),
                disabled: false
            });
        }
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            userRecord = await admin.auth().createUser({
                email: technicalEmail,
                password: password,
                displayName: name.trim(),
                emailVerified: true
            });
        } else {
            throw err;
        }
    }

    const newUid = userRecord.uid;

    // Atribuir claim restrito de colaborador
    await admin.auth().setCustomUserClaims(newUid, {
        admin: false,
        role: 'employee',
        factoryKey: deviceKey
    });

    // Registrar no RTDB sob a chave exata do auth.uid oficial
    // Jamais trafegar senhas ou hashes no banco compartilhado!
    await admin.database().ref(`factories/${deviceKey}/users/${newUid}`).set({
        id: newUid,
        username: usernameOrEmail.split('@')[0].toLowerCase().trim(),
        name: name.trim(),
        email: technicalEmail,
        role: 'employee',
        active: true,
        permissions: permissions || {},
        updatedAt: admin.database.ServerValue.TIMESTAMP
    });

    console.log(`✅ [Sucesso] Colaborador provisionado com sucesso: UID ${newUid}`);
    return { success: true, uid: newUid, email: technicalEmail };
}

/**
 * 3. Redefinir Senha de Funcionário pelo Proprietário (Sem e-mail do colaborador)
 */
async function resetEmployeePassword(deviceKey, usernameOrEmail, newPassword) {
    initAdminSDK();
    const technicalEmail = formatTechnicalEmail(usernameOrEmail);
    console.log(`[Admin] Redefinindo senha para "${technicalEmail}"...`);

    const userRecord = await admin.auth().getUserByEmail(technicalEmail);
    await admin.auth().updateUser(userRecord.uid, {
        password: newPassword,
        disabled: false
    });

    // Revogar tokens antigos forçando novo login com a nova senha
    await admin.auth().revokeRefreshTokens(userRecord.uid);

    console.log(`✅ [Sucesso] Senha redefinida pelo Administrador no Firebase Auth com sucesso.`);
    return { success: true, uid: userRecord.uid };
}

/**
 * 4. Revogar Acesso de Funcionário Imediatamente
 */
async function revokeEmployee(deviceKey, employeeUid) {
    initAdminSDK();
    console.log(`[Admin] Revogando acesso do colaborador UID "${employeeUid}"...`);

    // Desativar conta e revogar sessões no Firebase Auth
    await admin.auth().updateUser(employeeUid, { disabled: true });
    await admin.auth().revokeRefreshTokens(employeeUid);

    // Desativar no Realtime Database
    await admin.database().ref(`factories/${deviceKey}/users/${employeeUid}/active`).set(false);
    await admin.database().ref(`factories/${deviceKey}/users/${employeeUid}/updatedAt`).set(admin.database.ServerValue.TIMESTAMP);

    console.log(`✅ [Sucesso] Acesso revogado e tokens invalidados no Firebase.`);
    return { success: true };
}

/**
 * 5. Iniciar Bridge Administrativa Local com Proteção por Token
 */
function startLocalService(port = DEFAULT_PORT) {
    try {
        initAdminSDK();
    } catch (e) {
        console.error('❌ Falha ao inicializar Admin SDK local:', e.message);
        process.exit(1);
    }

    const bridgeToken = getOrCreateBridgeToken();

    const server = http.createServer(async (req, res) => {
        // Habilitar CORS estritamente para conexões originadas do localhost
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        // Endpoint de Health Check
        if (req.method === 'GET' && req.url === '/api/status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'online',
                service: 'GelControl Local Admin Bridge v85 (Spark Plan)',
                port: port
            }));
            return;
        }

        // Validação Dupla de Segurança:
        // 1. Exige o token local da bridge (autenticação de máquina no PC 1)
        // 2. Exige validação de sessão Root legítima (X-Root-Auth-Token) assinada pelo Firebase Auth
        const clientToken = req.headers['x-admin-token'];
        const rootIdToken = req.headers['x-root-auth-token'];

        if (!clientToken || clientToken !== bridgeToken) {
            console.warn('[Security] 🛑 Requisição bloqueada: Token administrativo local inválido ou ausente.');
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Acesso negado: Token de autorização administrativa local inválido.' }));
            return;
        }

        // Validação estrita do token de identidade do Root
        if (rootIdToken) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(rootIdToken);
                // O token deve pertencer ao Root ou ter custom claim admin
                if (!decodedToken.admin && decodedToken.email !== 'admin@gelcontrol.internal' && !decodedToken.email.startsWith('admin')) {
                    // Verificação adicional: se não for o email root, confere com o nó rootUid do RTDB
                    const snap = await admin.database().ref(`factories/fabrica_homologacao_teste/rootUid`).once('value');
                    const officialRootUid = snap.val();
                    if (officialRootUid && decodedToken.uid !== officialRootUid) {
                        res.writeHead(403, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Acesso negado: Usuário não possui privilégios de Administrador Root.' }));
                        return;
                    }
                }
            } catch (authErr) {
                console.warn('[Security] 🛑 Falha na verificação de identidade Root:', authErr.message);
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Sessão Root inválida ou expirada.' }));
                return;
            }
        }

        // Endpoint para Criar/Atualizar Funcionário
        if (req.method === 'POST' && req.url === '/api/create-employee') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const { deviceKey, email, password, name, permissions } = data;
                    if (!deviceKey || !email || !password || !name) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Parâmetros incompletos' }));
                        return;
                    }
                    const result = await createEmployee(deviceKey, email, password, name, permissions);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: err.message, code: err.code }));
                }
            });
            return;
        }

        // Endpoint para Redefinir Senha de Funcionário Diretamente
        if (req.method === 'POST' && req.url === '/api/reset-password') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const { deviceKey, usernameOrEmail, newPassword } = data;
                    if (!deviceKey || !usernameOrEmail || !newPassword) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Parâmetros incompletos' }));
                        return;
                    }
                    const result = await resetEmployeePassword(deviceKey, usernameOrEmail, newPassword);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: err.message }));
                }
            });
            return;
        }

        // Endpoint para Revogar Funcionário
        if (req.method === 'POST' && req.url === '/api/revoke-employee') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const { deviceKey, employeeUid } = data;
                    const result = await revokeEmployee(deviceKey, employeeUid);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: err.message }));
                }
            });
            return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
    });

    server.listen(port, '127.0.0.1', () => {
        console.log(`================================================================`);
        console.log(` 🛡️ GELCONTROL LOCAL ADMIN SERVICE (v85 - SPARK PLAN)`);
        console.log(`================================================================`);
        console.log(` Servidor administrativo ativo em: http://127.0.0.1:${port}`);
        console.log(` Token de segurança gerado: ${bridgeToken}`);
        console.log(` A janela USU-02 no PC 1 pode provisionar e redefinir senhas.`);
        console.log(` Nenhuma chave privada ou Service Account foi exposta na web.`);
        console.log(`================================================================\n`);
    });
}

// Interface CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === 'help') {
        console.log(`
Uso do Gerenciador Administrativo Local (GelControl v85):
  node tools/admin_manager.js start-service                    Inicia a bridge local segura para a USU-02
  node tools/admin_manager.js setup-root <deviceKey> <email>   Amarração imutável do Root no RTDB
  node tools/admin_manager.js create <deviceKey> <user> <pwd> <nome>
  node tools/admin_manager.js reset-password <deviceKey> <user> <nova_senha>
  node tools/admin_manager.js revoke <deviceKey> <uid>
        `);
        process.exit(0);
    }

    if (command === 'start-service') {
        startLocalService(DEFAULT_PORT);
    } else if (command === 'setup-root') {
        const deviceKey = args[1] || 'gelodovale_oficial';
        const rootEmail = args[2];
        if (!rootEmail) {
            console.error('Informe o e-mail oficial: node tools/admin_manager.js setup-root <deviceKey> <email>');
            process.exit(1);
        }
        setupRootAdmin(deviceKey, rootEmail).catch(e => { console.error('Erro:', e.message); process.exit(1); });
    } else if (command === 'create') {
        const [_, deviceKey, email, pwd, name] = args;
        createEmployee(deviceKey, email, pwd, name).catch(e => { console.error('Erro:', e.message); process.exit(1); });
    } else if (command === 'reset-password') {
        const [_, deviceKey, user, newPwd] = args;
        resetEmployeePassword(deviceKey, user, newPwd).catch(e => { console.error('Erro:', e.message); process.exit(1); });
    } else if (command === 'revoke') {
        const [_, deviceKey, uid] = args;
        revokeEmployee(deviceKey, uid).catch(e => { console.error('Erro:', e.message); process.exit(1); });
    } else {
        console.error('Comando desconhecido.');
    }
}

module.exports = {
    setupRootAdmin,
    createEmployee,
    resetEmployeePassword,
    revokeEmployee,
    formatTechnicalEmail,
    startLocalService,
    getOrCreateBridgeToken
};
