$root = "C:\Users\Escritório\OneDrive\GelodoVale-system\App"
$extensions = @('*.html','*.js','*.css')
$replacements = @{
    'Ã§' = 'ç'
    'Ã£' = 'ã'
    'Ã¡' = 'á'
    'Ã¢' = 'â'
    'Ãª' = 'ê'
    'Ã´' = 'ô'
    'Ãµ' = 'õ'
    'Ãº' = 'ú'
    'Ã‰' = 'É'
    'Ã­' = 'í'
    'Ã³' = 'ó'
    'Ã' = 'Í'
    'Ã‡' = 'Ç'
    'Ã¶' = 'ö'
    'Ã±' = 'ñ'
    'Ã¼' = 'ü'
    'Ã¨' = 'è'
    'Ã©' = 'é'
    'Ã¹' = 'ù'
    'Ã»' = 'û'
    'Ãœ' = 'Ü'
    'Ã–' = 'Ö'
    'Ã‘' = 'Ñ'
    # add any other known garbled combos here
}
Get-ChildItem -Path $root -Recurse -Include $extensions -File | ForEach-Object {
    $content = Get-Content -Path $_.FullName -Raw -Encoding UTF8
    $fixed = $content
    foreach ($k in $replacements.Keys) {
        $fixed = $fixed -replace [regex]::Escape($k), $replacements[$k]
    }
    if ($fixed -ne $content) {
        Set-Content -Path $_.FullName -Value $fixed -Encoding UTF8
        Write-Host "Corrigido: $($_.FullName)"
    }
}
