# Plan de Negocio EstDent System - generación limpia desde la plantilla original.
# 1) Copia la plantilla  2) quita la protección de hojas en el XML (antes de abrir en Excel)
# 3) Excel llena todas las celdas amarillas  4) reconstruye 5 gráficos distintos
# 5) Excel guarda el libro (paquete limpio, sin reparaciones)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$src   = 'C:\Users\acost\Downloads\Plan de Negocio 3145644 -ANALISIS Y DESARROLLO DE SOFTWARE.xlsm'
$work  = 'C:\Users\acost\Downloads\_estdent_trabajo.xlsm'
$final = 'C:\Users\acost\Downloads\Plan_Negocio_EstDent_System.xlsm'

Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
if (-not (Test-Path -LiteralPath $src)) { throw "No existe la plantilla: $src" }
Copy-Item -LiteralPath $src -Destination $work -Force

# ---------- 2) quitar sheetProtection del XML ----------
$utf8 = New-Object System.Text.UTF8Encoding $false
$zip = [System.IO.Compression.ZipFile]::Open($work, [System.IO.Compression.ZipArchiveMode]::Update)
try {
  $names = @($zip.Entries | Where-Object { $_.FullName -like 'xl/worksheets/sheet*.xml' } | ForEach-Object { $_.FullName })
  $n = 0
  foreach ($name in $names) {
    $entry = $zip.GetEntry($name)
    $sr = New-Object System.IO.StreamReader($entry.Open(), $utf8)
    $text = $sr.ReadToEnd(); $sr.Close()
    $new = [regex]::Replace($text, '<sheetProtection\b[^>]*/>', '')
    if ($new -ne $text) {
      $entry.Delete()
      $ne = $zip.CreateEntry($name, [System.IO.Compression.CompressionLevel]::Optimal)
      $sw = New-Object System.IO.StreamWriter($ne.Open(), $utf8)
      $sw.Write($new); $sw.Close()
      $n++
    }
  }
  Write-Output "Hojas desprotegidas: $n"
} finally { $zip.Dispose() }

# ---------- 3) Excel ----------
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AskToUpdateLinks = $false
$excel.ScreenUpdating = $false

function Sheet($wb, [string]$like) {
  foreach ($ws in $wb.Worksheets) { if ($ws.Name -like $like) { return $ws } }
  throw "No encontré la hoja $like"
}
function Put($ws, [string]$addr, $value) {
  $r = $ws.Range($addr)
  if ($value -is [string]) {
    if ($value.StartsWith('=')) { $r.Formula = $value } else { $r.Value2 = $value }
  } else { $r.Value2 = [double]$value }
}
function Months($ws, [int]$row, [int[]]$vals) {
  $cols = 'B','C','D','E','F','G','H','I','J','K','L','M'
  for ($i = 0; $i -lt 12; $i++) { Put $ws ($cols[$i] + $row) $vals[$i] }
}
function Fit($ws, [string]$addr) {
  $r = $ws.Range($addr)
  $r.WrapText = $false
  $r.ShrinkToFit = $true
}
function Rgb($r, $g, $b) { [int]($r + $g * 256 + $b * 65536) }

try {
  $wb = $excel.Workbooks.Open($work)
  $excel.Calculation = -4135   # manual mientras se llena

  # ===== Datos Aprendiz =====
  $da = Sheet $wb 'Datos Aprendiz'
  Put $da 'B6'  'EstDent System'
  Put $da 'A12' 'Juan Esteban Acosta'
  Put $da 'B12' 'CC'

  # ===== 1. Inversiones =====
  $inv = Sheet $wb '1. Inversiones'
  Put $inv 'E3' 1
  $maq = @(
    @('A10','Portátil desarrollador 1','Equipo',1,3500000),
    @('A11','Portátil desarrollador 2','Equipo',1,2800000),
    @('A12','Monitores adicionales','Equipo',3,650000),
    @('A13','UPS regulador','Equipo',2,320000),
    @('A14','Periféricos','Kit',3,160000),
    @('A15','Disco de respaldo','Equipo',1,320000)
  )
  foreach ($m in $maq) {
    $row = $m[0].Substring(1)
    Put $inv ('A' + $row) $m[1]; Put $inv ('B' + $row) $m[2]
    Put $inv ('C' + $row) $m[3]; Put $inv ('D' + $row) $m[4]
    Fit $inv ('A' + $row)
  }
  Put $inv 'C20' 1; Put $inv 'D20' 900000          # licencias y herramientas base
  Put $inv 'C23' 3; Put $inv 'D23' 420000          # escritorios
  Put $inv 'C24' 3; Put $inv 'D24' 380000          # sillas
  Put $inv 'C25' 1; Put $inv 'D25' 280000          # archivador
  Put $inv 'C26' 1; Put $inv 'D26' 350000          # SST: extintor, botiquín
  Put $inv 'C34' 1; Put $inv 'D34' 2500000         # computador del gerente (emprendedor)
  Put $inv 'C35' 1; Put $inv 'D35' 520000          # impresora multifuncional
  Put $inv 'C36' 0; Put $inv 'D36' 0               # aire acondicionado: lo incluye el coworking
  Put $inv 'C39' 1; Put $inv 'D39' 380000          # router y red

  # ===== 2. Mercado =====
  $mer = Sheet $wb '2. Mercado'
  $prod = @(
    @('EstDent Básico',79000),
    @('EstDent Profesional',129000),
    @('EstDent Clínica',199000),
    @('Configuración inicial',250000),
    @('Automatización a medida',350000)
  )
  for ($i = 0; $i -lt 5; $i++) {
    Put $mer ('A' + (5 + $i)) $prod[$i][0]
    Put $mer ('B' + (5 + $i)) $prod[$i][1]
    Fit $mer ('A' + (5 + $i))
  }
  Put $mer 'A12' 'NovusOral';  Put $mer 'B12' 'Colombia (online)'
  Put $mer 'A13' 'DentaraOS';  Put $mer 'B13' 'Colombia (online)'
  Put $mer 'A14' 'NacarOS';    Put $mer 'B14' 'Colombia (online)'
  # Precio equivalente de cada competidor para el mismo alcance del plan:
  # Básico = 1 profesional, Profesional = 2, Clínica = 4 (precio por usuario x usuarios)
  $comp = @(
    @(50000, 129000, 46400),     # Básico
    @(100000, 159000, 92800),    # Profesional
    @(200000, 229000, 185600),   # Clínica
    @(180000, 300000, 220000),   # Configuración inicial
    @(300000, 450000, 400000)    # Automatización
  )
  for ($i = 0; $i -lt 5; $i++) {
    $r = 18 + $i
    Put $mer ('C' + $r) $comp[$i][0]
    Put $mer ('D' + $r) $comp[$i][1]
    Put $mer ('E' + $r) $comp[$i][2]
  }

  # ===== 3. Proyección de ventas (año 1) =====
  # Unidad = mensualidad facturada. Suscripciones activas por mes (acumuladas).
  # Configuración = 1 por cada consultorio nuevo (25 en el mes 1, luego 13 por mes).
  $ven = Sheet $wb '3. Proyec*'
  Months $ven 7  @(12,17,22,27,32,37,42,47,52,57,62,67)   # Básico  (+5 por mes)
  Months $ven 8  @(14,21,28,35,42,49,56,63,70,77,84,91)   # Profesional (+7 por mes)
  Months $ven 9  @(3,6,9,12,15,18,21,24,27,30,33,36)      # Clínica (+3 por mes)
  Months $ven 10 @(29,15,15,15,15,15,15,15,15,15,15,15)   # Configuración = clientes nuevos
  Months $ven 11 @(2,2,3,3,4,4,4,5,5,5,6,6)               # Automatizaciones

  # ===== 4. Costos variables (costo por unidad) =====
  $cv = Sheet $wb '4. Costos Variables'
  $bloques = @(
    @(9,  @('Servidor en la nube',8000),  @('Almacenamiento y copias',2500), @('Correos y notificaciones',2000), 3000),
    @(26, @('Servidor en la nube',10000), @('Almacenamiento y copias',3500), @('Mensajería y APIs',3000),         4500),
    @(44, @('Servidor en la nube',12000), @('Almacenamiento y copias',5000), @('Mensajería y reportes',5000),     7000),
    @(62, @('Horas de configuración',28000), @('Capacitación al consultorio',12000), @('Carga de datos inicial',5000), 4000),
    @(80, @('Horas de desarrollo',50000), @('Integraciones API',20000), @('Pruebas y despliegue',10000),          8000)
  )
  foreach ($b in $bloques) {
    $r0 = [int]$b[0]
    for ($k = 1; $k -le 3; $k++) {
      $r = $r0 + $k - 1
      Put $cv ('A' + $r) $b[$k][0]
      Put $cv ('B' + $r) 1
      Put $cv ('C' + $r) $b[$k][1]
      Fit $cv ('A' + $r)
    }
    Put $cv ('C' + ($r0 + 3)) $b[4]   # fila "Otros costos variables" de la plantilla
  }

  # ===== 6. Nómina =====
  $nom = Sheet $wb '6. Nomina'
  Put $nom 'C6' 1750905                       # Emprendedor, SMMLV 2026
  Put $nom 'A7' 'Desarrollador 1'; Put $nom 'B7' 'Producción'; Put $nom 'C7' 2200000
  Put $nom 'A8' 'Desarrollador 2'; Put $nom 'B8' 'Producción'; Put $nom 'C8' 1750905
  Fit $nom 'A7'; Fit $nom 'A8'
  Put $nom 'A29' 'Asesor comercial'; Put $nom 'B29' 800000
  Fit $nom 'A29'

  # ===== 7. Costos fijos =====
  $cf = Sheet $wb '7. Costos Fijos'
  Put $cf 'B4'  500000                        # puesto en coworking
  Put $cf 'A26' 'Suscripción Cursor AI'
  Put $cf 'B26' 70000
  Fit $cf 'A26'

  # ===== 8. Gastos =====
  $ga = Sheet $wb '8. Gastos'
  Put $ga 'A40' 'Internet y datos celulares';  Put $ga 'B40' 120000
  Put $ga 'A41' 'Suministros de oficina';      Put $ga 'B41' 50000
  Put $ga 'A42' 'Dominio y correo corporativo'; Put $ga 'B42' 60000
  Put $ga 'A49' 'Publicidad en redes sociales'; Put $ga 'B49' 200000
  Put $ga 'A50' 'Posicionamiento web (SEO)';   Put $ga 'B50' 100000
  Put $ga 'A51' 'Material impreso para visitas'; Put $ga 'B51' 40000
  Put $ga 'A52' 'Demostraciones y eventos';    Put $ga 'B52' 50000
  Put $ga 'A53' 'Otros gastos de venta';        Put $ga 'B53' 60000
  foreach ($a in 'A40','A41','A42','A49','A50','A51','A52','A53') { Fit $ga $a }

  # ===== 9. Crédito =====
  $cr = Sheet $wb '9. Calculadora*'
  Put $cr 'D8' 60                             # igual al plazo de la tabla que alimenta el flujo (D61)

  $fcx = Sheet $wb '10. Flujo*'
  foreach ($c in 'C','D','E') { Put $fcx ($c + '31') ("=+" + $c + "23-" + $c + "30") }
  foreach ($r in 10,16,17,19,20) { Put $fcx ("H$r") ("=SUM(C" + $r + ":G" + $r + ")") }

  $rex = Sheet $wb '14, Resumen*'
  foreach ($k in 0..2) {
    $src = 12 + $k; $dst = 4 + $k
    Put $rex ("A$dst") ("=IF('Datos Aprendiz'!A$src=`"`",`"`",'Datos Aprendiz'!A$src)")
    Put $rex ("D$dst") ("=IF('Datos Aprendiz'!C$src=`"`",`"`",'Datos Aprendiz'!C$src)")
  }

  # ===== 12. Punto de equilibrio =====
  $excel.Calculation = -4105
  $excel.CalculateFullRebuild()

  # Buscar objetivo (lo que pide la hoja): B14 = 0 cambiando Ventas B4
  $pe = Sheet $wb '12. P.E'
  Put $pe 'B4' ($pe.Range('B20').Value2)
  $ok = $pe.Range('B14').GoalSeek(0, $pe.Range('B4'))
  Put $pe 'B4' ([double][math]::Ceiling([double]$pe.Range('B4').Value2))
  $excel.CalculateFullRebuild()
  Write-Output ("Buscar objetivo OK=" + $ok + " | P.E ventas B4=" + $pe.Range('B4').Text.Trim() + " | B14=" + $pe.Range('B14').Text.Trim() + " | proyectadas B20=" + $pe.Range('B20').Text.Trim() + " | B22=" + $pe.Range('B22').Text)

  # ===== Gráficos: 5 tipos distintos =====
  $gr = Sheet $wb 'Gr*ficos Ventas'
  $res = Sheet $wb '5. Resumen*'
  for ($i = $gr.ChartObjects().Count; $i -ge 1; $i--) { $gr.ChartObjects($i).Delete() }

  $vn = $ven.Name.Replace("'", "''")
  $rn = $res.Name.Replace("'", "''")
  Put $gr 'A40' 'Producto';      Put $gr 'B40' 'Unidades año 1'
  Put $gr 'D40' 'Año';           Put $gr 'E40' 'Unidades'
  Put $gr 'G40' 'Producto';      Put $gr 'H40' 'Ventas año 1'
  for ($i = 0; $i -lt 5; $i++) {
    $r = 41 + $i
    Put $gr ('A' + $r) ("='" + $vn + "'!A" + (7 + $i))
    Put $gr ('B' + $r) ("='" + $vn + "'!N" + (7 + $i))
    Put $gr ('G' + $r) ("='" + $rn + "'!A" + (47 + $i))
    Put $gr ('H' + $r) ("='" + $rn + "'!B" + (47 + $i))
    Put $gr ('D' + $r) ('Año ' + ($i + 1))
    Put $gr ('E' + $r) ("='" + $rn + "'!" + ('B','C','D','E','F')[$i] + '12')
  }
  $gr.Range('H41:H45').NumberFormat = '$ #,##0'
  $gr.Range('B41:B45').NumberFormat = '#,##0'
  $gr.Range('E41:E45').NumberFormat = '#,##0'

  function Title($ch, [string]$t) {
    $ch.HasTitle = $true
    $ch.ChartTitle.Text = $t
    $ch.ChartTitle.Font.Size = 12
    $ch.ChartTitle.Font.Bold = $true
  }
  $teal = Rgb 13 92 99; $orange = Rgb 224 122 61; $green = Rgb 46 107 79
  $gold = Rgb 196 163 90; $navy = Rgb 61 76 107
  $pal = @($teal, $orange, $green, $gold, $navy)

  # 1 Columnas: unidades por mes año 1
  $ch = $gr.ChartObjects().Add(20, 60, 470, 240).Chart
  $ch.ChartType = 51
  $ch.SetSourceData($ven.Range('B58:M59'))
  Title $ch 'Año 1: unidades facturadas por mes'
  $ch.HasLegend = $false
  $ch.SeriesCollection(1).Format.Fill.ForeColor.RGB = $teal

  # 2 Circular: participación por producto
  $ch = $gr.ChartObjects().Add(510, 60, 420, 240).Chart
  $ch.ChartType = 5
  $ch.SetSourceData($gr.Range('A40:B45'))
  Title $ch 'Año 1: participación por producto (unidades)'
  $ch.HasLegend = $true
  $ch.Legend.Position = -4152
  try { $ch.ApplyDataLabels(3) } catch {}
  for ($p = 1; $p -le 5; $p++) { $ch.SeriesCollection(1).Points($p).Format.Fill.ForeColor.RGB = $pal[$p - 1] }

  # 3 Barras horizontales: unidades por año
  $ch = $gr.ChartObjects().Add(20, 320, 470, 240).Chart
  $ch.ChartType = 57
  $ch.SetSourceData($gr.Range('D40:E45'))
  Title $ch 'Unidades totales proyectadas por año'
  $ch.HasLegend = $false
  $ch.SeriesCollection(1).Format.Fill.ForeColor.RGB = $green

  # 4 Anillo: ventas en pesos por producto
  $ch = $gr.ChartObjects().Add(510, 320, 420, 240).Chart
  $ch.ChartType = -4120
  $ch.SetSourceData($gr.Range('G40:H45'))
  Title $ch 'Año 1: ventas en pesos por producto'
  $ch.HasLegend = $true
  $ch.Legend.Position = -4152
  for ($p = 1; $p -le 5; $p++) { $ch.SeriesCollection(1).Points($p).Format.Fill.ForeColor.RGB = $pal[$p - 1] }

  # 5 Líneas: años 1 a 5 mes a mes
  $ch = $gr.ChartObjects().Add(20, 580, 910, 290).Chart
  $ch.ChartType = 65
  $filas = 59, 62, 65, 68, 71
  for ($k = 0; $k -lt 5; $k++) {
    $s = $ch.SeriesCollection().NewSeries()
    $s.Name = 'Año ' + ($k + 1)
    $s.XValues = $ven.Range('B58:M58')
    $s.Values = $ven.Range(('B' + $filas[$k] + ':M' + $filas[$k]))
    $s.Format.Line.ForeColor.RGB = $pal[$k]
    $s.Format.Line.Weight = 2.25
    $s.MarkerStyle = 8
    $s.MarkerSize = 6
  }
  Title $ch 'Comparación mensual de unidades: años 1 a 5'
  $ch.HasLegend = $true
  $ch.Legend.Position = -4107

  $excel.CalculateFullRebuild()

  # ===== Resultados para verificar lógica =====
  $pyg = Sheet $wb '11. Estado PyG'
  $inv41 = $inv.Range('E41').Value2
  Write-Output ("Inversión fija E41: " + [math]::Round($inv41))
  Write-Output ("Unidades año 1: " + $ven.Range('N12').Value2)
  Write-Output ("Ventas año 1-5: " + (($res.Range('B52:F52').Value2 | ForEach-Object { [math]::Round($_) }) -join ' | '))
  Write-Output ("Costos var 1-5: " + (($res.Range('B62:F62').Value2 | ForEach-Object { [math]::Round($_) }) -join ' | '))
  Write-Output ("Nómina año: " + [math]::Round($nom.Range('N10').Value2))
  foreach ($row in 4, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16) {
    $vals = @()
    foreach ($c in 'C','D','E','F','G') {
      $v = $pyg.Range("$c$row").Value2
      if ($v -is [double]) { $vals += [math]::Round($v) } else { $vals += [string]$v }
    }
    Write-Output ("PyG R$row " + $pyg.Range("A$row").Text + ": " + ($vals -join ' | '))
  }
  $k = 0
  foreach ($co in $gr.ChartObjects()) {
    $k++
    Write-Output ("Gráfico $k tipo=" + $co.Chart.ChartType + " título=" + $co.Chart.ChartTitle.Text + " serie=" + $co.Chart.SeriesCollection(1).Formula)
  }

  # errores en celdas de todas las hojas
  $errs = 0
  foreach ($ws in $wb.Worksheets) {
    try {
      $e = $ws.UsedRange.SpecialCells(-4123, 16)   # fórmulas con error
      $errs += $e.Count
      Write-Output ("ERRORES en " + $ws.Name + ": " + $e.Address($false, $false))
    } catch {}
  }
  Write-Output ("Total celdas con error: " + $errs)
  $di = Sheet $wb 'DI'
  Write-Output ("DI G76 formula: " + $di.Range('G76').Formula + " | F76=" + $di.Range('F76').Text + " | A76=" + $di.Range('A76').Text)
  $fc = Sheet $wb '10. Flujo*'
  foreach ($row in 1..40) {
    $a = $fc.Range("A$row").Text
    if ($a -match 'Saldo|Flujo|Total|Ingres|Egres') {
      Write-Output ("FC R$row " + $a + ": " + $fc.Range("C$row").Text + " | " + $fc.Range("D$row").Text + " | " + $fc.Range("G$row").Text)
    }
  }

  Write-Output ("Hojas: " + (($wb.Worksheets | ForEach-Object { $_.Name }) -join ' / '))
  try { $bal = Sheet $wb '1[3-9]*Balance*' } catch { $bal = $null }
  if ($bal) { for ($r = 1; $r -le 45; $r++) {
    $a = [string]$bal.Range("A$r").Text + ' ' + [string]$bal.Range("B$r").Text + ' ' + [string]$bal.Range("D$r").Text
    if ($a -match 'TOTAL|Total') {
      $vals = @()
      foreach ($c in 'B','C','D','E','F','G') { $t = [string]$bal.Range("$c$r").Text; if ($t.Trim()) { $vals += ($c + '=' + $t.Trim()) } }
      Write-Output ("BAL R$r " + ($vals -join ' | '))
    }
  } }

  $inv.Activate()
  if (Test-Path -LiteralPath $final) { Remove-Item -LiteralPath $final -Force }
  $wb.SaveAs($final, 52)
  $wb.Close($false)
  Write-Output "OK GUARDADO: $final"
}
finally {
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
  Remove-Item -LiteralPath $work -Force -ErrorAction SilentlyContinue
}
