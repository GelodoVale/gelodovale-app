// ============================================================================
// GELCONTROL v85 — BACKEND CONFIÁVEL DE AUTENTICAÇÃO E PROVISIONAMENTO
// Funções Administrativas Protegidas via Firebase Admin SDK
// ============================================================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Validador de Autorização Root
 * Comprova no servidor se o solicitante autenticado é o Administrador Root legítimo da fábrica.
 */
async function verifyIsRootAdmin(auth, deviceKey) {
    if (!auth || !auth.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Acesso não autenticado.');
    }

    const callerUid = auth.uid;

    // 1. Verificação por Custom Claims (Token Seguro do Firebase Auth)
    if (auth.token && auth.token.admin === true) {
        return true;
    }

    // 2. Verificação no Realtime Database oficial da fábrica
    const rootSnapshot = await admin.database()
        .ref(`factories/${deviceKey}/rootUid`)
        .once('value');
    
    const officialRootUid = rootSnapshot.val();
    if (!officialRootUid) {
        throw new functions.https.HttpsError('failed-precondition', 'Fábrica não possui Root inicializado.');
    }

    if (callerUid !== officialRootUid) {
        throw new functions.https.HttpsError('permission-denied', 'Apenas o Administrador Root tem permissão para executar esta operação.');
    }

    return true;
}

/**
 * 1. Provisionamento Confiável de Funcionário (Callable)
 * Executado exclusivamente pelo Administrador Root.
 */
exports.provisionEmployeeAccount = functions.https.onCall(async (data, context) => {
    const { deviceKey, email, initialPassword, displayName, permissions } = data;

    if (!deviceKey || !email || !initialPassword || !displayName) {
        throw new functions.https.HttpsError('invalid-argument', 'Parâmetros obrigatórios ausentes.');
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

        // Atribuir Custom Claims que identificam o perfil de Colaborador e a fábrica vinculada
        await admin.auth().setCustomUserClaims(newUid, {
            role: 'employee',
            factoryKey: deviceKey,
            root: false
        });

        // Registrar no Realtime Database com as permissões atribuídas pelo Root
        // Observe: NENHUMA senha ou hash é gravada no banco de dados!
        await admin.database().ref(`factories/${deviceKey}/users/${newUid}`).set({
            id: newUid,
            name: displayName.trim(),
            email: email.trim().toLowerCase(),
            role: 'employee',
            active: true,
            permissions: permissions || {},
            createdAt: admin.database.ServerValue.TIMESTAMP,
            updatedAt: admin.database.ServerValue.TIMESTAMP
        });

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
 * 2. Revogação e Bloqueio de Acesso de Funcionário (Callable)
 * Desativa imediatamente o colaborador e invalida tokens/sessões ativas no Firebase Auth.
 */
exports.revokeEmployeeAccount = functions.https.onCall(async (data, context) => {
    const { deviceKey, employeeUid } = data;

    if (!deviceKey || !employeeUid) {
        throw new functions.https.HttpsError('invalid-argument', 'Parâmetros obrigatórios ausentes.');
    }

    await verifyIsRootAdmin(context.auth, deviceKey);

    try {
        // Desativar usuário e revogar todos os refresh tokens
        await admin.auth().updateUser(employeeUid, { disabled: true });
        await admin.auth().revokeRefreshTokens(employeeUid);

        // Atualizar status no RTDB
        await admin.database().ref(`factories/${deviceKey}/users/${employeeUid}/active`).set(false);
        await admin.database().ref(`factories/${deviceKey}/users/${employeeUid}/updatedAt`).set(admin.database.ServerValue.TIMESTAMP);

        return { success: true, message: 'Acesso do colaborador revogado com sucesso.' };
    } catch (err) {
        console.error('[Security] Erro ao revogar colaborador:', err);
        throw new functions.https.HttpsError('internal', err.message);
    }
});

/**
 * 3. Inicialização e Amarração da Identidade Root (Callable)
 * Amarração única da identidade do Root no RTDB e atribuição de Custom Claim { admin: true }.
 * Não pode ser executada por terceiros após o rootUid estar estabelecido.
 */
exports.initializeFactoryRoot = functions.https.onCall(async (data, context) => {
    const { deviceKey, setupToken } = data;

    if (!context.auth || !context.auth.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Requer autenticação prévia com a conta do proprietário.');
    }

    const callerUid = context.auth.uid;

    const rootRef = admin.database().ref(`factories/${deviceKey}/rootUid`);
    const currentRootSnap = await rootRef.once('value');
    const existingRootUid = currentRootSnap.val();

    // Se a fábrica já possui um Root estabelecido, proibir substituição sumariamente
    if (existingRootUid && existingRootUid !== callerUid) {
        throw new functions.https.HttpsError('permission-denied', 'Esta fábrica já possui Administrador Root oficial cadastrado. A conta Root é imutável.');
    }

    // Se for primeira amarração ou confirmação do proprietário legítimo:
    await rootRef.set(callerUid);

    // Conceder Custom Claim { admin: true } permanente para o Root no Firebase Auth
    await admin.auth().setCustomUserClaims(callerUid, {
        admin: true,
        role: 'root',
        factoryKey: deviceKey
    });

    return {
        success: true,
        message: 'Administrador Root vinculado e protegido com sucesso.'
    };
});
