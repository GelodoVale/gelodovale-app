// ============================================================================
// GELCONTROL — GERENCIADOR AUTOMÁTICO DE ATALHOS E ÍCONES NO WINDOWS
// Criação, manutenção de atalhos permanentes e sincronização automática de logotipo
// ============================================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Cria uma entrada DIB padrão Windows (BITMAPINFOHEADER + BGRA bottom-up + AND mask bottom-up)
 * Essencial para que o Windows Explorer e User32 mascarem com 100% de transparência nas resoluções <= 128
 * @param {number} sz Largura/Altura da imagem (quadrada)
 * @param {Buffer} rawArgbBuffer Buffer bruto com bytes em formato 32bpp Argb (Windows Format32bppArgb)
 * @returns {Buffer}
 */
function createDibEntryFromRaw(sz, rawArgbBuffer) {
    const headerSize = 40;
    const xorSize = sz * sz * 4;
    const andRowStride = Math.floor((sz + 31) / 32) * 4;
    const andSize = andRowStride * sz;
    const totalSize = headerSize + xorSize + andSize;

    const buf = Buffer.alloc(totalSize);

    // BITMAPINFOHEADER (40 bytes)
    buf.writeUInt32LE(40, 0);               // biSize
    buf.writeInt32LE(sz, 4);                // biWidth
    buf.writeInt32LE(sz * 2, 8);            // biHeight (XOR + AND)
    buf.writeUInt16LE(1, 12);               // biPlanes
    buf.writeUInt16LE(32, 14);              // biBitCount (32 bpp BGRA)
    buf.writeUInt32LE(0, 16);               // biCompression (BI_RGB)
    buf.writeUInt32LE(xorSize + andSize, 20); // biSizeImage
    buf.writeInt32LE(0, 24);                // biXPelsPerMeter
    buf.writeInt32LE(0, 28);                // biYPelsPerMeter
    buf.writeUInt32LE(0, 32);               // biClrUsed
    buf.writeUInt32LE(0, 36);               // biClrImportant

    // No Windows Format32bppArgb, a ordem dos bytes em memória é: Blue, Green, Red, Alpha (BGRA)
    // Gravamos as linhas de baixo para cima (bottom-to-top) como exigido pelo padrão DIB
    let xorOffset = headerSize;
    for (let y = sz - 1; y >= 0; y--) {
        const rowStart = y * sz * 4;
        rawArgbBuffer.copy(buf, xorOffset, rowStart, rowStart + (sz * 4));
        xorOffset += (sz * 4);
    }

    // AND mask: 1 bit por pixel, armazenado de baixo para cima (bottom-to-top)
    // 0 = opaco, 1 = transparente (força os cantos externos a ficarem 100% transparentes no Windows)
    let andOffset = headerSize + xorSize;
    for (let y = sz - 1; y >= 0; y--) {
        let bitCol = 0;
        let currentByte = 0;
        let rowBytesWritten = 0;

        for (let x = 0; x < sz; x++) {
            const pixelOffset = (y * sz + x) * 4;
            const alpha = rawArgbBuffer[pixelOffset + 3];
            const isTransparent = alpha < 128 ? 1 : 0;

            currentByte = (currentByte << 1) | isTransparent;
            bitCol++;

            if (bitCol === 8) {
                buf[andOffset++] = currentByte;
                rowBytesWritten++;
                bitCol = 0;
                currentByte = 0;
            }
        }

        if (bitCol > 0) {
            currentByte = currentByte << (8 - bitCol);
            buf[andOffset++] = currentByte;
            rowBytesWritten++;
        }

        while (rowBytesWritten < andRowStride) {
            buf[andOffset++] = 0;
            rowBytesWritten++;
        }
    }

    return buf;
}

/**
 * Cria um arquivo .ico padrão Windows híbrido (PNG para 256x256 e DIB nativo para <= 128)
 * @param {Array<{ width: number, height: number, buffer: Buffer }>} iconEntries 
 * @returns {Buffer} Buffer do arquivo .ico
 */
function createIcoFromPngs(iconEntries) {
    if (!iconEntries || !iconEntries.length) return Buffer.alloc(0);

    const numImages = iconEntries.length;
    const headerSize = 6;
    const dirEntrySize = 16;
    const totalDirSize = headerSize + (dirEntrySize * numImages);

    let currentOffset = totalDirSize;
    let totalSize = totalDirSize;
    iconEntries.forEach(entry => {
        totalSize += entry.buffer.length;
    });

    const icoBuffer = Buffer.alloc(totalSize);

    // Header ICONDIR
    icoBuffer.writeUInt16LE(0, 0); // Reservado (0)
    icoBuffer.writeUInt16LE(1, 2); // Tipo (1 = ICO)
    icoBuffer.writeUInt16LE(numImages, 4); // Quantidade de imagens

    // Gravar ICONDIRENTRYs e dados de cada resolução
    iconEntries.forEach((entry, idx) => {
        const entryOffset = headerSize + (idx * dirEntrySize);
        const widthByte = entry.width >= 256 ? 0 : entry.width;
        const heightByte = entry.height >= 256 ? 0 : entry.height;

        icoBuffer.writeUInt8(widthByte, entryOffset + 0);
        icoBuffer.writeUInt8(heightByte, entryOffset + 1);
        icoBuffer.writeUInt8(0, entryOffset + 2);
        icoBuffer.writeUInt8(0, entryOffset + 3);
        icoBuffer.writeUInt16LE(1, entryOffset + 4);
        icoBuffer.writeUInt16LE(32, entryOffset + 6); // 32 bits (RGBA)
        icoBuffer.writeUInt32LE(entry.buffer.length, entryOffset + 8);
        icoBuffer.writeUInt32LE(currentOffset, entryOffset + 12);

        entry.buffer.copy(icoBuffer, currentOffset);
        currentOffset += entry.buffer.length;
    });

    return icoBuffer;
}

/**
 * Obtém os diretórios padrão do Desktop do Windows onde podem haver atalhos
 * Prioriza dinamicamente a Área de Trabalho real ativa no Windows (incluindo redirecionamento do OneDrive)
 */
function getWindowsDesktopDirs() {
    const userProfile = process.env.USERPROFILE || os.homedir();
    const existing = [];

    // 1. Leitura ultrarrápida (3ms) do Registro do Windows (onde o Windows Explorer realmente lê a pasta ativa)
    try {
        const regOut = execSync('reg.exe query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders" /v Desktop', {
            encoding: 'utf8',
            timeout: 2000,
            stdio: ['ignore', 'pipe', 'ignore']
        });
        const match = regOut.match(/Desktop\s+REG_(?:EXPAND_)?SZ\s+(.+)/i);
        if (match && match[1]) {
            let deskPath = match[1].trim();
            // Expande variáveis de ambiente como %USERPROFILE% ou %OneDrive% se houver
            deskPath = deskPath.replace(/%([^%]+)%/g, (_, n) => process.env[n] || '');
            if (fs.existsSync(deskPath)) {
                existing.push(path.resolve(deskPath));
            }
        }
    } catch (_) {}

    // 2. Consulta à API .NET como fallback resiliente
    if (!existing.length) {
        try {
            const regOut2 = execSync('powershell.exe -NoProfile -NonInteractive -Command "[Environment]::GetFolderPath([Environment+SpecialFolder]::Desktop)"', {
                encoding: 'utf8',
                timeout: 4000,
                stdio: ['ignore', 'pipe', 'ignore']
            }).trim();
            if (regOut2 && fs.existsSync(regOut2)) {
                existing.push(path.resolve(regOut2));
            }
        } catch (_) {}
    }

    // 3. Varredura completa em todas as pastas padrão possíveis (OneDrive, Área de Trabalho, Desktop, Public)
    const candidates = [
        path.join(userProfile, 'OneDrive', 'Desktop'),
        path.join(userProfile, 'OneDrive', 'Área de Trabalho'),
        path.join(userProfile, 'Desktop'),
        path.join(userProfile, 'Área de Trabalho'),
        'C:\\Users\\Public\\Desktop',
        'C:\\Users\\Public\\Área de Trabalho'
    ];

    if (process.env.OneDrive) {
        candidates.unshift(path.join(process.env.OneDrive, 'Desktop'));
        candidates.unshift(path.join(process.env.OneDrive, 'Área de Trabalho'));
    }
    if (process.env.OneDriveConsumer) {
        candidates.unshift(path.join(process.env.OneDriveConsumer, 'Desktop'));
        candidates.unshift(path.join(process.env.OneDriveConsumer, 'Área de Trabalho'));
    }

    for (const cand of candidates) {
        if (fs.existsSync(cand)) {
            const resolved = path.resolve(cand);
            if (!existing.some(e => e.toLowerCase() === resolved.toLowerCase())) {
                existing.push(resolved);
            }
        }
    }
    return existing.length ? existing : [path.join(userProfile, 'Desktop')];
}

/**
 * Localiza e assegura a disponibilidade do ícone circular oficial (app_icon_round.ico)
 * @param {string} installDir Raiz da instalação
 * @param {string} dataDir Pasta de dados persistentes
 * @returns {string} Caminho do ícone circular garantido
 */
function resolveBestAppIcon(installDir, dataDir) {
    const targetRoundIco = path.join(dataDir, 'app_icon_round.ico');
    const targetCustomIco = path.join(dataDir, 'custom_app_icon.ico');

    // Candidatos onde o ícone circular nativo oficial de 149KB está embutido
    const bundledCandidates = [
        path.join(installDir, 'app_icon_round.ico'),
        path.join(installDir, 'Programa', 'resources', 'app', 'app_icon_round.ico'),
        path.join(installDir, 'Programa', 'resources', 'app', 'desktop', 'app_icon_round.ico'),
        path.join(__dirname, 'app_icon_round.ico'),
        path.join(__dirname, '..', 'app_icon_round.ico'),
        path.join(installDir, 'custom_app_icon.ico'),
        targetCustomIco
    ];

    // Se já existe um ícone circular de alta resolução (>= 140KB ou gerado por logo customizada)
    if (fs.existsSync(targetRoundIco) && fs.statSync(targetRoundIco).size > 140000) {
        return targetRoundIco;
    }

    // Procura o arquivo oficial embutido para garantir alta definição no Dados
    for (const cand of bundledCandidates) {
        if (fs.existsSync(cand) && fs.statSync(cand).size > 140000) {
            try {
                if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
                fs.copyFileSync(cand, targetRoundIco);
                fs.copyFileSync(cand, targetCustomIco);
                try {
                    fs.copyFileSync(cand, path.join(installDir, 'app_icon_round.ico'));
                    fs.copyFileSync(cand, path.join(installDir, 'custom_app_icon.ico'));
                } catch (_) {}
                console.log(`[Shortcuts] Ícone circular nativo garantido a partir de ${cand} -> ${targetRoundIco}`);
                return targetRoundIco;
            } catch (err) {
                console.warn('[Shortcuts] Aviso ao copiar ícone circular:', err.message);
                return cand;
            }
        }
    }

    // Se existir qualquer targetRoundIco mesmo de tamanho menor, usa como fallback
    if (fs.existsSync(targetRoundIco) && fs.statSync(targetRoundIco).size > 1000) {
        return targetRoundIco;
    }

    // Fallbacks padrão caso o ícone circular ainda não tenha sido extraído
    const fallbackIcons = [
        path.join(installDir, 'Programa', 'gelcontrol.ico'),
        path.join(installDir, 'gelcontrol.ico')
    ];
    for (const ico of fallbackIcons) {
        if (fs.existsSync(ico)) return ico;
    }

    return path.join(installDir, 'Programa', 'GelControl.exe');
}

/**
 * Gera os buffers PNG multi-resolução recortados em círculo com fundo externo 100% transparente
 * @param {string} source Caminho de arquivo local ou string Base64 (data:image/...)
 * @param {string} installRoot Diretório raiz de instalação
 * @returns {Array<{ width: number, height: number, buffer: Buffer }>}
 */
function generateCircularPngBuffers(source, installRoot) {
    if (!source) return [];

    let imagePath = null;
    let isBase64 = false;
    let base64Clean = '';

    if (typeof source === 'string' && source.startsWith('data:image/')) {
        isBase64 = true;
        base64Clean = source.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
    } else if (typeof source === 'string') {
        const candidates = [
            source,
            path.resolve(installRoot || process.cwd(), source),
            path.resolve(installRoot || process.cwd(), 'Programa', 'resources', 'app', source),
            path.resolve(installRoot || process.cwd(), 'Programa', source),
            path.resolve(__dirname, '..', source),
            path.resolve(__dirname, '..', '..', source)
        ];
        for (const cand of candidates) {
            try {
                if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
                    imagePath = cand;
                    break;
                }
            } catch (_) { }
        }
        if (!imagePath && source.length > 200) {
            isBase64 = true;
            base64Clean = source.trim();
        }
    }

    if (!imagePath && !isBase64) {
        console.warn('[Shortcuts] Imagem de origem não localizada para geração circular:', source);
        return [];
    }

    const tempDir = path.join(os.tmpdir(), `gc_circ_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    try {
        fs.mkdirSync(tempDir, { recursive: true });

        let loadScript = '';
        if (isBase64) {
            const b64File = path.join(tempDir, 'source.b64');
            fs.writeFileSync(b64File, base64Clean, 'utf8');
            loadScript = `
                $b64File = Join-Path $tempDir "source.b64"
                $rawStr = Get-Content $b64File -Raw
                $bytes = [System.Convert]::FromBase64String($rawStr.Trim())
                $ms = New-Object System.IO.MemoryStream($bytes, 0, $bytes.Length)
                $orig = [System.Drawing.Image]::FromStream($ms)
            `;
        } else {
            loadScript = `
                $sourcePath = "${imagePath.replace(/\\/g, '\\\\')}"
                $orig = [System.Drawing.Image]::FromFile($sourcePath)
            `;
        }

        const psGen = `
            Add-Type -AssemblyName System.Drawing
            $tempDir = "${tempDir.replace(/\\/g, '\\\\')}"
            ${loadScript}

            $sizes = @(256, 128, 64, 48, 32, 16)

            foreach ($sz in $sizes) {
                $bmp = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
                $g = [System.Drawing.Graphics]::FromImage($bmp)

                $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
                $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

                # Fundo exterior 100% transparente (Alpha = 0)
                $g.Clear([System.Drawing.Color]::Transparent)

                $margin = if ($sz -ge 128) { 4 } elseif ($sz -ge 48) { 2 } else { 1 }
                $dia = $sz - ($margin * 2)

                # 1. Base circular branca pura para nitidez e contraste de alto nível
                $g.FillEllipse([System.Drawing.Brushes]::White, $margin, $margin, $dia, $dia)

                # 2. Borda circular ciano suave estilizada (identidade visual GelControl)
                $borderWidth = if ($sz -ge 128) { 4 } elseif ($sz -ge 48) { 2 } else { 1 }
                $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(230, 0, 210, 255), $borderWidth)
                $g.DrawEllipse($borderPen, $margin, $margin, $dia, $dia)

                # 3. Recorte estrito ao interior do círculo
                $clipMargin = $margin + [Math]::Max(1, [int]($borderWidth / 2))
                $clipDia = $sz - ($clipMargin * 2)
                $clipPath = New-Object System.Drawing.Drawing2D.GraphicsPath
                $clipPath.AddEllipse($clipMargin, $clipMargin, $clipDia, $clipDia)
                $g.SetClip($clipPath)

                # 4. Proporção estrita sem corte nem deformação (contain em 82% do diâmetro)
                $innerDiameter = $clipDia * 0.82
                $origW = $orig.Width
                $origH = $orig.Height

                if ($origW -ge $origH) {
                    $drawW = $innerDiameter
                    $drawH = ($origH * $innerDiameter) / $origW
                } else {
                    $drawH = $innerDiameter
                    $drawW = ($origW * $innerDiameter) / $origH
                }

                $drawX = ($sz - $drawW) / 2
                $drawY = ($sz - $drawH) / 2

                $g.DrawImage($orig, [float]$drawX, [float]$drawY, [float]$drawW, [float]$drawH)

                # Salvar PNG
                $outPng = Join-Path $tempDir "circle_$sz.png"
                $bmp.Save($outPng, [System.Drawing.Imaging.ImageFormat]::Png)

                # Extrair bytes brutos de pixels ARGB (32bpp) para gerar DIB nativo com máscara AND
                $rect = New-Object System.Drawing.Rectangle(0, 0, $sz, $sz)
                $bmpData = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
                $totalBytes = [Math]::Abs($bmpData.Stride) * $sz
                $rawBytes = New-Object byte[] $totalBytes
                [System.Runtime.InteropServices.Marshal]::Copy($bmpData.Scan0, $rawBytes, 0, $totalBytes)
                $bmp.UnlockBits($bmpData)

                $outRaw = Join-Path $tempDir "raw_$sz.bin"
                [System.IO.File]::WriteAllBytes($outRaw, $rawBytes)

                $g.Dispose()
                $bmp.Dispose()
            }

            $orig.Dispose()
            if ($ms) { $ms.Dispose() }
        `;

        const psFile = path.join(tempDir, 'make_circles.ps1');
        fs.writeFileSync(psFile, psGen, 'utf8');

        execSync(`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${psFile}"`, {
            stdio: ['ignore', 'ignore', 'ignore'],
            timeout: 15000
        });

        const sizes = [256, 128, 64, 48, 32, 16];
        const entries = [];
        for (const sz of sizes) {
            const pngPath = path.join(tempDir, `circle_${sz}.png`);
            const rawPath = path.join(tempDir, `raw_${sz}.bin`);
            if (sz === 256 && fs.existsSync(pngPath)) {
                // PNG para 256x256 (suporte moderno para ícones grandes no Windows Vista+)
                entries.push({
                    width: sz,
                    height: sz,
                    buffer: fs.readFileSync(pngPath)
                });
            } else if (fs.existsSync(rawPath)) {
                // DIB nativo com máscara AND para <= 128 (garante recorte circular físico no shell)
                const rawBuf = fs.readFileSync(rawPath);
                const dibBuf = createDibEntryFromRaw(sz, rawBuf);
                entries.push({
                    width: sz,
                    height: sz,
                    buffer: dibBuf
                });
            } else if (fs.existsSync(pngPath)) {
                entries.push({
                    width: sz,
                    height: sz,
                    buffer: fs.readFileSync(pngPath)
                });
            }
        }
        return entries;
    } catch (err) {
        console.error('[Shortcuts] Erro ao gerar PNGs circulares:', err.message);
        return [];
    } finally {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
    }
}

/**
 * Atualiza o ícone personalizado a partir de buffers PNG ou imagem de origem e sincroniza os atalhos
 * @param {Object} options { pngBuffers, imageSource, source, base64, installRoot, dataDir }
 */
function updateAppCustomIcon(options = {}) {
    if (process.platform !== 'win32') return { success: true, reason: 'PLATAFORMA_NAO_WINDOWS' };

    try {
        const rootDir = options.installRoot || path.resolve(__dirname, '..', '..');
        const targetDataDir = options.dataDir || path.join(rootDir, 'Dados');
        if (!fs.existsSync(targetDataDir)) {
            try { fs.mkdirSync(targetDataDir, { recursive: true }); } catch (_) { }
        }

        let pngBuffers = options.pngBuffers;

        // Se não forneceu pngBuffers prontos, gera os buffers circulares a partir da imagem de origem
        const rawSource = options.imageSource || options.source || options.base64;
        if ((!pngBuffers || !pngBuffers.length) && rawSource) {
            pngBuffers = generateCircularPngBuffers(rawSource, rootDir);
        }

        // Se ainda não tem buffers, busca o logotipo configurado no state.json ou fallback padrão
        if (!pngBuffers || !pngBuffers.length) {
            const stateJsonPath = path.join(targetDataDir, 'state.json');
            let detectedLogo = null;
            if (fs.existsSync(stateJsonPath)) {
                try {
                    const st = JSON.parse(fs.readFileSync(stateJsonPath, 'utf8'));
                    if (st && st.factorySettings && st.factorySettings.logo) {
                        detectedLogo = st.factorySettings.logo;
                    }
                } catch (_) { }
            }
            if (!detectedLogo) {
                detectedLogo = 'logo_vertical.png';
            }
            pngBuffers = generateCircularPngBuffers(detectedLogo, rootDir);
        }

        const customIcoPath = path.join(targetDataDir, 'custom_app_icon.ico');
        const roundIcoPath = path.join(targetDataDir, 'app_icon_round.ico');

        if (!pngBuffers || !pngBuffers.length) {
            // Fallback seguro: se a geração dinâmica não retornou buffers, aplica o ícone circular nativo oficial
            const bundledIco = path.join(rootDir, 'Programa', 'resources', 'app', 'app_icon_round.ico');
            const bundledIcoAlt = path.join(__dirname, 'app_icon_round.ico');
            const sourceIco = fs.existsSync(bundledIco) ? bundledIco : (fs.existsSync(bundledIcoAlt) ? bundledIcoAlt : null);
            if (sourceIco && fs.statSync(sourceIco).size > 140000) {
                fs.copyFileSync(sourceIco, customIcoPath);
                fs.copyFileSync(sourceIco, roundIcoPath);
                console.log(`[Shortcuts] Fallback seguro: aplicado ícone circular oficial embutido (${sourceIco})`);
            } else {
                return { success: false, reason: 'SEM_BUFFERS_PNG' };
            }
        } else {
            const icoBuffer = createIcoFromPngs(pngBuffers);
            fs.writeFileSync(customIcoPath, icoBuffer);
            fs.writeFileSync(roundIcoPath, icoBuffer);
            console.log(`[Shortcuts] Ícone personalizado híbrido DIB+PNG gravado com sucesso: ${roundIcoPath} (${icoBuffer.length} bytes)`);

            try {
                const rootIco = path.join(rootDir, 'custom_app_icon.ico');
                fs.writeFileSync(rootIco, icoBuffer);
                const rootRoundIco = path.join(rootDir, 'app_icon_round.ico');
                fs.writeFileSync(rootRoundIco, icoBuffer);
            } catch (_) { }
        }

        const desktopDirs = getWindowsDesktopDirs();
        const primaryDesktop = desktopDirs[0] || path.join(process.env.USERPROFILE || os.homedir(), 'Desktop');
        const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
        const startMenuDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
        const officialExec = path.join(rootDir, 'Programa', 'GelControl.exe');
        const workingDir = path.join(rootDir, 'Programa');
        const channel = options.channel || 'producao';
        const isHomologation = (channel === 'homologacao');
        const baseShortcutName = isHomologation ? 'GelControl (Homologação)' : 'GelControl Oficial';
        const masterShortcutPath = path.join(primaryDesktop, `${baseShortcutName}.lnk`);

        const quarantineDir = path.join(targetDataDir, 'Backups', 'atalhos_quarentena');
        if (!fs.existsSync(quarantineDir)) {
            try { fs.mkdirSync(quarantineDir, { recursive: true }); } catch (_) { }
        }

        const psScript = `
            $ws = New-Object -ComObject WScript.Shell
            $roundIco = "${roundIcoPath.replace(/\\/g, '\\\\')}"
            $targetExec = "${officialExec.replace(/\\/g, '\\\\')}"
            $workDir = "${workingDir.replace(/\\/g, '\\\\')}"
            $masterLnk = "${masterShortcutPath.replace(/\\/g, '\\\\')}"
            $baseName = "${baseShortcutName}"
            $desktopDirs = @(${desktopDirs.map(d => `"${d.replace(/\\/g, '\\\\')}"`).join(',')})
            $quarantine = "${quarantineDir.replace(/\\/g, '\\\\')}"
            $officialTargetCanon = [System.IO.Path]::GetFullPath($targetExec).TrimEnd('\\').ToLower()
            $auditLog = Join-Path $quarantine "audit_atalhos.log"
            $restoreBat = Join-Path $quarantine "restaurar_atalhos.bat"

            if (-not (Test-Path $quarantine)) {
                New-Item -ItemType Directory -Path $quarantine -Force | Out-Null
            }
            if (-not (Test-Path $restoreBat)) {
                Set-Content -Path $restoreBat -Value "@echo off", "echo Restaurando atalhos substituidos para seus locais originais..." -Encoding utf8
            }

            # 1. Garantir o atalho mestre permanente na Área de Trabalho primária com ícone circular
            $mainLnk = $ws.CreateShortcut($masterLnk)
            $mainLnk.TargetPath = $targetExec
            $mainLnk.WorkingDirectory = $workDir
            $mainLnk.IconLocation = "$roundIco,0"
            $mainLnk.Description = "GelControl - Sistema Oficial da Fábrica de Gelo"
            $mainLnk.Save()
            (Get-Item $masterLnk).LastWriteTime = Get-Date
            Write-Output "MASTER_DESKTOP_SAVED: $masterLnk"

            # 2. Higienização seletiva estrita com quarentena e garantia do ícone circular
            $canonMaster = [System.IO.Path]::GetFullPath($masterLnk).TrimEnd('\\').ToLower()
            $officialLnkName = ($baseName + ".lnk").ToLower()

            foreach ($dir in $desktopDirs) {
                if (Test-Path $dir) {
                    Get-ChildItem -Path $dir -Filter "*.lnk" | ForEach-Object {
                        $itemCanon = [System.IO.Path]::GetFullPath($_.FullName).TrimEnd('\\').ToLower()
                        try {
                            $candidate = $ws.CreateShortcut($_.FullName)
                            if ($candidate.TargetPath -and (-not [string]::IsNullOrWhiteSpace($candidate.TargetPath))) {
                                $candTargetCanon = [System.IO.Path]::GetFullPath($candidate.TargetPath).TrimEnd('\\').ToLower()
                                
                                if ($candTargetCanon -eq $officialTargetCanon) {
                                    # Se for o próprio atalho oficial legítimo em qualquer pasta de desktop, atualiza o ícone circular
                                    if ($_.Name.ToLower() -eq $officialLnkName) {
                                        $candidate.IconLocation = "$roundIco,0"
                                        $candidate.WorkingDirectory = $workDir
                                        $candidate.Save()
                                        (Get-Item $_.FullName).LastWriteTime = Get-Date
                                        Write-Output "OFFICIAL_DESKTOP_ICON_UPDATED: $($_.FullName)"
                                    } elseif ($itemCanon -ne $canonMaster) {
                                        # Atalho concorrente antigo com nome diferente (ex: v85.3.0, GelControl.lnk): Quarentena segura
                                        $ts = (Get-Date).ToString("yyyyMMdd_HHmmss")
                                        $safeBase = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                                        $backupName = $safeBase + '_' + $ts + '.lnk'
                                        $backupPath = Join-Path $quarantine $backupName

                                        Move-Item -LiteralPath $_.FullName -Destination $backupPath -Force
                                        $logEntry = "[$ts] QUARENTENA: '$($_.FullName)' -> '$backupPath' | Target='$($candidate.TargetPath)'"
                                        Add-Content -Path $auditLog -Value $logEntry -Encoding utf8
                                        Add-Content -Path $restoreBat -Value ('copy /y "' + $backupPath + '" "' + $_.FullName + '"') -Encoding utf8
                                        Write-Output "DUPLICATE_QUARANTINED: $($_.FullName) -> $backupPath"
                                    }
                                } else {
                                    Write-Output "PRESERVED_EXTERNAL_SHORTCUT: $($_.FullName) -> $($candidate.TargetPath)"
                                }
                            } else {
                                Write-Output "PRESERVED_NO_TARGET: $($_.FullName)"
                            }
                        } catch {
                            Write-Output "PRESERVED_ON_ERROR: $($_.FullName)"
                        }
                    }
                }
            }

            # 3. Garantir Menu Iniciar limpo e apontando para o ícone circular
            $startMenuDir = "${startMenuDir.replace(/\\/g, '\\\\')}"
            if (Test-Path $startMenuDir) {
                $subDir = Join-Path $startMenuDir $baseName
                if (-not (Test-Path $subDir)) {
                    New-Item -ItemType Directory -Path $subDir -Force | Out-Null
                }
                $startLnkPath = Join-Path $subDir "$baseName.lnk"
                $sLnk = $ws.CreateShortcut($startLnkPath)
                $sLnk.TargetPath = $targetExec
                $sLnk.WorkingDirectory = $workDir
                $sLnk.IconLocation = "$roundIco,0"
                $sLnk.Description = "GelControl - Sistema Oficial da Fábrica de Gelo"
                $sLnk.Save()
                (Get-Item $startLnkPath).LastWriteTime = Get-Date
                Write-Output "STARTMENU_SAVED: $startLnkPath"

                # Quarentena para atalhos soltos de GelControl na raiz de Programs apontando para este executável
                Get-ChildItem -Path $startMenuDir -Filter "*.lnk" | ForEach-Object {
                    try {
                        $cand = $ws.CreateShortcut($_.FullName)
                        if ($cand.TargetPath) {
                            $candT = [System.IO.Path]::GetFullPath($cand.TargetPath).TrimEnd('\\').ToLower()
                            if ($candT -eq $officialTargetCanon) {
                                $ts = (Get-Date).ToString("yyyyMMdd_HHmmss")
                                $safeBase = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                                $backupName = 'StartMenu_' + $safeBase + '_' + $ts + '.lnk'
                                $backupPath = Join-Path $quarantine $backupName
                                Move-Item -LiteralPath $_.FullName -Destination $backupPath -Force
                                Add-Content -Path $auditLog -Value "[$ts] STARTMENU_QUARENTENA: '$($_.FullName)' -> '$backupPath'" -Encoding utf8
                                Add-Content -Path $restoreBat -Value ('copy /y "' + $backupPath + '" "' + $_.FullName + '"') -Encoding utf8
                                Write-Output "STARTMENU_QUARANTINED: $($_.FullName)"
                            }
                        }
                    } catch {}
                }
            }

            # 4. Forçar limpeza e atualização profunda do cache de ícones do Windows Explorer
            if (Test-Path "$env:SystemRoot\\System32\\ie4uinit.exe") {
                try {
                    Start-Process "$env:SystemRoot\\System32\\ie4uinit.exe" -ArgumentList "-show" -NoNewWindow -Wait
                } catch {}
            }

            try {
                if (-not ([System.Management.Automation.PSTypeName]'ShellNotifierSafe').Type) {
                    $code = @"
                    using System;
                    using System.Runtime.InteropServices;
                    public class ShellNotifierSafe {
                        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
                        public static extern void SHChangeNotify(int wEventId, int uFlags, string dwItem1, string dwItem2);

                        [DllImport("shell32.dll")]
                        public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);

                        public static void NotifyItem(string path) {
                            try {
                                SHChangeNotify(0x00002000, 0x0005, path, null);
                            } catch {}
                        }

                        public static void Refresh() {
                            try {
                                SHChangeNotify(0x08000000, 0x1000, IntPtr.Zero, IntPtr.Zero);
                            } catch {}
                        }
                    }
"@
                    Add-Type -TypeDefinition $code -Language CSharp
                }
                [ShellNotifierSafe]::NotifyItem($masterLnk)
                [ShellNotifierSafe]::Refresh()
                Write-Output "SHELL_REFRESH_OK"
            } catch {
                Write-Output "SHELL_REFRESH_WARN: $_"
            }
        `;

        const tempPs = path.join(os.tmpdir(), `gc_sc_ico_${Date.now()}.ps1`);
        fs.writeFileSync(tempPs, psScript, 'utf8');

        try {
            const output = execSync(`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tempPs}"`, {
                encoding: 'utf8',
                timeout: 15000,
                stdio: ['ignore', 'pipe', 'ignore']
            });
            console.log('[Shortcuts] Resultado da atualização atômica de ícones:', output.trim());
            return { success: true, customIcoPath, output: output.trim() };
        } finally {
            try { fs.unlinkSync(tempPs); } catch (_) { }
        }
    } catch (err) {
        console.error('[Shortcuts] Erro ao atualizar ícone personalizado:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Restaura o ícone padrão oficial do aplicativo em caso de remoção do logotipo
 */
function restoreAppDefaultIcon(options = {}) {
    if (process.platform !== 'win32') return { success: true };

    try {
        const rootDir = options.installRoot || path.resolve(__dirname, '..', '..');
        const targetDataDir = options.dataDir || path.join(rootDir, 'Dados');
        const customIcoPath = path.join(targetDataDir, 'custom_app_icon.ico');

        if (fs.existsSync(customIcoPath)) {
            try { fs.unlinkSync(customIcoPath); } catch (_) { }
        }
        try {
            const rootIco = path.join(rootDir, 'custom_app_icon.ico');
            if (fs.existsSync(rootIco)) fs.unlinkSync(rootIco);
        } catch (_) { }

        let defaultIconPath = resolveBestAppIcon(rootDir, targetDataDir);
        if (!fs.existsSync(defaultIconPath)) {
            defaultIconPath = path.join(rootDir, 'Programa', 'gelcontrol.ico');
        }
        if (!fs.existsSync(defaultIconPath)) {
            defaultIconPath = path.join(rootDir, 'gelcontrol.ico');
        }
        if (!fs.existsSync(defaultIconPath)) {
            defaultIconPath = path.join(rootDir, 'Programa', 'GelControl.exe');
        }

        const desktopDirs = getWindowsDesktopDirs();
        const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
        const startMenuDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
        const officialExec = path.join(rootDir, 'Programa', 'GelControl.exe');
        const workingDir = path.join(rootDir, 'Programa');

        const psScript = `
            $ws = New-Object -ComObject WScript.Shell
            $defaultIco = "${defaultIconPath.replace(/\\/g, '\\\\')}"
            $targetExec = "${officialExec.replace(/\\/g, '\\\\')}"
            $workDir = "${workingDir.replace(/\\/g, '\\\\')}"
            $desktopDirs = @(${desktopDirs.map(d => `"${d.replace(/\\/g, '\\\\')}"`).join(',')})

            # Garantir GelControl Oficial.lnk com ícone padrão
            if ($desktopDirs.Count -gt 0 -and (Test-Path $desktopDirs[0])) {
                $mainLnkPath = Join-Path $desktopDirs[0] "GelControl Oficial.lnk"
                $mainLnk = $ws.CreateShortcut($mainLnkPath)
                $mainLnk.TargetPath = $targetExec
                $mainLnk.WorkingDirectory = $workDir
                $mainLnk.IconLocation = "$defaultIco,0"
                $mainLnk.Save()
                (Get-Item $mainLnkPath).LastWriteTime = Get-Date
            }

            foreach ($dir in $desktopDirs) {
                if (Test-Path $dir) {
                    Get-ChildItem -Path $dir -Filter "*Gel*.lnk" | ForEach-Object {
                        try {
                            $lnk = $ws.CreateShortcut($_.FullName)
                            if ($lnk.TargetPath -and $lnk.TargetPath.ToLower().Contains("gelcontrol")) {
                                $lnk.IconLocation = "$defaultIco,0"
                                $lnk.Save()
                                (Get-Item $_.FullName).LastWriteTime = Get-Date
                                Write-Output "RESTORED_DESKTOP: $($_.FullName)"
                            }
                        } catch {}
                    }
                }
            }

            $startMenuDir = "${startMenuDir.replace(/\\/g, '\\\\')}"
            if (Test-Path $startMenuDir) {
                Get-ChildItem -Path $startMenuDir -Filter "*Gel*.lnk" -Recurse | ForEach-Object {
                    try {
                        $lnk = $ws.CreateShortcut($_.FullName)
                        if ($lnk.TargetPath -and $lnk.TargetPath.ToLower().Contains("gelcontrol")) {
                            $lnk.IconLocation = "$defaultIco,0"
                            $lnk.Save()
                            (Get-Item $_.FullName).LastWriteTime = Get-Date
                            Write-Output "RESTORED_STARTMENU: $($_.FullName)"
                        }
                    } catch {}
                }
            }

            if (Test-Path "$env:SystemRoot\\System32\\ie4uinit.exe") {
                try { Start-Process "$env:SystemRoot\\System32\\ie4uinit.exe" -ArgumentList "-show" -NoNewWindow -Wait } catch {}
            }

            try {
                $code = @"
                using System;
                using System.Runtime.InteropServices;
                public class ShellNotifierFull2 {
                    [DllImport("shell32.dll")]
                    public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);
                    public static void Refresh() {
                        SHChangeNotify(0x08000000, 0x1000, IntPtr.Zero, IntPtr.Zero);
                    }
                }
"@
                Add-Type -TypeDefinition $code -Language CSharp
                [ShellNotifierFull2]::Refresh()
                Write-Output "SHELL_REFRESH_OK"
            } catch {}
        `;

        const tempPs = path.join(os.tmpdir(), `gc_sc_restore_${Date.now()}.ps1`);
        fs.writeFileSync(tempPs, psScript, 'utf8');

        try {
            const output = execSync(`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tempPs}"`, {
                encoding: 'utf8',
                timeout: 15000,
                stdio: ['ignore', 'pipe', 'ignore']
            });
            console.log('[Shortcuts] Ícone padrão restaurado:', output.trim());
            return { success: true, defaultIconPath, output: output.trim() };
        } finally {
            try { fs.unlinkSync(tempPs); } catch (_) { }
        }
    } catch (err) {
        console.error('[Shortcuts] Erro ao restaurar ícone padrão:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Garante a criação e integridade dos atalhos do GelControl no Windows
 * @param {Object} options Configurações de canal, caminhos e ambiente
 */
function ensureAppShortcuts(options = {}) {
    if (process.platform !== 'win32') return { success: true, reason: 'PLATAFORMA_NAO_WINDOWS' };

    try {
        const execPath = options.execPath || process.execPath;
        const execName = path.basename(execPath).toLowerCase();

        if (!execName.includes('gelcontrol') && !options.force) {
            console.log('[Shortcuts] Ambiente de desenvolvimento/node detectado. Criação de atalhos ignorada.');
            return { success: false, reason: 'AMBIENTE_DESENVOLVIMENTO' };
        }

        const execNormalized = path.resolve(execPath);
        const channel = options.channel || 'producao';
        const isHomologation = (channel === 'homologacao');

        const installDir = options.installRoot || path.resolve(path.dirname(execPath), '..');
        const workingDir = path.dirname(execPath);
        const dataDir = options.dataDir || path.join(installDir, 'Dados');

        const iconPath = resolveBestAppIcon(installDir, dataDir);

        const desktopDirs = getWindowsDesktopDirs();
        const primaryDesktop = desktopDirs[0] || path.join(process.env.USERPROFILE || os.homedir(), 'Desktop');

        // Nome permanente definitivo conforme exigência do usuário
        const baseShortcutName = isHomologation ? 'GelControl (Homologação)' : 'GelControl Oficial';
        const desktopShortcutPath = path.join(primaryDesktop, `${baseShortcutName}.lnk`);

        const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
        const programsDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
        const startMenuSubDir = path.join(programsDir, baseShortcutName);
        if (!fs.existsSync(startMenuSubDir)) {
            try { fs.mkdirSync(startMenuSubDir, { recursive: true }); } catch (_) { }
        }
        const startMenuShortcutPath = path.join(startMenuSubDir, `${baseShortcutName}.lnk`);

        const description = isHomologation
            ? 'GelControl - Sistema da Fábrica de Gelo (Canal de Homologação)'
            : 'GelControl - Sistema Oficial da Fábrica de Gelo';

        console.log(`[Shortcuts] Verificando e higienizando atalhos oficiais do GelControl...`);
        console.log(`  Executável alvo: ${execNormalized}`);
        console.log(`  Ícone configurado: ${iconPath}`);
        console.log(`  Área de Trabalho primária: ${desktopShortcutPath}`);

        const quarantineDir = path.join(dataDir, 'Backups', 'atalhos_quarentena');
        if (!fs.existsSync(quarantineDir)) {
            try { fs.mkdirSync(quarantineDir, { recursive: true }); } catch (_) { }
        }

        const psScript = `
            $ws = New-Object -ComObject WScript.Shell
            $target = "${execNormalized.replace(/\\/g, '\\\\')}"
            $workDir = "${workingDir.replace(/\\/g, '\\\\')}"
            $icon = "${iconPath.replace(/\\/g, '\\\\')}"
            $desc = "${description.replace(/"/g, '`"')}"
            $desktopDirs = @(${desktopDirs.map(d => `"${d.replace(/\\/g, '\\\\')}"`).join(',')})
            $scPath = "${desktopShortcutPath.replace(/\\/g, '\\\\')}"
            $baseName = "${baseShortcutName}"
            $quarantine = "${quarantineDir.replace(/\\/g, '\\\\')}"
            $officialTargetCanon = [System.IO.Path]::GetFullPath($target).TrimEnd('\\').ToLower()
            $auditLog = Join-Path $quarantine "audit_atalhos.log"
            $restoreBat = Join-Path $quarantine "restaurar_atalhos.bat"

            if (-not (Test-Path $quarantine)) {
                New-Item -ItemType Directory -Path $quarantine -Force | Out-Null
            }
            if (-not (Test-Path $restoreBat)) {
                Set-Content -Path $restoreBat -Value "@echo off", "echo Restaurando atalhos substituidos para seus locais originais..." -Encoding utf8
            }

            # 1. Garantir o atalho permanente oficial na Área de Trabalho primária com ícone circular
            $s = $ws.CreateShortcut($scPath)
            $s.TargetPath = $target
            $s.WorkingDirectory = $workDir
            $s.IconLocation = "$icon,0"
            $s.Description = $desc
            $s.Save()
            (Get-Item $scPath).LastWriteTime = Get-Date
            Write-Output "ENSURED_MAIN: $scPath"

            # 2. Higienização seletiva estrita com quarentena e garantia do ícone circular
            $canonMaster = [System.IO.Path]::GetFullPath($scPath).TrimEnd('\\').ToLower()
            $officialLnkName = ($baseName + ".lnk").ToLower()

            foreach ($dir in $desktopDirs) {
                if (Test-Path $dir) {
                    Get-ChildItem -Path $dir -Filter "*.lnk" | ForEach-Object {
                        $itemCanon = [System.IO.Path]::GetFullPath($_.FullName).TrimEnd('\\').ToLower()
                        try {
                            $candidate = $ws.CreateShortcut($_.FullName)
                            if ($candidate.TargetPath -and (-not [string]::IsNullOrWhiteSpace($candidate.TargetPath))) {
                                $candTargetCanon = [System.IO.Path]::GetFullPath($candidate.TargetPath).TrimEnd('\\').ToLower()
                                
                                if ($candTargetCanon -eq $officialTargetCanon) {
                                    # Se for o próprio atalho oficial legítimo em qualquer pasta de desktop, atualiza o ícone circular
                                    if ($_.Name.ToLower() -eq $officialLnkName) {
                                        $candidate.IconLocation = "$icon,0"
                                        $candidate.WorkingDirectory = $workDir
                                        $candidate.Save()
                                        (Get-Item $_.FullName).LastWriteTime = Get-Date
                                        Write-Output "OFFICIAL_DESKTOP_ICON_UPDATED: $($_.FullName)"
                                    } elseif ($itemCanon -ne $canonMaster) {
                                        # Atalho concorrente antigo com nome diferente (ex: v85.3.0, GelControl.lnk): Quarentena segura
                                        $ts = (Get-Date).ToString("yyyyMMdd_HHmmss")
                                        $safeBase = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                                        $backupName = $safeBase + '_' + $ts + '.lnk'
                                        $backupPath = Join-Path $quarantine $backupName

                                        Move-Item -LiteralPath $_.FullName -Destination $backupPath -Force
                                        $logEntry = "[$ts] QUARENTENA: '$($_.FullName)' -> '$backupPath' | Target='$($candidate.TargetPath)'"
                                        Add-Content -Path $auditLog -Value $logEntry -Encoding utf8
                                        Add-Content -Path $restoreBat -Value ('copy /y "' + $backupPath + '" "' + $_.FullName + '"') -Encoding utf8
                                        Write-Output "DUPLICATE_QUARANTINED: $($_.FullName) -> $backupPath"
                                    }
                                } else {
                                    Write-Output "PRESERVED_EXTERNAL_SHORTCUT: $($_.FullName) -> $($candidate.TargetPath)"
                                }
                            } else {
                                Write-Output "PRESERVED_NO_TARGET: $($_.FullName)"
                            }
                        } catch {
                            Write-Output "PRESERVED_ON_ERROR: $($_.FullName)"
                        }
                    }
                }
            }

            # 3. Menu Iniciar
            $smPath = "${startMenuShortcutPath.replace(/\\/g, '\\\\')}"
            $s2 = $ws.CreateShortcut($smPath)
            $s2.TargetPath = $target
            $s2.WorkingDirectory = $workDir
            $s2.IconLocation = "$icon,0"
            $s2.Description = $desc
            $s2.Save()
            (Get-Item $smPath).LastWriteTime = Get-Date
            Write-Output "ENSURED_STARTMENU: $smPath"

            # Quarentena para atalhos soltos de GelControl na raiz de Programs apontando para este executável
            Get-ChildItem -Path $startMenuDir -Filter "*.lnk" | ForEach-Object {
                try {
                    $cand = $ws.CreateShortcut($_.FullName)
                    if ($cand.TargetPath) {
                        $candT = [System.IO.Path]::GetFullPath($cand.TargetPath).TrimEnd('\\').ToLower()
                        if ($candT -eq $officialTargetCanon) {
                            $ts = (Get-Date).ToString("yyyyMMdd_HHmmss")
                            $safeBase = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                            $backupName = 'StartMenu_' + $safeBase + '_' + $ts + '.lnk'
                            $backupPath = Join-Path $quarantine $backupName
                            Move-Item -LiteralPath $_.FullName -Destination $backupPath -Force
                            Add-Content -Path $auditLog -Value "[$ts] STARTMENU_QUARENTENA: '$($_.FullName)' -> '$backupPath'" -Encoding utf8
                            Add-Content -Path $restoreBat -Value ('copy /y "' + $backupPath + '" "' + $_.FullName + '"') -Encoding utf8
                            Write-Output "STARTMENU_QUARANTINED: $($_.FullName)"
                        }
                    }
                } catch {}
            }

            # 4. Forçar limpeza do cache do Windows Explorer
            if (Test-Path "$env:SystemRoot\\System32\\ie4uinit.exe") {
                try {
                    Start-Process "$env:SystemRoot\\System32\\ie4uinit.exe" -ArgumentList "-show" -NoNewWindow -Wait
                } catch {}
            }

            try {
                if (-not ([System.Management.Automation.PSTypeName]'ShellNotifierSafe').Type) {
                    $code = @"
                    using System;
                    using System.Runtime.InteropServices;
                    public class ShellNotifierSafe {
                        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
                        public static extern void SHChangeNotify(int wEventId, int uFlags, string dwItem1, string dwItem2);

                        [DllImport("shell32.dll")]
                        public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);

                        public static void NotifyItem(string path) {
                            try {
                                SHChangeNotify(0x00002000, 0x0005, path, null);
                            } catch {}
                        }

                        public static void Refresh() {
                            try {
                                SHChangeNotify(0x08000000, 0x1000, IntPtr.Zero, IntPtr.Zero);
                            } catch {}
                        }
                    }
"@
                    Add-Type -TypeDefinition $code -Language CSharp
                }
                [ShellNotifierSafe]::NotifyItem($scPath)
                [ShellNotifierSafe]::Refresh()
                Write-Output "SHELL_REFRESH_OK"
            } catch {}
        `;

        const tempPs = path.join(os.tmpdir(), `gc_sc_ensure_${Date.now()}.ps1`);
        fs.writeFileSync(tempPs, psScript, 'utf8');

        try {
            const output = execSync(`powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tempPs}"`, {
                encoding: 'utf8',
                timeout: 15000,
                stdio: ['ignore', 'pipe', 'ignore']
            });
            console.log('[Shortcuts] Resultado da verificação:', output.trim());
            return { success: true, desktopShortcut: desktopShortcutPath, output: output.trim() };
        } finally {
            try { fs.unlinkSync(tempPs); } catch (_) { }
        }
    } catch (err) {
        console.error('[Shortcuts] Erro ao garantir atalhos:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = {
    ensureAppShortcuts,
    updateAppCustomIcon,
    restoreAppDefaultIcon,
    createIcoFromPngs,
    generateCircularPngBuffers,
    getWindowsDesktopDirs,
    resolveBestAppIcon
};
