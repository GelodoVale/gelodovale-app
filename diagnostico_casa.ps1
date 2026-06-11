$logPath = Join-Path $PSScriptRoot "diagnostico_casa_resultado.txt"
$report = @()

$report += "=== DIAGNÓSTICO DO PC DE CASA ==="
$report += "Data/Hora: $(Get-Date)"
$report += "Computador: $env:COMPUTERNAME"
$report += "Usuário: $env:USERNAME"
$report += "UserProfile: $env:USERPROFILE"

# 1. Detectar OneDrive
$onedrive = $env:OneDrive
if (!$onedrive) { $onedrive = $env:OneDriveConsumer }
if (!$onedrive) { $onedrive = "$env:USERPROFILE\OneDrive" }
$report += "OneDrive Detectado: $onedrive"

# 2. Verificar pasta local da IDE
$localIde = "$env:USERPROFILE\.gemini\antigravity-ide"
$report += "Caminho Local IDE: $localIde"

if (Test-Path $localIde) {
    $item = Get-Item $localIde
    $report += "Pasta Local Existe: SIM"
    $report += "Atributos: $($item.Attributes)"
    
    # Verificar se é link
    $isJunction = $item.Attributes -like "*ReparsePoint*"
    $report += "É Link/Junction: $isJunction"
    
    if ($isJunction) {
        $target = $item.Target
        $report += "Destino do Link: $target"
    } else {
        $report += "Destino do Link: (Não é link)"
    }
} else {
    $report += "Pasta Local Existe: NÃO"
}

# 3. Verificar backups locais
$geminiDir = "$env:USERPROFILE\.gemini"
if (Test-Path $geminiDir) {
    $backups = Get-ChildItem -Path $geminiDir -Directory -Filter "*backup*"
    $report += "Backups locais encontrados em .gemini: $($backups.Count)"
    foreach ($b in $backups) {
        $report += " - $($b.Name)"
    }
}

# 4. Verificar se a IDE está rodando
$processes = Get-Process -Name "*Antigravity*" -ErrorAction SilentlyContinue
if ($processes) {
    $report += "IDE Rodando: SIM (Processos: $($processes.Count))"
} else {
    $report += "IDE Rodando: NÃO"
}

# 5. Listar arquivos de conversa no OneDrive do PC de casa
$onedriveIdeConversations = "$onedrive\antigravity-ide\conversations"
if (Test-Path $onedriveIdeConversations) {
    $report += "Pasta de conversas no OneDrive existe: SIM"
    $dbFiles = Get-ChildItem -Path $onedriveIdeConversations -Filter "*.db"
    $report += "Quantidade de bancos de dados (.db) na nuvem: $($dbFiles.Count)"
    foreach ($f in $dbFiles) {
        $report += " - $($f.Name) (Modificado: $($f.LastWriteTime), Tamanho: $($f.Length) bytes)"
    }
} else {
    $report += "Pasta de conversas no OneDrive existe: NÃO"
}

# Salvar relatório
$report | Out-File -FilePath $logPath -Encoding utf8 -Force
Write-Host "Diagnóstico concluído! Arquivo gerado em: $logPath" -ForegroundColor Green
