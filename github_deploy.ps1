param(
    [string]$Token,
    [string]$RepoName = "the-sylvana-restaurant",
    [string]$Username = "wittyshadow78681"
)

$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

if (-not $Token) {
    Write-Host "Please provide a GitHub Token via -Token <token>" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "PowerShell-Deployer"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   THE SYLVANA RESTAURANT - GITHUB REPO & PAGES DEPLOY    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify User
try {
    $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
    Write-Host "Authenticated as: $($user.login) ($($user.name))" -ForegroundColor Green
    $Username = $user.login
} catch {
    Write-Host "Failed to authenticate with GitHub token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Check if repository exists or create it
$repo = $null
try {
    $repo = Invoke-RestMethod -Uri "https://api.github.com/repos/$Username/$RepoName" -Headers $headers
    Write-Host "Repository exists: $($repo.html_url)" -ForegroundColor Yellow
} catch {
    Write-Host "Creating new public repository: $RepoName..." -ForegroundColor Yellow
    $createBody = @{
        name = $RepoName
        description = "The Sylvana Restaurant (দ্যা সিলভানা রেস্টুরেন্ট) - Official Single Page Culinary Website & Dynamic CMS Portal"
        private = $false
        auto_init = $true
    } | ConvertTo-Json
    try {
        $repo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $createBody -ContentType "application/json"
        Write-Host "Repository created successfully: $($repo.html_url)" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "Failed to create repo automatically: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please create the repository manually at: https://github.com/new (Name: $RepoName)" -ForegroundColor Yellow
        exit 1
    }
}

# 3. Collect files to upload
$filesToUpload = @()
$excludeDirs = @(".git", ".vscode", "bin", "obj", "cf")
$excludeFiles = @("NexusServer.exe", "TunnelProxy.exe", "cloudflared.exe")

Get-ChildItem -Path $PSScriptRoot -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($PSScriptRoot.Length + 1).Replace("\", "/")
    $skip = $false
    foreach ($ex in $excludeDirs) {
        if ($rel.StartsWith("$ex/") -or $rel -eq $ex) { $skip = $true; break }
    }
    foreach ($ef in $excludeFiles) {
        if ($rel.EndsWith("/$ef") -or $rel -eq $ef) { $skip = $true; break }
    }
    if (-not $skip) {
        $filesToUpload += @{
            Path = $rel
            FullPath = $_.FullName
        }
    }
}

Write-Host "`nPreparing to commit $($filesToUpload.Count) project files..." -ForegroundColor Cyan

# 4. Upload blobs
$treeItems = @()
foreach ($f in $filesToUpload) {
    $bytes = [System.IO.File]::ReadAllBytes($f.FullPath)
    $b64 = [Convert]::ToBase64String($bytes)
    $blobBody = @{
        content = $b64
        encoding = "base64"
    } | ConvertTo-Json
    
    try {
        $blob = Invoke-RestMethod -Uri "https://api.github.com/repos/$Username/$RepoName/git/blobs" -Method Post -Headers $headers -Body $blobBody -ContentType "application/json"
        $treeItems += @{
            path = $f.Path
            mode = "100644"
            type = "blob"
            sha = $blob.sha
        }
        Write-Host "  Uploaded blob: $($f.Path)" -ForegroundColor DarkGray
    } catch {
        Write-Host "  Failed to upload blob for $($f.Path): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 5. Create Tree
Write-Host "`nCreating Git tree with $($treeItems.Count) items..." -ForegroundColor Yellow
$treeBody = @{
    tree = $treeItems
} | ConvertTo-Json -Depth 5

$treeRes = Invoke-RestMethod -Uri "https://api.github.com/repos/$Username/$RepoName/git/trees" -Method Post -Headers $headers -Body $treeBody -ContentType "application/json"

# 6. Get latest commit
$ref = Invoke-RestMethod -Uri "https://api.github.com/repos/$Username/$RepoName/git/refs/heads/main" -Headers $headers
$parentCommitSha = $ref.object.sha

# 7. Create commit
Write-Host "Creating commit..." -ForegroundColor Yellow
$commitBody = @{
    message = "Initial release: The Sylvana Restaurant website, 38-dish menu, and dynamic CMS engine"
    tree = $treeRes.sha
    parents = @($parentCommitSha)
} | ConvertTo-Json

$commit = Invoke-RestMethod -Uri "https://api.github.com/repos/$Username/$RepoName/git/commits" -Method Post -Headers $headers -Body $commitBody -ContentType "application/json"

# 8. Update ref
Write-Host "Updating main branch..." -ForegroundColor Yellow
$patchRef = @{
    sha = $commit.sha
    force = $true
} | ConvertTo-Json
Invoke-RestMethod -Uri "https://api.github.com/repos/$Username/$RepoName/git/refs/heads/main" -Method Patch -Headers $headers -Body $patchRef -ContentType "application/json" | Out-Null
Write-Host "Committed successfully! SHA: $($commit.sha)" -ForegroundColor Green

# 9. Enable GitHub Pages
Write-Host "`nEnabling GitHub Pages on main branch root..." -ForegroundColor Yellow
try {
    $pagesBody = @{
        source = @{
            branch = "main"
            path = "/"
        }
    } | ConvertTo-Json
    $pagesRes = Invoke-RestMethod -Uri "https://api.github.com/repos/$Username/$RepoName/pages" -Method Post -Headers $headers -Body $pagesBody -ContentType "application/json"
    Write-Host "GitHub Pages activated: $($pagesRes.html_url)" -ForegroundColor Green
} catch {
    Write-Host "GitHub Pages check: https://$Username.github.io/$RepoName/" -ForegroundColor Yellow
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "   DEPLOYMENT SUMMARY                                     " -ForegroundColor Cyan
Write-Host "   Repository:  https://github.com/$Username/$RepoName    " -ForegroundColor Green
Write-Host "   Live Pages:  https://$Username.github.io/$RepoName/    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
