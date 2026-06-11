$filePath = "index.html"
$content = [System.IO.File]::ReadAllText($filePath)

$pattern = '(?ms)(<button[^>]*onclick="generateBackup\(\)"[^>]*>.*?<\/button>\s*<\/div>\s*)(<\/div>\s*<\/div>)'
$replacement = '$1</div>$2'

if ($content -match $pattern) {
    $newContent = [regex]::Replace($content, $pattern, $replacement)
    [System.IO.File]::WriteAllText($filePath, $newContent)
    Write-Host "Sucesso: A tag div de fechamento foi adicionada com sucesso!"
} else {
    Write-Host "Erro: Não foi possível encontrar a tag correspondente no index.html!"
}
