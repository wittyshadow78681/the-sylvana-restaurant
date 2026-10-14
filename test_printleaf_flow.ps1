# ==============================================================================
# The Sylvana Restaurant - 500-Taka Printed Leaflet & In-Line Admin Test Suite
# ==============================================================================

$ErrorActionPreference = "Continue"
$testPort = 5103
$baseUrl = "http://localhost:$testPort"
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   SYLVANA 500-TAKA PRINT LEAFLET DEEP VERIFICATION       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$procInfo = New-Object System.Diagnostics.ProcessStartInfo
$procInfo.FileName = Join-Path $PSScriptRoot "NexusServer.exe"
$procInfo.Arguments = "$testPort"
$procInfo.WorkingDirectory = $PSScriptRoot
$procInfo.UseShellExecute = $false
$procInfo.CreateNoWindow = $true
$proc = [System.Diagnostics.Process]::Start($procInfo)

Start-Sleep -Milliseconds 1200

$script:testsPassed = 0
$script:testsFailed = 0

function Assert-Leaflet([bool]$condition, [string]$testName) {
    if ($condition) {
        Write-Host "  PASS: $testName" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "  FAIL: $testName" -ForegroundColor Red
        $script:testsFailed++
    }
}

try {
    # 1. Structural Verification: No Top Navigation Bar & Pure 3-Part Flow
    Write-Host "`n[1/5] Verifying 3-Part Leaflet Structure & No Top Navigation..." -ForegroundColor Yellow
    $indexRes = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing
    Assert-Leaflet ($indexRes.StatusCode -eq 200) "GET / serves index.html (200 OK)"

    # Verify no header navigation bar
    $hasTopNav = ($indexRes.Content -like "*<nav*" -or $indexRes.Content -like "*class=`"navbar*")
    Assert-Leaflet (-not $hasTopNav) "Index contains NO top navigation bar (Clean printleaf format)"

    # Verify 1st Part (Top): Restaurant Intro
    Assert-Leaflet ($indexRes.Content -like "*id=`"restaurantIntro`"*") "1st Part: Restaurant Intro section present (#restaurantIntro)"
    Assert-Leaflet ($indexRes.Content -like "*assets/sylvana-logo.png*") "Intro features framed Sylvana crest logo"
    Assert-Leaflet ($indexRes.Content -like "*The Sylvana Restaurant*") "Intro features English brand name"
    Assert-Leaflet ($indexRes.Content -like "*Sylvana*") "Intro contains Sylvana brand"
    Assert-Leaflet ($indexRes.Content -like "*HALAL*") "Intro features Halal crest ribbon"

    # Verify 2nd Part (Middle): The Menu
    Assert-Leaflet ($indexRes.Content -like "*id=`"restaurantMenu`"*") "2nd Part: The Menu section present (#restaurantMenu)"
    Assert-Leaflet ($indexRes.Content -like "*class=`"menu-columns`"*") "Menu uses printed card columns layout"
    Assert-Leaflet ($indexRes.Content -like "*class=`"dish-dots`"*") "Menu includes dotted price leaders (.dish-dots)"
    Assert-Leaflet ($indexRes.Content -like "*Mutton Kacchi Biryani*") "Menu features signature Mutton Kacchi Biryani"
    Assert-Leaflet ($indexRes.Content -like "*Paratha with Bhaji*") "Menu features breakfast Paratha with Bhaji"
    Assert-Leaflet ($indexRes.Content -like "*Beef Tehari*") "Menu features authentic Beef Tehari"
    Assert-Leaflet ($indexRes.Content -like "*Mango Lassi*") "Menu features refreshing Mango Lassi"

    # Verify 3rd Part (Last): Contact & Details
    Assert-Leaflet ($indexRes.Content -like "*id=`"restaurantContact`"*") "3rd Part: Contact & Details section present (#restaurantContact)"
    Assert-Leaflet ($indexRes.Content -like "*10, Shahbagh Biponi Bithan, Dhaka-1000*") "Contact contains exact Shahbagh address"
    Assert-Leaflet ($indexRes.Content -like "*+8801734489275*") "Contact contains official hotline phone"
    Assert-Leaflet ($indexRes.Content -like "*sylvanarestaurantbd@gmail.com*") "Contact contains official email address"
    Assert-Leaflet ($indexRes.Content -like "*7:00 AM*11:30 PM*") "Contact contains operating hours (7 AM - 11:30 PM)"

    # 2. Graphic Print Quality & Design System
    Write-Host "`n[2/5] Verifying 500-Taka Graphic Design Details..." -ForegroundColor Yellow
    Assert-Leaflet ($indexRes.Content -like "*corner-ornament*") "Includes antique gold corner ornaments (SVG filigree)"
    Assert-Leaflet ($indexRes.Content -like "*printleaf-divider*") "Includes ornamental printleaf dividers"
    Assert-Leaflet ($indexRes.Content -like "*leaflet-colophon*") "Includes realistic print leaflet colophon with Halal pills"

    $cssRes = Invoke-WebRequest -Uri "$baseUrl/css/style.css" -UseBasicParsing
    Assert-Leaflet ($cssRes.StatusCode -eq 200) "GET /css/style.css delivers stylesheet"
    Assert-Leaflet ($cssRes.Content -like "*--leaf-border-gold: #C5A059*") "Stylesheet defines luxury gold border: #C5A059"
    Assert-Leaflet ($cssRes.Content -like "*--leaf-crimson: #8B1E0F*") "Stylesheet defines traditional crimson accent: #8B1E0F"
    Assert-Leaflet ($cssRes.Content -like "*dish-dots*") "Stylesheet defines dotted price leader styling"
    Assert-Leaflet ($cssRes.Content -like "*@media print*") "Stylesheet includes physical print media rules (@media print)"
    Assert-Leaflet ($cssRes.Content -like "*break-inside: avoid*") "Print stylesheet guards dish cards against page break splitting"
    Assert-Leaflet ($cssRes.Content -like "*pointer-events: none*") "Admin mode isolates contact links against navigation during in-line edit"

    # 3. Subdomain /admin & In-Line Content Edit Suite
    Write-Host "`n[3/5] Verifying /admin In-Line Content Edit Suite..." -ForegroundColor Yellow
    $adminRes = Invoke-WebRequest -Uri "$baseUrl/admin" -UseBasicParsing
    Assert-Leaflet ($adminRes.StatusCode -eq 200) "GET /admin resolves with status 200 OK"
    Assert-Leaflet ($adminRes.Content -like "*admin-floating-dock*") "/admin includes floating admin toolbar (#adminDock)"
    Assert-Leaflet ($adminRes.Content -like "*btnSaveLeaflet*") "/admin includes 'Save Changes' action button"
    Assert-Leaflet ($adminRes.Content -like "*authModalOverlay*") "/admin includes authentication modal dialog"
    Assert-Leaflet ($adminRes.Content -like "*js/admin.js*") "/admin references admin.js controller script"
    Assert-Leaflet (-not ($indexRes.Content -like "*js/admin.js*")) "Public index.html isolates admin script (pure lightweight leaflet)"

    $adminJsRes = Invoke-WebRequest -Uri "$baseUrl/js/admin.js" -UseBasicParsing
    Assert-Leaflet ($adminJsRes.Content -like "*normalizeDigits*") "admin.js provides Bengali digit normalizer (০-৯ -> 0-9)"
    Assert-Leaflet ($adminJsRes.Content -like "*handlePastePlain*") "admin.js includes clipboard paste plain-text sanitizer"
    Assert-Leaflet ($adminJsRes.Content -like "*handleSingleLineKeydown*") "admin.js guards single-line fields against Enter key linebreaks"
    Assert-Leaflet ($adminJsRes.Content -like "*if (!isAdminPage)*") "admin.js strictly gates in-line editing to authenticated admin routes"

    # 4. In-Line Admin Authentication & Live Mutation Flow
    Write-Host "`n[4/5] Verifying Admin Auth & In-Line Content Persistence..." -ForegroundColor Yellow
    $loginBody = '{"username":"admin","password":"admin123"}'
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Assert-Leaflet ($loginRes.success -eq $true -and $loginRes.token -like "tok_*") "POST /api/auth/login authenticates 'admin'/'admin123'"

    $token = $loginRes.token
    $authHeader = @{ Authorization = "Bearer $token" }

    # Fetch current content, update a price and tagline, and save
    $content = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Get
    $testTagline = "500-Taka Graphic Edition - Masterfully Crafted Dining in Shahbagh"
    $content.meta.siteTagline = $testTagline
    
    # Update Mutton Kacchi Biryani price to 340
    foreach ($dish in $content.menu.items) {
        if ($dish.name -eq "Mutton Kacchi Biryani") {
            $dish.price = 340
            break
        }
    }

    $updatePayload = $content | ConvertTo-Json -Depth 12
    $putRes = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Put -Body $updatePayload -Headers $authHeader -ContentType "application/json"
    Assert-Leaflet ($putRes.success -eq $true) "In-line update saved via PUT /api/content"

    # Re-fetch publicly without auth
    $refetched = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Get
    Assert-Leaflet ($refetched.meta.siteTagline -eq $testTagline) "Public GET /api/content immediately reflects modified tagline"
    
    $refetchedBiryani = $null
    foreach ($dish in $refetched.menu.items) {
        if ($dish.name -eq "Mutton Kacchi Biryani") {
            $refetchedBiryani = $dish
            break
        }
    }
    Assert-Leaflet ($refetchedBiryani.price -eq 340) "Public GET /api/content reflects updated price (340 BDT)"

    # Restore default content
    $resetRes = Invoke-RestMethod -Uri "$baseUrl/api/content/reset" -Method Post -Headers $authHeader
    Assert-Leaflet ($resetRes.success -eq $true) "Factory content reset restores original values"

    $restored = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Get
    $restoredBiryani = $null
    foreach ($dish in $restored.menu.items) {
        if ($dish.name -eq "Mutton Kacchi Biryani") {
            $restoredBiryani = $dish
            break
        }
    }
    Assert-Leaflet ($restoredBiryani.price -eq 320) "Mutton Kacchi Biryani price restored to 320 BDT"

    # 5. Localhost Server Health & Performance
    Write-Host "`n[5/5] Verifying Server Health & Asset Integrity..." -ForegroundColor Yellow
    $healthRes = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    Assert-Leaflet ($healthRes.status -eq "healthy") "Server health endpoint responds 'healthy'"

    $logoRes = Invoke-WebRequest -Uri "$baseUrl/assets/sylvana-logo.png" -UseBasicParsing
    Assert-Leaflet ($logoRes.StatusCode -eq 200 -and $logoRes.RawContentLength -gt 80000) "Logo asset served cleanly (> 80 KB)"

} finally {
    Write-Host "`nStopping test server on port $testPort..." -ForegroundColor Cyan
    if ($proc -and -not $proc.HasExited) {
        $proc.Kill()
        $proc.WaitForExit(2000)
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   PRINT LEAFLET TEST SUMMARY                             " -ForegroundColor Cyan
Write-Host "   Total Passed: $script:testsPassed" -ForegroundColor Green
Write-Host "   Total Failed: $script:testsFailed" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if ($script:testsFailed -eq 0) {
    Write-Host "ALL 500-TAKA PRINT LEAFLET CHECKS PASSED SUCCESSFULLY!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME CHECKS FAILED!" -ForegroundColor Red
    exit 1
}
