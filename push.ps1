param(
    [string]$RepoName = "the-sylvana-restaurant",
    [string]$Username = "wittyshadow78681"
)

$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   THE SYLVANA RESTAURANT - GITHUB ONE-CLICK PUSH         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check remote repository status
Write-Host "Checking remote repository https://github.com/$Username/$RepoName ..." -ForegroundColor Yellow
$check = git ls-remote origin 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[!] Repository does not exist yet on GitHub." -ForegroundColor Yellow
    Write-Host "GitHub fine-grained PAT tokens cannot create repositories via API on personal accounts." -ForegroundColor DarkGray
    Write-Host "Please create it in your browser (takes 5 seconds):" -ForegroundColor Cyan
    Write-Host "  -> https://github.com/new?name=$RepoName" -ForegroundColor Green
    Write-Host "`nAfter creating the empty repo, run this script again or run:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor White
    exit 1
}

Write-Host "Remote repository detected! Pushing main branch..." -ForegroundColor Green
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS! Project pushed to https://github.com/$Username/$RepoName" -ForegroundColor Green
} else {
    Write-Host "`nPush failed. Check error above." -ForegroundColor Red
}
