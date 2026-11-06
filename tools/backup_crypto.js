/**
 * GelControl v85 - Ferramenta de Backup Administrativo Criptografado
 * 
 * Finalidade:
 * Permite ao Administrador Root exportar e importar cópias de segurança integrais
 * do GelControl protegidas por criptografia padrão militar AES-256-GCM.
 * 
 * Segurança:
 * - Chave derivada com PBKDF2 (100.000 iterações de SHA-512) a partir de senha mestra
 *   definida pelo proprietário (independente de conta de usuário do Windows).
 * - Arquivo seguro para armazenamento no OneDrive pessoal do proprietário.
 * - Em caso de perda total ou pane do PC 1, permite restauração em máquina nova.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const PBKDF2_ITERATIONS = 100000;
const KEY_LEN = 32;
const SALT_LEN = 16;
const IV_LEN = 12;

function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, 'sha512');
}

/**
 * Criptografa objeto de dados e salva em arquivo .gelbak
 */
function exportEncryptedBackup(dataObject, password, outputPath) {
    if (!password || password.length < 8) {
        throw new Error('A senha mestra de backup deve possuir pelo menos 8 caracteres.');
    }

    const salt = crypto.randomBytes(SALT_LEN);
    const iv = crypto.randomBytes(IV_LEN);
    const key = deriveKey(password, salt);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const plaintext = Buffer.from(JSON.stringify(dataObject), 'utf8');

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Payload estruturado: SALT (16) + IV (12) + TAG (16) + DADOS CRIPTOGRAFADOS
    const payload = Buffer.concat([salt, iv, tag, encrypted]);

    fs.writeFileSync(outputPath, payload);
    return {
        outputPath,
        bytes: payload.length,
        timestamp: new Date().toISOString()
    };
}

/**
 * Descriptografa arquivo .gelbak para objeto original
 */
function importEncryptedBackup(inputPath, password) {
    if (!fs.existsSync(inputPath)) {
        throw new Error('Arquivo de backup não encontrado: ' + inputPath);
    }

    const payload = fs.readFileSync(inputPath);
    if (payload.length < (SALT_LEN + IV_LEN + 16)) {
        throw new Error('Arquivo de backup corrompido ou incompleto.');
    }

    const salt = payload.subarray(0, SALT_LEN);
    const iv = payload.subarray(SALT_LEN, SALT_LEN + IV_LEN);
    const tag = payload.subarray(SALT_LEN + IV_LEN, SALT_LEN + IV_LEN + 16);
    const encrypted = payload.subarray(SALT_LEN + IV_LEN + 16);

    const key = deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    try {
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return JSON.parse(decrypted.toString('utf8'));
    } catch (err) {
        throw new Error('Senha mestra incorreta ou integridade do backup violada (HMAC inválido).');
    }
}

// Execução via linha de comando
if (require.main === module) {
    const args = process.argv.slice(2);
    const cmd = args[0];

    if (cmd === 'test') {
        console.log('--- Testando Cifra e Decifra AES-256-GCM ---');
        const testData = { factory: 'gelodovale_oficial', version: 'v85', timestamp: Date.now() };
        const testPass = 'MestraSegura@2026';
        const tmpFile = path.join(__dirname, 'test_sample.gelbak');

        try {
            exportEncryptedBackup(testData, testPass, tmpFile);
            console.log('✅ Exportação criptografada OK');
            const recovered = importEncryptedBackup(tmpFile, testPass);
            if (recovered.factory === testData.factory) {
                console.log('✅ Descriptografia e integridade confirmadas com sucesso');
            } else {
                throw new Error('Dados recuperados divergentes');
            }
        } finally {
            if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        }
    } else {
        console.log('Uso: node tools/backup_crypto.js [test]');
    }
}

module.exports = {
    exportEncryptedBackup,
    importEncryptedBackup
};

