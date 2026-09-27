$ErrorActionPreference = 'Stop'
$src = 'C:\Users\acost\Downloads\Plan de Negocio 3145644 -ANALISIS Y DESARROLLO DE SOFTWARE.xlsm'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AskToUpdateLinks = $false
$wb = $excel.Workbooks.Open($src, 0, $true) # read-only

Write-Output ('Sheets=' + $wb.Worksheets.Count)
foreach ($ws in $wb.Worksheets) {
  $nCharts = $ws.ChartObjects().Count
  if ($nCharts -gt 0 -or $ws.Name -match 'Gr[aá]fico|Ventas|Invers') {
    Write-Output ("SHEET: " + $ws.Name + " charts=" + $nCharts)
  }
}

# Sample formulas
$inv = $wb.Worksheets.Item('1. Inversiones')
Write-Output ('E10 formula: ' + $inv.Range('E10').Formula)
Write-Output ('E21 formula: ' + $inv.Range('E21').Formula)
Write-Output ('E41 formula: ' + $inv.Range('E41').Formula)
Write-Output ('Protect: ' + $inv.ProtectContents)

$graf = $null
try { $graf = $wb.Worksheets.Item('Gráficos Ventas') } catch {}
if ($graf -eq $null) {
  foreach ($ws in $wb.Worksheets) {
    if ($ws.Name -like '*Gr*fico*') { $graf = $ws; break }
  }
}
if ($graf -ne $null) {
  Write-Output ('Graf sheet: ' + $graf.Name + ' charts=' + $graf.ChartObjects().Count)
}

$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
[GC]::Collect()
[GC]::WaitForPendingFinalizers()
