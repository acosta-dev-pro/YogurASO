$ErrorActionPreference = 'Stop'
Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force

$DL        = 'C:\Users\acost\Downloads'
$EVID      = 'C:\Users\acost\Desktop\YOGURASO-WEB\docs\taller-pruebas\evidencias'
$SRC_ENT   = "$DL\EJEMPLO ACTA DE ENTREGA DE DESARROLLO DE SOFTWARE_V2.docx"
$SRC_CAP   = "$DL\EJEMPLO ACTA CAPACITACIONdocx.docx"
$OUT_ENT   = "$DL\Acta_Entrega_Software_YogurASO.docx"
$OUT_CAP   = "$DL\Acta_Capacitacion_YogurASO.docx"
$PDF_ENT   = "$DL\Acta_Entrega_Software_YogurASO.pdf"
$PDF_CAP   = "$DL\Acta_Capacitacion_YogurASO.pdf"

Add-Type -AssemblyName System.Drawing
$logo = "$EVID\logo_yoguraso_encabezado.png"
$img = [System.Drawing.Image]::FromFile((Join-Path $EVID 'logo_yoguraso.png'))
$bmp = New-Object System.Drawing.Bitmap 210, 245
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = 'HighQualityBicubic'
$g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, 210, 245), (New-Object System.Drawing.Rectangle 105, 58, 210, 245), 'Pixel')
$bmp.Save($logo, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()

$CROPS = 'C:\Users\acost\Desktop\YOGURASO-WEB\docs\taller-pruebas\_vba_tmp\actas'
New-Item -ItemType Directory -Force -Path $CROPS | Out-Null
function CropTop([string]$name, [int]$h) {
  $src = [System.Drawing.Image]::FromFile("$EVID\$name")
  $hh = [math]::Min($h, $src.Height)
  $b = New-Object System.Drawing.Bitmap $src.Width, $hh
  $gg = [System.Drawing.Graphics]::FromImage($b)
  $gg.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $src.Width, $hh), (New-Object System.Drawing.Rectangle 0, 0, $src.Width, $hh), 'Pixel')
  $dst = "$CROPS\$name"
  $b.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
  $gg.Dispose(); $b.Dispose(); $src.Dispose()
  return [string]$dst
}

$word = New-Object -ComObject Word.Application
$word.Visible = $true
$word.WindowState = 2
$word.DisplayAlerts = 0
trap {
  Write-Output ("ERROR: " + $_.Exception.Message + " (línea " + $_.InvocationInfo.ScriptLineNumber + ")")
  try { foreach ($d in @($word.Documents)) { $d.Close(0) } } catch {}
  try { $word.Quit(0) } catch {}
  exit 1
}
function Log([string]$m) { Write-Output ("[" + (Get-Date -Format 'HH:mm:ss') + "] " + $m) }

function Plain($rng, [double]$size = 0) {
  $rng.Font.Bold = 0; $rng.Font.Italic = 0; $rng.Font.Color = -16777216
  if ($size -gt 0) { $rng.Font.Size = $size }
}

# Reemplaza un texto guía "<...>" por el valor real (mismo formato de la plantilla, sin cursiva ni gris)
function Swap($doc, [string]$find, [string]$value, [double]$size = 0) {
  $rng = $doc.Content
  $f = $rng.Find
  $f.ClearFormatting(); $f.Text = $find; $f.MatchWildcards = $false; $f.MatchCase = $true; $f.Forward = $true; $f.Wrap = 0
  if (-not $f.Execute()) { throw "No encontré en la plantilla: $find" }
  $rng.Text = $value
  Plain $rng $size
  return $rng
}

function DropPara($doc, [string]$find) {
  $rng = $doc.Content
  $f = $rng.Find
  $f.ClearFormatting(); $f.Text = $find; $f.MatchWildcards = $false; $f.Wrap = 0
  if (-not $f.Execute()) { throw "No encontré en la plantilla: $find" }
  $p = $rng.Paragraphs.Item(1).Range
  try { $p.Delete() | Out-Null } catch { $rng.Text = '' }
}

function SetCell($cell, [string]$text, [double]$size, [bool]$firstBold = $false) {
  $cell.Range.Text = $text
  Plain $cell.Range $size
  if ($firstBold) { $cell.Range.Paragraphs.Item(1).Range.Font.Bold = 1 }
}

function AppendCell($doc, $cell, [string]$text, [double]$size = 0) {
  $end = $cell.Range.End - 1
  $r = $doc.Range($end, $end)
  $r.InsertAfter($text)
  Plain $r $size
}

function SetPara($doc, $para, [string]$text, [double]$size = 0, [int]$bold = 0) {
  $r = $doc.Range($para.Range.Start, $para.Range.End - 1)
  $r.Text = $text
  Plain $r $size
  $r.Font.Bold = $bold
  return $r
}

function PutLogo($doc) {
  foreach ($s in $doc.Sections) {
    foreach ($i in 1, 3) {
      $h = $s.Headers.Item($i)
      $r = $h.Range
      $f = $r.Find
      $f.ClearFormatting(); $f.Text = 'LOGO'; $f.MatchCase = $false; $f.MatchWholeWord = $true; $f.Wrap = 0
      if ($f.Execute()) {
        $r.Text = ''
        $pic = $doc.InlineShapes.AddPicture($logo, $false, $true, $r)
        $pic.LockAspectRatio = -1
        $pic.Height = 44
      }
    }
  }
}

# =====================================================================
# 1) ACTA DE ENTREGA DE DESARROLLO DE SOFTWARE
# =====================================================================
Log 'Word iniciado'
$doc = $word.Documents.Open($SRC_ENT, $false, $true)
Log 'Plantilla de entrega abierta'
$tb = $doc.Tables.Item(1)

Swap $doc '<Nombre de la dependencia que realiza la solicitud>' 'YogurASO – Gerencia comercial (emprendimiento de yogurt artesanal)' | Out-Null
Swap $doc '<Nombre del proyecto o Sistema de información al cual está asociado el requerimiento>' 'YogurASO – Tienda web de yogurt artesanal (catálogo, carrito y pedidos por WhatsApp)' | Out-Null
Swap $doc '<Seleccione el tipo de entrega según sea el caso>' '' | Out-Null

$c13 = $tb.Cell(1, 3).Range
$marks = @()
$r = $c13.Duplicate
$f = $r.Find; $f.ClearFormatting(); $f.Text = '__'; $f.Wrap = 0
while ($f.Execute() -and $r.End -le $c13.End) { $marks += $doc.Range($r.Start, $r.End); $r.Collapse(0) }
$marks[1].Text = 'X'
$marks[1].Font.Bold = 1

Swap $doc '<Nombre del módulo asociado al software o sistema de información>' 'Todos los módulos del MVP: autenticación, catálogo, carrito y pedidos, perfil, recuperación de contraseña y panel de administración' | Out-Null
Swap $doc '<Número de la versión del software>' '1.0.0 (MVP)' | Out-Null
Swap $doc '<Nombre del ingeniero desarrollador>' 'Juan Esteban Acosta – Desarrollador full stack' | Out-Null
Swap $doc '<dd/mm/aaaa>' '28/09/2026' | Out-Null
DropPara $doc '<Fecha en la cual la Oficina de Tecnología hace entrega del requerimiento>'
Swap $doc '<Nombre del servidor donde se encuentra instalada la aplicación>' 'Servidor de desarrollo local (Windows 11) con API Node.js/Express en el puerto 3000 y PostgreSQL en el puerto 5432; ambiente de pruebas en máquina virtual Ubuntu 22.04' | Out-Null
Swap $doc '<Url de la aplicación o si es Cliente/Servidor>' 'Aplicación web cliente/servidor por navegador. Tienda: http://127.0.0.1:5500/index.html – API: http://localhost:3000/api – Administración: /pages/admin.html' | Out-Null
Swap $doc '< Breve descripción del requerimiento>' 'Desarrollo e implementación de la tienda web de YogurASO para vender yogurt artesanal en línea: catálogo de productos con búsqueda, filtros y orden por precio; carrito de compras con envío del pedido por WhatsApp; registro e inicio de sesión con correo o Google; perfil de usuario con cambio y recuperación de contraseña por correo; y panel de administración para gestionar productos (con imagen y borrado lógico) y usuarios. Incluye API REST en Node.js/Express con JWT y base de datos PostgreSQL.' | Out-Null
DropPara $doc '<Breve descripción del entregable>'
DropPara $doc '<Notas especificas asociadas a cada entregable>'
DropPara $doc '<Nombres completos, cargo, dependencia y firma del jefe de área del solicitante del cambio, ajuste o creación del sistema de información>'
DropPara $doc '<Nombres completos , cargo, dependencia y firma de las personas asignadas para la ejecución del requerimiento>'

$entregables = @(
  @("1. Código fuente del frontend`rSitio web en HTML5, CSS3 y JavaScript: inicio, productos, carrito, login, registro, perfil, recuperar contraseña, privacidad, administración y página 404.",
    'Carpeta frontend/. La URL de la API, el número de WhatsApp y el ID de Google se configuran en frontend/js/config.js.'),
  @("2. Código fuente del backend (API REST)`rServidor Node.js + Express con rutas de autenticación (JWT y bcrypt), productos, usuarios, carga de imágenes (Multer) y envío de correos.",
    'Carpeta backend/. Se crea backend/.env a partir de .env.example. El archivo .env con claves reales no se incluye en la entrega por seguridad.'),
  @("3. Base de datos PostgreSQL`rScript database/schema.sql con tablas, datos iniciales y migraciones (Google, letreros y operaciones de lanzamiento).",
    'Ejecutar en PostgreSQL 14 o superior (puerto 5432). Cambiar la contraseña del administrador inicial antes de publicar.'),
  @("4. Manual técnico (GA10-220501097-AA10-EV01)`rInstalación, arquitectura, módulos, modelo de datos y solución de problemas.",
    'Dirigido al equipo técnico que instale o mantenga el sistema.'),
  @("5. Manual de usuario (GA10-220501097-AA11-EV01)`rGuía paso a paso para clientes y para el administrador de la tienda.",
    'Material de apoyo para la capacitación del personal de YogurASO.'),
  @("6. Plan y evidencias de pruebas`rCasos de prueba, pruebas automatizadas con Playwright (carpeta tests/) y capturas de pantalla.",
    'Pruebas del flujo de compra, login, registro, carrito, administración y página 404 aprobadas.'),
  @("7. Repositorio de código`rhttps://github.com/acosta-dev-pro/YogurASO (rama main).",
    'Contiene el historial de versiones. Las dependencias se instalan con npm install.')
)
$firstRow = 7
$rowsNeeded = $entregables.Count - 3
$tb.Cell(9, 1).Select()
$word.Selection.InsertRowsBelow($rowsNeeded)
for ($k = 0; $k -lt $entregables.Count; $k++) {
  $row = $firstRow + $k
  SetCell $tb.Cell($row, 1) $entregables[$k][0] 9 $true
  SetCell $tb.Cell($row, 2) $entregables[$k][1] 9
  $tb.Rows.Item($row).AllowBreakAcrossPages = 0
  foreach ($c in 1, 2) {
    $tb.Cell($row, $c).Range.ParagraphFormat.Alignment = 0
    $tb.Cell($row, $c).Range.ParagraphFormat.SpaceBefore = 2
    $tb.Cell($row, $c).Range.ParagraphFormat.SpaceAfter = 2
  }
}

$off = $rowsNeeded
$solic = @(
  @('Representante legal de YogurASO', 'Gerencia – YogurASO', 'Propietario(a) y gerente'),
  @('Administrador(a) de la tienda en línea', 'Área comercial – YogurASO', 'Responsable de ventas y catálogo'),
  @('Instructor(a) SENA', 'Programa ADSO – Ficha 3145644', 'Instructor evaluador del proyecto')
)
for ($k = 0; $k -lt 3; $k++) {
  for ($c = 0; $c -lt 3; $c++) { SetCell $tb.Cell(12 + $off + $k, $c + 1) $solic[$k][$c] 9 }
}
$oti = @('Juan Esteban Acosta', 'Equipo de desarrollo YogurASO (OTI)', 'Desarrollador full stack y líder del proyecto')
for ($c = 0; $c -lt 3; $c++) { SetCell $tb.Cell(17 + $off, $c + 1) $oti[$c] 9 }
$tb.Cell(19 + $off, 1).Select(); $word.Selection.Rows.Delete()
$tb.Cell(18 + $off, 1).Select(); $word.Selection.Rows.Delete()
foreach ($row in @(12 + $off), @(13 + $off), @(14 + $off), @(17 + $off)) {
  $tb.Rows.Item([int]$row[0]).HeightRule = 1
  $tb.Rows.Item([int]$row[0]).Height = 34
  for ($c = 1; $c -le 4; $c++) {
    $tb.Cell([int]$row[0], $c).VerticalAlignment = 1
    $tb.Cell([int]$row[0], $c).Range.ParagraphFormat.Alignment = 1
  }
}

Log 'Entrega llena'
PutLogo $doc
Log 'Logo puesto, guardando'
$doc.SaveAs2($OUT_ENT, 16)
Log 'docx guardado'
$doc.ExportAsFixedFormat($PDF_ENT, 17)
Log 'pdf guardado'
Write-Output ("ENTREGA páginas=" + $doc.ComputeStatistics(2) + " filas=" + $tb.Rows.Count)
$doc.Close($false)

# =====================================================================
# 2) ACTA DE CAPACITACIÓN
# =====================================================================
$doc = $word.Documents.Open($SRC_CAP, $false, $true)
Log 'Plantilla de capacitación abierta'
$t1 = $doc.Tables.Item(1); $t2 = $doc.Tables.Item(2); $t3 = $doc.Tables.Item(3)

AppendCell $doc $t1.Cell(1, 1) '001-2026'
AppendCell $doc $t1.Cell(2, 1) 'Uso y administración de la tienda web YogurASO – versión 1.0.0 (MVP)'
SetCell $t1.Cell(3, 2) 'Bogotá D.C., 30/09/2026' 11
AppendCell $doc $t1.Cell(3, 3) '2:00 p. m.' 11
AppendCell $doc $t1.Cell(3, 4) '4:00 p. m.' 11
SetCell $t1.Cell(4, 2) 'Virtual – Google Meet' 11
SetCell $t1.Cell(4, 4) 'Juan Esteban Acosta – Desarrollador del sistema' 11

$agenda = @(
  '1. Presentación de YogurASO y acceso: URL, registro, inicio de sesión (correo o Google) y perfil.',
  '2. Uso de la tienda: catálogo, búsqueda y filtros, carrito y envío del pedido por WhatsApp.',
  '3. Panel de administración: crear, editar y desactivar productos, cargar imágenes y gestionar usuarios.',
  '4. Seguridad y soporte: cambio y recuperación de contraseña, buenas prácticas y solución de problemas.'
)
$ps = $t2.Cell(1, 1).Range.Paragraphs
for ($k = 0; $k -lt 4; $k++) { SetPara $doc $ps.Item($k + 2) $agenda[$k] 11 | Out-Null }

SetPara $doc $t2.Cell(2, 1).Range.Paragraphs.Item(2) 'Capacitar al personal de YogurASO en el uso de la tienda web y de su panel de administración, para que publique y actualice productos, atienda los pedidos que llegan por WhatsApp y gestione las cuentas de usuario de forma autónoma y segura a partir de la entrega de la versión 1.0.0.' 11 | Out-Null

$desarrollo = @(
  'a) Acceso al sistema: se mostró cómo entrar a la tienda desde el navegador, crear una cuenta, iniciar sesión con correo o con Google y actualizar los datos del perfil.',
  'b) Experiencia del cliente: se recorrió el catálogo, el buscador, los filtros por categoría y el orden por precio; se agregaron productos al carrito, se ajustaron cantidades y se envió un pedido de prueba por WhatsApp.',
  'c) Panel de administración: cada participante creó un producto con nombre, precio, categoría e imagen, lo editó y luego lo desactivó sin borrarlo de la base de datos (borrado lógico). También se revisó la lista de usuarios y cómo activar o desactivar una cuenta.',
  'd) Seguridad: cambio de contraseña desde el perfil, recuperación por correo con enlace temporal, cierre de sesión y recomendaciones para crear contraseñas seguras.',
  '2. Práctica guiada.',
  'Los participantes repitieron el flujo completo en su propio equipo: publicar un producto nuevo, verlo en el catálogo como cliente, pedirlo por WhatsApp y retirarlo del catálogo desde el panel.',
  '3. Preguntas y respuestas.',
  'Se resolvieron dudas sobre el tamaño recomendado de las imágenes, qué hacer si el catálogo aparece vacío (verificar que el servidor esté encendido) y cómo cambiar el número de WhatsApp que recibe los pedidos.',
  '4. Material entregado.',
  'Se compartieron el Manual de usuario (AA11) y el Manual técnico (AA10) de YogurASO como material de consulta.'
)
$cd = $t2.Cell(4, 1).Range
$start = $cd.Paragraphs.Item(2).Range.Start
$body = $doc.Range($start, $cd.End - 1)
$body.Text = ($desarrollo -join "`r")
Plain $body 11
foreach ($p in $t2.Cell(4, 1).Range.Paragraphs) {
  if ($p.Range.Text -match '^\d\. ') { $p.Range.Font.Bold = 1 }
}

$conclusiones = @(
  '• El personal de YogurASO quedó en capacidad de administrar el catálogo y atender los pedidos que llegan por WhatsApp sin depender del desarrollador.',
  '• Todos los participantes completaron la práctica guiada; el flujo de compra y el panel de administración funcionaron correctamente durante la sesión.',
  '• Antes de publicar la tienda en internet se debe cambiar la contraseña del administrador inicial y configurar el dominio y el número de WhatsApp definitivos.',
  '• Se acordó un acompañamiento de 30 días para resolver dudas durante el inicio de la operación.'
)
SetCell $t2.Cell(6, 1) ($conclusiones -join "`r") 11

$compromisos = @(
  @('Cambiar la contraseña del administrador inicial y crear las cuentas del personal', '02/10/2026', 'Administrador(a) de la tienda – YogurASO', 'Participó por Google Meet'),
  @('Cargar el catálogo completo con fotos y precios actualizados', '09/10/2026', 'Área comercial – YogurASO', 'Participó por Google Meet'),
  @('Configurar dominio, HTTPS y WhatsApp definitivo; acompañamiento de 30 días', '16/10/2026', 'Juan Esteban Acosta – Desarrollador', 'Participó por Google Meet')
)
for ($k = 0; $k -lt 3; $k++) {
  for ($c = 0; $c -lt 4; $c++) { SetCell $t3.Cell(3 + $k, $c + 1) $compromisos[$k][$c] 10 }
}

$an = $t3.Cell(7, 1).Range.Paragraphs
foreach ($p in $an) {
  $txt = $p.Range.Text.Trim()
  if ($txt -eq 'Planilla de asistencia') {
    $r = $doc.Range($p.Range.Start, $p.Range.End - 1); $r.InsertAfter(' (participantes de la sesión virtual)'); $r.Font.Bold = 0
  } elseif ($txt -eq 'Registro fotográfico') {
    $r = $doc.Range($p.Range.Start, $p.Range.End - 1); $r.InsertAfter(' (capturas de la sesión, ver página siguiente)')
    $r.Font.Bold = 0
    $r2 = $doc.Range($r.End, $r.End); $r2.InsertAfter("`rManual de usuario YogurASO – GA10-220501097-AA11-EV01")
    break
  }
}

$leg = $doc.Content
$f = $leg.Find; $f.ClearFormatting(); $f.Text = 'Sistema de Notas'; $f.MatchCase = $true; $f.Wrap = 0
if ($f.Execute()) { $leg.Text = 'YogurASO'; $leg.HighlightColorIndex = 0 }

# Anexo: registro fotográfico con las pantallas mostradas en la capacitación
$last = $doc.Paragraphs.Last
$endR = $doc.Range($last.Range.Start, $last.Range.End - 1)
$endR.Text = 'ANEXO – REGISTRO FOTOGRÁFICO'
$endR.ParagraphFormat.PageBreakBefore = -1
$endR.Font.Name = 'Calibri'; $endR.Font.Size = 12; $endR.Font.Bold = 1
$endR.ParagraphFormat.Alignment = 1
$endR.InsertParagraphAfter()
$endR = $doc.Content; $endR.Collapse(0)
$endR.InsertAfter('Pantallas de YogurASO presentadas y practicadas durante la capacitación del 30/09/2026.')
$endR.Font.Bold = 0; $endR.Font.Size = 10; $endR.ParagraphFormat.Alignment = 1
$endR.ParagraphFormat.PageBreakBefore = 0
$endR.InsertParagraphAfter()
$endR = $doc.Content; $endR.Collapse(0)
$fotos = @(
  @((CropTop '01_inicio_home.png' 768), 'Portada de la tienda YogurASO'),
  @((CropTop '09_catalogo_con_productos.png' 768), 'Catálogo con búsqueda, filtros y precios'),
  @((CropTop '10_carrito_con_productos.png' 768), 'Carrito con pedido de prueba por WhatsApp'),
  @((CropTop '03_login.png' 768), 'Inicio de sesión de clientes y administrador')
)
$tf = $doc.Tables.Add($endR, 4, 2)
$tf.Borders.Enable = 1
$tf.PreferredWidthType = 2; $tf.PreferredWidth = 100
for ($k = 0; $k -lt 4; $k++) {
  $row = [math]::Floor($k / 2) * 2 + 1; $col = ($k % 2) + 1
  $cellImg = $tf.Cell($row, $col)
  $cellImg.Range.ParagraphFormat.Alignment = 1
  $pic = $doc.InlineShapes.AddPicture([string]$fotos[$k][0], $false, $true, $cellImg.Range)
  $pic.LockAspectRatio = -1
  $pic.Width = 215
  $cap = $tf.Cell($row + 1, $col)
  $cap.Range.Text = ('Figura ' + ($k + 1) + '. ' + $fotos[$k][1])
  $cap.Range.Font.Name = 'Calibri'; $cap.Range.Font.Size = 9; $cap.Range.Font.Bold = 0; $cap.Range.Font.Italic = 1
  $cap.Range.ParagraphFormat.Alignment = 1
}

Log 'Capacitación llena'
PutLogo $doc
$doc.SaveAs2($OUT_CAP, 16)
$doc.ExportAsFixedFormat($PDF_CAP, 17)
Log 'Capacitación guardada'
Write-Output ("CAPACITACION páginas=" + $doc.ComputeStatistics(2))
$doc.Close($false)
$word.Quit()
Write-Output 'OK'
