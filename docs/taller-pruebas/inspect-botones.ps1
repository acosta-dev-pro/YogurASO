$ErrorActionPreference = 'Stop'
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force
foreach ($f in @('C:\Users\acost\Downloads\Plan de Negocio 3145644 -ANALISIS Y DESARROLLO DE SOFTWARE.xlsm', 'C:\Users\acost\Downloads\Plan_Negocio_EstDent_System.xlsm')) {
  $zone = Get-Content -Path $f -Stream Zone.Identifier -ErrorAction SilentlyContinue
  Write-Output ("##### " + (Split-Path $f -Leaf) + " | MOTW=" + ($zone -join ' '))
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false; $excel.DisplayAlerts = $false; $excel.AutomationSecurity = 3
  $wb = $excel.Workbooks.Open($f, 0, $true)
  foreach ($ws in $wb.Worksheets) {
    $line = $ws.Name + " visible=" + $ws.Visible + " shapes=" + $ws.Shapes.Count
    Write-Output $line
    foreach ($sh in $ws.Shapes) {
      $act = ''; try { $act = $sh.OnAction } catch {}
      $txt = ''; try { $txt = $sh.TextFrame2.TextRange.Text } catch {}
      if ($act -or $txt) { Write-Output ("   SHAPE " + $sh.Name + " at=" + $sh.TopLeftCell.Address($false,$false) + " onAction=" + $act + " text=" + $txt) }
    }
  }
  $r = $wb.Worksheets.Item('.')
  Write-Output (". usado=" + $r.UsedRange.Address($false,$false))
  $wb.Close($false); $excel.Quit()
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
  Start-Sleep 2
  Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force
}
