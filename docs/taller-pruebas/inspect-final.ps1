$ErrorActionPreference = 'Stop'
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force
$f = 'C:\Users\acost\Downloads\Plan_Negocio_EstDent_System.xlsm'
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false; $excel.DisplayAlerts = $false
$excel.AutomationSecurity = 3
$wb = $excel.Workbooks.Open($f, 0, $true)
$out = New-Object System.Collections.Generic.List[string]
foreach ($ws in $wb.Worksheets) {
  if ($ws.Name -notmatch '^(10|11|12|13|14|Arranque|9\.)') { continue }
  $out.Add("===== " + $ws.Name + " visible=" + $ws.Visible)
  foreach ($sh in $ws.Shapes) {
    $act = ''; try { $act = $sh.OnAction } catch {}
    $txt = ''; try { $txt = $sh.TextFrame2.TextRange.Text } catch {}
    $out.Add("SHAPE " + $sh.Name + " type=" + $sh.Type + " at=" + $sh.TopLeftCell.Address($false,$false) + " onAction=" + $act + " text=" + $txt)
  }
  $ur = $ws.UsedRange
  $maxR = [math]::Min($ur.Row + $ur.Rows.Count, 80); $maxC = [math]::Min($ur.Column + $ur.Columns.Count, 14)
  for ($r = 1; $r -le $maxR; $r++) {
    $cells = @()
    for ($c = 1; $c -le $maxC; $c++) {
      $cell = $ws.Cells.Item($r, $c)
      $fm = [string]$cell.Formula
      if ($fm -ne '') {
        $t = ([string]$cell.Text).Trim()
        $neg = ''
        try { if ([double]$cell.Value2 -lt 0) { $neg = ' NEG' } } catch {}
        $lock = if ($cell.Locked) { '' } else { ' [INPUT]' }
        if ($fm.StartsWith('=')) { $cells += ($cell.Address($false,$false) + ' ' + $fm + ' => ' + $t + $neg + $lock) }
        else { $cells += ($cell.Address($false,$false) + ' [' + $t + ']' + $neg + $lock) }
      } elseif (-not $cell.Locked) {
        $cells += ($cell.Address($false,$false) + ' <VACIA INPUT>')
      }
    }
    if ($cells.Count) { $out.Add("R$r  " + ($cells -join '  ||  ')) }
  }
}
try {
  foreach ($comp in $wb.VBProject.VBComponents) {
    $cm = $comp.CodeModule
    if ($cm.CountOfLines -gt 0) { $out.Add("===== VBA " + $comp.Name); $out.Add($cm.Lines(1, $cm.CountOfLines)) }
  }
} catch { $out.Add("VBA no accesible: " + $_.Exception.Message) }
$wb.Close($false); $excel.Quit()
[IO.File]::WriteAllLines('C:\Users\acost\Desktop\YOGURASO-WEB\docs\taller-pruebas\inspect-final.txt', $out, (New-Object Text.UTF8Encoding $true))
"listo " + $out.Count
