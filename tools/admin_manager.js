// ============================================================================
// GELCONTROL v85 — FERRAMENTA ADMINISTRATIVA LOCAL (PC 1)
// Execução Confiável em Node.js com Firebase Admin SDK (100% Gratuito - Plano Spark)
// ============================================================================

const fs = require('fs');
const path = require('path');
const http = require('http');

let admin = null;
try {
    admin = require('firebase-admin');
} catch (e) {
    console.warn('[Aviso] Módulo "firebase-admin" não instalado nesta pasta. Execute: npm install firebase-admin');
}

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, 'service-account.json');
const DEFAULT_PORT = 4411;

/**
 * Inicializa a conexão com o Firebase Admin SDK usando a chave de serviço local do PC 1
 */
function initAdminSDK(customConfig = null) {
    if (!admin) {
        throw new Error('O pacote "firebase-admin" precisa estar instalado para executar a ferramenta administrativa.');
    }

    if (admin.apps && admin.apps.length > 0) {
        return admin.app();
    }

    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        throw new Error(`Arquivo de credencial administrativa não encontrado em: ${SERVICE_ACCOUNT_PATH}\nBaixe o arquivo de chave de serviço no Console do Firebase (Configurações do Projeto -> Contas de Serviço -> Gerar nova chave privada) e salve como: tools/service-account.json`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    const databaseURL = customConfig?.databaseURL || `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`;

    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: databaseURL
    });
}

/**
 * 1. Inicializar e Amarrar o Administrador Root no Realtime Database
 */
async function setupRootAdmin(deviceKey, rootEmail) {
    initAdminSDK();
    console.log(`[Admin] Inicializando Root para fábrica "${deviceKey}" com e-mail: ${rootEmail}...`);

    let userRecord = null;
    try {
        userRecord = await admin.auth().getUserByEmail(rootEmail.toLowerCase().trim());
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            throw new Error(`O e-mail "${rootEmail}" ainda não foi criado no Firebase Authentication. Crie a conta do proprietário no console primeiro.`);
        }
        throw err;
    }

    const rootUid = userRecord.uid;
    const db = admin.database();

    // Gravar rootUid imutável no Realtime Database da fábrica
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
 * 2. Criar Conta de Funcionário no Firebase Authentication e no Banco
 */
async function createEmployee(deviceKey, email, password, name, permissions = {}) {
    initAdminSDK();
    console.log(`[Admin] Provisionando colaborador "${name}" (${email}) para fábrica "${deviceKey}"...`);

    const userRecord = await admin.auth().createUser({
        email: email.toLowerCase().trim(),
        password: password,
        displayName: name.trim(),
        emailVerified: false
    });

    const newUid = userRecord.uid;

    // Atribuir claim restrito de colaborador
    await admin.auth().setCustomUserClaims(newUid, {
        admin: false,
        role: 'employee',
        factoryKey: deviceKey
    });

    // Registrar no RTDB sob a chave do UID oficial
    // Sem gravar nenhuma senha ou hash no banco!
    await admin.database().ref(`factories/${deviceKey}/users/${newUid}`).set({
        id: newUid,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: 'employee',
        active: true,
        permissions: permissions,
        createdAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP
    });

    console.log(`✅ [Sucesso] Colaborador criado e vinculado no servidor: UID ${newUid}`);
    return { success: true, uid: newUid };
}

/**
 * 3. Revogar Acesso de Funcionário Imediatamente
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
 * 4. Iniciar Serviço Local HTTP (Bridge Local para a USU-02 no PC 1)
 */
function startLocalService(port = DEFAULT_PORT) {
    try {
        initAdminSDK();
    } catch (e) {
        console.error('❌ Falha ao inicializar Admin SDK local:', e.message);
        process.exit(1);
    }

    const server = http.createServer(async (req, res) => {
        // Habilitar CORS estritamente para o localhost e aplicação local do GelControl
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
            res.end(JSON.stringify({ status: 'online', service: 'GelControl Admin Local Service v85 (Spark Plan)' }));
            return;
        }

        // Endpoint para Criar Funcionário a partir da USU-02
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
        console.log(` A janela USU-02 no PC 1 pode provisionar contas diretamente.`);
        console.log(` Nenhuma chave secreta foi enviada para o navegador ou GitHub.`);
        console.log(`================================================================\n`);
    });
}

// Interface de Linha de Comando (CLI)
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === 'help') {
        console.log(`
Uso do Gerenciador Administrativo Local (GelControl v85):
  node tools/admin_manager.js start-service                  Inicia a bridge local para a USU-02
  node tools/admin_manager.js setup-root <deviceKey> <email> Amarração única do Root no Realtime Database
  node tools/admin_manager.js create <deviceKey> <email> <pwd> <nome>
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
            console.error('Informe o e-mail oficial do Root: node tools/admin_manager.js setup-root <deviceKey> <email>');
            process.exit(1);
        }
        setupRootAdmin(deviceKey, rootEmail).catch(e => { console.error('Erro:', e.message); process.exit(1); });
    } else if (command === 'create') {
        const deviceKey = args[1];
        const email = args[2];
        const pwd = args[3];
        const name = args[4];
        if (!deviceKey || !email || !pwd || !name) {
            console.error('Parâmetros: node tools/admin_manager.js create <deviceKey> <email> <pwd> <nome>');
            process.exit(1);
        }
        createEmployee(deviceKey, email, pwd, name).catch(e => { console.error('Erro:', e.message); process.exit(1); });
    } else if (command === 'revoke') {
        const deviceKey = args[1];
        const uid = args[2];
        if (!deviceKey || !uid) {
            console.error('Parâmetros: node tools/admin_manager.js revoke <deviceKey> <uid>');
            process.exit(1);
        }
        revokeEmployee(deviceKey, uid).catch(e => { console.error('Erro:', e.message); process.exit(1); });
    } else {
        console.error('Comando desconhecido. Execute "node tools/admin_manager.js help"');
    }
}

module.exports = {
    setupRootAdmin,
    createEmployee,
    revokeEmployee,
    startLocalService
};
