$ErrorActionPreference = 'Stop'
$src = 'C:\Users\acost\Downloads\Plan de Negocio 3145644 -ANALISIS Y DESARROLLO DE SOFTWARE.xlsm'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($src, 0, $true)
$inv = $wb.Worksheets.Item('1. Inversiones')

# Try unprotect
$pwds = @('', 'sena', 'SENA', '1234', '12345', 'plan', 'negocio', '3145644', 'admin')
$ok = $false
foreach ($p in $pwds) {
  try {
    $inv.Unprotect($p)
    Write-Output ("UNPROTECT OK with pwd len=" + $p.Length + " value=[" + $p + "]")
    $ok = $true
    break
  } catch {}
}
if (-not $ok) { Write-Output 'UNPROTECT FAILED all passwords' }

Write-Output ('Protect now: ' + $inv.ProtectContents)
Write-Output ('E10 HasFormula: ' + $inv.Range('E10').HasFormula)
Write-Output ('E10 Formula: [' + $inv.Range('E10').Formula + ']')
Write-Output ('E10 FormulaLocal: [' + $inv.Range('E10').FormulaLocal + ']')
Write-Output ('E10 Value2: [' + $inv.Range('E10').Value2 + ']')
Write-Output ('E21 Formula: [' + $inv.Range('E21').Formula + ']')
Write-Output ('E41 Formula: [' + $inv.Range('E41').Formula + ']')
Write-Output ('D7 Formula: [' + $inv.Range('D7').Formula + ']')

# Yellow editable?
Write-Output ('C10 Locked: ' + $inv.Range('C10').Locked)
Write-Output ('E10 Locked: ' + $inv.Range('E10').Locked)
Write-Output ('E10 FormulaHidden: ' + $inv.Range('E10').FormulaHidden)

$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
