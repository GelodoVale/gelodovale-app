$userProfile = $env:USERPROFILE
$path = "$userProfile\.gemini\antigravity-ide\brain\60e524c1-361e-4ae7-a0f2-1cfaee58f2aa\.system_generated\logs\transcript.jsonl"
if (Test-Path $path) {
    [System.IO.File]::ReadLines($path) | ForEach-Object {
        $obj = $_ | ConvertFrom-Json
        if ($obj.step_index -ge 730 -and $obj.step_index -le 785) {
            if ($obj.type -eq 'USER_INPUT' -or ($obj.source -eq 'MODEL' -and $obj.type -eq 'PLANNER_RESPONSE')) {
                Write-Output "Step $($obj.step_index) ($($obj.source)): $($obj.content)"
                Write-Output "----------------------------------------"
            }
        }
    }
} else {
    Write-Output "Path not found"
}
