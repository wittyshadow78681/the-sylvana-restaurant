$ErrorActionPreference = "Continue"
$testPort = 5100
$baseUrl = "http://localhost:$testPort"
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host "Starting test server on port $testPort..." -ForegroundColor Yellow
$procInfo = New-Object System.Diagnostics.ProcessStartInfo
$procInfo.FileName = Join-Path $PSScriptRoot "NexusServer.exe"
$procInfo.Arguments = "$testPort"
$procInfo.WorkingDirectory = $PSScriptRoot
$procInfo.UseShellExecute = $false
$proc = [System.Diagnostics.Process]::Start($procInfo)

Start-Sleep -Milliseconds 1000

$testsPassed = 0
$testsFailed = 0

function Assert-Test($condition, $desc) {
    if ($condition) {
        Write-Host "  PASS: $desc" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "  FAIL: $desc" -ForegroundColor Red
        $script:testsFailed++
    }
}

try {
    # 1. Login
    $loginBody = '{"username":"admin","password":"admin123"}'
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.token
    $authHeader = @{ Authorization = "Bearer $token" }

    # 2. Test Non-ASCII & Unicode UTF-8 Persistence
    Write-Host "`nTesting Unicode UTF-8 Persistence..." -ForegroundColor Cyan
    $content = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Get
    # Use unicode characters via .NET
    $testUnicodeString = [System.Text.Encoding]::UTF8.GetString([byte[]]@(0xF0, 0x9F, 0x9A, 0x80, 0x20, 0x55, 0x6C, 0x74, 0x72, 0x61, 0x20, 0xE2, 0x9A, 0xA1, 0x20, 0xE4, 0xB8, 0x96, 0xE7, 0x95, 0x8C))
    $content.hero.headlineStart = $testUnicodeString
    $jsonUtf8 = $content | ConvertTo-Json -Depth 10

    # Send PUT with UTF-8
    $putBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonUtf8)
    $webReq = [System.Net.HttpWebRequest]::Create("$baseUrl/api/content")
    $webReq.Method = "PUT"
    $webReq.ContentType = "application/json; charset=utf-8"
    $webReq.Headers.Add("Authorization", "Bearer $token")
    $stream = $webReq.GetRequestStream()
    $stream.Write($putBytes, 0, $putBytes.Length)
    $stream.Close()
    $response = $webReq.GetResponse()
    Assert-Test ($response.StatusCode -eq 200) "PUT with UTF-8 characters succeeds"
    $response.Close()

    # Re-fetch and check exact Unicode preservation without mojibake
    $refetched = Invoke-RestMethod -Uri "$baseUrl/api/content" -Method Get
    Assert-Test ($refetched.hero.headlineStart -eq $testUnicodeString) "GET preserves exact Unicode characters (No Mojibake)"

    # 3. Test Query Parameter Token Authentication (GET /api/messages?token=...)
    Write-Host "`nTesting Query Param Token Authentication..." -ForegroundColor Cyan
    $msgRes = Invoke-RestMethod -Uri "$baseUrl/api/messages?token=$token" -Method Get
    Assert-Test ($msgRes -is [System.Array] -or $msgRes.GetType().Name -eq "Object[]") "Query param ?token= authentication works for protected endpoint"

    # 4. Test Sibling Prefix Directory Traversal Guard
    Write-Host "`nTesting Directory Traversal Sibling Guard..." -ForegroundColor Cyan
    $travPassed = $false
    try {
        $r = Invoke-WebRequest -Uri "$baseUrl/../sibling-dir/test.txt" -UseBasicParsing -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 403 -or $r.StatusCode -eq 404) { $travPassed = $true }
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -in @(403, 404)) { $travPassed = $true }
    }
    Assert-Test $travPassed "Sibling path traversal /../sibling-dir rejected safely"

    # 5. Test Contact Submission with UTF-8
    Write-Host "`nTesting Contact Form with UTF-8..." -ForegroundColor Cyan
    $nameBytes = [byte[]]@(0x54, 0x61, 0x72, 0x6F, 0x20, 0xE7, 0x94, 0xB0, 0xE4, 0xB8, 0xAD) # "Taro Tanaka" in kanji
    $nameStr = [System.Text.Encoding]::UTF8.GetString($nameBytes)
    $contactJson = '{"name":"' + $nameStr + '","email":"tanaka@example.jp","subject":"Test Inquiry","message":"Hello from UTF-8 test"}'
    $contactPayload = [System.Text.Encoding]::UTF8.GetBytes($contactJson)
    
    $cReq = [System.Net.HttpWebRequest]::Create("$baseUrl/api/contact")
    $cReq.Method = "POST"
    $cReq.ContentType = "application/json; charset=utf-8"
    $cStream = $cReq.GetRequestStream()
    $cStream.Write($contactPayload, 0, $contactPayload.Length)
    $cStream.Close()
    $cRes = $cReq.GetResponse()
    Assert-Test ($cRes.StatusCode -eq 200) "Contact submission with UTF-8 text succeeds"
    $cRes.Close()

    $inbox = Invoke-RestMethod -Uri "$baseUrl/api/messages" -Method Get -Headers $authHeader
    $foundJp = $null
    foreach ($m in $inbox) {
        if ($m.email -eq "tanaka@example.jp") { $foundJp = $m; break }
    }
    Assert-Test ($foundJp -ne $null -and $foundJp.name -eq $nameStr) "Contact message preserved UTF-8 name correctly"

    # Clean up message
    if ($foundJp) {
        $delRes = Invoke-RestMethod -Uri "$baseUrl/api/messages?id=$($foundJp.id)" -Method Delete -Headers $authHeader
        Assert-Test ($delRes.success -eq $true) "Deleted test message"
    }

    # 6. Test Content Reset
    $resetRes = Invoke-RestMethod -Uri "$baseUrl/api/content/reset" -Method Post -Headers $authHeader
    Assert-Test ($resetRes.success -eq $true) "Content reset restored default content"

} finally {
    Write-Host "Stopping test server..." -ForegroundColor Yellow
    if ($proc -and -not $proc.HasExited) {
        $proc.Kill()
        $proc.WaitForExit(2000)
    }
}

Write-Host "`nEdge Case Tests: $testsPassed Passed, $testsFailed Failed" -ForegroundColor Cyan
if ($testsFailed -gt 0) { exit 1 } else { exit 0 }
