$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
try {
    $listener.Start()
    Write-Host "Local server running at http://localhost:8080/"
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response
        
        $rawPath = $req.Url.LocalPath
        if ($rawPath -eq "/") { $rawPath = "/index.html" }
        
        // Remove trailing slashes or correct pathing
        $rawPath = $rawPath.TrimStart('/')
        $filePath = [System.IO.Path]::Combine((Get-Location).Path, $rawPath)
        
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $res.ContentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".js" { "application/javascript; charset=utf-8" }
                ".css" { "text/css; charset=utf-8" }
                ".jpg" { "image/jpeg" }
                ".png" { "image/png" }
                ".json" { "application/json; charset=utf-8" }
                default { "application/octet-stream" }
            }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
            $errorMsg = [System.Text.Encoding]::UTF8.GetBytes("File Not Found: $rawPath")
            $res.OutputStream.Write($errorMsg, 0, $errorMsg.Length)
        }
        $res.Close()
    }
} finally {
    $listener.Stop()
}
