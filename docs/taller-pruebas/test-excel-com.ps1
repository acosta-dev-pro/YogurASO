$ErrorActionPreference = 'Stop'
try {
  $excel = New-Object -ComObject Excel.Application
  Write-Output ("Excel COM OK version=" + $excel.Version)
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
} catch {
  Write-Output ("FAIL: " + $_.Exception.Message)
}
