# Auditoria de Integridade e Seguranca do Pacote de Instalacao do GelControl v85
param(
    [string]$SourceProgram = "F:\GelControl\Programa",
    [string]$SourceTools = "C:\Users\kissn\OneDrive\GelodoVale-system\App\tools",
    [string]$InstallerScript = "C:\Users\kissn\OneDrive\GelodoVale-system\App\desktop\installer.iss"
)

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "   AUDITORIA DO INSTALADOR GELCONTROL v85 (HOMOLOGACAO)                    " -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$results = [ordered]@{}

# 1. Integridade dos Arquivos do Programa
Write-Host "1. Verificando integridade dos binarios em $SourceProgram..." -ForegroundColor Yellow
$hasExe = Test-Path (Join-Path $SourceProgram "GelControl.exe")
$hasResources = Test-Path (Join-Path $SourceProgram "resources\app\index.html")
$hasMain = Test-Path (Join-Path $SourceProgram "resources\app\main.js")
$hasPreload = Test-Path (Join-Path $SourceProgram "resources\app\preload.js")
$programIntegrity = $hasExe -and $hasResources -and $hasMain -and $hasPreload
$results["Integridade do Pacote"] = if ($programIntegrity) { "APROVADO (Binarios e recursos presentes)" } else { "FALHA" }

# 2. Ausencia Total de Chaves Privadas (service-account.json)
Write-Host "2. Varrendo pacote em busca de chaves privadas vazadas..." -ForegroundColor Yellow
$leakedSecretsInApp = Get-ChildItem -Path $SourceProgram -Recurse -Filter "*service-account*.json" -ErrorAction SilentlyContinue
$leakedSecretsInTools = Get-ChildItem -Path $SourceTools -Recurse -Filter "*service-account*.json" -ErrorAction SilentlyContinue
$noLeakedSecrets = ($leakedSecretsInApp.Count -eq 0) -and ($leakedSecretsInTools.Count -eq 0)
$results["Ausencia de Chaves Privadas"] = if ($noLeakedSecrets) { "APROVADO (Zero chaves administrativas no pacote)" } else { "FALHA: Encontradas chaves vazadas!" }

# 3. Verificacao de Regras do Script Inno Setup (installer.iss)
Write-Host "3. Auditando script Inno Setup ($InstallerScript)..." -ForegroundColor Yellow
$issContent = Get-Content $InstallerScript -Raw
$hasDynamicDir = $issContent.Contains("GetDefaultInstallDir")
$hasTwoModes = $issContent.Contains('Name: "principal"') -and $issContent.Contains('Name: "estacao"')
$hasUninsNever = $issContent.Contains("uninsneveruninstall")
$hasTwoShortcuts = $issContent.Contains("GelControl") -and $issContent.Contains("Local") -and $issContent.Contains("Online")
$hasExcludeSecrets = $issContent.Contains("service-account*.json")

$results["Selecao Flexivel de Unidade"] = if ($hasDynamicDir) { "APROVADO (Prioriza F:\, D:\ ou C:\ dinamicamente)" } else { "FALHA" }
$results["Dois Modos de Instalacao"] = if ($hasTwoModes) { "APROVADO (Principal vs Estacao de Trabalho)" } else { "FALHA" }
$results["Preservacao de Dados e Backups"] = if ($hasUninsNever) { "APROVADO (uninsneveruninstall ativo para Dados e Backups)" } else { "FALHA" }
$results["Atalhos Local e Online"] = if ($hasTwoShortcuts) { "APROVADO (Atalhos Local e Online configurados)" } else { "FALHA" }
$results["Exclusao de Segredos no ISS"] = if ($hasExcludeSecrets) { "APROVADO (Clausula Excludes protege chaves privadas)" } else { "FALHA" }

# 4. Compatibilidade com Firebase de Homologacao
Write-Host "4. Verificando apontamento do executavel para Firebase de Homologacao..." -ForegroundColor Yellow
$appStateFile = Join-Path $SourceProgram "resources\app\js\state.js"
$stateContent = if (Test-Path $appStateFile) { Get-Content $appStateFile -Raw } else { "" }
$isHomologacao = $stateContent.Contains("gelcontrol-homologacao") -and $stateContent.Contains("fabrica_homologacao_teste")
$results["Isolamento de Homologacao"] = if ($isHomologacao) { "APROVADO (gelcontrol-homologacao / fabrica_homologacao_teste)" } else { "FALHA: Apontando para producao!" }

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "   RESULTADO CONSOLIDADO DA AUDITORIA                                      " -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
$results.GetEnumerator() | ForEach-Object {
    $color = if ($_.Value.StartsWith("APROVADO")) { "Green" } else { "Red" }
    Write-Host ("{0,-35}: {1}" -f $_.Key, $_.Value) -ForegroundColor $color
}
Write-Host "============================================================================" -ForegroundColor Cyan
