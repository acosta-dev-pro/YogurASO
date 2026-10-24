$docxPath = "C:\Users\acost\Desktop\GA11-220501098-AA3-EV01_Ajustes_Procesos_Desarrollo_YogurASO.docx"
$pdfDesktop = "C:\Users\acost\Desktop\GA11-220501098-AA3-EV01_Ajustes_Procesos_Desarrollo_YogurASO.pdf"
$pdfDownloads = "C:\Users\acost\Downloads\GA11-220501098-AA3-EV01_Ajustes_Procesos_Desarrollo_YogurASO.pdf"
$pdfRepo = "C:\Users\acost\Desktop\YOGURASO-WEB\docs\taller-pruebas\GA11-220501098-AA3-EV01_Ajustes_Procesos_Desarrollo_YogurASO.pdf"

try {
    $word = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Word.Application")
} catch {
    $word = New-Object -ComObject Word.Application
}

$word.Visible = $false

$doc = $word.Documents.Open($docxPath, $false, $true)
$doc.SaveAs([ref]$pdfDesktop, [ref]17)
Write-Output "Saved to Desktop: $pdfDesktop"

$doc.SaveAs([ref]$pdfDownloads, [ref]17)
Write-Output "Saved to Downloads: $pdfDownloads"

$doc.SaveAs([ref]$pdfRepo, [ref]17)
Write-Output "Saved to Repo: $pdfRepo"

$doc.Close([ref]$false)
Write-Output "PDF conversion finished successfully!"
