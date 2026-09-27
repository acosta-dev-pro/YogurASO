$ErrorActionPreference = 'Stop'
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
  $wb = $excel.Workbooks.Open('C:\Users\acost\Downloads\Plan de Negocio 3145644 -ANALISIS Y DESARROLLO DE SOFTWARE.xlsm', 0, $true)
  $di = $wb.Worksheets.Item('DI')
  Write-Output ('Original G76 formula=' + $di.Range('G76').Formula + ' texto=' + $di.Range('G76').Text)
  foreach ($c in 'D','E','F','G','H','I') { Write-Output ("$c" + '75/76: ' + $di.Range($c + '75').Text + ' / ' + $di.Range($c + '76').Formula) }
  $wb.Close($false)

  $wb2 = $excel.Workbooks.Open('C:\Users\acost\Downloads\Plan_Negocio_EstDent_System.xlsm', 0, $true)
  $inv = $wb2.Worksheets.Item('1. Inversiones')
  $s = [string]$inv.Range('A15').Value2
  Write-Output ('A15 codes: ' + (($s.ToCharArray() | ForEach-Object { [int]$_ }) -join ','))
  $gr = $null
  foreach ($ws in $wb2.Worksheets) { if ($ws.Name -like 'Gr*ficos Ventas') { $gr = $ws } }
  $t = [string]$gr.ChartObjects(1).Chart.ChartTitle.Text
  Write-Output ('Title codes: ' + (($t.ToCharArray() | ForEach-Object { [int]$_ }) -join ','))
  Write-Output ('Protegida inversiones: ' + $inv.ProtectContents)
  Write-Output ('E10: ' + $inv.Range('E10').Formula)
  $wb2.Close($false)
} finally {
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
