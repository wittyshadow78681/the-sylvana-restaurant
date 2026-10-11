# Comprehensive Verification for Concurrency, Concurrency Conflict (412), JSON Hardening, and Dining Sections
$ErrorActionPreference = "Stop"
$testPort = 5102
$baseUrl = "http://localhost:$testPort"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   CONCURRENCY & ADVANCED FIXES VERIFICATION SUITE       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Start Server
$proc = Start-Process -FilePath ".\NexusServer.exe" -ArgumentList "$testPort" -PassThru -NoNewWindow
Start-Sleep -Seconds 2

$passCount = 0
$failCount = 0

function Assert-Test($condition, $msg) {
    if ($condition) {
        Write-Host "  PASS: $msg" -ForegroundColor Green
        $script:passCount++
    } else {
        Write-Host "  FAIL: $msg" -ForegroundColor Red
        $script:failCount++
    }
}

try {
    # 1. Favicon Fallback Test
    Write-Host "`n[1/5] Testing Favicon Fallback..." -ForegroundColor Yellow
    $favRes = Invoke-WebRequest -Uri "$baseUrl/favicon.ico" -UseBasicParsing -ErrorAction SilentlyContinue
    Assert-Test ($favRes.StatusCode -eq 200) "GET /favicon.ico delivers 200 OK fallback icon"

    # 2. Login & Malformed JSON Resilience
    Write-Host "`n[2/5] Testing Error Handling & Malformed JSON Resilience..." -ForegroundColor Yellow
    try {
        $badLogin = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body "NOT_VALID_JSON{{" -ContentType "application/json" -UseBasicParsing
        Assert-Test ($false) "POST /api/auth/login with malformed JSON should return 400"
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Assert-Test ($status -eq 400) "POST /api/auth/login with malformed JSON returns 400 Bad Request (status: $status, NOT 500)"
    }

    try {
        $badContact = Invoke-WebRequest -Uri "$baseUrl/api/contact" -Method POST -Body "{invalid-json: true" -ContentType "application/json" -UseBasicParsing
        Assert-Test ($false) "POST /api/contact with malformed JSON should return 400"
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Assert-Test ($status -eq 400) "POST /api/contact with malformed JSON returns 400 Bad Request (status: $status, NOT 500)"
    }

    # 3. Concurrency Control (ETag & If-Match)
    Write-Host "`n[3/5] Testing Optimistic Concurrency Control (ETag & If-Match)..." -ForegroundColor Yellow
    
    # Login to get admin token
    $loginPayload = @{ username = "admin"; password = "admin123" } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginPayload -ContentType "application/json"
    $token = $loginRes.token
    Assert-Test (![string]::IsNullOrEmpty($token)) "Obtained admin session token"

    # Fetch content with ETag
    $contentWebRes = Invoke-WebRequest -Uri "$baseUrl/api/content" -UseBasicParsing
    $etag = $contentWebRes.Headers["ETag"]
    Assert-Test (![string]::IsNullOrEmpty($etag)) "GET /api/content provides ETag header ($etag)"

    $contentData = $contentWebRes.Content | ConvertFrom-Json

    # Attempt PUT with matching ETag
    $headers = @{
        "Authorization" = "Bearer $token"
        "If-Match" = $etag
    }
    $contentData.meta.siteTagline = "Updated with ETag concurrency test"
    $putBody = $contentData | ConvertTo-Json -Depth 10

    $putRes = Invoke-WebRequest -Uri "$baseUrl/api/content" -Method PUT -Headers $headers -Body $putBody -ContentType "application/json" -UseBasicParsing
    Assert-Test ($putRes.StatusCode -eq 200) "PUT /api/content with matching If-Match succeeds (200 OK)"
    $newEtag = $putRes.Headers["ETag"]
    Assert-Test ($newEtag -ne $etag) "PUT /api/content generated fresh new ETag ($newEtag)"

    # Attempt PUT with stale / mismatched ETag -> MUST return 412 Precondition Failed
    $staleHeaders = @{
        "Authorization" = "Bearer $token"
        "If-Match" = $etag  # Old ETag
    }
    try {
        $conflictRes = Invoke-WebRequest -Uri "$baseUrl/api/content" -Method PUT -Headers $staleHeaders -Body $putBody -ContentType "application/json" -UseBasicParsing
        Assert-Test ($false) "PUT with stale ETag should fail with 412"
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Assert-Test ($status -eq 412) "PUT with stale If-Match correctly rejected with 412 Precondition Failed (status: $status)"
    }

    # Attempt PUT with wildcard If-Match: * -> MUST succeed
    $wildcardHeaders = @{
        "Authorization" = "Bearer $token"
        "If-Match" = "*"
    }
    $wildcardRes = Invoke-WebRequest -Uri "$baseUrl/api/content" -Method PUT -Headers $wildcardHeaders -Body $putBody -ContentType "application/json" -UseBasicParsing
    Assert-Test ($wildcardRes.StatusCode -eq 200) "PUT with wildcard If-Match: * succeeds (200 OK)"

    # 4. Dining Sections & Dishes Schema Validation
    Write-Host "`n[4/5] Testing Dining Sections & Menu Schema Coverage..." -ForegroundColor Yellow
    $freshContent = Invoke-RestMethod -Uri "$baseUrl/api/content"
    $dishes = $freshContent.menu.items

    $allHaveSections = $true
    $invalidSections = @()
    $validSectionNames = @("Breakfast", "Lunch & Dinner", "Traditional Meals & Favourites", "Drinks & Desserts")

    foreach ($d in $dishes) {
        if ([string]::IsNullOrEmpty($d.section) -or ($validSectionNames -notcontains $d.section)) {
            $allHaveSections = $false
            $invalidSections += "$($d.name): $($d.section)"
        }
    }
    Assert-Test ($allHaveSections) "All $($dishes.Count) dishes have valid master dining section mapping"

    $breakfastDishes = $dishes | Where-Object { $_.section -eq "Breakfast" }
    $lunchDinnerDishes = $dishes | Where-Object { $_.section -eq "Lunch & Dinner" }
    $traditionalDishes = $dishes | Where-Object { $_.section -eq "Traditional Meals & Favourites" }
    $drinksDessertDishes = $dishes | Where-Object { $_.section -eq "Drinks & Desserts" }

    Assert-Test ($breakfastDishes.Count -ge 8) "Breakfast dining section has $($breakfastDishes.Count) items (>= 8)"
    Assert-Test ($lunchDinnerDishes.Count -ge 8) "Lunch & Dinner section has $($lunchDinnerDishes.Count) items (>= 8)"
    Assert-Test ($traditionalDishes.Count -ge 10) "Traditional Meals section has $($traditionalDishes.Count) items (>= 10)"
    Assert-Test ($drinksDessertDishes.Count -ge 10) "Drinks & Desserts section has $($drinksDessertDishes.Count) items (>= 10)"

    # 5. Restore Default Content
    Write-Host "`n[5/5] Restoring Factory Defaults..." -ForegroundColor Yellow
    $resetHeaders = @{ "Authorization" = "Bearer $token" }
    $resetRes = Invoke-RestMethod -Uri "$baseUrl/api/content/reset" -Method POST -Headers $resetHeaders
    Assert-Test ($resetRes.success -eq $true) "Content successfully restored to factory defaults"

} finally {
    Write-Host "`nTerminating test server..." -ForegroundColor Gray
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   TEST SUMMARY: $passCount PASSED, $failCount FAILED" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================" -ForegroundColor Cyan

if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
