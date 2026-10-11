$ErrorActionPreference = "Stop"
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) {
    $csc = "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
}

Write-Host "Compiling NexusServer.exe with $csc..."
$src = "C:\Users\onik3\.gemini\antigravity\scratch\flow-landing-admin\src\Server.cs"
$out = "C:\Users\onik3\.gemini\antigravity\scratch\flow-landing-admin\NexusServer.exe"

& $csc /target:exe /optimize+ /r:System.dll,System.Web.Extensions.dll /out:$out $src

if ($LASTEXITCODE -eq 0 -and (Test-Path $out)) {
    Write-Host "BUILD SUCCESSFUL! Output binary: $out" -ForegroundColor Green
} else {
    Write-Host "BUILD FAILED!" -ForegroundColor Red
    exit 1
}
