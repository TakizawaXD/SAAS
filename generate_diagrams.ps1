Add-Type -AssemblyName System.Drawing

function Create-RoundedRectanglePath {
    param(
        [float]$x, [float]$y, [float]$width, [float]$height, [float]$radius
    )
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
    $path.AddArc($x + $width - $diameter, $y, $diameter, $diameter, 270, 90)
    $path.AddArc($x + $width - $diameter, $y + $height - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($x, $y + $height - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-Card {
    param(
        [System.Drawing.Graphics]$g,
        [float]$x, [float]$y, [float]$w, [float]$h,
        [System.Drawing.Color]$bgColor,
        [System.Drawing.Color]$borderColor,
        [string]$title,
        [string]$subtitle,
        [string[]]$items,
        [System.Drawing.Color]$accentColor
    )
    $path = Create-RoundedRectanglePath $x $y $w $h 12
    $brush = New-Object System.Drawing.SolidBrush $bgColor
    $pen = New-Object System.Drawing.Pen $borderColor, 1.5
    $g.FillPath($brush, $path)
    $g.DrawPath($pen, $path)

    # Accent Top Stripe
    $stripePath = Create-RoundedRectanglePath ($x + 1) ($y + 1) ($w - 2) 4 2
    $accentBrush = New-Object System.Drawing.SolidBrush $accentColor
    $g.FillPath($accentBrush, $stripePath)

    # Title
    $fontTitle = New-Object System.Drawing.Font "Segoe UI", 13, ([System.Drawing.FontStyle]::Bold)
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $g.DrawString($title, $fontTitle, $whiteBrush, ($x + 16), ($y + 16))

    # Subtitle
    if ($subtitle) {
        $fontSub = New-Object System.Drawing.Font "Segoe UI", 9, ([System.Drawing.FontStyle]::Regular)
        $subBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(148, 163, 184))
        $g.DrawString($subtitle, $fontSub, $subBrush, ($x + 16), ($y + 40))
    }

    # Items
    $fontItem = New-Object System.Drawing.Font "Segoe UI", 10, ([System.Drawing.FontStyle]::Regular)
    $itemBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(226, 232, 240))
    $dotBrush = New-Object System.Drawing.SolidBrush $accentColor

    $currY = $y + 68
    foreach ($item in $items) {
        $g.FillEllipse($dotBrush, ($x + 18), ($currY + 5), 6, 6)
        $g.DrawString($item, $fontItem, $itemBrush, ($x + 32), $currY)
        $currY += 24
    }

    $path.Dispose()
    $brush.Dispose()
    $pen.Dispose()
    $stripePath.Dispose()
    $accentBrush.Dispose()
    $fontTitle.Dispose()
    $whiteBrush.Dispose()
    $fontItem.Dispose()
    $itemBrush.Dispose()
    $dotBrush.Dispose()
}

# ==============================================================================
# DIAGRAMA 1: ARQUITECTURA WEB (FacturaPro 360 Web)
# ==============================================================================
$w = 1920
$h = 1080
$bmpWeb = New-Object System.Drawing.Bitmap $w, $h
$gWeb = [System.Drawing.Graphics]::FromImage($bmpWeb)
$gWeb.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gWeb.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

# Background
$bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(6, 14, 26))
$gWeb.FillRectangle($bgBrush, 0, 0, $w, $h)

# Subtle Grid lines
$gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(15, 29, 48)), 1
for ($i = 0; $i -lt $w; $i += 40) { $gWeb.DrawLine($gridPen, $i, 0, $i, $h) }
for ($j = 0; $j -lt $h; $j += 40) { $gWeb.DrawLine($gridPen, 0, $j, $w, $j) }

# Header Container
$headerPath = Create-RoundedRectanglePath 40 40 1840 90 12
$headerBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(11, 25, 44))
$headerBorder = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(30, 62, 102)), 1.5
$gWeb.FillPath($headerBg, $headerPath)
$gWeb.DrawPath($headerBorder, $headerPath)

$hTitleFont = New-Object System.Drawing.Font "Segoe UI", 20, ([System.Drawing.FontStyle]::Bold)
$hSubFont = New-Object System.Drawing.Font "Segoe UI", 11, ([System.Drawing.FontStyle]::Regular)
$whiteB = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$cyanB = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(56, 189, 248))
$mutedB = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(148, 163, 184))

$gWeb.DrawString("FACTURAPRO 360 - ARQUITECTURA DE SISTEMA WEB", $hTitleFont, $whiteB, 70, 52)
$gWeb.DrawString("Angular 19 Standalone + Docker Nginx Hardened + Supabase Multitenant PostgreSQL con RLS y RPC", $hSubFont, $mutedB, 70, 88)

# Header Badge
$badgePath = Create-RoundedRectanglePath 1620 62 230 40 8
$badgeBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(15, 36, 58))
$badgePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(37, 99, 235)), 1
$badgeFont = New-Object System.Drawing.Font "Segoe UI", 10, ([System.Drawing.FontStyle]::Bold)
$gWeb.FillPath($badgeBg, $badgePath)
$gWeb.DrawPath($badgePen, $badgePath)
$gWeb.DrawString("EDICION WEB AAA", $badgeFont, $cyanB, 1675, 74)

# 4 Column Architecture Blocks
$colY = 160
$colH = 680
$colW = 430
$cardBg = [System.Drawing.Color]::FromArgb(11, 25, 44)
$cardBorder = [System.Drawing.Color]::FromArgb(21, 44, 76)

# Col 1: CLIENT TIER
$itemsCol1 = @(
    "Navegadores Modernos (Chrome, Firefox, Safari, Edge)",
    "PWA Adaptable (Mobile 390px, Tablet 768px, PC 1440px)",
    "Menu Lateral Desplegable Táctil (Drawer con Backdrop)",
    "Tablas de Facturacion con Desplazamiento Suave",
    "Buscador Spotlight Global con Acceso Rapido (Ctrl + K)",
    "Motor jsPDF del Lado del Cliente (Generacion Directa)"
)
Draw-Card $gWeb 40 $colY $colW $colH $cardBg $cardBorder "1. CAPA CLIENTE / FRONTEND" "Angular 19 + TypeScript + Tailwind CSS" $itemsCol1 ([System.Drawing.Color]::FromArgb(59, 130, 246))

# Col 2: EDGE / PROXY TIER
$itemsCol2 = @(
    "Contenedor Docker Multi-Stage de Produccion",
    "Servidor Web Nginx Hardened (Alta Disponibilidad)",
    "Terminacion SSL / TLS Cifrado de Extremo a Extremo",
    "Cabeceras de Seguridad: CSP, X-Frame-Options, HSTS",
    "Compresion Gzip y Cache Agresiva de Activos Estaticos",
    "Aislamiento de Red Interna Docker Bridge"
)
Draw-Card $gWeb 510 $colY $colW $colH $cardBg $cardBorder "2. INFRAESTRUCTURA Y PROXY" "Docker Compose + Nginx Hardened" $itemsCol2 ([System.Drawing.Color]::FromArgb(16, 185, 129))

# Col 3: API & SECURITY GATEWAY
$itemsCol3 = @(
    "Supabase PostgREST Gateway de Alta Velocidad",
    "Autenticacion Stateless basada en Tokens JWT",
    "Control de Acceso Basado en Roles (RBAC)",
    "Filtros de Seguridad por Empresa (Tenant Id)",
    "WebSockets en Tiempo Real para Notificaciones",
    "Manejador Global de Confirmaciones y Pentest Guard"
)
Draw-Card $gWeb 980 $colY $colW $colH $cardBg $cardBorder "3. GATEWAY Y AUTENTICACION" "Supabase REST API + JWT Engine" $itemsCol3 ([System.Drawing.Color]::FromArgb(245, 158, 11))

# Col 4: DATA & TRANSACTIONS TIER
$itemsCol4 = @(
    "Base de Datos Relacional PostgreSQL 15 Multitenant",
    "Row Level Security (RLS) Estricto por empresa_id",
    "RPC rpc_emitir_factura (Bloqueo SELECT FOR UPDATE)",
    "RPC rpc_registrar_pago (Validacion Antirebase y Saldos)",
    "RPC rpc_anular_factura (Reversion Automatica Kardex)",
    "Pistas de Auditoria Inmutables con Checksum"
)
Draw-Card $gWeb 1450 $colY $colW $colH $cardBg $cardBorder "4. DATOS Y LOGICA TRANSACCIONAL" "PostgreSQL 15 + RLS Policies + Stored Procs" $itemsCol4 ([System.Drawing.Color]::FromArgb(239, 68, 68))

# Bottom Banner: Data Flow & Protocols
$footerPath = Create-RoundedRectanglePath 40 865 1840 160 12
$footerBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(10, 21, 37))
$footerPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(21, 44, 76)), 1.5
$gWeb.FillPath($footerBg, $footerPath)
$gWeb.DrawPath($footerPen, $footerPath)

$fTitleFont = New-Object System.Drawing.Font "Segoe UI", 12, ([System.Drawing.FontStyle]::Bold)
$fTextFont = New-Object System.Drawing.Font "Segoe UI", 9.5, ([System.Drawing.FontStyle]::Regular)
$greenB = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(52, 211, 153))

$gWeb.DrawString("PIPELINE DE COMUNICACION Y PROTOCOLOS DE SEGURIDAD ATOMICA", $fTitleFont, $greenB, 70, 885)
$gWeb.DrawString("1. El navegador emite peticiones HTTPS autenticadas mediante Bearer JWT generado en login.", $fTextFont, $whiteB, 70, 915)
$gWeb.DrawString("2. Docker Nginx valida los encabezados, enruta los endpoints y mitiga ataques de inyeccion o manipulacion.", $fTextFont, $whiteB, 70, 940)
$gWeb.DrawString("3. Las politicas RLS de PostgreSQL garantizan que ningun inquilino pueda consultar ni modificar datos de otra empresa.", $fTextFont, $whiteB, 70, 965)
$gWeb.DrawString("4. Las funciones RPC procesan emision, pagos y kardex dentro de transacciones atomicas ACID inquebrantables.", $fTextFont, $whiteB, 70, 990)

$bmpWeb.Save("c:\Users\andre\OneDrive\Desktop\SAAS\docs\images\arquitectura_web.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gWeb.Dispose()
$bmpWeb.Dispose()
Write-Output "ARQUITECTURA_WEB_GENERADA"

# ==============================================================================
# DIAGRAMA 2: ARQUITECTURA ESCRITORIO (.NET 8 WPF)
# ==============================================================================
$bmpDesk = New-Object System.Drawing.Bitmap $w, $h
$gDesk = [System.Drawing.Graphics]::FromImage($bmpDesk)
$gDesk.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gDesk.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

# Background
$gDesk.FillRectangle($bgBrush, 0, 0, $w, $h)

# Subtle Grid lines
for ($i = 0; $i -lt $w; $i += 40) { $gDesk.DrawLine($gridPen, $i, 0, $i, $h) }
for ($j = 0; $j -lt $h; $j += 40) { $gDesk.DrawLine($gridPen, 0, $j, $w, $j) }

# Header Container
$headerPathDesk = Create-RoundedRectanglePath 40 40 1840 90 12
$gDesk.FillPath($headerBg, $headerPathDesk)
$gDesk.DrawPath($headerBorder, $headerPathDesk)

$gDesk.DrawString("FACTURAPRO 360 - ARQUITECTURA DE ESCRITORIO AAA (.NET 8)", $hTitleFont, $whiteB, 70, 52)
$gDesk.DrawString("Clean Architecture + SQLite High-Throughput WAL + Motor de Respaldo Criptografico C#", $hSubFont, $mutedB, 70, 88)

# Header Badge
$badgePathDesk = Create-RoundedRectanglePath 1600 62 250 40 8
$gDesk.FillPath($badgeBg, $badgePathDesk)
$gDesk.DrawPath($badgePen, $badgePathDesk)
$gDesk.DrawString("STANDALONE SINGLE-EXE", $badgeFont, $cyanB, 1630, 74)

# 4 Column Architecture Blocks for Desktop
# Col 1: PRESENTATION TIER (WPF XAML)
$itemsDesk1 = @(
    "Ventana Sin Marco WindowChrome con Sombra Nativa",
    "Vistas Modulares: Dashboard, Facturas, Clientes, Kardex",
    "Centro de Respaldo y Telemetria Criptografica",
    "Estilos HSL Dark Navy (#0B192C) y Fuentes Inter",
    "Barra de Estado: Latencia 0.1ms, Estado WAL, Motor",
    "Modal de Confirmacion Estricta 'Estas Seguro?'"
)
Draw-Card $gDesk 40 $colY $colW $colH $cardBg $cardBorder "1. CAPA PRESENTACION (WPF)" "XAML + MVVM Toolkit + Fluent Styles" $itemsDesk1 ([System.Drawing.Color]::FromArgb(59, 130, 246))

# Col 2: APPLICATION & DOMAIN LOGIC
$itemsDesk2 = @(
    "ViewModels Desacoplados (CommunityToolkit.Mvvm)",
    "Comandos Asincronos (AsyncRelayCommand) con Timeout",
    "Servicio de Facturacion Transaccional (FacturacionService)",
    "Validacion de Negocio: Numeracion Consecutiva, Limites",
    "Calculo de Totales y Subtotales con Precision Exacta",
    "Control de Stock y Kardex con Prevencion de Negativos"
)
Draw-Card $gDesk 510 $colY $colW $colH $cardBg $cardBorder "2. APLICACION Y DOMINIO" "FacturaPro360.Application & Domain" $itemsDesk2 ([System.Drawing.Color]::FromArgb(16, 185, 129))

# Col 3: HIGH-THROUGHPUT ENGINE & CACHE
$itemsDesk3 = @(
    "Base de Datos SQLite en Modo WAL (Write-Ahead-Log)",
    "Latencia de Escritura Ultrarrapida de 0.1 ms",
    "Acceso Concurrente Multihilo Seguro sin Bloqueo de UI",
    "In-Memory Cache para Consultas de Clientes y Precios",
    "Inyeccion de Dependencias (Microsoft.Extensions.DependencyInjection)",
    "Preparacion de Comandos SQL Compilados y Parametrizados"
)
Draw-Card $gDesk 980 $colY $colW $colH $cardBg $cardBorder "3. MOTOR DE DATOS Y CACHE" "FacturaPro360.Infrastructure (SQLite WAL)" $itemsDesk3 ([System.Drawing.Color]::FromArgb(168, 85, 247))

# Col 4: DISASTER RECOVERY & CRYPTO BACKUP
$itemsDesk4 = @(
    "Temporizador de Auto-Respaldo en Segundo Plano (15 min)",
    "Generacion de Copias en Caliente .bak con Timestamp",
    "Verificacion de Integridad Criptografica con Hash SHA-256",
    "Politica de Retencion Automatica (Ultimos 30 Respaldos)",
    "Restauracion Asistida con Copia Preventiva Inmediata",
    "Registro Inmutable de Eventos de Seguridad y Contingencia"
)
Draw-Card $gDesk 1450 $colY $colW $colH $cardBg $cardBorder "4. RESPALDO Y BLINDAJE" "BackupService & Recovery Engine" $itemsDesk4 ([System.Drawing.Color]::FromArgb(239, 68, 68))

# Bottom Banner: Continuity Guarantee
$gDesk.FillPath($footerBg, $footerPath)
$gDesk.DrawPath($footerPen, $footerPath)

$gDesk.DrawString("GARANTIAS DE ROBUSTEZ Y BLINDAJE CONTRA PERDIDA DE DATOS", $fTitleFont, $cyanB, 70, 885)
$gDesk.DrawString("1. El motor WAL garantiza que los registros se escriban primero en el registro de transacciones, asegurando durabilidad ACID.", $fTextFont, $whiteB, 70, 915)
$gDesk.DrawString("2. Ante un cierre forzado o caida de energia, SQLite recupera el estado integro sin corrupcion en menos de un segundo.", $fTextFont, $whiteB, 70, 940)
$gDesk.DrawString("3. El servicio de auto-respaldo guarda copias continuas; si un usuario comete un error, puede restaurar cualquier punto anterior.", $fTextFont, $whiteB, 70, 965)
$gDesk.DrawString("4. Cada copia cuenta con firma SHA-256 para prevenir manipulaciones indebidas externas.", $fTextFont, $whiteB, 70, 990)

$bmpDesk.Save("c:\Users\andre\OneDrive\Desktop\SAAS\docs\images\arquitectura_desktop.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gDesk.Dispose()
$bmpDesk.Dispose()

$bgBrush.Dispose()
$gridPen.Dispose()
$headerBg.Dispose()
$headerBorder.Dispose()
$hTitleFont.Dispose()
$hSubFont.Dispose()
$whiteB.Dispose()
$cyanB.Dispose()
$mutedB.Dispose()
$badgeBg.Dispose()
$badgePen.Dispose()
$badgeFont.Dispose()
$footerBg.Dispose()
$footerPen.Dispose()
$fTitleFont.Dispose()
$fTextFont.Dispose()
$greenB.Dispose()

Write-Output "DIAGRAMAS_GENERADOS_EXITOSAMENTE"
