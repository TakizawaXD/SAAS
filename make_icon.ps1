Add-Type -AssemblyName System.Drawing
$imgPath = 'c:\Users\andre\OneDrive\Desktop\SAAS\FacturaPro360-Desktop\src\FacturaPro360.Wpf\Assets\app_icon.jpg'
$icoWpf = 'c:\Users\andre\OneDrive\Desktop\SAAS\FacturaPro360-Desktop\src\FacturaPro360.Wpf\Assets\app_icon.ico'
$icoWeb = 'c:\Users\andre\OneDrive\Desktop\SAAS\FacturaPro360-Web\public\favicon.ico'

$src = [System.Drawing.Bitmap]::FromFile($imgPath)
$bmp = New-Object System.Drawing.Bitmap $src, 128, 128
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$fsWpf = [System.IO.File]::OpenWrite($icoWpf)
$icon.Save($fsWpf)
$fsWpf.Close()

$fsWeb = [System.IO.File]::OpenWrite($icoWeb)
$icon.Save($fsWeb)
$fsWeb.Close()

$icon.Dispose()
$bmp.Dispose()
$src.Dispose()
Write-Output "ICONS CREATED"
