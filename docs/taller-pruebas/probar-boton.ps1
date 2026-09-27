$ErrorActionPreference = 'Stop'
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force
$f = 'C:\Users\acost\Downloads\Plan_Negocio_EstDent_System.xlsm'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false; $excel.DisplayAlerts = $false
$excel.AutomationSecurity = 1
$wb = $excel.Workbooks.Open($f, 0, $true)
$inv = $wb.Worksheets.Item('1. Inversiones')
foreach ($sh in $inv.Shapes) {
  $at = ''; try { $at = $sh.TopLeftCell.Address($false,$false) } catch {}
  Write-Output ("INV SHAPE " + $sh.Name + " type=" + $sh.Type + " at=" + $at + " w=" + $sh.Width + " h=" + $sh.Height)
}
$pe = $wb.Worksheets.Item('12. P.E')
$pe.Activate()
$pe.Range('B4').Value2 = [double]100000000
$excel.Calculate()
Write-Output ("Antes del botón: B4=" + $pe.Range('B4').Text.Trim() + " B14=" + $pe.Range('B14').Text.Trim())
$excel.Run("'" + $wb.Name + "'!PEQU")
$excel.Calculate()
Write-Output ("Después del botón: B4=" + $pe.Range('B4').Text.Trim() + " B14=" + $pe.Range('B14').Text.Trim() + " B22=" + $pe.Range('B22').Text.Trim())
$cal = $wb.Worksheets.Item(17)
Write-Output ("Calculadora: " + $cal.Name + " D7:E7 merged=" + $cal.Range('D8').MergeCells + " area=" + $cal.Range('D8').MergeArea.Address($false,$false))
$wb.Close($false); $excel.Quit()
