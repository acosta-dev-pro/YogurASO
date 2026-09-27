# Arregla arranque Ubuntu + abre YogurASO en Firefox (solo Ubuntu, no abre Windows)
$VBox = "${env:ProgramFiles}\Oracle\VirtualBox\VBoxManage.exe"
$VmName = "Ubuntu-Server-AA5"
$Project = "C:\Users\acost\Desktop\YOGURASO-WEB"

Write-Host "=== Arreglar Ubuntu + Firefox YogurASO ===" -ForegroundColor Cyan

$state = (& $VBox showvminfo $VmName --machinereadable | Select-String 'VMState="(.+)"').Matches.Groups[1].Value
Write-Host "Estado VM: $state"

if ($state -eq "stopping" -or $state -eq "running") {
    Write-Host "Cierra la ventana de Ubuntu en VirtualBox (Apagar) y vuelve a ejecutar este script." -ForegroundColor Yellow
    Write-Host "O en VirtualBox: Maquina -> Apagar el sistema"
    exit 1
}

if ($state -ne "poweroff") {
    & $VBox controlvm $VmName poweroff 2>$null
    Start-Sleep 5
}

& $VBox modifyvm $VmName --boot1 disk --boot2 none --boot3 none --boot4 none
& $VBox storageattach $VmName --storagectl IDE --port 0 --device 0 --type dvddrive --medium none 2>$null
& $VBox sharedfolder remove $VmName --name yoguraso 2>$null
& $VBox sharedfolder add $VmName --name yoguraso --hostpath $Project --automount
& $VBox modifyvm $VmName --natpf1 delete aa5http 2>$null
& $VBox modifyvm $VmName --natpf1 "aa5http,tcp,,8088,,8080" 2>$null

Write-Host "Arrancando Ubuntu..."
& $VBox startvm $VmName --type gui
Write-Host ""
Write-Host "Cuando aparezca el escritorio:" -ForegroundColor Green
Write-Host "  1) Abre Terminal (Ctrl+Alt+T)"
Write-Host "  2) Pega y ejecuta:"
Write-Host ""
Write-Host "echo ubuntu123 | sudo -S mount -t vboxsf yoguraso /mnt/yoguraso && bash /mnt/yoguraso/scripts/abrir-yoguraso-firefox.sh" -ForegroundColor Yellow
Write-Host ""
Write-Host "Eso levanta Docker y abre Firefox con YogurASO en http://127.0.0.1:8080"
