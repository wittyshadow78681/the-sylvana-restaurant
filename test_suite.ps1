# ==============================================================================
# NexusFlow Comprehensive Verification & End-to-End Test Suite
# ==============================================================================

$ErrorActionPreference = "Continue"
$testPort = 5099
$baseUrl = "http://localhost:$testPort"
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   NEXUSFLOW END-TO-END DEEP VERIFICATION SUITE           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Compile binary if needed
if (-not (Test-Path "NexusServer.exe")) {
    Write-Host "[1/10] Building NexusServer.exe..." -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File .\build.ps1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: Build failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "[1/10] Server binary verified." -ForegroundColor Green

# 2. Start server in background process
Write-Host "[2/10] Starting test server on port $testPort..." -ForegroundColor Yellow
$procInfo = New-Object System.Diagnostics.ProcessStartInfo
$procInfo.FileName = Join-Path $PSScriptRoot "NexusServer.exe"
$procInfo.Arguments = "$testPort"
$procInfo.WorkingDirectory = $PSScriptRoot
$procInfo.UseShellExecute = $false
$procInfo.CreateNoWindow = $true
$proc = [System.Diagnostics.Process]::Start($procInfo)

# Wait for server to spin up
$isUp = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 200
    try {
        $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($health -and $health.status -eq "healthy") {
            $isUp = $true
            break
        }
    } catch {}
}

if (-not $isUp) {
    Write-Host "FATAL: Test server failed to start on $baseUrl" -ForegroundColor Red
    if ($proc -and -not $proc.HasExited) { $proc.Kill() }
    exit 1
}
Write-Host "[2/10] Server online and healthy." -ForegroundColor Green

$script:testsPassed = 0
$script:testsFailed = 0

function Report-Assert([bool]$condition, [string]$testName) {
    if ($condition) {
        Write-Host "  PASS: $testName" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "  FAIL: $testName" -ForegroundColor Red
        $script:testsFailed++
    }
}

try {
    # 3. Test Static File Serving
    Write-Host "`n[3/10] Testing Static File Delivery..." -ForegroundColor Yellow
    $indexHtml = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing
    Report-Assert ($indexHtml.StatusCode -eq 200 -and $indexHtml.Content -like "*NexusFlow*") "GET / serves index.html with 200 OK"

    $adminHtml = Invoke-WebRequest -Uri "$baseUrl/admin" -UseBasicParsing
    Report-Assert ($adminHtml.StatusCode -eq 200 -and $adminHtml.Content -like "*Admin Studio*") "GET /admin serves admin.html with 200 OK"

    $css = Invoke-WebRequest -Uri "$baseUrl/css/style.css" -UseBasicParsing
    Report-Assert ($css.StatusCode -eq 200 -and $css.Content -like "*:root*") "GET /css/style.css serves valid stylesheet"

    $js = Invoke-WebRequest -Uri "$baseUrl/js/app.js" -UseBasicParsing
    Report-Assert ($js.StatusCode -eq 200 -and $js.Content -like "*fetchContentSource*") "GET /js/app.js serves public client script"

    $adminJs = Invoke-WebRequest -Uri "$baseUrl/js/admin.js" -UseBasicParsing
    Report-Assert ($adminJs.StatusCode -eq 200 -and $adminJs.Content -like "*saveAllChanges*") "GET /js/admin.js serves admin controller script"

    # 4. Test Content Source Flow (GET /api/content)
    Write-Host "`n[4/10] Testing Data Flow from Source..." -ForegroundColor Yellow
    $content = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Get
    Report-Assert ($content -ne $null) "Content JSON received from source"
    Report-Assert ($content.meta -ne $null -and ($content.meta.brandName -eq "The Sylvana Restaurant" -or $content.meta.brandName -eq "NexusFlow")) "Meta node properly formatted with brand name"
    Report-Assert ($content.hero -ne $null -and $content.hero.headlineStart -ne $null) "Hero node populated"
    Report-Assert ($content.features.Count -ge 4) "Features list contains items"
    Report-Assert ($content.pricing.plans.Count -ge 3) "Pricing plans configured"
    Report-Assert ($content.menu -ne $null -and $content.menu.items.Count -ge 38) "All 38+ source dishes configured in menu"
    Report-Assert ($content.contact.address -like "*Shahbagh*") "Restaurant address configured in Shahbagh"
    Report-Assert ($content.contact.phone -eq "+8801734489275") "Restaurant phone +8801734489275 verified"

    # 5. Test Authentication & Protected Endpoints
    Write-Host "`n[5/10] Testing Authentication and Security..." -ForegroundColor Yellow
    
    # Unauthorized update attempt
    $unauthBlocked = $false
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Put -Body '{}' -ContentType "application/json"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) { $unauthBlocked = $true }
    }
    Report-Assert $unauthBlocked "PUT /api/content without token returns 401 Unauthorized"

    # Bad credentials login
    $badLoginBlocked = $false
    try {
        $badBody = '{"username":"admin","password":"wrongpassword"}'
        Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $badBody -ContentType "application/json"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) { $badLoginBlocked = $true }
    }
    Report-Assert $badLoginBlocked "POST /api/auth/login with invalid password returns 401"

    # Correct login
    $loginBody = '{"username":"admin","password":"admin123"}'
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Report-Assert ($loginRes.success -eq $true -and $loginRes.token -like "tok_*") "POST /api/auth/login returns valid session token"
    $token = $loginRes.token
    $authHeader = @{ Authorization = "Bearer $token" }

    # Verify token
    $verifyRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/verify" -Method Get -Headers $authHeader
    Report-Assert ($verifyRes.valid -eq $true -and $verifyRes.username -eq "admin") "GET /api/auth/verify succeeds with valid token"

    # 6. Test Data Flow Mutation (PUT /api/content)
    Write-Host "`n[6/10] Testing Content Flow Mutation..." -ForegroundColor Yellow
    $newHighlight = "Ultra Fast Boosted Engine"
    $content.hero.headlineHighlight = $newHighlight
    $updatePayload = $content | ConvertTo-Json -Depth 10

    $updateRes = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Put -Body $updatePayload -Headers $authHeader -ContentType "application/json"
    Report-Assert ($updateRes.success -eq $true) "PUT /api/content saves updated content"

    # Re-fetch from public source endpoint
    $refetched = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Get
    Report-Assert ($refetched.hero.headlineHighlight -eq $newHighlight) "GET /api/content reflects updated headlineHighlight"

    # 7. Test Contact Form & Messages Flow
    Write-Host "`n[7/10] Testing Contact Form Flow..." -ForegroundColor Yellow
    $contactPayload = '{"name":"Samantha Miller","email":"samantha@scalecloud.io","subject":"Enterprise Evaluation","message":"Evaluating the single-source architecture"}'

    $contactRes = Invoke-RestMethod -Uri "$baseUrl/api/contact" -Method Post -Body $contactPayload -ContentType "application/json"
    Report-Assert ($contactRes.success -eq $true) "POST /api/contact receives visitor inquiry"

    # Admin fetches inquiries
    $messages = Invoke-RestMethod -Uri "$baseUrl/api/messages" -Method Get -Headers $authHeader
    $foundMsg = $null
    foreach ($m in $messages) {
        if ($m.email -eq "samantha@scalecloud.io") { $foundMsg = $m; break }
    }
    Report-Assert ($foundMsg -ne $null -and $foundMsg.name -eq "Samantha Miller") "GET /api/messages retrieves newly received inquiry"

    # Delete message
    if ($foundMsg) {
        $delRes = Invoke-RestMethod -Uri "$baseUrl/api/messages?id=$($foundMsg.id)" -Method Delete -Headers $authHeader
        Report-Assert ($delRes.success -eq $true) "DELETE /api/messages deletes inquiry successfully"
    }

    # 8. Test Audit Log
    Write-Host "`n[8/10] Testing Audit Log..." -ForegroundColor Yellow
    $audits = Invoke-RestMethod -Uri "$baseUrl/api/audit-log" -Method Get -Headers $authHeader
    Report-Assert ($audits.Count -ge 2) "GET /api/audit-log returns event records"
    $hasUpdateEvent = $false
    foreach ($a in $audits) {
        if ($a.action -eq "UPDATE_CONTENT") { $hasUpdateEvent = $true; break }
    }
    Report-Assert $hasUpdateEvent "Audit log recorded UPDATE_CONTENT event"

    # 9. Test Security & Edge Cases
    Write-Host "`n[9/10] Testing Security and Edge Cases..." -ForegroundColor Yellow

    # Path traversal protection
    $traversalBlocked = $false
    try {
        $travRes = Invoke-WebRequest -Uri "$baseUrl/../../Windows/win.ini" -UseBasicParsing -ErrorAction SilentlyContinue
        if ($travRes.StatusCode -eq 403 -or $travRes.StatusCode -eq 404) { $traversalBlocked = $true }
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -in 403, 404) { $traversalBlocked = $true }
    }
    Report-Assert $traversalBlocked "Directory traversal attempt blocked with 403 or 404"

    # Malformed JSON in PUT /api/content
    $malformedBlocked = $false
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Put -Body 'INVALID_JSON_RAW' -Headers $authHeader -ContentType "application/json"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 400) { $malformedBlocked = $true }
    }
    Report-Assert $malformedBlocked "Malformed JSON payload rejected with 400 Bad Request"

    # Missing schema keys
    $missingSchemaBlocked = $false
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Put -Body '{"foo":"bar"}' -Headers $authHeader -ContentType "application/json"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 422) { $missingSchemaBlocked = $true }
    }
    Report-Assert $missingSchemaBlocked "Invalid schema rejected with 422 Unprocessable"

    # 10. Test Export & Factory Reset
    Write-Host "`n[10/10] Testing Export and Factory Reset..." -ForegroundColor Yellow
    $exportRes = Invoke-WebRequest -Uri "$baseUrl/api/content/export" -UseBasicParsing
    Report-Assert ($exportRes.StatusCode -eq 200 -and $exportRes.Headers["Content-Disposition"] -like "*attachment*") "GET /api/content/export triggers file download"

    $resetRes = Invoke-RestMethod -Uri "$baseUrl/api/content/reset" -Method Post -Headers $authHeader
    Report-Assert ($resetRes.success -eq $true) "POST /api/content/reset restores factory defaults"

    $resetContent = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Get
    Report-Assert ($resetContent.hero.headlineHighlight -in @("The Sylvana Restaurant", "Source to Scale")) "Factory content restored headline"

} finally {
    # Clean shutdown of test server
    Write-Host "`nStopping test server process..." -ForegroundColor Cyan
    if ($proc -and -not $proc.HasExited) {
        $proc.Kill()
        $proc.WaitForExit(2000)
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
$failColor = "Red"
if ($script:testsFailed -eq 0) { $failColor = "Green" }
Write-Host "   TEST SUITE SUMMARY                                     " -ForegroundColor Cyan
Write-Host "   Total Passed: $script:testsPassed" -ForegroundColor Green
Write-Host "   Total Failed: $script:testsFailed" -ForegroundColor $failColor
Write-Host "==========================================================" -ForegroundColor Cyan

if ($script:testsFailed -eq 0) {
    Write-Host "ALL TESTS PASSED WITH 100% SUCCESS!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "SOME TESTS FAILED!" -ForegroundColor Red
    exit 1
}
