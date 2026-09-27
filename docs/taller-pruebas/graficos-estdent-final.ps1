# Quita proteccion SIN reempaquetar todo el libro, y reemplaza
# los 5 graficos iguales (todos columnas) por tipos distintos.
$ErrorActionPreference = 'Continue'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$out = 'C:\Users\acost\Downloads\Plan_Negocio_EstDent_FINAL.xlsm'
if (-not (Test-Path -LiteralPath $out)) { throw "No existe $out" }

Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

function Remove-SheetProtection([string]$path) {
  $utf8 = New-Object System.Text.UTF8Encoding $false
  $zip = [System.IO.Compression.ZipFile]::Open($path, [System.IO.Compression.ZipArchiveMode]::Update)
  try {
    $names = @()
    foreach ($e in $zip.Entries) {
      if ($e.FullName -like 'xl/worksheets/sheet*.xml') { $names += $e.FullName }
    }
    $changed = 0
    foreach ($name in $names) {
      $entry = $zip.GetEntry($name)
      $reader = New-Object System.IO.StreamReader($entry.Open(), $utf8)
      $text = $reader.ReadToEnd()
      $reader.Close()
      if ($text -notmatch 'sheetProtection') { continue }
      $new = [regex]::Replace($text, '<sheetProtection\s[^>]*/>', '')
      $new = [regex]::Replace($new, '<sheetProtection\s[^>]*>.*?</sheetProtection>', '')
      if ($new -eq $text) { continue }
      $entry.Delete()
      $ne = $zip.CreateEntry($name, [System.IO.Compression.CompressionLevel]::Optimal)
      $writer = New-Object System.IO.StreamWriter($ne.Open(), $utf8)
      $writer.Write($new)
      $writer.Close()
      $changed++
    }
    Write-Output ("Proteccion retirada en hojas: " + $changed)
  }
  finally {
    $zip.Dispose()
  }
}

Remove-SheetProtection $out

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AskToUpdateLinks = $false

function Rgb($r, $g, $b) { return [int]($r + ($g * 256) + ($b * 65536)) }

try {
  $wb = $excel.Workbooks.Open($out)
  $excel.CalculateFullRebuild()

  $graf = $null
  $vent = $null
  $res = $null
  foreach ($ws in $wb.Worksheets) {
    if ($ws.Name -like '*Gr*fico*') { $graf = $ws }
    if ($ws.Name -like '3. Proyec*') { $vent = $ws }
    if ($ws.Name -like '5. Resumen*') { $res = $ws }
  }
  if ($null -eq $graf -or $null -eq $vent) { throw 'No encontre hojas de graficos o ventas' }

  Write-Output ("Protect graficos: " + $graf.ProtectContents)
  Write-Output ("Charts antes: " + $graf.ChartObjects().Count)
  $oldFormula = ''
  if ($graf.ChartObjects().Count -ge 1) {
    $oldFormula = [string]$graf.ChartObjects(1).Chart.SeriesCollection(1).Formula
    Write-Output ("Formula original chart1: " + $oldFormula)
    if ($oldFormula -match 'Inversiones') { throw 'La formula SERIES ya venia rota. Hay que partir de la plantilla original.' }
  }

  # Borrar los 5 graficos iguales (todos columnas)
  for ($i = $graf.ChartObjects().Count; $i -ge 1; $i--) {
    $graf.ChartObjects($i).Delete()
  }

  $vn = $vent.Name.Replace("'", "''")
  $rn = $res.Name.Replace("'", "''")

  # Tabla auxiliar con FORMULAS (no valores pegados)
  $graf.Range('A40').Value2 = 'Producto'
  $graf.Range('B40').Value2 = 'Unidades año 1'
  $graf.Range('D40').Value2 = 'Año'
  $graf.Range('E40').Value2 = 'Total unidades'
  $graf.Range('G40').Value2 = 'Producto'
  $graf.Range('H40').Value2 = 'Ventas año 1 (pesos)'

  for ($i = 0; $i -lt 5; $i++) {
    $r = 41 + $i
    $src = 7 + $i
    $graf.Range("A$r").Formula = "='$vn'!A$src"
    $graf.Range("B$r").Formula = "='$vn'!N$src"
    $graf.Range("G$r").Formula = "='$rn'!A$(47 + $i)"
    $graf.Range("H$r").Formula = "='$rn'!B$(47 + $i)"
  }
  $yearRows = @(
    @{ r = 41; label = 'Año 1'; cell = 'N12' },
    @{ r = 42; label = 'Año 2'; cell = 'N21' },
    @{ r = 43; label = 'Año 3'; cell = 'N30' },
    @{ r = 44; label = 'Año 4'; cell = 'N39' },
    @{ r = 45; label = 'Año 5'; cell = 'N48' }
  )
  foreach ($y in $yearRows) {
    $graf.Range("D$($y.r)").Value2 = $y.label
    $graf.Range("E$($y.r)").Formula = "='$vn'!$($y.cell)"
  }

  function Set-Title($chart, [string]$text) {
    $chart.HasTitle = $true
    $chart.ChartTitle.Text = $text
    $chart.ChartTitle.Font.Size = 12
    $chart.ChartTitle.Font.Bold = $true
  }

  # 1) COLUMNAS — unidades mes a mes del año 1
  $c1 = $graf.ChartObjects().Add(20, 55, 460, 230)
  $ch = $c1.Chart
  $ch.ChartType = 51
  $ch.SetSourceData($vent.Range('B58:M59'))
  Set-Title $ch 'Año 1 — Unidades vendidas por mes'
  $ch.HasLegend = $false
  $ch.SeriesCollection(1).Format.Fill.ForeColor.RGB = (Rgb 13 92 99)

  # 2) CIRCULAR — participacion por producto
  $c2 = $graf.ChartObjects().Add(500, 55, 400, 230)
  $ch = $c2.Chart
  $ch.ChartType = 5
  $ch.SetSourceData($graf.Range('A40:B45'))
  Set-Title $ch 'Año 1 — Participación por producto'
  $ch.HasLegend = $true
  $ch.Legend.Position = -4152
  $ser = $ch.SeriesCollection(1)
  $ser.HasDataLabels = $true
  try { $ch.ApplyDataLabels(3) } catch { Write-Output 'labels pie omitidos' }
  $pieColors = @(
    (Rgb 13 92 99),
    (Rgb 224 122 61),
    (Rgb 46 107 79),
    (Rgb 196 163 90),
    (Rgb 61 76 107)
  )
  for ($p = 1; $p -le 5; $p++) {
    $ser.Points($p).Format.Fill.ForeColor.RGB = $pieColors[$p - 1]
  }

  # 3) BARRAS horizontales — total unidades por año
  $c3 = $graf.ChartObjects().Add(20, 300, 460, 230)
  $ch = $c3.Chart
  $ch.ChartType = 57
  $ch.SetSourceData($graf.Range('D40:E45'))
  Set-Title $ch 'Total de unidades por año'
  $ch.HasLegend = $false
  $ch.SeriesCollection(1).Format.Fill.ForeColor.RGB = (Rgb 46 107 79)

  # 4) COLUMNAS — ventas en pesos por producto (año 1)
  $c4 = $graf.ChartObjects().Add(500, 300, 400, 230)
  $ch = $c4.Chart
  $ch.ChartType = 51
  $ch.SetSourceData($graf.Range('G40:H45'))
  Set-Title $ch 'Año 1 — Ventas en pesos por producto'
  $ch.HasLegend = $false
  $ch.SeriesCollection(1).Format.Fill.ForeColor.RGB = (Rgb 224 122 61)

  # 5) LINEAS — comparacion de los 5 años mes a mes
  $c5 = $graf.ChartObjects().Add(20, 550, 880, 280)
  $ch = $c5.Chart
  $ch.ChartType = 65
  $rows = @(
    @{ name = 'Año 1'; row = 59; color = (Rgb 13 92 99) },
    @{ name = 'Año 2'; row = 62; color = (Rgb 224 122 61) },
    @{ name = 'Año 3'; row = 65; color = (Rgb 46 107 79) },
    @{ name = 'Año 4'; row = 68; color = (Rgb 196 163 90) },
    @{ name = 'Año 5'; row = 71; color = (Rgb 61 76 107) }
  )
  $n = 0
  foreach ($item in $rows) {
    $n++
    $ch.SeriesCollection().NewSeries() | Out-Null
    $s = $ch.SeriesCollection($n)
    $s.Name = $item.name
    $s.XValues = "='$vn'!`$B`$58:`$M`$58"
    $s.Values = "='$vn'!`$B`$$($item.row):`$M`$$($item.row)"
    $s.Format.Line.ForeColor.RGB = $item.color
    $s.Format.Line.Weight = 2.25
    $s.MarkerStyle = 8
    $s.MarkerSize = 6
  }
  Set-Title $ch 'Comparación de unidades por mes — años 1 a 5'
  $ch.HasLegend = $true
  $ch.Legend.Position = -4107

  $excel.CalculateFullRebuild()
  $wb.Save()

  Write-Output ("Charts despues: " + $graf.ChartObjects().Count)
  $k = 0
  foreach ($co in $graf.ChartObjects()) {
    $k++
    $f = ''
    try { $f = [string]$co.Chart.SeriesCollection(1).Formula } catch { $f = 'sin formula' }
    Write-Output ("CHART $k type=$($co.Chart.ChartType) formula=$f")
    if ($f -match 'Inversiones') { throw 'SERIES corrupta' }
  }
  Write-Output ("E10 formula: " + $wb.Worksheets.Item('1. Inversiones').Range('E10').Formula)
  Write-Output ("E41 valor: " + $wb.Worksheets.Item('1. Inversiones').Range('E41').Value2)
  Write-Output 'OK GRAFICOS'
  $wb.Close($true)
}
finally {
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}
