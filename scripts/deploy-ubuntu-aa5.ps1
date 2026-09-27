# Despliega YogurASO en Ubuntu VM (AA5) via TTY3
$VBox = "${env:ProgramFiles}\Oracle\VirtualBox\VBoxManage.exe"
$VmName = "Ubuntu-Server-AA5"
$Out = "$env:USERPROFILE\Downloads\GA10-AA5-evidencias"
New-Item -ItemType Directory -Force -Path $Out | Out-Null

function Shot($n) {
    & $VBox controlvm $VmName screenshotpng (Join-Path $Out $n) 2>$null
    Write-Host "saved $n"
}
function RunCmd($cmd, $w = 3) {
    Write-Host ">> $($cmd.Substring(0, [Math]::Min(80, $cmd.Length)))"
    & $VBox controlvm $VmName keyboardputstring $cmd
    Start-Sleep -Milliseconds 1200
    & $VBox controlvm $VmName keyboardputscancode 1c 9c
    Start-Sleep -Seconds $w
}
$pw = @('16','96','30','b0','16','96','31','b1','14','94','16','96','02','82','03','83','04','84','1c','9c')

# TTY3 login
& $VBox controlvm $VmName keyboardputscancode 1d 38 3d bd b8 9d
Start-Sleep -Seconds 4
1..2 | ForEach-Object { & $VBox controlvm $VmName keyboardputscancode 1c 9c; Start-Sleep -Seconds 1 }
& $VBox controlvm $VmName keyboardputstring "estudiante"
Start-Sleep -Seconds 1
& $VBox controlvm $VmName keyboardputscancode 1c 9c
Start-Sleep -Seconds 4
& $VBox controlvm $VmName keyboardputscancode @pw
Start-Sleep -Seconds 5
Shot "auto_tty_login.png"
RunCmd "whoami" 2

# Deploy script from shared folder
RunCmd "bash /media/sf_yoguraso/scripts/ubuntu-aa5-deploy.sh" 180
Shot "auto_deploy.png"
RunCmd "echo ubuntu123 | sudo -S docker ps" 8
Shot "auto_ps.png"

# Firefox
& $VBox controlvm $VmName keyboardputscancode 38 3c be b8
Start-Sleep -Seconds 2
& $VBox controlvm $VmName keyboardputstring "firefox http://127.0.0.1:8080"
Start-Sleep -Seconds 1
& $VBox controlvm $VmName keyboardputscancode 1c 9c
Start-Sleep -Seconds 15
Shot "auto_firefox.png"
Write-Host "DEPLOY SCRIPT DONE"
