export type EstadoFactura = 'Borrador' | 'Emitida' | 'Parcial' | 'Pagada' | 'Anulada';
export type MetodoPago = 'Efectivo' | 'TarjetaCredito' | 'TarjetaDebito' | 'Transferencia' | 'Cheque' | 'Otro';
export type TipoDocumentoCliente = 'RUC/NIT' | 'Cedula' | 'Pasaporte' | 'ConsumidorFinal';

export type RolUsuario = 'SuperAdmin' | 'Propietario' | 'Administrador' | 'Empleado' | 'Consulta';
export type TipoDocumentoResponsable = 'CedulaCiudadania' | 'CedulaExtranjeria' | 'NIT' | 'Pasaporte';

export interface Empresa {
  id: string;
  razon_social: string;
  nombre_comercial?: string;
  slug?: string;
  tipo_negocio?: string;
  descripcion?: string;
  identificacion_fiscal: string;
  direccion?: string;
  departamento_estado?: string;
  ciudad?: string;
  pais?: string;
  barrio_zona?: string;
  codigo_postal?: string;
  telefono?: string;
  telefono_secundario?: string;
  correo?: string;
  sitio_web?: string;
  nombre_contacto?: string;
  moneda: string;
  simbolo_moneda: string;
  zona_horaria?: string;
  idioma?: string;
  formato_fecha?: string;
  formato_numero?: string;
  logo_url?: string;
  activo?: boolean;
  created_at?: string;
}

export interface MembresiaEmpresa {
  id: string;
  usuario_id: string;
  empresa_id: string;
  empresa_nombre: string;
  rol: RolUsuario;
  activo: boolean;
  fecha_incorporacion: string;
}

export interface RegistroEmpresaWizardData {
  // 1. Responsable de la cuenta
  nombres: string;
  apellidos: string;
  tipo_documento_responsable: TipoDocumentoResponsable;
  numero_documento_responsable: string;
  email: string;
  telefono_responsable: string;
  username: string;
  password: string;
  confirm_password: string;
  acepta_terminos: boolean;
  acepta_privacidad: boolean;

  // 2. Información comercial y ubicación de la tienda
  nombre_comercial: string;
  razon_social: string;
  tipo_negocio: string;
  descripcion_negocio: string;
  identificacion_fiscal: string;
  pais: string;
  departamento_estado: string;
  ciudad: string;
  direccion: string;
  barrio_zona?: string;
  codigo_postal?: string;
  telefono_tienda: string;
  telefono_secundario?: string;
  correo_comercial: string;
  sitio_web?: string;

  // 3. Configuración comercial y operativa
  moneda: string;
  simbolo_moneda: string;
  zona_horaria: string;
  idioma: string;
  formato_fecha: string;
  formato_numero: string;
}

export interface Cliente {
  id: string;
  empresa_id: string;
  tipo_documento: TipoDocumentoCliente;
  numero_documento: string;
  razon_social: string;
  nombre_contacto?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  saldo_actual: number;
  limite_credito: number;
  activo: boolean;
}

export interface Producto {
  id: string;
  empresa_id: string;
  sku: string;
  codigo_barras?: string;
  nombre: string;
  descripcion?: string;
  tipo: 'Producto' | 'Servicio';
  unidad_medida: string;
  precio_venta: number;
  costo_promedio: number;
  stock_actual: number;
  stock_minimo: number;
  permite_stock_negativo: boolean;
  iva_porcentaje: number;
  activo: boolean;
}

export interface FacturaItem {
  id?: string;
  factura_id?: string;
  producto_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  iva_porcentaje: number;
  subtotal: number;
  impuesto: number;
  total: number;
}

export interface Factura {
  id: string;
  empresa_id: string;
  empresa_nombre?: string;
  sucursal_id: string;
  usuario_id: string;
  cliente_id: string;
  cliente?: Cliente;
  numero_factura: string;
  prefijo: string;
  consecutivo: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  subtotal: number;
  descuento_total: number;
  impuesto_total: number;
  total: number;
  saldo_pendiente: number;
  estado: EstadoFactura;
  notas?: string;
  motivo_anulacion?: string;
  items?: FacturaItem[];
}

export interface Pago {
  id: string;
  empresa_id: string;
  factura_id: string;
  numero_recibo: string;
  fecha_pago: string;
  monto: number;
  metodo_pago: MetodoPago;
  referencia_transaccion?: string;
  notas?: string;
  idempotency_key: string;
}

export interface DashboardKpis {
  ventasMes: number;
  cobradoMes: number;
  totalPorCobrar: number;
  facturasEmitidasMes: number;
  facturasVencidas: number;
  productosStockBajo: number;
}

export interface EventoAuditoria {
  id: string;
  fecha: string;
  usuario: string;
  modulo: string;
  accion: string;
  registro_afectado: string;
  ip_origen: string;
  detalles?: string;
  severidad: 'INFO' | 'WARN' | 'DANGER';
}

