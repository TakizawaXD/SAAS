const fs = require('fs');
const path = require('path');
const { jsPDF } = require('./FacturaPro360-Web/node_modules/jspdf');

function generateManual() {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 18;
    const contentWidth = pageWidth - (margin * 2);

    // Helpers
    const primaryColor = [11, 25, 44];    // #0B192C
    const accentBlue = [37, 99, 235];     // #2563EB
    const lightBg = [248, 250, 252];      // #F8FAFC
    const borderGray = [226, 232, 240];   // #E2E8F0
    const textDark = [15, 23, 42];        // #0F172A
    const textMuted = [100, 116, 139];    // #64748B
    const successGreen = [5, 150, 105];   // #059669

    function drawHeader(title, sectionNum) {
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, pageWidth, 24, 'F');

        doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
        doc.rect(0, 24, pageWidth, 1.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('FACTURAPRO 360  |  MANUAL OFICIAL DE OPERACIONES', margin, 15);

        if (sectionNum) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184);
            doc.text(`SECCION ${sectionNum}`, pageWidth - margin, 15, { align: 'right' });
        }
    }

    function drawFooter(pageNum, totalPages) {
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text('FacturaPro 360 Enterprise Suite  -  Manual de Usuario y Operaciones', margin, pageHeight - 10);
        doc.text(`Pagina ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    function drawCard(x, y, w, h, title, textLines, stripeColor) {
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.roundedRect(x, y, w, h, 3, 3, 'F');

        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.roundedRect(x, y, w, h, 3, 3, 'S');

        if (stripeColor) {
            doc.setFillColor(stripeColor[0], stripeColor[1], stripeColor[2]);
            doc.roundedRect(x, y, 2.5, h, 1, 1, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        doc.text(title, x + 6, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        let lineY = y + 14;
        for (const line of textLines) {
            doc.text(line, x + 6, lineY);
            lineY += 4.5;
        }
    }

    // ==========================================
    // PAGINA 1: PORTADA EJECUTIVA
    // ==========================================
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Accent line
    doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.rect(0, 0, 8, pageHeight, 'F');

    // Embed Logo
    const logoPath = path.join(__dirname, 'FacturaPro360-Web', 'public', 'assets', 'images', 'logo.jpg');
    if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath).toString('base64');
        doc.addImage(`data:image/jpeg;base64,${logoData}`, 'JPEG', margin + 10, 45, 38, 38);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text('FACTURAPRO 360', margin + 10, 102);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(56, 189, 248); // Cyan
    doc.text('MANUAL INTEGRAL DE USUARIO Y OPERACIONES', margin + 10, 112);

    doc.setFontSize(10.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Guia Oficial de Operacion para Plataforma Web (SaaS) y Aplicacion de Escritorio .NET 8', margin + 10, 120);

    // Decorative Separator
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.8);
    doc.line(margin + 10, 130, pageWidth - margin - 20, 130);

    // Metadata Card
    doc.setFillColor(15, 34, 59);
    doc.roundedRect(margin + 10, 142, contentWidth - 10, 80, 4, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('FICHA TECNICA DEL SISTEMA', margin + 18, 155);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);

    const meta = [
        ['Arquitectura Web:', 'Angular 19 Standalone, TypeScript, Docker Nginx, Supabase PostgreSQL RLS'],
        ['Arquitectura Desktop:', '.NET 8 WPF, Clean Architecture, SQLite WAL (0.1ms I/O), Motor C# SHA-256'],
        ['Modo de Ejecucion:', 'SaaS Cloud Multiempresa & Binario Standalone sin dependencias (.exe)'],
        ['Politica de Seguridad:', 'Cálculos decimales exactos, aislamiento RLS y confirmaciones obligatorias'],
        ['Version del Software:', 'Version 2.4 Enterprise (Edicion Certificada)'],
        ['Fecha de Publicacion:', 'Octubre 2026']
    ];

    let my = 166;
    for (const [k, v] of meta) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(56, 189, 248);
        doc.text(k, margin + 18, my);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(226, 232, 240);
        doc.text(v, margin + 62, my);
        my += 8;
    }

    // Bottom Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('FACTURAPRO 360  -  CONFIDENCIAL Y EXCLUSIVO PARA USUARIOS AUTORIZADOS', margin + 10, pageHeight - 25);

    // ==========================================
    // PAGINA 2: INDICE Y PUESTA EN MARCHA
    // ==========================================
    doc.addPage();
    drawHeader('INDICE Y PUESTA EN MARCHA', '01');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('1. Guia de Inicio Rapido y Ejecucion', margin, 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('FacturaPro 360 permite operar tanto de forma local offline como mediante servicio en la nube.', margin, 46);

    // Box 1: Iniciar Desktop
    drawCard(
        margin, 54, contentWidth, 42,
        'COMO INICIAR FACTURAPRO 360 DESKTOP (.NET 8 WPF)',
        [
            'Paso 1: Abra el explorador de archivos en la carpeta principal del proyecto.',
            'Paso 2: Haga doble clic en el archivo por lotes "Ejecutar-Desktop.bat".',
            'Paso 3: El sistema abrira inmediatamente el ejecutable autonomo "FacturaPro360.Wpf.exe".',
            'Nota: No requiere instalar librerias adicionales ni servidores externos para iniciar.'
        ],
        accentBlue
    );

    // Box 2: Iniciar Web con Docker
    drawCard(
        margin, 102, contentWidth, 42,
        'COMO INICIAR FACTURAPRO 360 WEB CON DOCKER (PRODUCCION)',
        [
            'Paso 1: Verifique que el servicio Docker Desktop este activo en su computadora.',
            'Paso 2: Haga doble clic en "Ejecutar-Web-Docker.bat" o ejecute "docker compose up -d --build".',
            'Paso 3: Abra su navegador web e ingrese a http://localhost:8080/ (o http://localhost/).',
            'Paso 4: Para detener los contenedores, haga doble clic en "Detener-Web-Docker.bat".'
        ],
        successGreen
    );

    // Box 3: Iniciar Web Desarrollo
    drawCard(
        margin, 150, contentWidth, 42,
        'COMO INICIAR EN MODO DESARROLLO LOCAL (ANGULAR CLI)',
        [
            'Paso 1: Abra una terminal en la carpeta "FacturaPro360-Web".',
            'Paso 2: Ejecute "npm start" para iniciar el servidor de desarrollo local.',
            'Paso 3: Acceda en su navegador a http://localhost:4200/.',
            'Paso 4: El sistema incluye un modo demostracion activo con datos simulados en memoria.'
        ],
        [168, 85, 247]
    );

    // Credenciales de acceso
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Credenciales de Acceso Iniciales (Modo Demo)', margin, 204);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(margin, 210, contentWidth, 42, 3, 3, 'FD');

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, 210, contentWidth, 9, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('ROL DE USUARIO', margin + 6, 216);
    doc.text('USUARIO', margin + 55, 216);
    doc.text('CONTRASENA', margin + 95, 216);
    doc.text('ALCANCE DE ACCESO', margin + 130, 216);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);

    doc.text('Administrador General', margin + 6, 226);
    doc.text('adminfactura', margin + 55, 226);
    doc.text('admin123', margin + 95, 226);
    doc.text('Acceso total a los 16 modulos', margin + 130, 226);

    doc.text('Operador de Ventas', margin + 6, 238);
    doc.text('operador1', margin + 55, 238);
    doc.text('operador123', margin + 95, 238);
    doc.text('Facturacion, cobros y catálogo', margin + 130, 238);

    drawFooter(2, 6);

    // ==========================================
    // PAGINA 3: OPERACION DE LA PLATAFORMA WEB
    // ==========================================
    doc.addPage();
    drawHeader('MODULO DE FACTURACION Y VENTAS (WEB)', '02');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('2. Gestion de Facturacion y Cobros en la Web', margin, 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('El modulo de facturacion electronica cuenta con calculo instantaneo y descarga en PDF.', margin, 46);

    // Pasos para emitir factura
    drawCard(
        margin, 54, contentWidth, 75,
        'PASO A PASO: COMO EMITIR UNA NUEVA FACTURA',
        [
            '1. Ingrese a la seccion "Facturacion" desde el menu lateral o presione el boton "Nueva factura".',
            '2. Seleccione el cliente en la lista desplegable. Los datos fiscales se cargaran automaticamente.',
            '3. Verifique la fecha de emision y elija la condicion de pago ("Contado", "Credito 15 dias" o "30 dias").',
            '4. En el selector de productos, elija los articulos deseados y presione "Agregar".',
            '   - El sistema valida en tiempo real la existencia en almacén para evitar ventas sin stock.',
            '   - Puede ajustar cantidades o eliminar lineas con el boton de papelera en cualquier momento.',
            '5. Verifique el desglose de Subtotal, Descuentos, IVA (13%) y el Total calculado.',
            '6. Presione "Emitir Factura". El comprobante quedara registrado y disponible en el historial.'
        ],
        accentBlue
    );

    // Gestion de cobros
    drawCard(
        margin, 136, contentWidth, 58,
        'COMO REGISTRAR PAGOS Y ABONOS A FACTURAS',
        [
            '1. En la lista de facturas, haga clic en "Detalle" sobre el comprobante que desea cobrar.',
            '2. Presione el boton verde "Registrar Pago".',
            '3. Ingrese el monto a abonar y seleccione el medio de pago (Efectivo, Tarjeta, Transferencia o Cheque).',
            '   - Proteccion antibloqueo: El sistema impide ingresar montos mayores al saldo adeudado.',
            '4. Haga clic en "Confirmar Pago". El estado cambiara a "Parcial" o "Pagada" segun el saldo restante.'
        ],
        successGreen
    );

    // Descarga de PDF
    drawCard(
        margin, 201, contentWidth, 48,
        'DESCARGA E IMPRESION DE COMPROBANTES PDF',
        [
            '1. Desde la vista de detalle de la factura, presione el boton "Descargar PDF Oficial".',
            '2. El motor jsPDF ensamblara el documento oficial con emisor, cliente, detalle de ítems y totales.',
            '3. El archivo se guardara directamente en la carpeta de descargas de su dispositivo.',
            '4. Este documento cumple con el formato estandar para fines fiscales, auditorias y envio por correo.'
        ],
        [245, 158, 11]
    );

    drawFooter(3, 6);

    // ==========================================
    // PAGINA 4: CLIENTES, INVENTARIO Y NAVEGACION
    // ==========================================
    doc.addPage();
    drawHeader('CRM, INVENTARIO Y BUSCADOR SPOTLIGHT', '03');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('3. Administracion de Clientes, Inventario y Buscador', margin, 40);

    drawCard(
        margin, 50, contentWidth, 62,
        'DIRECTORIO DE CLIENTES Y CONTROL DE CREDITOS',
        [
            'Acceso: Diríjase a "Clientes y CRM" en la barra de navegacion lateral.',
            'Registro de Nuevo Cliente:',
            '  - Presione "Nuevo cliente" para abrir el formulario modal emergente.',
            '  - Complete Tipo de Documento (RUC, Cedula, Pasaporte), Identificacion Fiscal y Razon Social.',
            '  - Opcionalmente fije el Limite de Credito en dolares ($) para prevenir sobreendeudamiento.',
            '  - Presione "Guardar Cliente". El registro se incorporara de inmediato a la lista disponible.'
        ],
        accentBlue
    );

    drawCard(
        margin, 119, contentWidth, 62,
        'CATALOGO DE PRODUCTOS Y CONTROL KARDEX',
        [
            'Acceso: Diríjase a "Productos e inventario" en el menu lateral.',
            'Creacion de Articulos:',
            '  - Presione "Nuevo producto" para desplegar la ventana de alta.',
            '  - Indique Nombre, Codigo SKU unico, Precio de Venta, Costo Promedio y Existencia Inicial.',
            '  - Establezca el Stock Minimo de Alerta para que el Dashboard le avise cuando queden pocas unidades.',
            '  - Seleccione si es Producto Fisico o Servicio (los servicios no descuentan inventario kardex).'
        ],
        successGreen
    );

    drawCard(
        margin, 188, contentWidth, 60,
        'BUSCADOR SPOTLIGHT GLOBAL CON ATAJO DE TECLADO (CTRL + K)',
        [
            'Activacion: Presione la combinacion de teclas "Ctrl + K" (o Cmd + K en Mac) en cualquier pantalla.',
            'Capacidades de Busqueda:',
            '  - Escriba numeros de factura, nombres de clientes o codigos SKU de productos.',
            '  - Filtre por categorías (Facturas, Clientes, Inventario, Proveedores).',
            '  - Haga clic en el resultado para navegar inmediatamente al comprobante o ficha correspondiente.',
            '  - Para salir de la busqueda, presione la tecla "Escape" (ESC).'
        ],
        [168, 85, 247]
    );

    drawFooter(4, 6);

    // ==========================================
    // PAGINA 5: OPERACION DE ESCRITORIO (.NET 8)
    // ==========================================
    doc.addPage();
    drawHeader('FACTURAPRO 360 ESCRITORIO (.NET 8 WPF)', '04');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('4. Uso de la Aplicacion de Escritorio y Respaldos', margin, 40);

    drawCard(
        margin, 50, contentWidth, 54,
        'VENTAJAS DE LA EDICION STANDALONE (.EXE)',
        [
            'Operacion Ultrarrapida Offline: Funciona con base de datos SQLite WAL de 0.1 ms de latencia.',
            'No Depende de Internet: Permite emitir facturas y despachar mercancia en contingencias de red.',
            'Consumo Minimo de Recursos: Disenada con WPF y C# optimizado para un uso ligero de RAM.',
            'Ejecutable Unico: Todos los iconos, estilos y vistas estan empaquetados en FacturaPro360.Wpf.exe.'
        ],
        accentBlue
    );

    drawCard(
        margin, 111, contentWidth, 68,
        'CENTRO DE RESPALDO Y PROTECCION CRIPTOGRAFICA (BACKUP)',
        [
            'Acceso: En el menu lateral de la aplicacion de escritorio, seleccione "Copias y Respaldo".',
            'Auto-Respaldo en Segundo Plano:',
            '  - El sistema ejecuta una copia automatica cada 15 minutos en segundo plano.',
            '  - Las copias se almacenan con extension ".bak" y estampado de tiempo exacto.',
            '  - El sistema mantiene automaticamente las ultimas 30 copias, purgando las obsoletas.',
            'Generacion de Respaldo Manual:',
            '  - Presione "Generar Copia de Seguridad Ahora". Se creara un nuevo punto en menos de un segundo.'
        ],
        successGreen
    );

    drawCard(
        margin, 186, contentWidth, 62,
        'PROCEDIMIENTO SEGURO DE RESTAURACION DE BASE DE DATOS',
        [
            '1. En la lista de puntos de restauracion, identifique la fecha y hora a la que desea volver.',
            '2. Presione el boton "Restaurar Copia".',
            '3. Salvaguarda Preventiva Automatica: Antes de sobreescribir la base de datos, el sistema',
            '   creara una copia de seguridad del estado actual para evitar perdidas accidentales.',
            '4. La base de datos se restablecera y el usuario recibira confirmacion inmediata en pantalla.'
        ],
        [239, 68, 68]
    );

    drawFooter(5, 6);

    // ==========================================
    // PAGINA 6: SEGURIDAD, AUDITORIA Y SOPORTE
    // ==========================================
    doc.addPage();
    drawHeader('SEGURIDAD, AUDITORIA Y PREVENCION', '05');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('5. Politicas de Seguridad y Preguntas Frecuentes', margin, 40);

    drawCard(
        margin, 50, contentWidth, 54,
        'SISTEMA DE CONFIRMACION ESTRICTA ("ESTAS SEGURO?")',
        [
            'Toda accion destructiva (eliminar factura, dar de baja cliente o producto) activa un modal obligatorio.',
            'El modal detalla el nombre del registro, el impacto contable y exige un consentimiento afirmativo.',
            'Si el usuario cancela, no se produce ninguna alteracion en la base de datos ni en el inventario.',
            'Cada confirmacion o cancelacion genera un rastro de auditoria inmutable.'
        ],
        [245, 158, 11]
    );

    drawCard(
        margin, 111, contentWidth, 54,
        'BLINDAJE CONTRA ERRORES HUMANOS Y MALAS PRACTICAS',
        [
            'Bloqueo de Precios Negativos: El sistema no permite facturar ítems con importes menores a cero.',
            'Numeracion Fiscal Consecutiva: Se emplean bloqueos transaccionales para evitar saltos de folios.',
            'Aislamiento Multitenant (RLS): Una empresa nunca puede visualizar comprobantes de otra organizacion.',
            'Firmas Criptograficas SHA-256: Los respaldos locales verifican su hash para evitar manipulaciones.'
        ],
        accentBlue
    );

    // Box FAQ
    drawCard(
        margin, 172, contentWidth, 75,
        'PREGUNTAS FRECUENTES Y RESOLUCION DE DUDAS',
        [
            'P: Que hago si se apaga la computadora mientras emitia una factura en la app de escritorio?',
            'R: Gracias al modo WAL de SQLite, la base de datos recupera su consistencia automaticamente al abrirse.',
            'P: Como se realiza la sincronizacion entre la app web y la base de datos?',
            'R: La version web se comunica con Supabase mediante HTTPS y llamadas seguras RPC con politicas RLS.',
            'P: Puedo usar la version web en mi telefono movil?',
            'R: Si, la interfaz es 100% responsiva y cuenta con menu lateral desplegable, tablas adaptables y PWA.',
            'P: Donde se almacenan los respaldos locales de escritorio?',
            'R: Se guardan en el directorio "Backups" junto al ejecutable con extension .bak y firma hash individual.'
        ],
        successGreen
    );

    drawFooter(6, 6);

    // Save Output
    const outputPath = path.join(__dirname, 'MANUAL_USUARIO_FACTURAPRO360.pdf');
    const pdfData = doc.output();
    fs.writeFileSync(outputPath, pdfData, 'binary');
    console.log('PDF_GENERADO_CORRECTAMENTE:', outputPath);
}

generateManual();
