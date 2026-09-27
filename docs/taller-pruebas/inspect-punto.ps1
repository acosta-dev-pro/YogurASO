$ErrorActionPreference = 'Stop'
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force
foreach ($f in @('C:\Users\acost\Downloads\Plan de Negocio 3145644 -ANALISIS Y DESARROLLO DE SOFTWARE.xlsm', 'C:\Users\acost\Downloads\Plan_Negocio_EstDent_System.xlsm')) {
  Write-Output ("##### " + (Split-Path $f -Leaf))
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false; $excel.DisplayAlerts = $false; $excel.AutomationSecurity = 3
  $wb = $excel.Workbooks.Open($f, 0, $true)
  $inv = $wb.Worksheets.Item('1. Inversiones')
  foreach ($sh in $inv.Shapes) { $at = ''; try { $at = $sh.TopLeftCell.Address($false,$false) } catch {}; Write-Output ("INV SHAPE " + $sh.Name + " type=" + $sh.Type + " at=" + $at + " w=" + $sh.Width + " h=" + $sh.Height) }
  foreach ($name in @('.', '14, Resumen Ejecutivo', '10. Flujo de Caja', '11. Estado PyG')) {
    $ws = $wb.Worksheets.Item($name)
    Write-Output ("== " + $name)
    for ($r = 1; $r -le 50; $r++) { for ($c = 1; $c -le 9; $c++) {
      $cell = $ws.Cells.Item($r, $c)
      $fm = [string]$cell.Formula
      $txt = ([string]$cell.Text).Trim()
      $red = ''
      try { if ($cell.DisplayFormat.Font.Color -eq 255 -or $cell.DisplayFormat.Font.ColorIndex -eq 3) { $red = ' ROJO' } } catch {}
      $nf = [string]$cell.NumberFormat
      if (($name -eq '.' -and $fm -ne '') -or $red -or ($txt -match '^-|\(')) {
        Write-Output ("  " + $cell.Address($false,$false) + " f=" + $fm + " t=" + $txt + $red + " nf=" + $nf)
      }
    } }
  }
  $wb.Close($false); $excel.Quit()
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
  Start-Sleep 2
  Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force
}
