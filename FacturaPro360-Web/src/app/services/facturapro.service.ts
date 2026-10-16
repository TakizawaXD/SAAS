import { Injectable, signal, effect } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Cliente, DashboardKpis, Empresa, EventoAuditoria, Factura, FacturaItem, Pago, Producto } from '../models/facturapro.models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FacturaProService {
  private supabase: SupabaseClient | null = null;
  private isSupabaseConfigured = false;

  empresa = signal<Empresa>({
    id: environment.demoEmpresaId,
    razon_social: 'Empresa Demo S.A.',
    nombre_comercial: 'FacturaPro Cloud',
    identificacion_fiscal: '901234567-8',
    direccion: 'Av. Central 100, Piso 5',
    telefono: '+57 300 1234567',
    correo: 'contacto@facturapro360.com',
    moneda: 'USD',
    simbolo_moneda: '$'
  });

  clientes = signal<Cliente[]>([]);
  productos = signal<Producto[]>([]);
  facturas = signal<Factura[]>([]);
  pagos = signal<Pago[]>([]);
  eventosAuditoria = signal<EventoAuditoria[]>([]);
  consecutivoFactura = signal<number>(1);
  private emisionEnProgresoLock = false;

  sanitizarTexto(texto?: string, campo?: string): string {
    if (!texto) return '';
    const esAtaque = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|onload\s*=|onerror\s*=|javascript:|eval\s*\(|<iframe|<object|<embed/gi.test(texto);
    if (esAtaque) {
      this.registrarEventoAuditoria(
        'SEGURIDAD',
        'XSS_INJECTION_DEFLECTED',
        `Campo: ${campo || 'Desconocido'}`,
        'DANGER',
        `Payload malicioso neutralizado en el texto de entrada: "${texto.slice(0, 60)}..."`
      );
    }
    return texto
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  getEmpresaActualId(): string {
    return this.auth.currentUser()?.empresaId || environment.demoEmpresaId;
  }

  getEmpresaActualNombre(): string {
    return this.auth.currentUser()?.empresaNombre || 'Empresa Demo S.A.';
  }

  getStorageKey(): string {
    return 'facturapro_tenant_' + this.getEmpresaActualId();
  }

  constructor(private auth: AuthService) {
    this.initSupabase();
    
    // Reactividad multitenant: cuando el usuario inicia sesión, se registra o cambia de empresa,
    // se conmuta automáticamente el espacio de trabajo aislando 100% los datos.
    effect(() => {
      const usuarioActivo = this.auth.currentUser();
      this.cargarDatosDesdeBd();
    });
  }

  private initSupabase() {
    if (environment.supabaseUrl && !environment.supabaseUrl.includes('tu-proyecto')) {
      try {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
        this.isSupabaseConfigured = true;
      } catch (err) {
        console.warn('Conexión remota de Supabase:', err);
      }
    }
  }

  // CARGAR DATOS AISLADOS EXCLUSIVAMENTE PARA LA EMPRESA ACTUAL
  async cargarDatosDesdeBd() {
    const empId = this.getEmpresaActualId();
    const empNombre = this.getEmpresaActualNombre();

    this.empresa.update(e => ({
      ...e,
      id: empId,
      razon_social: empNombre,
      nombre_comercial: empNombre
    }));

    // 1. Si Supabase está conectado en vivo, consultar EXCLUSIVAMENTE los registros de ESTA empresa:
    if (this.isSupabaseConfigured && this.supabase) {
      try {
        const { data: clis } = await this.supabase.from('clientes').select('*').eq('empresa_id', empId);
        if (clis) this.clientes.set(clis);

        const { data: prods } = await this.supabase.from('productos').select('*').eq('empresa_id', empId);
        if (prods) this.productos.set(prods);

        const { data: facts } = await this.supabase.from('facturas').select('*, items:factura_items(*), cliente:clientes(*)').eq('empresa_id', empId);
        if (facts) this.facturas.set(facts);

        const { data: pgs } = await this.supabase.from('pagos').select('*').eq('empresa_id', empId);
        if (pgs) this.pagos.set(pgs);

        return;
      } catch (e) {
        console.warn('Error leyendo desde Supabase en vivo, usando almacenamiento aislado por tenant:', e);
      }
    }

    // 2. Almacenamiento local persistente por tenant
    const storageKey = this.getStorageKey();
    const localDb = localStorage.getItem(storageKey);
    if (localDb) {
      try {
        const data = JSON.parse(localDb);
        if (data.empresa) this.empresa.set(data.empresa);
        this.clientes.set(data.clientes || []);
        this.productos.set(data.productos || []);
        this.facturas.set(data.facturas || []);
        this.pagos.set(data.pagos || []);
        this.eventosAuditoria.set(data.eventosAuditoria || []);
        this.consecutivoFactura.set(data.consecutivoFactura || 1);
        return;
      } catch {
        // Fallback
      }
    }

    // Si es la empresa Demo, inicializar con los datos de ejemplo:
    if (empId === environment.demoEmpresaId) {
      this.cargarDatosSeedDemo();
    } else {
      // Si es un cliente o empresa nueva, inicia con partición 100% limpia sin ver nada de otros negocios:
      this.empresa.set({
        id: empId,
        razon_social: empNombre,
        nombre_comercial: empNombre,
        identificacion_fiscal: 'Pendiente de registrar',
        direccion: '',
        telefono: '',
        correo: this.auth.currentUser()?.email || '',
        moneda: 'USD',
        simbolo_moneda: '$'
      });
      this.clientes.set([]);
      this.productos.set([]);
      this.facturas.set([]);
      this.pagos.set([]);
      this.consecutivoFactura.set(1);
      this.eventosAuditoria.set([
        {
          id: crypto.randomUUID(),
          fecha: new Date().toISOString(),
          modulo: 'EMPRESA',
          accion: 'ORGANIZACION_CREADA',
          usuario: this.auth.currentUser()?.username || 'admin',
          ip_origen: '127.0.0.1',
          severidad: 'INFO',
          registro_afectado: `Empresa ID: ${empId}`,
          detalles: `Organización "${empNombre}" aprovisionada con partición de base de datos aislada.`
        }
      ]);
      this.guardarEnAlmacenamiento();
    }
  }

  private cargarDatosSeedDemo() {

    // Datos iniciales de producción
    const clientesIniciales: Cliente[] = [
      {
        id: 'c1111111-1111-1111-1111-111111111111',
        empresa_id: environment.demoEmpresaId,
        tipo_documento: 'RUC/NIT',
        numero_documento: '3-101-567834',
        razon_social: 'Comercial López S.R.L.',
        nombre_contacto: 'Carlos López',
        email: 'ventas@lopez.cr',
        telefono: '+506 2233-3333',
        direccion: 'San José, Costa Rica',
        saldo_actual: 0.00,
        limite_credito: 5000.00,
        activo: true
      },
      {
        id: 'c2222222-2222-2222-2222-222222222222',
        empresa_id: environment.demoEmpresaId,
        tipo_documento: 'Cedula',
        numero_documento: '1-1234-5678',
        razon_social: 'María Fernández',
        nombre_contacto: 'María Fernández',
        email: 'maria@correo.com',
        telefono: '+506 8888-7777',
        saldo_actual: 0.00,
        limite_credito: 1200.00,
        activo: true
      },
      {
        id: 'c3333333-3333-3333-3333-333333333333',
        empresa_id: environment.demoEmpresaId,
        tipo_documento: 'RUC/NIT',
        numero_documento: '3-102-345678',
        razon_social: 'Distribuidora del Valle',
        email: 'ventas@valle.cr',
        telefono: '+506 2233-4455',
        saldo_actual: 450.00,
        limite_credito: 3000.00,
        activo: true
      }
    ];

    const productosIniciales: Producto[] = [
      {
        id: 'p1111111-1111-1111-1111-111111111111',
        empresa_id: environment.demoEmpresaId,
        sku: 'LP-15-001',
        codigo_barras: '7891234567890',
        nombre: 'Laptop Pro 15"',
        descripcion: 'Intel Core i7 13va gen, SSD 512GB',
        tipo: 'Producto',
        unidad_medida: 'UND',
        precio_venta: 600.00,
        costo_promedio: 420.00,
        stock_actual: 3,
        stock_minimo: 10,
        permite_stock_negativo: false,
        iva_porcentaje: 13.00,
        activo: true
      },
      {
        id: 'p2222222-2222-2222-2222-222222222222',
        empresa_id: environment.demoEmpresaId,
        sku: 'MOU-001',
        codigo_barras: '7891234567891',
        nombre: 'Mouse inalámbrico',
        descripcion: 'Mouse óptico ergonómico',
        tipo: 'Producto',
        unidad_medida: 'UND',
        precio_venta: 25.00,
        costo_promedio: 12.00,
        stock_actual: 25,
        stock_minimo: 20,
        permite_stock_negativo: false,
        iva_porcentaje: 13.00,
        activo: true
      },
      {
        id: 'p3333333-3333-3333-3333-333333333333',
        empresa_id: environment.demoEmpresaId,
        sku: 'TEC-001',
        codigo_barras: '7891234567892',
        nombre: 'Teclado mecánico',
        tipo: 'Producto',
        unidad_medida: 'UND',
        precio_venta: 45.00,
        costo_promedio: 22.00,
        stock_actual: 7,
        stock_minimo: 15,
        permite_stock_negativo: false,
        iva_porcentaje: 13.00,
        activo: true
      },
      {
        id: 'p4444444-4444-4444-4444-444444444444',
        empresa_id: environment.demoEmpresaId,
        sku: 'MON-024',
        codigo_barras: '7891234567893',
        nombre: 'Monitor 24"',
        tipo: 'Producto',
        unidad_medida: 'UND',
        precio_venta: 180.00,
        costo_promedio: 110.00,
        stock_actual: 15,
        stock_minimo: 10,
        permite_stock_negativo: false,
        iva_porcentaje: 13.00,
        activo: true
      }
    ];

    const facturaInicial: Factura = {
      id: 'f-demo-001',
      empresa_id: environment.demoEmpresaId,
      sucursal_id: environment.demoSucursalId,
      usuario_id: 'usr-admin-001',
      cliente_id: clientesIniciales[0].id,
      cliente: clientesIniciales[0],
      numero_factura: 'F-000123',
      prefijo: 'FAC',
      consecutivo: 123,
      fecha_emision: '2025-10-16T10:00:00Z',
      fecha_vencimiento: '2025-10-16',
      subtotal: 650.00,
      descuento_total: 0.00,
      impuesto_total: 10.50,
      total: 660.50,
      saldo_pendiente: 0.00,
      estado: 'Pagada',
      notas: 'Gracias por su preferencia.',
      items: [
        { producto_id: productosIniciales[0].id, descripcion: 'Laptop Pro 15"', cantidad: 1, precio_unitario: 600.00, descuento_porcentaje: 0, iva_porcentaje: 0, subtotal: 600.00, impuesto: 0, total: 600.00 },
        { producto_id: productosIniciales[1].id, descripcion: 'Mouse inalámbrico', cantidad: 2, precio_unitario: 25.00, descuento_porcentaje: 0, iva_porcentaje: 0, subtotal: 50.00, impuesto: 10.50, total: 60.50 }
      ]
    };

    const pagoInicial: Pago = {
      id: 'pago-demo-001',
      empresa_id: environment.demoEmpresaId,
      factura_id: facturaInicial.id,
      numero_recibo: 'REC-20251016-01',
      fecha_pago: '2025-10-16T14:20:00Z',
      monto: 660.50,
      metodo_pago: 'Efectivo',
      notas: 'Pago total en ventanilla',
      idempotency_key: 'idemp-001'
    };

    this.clientes.set(clientesIniciales);
    this.productos.set(productosIniciales);
    this.facturas.set([facturaInicial]);
    this.pagos.set([pagoInicial]);
    this.consecutivoFactura.set(124);

    this.guardarEnAlmacenamiento();
  }

  private guardarEnAlmacenamiento() {
    const data = {
      empresa: this.empresa(),
      clientes: this.clientes(),
      productos: this.productos(),
      facturas: this.facturas(),
      pagos: this.pagos(),
      consecutivoFactura: this.consecutivoFactura(),
      eventosAuditoria: this.eventosAuditoria()
    };
    localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
  }

  getKpis(): DashboardKpis {
    const facts = this.facturas().filter(f => f.estado !== 'Anulada');
    const ventasMes = facts.reduce((acc, f) => acc + f.total, 0);
    const totalPorCobrar = facts.reduce((acc, f) => acc + f.saldo_pendiente, 0);
    const cobradoMes = this.pagos().reduce((acc, p) => acc + p.monto, 0);
    const facturasEmitidasMes = facts.length;
    const facturasVencidas = facts.filter(f => f.saldo_pendiente > 0 && new Date(f.fecha_vencimiento) < new Date()).length;
    const productosStockBajo = this.productos().filter(p => p.activo && p.stock_actual <= p.stock_minimo).length;

    return {
      ventasMes,
      cobradoMes,
      totalPorCobrar,
      facturasEmitidasMes,
      facturasVencidas,
      productosStockBajo
    };
  }

  async emitirFactura(data: {
    cliente_id: string;
    fecha_vencimiento: string;
    notas?: string;
    items: {
      producto_id: string;
      cantidad: number;
      precio_unitario: number;
      descuento_porcentaje: number;
      iva_porcentaje: number;
    }[];
  }): Promise<Factura> {
    // 1. Barrera contra Ataques de Condición de Carrera (Doble Clic / Envío Masivo Concurrente)
    if (this.emisionEnProgresoLock) {
      this.registrarEventoAuditoria(
        'SEGURIDAD',
        'RACE_CONDITION_BLOCKED',
        'Emisión concurrente simultánea',
        'WARN',
        'Intento de emisión simultánea o múltiple clic interceptado por el cerrojo de concurrencia.'
      );
      throw new Error('Operación bloqueada por seguridad: Ya existe una transacción de emisión de factura en curso.');
    }

    this.emisionEnProgresoLock = true;

    try {
      // 2. Validación de Items no vacíos
      if (!data.items || data.items.length === 0) {
        throw new Error('Validación de seguridad: La factura debe contener al menos un producto o servicio.');
      }

      // 3. Sanitización de textos contra XSS
      const notasSanitizadas = this.sanitizarTexto(data.notas, 'Factura.notas');

      if (this.isSupabaseConfigured && this.supabase) {
        try {
          const { data: res, error } = await this.supabase.rpc('rpc_emitir_factura', {
            p_sucursal_id: environment.demoSucursalId,
            p_cliente_id: data.cliente_id,
            p_fecha_vencimiento: data.fecha_vencimiento,
            p_items: data.items,
            p_notas: notasSanitizadas || null
          });
          if (error) throw new Error(error.message);
        } catch (err: any) {
          console.warn('Ejecutando fallback transaccional:', err);
        }
      }

      const cliente = this.clientes().find(c => c.id === data.cliente_id);
      if (!cliente) throw new Error('Cliente no encontrado en la base de datos');

      const consecutivo = this.consecutivoFactura();
      this.consecutivoFactura.set(consecutivo + 1);
      const numeroFactura = `F-${String(consecutivo).padStart(6, '0')}`;

      let subtotal = 0;
      let descuentoTotal = 0;
      let impuestoTotal = 0;
      let total = 0;

      const itemsProcesados: FacturaItem[] = [];
      const prods = [...this.productos()];

      for (const item of data.items) {
        // Validación matemática estricta contra valores absurdos o negativos
        if (isNaN(item.cantidad) || item.cantidad <= 0) {
          throw new Error(`Validación financiera: La cantidad debe ser un número positivo mayor a 0. Se rechazó el valor ${item.cantidad}.`);
        }
        if (isNaN(item.precio_unitario) || item.precio_unitario < 0) {
          throw new Error(`Validación financiera: El precio unitario no puede ser negativo.`);
        }
        if (isNaN(item.descuento_porcentaje) || item.descuento_porcentaje < 0 || item.descuento_porcentaje > 100) {
          throw new Error(`Validación financiera: El descuento debe estar entre 0% y 100%. Se rechazó ${item.descuento_porcentaje}%.`);
        }
        if (isNaN(item.iva_porcentaje) || item.iva_porcentaje < 0) {
          throw new Error(`Validación fiscal: El IVA no puede ser negativo.`);
        }

        const pIdx = prods.findIndex(p => p.id === item.producto_id);
        if (pIdx === -1) throw new Error(`Producto ${item.producto_id} no encontrado`);
        const prod = prods[pIdx];

        if (!prod.permite_stock_negativo && prod.stock_actual - item.cantidad < 0) {
          throw new Error(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock_actual}, Solicitado: ${item.cantidad}`);
        }

        const itemSub = Math.round(item.cantidad * item.precio_unitario * 100) / 100;
        const itemDesc = Math.round(itemSub * (item.descuento_porcentaje / 100) * 100) / 100;
        const itemBase = itemSub - itemDesc;
        const itemImp = Math.round(itemBase * (item.iva_porcentaje / 100) * 100) / 100;
        const itemTot = itemBase + itemImp;

        subtotal += itemSub;
        descuentoTotal += itemDesc;
        impuestoTotal += itemImp;
        total += itemTot;

        prods[pIdx] = {
          ...prod,
          stock_actual: prod.stock_actual - item.cantidad
        };

        itemsProcesados.push({
          id: crypto.randomUUID(),
          producto_id: prod.id,
          descripcion: prod.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento_porcentaje: item.descuento_porcentaje,
          iva_porcentaje: item.iva_porcentaje,
          subtotal: itemSub,
          impuesto: itemImp,
          total: itemTot
        });
      }

      total = Math.round(total * 100) / 100;

      // 4. Bloqueo de Límite de Crédito del Cliente
      if (cliente.limite_credito > 0 && (cliente.saldo_actual + total) > cliente.limite_credito) {
        this.registrarEventoAuditoria(
          'FINANZAS',
          'CREDIT_LIMIT_BREACH_BLOCKED',
          `${cliente.razon_social}`,
          'DANGER',
          `Intento de facturar $${total.toFixed(2)} sobrepasando el límite de crédito ($${cliente.limite_credito.toFixed(2)}). Saldo actual: $${cliente.saldo_actual.toFixed(2)}.`
        );
        throw new Error(`Riesgo financiero bloqueado: La factura por $${total.toFixed(2)} supera el límite de crédito autorizado del cliente ($${cliente.limite_credito.toFixed(2)}). Saldo actual: $${cliente.saldo_actual.toFixed(2)}.`);
      }

      this.productos.set(prods);

      const nuevaFactura: Factura = {
        id: crypto.randomUUID(),
        empresa_id: this.getEmpresaActualId(),
        empresa_nombre: this.getEmpresaActualNombre(),
        sucursal_id: environment.demoSucursalId,
        usuario_id: this.auth.currentUser()?.id || 'usr-admin-001',
        cliente_id: cliente.id,
        cliente: cliente,
        numero_factura: numeroFactura,
        prefijo: 'FAC',
        consecutivo: consecutivo,
        fecha_emision: new Date().toISOString(),
        fecha_vencimiento: data.fecha_vencimiento,
        subtotal: Math.round(subtotal * 100) / 100,
        descuento_total: Math.round(descuentoTotal * 100) / 100,
        impuesto_total: Math.round(impuestoTotal * 100) / 100,
        total: total,
        saldo_pendiente: total,
        estado: 'Emitida',
        notas: notasSanitizadas,
        items: itemsProcesados
      };

      this.clientes.update(clis => clis.map(c => 
        c.id === cliente.id ? { ...c, saldo_actual: c.saldo_actual + total } : c
      ));

      this.facturas.update(list => [nuevaFactura, ...list]);
      this.registrarEventoAuditoria(
        'FACTURAS', 
        'EMITIR_FACTURA', 
        `${nuevaFactura.numero_factura} (Total: $${nuevaFactura.total.toFixed(2)})`, 
        'INFO', 
        `Cliente: ${cliente.razon_social}`
      );
      this.guardarEnAlmacenamiento();

      return nuevaFactura;
    } finally {
      this.emisionEnProgresoLock = false;
    }
  }

  async registrarPago(facturaId: string, monto: number, metodo: any, notas?: string): Promise<Pago> {
    const facts = [...this.facturas()];
    const fIdx = facts.findIndex(f => f.id === facturaId);
    if (fIdx === -1) throw new Error('Factura no encontrada');
    const factura = facts[fIdx];

    if (isNaN(monto) || monto <= 0) {
      throw new Error('Validación financiera: El monto del pago debe ser un valor positivo mayor a cero.');
    }
    if (factura.estado === 'Anulada') throw new Error('No se pueden registrar pagos a una factura anulada');
    if (monto > factura.saldo_pendiente) {
      this.registrarEventoAuditoria(
        'FINANZAS',
        'OVERPAYMENT_ATTEMPT_BLOCKED',
        `${factura.numero_factura}`,
        'WARN',
        `Intento de registrar un abono de $${monto.toFixed(2)} sobre un saldo de $${factura.saldo_pendiente.toFixed(2)}.`
      );
      throw new Error(`El pago ($${monto.toFixed(2)}) excede el saldo pendiente ($${factura.saldo_pendiente.toFixed(2)})`);
    }

    const nuevoSaldo = Math.max(0, Math.round((factura.saldo_pendiente - monto) * 100) / 100);
    const nuevoEstado = nuevoSaldo === 0 ? 'Pagada' : 'Parcial';

    facts[fIdx] = {
      ...factura,
      saldo_pendiente: nuevoSaldo,
      estado: nuevoEstado
    };
    this.facturas.set(facts);

    this.clientes.update(clis => clis.map(c => 
      c.id === factura.cliente_id ? { ...c, saldo_actual: Math.max(0, c.saldo_actual - monto) } : c
    ));

    const pago: Pago = {
      id: crypto.randomUUID(),
      empresa_id: this.getEmpresaActualId(),
      factura_id: facturaId,
      numero_recibo: `REC-${Date.now().toString().slice(-6)}`,
      fecha_pago: new Date().toISOString(),
      monto: monto,
      metodo_pago: metodo,
      notas: this.sanitizarTexto(notas, 'Pago.notas'),
      idempotency_key: crypto.randomUUID()
    };

    this.pagos.update(p => [pago, ...p]);
    this.registrarEventoAuditoria(
      'PAGOS', 
      'REGISTRAR_PAGO', 
      `${pago.numero_recibo} (Factura: ${factura.numero_factura})`, 
      'INFO', 
      `Monto: $${monto.toFixed(2)} (${metodo})`
    );
    this.guardarEnAlmacenamiento();
    return pago;
  }

  async anularFactura(facturaId: string, motivo: string): Promise<Factura> {
    const facts = [...this.facturas()];
    const fIdx = facts.findIndex(f => f.id === facturaId);
    if (fIdx === -1) throw new Error('Factura no encontrada');
    const factura = facts[fIdx];

    if (factura.estado === 'Anulada') throw new Error('La factura ya está anulada');

    const prods = [...this.productos()];
    if (factura.items) {
      for (const it of factura.items) {
        const pIdx = prods.findIndex(p => p.id === it.producto_id);
        if (pIdx !== -1) {
          prods[pIdx] = {
            ...prods[pIdx],
            stock_actual: prods[pIdx].stock_actual + it.cantidad
          };
        }
      }
      this.productos.set(prods);
    }

    this.clientes.update(clis => clis.map(c => 
      c.id === factura.cliente_id ? { ...c, saldo_actual: Math.max(0, c.saldo_actual - factura.saldo_pendiente) } : c
    ));

    facts[fIdx] = {
      ...factura,
      estado: 'Anulada',
      saldo_pendiente: 0,
      motivo_anulacion: motivo
    };
    this.facturas.set(facts);
    this.registrarEventoAuditoria('FACTURAS', 'ANULAR_FACTURA', `${factura.numero_factura}`, 'WARN', `Motivo: ${motivo}`);
    this.guardarEnAlmacenamiento();
    return facts[fIdx];
  }

  // AUDITORÍA
  inicializarEventosAuditoriaSeed() {
    const eventos: EventoAuditoria[] = [
      {
        id: crypto.randomUUID(),
        fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
        usuario: 'adminfactura',
        modulo: 'PAGOS',
        accion: 'REGISTRAR_PAGO',
        registro_afectado: 'REC-000012 (Factura F-000123)',
        ip_origen: '192.168.1.45',
        detalles: 'Monto: $660.50 mediante Transferencia bancaria',
        severidad: 'INFO'
      },
      {
        id: crypto.randomUUID(),
        fecha: new Date(Date.now() - 3600000 * 5).toISOString(),
        usuario: 'adminfactura',
        modulo: 'FACTURAS',
        accion: 'EMITIR_FACTURA',
        registro_afectado: 'F-000123 (Total: $660.50)',
        ip_origen: '192.168.1.45',
        detalles: 'Cliente: Comercial López S.R.L.',
        severidad: 'INFO'
      },
      {
        id: crypto.randomUUID(),
        fecha: new Date(Date.now() - 3600000 * 24).toISOString(),
        usuario: 'adminfactura',
        modulo: 'SEGURIDAD',
        accion: 'INICIO_SESION',
        registro_afectado: 'Sesión activa [adminfactura]',
        ip_origen: '192.168.1.45',
        detalles: 'Autenticación exitosa en FacturaPro 360 Cloud',
        severidad: 'INFO'
      }
    ];
    this.eventosAuditoria.set(eventos);
  }

  registrarEventoAuditoria(
    modulo: string, 
    accion: string, 
    registroAfectado: string, 
    severidad: 'INFO' | 'WARN' | 'DANGER' = 'INFO',
    detalles?: string
  ) {
    const nuevoEvento: EventoAuditoria = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      usuario: this.auth.currentUser()?.username || 'adminfactura',
      modulo,
      accion,
      registro_afectado: registroAfectado,
      ip_origen: '192.168.1.45',
      detalles,
      severidad
    };

    this.eventosAuditoria.update(list => [nuevoEvento, ...list]);
    this.guardarEnAlmacenamiento();

    if (this.isSupabaseConfigured && this.supabase) {
      this.supabase.from('auditoria_eventos').insert([{
        empresa_id: this.getEmpresaActualId(),
        modulo,
        accion,
        registro_afectado: registroAfectado,
        severidad,
        detalles
      }]).then();
    }
  }

  // ==================== PRODUCTOS CRUD ====================
  agregarProducto(producto: Omit<Producto, 'id' | 'empresa_id'>): Producto {
    if (isNaN(producto.precio_venta) || producto.precio_venta < 0) {
      throw new Error('Validación financiera: El precio de venta no puede ser negativo.');
    }
    if (isNaN(producto.costo_promedio) || producto.costo_promedio < 0) {
      throw new Error('Validación financiera: El costo promedio no puede ser negativo.');
    }
    if (isNaN(producto.stock_actual) || producto.stock_actual < 0) {
      throw new Error('Validación de inventario: El stock inicial no puede ser negativo.');
    }

    const nuevo: Producto = {
      ...producto,
      id: crypto.randomUUID(),
      empresa_id: this.getEmpresaActualId(),
      sku: this.sanitizarTexto(producto.sku, 'Producto.sku'),
      nombre: this.sanitizarTexto(producto.nombre, 'Producto.nombre'),
      descripcion: this.sanitizarTexto(producto.descripcion, 'Producto.descripcion')
    };
    this.productos.update(list => [nuevo, ...list]);
    this.registrarEventoAuditoria(
      'PRODUCTOS', 
      'CREAR_PRODUCTO', 
      `${nuevo.nombre} (${nuevo.sku})`, 
      'INFO', 
      `Stock inicial: ${nuevo.stock_actual}, Precio: $${nuevo.precio_venta.toFixed(2)}`
    );
    this.guardarEnAlmacenamiento();
    return nuevo;
  }

  actualizarProducto(id: string, cambios: Partial<Producto>): Producto {
    const prods = [...this.productos()];
    const idx = prods.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Producto no encontrado');

    if (cambios.precio_venta !== undefined && (isNaN(cambios.precio_venta) || cambios.precio_venta < 0)) {
      throw new Error('Validación financiera: El precio de venta no puede ser negativo.');
    }
    if (cambios.costo_promedio !== undefined && (isNaN(cambios.costo_promedio) || cambios.costo_promedio < 0)) {
      throw new Error('Validación financiera: El costo no puede ser negativo.');
    }
    if (cambios.stock_actual !== undefined && (isNaN(cambios.stock_actual) || cambios.stock_actual < 0)) {
      throw new Error('Validación de inventario: El stock no puede ser negativo.');
    }

    const sanitizados: Partial<Producto> = { ...cambios };
    if (cambios.sku) sanitizados.sku = this.sanitizarTexto(cambios.sku, 'Producto.sku');
    if (cambios.nombre) sanitizados.nombre = this.sanitizarTexto(cambios.nombre, 'Producto.nombre');
    if (cambios.descripcion) sanitizados.descripcion = this.sanitizarTexto(cambios.descripcion, 'Producto.descripcion');

    const anterior = prods[idx];
    const actualizado = { ...anterior, ...sanitizados };
    prods[idx] = actualizado;
    this.productos.set(prods);

    this.registrarEventoAuditoria(
      'PRODUCTOS', 
      'ACTUALIZAR_PRODUCTO', 
      `${actualizado.nombre} (${actualizado.sku})`, 
      'WARN', 
      `Campos modificados: ${Object.keys(cambios).join(', ')}`
    );
    this.guardarEnAlmacenamiento();
    return actualizado;
  }

  eliminarProducto(id: string): boolean {
    const prods = this.productos();
    const prod = prods.find(p => p.id === id);
    if (!prod) return false;

    // Validación de seguridad contable:
    // Si el producto ya figura en alguna factura emitida, no debe borrarse físicamente para no corromper el historial
    const facturas = this.facturas();
    const enUso = facturas.some(f => f.items?.some(it => it.producto_id === id));
    if (enUso) {
      this.actualizarProducto(id, { activo: false });
      this.registrarEventoAuditoria(
        'PRODUCTOS', 
        'DESACTIVAR_PRODUCTO', 
        `${prod.nombre} (${prod.sku})`, 
        'WARN', 
        'El producto posee facturas históricas; se desactivó del catálogo para preservar integridad contable.'
      );
      return true;
    }

    this.productos.set(prods.filter(p => p.id !== id));
    this.registrarEventoAuditoria(
      'PRODUCTOS', 
      'ELIMINAR_PRODUCTO', 
      `${prod.nombre} (${prod.sku})`, 
      'DANGER', 
      'Eliminación física del inventario.'
    );
    this.guardarEnAlmacenamiento();
    return true;
  }

  // ==================== CLIENTES CRUD ====================
  agregarCliente(cliente: Omit<Cliente, 'id' | 'empresa_id' | 'saldo_actual' | 'activo'>): Cliente {
    if (isNaN(cliente.limite_credito) || cliente.limite_credito < 0) {
      throw new Error('Validación financiera: El límite de crédito no puede ser negativo.');
    }

    const nuevo: Cliente = {
      ...cliente,
      id: crypto.randomUUID(),
      empresa_id: this.getEmpresaActualId(),
      razon_social: this.sanitizarTexto(cliente.razon_social, 'Cliente.razon_social'),
      numero_documento: this.sanitizarTexto(cliente.numero_documento, 'Cliente.numero_documento'),
      nombre_contacto: this.sanitizarTexto(cliente.nombre_contacto, 'Cliente.nombre_contacto'),
      email: this.sanitizarTexto(cliente.email, 'Cliente.email'),
      telefono: this.sanitizarTexto(cliente.telefono, 'Cliente.telefono'),
      saldo_actual: 0,
      activo: true
    };
    this.clientes.update(list => [nuevo, ...list]);
    this.registrarEventoAuditoria(
      'CLIENTES', 
      'CREAR_CLIENTE', 
      `${nuevo.razon_social} (${nuevo.numero_documento})`, 
      'INFO', 
      `Límite de crédito: $${nuevo.limite_credito}`
    );
    this.guardarEnAlmacenamiento();
    return nuevo;
  }

  actualizarCliente(id: string, cambios: Partial<Cliente>): Cliente {
    const clis = [...this.clientes()];
    const idx = clis.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Cliente no encontrado');

    if (cambios.limite_credito !== undefined && (isNaN(cambios.limite_credito) || cambios.limite_credito < 0)) {
      throw new Error('Validación financiera: El límite de crédito no puede ser negativo.');
    }

    const sanitizados: Partial<Cliente> = { ...cambios };
    if (cambios.razon_social) sanitizados.razon_social = this.sanitizarTexto(cambios.razon_social, 'Cliente.razon_social');
    if (cambios.numero_documento) sanitizados.numero_documento = this.sanitizarTexto(cambios.numero_documento, 'Cliente.numero_documento');
    if (cambios.nombre_contacto) sanitizados.nombre_contacto = this.sanitizarTexto(cambios.nombre_contacto, 'Cliente.nombre_contacto');
    if (cambios.email) sanitizados.email = this.sanitizarTexto(cambios.email, 'Cliente.email');
    if (cambios.telefono) sanitizados.telefono = this.sanitizarTexto(cambios.telefono, 'Cliente.telefono');

    const actualizado = { ...clis[idx], ...sanitizados };
    clis[idx] = actualizado;
    this.clientes.set(clis);

    this.registrarEventoAuditoria(
      'CLIENTES', 
      'ACTUALIZAR_CLIENTE', 
      `${actualizado.razon_social}`, 
      'WARN', 
      `Campos modificados: ${Object.keys(cambios).join(', ')}`
    );
    this.guardarEnAlmacenamiento();
    return actualizado;
  }

  eliminarCliente(id: string): boolean {
    const clis = this.clientes();
    const cli = clis.find(c => c.id === id);
    if (!cli) return false;

    // Validación de seguridad financiera:
    if (cli.saldo_actual > 0) {
      throw new Error(`Acción bloqueada por seguridad: No se puede eliminar a "${cli.razon_social}" porque tiene una deuda pendiente de $${cli.saldo_actual.toFixed(2)}. Debe saldar sus facturas.`);
    }

    this.clientes.set(clis.filter(c => c.id !== id));
    this.registrarEventoAuditoria(
      'CLIENTES', 
      'ELIMINAR_CLIENTE', 
      `${cli.razon_social} (${cli.numero_documento})`, 
      'DANGER', 
      'Cliente eliminado del sistema.'
    );
    this.guardarEnAlmacenamiento();
    return true;
  }

  // ==================== FACTURAS CRUD ====================
  eliminarFactura(id: string): boolean {
    const facts = this.facturas();
    const fact = facts.find(f => f.id === id);
    if (!fact) return false;

    if (fact.estado !== 'Anulada') {
      this.anularFactura(id, 'Eliminación administrativa');
    }

    this.facturas.set(this.facturas().filter(f => f.id !== id));
    this.registrarEventoAuditoria(
      'FACTURAS', 
      'ELIMINAR_FACTURA', 
      `${fact.numero_factura} (Total: $${fact.total.toFixed(2)})`, 
      'DANGER', 
      'Factura eliminada de la base de datos contable.'
    );
    this.guardarEnAlmacenamiento();
    return true;
  }

  // ==================== CONFIGURACION EMPRESA ====================
  actualizarConfiguracionEmpresa(cambios: Partial<Empresa>, nuevoConsecutivo?: number): Empresa {
    const empActual = this.empresa();
    const sanitizados: Partial<Empresa> = { ...cambios };
    if (cambios.razon_social) sanitizados.razon_social = this.sanitizarTexto(cambios.razon_social, 'Empresa.razon_social');
    if (cambios.nombre_comercial) sanitizados.nombre_comercial = this.sanitizarTexto(cambios.nombre_comercial, 'Empresa.nombre_comercial');
    if (cambios.identificacion_fiscal) sanitizados.identificacion_fiscal = this.sanitizarTexto(cambios.identificacion_fiscal, 'Empresa.identificacion_fiscal');
    if (cambios.direccion) sanitizados.direccion = this.sanitizarTexto(cambios.direccion, 'Empresa.direccion');
    if (cambios.telefono) sanitizados.telefono = this.sanitizarTexto(cambios.telefono, 'Empresa.telefono');
    if (cambios.correo) sanitizados.correo = this.sanitizarTexto(cambios.correo, 'Empresa.correo');
    
    const actualizada: Empresa = {
      ...empActual,
      ...sanitizados
    };
    this.empresa.set(actualizada);
    if (nuevoConsecutivo && nuevoConsecutivo > 0) {
      this.consecutivoFactura.set(nuevoConsecutivo);
    }
    if (actualizada.nombre_comercial || actualizada.razon_social) {
      this.auth.actualizarNombreEmpresa(actualizada.nombre_comercial || actualizada.razon_social);
    }
    this.guardarEnAlmacenamiento();
    this.registrarEventoAuditoria(
      'CONFIGURACION',
      'ACTUALIZAR_EMPRESA',
      `${actualizada.razon_social}`,
      'INFO',
      'Configuracion de empresa y datos fiscales actualizada.'
    );
    return actualizada;
  }
}

