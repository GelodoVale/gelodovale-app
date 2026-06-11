$html = Get-Content "index.html" -Raw

function CheckBalance($startTag, $endTag, $name) {
    $startIndex = $html.IndexOf($startTag)
    if ($endTag) {
        $endIndex = $html.IndexOf($endTag)
    } else {
        $endIndex = $html.Length
    }

    if ($startIndex -ge 0 -and $endIndex -gt $startIndex) {
        $subSection = $html.Substring($startIndex, $endIndex - $startIndex)
        $opens = [regex]::Matches($subSection, "(?i)<div\b").Count
        $closes = [regex]::Matches($subSection, "(?i)</div>").Count
        Write-Host "--- $name ---"
        Write-Host "Aberturas de <div: $opens"
        Write-Host "Fechamentos de </div: $closes"
        Write-Host "Diferença (esperado 1): $($opens - $closes)"
    } else {
        Write-Host "Erro ao encontrar tags para $name"
    }
}

CheckBalance '<div id="tab-seguranca-backup"' '<div id="tab-usuarios"' "Segurança e Backup"
CheckBalance '<div id="tab-usuarios"' '<div id="tab-integracoes"' "Usuários"
CheckBalance '<div id="tab-integracoes"' '<!-- sub-aba:' "Integrações (até próxima sub-aba ou comentário)"
CheckBalance '<div id="tab-integracoes"' '<!--' "Integrações (até próximo comentário)"
