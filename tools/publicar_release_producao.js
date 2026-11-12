// ============================================================================
// GELCONTROL — PUBLICADOR OFICIAL DE RELEASE DE PRODUÇÃO NO GITHUB
// Publica a versão oficial v85.4.0 na tag permanente 'producao-latest'
// Valida downloads públicos reais via HTTPS, hashes e assinatura digital
// ============================================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const crypto = require('crypto');
const { verifyEd25519Signature, UpdaterCore } = require('../desktop/updater_core');
const { PRODUCAO_PUBLIC_KEY_PEM, PERMANENT_PRODUCAO_MANIFEST_URL } = require('../desktop/updater_config');

const REPO_ROOT = path.resolve(__dirname, '..');
const UPDATE_PROD_DIR = path.join(REPO_ROOT, 'dist', 'updates', 'producao');
const MANIFEST_PATH = path.join(UPDATE_PROD_DIR, 'manifest_producao.json');
const initialManifest = fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) : null;
const ZIP_NAME = initialManifest ? path.basename(initialManifest.packageUrl) : 'gelcontrol-update-85.4.1-producao.zip';
const PACKAGE_PATH = path.join(UPDATE_PROD_DIR, 'packages', ZIP_NAME);

function getGitHubToken() {
    const credPath = path.join(os.homedir(), '.git-credentials');
    if (!fs.existsSync(credPath)) throw new Error('Arquivo .git-credentials não encontrado.');
    const content = fs.readFileSync(credPath, 'utf8');
    for (const line of content.split('\n')) {
        if (line.includes('github.com')) {
            const match = line.match(/https:\/\/(?:([^:]+):)?([^@]+)@github\.com/);
            if (match) return match[2];
        }
    }
    throw new Error('Token do GitHub não encontrado em .git-credentials');
}

function githubApiRequest({ method = 'GET', endpoint, token, headers = {}, body = null }) {
    return new Promise((resolve, reject) => {
        const url = endpoint.startsWith('https://') ? endpoint : `https://api.github.com${endpoint}`;
        const parsed = new URL(url);

        const reqHeaders = {
            'User-Agent': 'GelControl-Release-Publisher',
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            ...headers
        };

        if (body && !reqHeaders['Content-Length']) {
            reqHeaders['Content-Length'] = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
        }

        const req = https.request(parsed, { method, headers: reqHeaders }, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                const resBuffer = Buffer.concat(chunks);
                const resText = resBuffer.toString('utf8');
                let parsedJson = null;
                try { parsedJson = JSON.parse(resText); } catch (_) {}
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: parsedJson || resText,
                    rawBuffer: resBuffer
                });
            });
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

function publicHttpsDownload(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        let redirectCount = 0;

        function fetchUrl(currentUrl) {
            const parsed = new URL(currentUrl);
            const req = https.get(parsed, { headers: { 'User-Agent': 'GelControl-Public-Verifier' } }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    redirectCount++;
                    if (redirectCount > maxRedirects) {
                        return reject(new Error('Excesso de redirecionamentos HTTP'));
                    }
                    const nextUrl = new URL(res.headers.location, currentUrl).href;
                    res.resume();
                    return fetchUrl(nextUrl);
                }

                if (res.statusCode !== 200) {
                    res.resume();
                    return reject(new Error(`Falha HTTP ${res.statusCode} ao baixar: ${currentUrl}`));
                }

                const chunks = [];
                res.on('data', c => chunks.push(c));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            });

            req.on('error', reject);
        }

        fetchUrl(url);
    });
}

async function publicarReleaseProducao() {
    console.log('================================================================');
    console.log('   GELCONTROL — PUBLICAÇÃO OFICIAL NO CANAL DE PRODUÇÃO (v85.4.0)');
    console.log('================================================================\n');

    const token = getGitHubToken();

    // 1. Auditoria prévia rigorosa dos artefatos locais
    console.log('1. Conferência rigorosa dos artefatos locais:');
    if (!fs.existsSync(MANIFEST_PATH)) throw new Error(`Manifesto não encontrado: ${MANIFEST_PATH}`);
    if (!fs.existsSync(PACKAGE_PATH)) throw new Error(`Pacote não encontrado: ${PACKAGE_PATH}`);

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const zipBuffer = fs.readFileSync(PACKAGE_PATH);
    const calculatedHash = crypto.createHash('sha256').update(zipBuffer).digest('hex');

    console.log(`   Versão Alvo: ${manifest.latestVersion}`);
    console.log(`   Canal: ${manifest.channel}`);
    console.log(`   Tamanho: ${(zipBuffer.length / (1024 * 1024)).toFixed(2)} MB (${zipBuffer.length} bytes)`);
    console.log(`   SHA-256: ${calculatedHash}`);

    if (calculatedHash.toLowerCase() !== manifest.sha256.toLowerCase()) {
        throw new Error('Divergência de hash SHA-256 entre o manifesto e o pacote ZIP!');
    }

    const isValidSignature = verifyEd25519Signature(manifest, PRODUCAO_PUBLIC_KEY_PEM);
    if (!isValidSignature) {
        throw new Error('Assinatura Ed25519 inválida para a chave pública de produção!');
    }
    console.log('   Assinatura Ed25519: VÁLIDA E APROVADA.');

    // 2. Localizar ou Criar a Release 'producao-latest'
    console.log('\n2. Consultando release producao-latest no GitHub (GelodoVale/gelodovale-app)...');
    let release = null;
    const releaseRes = await githubApiRequest({
        endpoint: '/repos/GelodoVale/gelodovale-app/releases/tags/producao-latest',
        token
    });

    if (releaseRes.statusCode === 200 && releaseRes.data && releaseRes.data.id) {
        release = releaseRes.data;
        console.log(`   Release existente encontrada: ID ${release.id}, Tag: ${release.tag_name}`);
    } else {
        console.log('   Release producao-latest ainda não existe. Criando nova release oficial...');
        const createRes = await githubApiRequest({
            method: 'POST',
            endpoint: '/repos/GelodoVale/gelodovale-app/releases',
            token,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tag_name: 'producao-latest',
                target_commitish: 'main',
                name: 'GelControl Oficial — Produção (Última Versão Aprovada)',
                body: `## GelControl Oficial — Versão ${manifest.latestVersion} (Produção)\n\nRelease oficial de produção do GelControl. Contém o manifesto de distribuição assinado com criptografia Ed25519 e o pacote completo de atualização atômica.\n\n- **Versão:** ${manifest.latestVersion}\n- **Canal:** Produção\n- **Data de Lançamento:** ${manifest.buildDate}\n- **Requisito Mínimo:** v${manifest.minAppVersion} (Permite atualização direta de qualquer versão anterior)`,
                draft: false,
                prerelease: false
            })
        });

        if (createRes.statusCode !== 201 || !createRes.data || !createRes.data.id) {
            throw new Error(`Falha ao criar release producao-latest: HTTP ${createRes.statusCode} - ${JSON.stringify(createRes.data)}`);
        }
        release = createRes.data;
        console.log(`   Nova release oficial criada com sucesso: ID ${release.id}, Tag: ${release.tag_name}`);
    }

    // 3. Remover assets antigos caso existam
    if (Array.isArray(release.assets) && release.assets.length > 0) {
        console.log(`\n3. Removendo ${release.assets.length} assets antigos da release...`);
        for (const asset of release.assets) {
            console.log(`   Excluindo asset: ${asset.name} (ID: ${asset.id})...`);
            await githubApiRequest({
                method: 'DELETE',
                endpoint: `/repos/GelodoVale/gelodovale-app/releases/assets/${asset.id}`,
                token
            });
        }
        console.log('   Assets antigos removidos.');
    }

    // 4. Upload dos novos assets oficiais v85.4.0
    console.log('\n4. Enviando novos artefatos oficiais para o GitHub Releases:');

    // 4.1 Asset: manifest_producao.json
    console.log('   Enviando manifest_producao.json...');
    const manifestContent = fs.readFileSync(MANIFEST_PATH);
    const upManifestRes = await githubApiRequest({
        method: 'POST',
        endpoint: `https://uploads.github.com/repos/GelodoVale/gelodovale-app/releases/${release.id}/assets?name=manifest_producao.json`,
        token,
        headers: { 'Content-Type': 'application/json' },
        body: manifestContent
    });
    if (upManifestRes.statusCode !== 201 && upManifestRes.statusCode !== 200) {
        throw new Error(`Falha no upload do manifesto: HTTP ${upManifestRes.statusCode} - ${JSON.stringify(upManifestRes.data)}`);
    }
    console.log('   ✅ manifest_producao.json enviado com sucesso!');

    // 4.2 Asset: gelcontrol-update-85.4.0-producao.zip
    console.log(`   Enviando ${ZIP_NAME} (${(zipBuffer.length / (1024 * 1024)).toFixed(2)} MB)...`);
    const upZipRes = await githubApiRequest({
        method: 'POST',
        endpoint: `https://uploads.github.com/repos/GelodoVale/gelodovale-app/releases/${release.id}/assets?name=${ZIP_NAME}`,
        token,
        headers: { 'Content-Type': 'application/zip' },
        body: zipBuffer
    });
    if (upZipRes.statusCode !== 201 && upZipRes.statusCode !== 200) {
        throw new Error(`Falha no upload do pacote zip: HTTP ${upZipRes.statusCode} - ${JSON.stringify(upZipRes.data)}`);
    }
    console.log(`   ✅ ${ZIP_NAME} enviado com sucesso!`);

    // 5. Atualizar descrição e título da release
    console.log('\n5. Atualizando metadados da release oficial...');
    await githubApiRequest({
        method: 'PATCH',
        endpoint: `/repos/GelodoVale/gelodovale-app/releases/${release.id}`,
        token,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: `GelControl Oficial v${manifest.latestVersion} (Produção)`,
            body: `## GelControl Oficial — Versão ${manifest.latestVersion} (Produção Oficial)\n\n**Data:** ${manifest.buildDate}\n**SHA-256:** \`${calculatedHash}\`\n\n### Destaques desta Versão:\n- **Revalidação de Identidade por PID:** Inspeção de segurança em tempo real imediatamente antes de qualquer encerramento forçado, impedindo atingir PIDs reciclados pelo Windows.\n- **Encerramento Ordenado e Gracioso:** Flushing seguro de buffers e fechamento em três fases com preservação dos dados.\n- **Resolução Dinâmica do Desktop do OneDrive:** Suporte transparente ao redirecionamento de Área de Trabalho e sincronização multi-desktop.\n- **Ícone Circular Oficial com Fundo Transparente:** Ícone nativo (.ico) híbrido DIB 32bpp com máscara AND de 1 bit e PNG 256x256 com proporção 1:1.\n- **Tolerância Ativa Anti-Lock:** Laço de até 10 tentativas para superar inspeções em tempo real do Microsoft Defender / Antivírus sem interrupção.\n- **Preservação Absoluta de Dados:** Banco de dados comercial e comodatos 100% protegidos com rollback atômico comprovado.`
        })
    });
    console.log('   Metadados atualizados com sucesso.');

    // 6. VALIDAÇÃO PÚBLICA REAL (Acesso anônimo via HTTPS pela Internet)
    console.log('\n6. Validando acesso público real via HTTPS:');

    // 6.1 Download do manifesto público
    console.log(`   Baixando publicamente: ${PERMANENT_PRODUCAO_MANIFEST_URL}...`);
    const downloadedManifestBuffer = await publicHttpsDownload(PERMANENT_PRODUCAO_MANIFEST_URL);
    const downloadedManifest = JSON.parse(downloadedManifestBuffer.toString('utf8'));
    console.log(`   Manifesto baixado com sucesso (${downloadedManifestBuffer.length} bytes).`);
    console.log(`   Versão anunciada: ${downloadedManifest.latestVersion}`);

    const isDownloadedManifestValid = verifyEd25519Signature(downloadedManifest, PRODUCAO_PUBLIC_KEY_PEM);
    if (!isDownloadedManifestValid) {
        throw new Error('FALHA DE SEGURANÇA: O manifesto baixado publicamente não possui assinatura válida!');
    }
    console.log('   ✅ Assinatura Ed25519 do manifesto público verificada com 100% de autenticidade!');

    // 6.2 Download do pacote ZIP público
    console.log(`   Baixando publicamente o pacote: ${downloadedManifest.packageUrl}...`);
    const downloadedZipBuffer = await publicHttpsDownload(downloadedManifest.packageUrl);
    const downloadedZipHash = crypto.createHash('sha256').update(downloadedZipBuffer).digest('hex');
    console.log(`   Pacote baixado com sucesso: ${downloadedZipBuffer.length} bytes.`);
    console.log(`   Hash SHA-256 calculado: ${downloadedZipHash}`);

    if (downloadedZipHash.toLowerCase() !== downloadedManifest.sha256.toLowerCase()) {
        throw new Error('Divergência de hash SHA-256 no pacote baixado publicamente!');
    }
    console.log('   ✅ Integridade SHA-256 do pacote baixado pela internet comprovada!');

    // 7. Simulação Real de Consulta via UpdaterCore (Estação v85.4.0 detectando v85.4.1)
    console.log('\n7. Simulando consulta de atualização da estação v85.4.0 contra o endpoint online real:');
    const updaterSimulado = new UpdaterCore({
        installedVersion: '85.4.0',
        channel: 'producao',
        producaoPublicKey: PRODUCAO_PUBLIC_KEY_PEM,
        producaoManifestUrl: PERMANENT_PRODUCAO_MANIFEST_URL
    });

    const checkResult = await updaterSimulado.checkUpdate();
    console.log('   Resultado da verificação:', checkResult);

    if (!checkResult.hasUpdate || checkResult.availableVersion !== manifest.latestVersion) {
        throw new Error(`Falha na detecção da versão: esperado hasUpdate=true com v${manifest.latestVersion}, obtido: ${JSON.stringify(checkResult)}`);
    }
    console.log(`   ✅ ATUALIZADOR DA ESTAÇÃO RECONHECE A v${manifest.latestVersion} ONLINE COM 100% DE SUCESSO!`);

    console.log('\n================================================================');
    console.log('🎉 PUBLICAÇÃO OFICIAL DE PRODUÇÃO CONCLUÍDA E VALIDADA COM ÊXITO!');
    console.log(`   Endpoint Oficial: ${PERMANENT_PRODUCAO_MANIFEST_URL}`);
    console.log(`   Pacote Oficial: ${downloadedManifest.packageUrl}`);
    console.log('================================================================\n');

    return {
        success: true,
        version: manifest.latestVersion,
        manifestUrl: PERMANENT_PRODUCAO_MANIFEST_URL,
        packageUrl: downloadedManifest.packageUrl,
        sha256: calculatedHash
    };
}

if (require.main === module) {
    publicarReleaseProducao().catch(err => {
        console.error('\n❌ ERRO NA PUBLICAÇÃO:', err.message);
        process.exit(1);
    });
}

module.exports = { publicarReleaseProducao };

