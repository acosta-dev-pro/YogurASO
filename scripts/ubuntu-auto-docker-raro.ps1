# YogurASO: Docker en Ubuntu VM + Firefox (sin Docker Desktop en Windows)
$ErrorActionPreference = "Continue"
$VBox = "${env:ProgramFiles}\Oracle\VirtualBox\VBoxManage.exe"
$VmName = "Ubuntu-Server-AA5"
$Project = "C:\Users\acost\Desktop\YOGURASO-WEB"
$User = "estudiante"
$Pass = "ubuntu123"
$ServePort = 8900

if (-not (Test-Path $VBox)) {
    Write-Host "ERROR: VirtualBox no instalado" -ForegroundColor Red
    exit 1
}

function Get-VmState {
    $m = (& $VBox showvminfo $VmName --machinereadable 2>$null | Select-String 'VMState="(.+)"').Matches
    if ($m.Success) { return $m.Groups[1].Value }
    return "unknown"
}

function Guest-Run([string]$Cmd, [int]$TimeoutSec = 120, [bool]$NoWait = $false) {
    $args = @(
        "guestcontrol", $VmName, "run",
        "--username", $User, "--password", $Pass,
        "--timeout", ($TimeoutSec * 1000),
        "--exe", "/bin/bash"
    )
    if ($NoWait) {
        $args += @("--no-wait-stdout", "--no-wait-stderr")
    }
    $args += @("--", "-lc", $Cmd)
    $out = & $VBox @args 2>&1
    return @{ Ok = ($LASTEXITCODE -eq 0); Out = ($out -join "`n") }
}

Write-Host ""
Write-Host "=== YogurASO Ubuntu + Docker (metodo raro) ===" -ForegroundColor Cyan
Write-Host ""

# Liberar virtualizacion en Windows
Get-Process "Docker Desktop","com.docker.backend" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Servidor HTTP en Windows (Ubuntu lo usa por NAT 10.0.2.2)
$servePid = $null
try {
    $existing = Get-NetTCPConnection -LocalPort $ServePort -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $existing) {
        $serveJob = Start-Process -WindowStyle Minimized -PassThru -FilePath "cmd.exe" -ArgumentList @(
            "/c", "cd /d `"$Project`" && npx --yes serve -p $ServePort -l $ServePort"
        )
        $servePid = $serveJob.Id
        Write-Host "[OK] Serve Windows en :$ServePort (PID $servePid)"
    } else {
        Write-Host "[OK] Ya hay servidor en :$ServePort"
    }
} catch {
    Write-Host "[!] Serve: $_" -ForegroundColor Yellow
}

Start-Sleep -Seconds 3
try {
    $t = Invoke-WebRequest -Uri "http://127.0.0.1:$ServePort/frontend/index.html" -UseBasicParsing -TimeoutSec 8
    Write-Host "[OK] Frontend accesible desde Windows ($($t.StatusCode))"
} catch {
    Write-Host "ERROR: no responde http://127.0.0.1:$ServePort - $_" -ForegroundColor Red
}

$state = Get-VmState
Write-Host "VM estado: $state"

if ($state -eq "running") {
    Write-Host "VM ya encendida"
} else {
    if ($state -ne "poweroff") {
        & $VBox controlvm $VmName poweroff 2>$null
        Start-Sleep -Seconds 4
    }
    & $VBox modifyvm $VmName --boot1 disk --boot2 none --boot3 none --boot4 none 2>$null
    & $VBox storageattach $VmName --storagectl IDE --port 0 --device 0 --type dvddrive --medium none 2>$null
    & $VBox sharedfolder remove $VmName --name yoguraso 2>$null
    & $VBox sharedfolder add $VmName --name yoguraso --hostpath $Project --automount 2>$null
    & $VBox modifyvm $VmName --natpf1 delete aa5http 2>$null
    & $VBox modifyvm $VmName --natpf1 "aa5http,tcp,,8088,,8080" 2>$null
    Write-Host "Arrancando Ubuntu..."
    & $VBox startvm $VmName --type gui
}

Write-Host "Esperando login de Ubuntu (guest additions)..."
$ready = $false
for ($i = 1; $i -le 72; $i++) {
    $g = Guest-Run "echo guest_ok" 15
    if ($g.Ok) {
        $ready = $true
        Write-Host "[OK] Guest listo ($i intentos)" -ForegroundColor Green
        break
    }
    if ($i % 6 -eq 0) { Write-Host "  ... aun esperando ($i/72) - inicia sesion si ves pantalla de login" }
    Start-Sleep -Seconds 5
}

if (-not $ready) {
    Write-Host ""
    Write-Host "Guest control no responde. Pega ESTO en Terminal Ubuntu (Ctrl+Alt+T):" -ForegroundColor Yellow
    Write-Host "curl -s http://10.0.2.2:$ServePort/scripts/deploy-ubuntu-raro.sh | bash" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Desplegando Docker dentro de Ubuntu..."
$deploy = Guest-Run "curl -sf http://10.0.2.2:$ServePort/scripts/deploy-ubuntu-raro.sh | bash" 300
Write-Host $deploy.Out

$dockerOk = $false
try {
    $nat = Invoke-WebRequest -Uri "http://127.0.0.1:8088" -UseBasicParsing -TimeoutSec 8
    if ($nat.StatusCode -eq 200) { $dockerOk = $true }
} catch { }

if ($dockerOk) {
    Write-Host "[OK] Docker Apache responde (NAT 8088)" -ForegroundColor Green
    Guest-Run "export DISPLAY=:0 MOZ_ENABLE_WAYLAND=0; pkill -f firefox 2>/dev/null; firefox --kiosk http://127.0.0.1:8080 &" 15 $true
    Write-Host ""
    Write-Host "=== LISTO ===" -ForegroundColor Green
    Write-Host "Ubuntu Firefox (kiosco): http://127.0.0.1:8080"
    Write-Host "Desde Windows:           http://127.0.0.1:8088"
    Write-Host "Docker:                  aa5_apache + aa5_mysql"
} elseif ($deploy.Ok) {
    Write-Host "Docker desplegado pero NAT no responde aun. En Ubuntu abre: http://127.0.0.1:8080"
} else {
    Write-Host "Deploy fallo. En Ubuntu ejecuta:" -ForegroundColor Yellow
    Write-Host "curl -s http://10.0.2.2:$ServePort/scripts/deploy-ubuntu-raro.sh | bash"
}
