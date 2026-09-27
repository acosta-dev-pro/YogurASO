# Repara textos UTF-8 leidos como Latin-1 (perifÃ©ricos -> periféricos)
$ErrorActionPreference = 'Stop'
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$path = 'C:\Users\acost\Downloads\Plan_Negocio_EstDent_FINAL.xlsm'
$enc = New-Object System.Text.UTF8Encoding $false, $true

function Repair-Text([string]$s) {
  if ([string]::IsNullOrEmpty($s)) { return $null }
  $has = $false
  foreach ($ch in $s.ToCharArray()) {
    $c = [int]$ch
    if ($c -eq 0x00C3 -or $c -eq 0x00C2) { $has = $true; break }
  }
  if (-not $has) { return $null }
  $raw = New-Object byte[] $s.Length
  for ($i = 0; $i -lt $s.Length; $i++) {
    $c = [int]$s[$i]
    if ($c -gt 255) { return $null }
    $raw[$i] = [byte]$c
  }
  try { $fixed = $enc.GetString($raw) } catch { return $null }
  if ($fixed -eq $s) { return $null }
  return $fixed
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AskToUpdateLinks = $false
$n = 0
$samples = @()

try {
  $wb = $excel.Workbooks.Open($path)
  foreach ($ws in $wb.Worksheets) {
    $used = $ws.UsedRange
    if ($null -eq $used) { continue }
    foreach ($cell in $used.Cells) {
      if ($cell.HasFormula) { continue }
      $v = $cell.Value2
      if ($v -isnot [string]) { continue }
      $fixed = Repair-Text ([string]$v)
      if ($null -ne $fixed) {
        $cell.Value2 = $fixed
        $n++
        if ($samples.Count -lt 12) {
          $samples += ($ws.Name + '!' + $cell.Address($false,$false) + ' => ' + $fixed)
        }
      }
    }
    foreach ($co in @($ws.ChartObjects())) {
      $ch = $co.Chart
      if ($ch.HasTitle) {
        $t = [string]$ch.ChartTitle.Text
        $fixed = Repair-Text $t
        if ($null -ne $fixed) {
          $ch.ChartTitle.Text = $fixed
          $n++
          $samples += ('CHART ' + $ws.Name + ' => ' + $fixed)
        }
      }
      try {
        $sc = $ch.SeriesCollection()
        for ($i = 1; $i -le $sc.Count; $i++) {
          $name = [string]$sc.Item($i).Name
          $fixed = Repair-Text $name
          if ($null -ne $fixed) {
            $sc.Item($i).Name = $fixed
            $n++
          }
        }
      } catch {}
    }
  }
  $wb.Save()
  $wb.Close($true)
  Write-Output ("Celdas corregidas: " + $n)
  $samples | ForEach-Object { Write-Output $_ }
}
finally {
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}
