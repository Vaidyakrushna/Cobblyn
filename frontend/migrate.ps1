$files = @(
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\App.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\pages\admin\AdminDashboard.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\pages\admin\AdminLayout.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\pages\WishlistPage.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\pages\ProductPDP.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\pages\OrderConfirmation.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\pages\ProductListPage.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\pages\MyAccountPage.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\pages\LoginPage.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\pages\CheckoutPage.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\pages\CustomizePage.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\pages\CartPage.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\components\SearchOverlay.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\components\Navigation.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\components\LuxeCollection.js",
"c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\src\components\HeroSlider.js"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        $content = Get-Content $f -Raw
        
        if ($content -match 'react-router-dom') {
            # Replace Link to with Link href
            $content = [regex]::Replace($content, '<Link([^>]*)to=', '<Link$1href=')
            $content = [regex]::Replace($content, '<NavLink([^>]*)to=', '<Link$1href=')
            $content = $content -replace '</NavLink>', '</Link>'
            
            # Replace simple hooks
            $content = $content -replace 'useNavigate\(\)', 'useRouter()'
            $content = $content -replace 'useLocation\(\)', 'usePathname()'
            $content = $content -replace 'const location = useLocation\(\);', 'const pathname = usePathname();'
            $content = $content -replace 'location\.pathname', 'pathname'
            $content = $content -replace 'location\.search', '""'
            $content = $content -replace 'const navigate = useNavigate\(\);', 'const router = useRouter();'
            $content = $content -replace 'navigate\(', 'router.push('
            
            # Extract and replace import
            $pattern = "import\s+\{([^}]+)\}\s+from\s+['""]react-router-dom['""];?"
            if ($content -match $pattern) {
                $matchedImports = $matches[1]
                $replacement = ""
                if ($matchedImports -match "Link" -or $matchedImports -match "NavLink") {
                    $replacement += "import Link from 'next/link';`n"
                }
                $nextNav = @()
                if ($matchedImports -match "useNavigate") { $nextNav += "useRouter" }
                if ($matchedImports -match "useLocation") { $nextNav += "usePathname" }
                if ($matchedImports -match "useParams") { $nextNav += "useParams" }
                
                if ($nextNav.Count -gt 0) {
                    $joined = $nextNav -join ", "
                    $replacement += "import { $joined } from 'next/navigation';`n"
                }
                
                $content = [regex]::Replace($content, $pattern, $replacement)
            }

            Set-Content -Path $f -Value $content -Encoding UTF8
            Write-Host "Migrated $f"
        }
    }
}
