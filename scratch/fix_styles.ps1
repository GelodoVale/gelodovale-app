$content = Get-Content -Raw -Path styles.css
$oldBlock = @"
header.top-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;
}

.header-title h1 {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 0.25rem;
}

.header-title p {
    color: var(--color-text-muted);
    font-size: 0.95rem;
}

.header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}
"@

# Replace the first occurrence of the old block with an empty string
# Normalize CRLF
$normalizedContent = $content -replace "`r`n", "`n"
$normalizedOldBlock = $oldBlock -replace "`r`n", "`n"

if ($normalizedContent.Contains($normalizedOldBlock)) {
    $normalizedContent = $normalizedContent.Replace($normalizedOldBlock, "")
    Set-Content -Path styles.css -Value ($normalizedContent -replace "`n", "`r`n") -NoNewline
    Write-Host "Successfully removed the duplicate block."
} else {
    Write-Host "Duplicate block not found in exactly that format. Let's do a substring replace."
}
