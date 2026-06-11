$content = Get-Content "index.html" -Raw

# We can find all div tags (opening and closing)
$pattern = "(?i)<div[^>]*>|</div>"
$matches = [regex]::Matches($content, $pattern)

$stack = @()
$nested = @()

foreach ($m in $matches) {
    $tag = $m.Value
    if ($tag -eq "</div>") {
        if ($stack.Count -gt 0) {
            $stack = $stack[0..($stack.Count - 2)]
        }
    } else {
        # Extract class
        $class = ""
        if ($tag -match 'class=["'']([^"'']+)["'']') {
            $class = $Matches[1]
        }
        
        # Extract id
        $id = ""
        if ($tag -match 'id=["'']([^"'']+)["'']') {
            $id = $Matches[1]
        }
        
        $isPanel = $class -like "*dashboard-panel*"
        
        if ($isPanel) {
            # Find any open panels in stack
            $openPanels = @()
            foreach ($item in $stack) {
                if ($item.isPanel) {
                    $openPanels += $item.id
                }
            }
            if ($openPanels.Count -gt 0) {
                $nested += [PSCustomObject]@{
                    Panel = $id
                    ParentPanels = $openPanels -join ", "
                }
            }
        }
        
        $stack += @{ isPanel = $isPanel; id = $id }
    }
}

Write-Host "Nested Panels Count: $($nested.Count)"
foreach ($n in $nested) {
    Write-Host "Panel '$($n.Panel)' is nested inside: $($n.ParentPanels)"
}
