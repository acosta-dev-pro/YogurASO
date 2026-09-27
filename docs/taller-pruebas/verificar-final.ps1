$ErrorActionPreference = 'Stop'
Get-Process EXCEL -ErrorAction SilentlyContinue | Stop-Process -Force
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false; $excel.DisplayAlerts = $false; $excel.AutomationSecurity = 3
$wb = $excel.Workbooks.Open('C:\Users\acost\Downloads\Plan_Negocio_EstDent_System.xlsm', 0, $true)
$fc = $wb.Worksheets.Item('10. Flujo de Caja')
$cal = $wb.Worksheets.Item(17)
foreach ($a in 'B30','C30','D30','E30','F30','G30','B31','C31','D31','E31','F31','G31','H10','H11','H16','H17','H21','H23','H31','B35','B36','B41') {
  Write-Output ("FC " + $a + " " + $fc.Range($a).Formula + " => " + $fc.Range($a).Text.Trim())
}
foreach ($a in 'D8','F8','F10','F61','F63','C71','C72','C75') { Write-Output ("CAL " + $a + " => " + $cal.Range($a).Text.Trim()) }
$re = $wb.Worksheets.Item('14, Resumen Ejecutivo')
foreach ($a in 'A4','D4','A5','A6','D42') { Write-Output ("RE " + $a + " => " + $re.Range($a).Text.Trim()) }
$wb.Close($false); $excel.Quit()
