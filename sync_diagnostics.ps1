# GelControl Sync Diagnostics & Repair Tool
# Script interativo de diagnóstico e alinhamento do histórico da IDE.

$ErrorActionPreference = "Continue"
$OutputEncoding = [System.Text.Encoding]::UTF8

# 1. Identificação do Computador Atual
$ComputerName = $env:COMPUTERNAME
$UserName = $env:USERNAME
$UserProfile = $env:USERPROFILE

$IsTrabalho = ($ComputerName -eq "DESKTOP-7D77T6B" -or $UserName -eq "kissn")
$IsCasa = ($ComputerName -eq "DESKTOP-47I1V20" -or $UserName -eq "Escritório")

if ($IsTrabalho) {
    $MachineType = "Trabalho (Pizzaria)"
    $MachineKey = "trabalho"
    $OtherMachineKey = "casa"
} elseif ($IsCasa) {
    $MachineType = "Casa"
    $MachineKey = "casa"
    $OtherMachineKey = "trabalho"
} else {
    $MachineType = "Desconhecido"
    $MachineKey = "desconhecido"
    $OtherMachineKey = "outro"
}

# 2. Detecção Dinâmica do OneDrive
function Get-OneDrivePath {
    if ($env:OneDrive) {
        return $env:OneDrive
    } elseif ($env:OneDriveConsumer) {
        return $env:OneDriveConsumer
    } elseif (Test-Path "$UserProfile\OneDrive") {
        return "$UserProfile\OneDrive"
    } elseif (Test-Path "$UserProfile\OneDrive - Personal") {
        return "$UserProfile\OneDrive - Personal"
    } else {
        # Tentar ler do registro
        $regPath = "HKCU:\Software\Microsoft\OneDrive"
        if (Test-Path $regPath) {
            $val = Get-ItemPropertyValue -Path $regPath -Name "UserFolder" -ErrorAction SilentlyContinue
            if ($val) { return $val }
        }
    }
    return $null
}

$OneDriveBase = Get-OneDrivePath

# 3. Definição de Caminhos
$Pastas = @("antigravity", "antigravity-ide")
$StatusFileName = "sync_status_$MachineKey.json"
$OtherStatusFileName = "sync_status_$OtherMachineKey.json"

# Caminho do status no OneDrive (usado para checar a sincronização da outra máquina)
if ($OneDriveBase) {
    $OneDriveStatusPath = "$OneDriveBase\antigravity-ide\$StatusFileName"
    $OtherOneDriveStatusPath = "$OneDriveBase\antigravity-ide\$OtherStatusFileName"
} else {
    $OneDriveStatusPath = $null
    $OtherOneDriveStatusPath = $null
}

# 4. Função para obter o destino de uma Junction
function Get-JunctionTarget {
    param([string]$path)
    if (Test-Path $path) {
        $item = Get-Item $path -ErrorAction SilentlyContinue
        if ($item -and ($item.Attributes -match "ReparsePoint")) {
            if ($item.Target) {
                return $item.Target
            }
            # Fallback robusto usando cmd/fsutil caso Target venha vazio
            $query = cmd /c "fsutil reparsepoint query `"$path`"" 2>$null
            foreach ($line in $query) {
                if ($line -like "*Destino:*") {
                    return ($line -split "Destino:")[1].Trim()
                }
                if ($line -like "*Print Name:*") {
                    return ($line -split "Print Name:")[1].Trim()
                }
                if ($line -like "*Substitute Name:*") {
                    return ($line -split "Substitute Name:")[1].Trim()
                }
            }
        }
    }
    return $null
}

# 5. Painel Principal de Diagnóstico
function Show-Dashboard {
    Clear-Host
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "          GELCONTROL - MONITOR DE SINCRONIZACAO           " -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  Este Computador: $MachineType ($ComputerName)" -ForegroundColor Yellow
    Write-Host "  Usuário Atual:   $UserName" -ForegroundColor Yellow
    Write-Host "  OneDrive Base:   $(if ($OneDriveBase) { $OneDriveBase } else { 'NAO ENCONTRADO!' })" -ForegroundColor $(if ($OneDriveBase) { 'Green' } else { 'Red' })
    Write-Host "==========================================================" -ForegroundColor Cyan

    # A. Verificação de Processos
    $IdeProcess = Get-Process -Name "Antigravity IDE" -ErrorAction SilentlyContinue
    $OneDriveProcess = Get-Process -Name "OneDrive" -ErrorAction SilentlyContinue

    Write-Host "[PROCESSOS]" -ForegroundColor White
    if ($IdeProcess) {
        Write-Host "  [-] Antigravity IDE: " -NoNewline
        Write-Host "ABERTA (ATENÇÃO: pode travar arquivos!)" -ForegroundColor Red
    } else {
        Write-Host "  [+] Antigravity IDE: " -NoNewline
        Write-Host "FECHADA (Seguro para sincronizar)" -ForegroundColor Green
    }

    if ($OneDriveProcess) {
        Write-Host "  [+] Processo OneDrive: " -NoNewline
        Write-Host "EM EXECUÇÃO" -ForegroundColor Green
    } else {
        Write-Host "  [-] Processo OneDrive: " -NoNewline
        Write-Host "NÃO ENCONTRADO! (Sua nuvem pode estar offline)" -ForegroundColor Red
    }
    Write-Host "----------------------------------------------------------" -ForegroundColor Gray

    # B. Verificação das Junctions
    Write-Host "[ATALHOS / JUNCTIONS LOCAL]" -ForegroundColor White
    $JunctionsOk = $true
    foreach ($pasta in $Pastas) {
        $localPath = "$UserProfile\.gemini\$pasta"
        $expectedTarget = "$OneDriveBase\$pasta"
        $target = Get-JunctionTarget $localPath

        Write-Host "  Pasta: $pasta"
        if (-not (Test-Path $localPath)) {
            Write-Host "    Status: " -NoNewline
            Write-Host "NÃO EXISTE LOCALMENTE!" -ForegroundColor Red
            $JunctionsOk = $false
        } elseif (-not $target) {
            Write-Host "    Status: " -NoNewline
            Write-Host "PASTA NORMAL (Não está vinculada ao OneDrive!)" -ForegroundColor Red
            $JunctionsOk = $false
        } else {
            Write-Host "    Destino: $target" -ForegroundColor Gray
            if ($target.ToLower().Trim('\') -eq $expectedTarget.ToLower().Trim('\')) {
                Write-Host "    Status: " -NoNewline
                Write-Host "CORRETO & VINCULADO" -ForegroundColor Green
            } else {
                Write-Host "    Status: " -NoNewline
                Write-Host "INCORRETO! (Deveria apontar para $expectedTarget)" -ForegroundColor Red
                $JunctionsOk = $false
            }
        }
    }
    Write-Host "----------------------------------------------------------" -ForegroundColor Gray

    # C. Status de Sincronização Cruzada (OneDrive)
    Write-Host "[STATUS DE SINCRONIZACAO CRUZADA (NUVEM)]" -ForegroundColor White
    
    # Grava o status local antes de ler
    Update-LocalStatus $JunctionsOk ([bool]$IdeProcess)

    # Lê o status do outro computador
    if ($OtherOneDriveStatusPath -and (Test-Path $OtherOneDriveStatusPath)) {
        try {
            $otherStatus = Get-Content $OtherOneDriveStatusPath -Raw | ConvertFrom-Json
            $lastTime = [DateTime]$otherStatus.LastActive
            $minutesAgo = [Math]::Round(((Get-Date) - $lastTime).TotalMinutes)
            
            Write-Host "  Outro PC ($($otherStatus.MachineType)):" -ForegroundColor Yellow
            Write-Host "    Último Sinal: " -NoNewline
            Write-Host "$($otherStatus.LastActive) ($minutesAgo minutos atrás)" -ForegroundColor Green
            
            if ($otherStatus.IdeRunning) {
                Write-Host "    Alerta: A IDE está ABERTA lá. Feche a IDE lá para que o OneDrive envie tudo." -ForegroundColor Red
            } else {
                Write-Host "    Status IDE: Fechada lá (Nuvem atualizada)" -ForegroundColor Green
            }

            if (-not $otherStatus.JunctionsOk) {
                Write-Host "    Aviso: O outro computador está com problemas de Junctions!" -ForegroundColor Red
            }
        } catch {
            Write-Host "  [-] Erro ao ler metadados do outro computador no OneDrive." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [-] Sem sinal do outro computador na nuvem ainda." -ForegroundColor Yellow
        Write-Host "      (Certifique-se de rodar este script em ambos os PCs pelo menos uma vez)" -ForegroundColor Gray
    }
    
    Write-Host "==========================================================" -ForegroundColor Cyan
}

# 6. Grava status local no OneDrive
function Update-LocalStatus {
    param(
        [bool]$junctionsOk,
        [bool]$ideRunning
    )

    if (-not $OneDriveStatusPath) { return }

    $status = @{
        MachineName = $ComputerName
        UserName    = $UserName
        MachineType = $MachineType
        LastActive  = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        JunctionsOk = $junctionsOk
        IdeRunning  = $ideRunning
    }

    try {
        # Garante que a pasta destino no OneDrive existe
        $destDir = Split-Path $OneDriveStatusPath
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        $status | ConvertTo-Json | Set-Content -Path $OneDriveStatusPath -Force
    } catch {
        # Falha silenciosa se o arquivo estiver temporariamente travado
    }
}

# 7. Função de Correção Automática (Reparar Junctions)
function Repair-Junctions {
    Write-Host "`nIniciando reparo de conexões..." -ForegroundColor Yellow

    # A. Fechar IDE se necessário
    $IdeProcess = Get-Process -Name "Antigravity IDE" -ErrorAction SilentlyContinue
    if ($IdeProcess) {
        Write-Host "A Antigravity IDE está aberta e bloqueando arquivos." -ForegroundColor Red
        $confirm = Read-Host "Deseja fechar a IDE automaticamente agora? (S/N)"
        if ($confirm -eq "S" -or $confirm -eq "s") {
            Stop-Process -Name "Antigravity IDE" -Force
            Start-Sleep -Seconds 2
            Write-Host "IDE encerrada com sucesso." -ForegroundColor Green
        } else {
            Write-Host "Reparo cancelado pelo usuário devido à IDE estar aberta." -ForegroundColor Yellow
            return
        }
    }

    # B. Validar OneDrive
    if (-not $OneDriveBase) {
        Write-Host "[ERRO] Não foi possível detectar o caminho do OneDrive neste computador!" -ForegroundColor Red
        return
    }

    # C. Corrigir cada pasta
    foreach ($pasta in $Pastas) {
        $localPath = "$UserProfile\.gemini\$pasta"
        $expectedTarget = "$OneDriveBase\$pasta"
        
        Write-Host "`nProcessando pasta: $pasta..." -ForegroundColor Yellow

        # Verificar se a pasta no OneDrive existe, senão criar
        if (-not (Test-Path $expectedTarget)) {
            Write-Host "Criando pasta no OneDrive: $expectedTarget" -ForegroundColor Gray
            New-Item -ItemType Directory -Path $expectedTarget -Force | Out-Null
            
            # Se a pasta local já existia e não era Junction, copiar dados antigos para o OneDrive
            if ((Test-Path $localPath) -and -not (Get-JunctionTarget $localPath)) {
                Write-Host "Copiando dados locais antigos para o OneDrive..." -ForegroundColor Gray
                Copy-Item -Path "$localPath\*" -Destination $expectedTarget -Recurse -Force -ErrorAction SilentlyContinue
            }
        }

        # Verificar se existe localmente e remover se incorreto
        if (Test-Path $localPath) {
            $currentTarget = Get-JunctionTarget $localPath
            if ($currentTarget) {
                if ($currentTarget.ToLower().Trim('\') -ne $expectedTarget.ToLower().Trim('\')) {
                    Write-Host "Junction apontando para lugar errado ($currentTarget). Removendo..." -ForegroundColor Yellow
                    # Remover Junction (remover o atalho sem deletar os arquivos da nuvem)
                    # No Windows, rmdir ou cmd/c rmdir remove apenas a Junction sem afetar o destino.
                    cmd /c "rmdir `"$localPath`""
                } else {
                    Write-Host "Junction correta já configurada para $pasta." -ForegroundColor Green
                    continue
                }
            } else {
                # Pasta normal. Renomear para backup para segurança
                $myDate = (Get-Date).ToString("yyyy-MM-dd-HH-mm-ss")
                $backupPath = "$UserProfile\.gemini\$pasta-backup-$myDate"
                Write-Host "Pasta normal detectada. Fazendo backup para $backupPath..." -ForegroundColor Yellow
                Rename-Item -Path $localPath -NewName (Split-Path $backupPath -Leaf) -Force
            }
        }

        # Criar a Junction
        Write-Host "Criando atalho Junction: $localPath -> $expectedTarget" -ForegroundColor Green
        cmd /c "mklink /J `"$localPath`" `"$expectedTarget`""
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Junction para $pasta criada com SUCESSO!" -ForegroundColor Green
        } else {
            Write-Host "[ERRO] Falha ao criar Junction para $pasta. Tente rodar o script como Administrador." -ForegroundColor Red
        }
    }

    # Atualizar status após reparo
    Update-LocalStatus $true $false
    Write-Host "`nProcedimento de alinhamento concluído!" -ForegroundColor Cyan
}

# 8. Varredura de Conversas e Histórico de Chat
function Invoke-ConversationScan {
    Write-Host "`n==========================================================" -ForegroundColor Cyan
    Write-Host "         VARREDURA DE CONVERSAS E HISTORICO DE CHAT       " -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan

    if (-not $OneDriveBase) {
        Write-Host "[ERRO] OneDrive nao detectado. Impossivel varrer a nuvem." -ForegroundColor Red
        Read-Host "Pressione Enter para continuar..."
        return
    }

    $onedriveConvsPath = "$OneDriveBase\antigravity-ide\conversations"
    $localConvsPath = "$UserProfile\.gemini\antigravity-ide\conversations"

    if (-not (Test-Path $onedriveConvsPath)) {
        Write-Host "Nenhuma conversa encontrada no OneDrive ainda." -ForegroundColor Yellow
        Read-Host "Pressione Enter para continuar..."
        return
    }

    Write-Host "Buscando conversas no OneDrive..." -ForegroundColor Gray
    $dbFiles = Get-ChildItem -Path "$onedriveConvsPath\*.db" -ErrorAction SilentlyContinue

    if (-not $dbFiles -or $dbFiles.Count -eq 0) {
        Write-Host "Nenhum arquivo de conversa (.db) encontrado no OneDrive." -ForegroundColor Yellow
        Read-Host "Pressione Enter para continuar..."
        return
    }

    $results = @()
    foreach ($file in $dbFiles) {
        $id = $file.BaseName
        $onedriveTime = $file.LastWriteTime
        
        $localFile = "$localConvsPath\$id.db"
        $localTimeStr = "Nao existe"
        $syncStatus = "Pendente"

        if (Test-Path $localFile) {
            $localTime = (Get-Item $localFile).LastWriteTime
            $localTimeStr = $localTime.ToString("yyyy-MM-dd HH:mm:ss")
            
            if ([Math]::Abs(($localTime - $onedriveTime).TotalSeconds) -lt 5) {
                $syncStatus = "Sincronizado"
            } else {
                $syncStatus = "Desalinhado"
            }
        }

        # Tentar extrair prévia da conversa do transcript.jsonl
        $preview = "Sem previa disponivel"
        $transcriptPath = "$OneDriveBase\antigravity-ide\brain\$id\.system_generated\logs\transcript.jsonl"
        if (Test-Path $transcriptPath) {
            try {
                $lines = Get-Content $transcriptPath -ErrorAction SilentlyContinue
                foreach ($line in $lines) {
                    $json = $line | ConvertFrom-Json -ErrorAction SilentlyContinue
                    if ($json -and $json.source -eq "USER_EXPLICIT" -and $json.content -match "(?s)<USER_REQUEST>(.*?)</USER_REQUEST>") {
                        $preview = $Matches[1].Trim() -replace "\s+", " "
                        if ($preview.Length -gt 35) {
                            $preview = $preview.Substring(0, 35) + "..."
                        }
                        break
                    }
                }
            } catch {}
        }

        $isLocked = "Nao"
        if (Test-Path "$onedriveConvsPath\$id.db-wal") {
            $isLocked = "Sim (Aberta)"
        }

        $results += [PSCustomObject]@{
            "ID da Conversa"       = $id.Substring(0, 8) + "..."
            "Previa/Inicio"        = $preview
            "Ultima Alteracao (Nuvem)" = $onedriveTime.ToString("yyyy-MM-dd HH:mm:ss")
            "Sincronia"            = $syncStatus
            "Ativa Agora"          = $isLocked
            "FullID"               = $id
        }
    }

    $results = $results | Sort-Object "Ultima Alteracao (Nuvem)" -Descending
    $results | Format-Table -Property "ID da Conversa", "Previa/Inicio", "Ultima Alteracao (Nuvem)", "Sincronia", "Ativa Agora" -AutoSize

    $latest = $results[0]
    Write-Host "`n[DIAGNOSTICO DE DIVERGENCIA]" -ForegroundColor White
    if ($latest) {
        Write-Host "  -> A conversa ativa mais recente na nuvem e: " -NoNewline
        Write-Host "$($latest.FullID) ($($latest.'Previa/Inicio'))" -ForegroundColor Green
        
        if ($latest.Sincronia -eq "Pendente") {
            Write-Host "  [ALERTA] Esta conversa ainda nao foi baixada localmente nesta maquina!" -ForegroundColor Red
            Write-Host "           Certifique-se de que o OneDrive esta rodando para baixar o arquivo." -ForegroundColor Yellow
        } elseif ($latest.Sincronia -eq "Desalinhado") {
            Write-Host "  [AVISO] Os arquivos diferem entre local e nuvem." -ForegroundColor Yellow
            Write-Host "          Feche a IDE nesta maquina para permitir que o OneDrive atualize." -ForegroundColor Gray
        } else {
            Write-Host "  [OK] A conversa mais recente esta alinhada localmente nesta maquina." -ForegroundColor Green
        }
    }

    Write-Host "`n💡 Dica: Para alternar para a conversa correta na IDE:" -ForegroundColor Cyan
    Write-Host "   1. Clique no icone de 'Historico de Conversas' (relogio/lista) no canto superior do chat da IDE." -ForegroundColor Gray
    Write-Host "   2. Procure pela conversa com a previa correspondente ou ID inicial '$($latest.FullID.Substring(0,8))' e clique nela." -ForegroundColor Gray

    Write-Host "==========================================================" -ForegroundColor Cyan
    Read-Host "Pressione Enter para voltar ao menu..."
}

# 9. Loop do Menu
do {
    Show-Dashboard
    Write-Host "`nMenu de Opcoes:" -ForegroundColor White
    Write-Host "1. Atualizar Diagnostico (Recarregar)" -ForegroundColor Gray
    Write-Host "2. Fazer Varredura de Conversas Recentes (OneDrive vs Local)" -ForegroundColor Cyan
    Write-Host "3. Reparar e Alinhar Conexoes (Corrigir Atalhos/Junctions)" -ForegroundColor Green
    Write-Host "4. Forcar Encerramento da IDE local" -ForegroundColor Yellow
    Write-Host "5. Testar Gravacao de Arquivo no OneDrive" -ForegroundColor Gray
    Write-Host "6. Sair" -ForegroundColor Red
    
    $choice = Read-Host "`nDigite a opcao desejada (1-6)"
    
    if ([string]::IsNullOrEmpty($choice)) {
        Write-Host "Fluxo de entrada finalizado. Saindo..." -ForegroundColor Yellow
        break
    }
    
    switch ($choice) {
        "1" { 
            # Apenas recarrega
        }
        "2" { Invoke-ConversationScan }
        "3" { Repair-Junctions }
        "4" {
            $IdeProcess = Get-Process -Name "Antigravity IDE" -ErrorAction SilentlyContinue
            if ($IdeProcess) {
                Stop-Process -Name "Antigravity IDE" -Force
                Write-Host "IDE encerrada." -ForegroundColor Green
                Start-Sleep -Seconds 2
            } else {
                Write-Host "A IDE ja esta fechada." -ForegroundColor Green
                Start-Sleep -Seconds 1
            }
        }
        "5" {
            if ($OneDriveBase) {
                $testFile = "$OneDriveBase\antigravity-ide\test_write.txt"
                try {
                    "Teste de gravacao as $(Get-Date)" | Set-Content -Path $testFile -ErrorAction Stop
                    Write-Host "Gravacao realizada com sucesso! Teste o arquivo em: $testFile" -ForegroundColor Green
                    Remove-Item $testFile -ErrorAction SilentlyContinue
                } catch {
                    Write-Host "[ERRO] Falha ao gravar no OneDrive: $_" -ForegroundColor Red
                }
            } else {
                Write-Host "[ERRO] OneDrive nao esta configurado." -ForegroundColor Red
            }
            Read-Host "Pressione Enter para continuar..."
        }
    }
} while ($choice -ne "6")
