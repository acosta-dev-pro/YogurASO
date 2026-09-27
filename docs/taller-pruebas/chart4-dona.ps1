$ErrorActionPreference = 'Stop'
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$out = 'C:\Users\acost\Downloads\Plan_Negocio_EstDent_FINAL.xlsm'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($out)
$graf = $null
foreach ($ws in $wb.Worksheets) { if ($ws.Name -like '*Gr*fico*') { $graf = $ws; break } }
# ChartObjects order is creation order: 4th is ventas en pesos
$co = $graf.ChartObjects(4)
$co.Chart.ChartType = -4120
$co.Chart.HasTitle = $true
$co.Chart.ChartTitle.Text = 'Año 1 — Ventas en pesos por producto'
$f = [string]$co.Chart.SeriesCollection(1).Formula
Write-Output ("type=" + $co.Chart.ChartType + " formula=" + $f)
if ($f -match 'Inversiones') { throw 'SERIES rota' }
$wb.Save()
$wb.Close($true)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
Write-Output 'OK dona'
