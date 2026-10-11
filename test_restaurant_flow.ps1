$ErrorActionPreference = "Continue"
$testPort = 5101
$baseUrl = "http://localhost:$testPort"
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   THE SYLVANA RESTAURANT DEEP VERIFICATION SUITE         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$procInfo = New-Object System.Diagnostics.ProcessStartInfo
$procInfo.FileName = Join-Path $PSScriptRoot "NexusServer.exe"
$procInfo.Arguments = "$testPort"
$procInfo.WorkingDirectory = $PSScriptRoot
$procInfo.UseShellExecute = $false
$proc = [System.Diagnostics.Process]::Start($procInfo)

Start-Sleep -Milliseconds 1200

$script:testsPassed = 0
$script:testsFailed = 0

function Assert-Check([bool]$condition, [string]$testName) {
    if ($condition) {
        Write-Host "  PASS: $testName" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "  FAIL: $testName" -ForegroundColor Red
        $script:testsFailed++
    }
}

try {
    # 1. Verify Static Assets (Logo and HTML)
    Write-Host "`n[1/6] Verifying Brand Assets..." -ForegroundColor Yellow
    $logoRes = Invoke-WebRequest -Uri "$baseUrl/assets/sylvana-logo.png" -UseBasicParsing
    Assert-Check ($logoRes.StatusCode -eq 200 -and ($logoRes.Headers["Content-Type"] -like "*image/png*" -or $logoRes.ContentType -like "*image/png*")) "GET /assets/sylvana-logo.png delivers valid logo"

    $indexRes = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing
    Assert-Check ($indexRes.StatusCode -eq 200 -and $indexRes.Content -like "*The Sylvana Restaurant*") "GET / serves index.html with Sylvana brand"
    Assert-Check ($indexRes.Content -like "*10, Shahbagh Biponi Bithan*") "Index contains Shahbagh address"
    Assert-Check ($indexRes.Content -like "*+8801734489275*") "Index contains official phone"
    Assert-Check ($indexRes.Content -like "*sylvanarestaurantbd@gmail.com*") "Index contains official email"

    $adminRes = Invoke-WebRequest -Uri "$baseUrl/admin" -UseBasicParsing
    Assert-Check ($adminRes.StatusCode -eq 200 -and $adminRes.Content -like "*The Sylvana Restaurant*") "GET /admin serves Admin Studio"

    # 2. Verify Source Content API
    Write-Host "`n[2/6] Verifying Source Content Model (/api/content)..." -ForegroundColor Yellow
    $content = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Get
    Assert-Check ($content.meta.brandName -eq "The Sylvana Restaurant") "Brand name matches 'The Sylvana Restaurant'"
    Assert-Check ($content.contact.phone -eq "+8801734489275") "Phone matches '+8801734489275'"
    Assert-Check ($content.contact.email -eq "sylvanarestaurantbd@gmail.com") "Email matches 'sylvanarestaurantbd@gmail.com'"
    Assert-Check ($content.contact.address -like "*10, Shahbagh Biponi Bithan, Dhaka-1000, Bangladesh*") "Full address matches Shahbagh Dhaka"

    # 3. Verify ALL 38 Dishes & Categories
    Write-Host "`n[3/6] Verifying Menu Dishes, Pricing and Categories..." -ForegroundColor Yellow
    $items = $content.menu.items
    Assert-Check ($items.Count -ge 38) "Menu contains all 38+ items (Actual: $($items.Count))"

    # Check key categories
    $categories = $content.menu.categories
    Assert-Check ($categories -contains "Breakfast Menu") "Contains 'Breakfast Menu' category"
    Assert-Check ($categories -contains "Tea Item") "Contains 'Tea Item' category"
    Assert-Check ($categories -contains "Soups & Appetizers") "Contains 'Soups & Appetizers' category"
    Assert-Check ($categories -contains "Gourmet Burgers") "Contains 'Gourmet Burgers' category"
    Assert-Check ($categories -contains "Pizza & Pasta") "Contains 'Pizza & Pasta' category"
    Assert-Check ($categories -contains "Traditional Meals & Favourites") "Contains 'Traditional Meals & Favourites' category"
    Assert-Check ($categories -contains "Desserts") "Contains 'Desserts' category"
    Assert-Check ($categories -contains "Tea, Coffee & Refreshments") "Contains 'Tea, Coffee & Refreshments' category"
    Assert-Check ($categories -contains "Lassis, Milkshakes & Juice") "Contains 'Lassis, Milkshakes & Juice' category"

    # Check key dish prices
    $biryani = $null
    $parathaBhaji = $null
    $mangoLassi = $null
    $beefTehari = $null
    $firni = $null
    foreach ($d in $items) {
        if ($d.name -eq "Mutton Kacchi Biryani") { $biryani = $d }
        if ($d.name -eq "Paratha with Bhaji") { $parathaBhaji = $d }
        if ($d.name -eq "Mango Lassi") { $mangoLassi = $d }
        if ($d.name -eq "Beef Tehari") { $beefTehari = $d }
        if ($d.name -like "*Firni*") { $firni = $d }
    }
    Assert-Check ($biryani -ne $null -and $biryani.price -eq 320) "Mutton Kacchi Biryani price is 320 BDT"
    Assert-Check ($parathaBhaji -ne $null -and $parathaBhaji.price -eq 100) "Paratha with Bhaji price is 100 BDT"
    Assert-Check ($mangoLassi -ne $null -and $mangoLassi.price -eq 150) "Mango Lassi price is 150 BDT"
    Assert-Check ($beefTehari -ne $null -and $beefTehari.price -eq 230) "Beef Tehari price is 230 BDT"
    Assert-Check ($firni -ne $null -and $firni.price -eq 100) "Firni price is 100 BDT"

    # 4. Verify Admin Auth & Content Mutation
    Write-Host "`n[4/6] Verifying Admin Authentication and Content Mutation..." -ForegroundColor Yellow
    $loginBody = '{"username":"admin","password":"admin123"}'
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Assert-Check ($loginRes.success -eq $true) "Admin authentication succeeded"
    $token = $loginRes.token
    $authHeader = @{ Authorization = "Bearer $token" }

    # Mutate price from 320 to 350
    $biryani.price = 350
    $updatePayload = $content | ConvertTo-Json -Depth 12
    $putRes = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Put -Body $updatePayload -Headers $authHeader -ContentType "application/json"
    Assert-Check ($putRes.success -eq $true) "Updated Mutton Kacchi Biryani price via Admin API"

    # Re-fetch without auth
    $refetched = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Get
    $refetchedBiryani = $null
    foreach ($it in $refetched.menu.items) {
        if ($it.name -eq "Mutton Kacchi Biryani") { $refetchedBiryani = $it; break }
    }
    Assert-Check ($refetchedBiryani.price -eq 350) "Public GET /api/content immediately reflects price 350"

    # 5. Verify Table Reservation & Order Inquiry Submission
    Write-Host "`n[5/6] Verifying Table Reservation and Inquiries..." -ForegroundColor Yellow
    $reservationPayload = '{"name":"Ahmed Zaman","email":"ahmed.zaman@du.ac.bd","subject":"[Table Reservation] 4 Persons (Today 8:00 PM)","message":"Phone: +8801819283746\nGuests: 4 Persons\nDishes: 2x Mutton Kacchi Biryani, 1x Beef Bhuna Khichuri, 2x Firni"}'

    $resSubmit = Invoke-RestMethod -Uri "$baseUrl/api/contact" -Method Post -Body $reservationPayload -ContentType "application/json"
    Assert-Check ($resSubmit.success -eq $true) "Submitted table reservation via POST /api/contact"

    $inbox = Invoke-RestMethod -Uri "$baseUrl/api/messages" -Method Get -Headers $authHeader
    $foundReservation = $null
    foreach ($msg in $inbox) {
        if ($msg.email -eq "ahmed.zaman@du.ac.bd") { $foundReservation = $msg; break }
    }
    Assert-Check ($foundReservation -ne $null) "Admin successfully retrieved table reservation from inbox"
    Assert-Check ($foundReservation.name -eq "Ahmed Zaman") "Customer name preserved correctly in reservation"

    # Clean up test reservation
    if ($foundReservation) {
        $delRes = Invoke-RestMethod -Uri "$baseUrl/api/messages?id=$($foundReservation.id)" -Method Delete -Headers $authHeader
        Assert-Check ($delRes.success -eq $true) "Cleaned up test reservation"
    }

    # 6. Verify Factory Reset Restores Default Sylvana Content
    Write-Host "`n[6/6] Verifying Factory Reset Restores Defaults..." -ForegroundColor Yellow
    $resetRes = Invoke-RestMethod -Uri "$baseUrl/api/content/reset" -Method Post -Headers $authHeader
    Assert-Check ($resetRes.success -eq $true) "Factory reset executed"

    $finalContent = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Get
    $finalBiryani = $null
    foreach ($it in $finalContent.menu.items) {
        if ($it.name -eq "Mutton Kacchi Biryani") { $finalBiryani = $it; break }
    }
    Assert-Check ($finalBiryani.price -eq 320) "Mutton Kacchi Biryani restored to original 320"
    Assert-Check ($finalContent.meta.brandName -eq "The Sylvana Restaurant") "Brand name remains 'The Sylvana Restaurant'"

} finally {
    Write-Host "`nStopping test server..." -ForegroundColor Cyan
    if ($proc -and -not $proc.HasExited) {
        $proc.Kill()
        $proc.WaitForExit(2000)
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   DEEP RESTAURANT VERIFICATION SUMMARY                  " -ForegroundColor Cyan
Write-Host "   Total Passed: $script:testsPassed" -ForegroundColor Green
Write-Host "   Total Failed: $script:testsFailed" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if ($script:testsFailed -eq 0) {
    Write-Host "ALL RESTAURANT BRAND AND DATA FLOW CHECKS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME CHECKS FAILED!" -ForegroundColor Red
    exit 1
}
