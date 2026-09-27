# YogurASO — Iniciar Ubuntu en VirtualBox (evidencia AA5)
# Uso:
#   powershell -ExecutionPolicy Bypass -File "C:\Users\acost\Desktop\YOGURASO-WEB\scripts\iniciar-ubuntu-vm.ps1"

$ErrorActionPreference = "Continue"
$VmName = "Ubuntu-Server-AA5"

function Find-VBoxManage {
    $paths = @(
        "${env:ProgramFiles}\Oracle\VirtualBox\VBoxManage.exe",
        "${env:ProgramFiles(x86)}\Oracle\VirtualBox\VBoxManage.exe"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

function Find-UbuntuIso {
    $roots = @(
        "$env:USERPROFILE\Downloads",
        "C:\ISO",
        "D:\"
    )
    foreach ($root in $roots) {
        if (-not (Test-Path $root)) { continue }
        $iso = Get-ChildItem -Path $root -Filter "ubuntu*.iso" -File -ErrorAction SilentlyContinue |
            Sort-Object Length -Descending |
            Select-Object -First 1
        if ($iso) { return $iso.FullName }
    }
    return $null
}

function Get-VmState([string]$VBox, [string]$Name) {
    $line = & $VBox showvminfo $Name --machinereadable 2>$null | Select-String 'VMState="(.+)"'
    if ($line) { return $line.Matches.Groups[1].Value }
    return "unknown"
}

Write-Host ""
Write-Host "=== Iniciar Ubuntu en VirtualBox (AA5) ===" -ForegroundColor Cyan
Write-Host ""

$VBox = Find-VBoxManage
if (-not $VBox) {
    Write-Host "ERROR: VirtualBox no esta instalado." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] VirtualBox:" $VBox
& $VBox --version

$iso = Find-UbuntuIso
if ($iso) {
    Write-Host "[OK] ISO:" $iso
} else {
    Write-Host "[!] No se encontro ubuntu*.iso en Downloads" -ForegroundColor Yellow
}

$vms = & $VBox list vms 2>$null
if ($vms -notmatch [regex]::Escape($VmName)) {
    Write-Host "La VM '$VmName' no existe. Creandola..." -ForegroundColor Yellow
    if (-not $iso) {
        Write-Host "ERROR: Necesitas el ISO de Ubuntu." -ForegroundColor Red
        exit 1
    }

    $vmFolder = Join-Path $env:USERPROFILE "VirtualBox VMs\$VmName"
    $disk = Join-Path $vmFolder "$VmName.vdi"

    & $VBox createvm --name $VmName --ostype "Ubuntu_64" --register | Out-Null
    & $VBox modifyvm $VmName --memory 4096 --cpus 2 --vram 128 --graphicscontroller vmsvga --pae on --ioapic on
    & $VBox modifyvm $VmName --boot1 dvd --boot2 disk --boot3 none --boot4 none
    New-Item -ItemType Directory -Force -Path $vmFolder | Out-Null
    & $VBox createmedium disk --filename $disk --size 20480 --format VDI | Out-Null
    & $VBox storagectl $VmName --name "SATA" --add sata --controller IntelAhci --portcount 2 --hostiocache on
    & $VBox storageattach $VmName --storagectl "SATA" --port 0 --device 0 --type hdd --medium $disk
    & $VBox storagectl $VmName --name "IDE" --add ide --controller PIIX4 --portcount 2 --bootable on
    & $VBox storageattach $VmName --storagectl "IDE" --port 0 --device 0 --type dvddrive --medium $iso
    Write-Host "[OK] VM creada con ISO montada"
}

# Apagar si hace falta para montar
$state = Get-VmState $VBox $VmName
if ($state -ne "poweroff" -and $state -ne "unknown") {
    Write-Host "Apagando VM (estado: $state)..." -ForegroundColor Yellow
    & $VBox controlvm $VmName poweroff 2>$null
    Start-Sleep -Seconds 3
}

# Mejorar hardware
& $VBox modifyvm $VmName --memory 4096 --cpus 2 --vram 128 --graphicscontroller vmsvga --pae on --ioapic on 2>$null

# Asegurar ISO montada + arranque DVD -> disco
if ($iso) {
    & $VBox storagectl $VmName --name "IDE" --add ide --controller PIIX4 --portcount 2 --bootable on 2>$null
    & $VBox storageattach $VmName --storagectl "IDE" --port 0 --device 0 --type dvddrive --medium $iso 2>$null
    Write-Host "[OK] ISO montada en IDE (DVD)"
}

& $VBox modifyvm $VmName --boot1 dvd --boot2 disk --boot3 none --boot4 none
Write-Host "[OK] Orden de arranque: DVD -> Disco"

# Verificar
Write-Host ""
Write-Host "Montaje actual:" -ForegroundColor Cyan
& $VBox showvminfo $VmName --machinereadable | Select-String 'boot1=|boot2=|"IDE-0-0"=|"SATA-0-0"='

Write-Host ""
Write-Host "Iniciando Ubuntu..." -ForegroundColor Yellow
& $VBox startvm $VmName --type gui

Write-Host ""
Write-Host "=== LISTO ===" -ForegroundColor Green
Write-Host "1) En la pantalla de Ubuntu elige: Try or Install Ubuntu / Instalar Ubuntu"
Write-Host "2) Completa la instalacion (idioma, teclado, usuario, contrasena)"
Write-Host "3) Cuando termine y reinicie, SI te pide quitar el medio: ejecuta este script otra vez"
Write-Host "   o en VirtualBox: Dispositivos > Unidades opticas > Quitar disco"
Write-Host ""
Write-Host "Ctrl derecho = suelta el mouse"
Write-Host ""
