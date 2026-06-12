$backupPath = "C:\Users\Escritório\OneDrive\GelodoVale-system\gelodovale_backup_v2.5_2026-06-11_23-20.json"
if (-not (Test-Path $backupPath)) {
    Write-Error "Backup file not found at: $backupPath"
    exit 1
}

$backupJson = Get-Content -Path $backupPath -Raw -Encoding utf8 | ConvertFrom-Json
$stateData = $backupJson.data

# Force update lastUpdated property to be the absolute newest, so it syncs immediately
$timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
if ($stateData.lastUpdated -ne $null) {
    $stateData.lastUpdated = $timestamp
} else {
    $stateData | Add-Member -MemberType NoteProperty -Name "lastUpdated" -Value $timestamp -Force
}

# Force set currentVersion inside backupSettings to 2.5
if ($stateData.backupSettings -eq $null) {
    $backupSettingsObj = [PSCustomObject]@{
        frequencyDays = 7
        lastBackupDate = ""
        currentVersion = "2.5"
    }
    $stateData | Add-Member -MemberType NoteProperty -Name "backupSettings" -Value $backupSettingsObj -Force
} else {
    $stateData.backupSettings.currentVersion = "2.5"
}

# Convert back to JSON with UTF8 encoding
$payload = $stateData | ConvertTo-Json -Depth 100
$url = "https://gelo-do-vale-default-rtdb.firebaseio.com/factories/gelodovale_oficial.json"

# Send PUT request
$response = Invoke-RestMethod -Uri $url -Method Put -Body $payload -ContentType "application/json; charset=utf-8"
Write-Host "Firebase restored to v2.5 successfully. New lastUpdated: $timestamp"
