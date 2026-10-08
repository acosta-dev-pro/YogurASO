$ErrorActionPreference = 'Stop'
Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force
$word = New-Object -ComObject Word.Application
$word.Visible = $false; $word.DisplayAlerts = 0
$out = New-Object System.Collections.Generic.List[string]
foreach ($f in 'C:\Users\acost\Downloads\EJEMPLO ACTA DE ENTREGA DE DESARROLLO DE SOFTWARE_V2.docx','C:\Users\acost\Downloads\EJEMPLO ACTA CAPACITACIONdocx.docx') {
  $doc = $word.Documents.Open($f, $false, $true)
  $out.Add("##### " + (Split-Path $f -Leaf) + " pages=" + $doc.ComputeStatistics(2) + " tables=" + $doc.Tables.Count + " paragraphs=" + $doc.Paragraphs.Count)
  $ps = $doc.PageSetup
  $out.Add("page w=" + $ps.PageWidth + " h=" + $ps.PageHeight + " margins L=" + $ps.LeftMargin + " R=" + $ps.RightMargin)
  foreach ($s in $doc.Sections) { foreach ($i in 1..3) {
    $t = $s.Headers.Item($i).Range.Text.Trim(); if ($t) { $out.Add("HEADER$i " + $t.Replace("`r",' | ').Replace([string][char]7,' ')) }
    $t = $s.Footers.Item($i).Range.Text.Trim(); if ($t) { $out.Add("FOOTER$i " + $t.Replace("`r",' | ').Replace([string][char]7,' ')) }
  } }
  $ti = 0
  foreach ($tb in $doc.Tables) {
    $ti++
    $out.Add("== TABLA $ti rows=" + $tb.Rows.Count + " cols=" + $tb.Columns.Count + " uniform=" + $tb.Uniform + " nested=" + $tb.Tables.Count)
    foreach ($c in $tb.Range.Cells) {
      $txt = $c.Range.Text
      $txt = $txt.Substring(0, [math]::Max(0, $txt.Length - 2)).Replace("`r", ' / ')
      $out.Add(("  [{0},{1}] w={2:N0} font={3} {4} b={5}: {6}" -f $c.RowIndex, $c.ColumnIndex, $c.Width, $c.Range.Font.Name, $c.Range.Font.Size, $c.Range.Font.Bold, $txt))
    }
  }
  $pi = 0
  foreach ($p in $doc.Paragraphs) {
    $pi++
    if (-not $p.Range.Information(12)) {
      $t = $p.Range.Text.Trim()
      $out.Add(("  P{0} (fuera tabla) style={1} font={2} {3}: {4}" -f $pi, $p.Style.NameLocal, $p.Range.Font.Name, $p.Range.Font.Size, $t))
    }
  }
  $doc.Close($false)
}
$word.Quit()
[IO.File]::WriteAllLines('C:\Users\acost\Desktop\YOGURASO-WEB\docs\taller-pruebas\inspect-actas.txt', $out, (New-Object Text.UTF8Encoding $true))
"ok " + $out.Count
