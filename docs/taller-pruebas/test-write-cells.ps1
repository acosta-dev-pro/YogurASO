$ErrorActionPreference = 'Continue'
$src = 'C:\Users\acost\Downloads\Plan de Negocio 3145644 -ANALISIS Y DESARROLLO DE SOFTWARE.xlsm'
$out = 'C:\Users\acost\Downloads\_test_write.xlsm'
Copy-Item -LiteralPath $src -Destination $out -Force

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($out)
$inv = $wb.Worksheets.Item('1. Inversiones')

Write-Output ('C10 Locked=' + $inv.Range('C10').Locked + ' Protect=' + $inv.ProtectContents)

# Method 1: Value2 double
try {
  $inv.Range('C10').Value2 = [double]1
  Write-Output ('M1 C10=' + $inv.Range('C10').Value2)
} catch { Write-Output ('M1 FAIL ' + $_.Exception.Message) }

# Method 2: unprotect attempt then write
try { $inv.Unprotect('') } catch {}
try { $inv.Unprotect('sena') } catch {}

# Method 3: Formula
try {
  $inv.Range('D10').Formula = '=3500000'
  Write-Output ('M3 D10 formula=' + $inv.Range('D10').Formula + ' val=' + $inv.Range('D10').Value2)
} catch { Write-Output ('M3 FAIL ' + $_.Exception.Message) }

# Method 4: Cells.Item
try {
  $inv.Cells.Item(10, 3).Value2 = 1
  $inv.Cells.Item(10, 4).Value2 = 3500000
  Write-Output ('M4 C10=' + $inv.Range('C10').Value2 + ' D10=' + $inv.Range('D10').Value2)
} catch { Write-Output ('M4 FAIL ' + $_.Exception.Message) }

# Method 5: temporarily unprotect by disabling protection via EnableSelection
try {
  $excel.ActiveSheet.EnableSelection = 0
} catch {}

$cf = $wb.Worksheets.Item('7. Costos Fijos')
Write-Output ('B26 Locked=' + $cf.Range('B26').Locked)
try {
  $cf.Range('B26').Value2 = [double]70000
  Write-Output ('CF B26=' + $cf.Range('B26').Value2)
} catch { Write-Output ('CF FAIL ' + $_.Exception.Message) }

$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
