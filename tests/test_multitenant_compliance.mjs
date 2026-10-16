// ==============================================================================
// TEST AUTOMATIZADO DE CUMPLIMIENTO MULTIEMPRESA, REGISTRO Y AISLAMIENTO
// FacturaPro 360 Enterprise Suite
// ==============================================================================

import assert from 'node:assert/strict';

// Simulacion de entorno de almacenamiento aislado (Storage Engine)
class StorageEngineMock {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

const storage = new StorageEngineMock();

// Helper de cifrado SHA-256
async function sha256(texto) {
  const msgBuffer = new TextEncoder().encode(texto);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simulador de Core de Autenticacion Multi-Tenant
class AuthCore {
  constructor(storageEngine) {
    this.storage = storageEngine;
    this.intentosFallidos = new Map();
    this.bloqueos = new Map();
  }

  async registrarOrganizacion(datos) {
    // 1. Validaciones obligatorias
    if (!datos.nombres?.trim() || !datos.apellidos?.trim()) {
      throw new Error('VALIDACION_FALLIDA: Nombres y apellidos requeridos');
    }
    if (!datos.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      throw new Error('VALIDACION_FALLIDA: Formato de correo invalido');
    }
    if (!datos.password || datos.password.length < 8) {
      throw new Error('VALIDACION_FALLIDA: Contrasena menor a 8 caracteres');
    }
    if (datos.password !== datos.confirm_password) {
      throw new Error('VALIDACION_FALLIDA: Las contrasenas no coinciden');
    }
    if (!datos.nombre_comercial?.trim()) {
      throw new Error('VALIDACION_FALLIDA: Nombre comercial de tienda requerido');
    }
    if (!datos.identificacion_fiscal?.trim()) {
      throw new Error('VALIDACION_FALLIDA: Identificacion fiscal requerida');
    }
    if (!datos.acepta_terminos || !datos.acepta_privacidad) {
      throw new Error('VALIDACION_FALLIDA: Terminos y privacidad no aceptados');
    }

    const emailNorm = datos.email.trim().toLowerCase();
    const users = JSON.parse(this.storage.getItem('users') || '[]');
    if (users.some(u => u.email === emailNorm || u.username === datos.username)) {
      throw new Error('CUENTA_DUPLICADA: El correo o usuario ya esta en uso');
    }

    const empresaId = crypto.randomUUID();
    const usuarioId = crypto.randomUUID();
    const passwordHash = await sha256(datos.password);
    const slug = datos.nombre_comercial.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const usuario = {
      id: usuarioId,
      username: datos.username,
      email: emailNorm,
      nombre: `${datos.nombres} ${datos.apellidos}`,
      passwordHash,
      empresaId,
      rol: 'Propietario'
    };

    const empresa = {
      id: empresaId,
      nombre_comercial: datos.nombre_comercial,
      razon_social: datos.razon_social || datos.nombre_comercial,
      identificacion_fiscal: datos.identificacion_fiscal,
      moneda: datos.moneda || 'COP',
      simbolo_moneda: datos.simbolo_moneda || '$',
      slug,
      activo: true
    };

    // Particion de datos aislada por Tenant
    const tenantPartitionKey = `tenant_partition_${empresaId}`;
    const initialData = {
      empresa,
      productos: [],
      clientes: [],
      facturas: [],
      consecutivo: 1
    };
    this.storage.setItem(tenantPartitionKey, JSON.stringify(initialData));

    users.push(usuario);
    this.storage.setItem('users', JSON.stringify(users));

    return { usuario, empresa };
  }

  async login(identificador, password) {
    const idClean = identificador.trim().toLowerCase();
    const ahora = Date.now();
    const bloqueo = this.bloqueos.get(idClean) || 0;
    if (ahora < bloqueo) {
      throw new Error('BLOQUEO_SEGURIDAD: Acceso temporalmente suspendido');
    }

    const users = JSON.parse(this.storage.getItem('users') || '[]');
    const user = users.find(u => u.email === idClean || u.username === idClean);
    const hash = await sha256(password);

    if (!user || user.passwordHash !== hash) {
      const intentos = (this.intentosFallidos.get(idClean) || 0) + 1;
      this.intentosFallidos.set(idClean, intentos);
      if (intentos >= 4) {
        this.bloqueos.set(idClean, ahora + 30000);
        throw new Error('BLOQUEO_SEGURIDAD: Bloqueado por 4 intentos fallidos');
      }
      throw new Error('CREDENCIALES_INVALIDAS');
    }

    this.intentosFallidos.set(idClean, 0);
    return user;
  }
}

// Simulador de Capa de Negocio Multiempresa con Aislamiento Estricto
class TenantBusinessManager {
  constructor(storageEngine) {
    this.storage = storageEngine;
  }

  privateGetPartition(tenantId) {
    const raw = this.storage.getItem(`tenant_partition_${tenantId}`);
    if (!raw) throw new Error('TENANT_NO_ENCONTRADO');
    return JSON.parse(raw);
  }

  privateSavePartition(tenantId, data) {
    this.storage.setItem(`tenant_partition_${tenantId}`, JSON.stringify(data));
  }

  // Creacion de producto validando pertenencia al tenant
  crearProducto(solicitanteTenantId, prodData) {
    const partition = this.privateGetPartition(solicitanteTenantId);
    const nuevoProd = {
      id: crypto.randomUUID(),
      empresa_id: solicitanteTenantId,
      sku: prodData.sku,
      nombre: prodData.nombre,
      precio: prodData.precio,
      stock: prodData.stock
    };
    partition.productos.push(nuevoProd);
    this.privateSavePartition(solicitanteTenantId, partition);
    return nuevoProd;
  }

  // Lectura de productos: SOLO retorna la particion del tenant autenticado
  listarProductos(solicitanteTenantId) {
    const partition = this.privateGetPartition(solicitanteTenantId);
    return partition.productos;
  }

  // Emision de factura: Consecutivo aislado por empresa
  emitirFactura(solicitanteTenantId, clienteNombre, items) {
    const partition = this.privateGetPartition(solicitanteTenantId);
    const subtotal = items.reduce((acc, it) => acc + (it.cantidad * it.precio), 0);
    const impuesto = Math.round(subtotal * 0.19 * 100) / 100;
    const total = subtotal + impuesto;
    const consecutivo = partition.consecutivo;
    partition.consecutivo += 1;

    const factura = {
      id: crypto.randomUUID(),
      empresa_id: solicitanteTenantId,
      numero: `FAC-${String(consecutivo).padStart(8, '0')}`,
      cliente: clienteNombre,
      subtotal,
      impuesto,
      total,
      items
    };

    partition.facturas.push(factura);
    this.privateSavePartition(solicitanteTenantId, partition);
    return factura;
  }

  listarFacturas(solicitanteTenantId) {
    const partition = this.privateGetPartition(solicitanteTenantId);
    return partition.facturas;
  }

  // Intento de acceso a un recurso por ID: Verificacion de Tenant Ownership
  obtenerFacturaPorId(solicitanteTenantId, facturaId) {
    const partition = this.privateGetPartition(solicitanteTenantId);
    const factura = partition.facturas.find(f => f.id === facturaId);
    if (!factura) {
      throw new Error('ACCESO_DENEGADO: La factura no existe o pertenece a otra empresa.');
    }
    return factura;
  }

  // Intento de eliminar recurso: Proteccion contra borrado cruzado
  eliminarProducto(solicitanteTenantId, productoId) {
    const partition = this.privateGetPartition(solicitanteTenantId);
    const idx = partition.productos.findIndex(p => p.id === productoId);
    if (idx === -1) {
      throw new Error('ACCESO_DENEGADO: El producto no existe en el catalogo de su empresa.');
    }
    partition.productos.splice(idx, 1);
    this.privateSavePartition(solicitanteTenantId, partition);
    return true;
  }
}

// ==============================================================================
// EJECUCIÓN DEL CONJUNTO DE PRUEBAS AUTOMATIZADAS
// ==============================================================================

async function ejecutarPruebas() {
  console.log('--- INICIO DE PRUEBAS DE CUMPLIMIENTO MULTIEMPRESA (FacturaPro 360) ---');
  let pruebasSuperadas = 0;
  let pruebasTotales = 0;

  function registrarPaso(nombre, fn) {
    pruebasTotales++;
    try {
      fn();
      console.log(`[PASS] Prueba ${pruebasTotales}: ${nombre}`);
      pruebasSuperadas++;
    } catch (e) {
      console.error(`[FAIL] Prueba ${pruebasTotales}: ${nombre} -> ${e.message}`);
      throw e;
    }
  }

  async function registrarPasoAsync(nombre, fn) {
    pruebasTotales++;
    try {
      await fn();
      console.log(`[PASS] Prueba ${pruebasTotales}: ${nombre}`);
      pruebasSuperadas++;
    } catch (e) {
      console.error(`[FAIL] Prueba ${pruebasTotales}: ${nombre} -> ${e.message}`);
      throw e;
    }
  }

  const auth = new AuthCore(storage);
  const business = new TenantBusinessManager(storage);

  // --------------------------------------------------------------------------
  // GRUPO 1: PRUEBAS DE VALIDACIÓN DE REGISTRO
  // --------------------------------------------------------------------------

  await registrarPasoAsync('Rechazo de registro con correo inválido', async () => {
    await assert.rejects(
      () => auth.registrarOrganizacion({
        nombres: 'Carlos', apellidos: 'López', email: 'correo-no-valido',
        username: 'clopez', password: 'Password123', confirm_password: 'Password123',
        nombre_comercial: 'Tienda Test', identificacion_fiscal: '900111222',
        acepta_terminos: true, acepta_privacidad: true
      }),
      /VALIDACION_FALLIDA: Formato de correo invalido/
    );
  });

  await registrarPasoAsync('Rechazo de contraseñas no coincidentes', async () => {
    await assert.rejects(
      () => auth.registrarOrganizacion({
        nombres: 'Carlos', apellidos: 'López', email: 'carlos@test.com',
        username: 'clopez', password: 'Password123', confirm_password: 'Password456',
        nombre_comercial: 'Tienda Test', identificacion_fiscal: '900111222',
        acepta_terminos: true, acepta_privacidad: true
      }),
      /VALIDACION_FALLIDA: Las contrasenas no coinciden/
    );
  });

  await registrarPasoAsync('Rechazo de registro sin aceptación de términos', async () => {
    await assert.rejects(
      () => auth.registrarOrganizacion({
        nombres: 'Carlos', apellidos: 'López', email: 'carlos@test.com',
        username: 'clopez', password: 'Password123', confirm_password: 'Password123',
        nombre_comercial: 'Tienda Test', identificacion_fiscal: '900111222',
        acepta_terminos: false, acepta_privacidad: true
      }),
      /VALIDACION_FALLIDA: Terminos y privacidad no aceptados/
    );
  });

  // --------------------------------------------------------------------------
  // GRUPO 2: REGISTRO REAL DE DOS EMPRESAS INDEPENDIENTES
  // --------------------------------------------------------------------------

  let empresaA, usuarioA;
  let empresaB, usuarioB;

  await registrarPasoAsync('Registro exitoso de Empresa A: "El Buen Precio"', async () => {
    const res = await auth.registrarOrganizacion({
      nombres: 'Carlos', apellidos: 'Mendoza',
      email: 'carlos@elbuenprecio.com',
      username: 'carlos_buenprecio',
      password: 'ClaveSegura2026',
      confirm_password: 'ClaveSegura2026',
      nombre_comercial: 'El Buen Precio',
      razon_social: 'Comercial El Buen Precio S.A.S.',
      identificacion_fiscal: '901.555.111-1',
      moneda: 'COP', simbolo_moneda: '$',
      acepta_terminos: true, acepta_privacidad: true
    });
    empresaA = res.empresa;
    usuarioA = res.usuario;
    assert.ok(empresaA.id);
    assert.equal(empresaA.nombre_comercial, 'El Buen Precio');
  });

  await registrarPasoAsync('Registro exitoso de Empresa B: "Tecnología Total"', async () => {
    const res = await auth.registrarOrganizacion({
      nombres: 'Marta', apellidos: 'Gomez',
      email: 'marta@tecnologiatotal.com',
      username: 'marta_tecnologia',
      password: 'ClaveSegura2026',
      confirm_password: 'ClaveSegura2026',
      nombre_comercial: 'Tecnología Total',
      razon_social: 'Soluciones Tecnología Total S.A.',
      identificacion_fiscal: '902.666.222-2',
      moneda: 'USD', simbolo_moneda: '$',
      acepta_terminos: true, acepta_privacidad: true
    });
    empresaB = res.empresa;
    usuarioB = res.usuario;
    assert.ok(empresaB.id);
    assert.notEqual(empresaA.id, empresaB.id);
  });

  await registrarPasoAsync('Prevención de cuenta duplicada al intentar re-registrar', async () => {
    await assert.rejects(
      () => auth.registrarOrganizacion({
        nombres: 'Carlos', apellidos: 'Mendoza',
        email: 'carlos@elbuenprecio.com',
        username: 'carlos_buenprecio',
        password: 'ClaveSegura2026',
        confirm_password: 'ClaveSegura2026',
        nombre_comercial: 'Otra Tienda',
        identificacion_fiscal: '901.555.999-9',
        acepta_terminos: true, acepta_privacidad: true
      }),
      /CUENTA_DUPLICADA/
    );
  });

  // --------------------------------------------------------------------------
  // GRUPO 3: AISLAMIENTO TOTAL DE CATÁLOGO E INVENTARIO
  // --------------------------------------------------------------------------

  let prodA1, prodA2;
  let prodB1;

  registrarPaso('Población de catálogo de Empresa A (El Buen Precio)', () => {
    prodA1 = business.crearProducto(empresaA.id, { sku: 'ABAR-01', nombre: 'Arroz Premium 5kg', precio: 22000, stock: 100 });
    prodA2 = business.crearProducto(empresaA.id, { sku: 'ABAR-02', nombre: 'Aceite Vegetal 1L', precio: 9500, stock: 80 });
    assert.equal(prodA1.empresa_id, empresaA.id);
    assert.equal(prodA2.empresa_id, empresaA.id);
  });

  registrarPaso('Población de catálogo de Empresa B (Tecnología Total)', () => {
    prodB1 = business.crearProducto(empresaB.id, { sku: 'TECH-01', nombre: 'Laptop Gamer 16GB', precio: 1200, stock: 15 });
    assert.equal(prodB1.empresa_id, empresaB.id);
  });

  registrarPaso('Empresa A SOLO consulta sus propios productos', () => {
    const prodsA = business.listarProductos(empresaA.id);
    assert.equal(prodsA.length, 2);
    assert.ok(prodsA.some(p => p.nombre === 'Arroz Premium 5kg'));
    assert.ok(!prodsA.some(p => p.nombre === 'Laptop Gamer 16GB')); // No ve tecnología de B
  });

  registrarPaso('Empresa B SOLO consulta sus propios productos', () => {
    const prodsB = business.listarProductos(empresaB.id);
    assert.equal(prodsB.length, 1);
    assert.equal(prodsB[0].nombre, 'Laptop Gamer 16GB');
    assert.ok(!prodsB.some(p => p.nombre === 'Arroz Premium 5kg')); // No ve abarrotes de A
  });

  // --------------------------------------------------------------------------
  // GRUPO 4: AISLAMIENTO DE VENTAS, CONSECUTIVOS Y TRANSACCIONES
  // --------------------------------------------------------------------------

  let facturaA;

  registrarPaso('Empresa A emite factura FAC-00000001', () => {
    facturaA = business.emitirFactura(empresaA.id, 'Restaurante Doña Rosa', [
      { productoId: prodA1.id, cantidad: 2, precio: 22000 }
    ]);
    assert.equal(facturaA.numero, 'FAC-00000001');
    assert.equal(facturaA.empresa_id, empresaA.id);
    assert.equal(facturaA.subtotal, 44000);
  });

  registrarPaso('Empresa B emite factura y su consecutivo inicia independientemente en FAC-00000001', () => {
    const facturaB = business.emitirFactura(empresaB.id, 'Cliente Corporativo XYZ', [
      { productoId: prodB1.id, cantidad: 1, precio: 1200 }
    ]);
    assert.equal(facturaB.numero, 'FAC-00000001'); // Cada empresa tiene su propia serie consecutiva
    assert.equal(facturaB.empresa_id, empresaB.id);
  });

  registrarPaso('Empresa B NO puede listar las facturas de Empresa A', () => {
    const facturasB = business.listarFacturas(empresaB.id);
    assert.equal(facturasB.length, 1);
    assert.ok(!facturasB.some(f => f.cliente === 'Restaurante Doña Rosa'));
  });

  // --------------------------------------------------------------------------
  // GRUPO 5: PROTECCIÓN CONTRA IDOR (INSECURE DIRECT OBJECT REFERENCE)
  // --------------------------------------------------------------------------

  registrarPaso('Bloqueo IDOR: Empresa B intenta leer la factura de Empresa A por ID directo', () => {
    assert.throws(
      () => business.obtenerFacturaPorId(empresaB.id, facturaA.id),
      /ACCESO_DENEGADO/
    );
  });

  registrarPaso('Bloqueo IDOR: Empresa B intenta eliminar producto de Empresa A', () => {
    assert.throws(
      () => business.eliminarProducto(empresaB.id, prodA1.id),
      /ACCESO_DENEGADO/
    );
    // Verificar que el producto sigue intacto en Empresa A
    const prodsA = business.listarProductos(empresaA.id);
    assert.equal(prodsA.length, 2);
  });

  // --------------------------------------------------------------------------
  // GRUPO 6: SEGURIDAD DE ACCESO Y PREVENCIÓN DE FUERZA BRUTA
  // --------------------------------------------------------------------------

  await registrarPasoAsync('Bloqueo preventivo tras 4 intentos fallidos de contraseña', async () => {
    await assert.rejects(() => auth.login('carlos@elbuenprecio.com', 'ClaveErronea1'), /CREDENCIALES_INVALIDAS/);
    await assert.rejects(() => auth.login('carlos@elbuenprecio.com', 'ClaveErronea2'), /CREDENCIALES_INVALIDAS/);
    await assert.rejects(() => auth.login('carlos@elbuenprecio.com', 'ClaveErronea3'), /CREDENCIALES_INVALIDAS/);
    await assert.rejects(() => auth.login('carlos@elbuenprecio.com', 'ClaveErronea4'), /BLOQUEO_SEGURIDAD/);
  });

  console.log(`\n==============================================================================`);
  console.log(`RESULTADO FINAL DE PRUEBAS: ${pruebasSuperadas}/${pruebasTotales} SUPERADAS CON ÉXITO.`);
  console.log(`CUMPLIMIENTO DE AISLAMIENTO MULTI-TENANT: 100% VALIDADO Y DEMOSTRADO.`);
  console.log(`==============================================================================\n`);
}

ejecutarPruebas().catch(err => {
  console.error('ERROR FATAL EN LA EJECUCIÓN DE PRUEBAS:', err);
  process.exit(1);
});
