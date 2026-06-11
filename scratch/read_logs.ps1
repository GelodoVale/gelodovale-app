$logPath = Join-Path $env:USERPROFILE ".gemini\antigravity-ide\brain\33817b2d-75bc-4a80-9059-8140f470854e\.system_generated\logs\transcript.jsonl"
if (Test-Path $logPath) {
    $lines = Get-Content $logPath
    $errorLines = @()
    foreach ($line in $lines) {
        if ($line.Contains("Uncaught") -or $line.Contains("TypeError") -or $line.Contains("Error") -or $line.Contains("console.error")) {
            $errorLines += $line
        }
    }
    
    # Get the last 15 matching error entries
    $lastErrors = $errorLines | Select-Object -Last 15
    foreach ($line in $lastErrors) {
        try {
            $json = ConvertFrom-Json $line
            Write-Host "=== Error Entry (Step: $($json.step_index)) ==="
            Write-Host $json.content
        } catch {
            Write-Host "Raw match: $line"
        }
    }
} else {
    Write-Host "Log file not found."
}
