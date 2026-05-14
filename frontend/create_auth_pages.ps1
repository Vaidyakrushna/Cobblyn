$base = "c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\app"
$paths = @("forgot-password", "reset-password", "verify-email")

foreach ($p in $paths) {
    $dir = Join-Path $base $p
    [System.IO.Directory]::CreateDirectory($dir) | Out-Null
    
    $parts = $p.Split('-')
    $compName = ""
    foreach ($part in $parts) {
        $compName += $part.Substring(0,1).ToUpper() + $part.Substring(1)
    }
    
    $content = "import $compName from '../../src/pages/$compName';`nexport default function Page() { return <$compName />; }"
    
    $file = Join-Path $dir "page.js"
    [System.IO.File]::WriteAllText($file, $content)
    Write-Host "Created $file"
}
