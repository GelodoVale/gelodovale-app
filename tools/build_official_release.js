// ============================================================================
// GELCONTROL — GERADOR OFICIAL DE RELEASE UNIFICADA (ATUALIZADOR + INSTALADOR)
// Garante paridade absoluta entre novos instaladores e pacotes de atualização
// Assinatura Ed25519, Integridade SHA-256 e Versionamento Canônico
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { getCanonicalManifestBuffer, verifyEd25519Signature, compareSemVer } = require('../desktop/updater_core');
const { PRODUCAO_PUBLIC_KEY_PEM } = require('../desktop/updater_config');

const REPO_ROOT = path.resolve(__dirname, '..');
const TARGET_VERSION = '85.4.4';
const MIN_APP_VERSION = '80.0.0'; // Permite atualização direta de qualquer versão a partir da v80
const CANAL = 'producao';

console.log('================================================================');
console.log(`   GELCONTROL — CONSTRUÇÃO DA RELEASE OFICIAL v${TARGET_VERSION}`);
console.log('================================================================\n');

// 1. Chaves Criptográficas
const privKeyPath = path.join(REPO_ROOT, 'tools', 'keys', 'producao.private.pem');
if (!fs.existsSync(privKeyPath)) {
    throw new Error(`Chave privada de produção não encontrada em: ${privKeyPath}`);
}
const privateKeyPem = fs.readFileSync(privKeyPath, 'utf8');

// 2. Filtro Rigoroso de Segurança
function shouldIncludeFile(relPath) {
    const normalized = relPath.replace(/\\/g, '/');
    const blockedPatterns = [
        /^\.git/,
        /^\.agents/,
        /^Dados/,
        /^Backups/,
        /^scratch/,
        /^credentials/,
        /^desktop\/keys\/.*private.*/,
        /^desktop\/Output/,
        /service-account.*\.json$/i,
        /\.pem$/i,
        /\.key$/i,
        /\.exe$/i,
        /\.log$/i,
        /\.bak$/i,
        /\.tmp$/i,
        /-DESKTOP-/i,
        /^dist/,
        /^tools\/gerar_/,
        /^tools\/recuperar_/,
        /test_/i,
        /auditar_/i
    ];
    for (const pattern of blockedPatterns) {
        if (pattern.test(normalized)) return false;
    }
    return true;
}

function copyDirectoryFiltered(srcDir, destDir, baseDir = srcDir) {
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name);
        const relPath = path.relative(baseDir, srcPath);
        if (!shouldIncludeFile(relPath)) continue;
        const destPath = path.join(destDir, entry.name);
        if (entry.isDirectory()) {
            copyDirectoryFiltered(srcPath, destPath, baseDir);
        } else if (entry.isFile()) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// 3. Montar Staging Canônico da Aplicação
const stagingDir = path.join(REPO_ROOT, 'scratch', `release_staging_${Date.now()}`);
if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(stagingDir, { recursive: true });

console.log('📂 1. Coletando e auditando arquivos oficiais da aplicação...');

// Arquivos raiz fundamentais
['index.html', 'styles.css', 'sw.js', 'manifest.json', 'logo_horizontal.jpg', 'logo_vertical.png', 'app_icon_round.ico'].forEach(f => {
    const fp = path.join(REPO_ROOT, f);
    if (fs.existsSync(fp)) fs.copyFileSync(fp, path.join(stagingDir, f));
});

// Diretórios da aplicação
['css', 'js', 'icons'].forEach(d => {
    const dp = path.join(REPO_ROOT, d);
    if (fs.existsSync(dp)) copyDirectoryFiltered(dp, path.join(stagingDir, d), REPO_ROOT);
});

// Componentes Desktop (Electron)
const desktopStaging = path.join(stagingDir, 'desktop');
fs.mkdirSync(desktopStaging, { recursive: true });
[
    'main.js',
    'preload.js',
    'package.json',
    'updater_core.js',
    'updater_installer.js',
    'updater_applier.js',
    'updater_config.js',
    'admin_auth_validator.js',
    'shortcuts.js',
    'app_icon_round.ico'
].forEach(f => {
    const fp = path.join(REPO_ROOT, 'desktop', f);
    if (fs.existsSync(fp)) {
        fs.copyFileSync(fp, path.join(desktopStaging, f));
        fs.copyFileSync(fp, path.join(stagingDir, f));
    }
});

// Metadados Canônicos de Versão
const versionInfo = {
    programVersion: TARGET_VERSION,
    buildNumber: 190,
    buildDate: new Date().toISOString().split('T')[0],
    channel: CANAL,
    dataSchemaVersion: "2.5",
    releaseName: `v${TARGET_VERSION}-${CANAL}`
};
fs.writeFileSync(path.join(stagingDir, 'version.json'), JSON.stringify(versionInfo, null, 2), 'utf8');

// Validação Anti-Vazamento
function assertNoSecrets(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const fullPath = path.join(dir, e.name);
        const lower = e.name.toLowerCase();
        if (lower.endsWith('.pem') || lower.endsWith('.key') || lower.includes('private') || lower.includes('service-account')) {
            throw new Error(`VIOLACAO_SEGURANCA: Arquivo proibido no pacote: ${fullPath}`);
        }
        if (e.isDirectory()) assertNoSecrets(fullPath);
    }
}
assertNoSecrets(stagingDir);

// 4. Gerar o Pacote ZIP Oficial de Atualização
const outputUpdatesDir = path.join(REPO_ROOT, 'dist', 'updates', CANAL);
const packagesDir = path.join(outputUpdatesDir, 'packages');
if (!fs.existsSync(packagesDir)) fs.mkdirSync(packagesDir, { recursive: true });

const zipFileName = `gelcontrol-update-${TARGET_VERSION}-${CANAL}.zip`;
const zipFilePath = path.join(packagesDir, zipFileName);
if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);

console.log(`🗜️ 2. Comprimindo pacote oficial para atualização automática: ${zipFileName}...`);
const psScript = `
    Add-Type -AssemblyName System.IO.Compression.FileSystem;
    [System.IO.Compression.ZipFile]::CreateFromDirectory('${stagingDir.replace(/'/g, "''")}', '${zipFilePath.replace(/'/g, "''")}', [System.IO.Compression.CompressionLevel]::Optimal, $false);
`;
const tempPs1 = path.join(REPO_ROOT, 'scratch', `temp_zip_${Date.now()}.ps1`);
fs.writeFileSync(tempPs1, psScript, 'utf8');
try {
    execSync(`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tempPs1}"`, { stdio: 'pipe' });
} finally {
    try { fs.unlinkSync(tempPs1); } catch (_) {}
}

const zipBuffer = fs.readFileSync(zipFilePath);
const packageSize = zipBuffer.length;
const packageSha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex');

console.log(`   Tamanho: ${(packageSize / (1024 * 1024)).toFixed(2)} MB (${packageSize} bytes)`);
console.log(`   SHA-256: ${packageSha256}`);

// 5. Gerar e Assinar o Manifesto de Produção
const manifestDraft = {
    channel: CANAL,
    latestVersion: TARGET_VERSION,
    buildDate: versionInfo.buildDate,
    minAppVersion: MIN_APP_VERSION,
    releaseNotes: [
        `GelControl Oficial v${TARGET_VERSION} (Produção)`,
        `Encerramento Cirúrgico de Processos com Revalidação Estrita de Identidade por PID e Flush Seguro`,
        `Resolução Dinâmica da Área de Trabalho no OneDrive e Sincronização Multi-Desktop`,
        `Garantia do Ícone Circular Oficial com Fundo Externo 100% Transparente`,
        `Tolerância Ativa Anti-Lock a Inspeções Transitórias do Antivírus/Defender`,
        `Preservação Absoluta dos Dados Comerciais com Rollback Atômico Comprovado`
    ],
    packageUrl: `https://github.com/GelodoVale/gelodovale-app/releases/download/producao-latest/${zipFileName}`,
    packageSize: packageSize,
    sha256: packageSha256
};

const canonicalBuffer = getCanonicalManifestBuffer(manifestDraft);
const signature = crypto.sign(null, canonicalBuffer, privateKeyPem).toString('hex');
const signedManifest = {
    ...manifestDraft,
    signature: signature
};

// Auto-validação da assinatura com a chave pública oficial
const isValid = verifyEd25519Signature(signedManifest, PRODUCAO_PUBLIC_KEY_PEM);
if (!isValid) {
    throw new Error('FALHA_CRIPTO: Assinatura do manifesto não pôde ser validada com a chave pública de produção!');
}
console.log('🔒 3. Assinatura Ed25519 validada com 100% de autenticidade.');

// Gravar manifesto de produção
const manifestPath = path.join(outputUpdatesDir, 'manifest_producao.json');
fs.writeFileSync(manifestPath, JSON.stringify(signedManifest, null, 2), 'utf8');
console.log(`📄 4. Manifesto gravado em: ${manifestPath}`);

// 6. Preparar Distribuição para Novas Instalações (Fresh Install)
// Garante paridade absoluta entre quem instala do zero e quem atualiza
const installDistDir = path.join(REPO_ROOT, 'dist', `instalador_oficial_v${TARGET_VERSION}`);
const installAppDir = path.join(installDistDir, 'app');
if (fs.existsSync(installDistDir)) fs.rmSync(installDistDir, { recursive: true, force: true });
fs.mkdirSync(installAppDir, { recursive: true });

fs.cpSync(stagingDir, installAppDir, { recursive: true });
fs.writeFileSync(path.join(installDistDir, 'manifest_oficial.json'), JSON.stringify(signedManifest, null, 2), 'utf8');

console.log(`📦 5. Pacote para novas instalações preparado em: ${installDistDir}`);

// Limpar staging
try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch (_) {}

console.log('\n================================================================');
console.log(`🎉 RELEASE OFICIAL v${TARGET_VERSION} CONSTRUÍDA COM SUCESSO!`);
console.log('   - Atualizador Automático: dist/updates/producao/manifest_producao.json');
console.log(`   - Pacote de Atualização: ${zipFilePath}`);
console.log(`   - Base para Novo Instalador: dist/instalador_oficial_v${TARGET_VERSION}`);
console.log('================================================================\n');

