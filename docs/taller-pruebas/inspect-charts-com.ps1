$ErrorActionPreference = 'Continue'
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$src = 'C:\Users\acost\Downloads\Plan de Negocio 3145644 -ANALISIS Y DESARROLLO DE SOFTWARE.xlsm'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($src, 0, $true)

$graf = $null
foreach ($ws in $wb.Worksheets) {
  if ($ws.Name -like '*Gr*fico*') { $graf = $ws; break }
}
Write-Output ("SHEET=" + $graf.Name + " charts=" + $graf.ChartObjects().Count)
$i = 0
foreach ($co in $graf.ChartObjects()) {
  $i++
  $ch = $co.Chart
  Write-Output ("--- CHART $i type=" + $ch.ChartType + " title=" + $ch.HasTitle)
  try { Write-Output ("    name=" + $co.Name + " left=" + [int]$co.Left + " top=" + [int]$co.Top + " w=" + [int]$co.Width + " h=" + [int]$co.Height) } catch {}
  $s = 0
  foreach ($ser in $ch.SeriesCollection()) {
    $s++
    if ($s -gt 3) { break }
    try { Write-Output ("    SER $s formula=" + $ser.Formula) } catch { Write-Output ("    SER $s formula FAIL") }
  }
}

# data rows used by charts on proyeccion
$vent = $null
foreach ($ws in $wb.Worksheets) { if ($ws.Name -like '3. Proyec*') { $vent = $ws; break } }
Write-Output '--- Proyeccion rows 55-72 col A-B ---'
for ($r = 55; $r -le 72; $r++) {
  $a = $vent.Cells.Item($r, 1).Text
  $b = $vent.Cells.Item($r, 2).Text
  if ($a -or $b) { Write-Output ("R$r A=[$a] B=[$b]") }
}

$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()
