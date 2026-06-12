$logPath = Join-Path $env:USERPROFILE ".gemini\antigravity-ide\brain\33817b2d-75bc-4a80-9059-8140f470854e\.system_generated\logs\transcript.jsonl"
$lines = Get-Content $logPath
foreach ($line in $lines) {
    if ($line.Contains('"step_index":3313')) {
        Write-Host $line
    }
}
