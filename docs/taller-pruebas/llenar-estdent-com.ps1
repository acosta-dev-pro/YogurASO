# Llena Plan de Negocio EstDent con Excel COM (conserva gráficos y fórmulas).
# Luego quita sheetProtection del XML para que las fórmulas se vean en la barra fx.
$ErrorActionPreference = 'Continue'

$src = 'C:\Users\acost\Downloads\Plan de Negocio 3145644 -ANALISIS Y DESARROLLO DE SOFTWARE.xlsm'
$out = 'C:\Users\acost\Downloads\Plan_Negocio_EstDent_FINAL.xlsm'
$tmpZipDir = 'C:\Users\acost\Desktop\YOGURASO-WEB\docs\taller-pruebas\_estdent_fix_tmp'

if (-not (Test-Path $src)) { throw "No existe plantilla: $src" }

Copy-Item -LiteralPath $src -Destination $out -Force

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AskToUpdateLinks = $false
$excel.ScreenUpdating = $false

function Get-Sheet($wb, $name) {
  foreach ($ws in $wb.Worksheets) {
    if ($ws.Name -eq $name) { return $ws }
  }
  # fallback partial
  foreach ($ws in $wb.Worksheets) {
    if ($ws.Name -like ("*" + $name + "*")) { return $ws }
  }
  return $null
}

function Set-Cell($ws, $addr, $value) {
  if ($null -eq $ws) {
    Write-Output ("WARN sheet null para " + $addr)
    return $false
  }
  $r = $ws.Range($addr)
  if ($r.Locked) {
    Write-Output ("SKIP locked " + $ws.Name + "!" + $addr)
    return $false
  }
  try {
    if ($value -is [string]) {
      $r.Value2 = [string]$value
    }
    else {
      $r.Value2 = [double]$value
    }
    return $true
  }
  catch {
    Write-Output ("FAIL " + $ws.Name + "!" + $addr + " :: " + $_.Exception.Message)
    return $false
  }
}

try {
  $wb = $excel.Workbooks.Open($out)

  # ── Datos Aprendiz ──
  $da = Get-Sheet $wb 'Datos Aprendiz'
  Set-Cell $da 'B6' 'EstDent System' | Out-Null
  # Fecha como texto para evitar conflictos de tipo en celda protegida/formatada
  Set-Cell $da 'B8' '25/09/2026' | Out-Null
  Set-Cell $da 'A12' 'Juan Esteban Acosta' | Out-Null
  Set-Cell $da 'B12' 'CC' | Out-Null

  # ── 1. Inversiones ──
  $inv = Get-Sheet $wb '1. Inversiones'
  Set-Cell $inv 'E3' 2 | Out-Null

  Set-Cell $inv 'A10' 'Portátil desarrollo EstDent' | Out-Null
  Set-Cell $inv 'B10' 'Equipo' | Out-Null
  Set-Cell $inv 'C10' 1 | Out-Null
  Set-Cell $inv 'D10' 3500000 | Out-Null

  Set-Cell $inv 'A11' 'Portátil apoyo técnico' | Out-Null
  Set-Cell $inv 'B11' 'Equipo' | Out-Null
  Set-Cell $inv 'C11' 1 | Out-Null
  Set-Cell $inv 'D11' 2500000 | Out-Null

  Set-Cell $inv 'A12' 'Monitor adicional 27"' | Out-Null
  Set-Cell $inv 'B12' 'Equipo' | Out-Null
  Set-Cell $inv 'C12' 1 | Out-Null
  Set-Cell $inv 'D12' 700000 | Out-Null

  Set-Cell $inv 'A13' 'UPS / regulador de voltaje' | Out-Null
  Set-Cell $inv 'B13' 'Equipo' | Out-Null
  Set-Cell $inv 'C13' 1 | Out-Null
  Set-Cell $inv 'D13' 350000 | Out-Null

  Set-Cell $inv 'A14' 'Kit periféricos (teclado, mouse, cámara, audífonos)' | Out-Null
  Set-Cell $inv 'B14' 'Equipo' | Out-Null
  Set-Cell $inv 'C14' 1 | Out-Null
  Set-Cell $inv 'D14' 480000 | Out-Null

  Set-Cell $inv 'A15' 'Disco externo / backup local' | Out-Null
  Set-Cell $inv 'B15' 'Equipo' | Out-Null
  Set-Cell $inv 'C15' 1 | Out-Null
  Set-Cell $inv 'D15' 320000 | Out-Null

  Set-Cell $inv 'C20' 1 | Out-Null
  Set-Cell $inv 'D20' 900000 | Out-Null

  Set-Cell $inv 'C23' 2 | Out-Null
  Set-Cell $inv 'D23' 420000 | Out-Null
  Set-Cell $inv 'C24' 2 | Out-Null
  Set-Cell $inv 'D24' 380000 | Out-Null
  Set-Cell $inv 'C25' 1 | Out-Null
  Set-Cell $inv 'D25' 280000 | Out-Null
  Set-Cell $inv 'C26' 1 | Out-Null
  Set-Cell $inv 'D26' 450000 | Out-Null
  Set-Cell $inv 'C31' 1 | Out-Null
  Set-Cell $inv 'D31' 350000 | Out-Null

  Set-Cell $inv 'C35' 1 | Out-Null
  Set-Cell $inv 'D35' 520000 | Out-Null
  Set-Cell $inv 'C39' 1 | Out-Null
  Set-Cell $inv 'D39' 380000 | Out-Null

  Write-Output ("CHECK inv C10=" + $inv.Range('C10').Value2 + " D10=" + $inv.Range('D10').Value2 + " C20=" + $inv.Range('C20').Value2)

  # ── 2. Mercado ──
  $merc = Get-Sheet $wb '2. Mercado'
  Set-Cell $merc 'A5' 'EstDent Básico' | Out-Null
  Set-Cell $merc 'B5' 79000 | Out-Null
  Set-Cell $merc 'A6' 'EstDent Profesional' | Out-Null
  Set-Cell $merc 'B6' 129000 | Out-Null
  Set-Cell $merc 'A7' 'EstDent Clínica' | Out-Null
  Set-Cell $merc 'B7' 199000 | Out-Null
  Set-Cell $merc 'A8' 'Configuración inicial EstDent' | Out-Null
  Set-Cell $merc 'B8' 250000 | Out-Null
  Set-Cell $merc 'A9' 'Automatización personalizada' | Out-Null
  Set-Cell $merc 'B9' 350000 | Out-Null

  Set-Cell $merc 'A12' 'NovusOral' | Out-Null
  Set-Cell $merc 'B12' 'Colombia / online' | Out-Null
  Set-Cell $merc 'C12' 'Software odontológico por suscripción; referencia pública cercana a $50.000/mes por profesional.' | Out-Null
  Set-Cell $merc 'A13' 'DentaraOS' | Out-Null
  Set-Cell $merc 'B13' 'Colombia / online' | Out-Null
  Set-Cell $merc 'C13' 'Gestión odontológica en la nube; planes publicados desde aproximadamente $129.000/mes.' | Out-Null
  Set-Cell $merc 'A14' 'NacarOS' | Out-Null
  Set-Cell $merc 'B14' 'Colombia / online' | Out-Null
  Set-Cell $merc 'C14' 'Software odontológico en la nube; plan Pro cercano a $46.400/mes según información pública.' | Out-Null

  Set-Cell $merc 'C18' 50000 | Out-Null
  Set-Cell $merc 'D18' 70000 | Out-Null
  Set-Cell $merc 'E18' 46400 | Out-Null
  Set-Cell $merc 'C19' 129000 | Out-Null
  Set-Cell $merc 'D19' 99900 | Out-Null
  Set-Cell $merc 'E19' 85000 | Out-Null
  Set-Cell $merc 'C20' 189000 | Out-Null
  Set-Cell $merc 'D20' 165000 | Out-Null
  Set-Cell $merc 'E20' 150000 | Out-Null
  Set-Cell $merc 'C21' 200000 | Out-Null
  Set-Cell $merc 'D21' 280000 | Out-Null
  Set-Cell $merc 'E21' 300000 | Out-Null
  Set-Cell $merc 'C22' 300000 | Out-Null
  Set-Cell $merc 'D22' 400000 | Out-Null
  Set-Cell $merc 'E22' 450000 | Out-Null

  # ── 3. Proyección Ventas (año 1) ──
  $ventName = $null
  foreach ($ws in $wb.Worksheets) {
    if ($ws.Name -like '3. Proyec*') { $ventName = $ws.Name; break }
  }
  $vent = $wb.Worksheets.Item($ventName)

  $m7  = @(2,3,3,4,4,4,4,5,5,5,5,6)
  $m8  = @(5,6,7,8,8,9,9,10,10,11,11,11)
  $m9  = @(1,1,1,2,2,2,2,3,3,3,4,4)
  $m10 = @(1,1,2,2,2,2,2,2,2,3,3,3)
  $m11 = @(0,1,1,1,1,1,2,2,2,2,2,2)
  $cols = @('B','C','D','E','F','G','H','I','J','K','L','M')

  for ($i=0; $i -lt 12; $i++) {
    Set-Cell $vent ($cols[$i] + '7')  $m7[$i]  | Out-Null
    Set-Cell $vent ($cols[$i] + '8')  $m8[$i]  | Out-Null
    Set-Cell $vent ($cols[$i] + '9')  $m9[$i]  | Out-Null
    Set-Cell $vent ($cols[$i] + '10') $m10[$i] | Out-Null
    Set-Cell $vent ($cols[$i] + '11') $m11[$i] | Out-Null
  }

  # ── 4. Costos Variables ──
  $cv = Get-Sheet $wb '4. Costos Variables'

  Set-Cell $cv 'A9'  'Infraestructura nube (hosting / BD)' | Out-Null
  Set-Cell $cv 'B9'  1 | Out-Null
  Set-Cell $cv 'C9'  8000 | Out-Null
  Set-Cell $cv 'A10' 'Almacenamiento y backups' | Out-Null
  Set-Cell $cv 'B10' 1 | Out-Null
  Set-Cell $cv 'C10' 2500 | Out-Null
  Set-Cell $cv 'A11' 'Correo / notificaciones' | Out-Null
  Set-Cell $cv 'B11' 1 | Out-Null
  Set-Cell $cv 'C11' 2000 | Out-Null
  Set-Cell $cv 'C12' 3000 | Out-Null

  Set-Cell $cv 'A26' 'Infraestructura nube (hosting / BD)' | Out-Null
  Set-Cell $cv 'B26' 1 | Out-Null
  Set-Cell $cv 'C26' 10000 | Out-Null
  Set-Cell $cv 'A27' 'Almacenamiento y backups' | Out-Null
  Set-Cell $cv 'B27' 1 | Out-Null
  Set-Cell $cv 'C27' 3500 | Out-Null
  Set-Cell $cv 'A28' 'APIs / mensajería' | Out-Null
  Set-Cell $cv 'B28' 1 | Out-Null
  Set-Cell $cv 'C28' 3000 | Out-Null
  Set-Cell $cv 'C29' 4500 | Out-Null

  Set-Cell $cv 'A44' 'Infraestructura nube (mayor capacidad)' | Out-Null
  Set-Cell $cv 'B44' 1 | Out-Null
  Set-Cell $cv 'C44' 12000 | Out-Null
  Set-Cell $cv 'A45' 'Almacenamiento y backups' | Out-Null
  Set-Cell $cv 'B45' 1 | Out-Null
  Set-Cell $cv 'C45' 5000 | Out-Null
  Set-Cell $cv 'A46' 'APIs / mensajería / reportes' | Out-Null
  Set-Cell $cv 'B46' 1 | Out-Null
  Set-Cell $cv 'C46' 5000 | Out-Null
  Set-Cell $cv 'C47' 7000 | Out-Null

  Set-Cell $cv 'A62' 'Horas configuración / puesta en marcha' | Out-Null
  Set-Cell $cv 'B62' 1 | Out-Null
  Set-Cell $cv 'C62' 28000 | Out-Null
  Set-Cell $cv 'A63' 'Capacitación inicial al consultorio' | Out-Null
  Set-Cell $cv 'B63' 1 | Out-Null
  Set-Cell $cv 'C63' 12000 | Out-Null
  Set-Cell $cv 'A64' 'Plantillas y carga de datos inicial' | Out-Null
  Set-Cell $cv 'B64' 1 | Out-Null
  Set-Cell $cv 'C64' 5000 | Out-Null
  Set-Cell $cv 'C65' 4000 | Out-Null

  Set-Cell $cv 'A80' 'Desarrollo de automatización a medida' | Out-Null
  Set-Cell $cv 'B80' 1 | Out-Null
  Set-Cell $cv 'C80' 50000 | Out-Null
  Set-Cell $cv 'A81' 'Integraciones API' | Out-Null
  Set-Cell $cv 'B81' 1 | Out-Null
  Set-Cell $cv 'C81' 20000 | Out-Null
  Set-Cell $cv 'A82' 'Pruebas y despliegue' | Out-Null
  Set-Cell $cv 'B82' 1 | Out-Null
  Set-Cell $cv 'C82' 10000 | Out-Null
  Set-Cell $cv 'C83' 8000 | Out-Null

  # ── 6. Nómina ──
  $nom = Get-Sheet $wb '6. Nomina'
  Set-Cell $nom 'C6' 1750905 | Out-Null
  Set-Cell $nom 'A17' 'Desarrollo y mantenimiento de software EstDent' | Out-Null
  Set-Cell $nom 'B17' 1500000 | Out-Null
  Set-Cell $nom 'A29' 'Asesoría comercial y captación de consultorios' | Out-Null
  Set-Cell $nom 'B29' 800000 | Out-Null

  # ── 7. Costos Fijos (Cursor AI 70k) ──
  $cf = Get-Sheet $wb '7. Costos Fijos'
  # Sin arriendo de local (emprendimiento software desde casa/coworking bajo demanda)
  Set-Cell $cf 'B4' 0 | Out-Null
  Set-Cell $cf 'A26' 'Suscripción Cursor AI (herramienta de desarrollo)' | Out-Null
  Set-Cell $cf 'B26' 70000 | Out-Null

  # ── 8. Gastos (celdas amarillas) ──
  $gast = Get-Sheet $wb '8. Gastos'
  Set-Cell $gast 'B40' 90000 | Out-Null   # Internet + datos
  Set-Cell $gast 'B41' 45000 | Out-Null   # Suministros
  Set-Cell $gast 'B42' 60000 | Out-Null   # Otros admin
  Set-Cell $gast 'B49' 250000 | Out-Null  # Facebook ads
  Set-Cell $gast 'B50' 180000 | Out-Null  # Posicionamiento web
  Set-Cell $gast 'B51' 80000 | Out-Null   # Publicidad impresa
  Set-Cell $gast 'B52' 0 | Out-Null       # Empaque N/A software
  Set-Cell $gast 'B53' 120000 | Out-Null  # Otros gastos ventas

  # Recalcular todo
  $excel.CalculateFullRebuild()

  # Verificar gráficos siguen ahí
  $graf = $null
  foreach ($ws in $wb.Worksheets) {
    if ($ws.Name -like '*Gr*fico*') { $graf = $ws; break }
  }
  $nCharts = 0
  if ($graf -ne $null) { $nCharts = $graf.ChartObjects().Count }

  # Totales clave
  $e41 = $inv.Range('E41').Value2
  $n7 = $vent.Range('N7').Value2
  $nTot = $vent.Range('N12').Value2
  Write-Output ("Charts en Graficos Ventas: " + $nCharts)
  Write-Output ("Inversion E41: " + $e41)
  Write-Output ("Unidades producto1 N7: " + $n7)
  Write-Output ("Unidades total N12: " + $nTot)
  Write-Output ("Cursor B26: " + $cf.Range('B26').Value2)
  Write-Output ("E10 HasFormula: " + $inv.Range('E10').HasFormula)

  $wb.Save()
  $wb.Close($true)
}
finally {
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

Write-Output ("OK LLENADO EXCEL (sin reempaquetar): " + $out)
return

# ── Quitar protección de hojas (XML) para que se vean las fórmulas ──
Write-Output 'Quitando proteccion de hojas (XML)...'
if (Test-Path $tmpZipDir) { Remove-Item -LiteralPath $tmpZipDir -Recurse -Force }
New-Item -ItemType Directory -Path $tmpZipDir | Out-Null

$zipCopy = Join-Path $tmpZipDir 'book.zip'
Copy-Item -LiteralPath $out -Destination $zipCopy -Force
Expand-Archive -LiteralPath $zipCopy -DestinationPath (Join-Path $tmpZipDir 'unz') -Force

$wsDir = Join-Path $tmpZipDir 'unz\xl\worksheets'
$removed = 0
Get-ChildItem -LiteralPath $wsDir -Filter '*.xml' | ForEach-Object {
  $content = [System.IO.File]::ReadAllText($_.FullName)
  $new = [regex]::Replace($content, '<sheetProtection[^>]*/>', '')
  $new = [regex]::Replace($new, '<sheetProtection[^>]*>.*?</sheetProtection>', '', 'Singleline')
  if ($new -ne $content) {
    [System.IO.File]::WriteAllText($_.FullName, $new)
    $removed++
  }
}
Write-Output ("Hojas desprotegidas en XML: " + $removed)

# Reempaquetar como xlsm (zip)
$outFinal = 'C:\Users\acost\Downloads\Plan_Negocio_EstDent_COMPLETO.xlsm'
$repack = Join-Path $tmpZipDir 'repack.zip'
if (Test-Path $repack) { Remove-Item $repack -Force }
if (Test-Path $outFinal) { Remove-Item -LiteralPath $outFinal -Force }

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $tmpZipDir 'unz'), $repack, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Copy-Item -LiteralPath $repack -Destination $outFinal -Force

# Verificar apertura + gráficos + fórmulas visibles
$excel2 = New-Object -ComObject Excel.Application
$excel2.Visible = $false
$excel2.DisplayAlerts = $false
try {
  $wb2 = $excel2.Workbooks.Open($outFinal)
  $inv2 = $wb2.Worksheets.Item('1. Inversiones')
  Write-Output ('Protect after: ' + $inv2.ProtectContents)
  Write-Output ('E10 Formula: [' + $inv2.Range('E10').Formula + ']')
  Write-Output ('E21 Formula: [' + $inv2.Range('E21').Formula + ']')
  Write-Output ('E41 Formula: [' + $inv2.Range('E41').Formula + ']')
  Write-Output ('E41 Value: ' + $inv2.Range('E41').Value2)

  $graf2 = $null
  foreach ($ws in $wb2.Worksheets) {
    if ($ws.Name -like '*Gr*fico*') { $graf2 = $ws; break }
  }
  if ($graf2) { Write-Output ('Charts final: ' + $graf2.ChartObjects().Count) }

  $wb2.Close($false)
}
finally {
  $excel2.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel2) | Out-Null
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

Write-Output ("OK LISTO: " + $outFinal)
