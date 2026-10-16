import { Injectable, signal } from '@angular/core';

export interface ContenidoAyuda {
  clave: string;
  titulo: string;
  subtitulo: string;
  proposito: string;
  pasos: string[];
  campos: { nombre: string; descripcion: string }[];
  consejos: string[];
}

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  modalAbierto = signal<boolean>(false);
  ayudaActiva = signal<ContenidoAyuda | null>(null);

  private catalogoAyuda: Record<string, ContenidoAyuda> = {
    'dashboard': {
      clave: 'dashboard',
      titulo: 'Panel de Inicio y Resumen General',
      subtitulo: 'Centro de control de tu negocio con datos en tiempo real.',
      proposito: 'Visualizar de forma rapida el estado financiero, ventas recientes, cuentas por cobrar y stock bajo de tu empresa.',
      pasos: [
        'Revisa los indicadores superiores (Ventas del mes, Cobrado, Saldo pendiente y Stock bajo).',
        'Utiliza los accesos directos para emitir facturas rapidamente o registrar nuevos productos.',
        'Sigue la Guia de Inicio si acabas de registrar tu negocio para completar la configuracion basica.'
      ],
      campos: [
        { nombre: 'Ventas del mes', descripcion: 'Suma acumulada de todas las facturas emitidas y activas en el periodo.' },
        { nombre: 'Cobros recibidos', descripcion: 'Total de dinero recaudado a traves de abonos y pagos de contado.' },
        { nombre: 'Cuentas por cobrar', descripcion: 'Saldos pendientes de pago por parte de clientes a credito.' },
        { nombre: 'Stock bajo', descripcion: 'Cantidad de articulos que han alcanzado o bajado de su inventario minimo de seguridad.' }
      ],
      consejos: [
        'Los datos se actualizan de forma automatica en cada operacion.',
        'Si tu cuenta es nueva, veras los indicadores en cero hasta que comiences a registrar ventas.'
      ]
    },
    'facturas': {
      clave: 'facturas',
      titulo: 'Listado y Gestion de Facturas',
      subtitulo: 'Control integral de documentos de venta y cuentas de cobro.',
      proposito: 'Administrar todos los comprobantes emitidos, consultar saldos pendientes, aplicar filtros por estado y generar nuevas ventas.',
      pasos: [
        'Haz clic en "Nueva Factura" para crear un comprobante de venta.',
        'Haz clic sobre cualquier factura para ver su detalle, registrar abonos o descargar el PDF oficial.',
        'Usa el buscador o los filtros de estado (Emitida, Pagada, Parcial, Anulada) para encontrar comprobantes rapidamente.'
      ],
      campos: [
        { nombre: 'Numero de factura', descripcion: 'Serie consecutiva oficial (ejemplo: FAC-00000001).' },
        { nombre: 'Estado Emitida', descripcion: 'Comprobante formal emitido con saldo pendiente total por cobrar.' },
        { nombre: 'Estado Parcial', descripcion: 'Factura que ha recibido uno o mas abonos pero aun tiene saldo.' },
        { nombre: 'Estado Pagada', descripcion: 'Factura completamente cancelada y saldada.' },
        { nombre: 'Estado Anulada', descripcion: 'Documento cancelado contablemente; el stock vendido fue restituido al almacen.' }
      ],
      consejos: [
        'Las facturas anuladas no pueden reactivarse para garantizar la trazabilidad de auditoria fiscal.',
        'Puedes descargar en cualquier momento el PDF con formato formal de impresion.'
      ]
    },
    'nueva-factura': {
      clave: 'nueva-factura',
      titulo: 'Emision de Nueva Factura de Venta',
      subtitulo: 'Creacion guiada de comprobantes con calculo automatico de impuestos.',
      proposito: 'Registrar una venta formal descontando inventario en tiempo real y asignando la deuda al cliente correspondiente.',
      pasos: [
        'Paso 1: Selecciona el cliente receptor. Si no existe, puedes agregarlo primero en el modulo de Clientes.',
        'Paso 2: Especifica la fecha de emision y la condicion de pago (Contado o Credito con dias de gracia).',
        'Paso 3: Selecciona los productos del catalogo en el selector rapido y haz clic en "Agregar".',
        'Paso 4: Verifica en la vista previa lateral que los subtotales, IVA y total sean exactos.',
        'Paso 5: Haz clic en "Generar factura" para emitir el documento oficial.'
      ],
      campos: [
        { nombre: 'Cliente receptor', descripcion: 'Persona o empresa a quien se le factura el bien o servicio.' },
        { nombre: 'Condicion de pago', descripcion: 'Contado (pago inmediato) o Credito (con fecha limite de vencimiento).' },
        { nombre: 'Lineas de producto', descripcion: 'Articulos vendidos, cantidades, precio unitario y descuento aplicable.' },
        { nombre: 'Vista previa', descripcion: 'Hoja en formato estandar A4 que replica exactamente como quedara el comprobante impreso.' }
      ],
      consejos: [
        'No puedes emitir una factura sin productos o sin cliente.',
        'El sistema impide sobrepasar el limite de credito autorizado del cliente.'
      ]
    },
    'detalle-factura': {
      clave: 'detalle-factura',
      titulo: 'Detalle de Factura y Cobranza',
      subtitulo: 'Administracion de abonos, estado fiscal y descarga de documentos.',
      proposito: 'Consultar el desglose de productos facturados, registrar pagos aplicados al saldo pendiente o anular la factura si hubo un error.',
      pasos: [
        'Para registrar un pago: pulsa "Registrar Pago", introduce el monto abonado, metodo de pago y confirma.',
        'Para imprimir o guardar: pulsa "Descargar PDF Oficial" para generar el documento firmado.',
        'Para anular: pulsa "Anular Factura", escribe el motivo justificado y confirma la reposicion de stock.'
      ],
      campos: [
        { nombre: 'Saldo pendiente', descripcion: 'Cantidad restante que el cliente adeuda sobre este comprobante.' },
        { nombre: 'Historial de pagos', descripcion: 'Lista de todos los recibos y abonos aplicados con fecha y responsable.' },
        { nombre: 'Metodo de pago', descripcion: 'Efectivo, Tarjeta de Credito/Debito, Transferencia bancaria o Cheque.' }
      ],
      consejos: [
        'No es posible registrar abonos mayores al saldo pendiente de la factura.',
        'Al anular una factura, los productos vuelven inmediatamente al stock de inventario.'
      ]
    },
    'clientes': {
      clave: 'clientes',
      titulo: 'Gestion de Clientes y CRM',
      subtitulo: 'Directorio de compradores, cuentas corrientes y limites de credito.',
      proposito: 'Mantener la base de datos de compradores, registrar su identificacion fiscal, controlar limites de credito y dar seguimiento a saldos pendientes.',
      pasos: [
        'Pulsa "Nuevo Cliente" para registrar a un comprador.',
        'Completa su razon social o nombre, tipo de documento (RUC/NIT o Cedula) y numero fiscal.',
        'Define el limite de credito si deseas autorizarle compras a plazo.',
        'Usa la barra de busqueda para filtrar clientes por nombre o documento.'
      ],
      campos: [
        { nombre: 'Razon Social / Nombre', descripcion: 'Nombre legal o comercial de la persona o entidad compradora.' },
        { nombre: 'Tipo y Numero Documento', descripcion: 'Identificador tributario para validez en la factura.' },
        { nombre: 'Limite de Credito', descripcion: 'Monto maximo de deuda que el sistema permitira acumular en compras no pagadas.' },
        { nombre: 'Saldo Actual', descripcion: 'Deuda viva acumulada por facturas pendientes de pago.' }
      ],
      consejos: [
        'Si un cliente tiene saldo pendiente mayor a cero, el sistema impedira eliminarlo hasta que sus facturas sean saldadas o anuladas.'
      ]
    },
    'productos': {
      clave: 'productos',
      titulo: 'Catalogo de Productos e Inventario',
      subtitulo: 'Control de existencias, precios de venta, costos y alertas de stock.',
      proposito: 'Administrar el portafolio de productos y servicios que comercializa la empresa, supervisar las existencias y definir precios de venta con impuestos.',
      pasos: [
        'Pulsa "Nuevo Producto" para agregar un articulo al catalogo.',
        'Ingresa un codigo SKU unico para identificar el producto.',
        'Especifica el precio de venta al publico y la tasa de IVA aplicable.',
        'Define el stock actual y el stock minimo para recibir alertas preventivas.'
      ],
      campos: [
        { nombre: 'SKU (Stock Keeping Unit)', descripcion: 'Codigo alfanumerico unico del producto en tu inventario.' },
        { nombre: 'Precio de venta', descripcion: 'Importe unitario base antes de impuestos.' },
        { nombre: 'Tasa de IVA', descripcion: 'Porcentaje impositivo aplicable segun la legislacion comercial vigente.' },
        { nombre: 'Stock Minimo', descripcion: 'Nivel critico de existencias para alertar sobre necesidad de compra.' }
      ],
      consejos: [
        'Los productos con ventas historicas no se eliminan fisicamente para no danar el historico contable; en su lugar, se desactivan del catalogo.'
      ]
    },
    'compras': {
      clave: 'compras',
      titulo: 'Compras y Proveedores',
      subtitulo: 'Entrada de mercancias, control de costos y cuentas por pagar.',
      proposito: 'Registrar las adquisiciones realizadas a distribuidores y proveedores, incrementando el stock de almacen y registrando los costos.',
      pasos: [
        'Pulsa "Registrar Compra" para ingresar mercancia al almacen.',
        'Selecciona el proveedor y los productos recibidos con su costo unitario.',
        'Al guardar la compra, el inventario se incrementara automaticamente.'
      ],
      campos: [
        { nombre: 'Proveedor', descripcion: 'Empresa o distribuidor que suministra la mercancia.' },
        { nombre: 'Numero de factura de compra', descripcion: 'Referencia del comprobante recibido del proveedor.' },
        { nombre: 'Costo unitario', descripcion: 'Precio al que se compro el articulo para calcular margen de ganancia.' }
      ],
      consejos: [
        'Mantener actualizados los costos de compra permite calcular con precision la rentabilidad bruta de tu negocio.'
      ]
    },
    'caja-bancos': {
      clave: 'caja-bancos',
      titulo: 'Caja y Movimientos de Efectivo',
      subtitulo: 'Arqueo de caja, entradas, salidas y recibos de pago.',
      proposito: 'Monitorear la liquidez inmediata del negocio, registrar cobros de facturas y controlar egresos menores de operacion diaria.',
      pasos: [
        'Consulta el saldo disponible en caja en tiempo real.',
        'Registra ingresos por ventas de contado o abonos de clientes.',
        'Registra egresos de caja con motivo justificado (gastos de oficina, envios, etc.).'
      ],
      campos: [
        { nombre: 'Saldo en caja', descripcion: 'Efectivo neto disponible tras ingresos y egresos registrados.' },
        { nombre: 'Recibo de caja', descripcion: 'Comprobante numerado con codigo idempotente unico para evitar registros duplicados.' }
      ],
      consejos: [
        'Realiza el cuadre o arqueo al cierre de cada jornada comercial para garantizar que el dinero fisico coincida con el sistema.'
      ]
    },
    'informes': {
      clave: 'informes',
      titulo: 'Informes y Metricas Comerciales',
      subtitulo: 'Reportes de ventas, cartera vencida, productos mas vendidos y rentabilidad.',
      proposito: 'Analizar el desempeno del negocio a traves de graficas y tablas resumen basadas en transacciones 100% reales de tu empresa.',
      pasos: [
        'Selecciona el periodo que deseas analizar (mes actual, trimestre o ano).',
        'Consulta el reporte de ventas por cliente o productos con mayor rotacion.',
        'Exporta los datos para su envio al area contable o gerencia.'
      ],
      campos: [
        { nombre: 'Ventas brutas vs netas', descripcion: 'Ingresos antes y despues de descuentos e impuestos.' },
        { nombre: 'Indice de cobrabilidad', descripcion: 'Porcentaje de facturas cobradas frente al total emitido.' }
      ],
      consejos: [
        'Los informes respetan estrictamente el aislamiento de tu organizacion; jamas se mezclaran datos de otras empresas.'
      ]
    },
    'configuracion': {
      clave: 'configuracion',
      titulo: 'Configuracion de la Empresa y Parametros',
      subtitulo: 'Personalizacion legal, regional, fiscal y de marca de tu tienda.',
      proposito: 'Actualizar la razon social, nombre comercial, RUC/NIT, direccion, telefonos, moneda, zona horaria y correlativos de facturacion.',
      pasos: [
        'Edita los datos de la empresa en la pestana "Empresa e Identidad".',
        'Configura el prefijo y siguiente numero de factura en "Impuestos y Numeraciones".',
        'Haz clic en "Guardar Cambios" para que los nuevos datos se apliquen de inmediato en todas las facturas y comprobantes.'
      ],
      campos: [
        { nombre: 'Nombre Comercial', descripcion: 'Marca publica visible en la cabecera del sistema y facturas.' },
        { nombre: 'Identificacion Fiscal', descripcion: 'RUC / NIT oficial para validez legal de los comprobantes.' },
        { nombre: 'Siguiente Consecutivo', descripcion: 'Numero correlativo con el que se emitira la proxima factura.' }
      ],
      consejos: [
        'Si cambias de moneda o de razon social, las facturas historicas conservaran los datos con los que fueron emitidas para preservar la validez contable.'
      ]
    },
    'auditoria': {
      clave: 'auditoria',
      titulo: 'Auditoria y Trazabilidad de Seguridad',
      subtitulo: 'Registro inmutable de actividades, cambios y accesos al sistema.',
      proposito: 'Ofrecer transparencia sobre que usuario realizo cada operacion (emision de factura, actualizacion de precios, registro de abonos o eliminaciones).',
      pasos: [
        'Revisa el listado cronologico de eventos auditados.',
        'Filtra por severidad (INFO, WARN, DANGER) para revisar posibles anomalias.',
        'Verifica la direccion IP y la fecha exacta de cada transaccion.'
      ],
      campos: [
        { nombre: 'Modulo y Accion', descripcion: 'Area del sistema y operacion realizada (ejemplo: FACTURAS - EMITIR_FACTURA).' },
        { nombre: 'Registro Afectado', descripcion: 'Identificador del comprobante, producto o cliente modificado.' }
      ],
      consejos: [
        'Los registros de auditoria no pueden ser editados ni eliminados por ningun usuario para garantizar la integridad forense.'
      ]
    }
  };

  mostrarAyuda(clave: string) {
    const ayuda = this.catalogoAyuda[clave] || {
      clave,
      titulo: 'Ayuda del Sistema FacturaPro 360',
      subtitulo: 'Informacion operativa para comerciantes y administradores.',
      proposito: 'Facilitar la gestion diaria de tu negocio de forma clara, segura y sencilla.',
      pasos: [
        'Usa el menu lateral para navegar a los modulos principales.',
        'Completa los campos obligatorios marcados con asterisco (*).',
        'Si tienes dudas, pulsa el boton "?" en cualquier pantalla para ver la guia especifica.'
      ],
      campos: [],
      consejos: ['Todos los datos de tu empresa estan aislados y protegidos por contraseña cifrada.']
    };

    this.ayudaActiva.set(ayuda);
    this.modalAbierto.set(true);
  }

  cerrarAyuda() {
    this.modalAbierto.set(false);
  }
}
