$ErrorActionPreference = 'Stop'
$src = 'C:\Users\acost\Downloads\Plan de Negocio 3145644 -ANALISIS Y DESARROLLO DE SOFTWARE.xlsm'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($src, 0, $true)

function List-Unlocked($sheetName, $maxR, $maxC) {
  $ws = $null
  try { $ws = $wb.Worksheets.Item($sheetName) } catch { return }
  Write-Output ("==== " + $sheetName)
  for ($r = 1; $r -le $maxR; $r++) {
    for ($c = 1; $c -le $maxC; $c++) {
      $cell = $ws.Cells.Item($r, $c)
      if (-not $cell.Locked) {
        $v = $cell.Value2
        $addr = $cell.Address($false, $false)
        $txt = if ($null -eq $v) { '' } else { [string]$v }
        if ($txt.Length -gt 40) { $txt = $txt.Substring(0,40) }
        Write-Output ("UNLOCK " + $addr + " = [" + $txt + "]")
      }
    }
  }
}

List-Unlocked '7. Costos Fijos' 45 4
List-Unlocked '8. Gastos' 70 3
List-Unlocked 'Datos Aprendiz' 20 6
List-Unlocked 'Arranque del Negocio' 20 6

$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
