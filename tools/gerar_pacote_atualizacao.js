// ============================================================================
// GELCONTROL — GERADOR E ASSINADOR DE PACOTES DE ATUALIZAÇÃO (Ed25519)
// Empacota, calcula SHA-256, gera e assina o manifesto canônico de distribuição
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { getCanonicalManifestBuffer, verifyEd25519Signature, compareSemVer } = require('../desktop/updater_core');
const { OFFICIAL_HOMOLOGACAO_MANIFEST_URL, HOMOLOGACAO_PUBLIC_KEY_PEM, PRODUCAO_PUBLIC_KEY_PEM } = require('../desktop/updater_config');

const REPO_ROOT = path.resolve(__dirname, '..');

/**
 * Filtro de inclusão rigoroso: impede inclusão de chaves, dados de usuários ou arquivos de dev
 */
function shouldIncludeFile(relPath) {
    const normalized = relPath.replace(/\\/g, '/');

    // Bloqueios absolutos de segurança e arquivos de desenvolvimento
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

/**
 * Copia recursiva com filtros de segurança
 */
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

/**
 * Cria pacote ZIP usando utilitário nativo ou PowerShell
 */
function createZipArchive(sourceDir, zipFilePath) {
    if (fs.existsSync(zipFilePath)) fs.unlinkSync(zipFilePath);
    const parentDir = path.dirname(zipFilePath);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });

    const psScript = `
        Add-Type -AssemblyName System.IO.Compression.FileSystem;
        [System.IO.Compression.ZipFile]::CreateFromDirectory('${sourceDir.replace(/'/g, "''")}', '${zipFilePath.replace(/'/g, "''")}', [System.IO.Compression.CompressionLevel]::Optimal, $false);
    `;
    const tempPs1 = path.join(REPO_ROOT, 'scratch', `temp_zip_${Date.now()}.ps1`);
    if (!fs.existsSync(path.dirname(tempPs1))) fs.mkdirSync(path.dirname(tempPs1), { recursive: true });
    fs.writeFileSync(tempPs1, psScript, 'utf8');

    try {
        execSync(`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tempPs1}"`, { stdio: 'pipe' });
    } finally {
        try { fs.unlinkSync(tempPs1); } catch (_) { }
    }

    if (!fs.existsSync(zipFilePath)) {
        throw new Error(`Falha ao gerar arquivo ZIP em: ${zipFilePath}`);
    }
}

/**
 * Função Principal de Empacotamento e Assinatura
 */
function gerarPacoteAtualizacao(options = {}) {
    const canal = options.canal || 'homologacao';
    const versao = options.versao || '85.4.0';
    const minAppVersion = options.minAppVersion || '80.0.0';
    const releaseNotes = options.releaseNotes || [
        `Atualização Oficial ${versao} (${canal})`,
        `Lixeira Inteligente Centralizada com Soft-Delete e Preservação Patrimonial`,
        `Ícone Circular Nativo no Windows com Formato DIB e Máscara AND de Hardware`,
        `Sincronização de Identidade Visual via Firebase em Tempo Real`,
        `Atualizador Multi-Estação com Salto Direto e Proteção de Dados Locais`
    ];

    console.log('================================================================');
    console.log(`   GELCONTROL — EMPACOTAMENTO DE ATUALIZAÇÃO [${canal.toUpperCase()}]`);
    console.log('================================================================');
    console.log(`📦 Versão Alvo: ${versao}`);
    console.log(`🎯 Requisito Mínimo: ${minAppVersion}`);

    // 1. Resolução da Chave Privada Ed25519 (Prioriza tools/keys/ isolado de pacotes)
    const privKeyPath = options.privateKeyPath || 
        (fs.existsSync(path.join(REPO_ROOT, 'tools', 'keys', `${canal}.private.pem`))
            ? path.join(REPO_ROOT, 'tools', 'keys', `${canal}.private.pem`)
            : path.join(REPO_ROOT, 'desktop', 'keys', `${canal}.private.pem`));

    if (!fs.existsSync(privKeyPath)) {
        throw new Error(`Chave privada Ed25519 não encontrada em: ${privKeyPath}. Execute 'node tools/gerar_chaves_ed25519.js ${canal}' primeiro.`);
    }
    const privateKeyPem = fs.readFileSync(privKeyPath, 'utf8');

    // 2. Resolução da Chave Pública para auto-validação
    const pubKeyPath = options.publicKeyPath || path.join(REPO_ROOT, 'desktop', 'keys', `${canal}.public.pem`);
    const defaultPubKey = (canal === 'producao') ? PRODUCAO_PUBLIC_KEY_PEM : HOMOLOGACAO_PUBLIC_KEY_PEM;
    const publicKeyPem = fs.existsSync(pubKeyPath) ? fs.readFileSync(pubKeyPath, 'utf8') : defaultPubKey;

    // 3. Montagem do Staging Limpo do Pacote
    const stagingDir = path.join(REPO_ROOT, 'scratch', `package_staging_${Date.now()}`);
    if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
    fs.mkdirSync(stagingDir, { recursive: true });

    console.log('📂 Coletando e filtrando arquivos da aplicação...');
    // Copiar arquivos raiz vitais
    ['index.html', 'styles.css', 'sw.js', 'manifest.json', 'logo_horizontal.jpg', 'logo_vertical.png', 'app_icon_round.ico', 'gelcontrol.ico'].forEach(f => {
        const fp = path.join(REPO_ROOT, f);
        if (fs.existsSync(fp)) fs.copyFileSync(fp, path.join(stagingDir, f));
    });

    // Copiar diretórios permitidos
    ['css', 'js', 'icons'].forEach(d => {
        const dp = path.join(REPO_ROOT, d);
        if (fs.existsSync(dp)) copyDirectoryFiltered(dp, path.join(stagingDir, d), REPO_ROOT);
    });

    // Copiar componentes desktop necessários (na raiz de resources/app e em desktop/)
    const desktopStaging = path.join(stagingDir, 'desktop');
    fs.mkdirSync(desktopStaging, { recursive: true });
    ['main.js', 'preload.js', 'package.json', 'updater_core.js', 'updater_installer.js', 'updater_applier.js', 'updater_config.js', 'admin_auth_validator.js', 'shortcuts.js', 'app_icon_round.ico'].forEach(f => {
        const fp = path.join(REPO_ROOT, 'desktop', f);
        const fpRoot = path.join(REPO_ROOT, f);
        const resolvedFp = fs.existsSync(fp) ? fp : (fs.existsSync(fpRoot) ? fpRoot : null);
        if (resolvedFp) {
            fs.copyFileSync(resolvedFp, path.join(desktopStaging, f));
            fs.copyFileSync(resolvedFp, path.join(stagingDir, f)); // Permite execução nativa do Electron na raiz
        }
    });

    // Criar version.json específico da nova versão
    const targetVersionInfo = {
        programVersion: versao,
        buildNumber: options.buildNumber || (fs.existsSync(path.join(REPO_ROOT, 'version.json')) ? JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'version.json'), 'utf8')).buildNumber : 189),
        buildDate: new Date().toISOString().split('T')[0],
        channel: canal,
        dataSchemaVersion: "2.5",
        releaseName: `v${versao}-${canal}`
    };
    fs.writeFileSync(path.join(stagingDir, 'version.json'), JSON.stringify(targetVersionInfo, null, 2), 'utf8');

    // AUDITORIA PREVENTIVA RIGOROSA ANTI-VAZAMENTO DE SEGREDOS NO STAGING
    function assertNoSecretsInStaging(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
            const fullPath = path.join(dir, e.name);
            const lowerName = e.name.toLowerCase();
            if (lowerName.endsWith('.pem') || lowerName.endsWith('.key') || lowerName.includes('private') || lowerName.includes('service-account')) {
                throw new Error(`VIOLACAO_SEGURANCA_STAGING: Arquivo proibido/sensível detectado no pacote: ${fullPath}`);
            }
            if (e.isDirectory()) assertNoSecretsInStaging(fullPath);
        }
    }
    assertNoSecretsInStaging(stagingDir);

    // 4. Criação do Arquivo ZIP
    const outputBaseDir = path.join(REPO_ROOT, 'dist', 'updates', canal);
    const packagesDir = path.join(outputBaseDir, 'packages');
    if (!fs.existsSync(packagesDir)) fs.mkdirSync(packagesDir, { recursive: true });

    const zipFileName = `gelcontrol-update-${versao}-${canal}.zip`;
    const zipFilePath = path.join(packagesDir, zipFileName);

    console.log(`🗜️ Comprimindo pacote de atualização: ${zipFileName}...`);
    createZipArchive(stagingDir, zipFilePath);

    // Limpar staging
    try { fs.rmSync(stagingDir, { recursive: true, force: true }); } catch (_) { }

    // 5. Cálculo do Tamanho e SHA-256
    const zipBuffer = fs.readFileSync(zipFilePath);
    const packageSize = zipBuffer.length;
    const sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex');

    console.log(`📊 Tamanho do pacote: ${packageSize} bytes (${(packageSize / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`🔑 Hash SHA-256: ${sha256}`);

    // 6. Montagem do Manifesto Canônico (URL Oficial no GitHub Releases)
    const packageRemoteUrl = options.packageUrl || `https://github.com/GelodoVale/gelodovale-app/releases/download/${canal}-latest/${zipFileName}`;
    const manifestDraft = {
        channel: canal,
        latestVersion: versao,
        buildDate: targetVersionInfo.buildDate,
        minAppVersion: minAppVersion,
        releaseNotes: releaseNotes,
        packageUrl: packageRemoteUrl,
        packageSize: packageSize,
        sha256: sha256
    };

    // 7. Assinatura Assimétrica Ed25519
    const canonicalBuffer = getCanonicalManifestBuffer(manifestDraft);
    const signature = crypto.sign(null, canonicalBuffer, privateKeyPem).toString('hex');
    const signedManifest = {
        ...manifestDraft,
        signature: signature
    };

    // 8. Auto-Validação Criptográfica com a Chave Pública
    const isSignatureValid = verifyEd25519Signature(signedManifest, publicKeyPem);
    if (!isSignatureValid) {
        throw new Error('FALHA_FATAL_ASSINATURA: A assinatura gerada não pôde ser validada com a chave pública correspondente!');
    }
    console.log('✅ Assinatura Ed25519 validada internamente com sucesso!');

    // 9. Gravação dos Artefatos
    const manifestFilePath = path.join(outputBaseDir, `manifest_${canal}.json`);
    fs.writeFileSync(manifestFilePath, JSON.stringify(signedManifest, null, 2), 'utf8');
    console.log(`📄 Manifesto assinado gravado em: ${manifestFilePath}`);

    // Gravação de Notas de Lançamento
    const releaseNotesDir = path.join(outputBaseDir, 'releasenotes');
    if (!fs.existsSync(releaseNotesDir)) fs.mkdirSync(releaseNotesDir, { recursive: true });
    const releaseNotesPath = path.join(releaseNotesDir, `${versao}.md`);
    fs.writeFileSync(releaseNotesPath, `# Notas de Lançamento — GelControl v${versao} (${canal})\nData: ${targetVersionInfo.buildDate}\n\n` + releaseNotes.map(n => `- ${n}`).join('\n') + '\n', 'utf8');

    // 10. Instruções de Publicação Manual
    const instructionsPath = path.join(outputBaseDir, 'INSTRUCOES_PUBLICACAO.md');
    fs.writeFileSync(instructionsPath, `# 📋 Instruções de Publicação Manual — GelControl (${canal})\n
Esta pasta contém os artefatos preparados para distribuição online:
1. **Manifesto:** \`manifest_${canal}.json\`
2. **Pacote:** \`packages/${zipFileName}\`
3. **Notas:** \`releasenotes/${versao}.md\`

### Procedimento para Publicar na Internet (Quando Autorizado pelo Administrador):
1. Copie o arquivo \`manifest_${canal}.json\` e a pasta \`packages/\` para o repositório público do GitHub Pages em \`updates/${canal}/\`.
2. Confirme que o link HTTPS do manifesto responde com status 200:
   \`${OFFICIAL_HOMOLOGACAO_MANIFEST_URL}\`
3. O GelControl nos computadores de homologação detectará a versão automaticamente após a inicialização ou via botão "Verificar atualizações".
`, 'utf8');

    console.log(`📝 Instruções gravadas em: ${instructionsPath}`);
    console.log('================================================================');
    console.log('🎉 Pacote de atualização preparado e autenticado com sucesso!');
    console.log('================================================================');

    return {
        manifest: signedManifest,
        manifestFilePath,
        zipFilePath,
        packageSize,
        sha256,
        signature
    };
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const canal = args[0] || 'homologacao';
    const versao = args[1] || '85.1.0';
    gerarPacoteAtualizacao({ canal, versao });
}

module.exports = { gerarPacoteAtualizacao };

