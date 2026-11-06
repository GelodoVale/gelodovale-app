// ============================================================================
// GELCONTROL v85 — BACKEND CONFIÁVEL DE AUTENTICAÇÃO E PROVISIONAMENTO
// Funções Administrativas Protegidas via Firebase Admin SDK
// ============================================================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Validador de Autorização Root no Servidor
 * Comprova categoricamente que o solicitante é o Administrador Root legítimo da fábrica.
 * NUNCA confia em parâmetros fornecidos pelo cliente/navegador.
 */
async function verifyIsRootAdmin(auth, deviceKey) {
    if (!auth || !auth.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Acesso negado: operação requer autenticação com o servidor.');
    }

    const callerUid = auth.uid;

    // Se o token contiver flag explícita de employee, rejeitar sumariamente
    if (auth.token && auth.token.role === 'employee') {
        console.warn(`[Security Alert] 🚨 Colaborador (${callerUid}) tentou executar função restrita de Administrador Root.`);
        throw new functions.https.HttpsError('permission-denied', 'Acesso negado: colaboradores não possuem privilégios administrativos.');
    }

    // 1. Verificação por Custom Claims (Assinatura JWT oficial do Firebase Auth)
    if (auth.token && auth.token.admin === true && auth.token.role === 'root') {
        return true;
    }

    // 2. Verificação no Realtime Database oficial da fábrica
    const rootSnapshot = await admin.database()
        .ref(`factories/${deviceKey}/rootUid`)
        .once('value');
    
    const officialRootUid = rootSnapshot.val();
    if (!officialRootUid) {
        throw new functions.https.HttpsError('failed-precondition', 'Fábrica não possui Administrador Root oficial inicializado.');
    }

    if (callerUid !== officialRootUid) {
        console.warn(`[Security Alert] 🚨 Tentativa de usurpação Root: UID ${callerUid} tentou operar sobre fábrica com Root ${officialRootUid}.`);
        throw new functions.https.HttpsError('permission-denied', 'Acesso negado: apenas o Administrador Root tem autoridade para esta operação.');
    }

    return true;
}

/**
 * 1. Inicialização e Amarração da Identidade Root (Callable)
 * Amarração única e imutável da identidade do Root no RTDB.
 * NÃO PERMITE que qualquer usuário reivindique a fábrica: exige que o e-mail coincida
 * com o e-mail oficial configurado no backend (AUTHORIZED_ROOT_EMAIL) ou bootstrap key.
 */
exports.initializeFactoryRoot = functions.https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.uid || !context.auth.token || !context.auth.token.email) {
        throw new functions.https.HttpsError('unauthenticated', 'Requer login prévio no Firebase Auth com a conta do proprietário.');
    }

    const { deviceKey, bootstrapSecret } = data;
    if (!deviceKey) {
        throw new functions.https.HttpsError('invalid-argument', 'Chave de fábrica ausente.');
    }

    const callerUid = context.auth.uid;
    const callerEmail = context.auth.token.email.toLowerCase().trim();

    // Obter e-mail oficial autorizado configurado no ambiente das Cloud Functions
    const authorizedEmail = (process.env.AUTHORIZED_ROOT_EMAIL || 
        (functions.config().security && functions.config().security.root_email) || 
        '').toLowerCase().trim();
    
    const serverBootstrapSecret = process.env.BOOTSTRAP_SECRET || 
        (functions.config().security && functions.config().security.bootstrap_secret) || '';

    // Validação de elegibilidade Root no servidor
    const isAuthorizedByEmail = authorizedEmail && (callerEmail === authorizedEmail);
    const isAuthorizedBySecret = serverBootstrapSecret && (bootstrapSecret === serverBootstrapSecret);

    if (!isAuthorizedByEmail && !isAuthorizedBySecret) {
        console.warn(`[Security Alert] 🛑 Usuário ${callerEmail} (${callerUid}) tentou inicializar Root sem autorização.`);
        throw new functions.https.HttpsError('permission-denied', 'Este e-mail não possui autorização administrativa para ser o Administrador Root desta fábrica.');
    }

    const rootRef = admin.database().ref(`factories/${deviceKey}/rootUid`);
    const currentRootSnap = await rootRef.once('value');
    const existingRootUid = currentRootSnap.val();

    // Se a fábrica já possui um Root estabelecido diferente: PROIBIDO SOBRESCREVER
    if (existingRootUid && existingRootUid !== callerUid) {
        throw new functions.https.HttpsError('already-exists', 'Esta fábrica já possui Administrador Root oficial cadastrado. A identidade Root é permanente e imutável.');
    }

    // Gravar rootUid imutável no RTDB
    await rootRef.set(callerUid);

    // Conceder Custom Claim permanente { admin: true, role: 'root' } emitido pelo Google
    await admin.auth().setCustomUserClaims(callerUid, {
        admin: true,
        role: 'root',
        factoryKey: deviceKey
    });

    console.log(`[Security] 👑 Administrador Root oficial inicializado com sucesso: ${callerEmail} (UID: ${callerUid}) para fábrica ${deviceKey}.`);

    return {
        success: true,
        message: 'Administrador Root inicializado e protegido com sucesso pelo servidor.'
    };
});

/**
 * 2. Provisionamento Confiável de Funcionário (Callable)
 * Executado exclusivamente pelo Administrador Root comprovado.
 */
exports.provisionEmployeeAccount = functions.https.onCall(async (data, context) => {
    const { deviceKey, email, initialPassword, displayName, permissions } = data;

    if (!deviceKey || !email || !initialPassword || !displayName) {
        throw new functions.https.HttpsError('invalid-argument', 'Parâmetros obrigatórios ausentes.');
    }

    if (initialPassword.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'A senha deve possuir pelo menos 6 caracteres para o Firebase Authentication.');
    }

    // Validar estritamente que o solicitante é o Root no servidor
    await verifyIsRootAdmin(context.auth, deviceKey);

    try {
        // Criar usuário no Firebase Authentication através da autoridade do Admin SDK
        const userRecord = await admin.auth().createUser({
            email: email.trim().toLowerCase(),
            password: initialPassword,
            displayName: displayName.trim(),
            emailVerified: false
        });

        const newUid = userRecord.uid;

        // Atribuir Custom Claims bloqueando qualquer privilégio administrativo
        await admin.auth().setCustomUserClaims(newUid, {
            admin: false,
            role: 'employee',
            factoryKey: deviceKey
        });

        // Registrar no Realtime Database sob a chave exata do authUid
        // Garantindo 100% de coerência com as regras do RTDB auth.uid === $userId
        // NENHUMA senha ou hash é gravada no banco compartilhado!
        const sanitizedPermissions = {};
        if (permissions && typeof permissions === 'object') {
            Object.keys(permissions).forEach(k => {
                sanitizedPermissions[k] = permissions[k] === true;
            });
        }

        await admin.database().ref(`factories/${deviceKey}/users/${newUid}`).set({
            id: newUid,
            name: displayName.trim(),
            email: email.trim().toLowerCase(),
            role: 'employee',
            active: true,
            permissions: sanitizedPermissions,
            createdAt: admin.database.ServerValue.TIMESTAMP,
            updatedAt: admin.database.ServerValue.TIMESTAMP
        });

        console.log(`[Security] 👤 Colaborador provisionado pelo Root: ${userRecord.email} (UID: ${newUid}).`);

        return {
            success: true,
            uid: newUid,
            email: userRecord.email,
            message: 'Colaborador provisionado com sucesso pelo servidor.'
        };
    } catch (err) {
        console.error('[Security] Erro ao provisionar funcionário no backend:', err);
        if (err.code === 'auth/email-already-in-use') {
            throw new functions.https.HttpsError('already-exists', 'Este e-mail já está em uso no Firebase Authentication.');
        }
        throw new functions.https.HttpsError('internal', err.message);
    }
});

/**
 * 3. Revogação e Bloqueio de Acesso de Funcionário (Callable)
 * Desativa imediatamente o colaborador e invalida tokens e sessões no Firebase Auth.
 */
exports.revokeEmployeeAccount = functions.https.onCall(async (data, context) => {
    const { deviceKey, employeeUid } = data;

    if (!deviceKey || !employeeUid) {
        throw new functions.https.HttpsError('invalid-argument', 'Parâmetros obrigatórios ausentes.');
    }

    await verifyIsRootAdmin(context.auth, deviceKey);

    try {
        // Desativar usuário e revogar todos os refresh tokens no Firebase Auth
        await admin.auth().updateUser(employeeUid, { disabled: true });
        await admin.auth().revokeRefreshTokens(employeeUid);

        // Desativar no Realtime Database
        await admin.database().ref(`factories/${deviceKey}/users/${employeeUid}/active`).set(false);
        await admin.database().ref(`factories/${deviceKey}/users/${employeeUid}/updatedAt`).set(admin.database.ServerValue.TIMESTAMP);

        console.log(`[Security] 🛑 Colaborador revogado pelo Root: UID ${employeeUid}.`);

        return { success: true, message: 'Acesso do colaborador revogado com sucesso pelo servidor.' };
    } catch (err) {
        console.error('[Security] Erro ao revogar colaborador:', err);
        throw new functions.https.HttpsError('internal', err.message);
    }
});
