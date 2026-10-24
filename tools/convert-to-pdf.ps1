$docxPath = "C:\Users\acost\Desktop\Instrumento_Evaluacion_Calidad_YogurASO.docx"
$pdfPath = "C:\Users\acost\Desktop\Instrumento_Evaluacion_Calidad_YogurASO.pdf"
$pdfDownloads = "C:\Users\acost\Downloads\Instrumento_Evaluacion_Calidad_YogurASO.pdf"

try {
    $word = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Word.Application")
} catch {
    $word = New-Object -ComObject Word.Application
}

$doc = $word.Documents.Open($docxPath, $false, $true)
$doc.SaveAs([ref]$pdfPath, [ref]17)
$doc.SaveAs([ref]$pdfDownloads, [ref]17)
$doc.Close([ref]$false)

Write-Output "Successfully exported PDF to Desktop and Downloads!"
