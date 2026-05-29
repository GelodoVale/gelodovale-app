# GelControl Static Diagnostic and Auto-Test Script
# Checks references, window bindings, HTML events, and potential runtime failures.

$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  GelControl - AUTO-TESTE E DIAGNOSTICO ESTATICO DE INTEGRACAO  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$AppDir = "C:\Users\kissn\OneDrive\GelodoVale-system\App"
$JsDir = "$AppDir\js"
$HtmlFile = "$AppDir\index.html"

# 1. Extrair todas as funcoes chamadas no HTML (onclick, onchange, oninput, etc.)
Write-Host "[1/4] Analisando index.html em busca de chamadas de JS..." -ForegroundColor Yellow
$HtmlContent = Get-Content $HtmlFile -Raw
$HtmlEvents = [System.Collections.Generic.HashSet[string]]::new()

# Regex para pegar chamadas como onclick="window.func()" ou onclick="func()" ou onclick="switchPWATab('...')"
$EventRegex = '(?:onchange|onclick|oninput|onfocus|onblur|onsubmit|onload)\s*=\s*"(?:window\.)?([a-zA-Z0-9_]+)\s*\(?'
$Matches = [regex]::Matches($HtmlContent, $EventRegex)
foreach ($Match in $Matches) {
    $FuncName = $Match.Groups[1].Value
    # Ignorar palavras-chaves reservadas do JS ou inline simples (como closeConfirm, this, event, etc.)
    if ($FuncName -notin @("closeConfirm", "closeModal", "this", "event", "preventExtensions", "preventDefault", "stopPropagation")) {
        $HtmlEvents.Add($FuncName) | Out-Null
    }
}
Write-Host "-> Encontradas $($HtmlEvents.Count) funcoes distintas chamadas no HTML." -ForegroundColor Green

# 2. Mapear todas as funcoes declaradas e vinculadas ao window nos arquivos JS
Write-Host "`n[2/4] Mapeando exportacoes e vinculacoes globais (window.*) nos arquivos JS..." -ForegroundColor Yellow
$JsFiles = Get-ChildItem -Path $JsDir -Filter "*.js"

$ExposedFunctions = @{}   # Nome da funcao -> Caminho do arquivo onde esta definida
$WindowBindings = @{}     # Nome da funcao -> Caminho do arquivo de vinculacao ao window
$ImportedSymbols = @{}    # Arquivo -> Lista de imports

foreach ($File in $JsFiles) {
    $FilePath = $File.FullName
    $FileName = $File.Name
    $Content = Get-Content $FilePath -Raw
    
    # Encontrar "export function name" ou "function name"
    $DefRegex = '(?:\bexport\s+)?\bfunction\s+([a-zA-Z0-9_]+)\s*\('
    $Defs = [regex]::Matches($Content, $DefRegex)
    foreach ($Def in $Defs) {
        $Name = $Def.Groups[1].Value
        if (-not $ExposedFunctions.ContainsKey($Name)) {
            $ExposedFunctions[$Name] = $FileName
        }
    }
    
    # Encontrar "window.name = " ou "window.name = name"
    $BindRegex = 'window\.([a-zA-Z0-9_]+)\s*=\s*'
    $Binds = [regex]::Matches($Content, $BindRegex)
    foreach ($Bind in $Binds) {
        $Name = $Bind.Groups[1].Value
        $WindowBindings[$Name] = $FileName
    }
}

Write-Host "-> Mapeadas $($ExposedFunctions.Count) funcoes definidas nos arquivos JS." -ForegroundColor Green
Write-Host "-> Mapeados $($WindowBindings.Count) vinculos globais no objeto 'window'." -ForegroundColor Green

# 3. Validar se ha chamadas no HTML que nao estao expostas no window
Write-Host "`n[3/4] Validando conectividade HTML -> JavaScript..." -ForegroundColor Yellow
$MissingBindings = @()

foreach ($Event in $HtmlEvents) {
    if (-not $WindowBindings.ContainsKey($Event)) {
        # Verificar se esta declarada em algum lugar como fallback
        if ($ExposedFunctions.ContainsKey($Event)) {
            $MissingBindings += [PSCustomObject]@{
                Funcao = $Event
                DefinidaEm = $ExposedFunctions[$Event]
                Status = "Definida no JS mas NAO vinculada ao 'window'"
            }
        } else {
            $MissingBindings += [PSCustomObject]@{
                Funcao = $Event
                DefinidaEm = "Desconhecido"
                Status = "NAO ENCONTRADA EM NENHUM ARQUIVO JS"
            }
        }
    }
}

if ($MissingBindings.Count -eq 0) {
    Write-Host "Success: Todas as funcoes chamadas no HTML estao devidamente expostas e vinculadas ao window!" -ForegroundColor Green
} else {
    Write-Host "Avisos/Erros de Conectividade encontrados:" -ForegroundColor Red
    $MissingBindings | Format-Table -AutoSize
}

# 4. Garimpar potenciais erros comuns nos modulos JS (Ex: imports circulares, bugs de .toFixed, undefined variables)
Write-Host "`n[4/4] Garimpando arquivos JS por vulnerabilidades de execucao..." -ForegroundColor Yellow
$Warnings = @()

foreach ($File in $JsFiles) {
    $FilePath = $File.FullName
    $FileName = $File.Name
    $Lines = Get-Content $FilePath
    
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        $LineNum = $i + 1
        $Line = $Lines[$i]
        
        # Teste A: Uso de .toFixed sem protecao (sem checagem de null/undefined ou sem parseFloat)
        if ($Line -match '\b([a-zA-Z0-9_\.]+)\.toFixed\(' -and $Line -notmatch '\b(?:0|parseFloat|revenue|total|amount|price|fee|tax|cost|netResult|roiPercent|\d+)\b') {
            # Ignorar falsos positivos conhecidos
            if ($Line -notmatch 'totalVal|suggestedValue|avg|depreciation|totalMaintenanceCost|totalSalesRevenue|totalReceived|cashReceived|pixReceived|cardReceived|expFuel|expMeal|expOthers|totalExpenses|revenueMonth|outstandingDebt') {
                $Warnings += [PSCustomObject]@{
                    Arquivo = $FileName
                    Linha = $LineNum
                    Tipo = "toFixed sem protecao evidente"
                    Conteudo = $Line.Trim()
                }
            }
        }
        
        # Teste B: Uso de typo 'del bem'
        if ($Line -match 'del bem') {
            $Warnings += [PSCustomObject]@{
                Arquivo = $FileName
                Linha = $LineNum
                Tipo = "Possivel Typo 'del bem' em vez de 'do bem'"
                Conteudo = $Line.Trim()
            }
        }
        
        # Teste C: Chamada direta de 'lucide.createIcons' sem verificar 'window.lucide'
        if ($Line -match '\blucide\.createIcons\(' -and $Line -notmatch 'window\.lucide') {
            $Warnings += [PSCustomObject]@{
                Arquivo = $FileName
                Linha = $LineNum
                Tipo = "lucide.createIcons sem guard window"
                Conteudo = $Line.Trim()
            }
        }

        # Teste D: Variavel global state sem verificacao do modulo local
        if ($Line -match '\bstate\.' -and $Line -notmatch 'import.*state') {
            $HasStateImport = $false
            foreach ($l in $Lines) {
                if ($l -match 'import.*\bstate\b') { $HasStateImport = $true; break }
            }
            if (-not $HasStateImport) {
                $Warnings += [PSCustomObject]@{
                    Arquivo = $FileName
                    Linha = $LineNum
                    Tipo = "Uso de 'state' sem importacao declarada"
                    Conteudo = $Line.Trim()
                }
            }
        }
    }
}

if ($Warnings.Count -eq 0) {
    Write-Host "Success: Nenhuma inconsistencia grave ou padrao de bug detectado nos arquivos JS!" -ForegroundColor Green
} else {
    Write-Host "Alertas de qualidade de codigo encontrados:" -ForegroundColor Yellow
    $Warnings | Format-Table -AutoSize
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "                  FIM DO AUTO-TESTE                       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
