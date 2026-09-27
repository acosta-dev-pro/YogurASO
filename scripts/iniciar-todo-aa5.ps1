# YogurASO AA5 — Inicia VM Ubuntu + Docker Desktop + despliegue
# Uso: powershell -ExecutionPolicy Bypass -File scripts\iniciar-todo-aa5.ps1

$ErrorActionPreference = "Continue"
$VBox = "${env:ProgramFiles}\Oracle\VirtualBox\VBoxManage.exe"
$VmName = "Ubuntu-Server-AA5"
$Out = "$env:USERPROFILE\Downloads\GA10-AA5-evidencias"
$Project = "C:\Users\acost\Desktop\YOGURASO-WEB"

New-Item -ItemType Directory -Force -Path $Out | Out-Null

Write-Host "=== AA5: Ubuntu + Docker + YogurASO ===" -ForegroundColor Cyan

# Carpeta compartida
& $VBox sharedfolder remove $VmName --name yoguraso 2>$null
& $VBox sharedfolder add $VmName --name yoguraso --hostpath $Project --automount
Write-Host "[OK] Carpeta compartida yoguraso"

# Port forwarding (host 8088 -> guest 8080, 3308 -> 3307)
$state = (& $VBox showvminfo $VmName --machinereadable | Select-String 'VMState="(.+)"').Matches.Groups[1].Value
if ($state -eq "running") {
    & $VBox controlvm $VmName natpf1 delete aa5http 2>$null
    & $VBox controlvm $VmName natpf1 "aa5http,tcp,,8088,,8080" 2>$null
    & $VBox controlvm $VmName natpf1 delete aa5mysql 2>$null
    & $VBox controlvm $VmName natpf1 "aa5mysql,tcp,,3308,,3307" 2>$null
} else {
    & $VBox modifyvm $VmName --natpf1 delete aa5http 2>$null
    & $VBox modifyvm $VmName --natpf1 "aa5http,tcp,,8088,,8080" 2>$null
    & $VBox modifyvm $VmName --natpf1 delete aa5mysql 2>$null
    & $VBox modifyvm $VmName --natpf1 "aa5mysql,tcp,,3308,,3307" 2>$null
}

# Arrancar VM
if ($state -ne "running") {
    Write-Host "[...] Arrancando Ubuntu..."
    & $VBox startvm $VmName --type gui
} else {
    Write-Host "[OK] Ubuntu ya estaba corriendo"
}

# Docker Desktop
$dd = "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe"
if (Test-Path $dd) {
    if (-not (Get-Process "Docker Desktop" -ErrorAction SilentlyContinue)) {
        Start-Process $dd
        Write-Host "[OK] Docker Desktop abierto"
    } else {
        Write-Host "[OK] Docker Desktop ya estaba abierto"
    }
} else {
    Write-Host "[!] Docker Desktop no instalado" -ForegroundColor Yellow
}

Write-Host "[...] Esperando 50s (boot Ubuntu)..."
Start-Sleep -Seconds 50

function RunCmd($cmd, $w = 4) {
    Write-Host ">> $($cmd.Substring(0, [Math]::Min(70, $cmd.Length)))"
    & $VBox controlvm $VmName keyboardputstring $cmd
    Start-Sleep -Milliseconds 1000
    & $VBox controlvm $VmName keyboardputscancode 1c 9c
    Start-Sleep -Seconds $w
}

# TTY3 + login + deploy
$pw = @('16','96','30','b0','16','96','31','b1','14','94','16','96','02','82','03','83','04','84','1c','9c')
& $VBox controlvm $VmName keyboardputscancode 1d 38 3d bd b8 9d
Start-Sleep -Seconds 4
1..2 | ForEach-Object { & $VBox controlvm $VmName keyboardputscancode 1c 9c; Start-Sleep -Seconds 1 }
& $VBox controlvm $VmName keyboardputstring "estudiante"
Start-Sleep -Seconds 1
& $VBox controlvm $VmName keyboardputscancode 1c 9c
Start-Sleep -Seconds 4
& $VBox controlvm $VmName keyboardputscancode @pw
Start-Sleep -Seconds 5
RunCmd "bash /media/sf_yoguraso/scripts/ubuntu-aa5-deploy.sh" 180
& $VBox controlvm $VmName screenshotpng (Join-Path $Out "inicio_ubuntu.png")

# Docker Windows (compose)
Write-Host "[...] Intentando docker compose en Windows..."
$job = Start-Job { Set-Location C:\AA5-docker; docker compose up -d 2>&1; docker ps 2>&1 }
Wait-Job $job -Timeout 90 | Out-Null
if ($job.State -eq 'Running') {
    Stop-Job $job; Remove-Job $job -Force
    Write-Host "[!] Docker Windows: motor no respondio (conflicto con VirtualBox)" -ForegroundColor Yellow
} else {
    Receive-Job $job
    Remove-Job $job -Force
}

# Abrir navegadores
Start-Process "http://127.0.0.1:8080"
Start-Sleep -Seconds 2
Start-Process "http://127.0.0.1:8088"

Write-Host ""
Write-Host "=== LISTO ===" -ForegroundColor Green
Write-Host "Windows:  http://127.0.0.1:8080  (Docker si motor OK)"
Write-Host "Ubuntu:   http://127.0.0.1:8088  (NAT -> VM Docker)"
Write-Host "MySQL:    puerto 3307 (Win) / 3308 (Ubuntu NAT)"
Write-Host "Login VM: estudiante / ubuntu123"
