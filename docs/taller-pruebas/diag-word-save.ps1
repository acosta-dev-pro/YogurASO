Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force
Add-Type -AssemblyName System.Drawing, System.Windows.Forms
$job = Start-Job -ScriptBlock {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $true
  $word.DisplayAlerts = 0
  $doc = $word.Documents.Open('C:\Users\acost\Downloads\EJEMPLO ACTA DE ENTREGA DE DESARROLLO DE SOFTWARE_V2.docx', $false, $true)
  $doc.SaveAs2("$env:TEMP\diag_acta.docx", 16)
  'guardado'
}
Start-Sleep 20
$b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
$bmp.Save("$env:TEMP\diag_word.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output ("estado job: " + $job.State)
Receive-Job $job
Get-Process WINWORD -ErrorAction SilentlyContinue | % { "Word ventana: " + $_.MainWindowTitle }
Stop-Job $job -ErrorAction SilentlyContinue
Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force
