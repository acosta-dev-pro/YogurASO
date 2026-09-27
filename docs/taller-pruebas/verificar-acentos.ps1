$ErrorActionPreference = 'Stop'
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$path = 'C:\Users\acost\Downloads\Plan_Negocio_EstDent_FINAL.xlsm'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($path)
$inv = $wb.Worksheets.Item('1. Inversiones')
$s = [string]$inv.Range('A14').Value2
$codes = @()
foreach ($ch in $s.ToCharArray()) { $codes += ([int]$ch) }
Write-Output ($codes -join ',')
# e = 233, a = 225, i = 237. Si aparece 195 (Ã) sigue mal.
Write-Output ("tiene e-acute 233: " + ($codes -contains 233))
Write-Output ("tiene mojibake 195: " + ($codes -contains 195))
$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
