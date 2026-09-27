$ErrorActionPreference = 'Stop'
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
try {
  $wb = $excel.Workbooks.Open('C:\Users\acost\Downloads\Plan_Negocio_EstDent_System.xlsm', 0, $true)
  $pe = $null
  foreach ($ws in $wb.Worksheets) { if ($ws.Name -like '12. P.E*') { $pe = $ws } }
  for ($r = 1; $r -le 40; $r++) {
    $parts = @()
    for ($c = 1; $c -le 12; $c++) {
      $cell = $pe.Cells.Item($r, $c)
      $f = [string]$cell.Formula
      if ($f -ne '') {
        $txt = [string]$cell.Text
        if ($f.StartsWith('=')) { $parts += ($cell.Address($false,$false) + ' ' + $f + ' => ' + $txt.Trim()) }
        else { $parts += ($cell.Address($false,$false) + ' [' + $f.Substring(0, [math]::Min(110, $f.Length)) + ']') }
      }
    }
    if ($parts.Count) { Write-Output ("R$r  " + ($parts -join '  ||  ')) }
  }
  $wb.Close($false)
} finally {
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
