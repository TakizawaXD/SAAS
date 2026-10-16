-- ==============================================================================
-- FACTURAPRO 360 - SCRIPT DE INSTALACIÓN MAESTRO PARA SUPABASE (POSTGRESQL)
-- Proyecto: https://evipleoghbvpozajnxof.supabase.co
-- Instrucciones: Copia todo este archivo y pégalo directamente en el
--                "SQL Editor" de tu panel de Supabase y haz clic en "RUN".
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONES DEL SISTEMA
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TABLAS DEL SISTEMA (ESQUEMA RELACIONAL MULTITENANT)
-- ------------------------------------------------------------------------------

-- 2.1 EMPRESAS (Tenant raiz)
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    slug VARCHAR(100) UNIQUE,
    tipo_negocio VARCHAR(100) DEFAULT 'Comercio General',
    descripcion TEXT,
    identificacion_fiscal VARCHAR(50) NOT NULL UNIQUE,
    pais VARCHAR(100) NOT NULL DEFAULT 'Colombia',
    departamento_estado VARCHAR(100),
    ciudad VARCHAR(100),
    direccion TEXT,
    barrio_zona VARCHAR(100),
    codigo_postal VARCHAR(20),
    telefono VARCHAR(50),
    telefono_secundario VARCHAR(50),
    correo VARCHAR(150),
    sitio_web VARCHAR(200),
    nombre_contacto VARCHAR(150),
    moneda VARCHAR(10) NOT NULL DEFAULT 'COP',
    simbolo_moneda VARCHAR(5) NOT NULL DEFAULT '$',
    zona_horaria VARCHAR(50) NOT NULL DEFAULT 'America/Bogota',
    idioma VARCHAR(20) NOT NULL DEFAULT 'es-CO',
    formato_fecha VARCHAR(30) NOT NULL DEFAULT 'DD/MM/YYYY',
    formato_numero VARCHAR(30) NOT NULL DEFAULT '1.234,56',
    logo_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 SUCURSALES
CREATE TABLE IF NOT EXISTS public.sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(50),
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_sucursal_codigo_empresa UNIQUE (empresa_id, codigo)
);

-- 2.3 PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    nombre_completo VARCHAR(150) NOT NULL,
    tipo_documento VARCHAR(30) DEFAULT 'CedulaCiudadania',
    numero_documento VARCHAR(50),
    email VARCHAR(150) NOT NULL UNIQUE,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    telefono VARCHAR(50),
    rol VARCHAR(50) NOT NULL DEFAULT 'Propietario' CHECK (rol IN ('SuperAdmin', 'Propietario', 'Administrador', 'Empleado', 'Consulta')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3.1 MEMBRESÍAS N:M (Permite que un usuario pertenezca a más de una empresa)
CREATE TABLE IF NOT EXISTS public.empresa_usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    rol VARCHAR(50) NOT NULL DEFAULT 'Propietario' CHECK (rol IN ('SuperAdmin', 'Propietario', 'Administrador', 'Empleado', 'Consulta')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_incorporacion TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_usuario_empresa_membresia UNIQUE (empresa_id, usuario_id)
);

-- 2.3.2 PLANES Y LICENCIAS MULTI-TENANT (SaaS)
CREATE TABLE IF NOT EXISTS public.planes_suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio_mensual NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    limite_usuarios INTEGER NOT NULL DEFAULT 5,
    limite_facturas_mes INTEGER NOT NULL DEFAULT 500,
    permite_multi_sucursal BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.licencias_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.planes_suscripciones(id) ON DELETE RESTRICT,
    estado VARCHAR(30) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Prueba', 'Vencida', 'Suspendida', 'Cancelada')),
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    fecha_vencimiento TIMESTAMPTZ,
    renovacion_automatica BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_licencia_activa_empresa UNIQUE (empresa_id)
);

-- 2.4 CLIENTES Y CRM
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(20) NOT NULL DEFAULT 'RUC/NIT' CHECK (tipo_documento IN ('RUC/NIT', 'Cedula', 'Pasaporte', 'ConsumidorFinal')),
    numero_documento VARCHAR(50) NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    nombre_contacto VARCHAR(150),
    email VARCHAR(150),
    telefono VARCHAR(50),
    direccion TEXT,
    limite_credito NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (limite_credito >= 0),
    saldo_actual NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_cliente_documento_empresa UNIQUE (empresa_id, numero_documento)
);

-- 2.5 CATEGORÍAS
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_categoria_nombre_empresa UNIQUE (empresa_id, nombre)
);

-- 2.6 PRODUCTOS E INVENTARIO
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    sku VARCHAR(60) NOT NULL,
    codigo_barras VARCHAR(80),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL DEFAULT 'Producto' CHECK (tipo IN ('Producto', 'Servicio')),
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'UND',
    precio_venta NUMERIC(14,2) NOT NULL CHECK (precio_venta >= 0),
    costo_promedio NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (costo_promedio >= 0),
    stock_actual NUMERIC(14,3) NOT NULL DEFAULT 0.000,
    stock_minimo NUMERIC(14,3) NOT NULL DEFAULT 5.000,
    permite_stock_negativo BOOLEAN NOT NULL DEFAULT FALSE,
    iva_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 16.00 CHECK (iva_porcentaje >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_producto_sku_empresa UNIQUE (empresa_id, sku)
);

-- 2.7 KARDEX Y MOVIMIENTOS DE INVENTARIO
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('ENTRADA_COMPRA', 'SALIDA_VENTA', 'ANULACION_VENTA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO')),
    cantidad NUMERIC(14,3) NOT NULL,
    costo_unitario NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    referencia_documento VARCHAR(100),
    observaciones TEXT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL
);

-- 2.8 NUMERACIONES Y FOLIOS CONCURRENTES
CREATE TABLE IF NOT EXISTS public.numeraciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(30) NOT NULL CHECK (tipo_documento IN ('FACTURA', 'RECIBO_PAGO', 'COTIZACION', 'ORDEN_COMPRA')),
    prefijo VARCHAR(10) NOT NULL DEFAULT 'FAC',
    siguiente_numero INTEGER NOT NULL DEFAULT 1 CHECK (siguiente_numero > 0),
    longitud_numero INTEGER NOT NULL DEFAULT 8 CHECK (longitud_numero >= 4),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_numeracion_tipo_sucursal UNIQUE (empresa_id, sucursal_id, tipo_documento)
);

-- 2.9 FACTURAS FISCALES
CREATE TABLE IF NOT EXISTS public.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    sucursal_id UUID NOT NULL REFERENCES public.sucursales(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    numero_factura VARCHAR(50) NOT NULL,
    prefijo VARCHAR(10) NOT NULL DEFAULT 'FAC',
    consecutivo INTEGER NOT NULL,
    fecha_emision TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    fecha_vencimiento DATE NOT NULL,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    descuento_total NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (descuento_total >= 0),
    impuesto_total NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (impuesto_total >= 0),
    total NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    saldo_pendiente NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (saldo_pendiente >= 0),
    estado VARCHAR(30) NOT NULL DEFAULT 'Emitida' CHECK (estado IN ('Borrador', 'Emitida', 'Parcial', 'Pagada', 'Anulada')),
    notas TEXT,
    motivo_anulacion TEXT,
    fecha_anulacion TIMESTAMPTZ,
    anulado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_factura_numero_empresa UNIQUE (empresa_id, numero_factura)
);

-- 2.10 DETALLES DE FACTURA
CREATE TABLE IF NOT EXISTS public.factura_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    descripcion VARCHAR(250) NOT NULL,
    cantidad NUMERIC(14,3) NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(14,2) NOT NULL CHECK (precio_unitario >= 0),
    descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (descuento_porcentaje BETWEEN 0 AND 100),
    iva_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 16.00 CHECK (iva_porcentaje >= 0),
    subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
    impuesto NUMERIC(14,2) NOT NULL CHECK (impuesto >= 0),
    total NUMERIC(14,2) NOT NULL CHECK (total >= 0)
);

-- 2.11 PAGOS Y RECIBOS DE CAJA
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE RESTRICT,
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    numero_recibo VARCHAR(50) NOT NULL,
    fecha_pago TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    monto NUMERIC(14,2) NOT NULL CHECK (monto > 0),
    metodo_pago VARCHAR(30) NOT NULL CHECK (metodo_pago IN ('Efectivo', 'TarjetaCredito', 'TarjetaDebito', 'Transferencia', 'Cheque', 'Otro')),
    referencia_transaccion VARCHAR(100),
    notas TEXT,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.12 AUDITORÍA DE SEGURIDAD
CREATE TABLE IF NOT EXISTS public.auditorias (
    id BIGSERIAL PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    registro_id VARCHAR(100),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address VARCHAR(50),
    fecha TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. ÍNDICES DE ALTO RENDIMIENTO
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_facturas_empresa_fecha ON public.facturas (empresa_id, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON public.facturas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON public.facturas (empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON public.productos (empresa_id, sku);
CREATE INDEX IF NOT EXISTS idx_kardex_producto ON public.movimientos_inventario (producto_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_pagos_factura ON public.pagos (factura_id);

-- ------------------------------------------------------------------------------
-- 4. SEGURIDAD Y POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------

-- Función auxiliar de resolución de tenant con fallback seguro a empresa demo
CREATE OR REPLACE FUNCTION public.get_auth_empresa_id()
RETURNS UUID AS $$
    SELECT COALESCE(
        (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid() AND activo = TRUE LIMIT 1),
        '11111111-1111-1111-1111-111111111111'::uuid
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.numeraciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factura_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas y de tenant para el API de Supabase (Anon + Authenticated)
DO $$
BEGIN
    -- Empresas
    DROP POLICY IF EXISTS "Acceso tenant empresas" ON public.empresas;
    CREATE POLICY "Acceso tenant empresas" ON public.empresas FOR ALL USING (id = public.get_auth_empresa_id());

    -- Sucursales
    DROP POLICY IF EXISTS "Acceso tenant sucursales" ON public.sucursales;
    CREATE POLICY "Acceso tenant sucursales" ON public.sucursales FOR ALL USING (empresa_id = public.get_auth_empresa_id());

    -- Usuarios
    DROP POLICY IF EXISTS "Acceso tenant usuarios" ON public.usuarios;
    CREATE POLICY "Acceso tenant usuarios" ON public.usuarios FOR ALL USING (empresa_id = public.get_auth_empresa_id());

    -- Clientes
    DROP POLICY IF EXISTS "Acceso tenant clientes" ON public.clientes;
    CREATE POLICY "Acceso tenant clientes" ON public.clientes FOR ALL USING (empresa_id = public.get_auth_empresa_id());

    -- Categorias
    DROP POLICY IF EXISTS "Acceso tenant categorias" ON public.categorias;
    CREATE POLICY "Acceso tenant categorias" ON public.categorias FOR ALL USING (empresa_id = public.get_auth_empresa_id());

    -- Productos
    DROP POLICY IF EXISTS "Acceso tenant productos" ON public.productos;
    CREATE POLICY "Acceso tenant productos" ON public.productos FOR ALL USING (empresa_id = public.get_auth_empresa_id());

    -- Movimientos Inventario
    DROP POLICY IF EXISTS "Acceso tenant kardex" ON public.movimientos_inventario;
    CREATE POLICY "Acceso tenant kardex" ON public.movimientos_inventario FOR ALL USING (empresa_id = public.get_auth_empresa_id());

    -- Numeraciones
    DROP POLICY IF EXISTS "Acceso tenant numeraciones" ON public.numeraciones;
    CREATE POLICY "Acceso tenant numeraciones" ON public.numeraciones FOR ALL USING (empresa_id = public.get_auth_empresa_id());

    -- Facturas
    DROP POLICY IF EXISTS "Acceso tenant facturas" ON public.facturas;
    CREATE POLICY "Acceso tenant facturas" ON public.facturas FOR ALL USING (empresa_id = public.get_auth_empresa_id());

    -- Factura Items
    DROP POLICY IF EXISTS "Acceso tenant factura_items" ON public.factura_items;
    CREATE POLICY "Acceso tenant factura_items" ON public.factura_items FOR ALL USING (
        EXISTS (SELECT 1 FROM public.facturas f WHERE f.id = factura_items.factura_id AND f.empresa_id = public.get_auth_empresa_id())
    );

    -- Pagos
    DROP POLICY IF EXISTS "Acceso tenant pagos" ON public.pagos;
    CREATE POLICY "Acceso tenant pagos" ON public.pagos FOR ALL USING (empresa_id = public.get_auth_empresa_id());

    -- Auditorias
    DROP POLICY IF EXISTS "Acceso tenant auditorias" ON public.auditorias;
    CREATE POLICY "Acceso tenant auditorias" ON public.auditorias FOR ALL USING (empresa_id = public.get_auth_empresa_id());
END $$;

-- ------------------------------------------------------------------------------
-- 5. FUNCIONES TRANSACCIONALES RPC (ACID EN POSTGRESQL)
-- ------------------------------------------------------------------------------

-- 5.1 EMISIÓN DE FACTURA ATÓMICA CON DESCUENTO DE STOCK
CREATE OR REPLACE FUNCTION public.rpc_emitir_factura(
    p_sucursal_id UUID,
    p_cliente_id UUID,
    p_fecha_vencimiento DATE,
    p_items JSONB,
    p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_usuario_id UUID := auth.uid();
    v_prefijo VARCHAR(10);
    v_siguiente_num INT;
    v_longitud INT;
    v_numero_factura VARCHAR(50);
    v_factura_id UUID;
    
    v_subtotal NUMERIC(14,2) := 0.00;
    v_descuento_total NUMERIC(14,2) := 0.00;
    v_impuesto_total NUMERIC(14,2) := 0.00;
    v_total NUMERIC(14,2) := 0.00;
    
    v_item JSONB;
    v_item_producto_id UUID;
    v_item_cantidad NUMERIC(14,3);
    v_item_precio NUMERIC(14,2);
    v_item_desc_pct NUMERIC(5,2);
    v_item_iva_pct NUMERIC(5,2);
    v_item_subtotal NUMERIC(14,2);
    v_item_desc_monto NUMERIC(14,2);
    v_item_base NUMERIC(14,2);
    v_item_impuesto NUMERIC(14,2);
    v_item_total NUMERIC(14,2);
    v_item_desc_nombre VARCHAR(250);
    
    v_stock_actual NUMERIC(14,3);
    v_permite_negativo BOOLEAN;
    v_producto_nombre VARCHAR(200);

    v_saldo_cliente NUMERIC(14,2);
    v_limite_credito NUMERIC(14,2);
BEGIN
    -- Identificar empresa (con fallback para demo o API anon)
    SELECT empresa_id INTO v_empresa_id 
    FROM public.usuarios 
    WHERE id = v_usuario_id AND activo = TRUE;
    
    IF v_empresa_id IS NULL THEN
        v_empresa_id := '11111111-1111-1111-1111-111111111111'::uuid;
        SELECT id INTO v_usuario_id FROM public.usuarios WHERE empresa_id = v_empresa_id LIMIT 1;
    END IF;

    -- Validar ítems
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'La factura debe contener al menos un ítem';
    END IF;

    -- Bloqueo consultivo de numeración consecutiva
    SELECT prefijo, siguiente_numero, longitud_numero
    INTO v_prefijo, v_siguiente_num, v_longitud
    FROM public.numeraciones
    WHERE empresa_id = v_empresa_id 
      AND sucursal_id = p_sucursal_id 
      AND tipo_documento = 'FACTURA' 
      AND activo = TRUE
    FOR UPDATE;
    
    IF v_siguiente_num IS NULL THEN
        v_prefijo := 'FAC';
        v_siguiente_num := 1;
        v_longitud := 8;
        INSERT INTO public.numeraciones (empresa_id, sucursal_id, tipo_documento, prefijo, siguiente_numero, longitud_numero)
        VALUES (v_empresa_id, p_sucursal_id, 'FACTURA', v_prefijo, 2, v_longitud)
        ON CONFLICT (empresa_id, sucursal_id, tipo_documento) 
        DO UPDATE SET siguiente_numero = public.numeraciones.siguiente_numero + 1;
    ELSE
        UPDATE public.numeraciones
        SET siguiente_numero = v_siguiente_num + 1,
            updated_at = timezone('utc'::text, now())
        WHERE empresa_id = v_empresa_id 
          AND sucursal_id = p_sucursal_id 
          AND tipo_documento = 'FACTURA';
    END IF;

    v_numero_factura := v_prefijo || '-' || LPAD(v_siguiente_num::TEXT, v_longitud, '0');

    -- Crear cabecera de factura
    v_factura_id := gen_random_uuid();
    INSERT INTO public.facturas (
        id, empresa_id, sucursal_id, usuario_id, cliente_id,
        numero_factura, prefijo, consecutivo, fecha_emision, fecha_vencimiento,
        subtotal, descuento_total, impuesto_total, total, saldo_pendiente, estado, notas
    ) VALUES (
        v_factura_id, v_empresa_id, p_sucursal_id, v_usuario_id, p_cliente_id,
        v_numero_factura, v_prefijo, v_siguiente_num, timezone('utc'::text, now()), p_fecha_vencimiento,
        0, 0, 0, 0, 0, 'Emitida', p_notas
    );

    -- Procesar cada línea de producto
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_producto_id := (v_item->>'producto_id')::UUID;
        v_item_cantidad    := (v_item->>'cantidad')::NUMERIC;
        v_item_precio      := (v_item->>'precio_unitario')::NUMERIC;
        v_item_desc_pct    := COALESCE((v_item->>'descuento_porcentaje')::NUMERIC, 0.00);
        v_item_iva_pct     := COALESCE((v_item->>'iva_porcentaje')::NUMERIC, 16.00);

        IF v_item_cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad del ítem debe ser mayor a 0';
        END IF;

        IF v_item_precio < 0 THEN
            RAISE EXCEPTION 'El precio unitario no puede ser negativo';
        END IF;

        IF v_item_desc_pct < 0 OR v_item_desc_pct > 100 THEN
            RAISE EXCEPTION 'El descuento debe estar entre 0%% y 100%%';
        END IF;

        -- Bloquear producto para validar y descontar stock
        SELECT stock_actual, permite_stock_negativo, nombre
        INTO v_stock_actual, v_permite_negativo, v_producto_nombre
        FROM public.productos
        WHERE id = v_item_producto_id AND empresa_id = v_empresa_id
        FOR UPDATE;

        IF v_stock_actual IS NULL THEN
            RAISE EXCEPTION 'El producto ID % no existe en la empresa', v_item_producto_id;
        END IF;

        IF NOT v_permite_negativo AND (v_stock_actual - v_item_cantidad) < 0 THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto "%". Disponible: %, Solicitado: %', 
                v_producto_nombre, v_stock_actual, v_item_cantidad;
        END IF;

        -- Actualizar stock
        UPDATE public.productos
        SET stock_actual = stock_actual - v_item_cantidad,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_item_producto_id;

        -- Registrar movimiento Kardex
        INSERT INTO public.movimientos_inventario (
            empresa_id, producto_id, sucursal_id, tipo, cantidad, costo_unitario, referencia_documento, usuario_id
        ) VALUES (
            v_empresa_id, v_item_producto_id, p_sucursal_id, 'SALIDA_VENTA', -v_item_cantidad, v_item_precio, v_numero_factura, v_usuario_id
        );

        -- Cálculos decimales exactos
        v_item_subtotal   := ROUND(v_item_cantidad * v_item_precio, 2);
        v_item_desc_monto := ROUND(v_item_subtotal * (v_item_desc_pct / 100.0), 2);
        v_item_base       := v_item_subtotal - v_item_desc_monto;
        v_item_impuesto   := ROUND(v_item_base * (v_item_iva_pct / 100.0), 2);
        v_item_total      := v_item_base + v_item_impuesto;
        v_item_desc_nombre := COALESCE(v_item->>'descripcion', v_producto_nombre);

        -- Insertar detalle de factura
        INSERT INTO public.factura_items (
            factura_id, producto_id, descripcion, cantidad, precio_unitario,
            descuento_porcentaje, iva_porcentaje, subtotal, impuesto, total
        ) VALUES (
            v_factura_id, v_item_producto_id, v_item_desc_nombre, v_item_cantidad, v_item_precio,
            v_item_desc_pct, v_item_iva_pct, v_item_subtotal, v_item_impuesto, v_item_total
        );

        v_subtotal        := v_subtotal + v_item_subtotal;
        v_descuento_total := v_descuento_total + v_item_desc_monto;
        v_impuesto_total  := v_impuesto_total + v_item_impuesto;
        v_total           := v_total + v_item_total;
    END LOOP;

    -- Validar límite de crédito del cliente
    SELECT saldo_actual, limite_credito INTO v_saldo_cliente, v_limite_credito
    FROM public.clientes
    WHERE id = p_cliente_id AND empresa_id = v_empresa_id
    FOR UPDATE;

    IF v_limite_credito > 0 AND (v_saldo_cliente + v_total) > v_limite_credito THEN
        RAISE EXCEPTION 'El cliente supera su límite de crédito disponible. Límite: %, Saldo actual: %, Total factura: %',
            v_limite_credito, v_saldo_cliente, v_total;
    END IF;

    -- Actualizar totales en cabecera de factura
    UPDATE public.facturas
    SET subtotal = v_subtotal,
        descuento_total = v_descuento_total,
        impuesto_total = v_impuesto_total,
        total = v_total,
        saldo_pendiente = v_total
    WHERE id = v_factura_id;

    -- Aumentar deuda del cliente
    UPDATE public.clientes
    SET saldo_actual = saldo_actual + v_total,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_cliente_id;

    -- Auditoría
    INSERT INTO public.auditorias (
        empresa_id, usuario_id, modulo, accion, registro_id, datos_nuevos
    ) VALUES (
        v_empresa_id, v_usuario_id, 'FACTURACION', 'EMITIR_FACTURA', v_factura_id::TEXT,
        jsonb_build_object('numero', v_numero_factura, 'total', v_total, 'cliente_id', p_cliente_id)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'factura_id', v_factura_id,
        'numero_factura', v_numero_factura,
        'total', v_total,
        'saldo_pendiente', v_total
    );
END;
$$;

-- 5.2 REGISTRO DE PAGO CON PREVENCIÓN DE SOBREPAGO
CREATE OR REPLACE FUNCTION public.rpc_registrar_pago(
    p_factura_id UUID,
    p_monto NUMERIC(14,2),
    p_metodo_pago VARCHAR(30),
    p_idempotency_key VARCHAR(100),
    p_referencia VARCHAR(100) DEFAULT NULL,
    p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_factura RECORD;
    v_pago_id UUID;
    v_nuevo_saldo NUMERIC(14,2);
    v_nuevo_estado VARCHAR(30);
    v_numero_recibo VARCHAR(50);
BEGIN
    -- Validar idempotencia para evitar cobros dobles
    SELECT id INTO v_pago_id FROM public.pagos WHERE idempotency_key = p_idempotency_key;
    IF v_pago_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', TRUE, 'pago_id', v_pago_id, 'mensaje', 'Pago ya procesado (idempotente)');
    END IF;

    IF p_monto <= 0 THEN
        RAISE EXCEPTION 'El monto del pago debe ser mayor a 0';
    END IF;

    -- Bloquear factura para cálculo de saldo seguro
    SELECT * INTO v_factura FROM public.facturas WHERE id = p_factura_id FOR UPDATE;
    IF v_factura.id IS NULL THEN
        RAISE EXCEPTION 'Factura no encontrada';
    END IF;

    IF v_factura.estado = 'Anulada' THEN
        RAISE EXCEPTION 'No se pueden registrar pagos en facturas anuladas';
    END IF;

    IF v_factura.saldo_pendiente <= 0 OR v_factura.estado = 'Pagada' THEN
        RAISE EXCEPTION 'La factura ya se encuentra totalmente pagada';
    END IF;

    IF p_monto > v_factura.saldo_pendiente THEN
        RAISE EXCEPTION 'El monto ingresado ($%) excede el saldo pendiente ($%)', p_monto, v_factura.saldo_pendiente;
    END IF;

    v_nuevo_saldo := v_factura.saldo_pendiente - p_monto;
    IF v_nuevo_saldo = 0 THEN
        v_nuevo_estado := 'Pagada';
    ELSE
        v_nuevo_estado := 'Parcial';
    END IF;

    v_numero_recibo := 'REC-' || TO_CHAR(timezone('utc'::text, now()), 'YYYYMMDD') || '-' || SUBSTRING(p_idempotency_key FROM 1 FOR 6);

    -- Registrar pago
    v_pago_id := gen_random_uuid();
    INSERT INTO public.pagos (
        id, empresa_id, factura_id, usuario_id, numero_recibo, fecha_pago,
        monto, metodo_pago, referencia_transaccion, notas, idempotency_key
    ) VALUES (
        v_pago_id, v_factura.empresa_id, p_factura_id, v_factura.usuario_id, v_numero_recibo,
        timezone('utc'::text, now()), p_monto, p_metodo_pago, p_referencia, p_notas, p_idempotency_key
    );

    -- Actualizar factura
    UPDATE public.facturas
    SET saldo_pendiente = v_nuevo_saldo,
        estado = v_nuevo_estado,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_factura_id;

    -- Reducir saldo deudor del cliente
    UPDATE public.clientes
    SET saldo_actual = GREATEST(0.00, saldo_actual - p_monto),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_factura.cliente_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'pago_id', v_pago_id,
        'numero_recibo', v_numero_recibo,
        'nuevo_saldo', v_nuevo_saldo,
        'nuevo_estado', v_nuevo_estado
    );
END;
$$;

-- 5.3 ANULACIÓN DE FACTURA CON REVERSIÓN DE KARDEX Y SALDOS
CREATE OR REPLACE FUNCTION public.rpc_anular_factura(
    p_factura_id UUID,
    p_motivo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_factura RECORD;
    v_item RECORD;
BEGIN
    SELECT * INTO v_factura FROM public.facturas WHERE id = p_factura_id FOR UPDATE;
    IF v_factura.id IS NULL THEN
        RAISE EXCEPTION 'Factura no encontrada';
    END IF;

    IF v_factura.estado = 'Anulada' THEN
        RAISE EXCEPTION 'La factura ya se encuentra anulada';
    END IF;

    IF EXISTS (SELECT 1 FROM public.pagos WHERE factura_id = p_factura_id) THEN
        RAISE EXCEPTION 'No se puede anular una factura con pagos registrados. Debe anular los pagos primero.';
    END IF;

    -- Devolver stock de cada ítem al inventario
    FOR v_item IN SELECT * FROM public.factura_items WHERE factura_id = p_factura_id
    LOOP
        UPDATE public.productos
        SET stock_actual = stock_actual + v_item.cantidad,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_item.producto_id;

        INSERT INTO public.movimientos_inventario (
            empresa_id, producto_id, sucursal_id, tipo, cantidad, costo_unitario, referencia_documento, observaciones
        ) VALUES (
            v_factura.empresa_id, v_item.producto_id, v_factura.sucursal_id, 'ANULACION_VENTA', v_item.cantidad,
            v_item.precio_unitario, v_factura.numero_factura, 'Anulación de factura: ' || p_motivo
        );
    END LOOP;

    -- Revertir deuda del cliente
    UPDATE public.clientes
    SET saldo_actual = GREATEST(0.00, saldo_actual - v_factura.total),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_factura.cliente_id;

    -- Marcar factura anulada
    UPDATE public.facturas
    SET estado = 'Anulada',
        motivo_anulacion = p_motivo,
        fecha_anulacion = timezone('utc'::text, now()),
        saldo_pendiente = 0.00,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_factura_id;

    RETURN jsonb_build_object('success', TRUE, 'mensaje', 'Factura anulada y stock restituido correctamente');
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. DATOS SEMILLA (EMPRESA DEMO, SUCURSAL, PRODUCTOS Y CLIENTES)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    v_empresa_id UUID := '11111111-1111-1111-1111-111111111111';
    v_sucursal_id UUID := '22222222-2222-2222-2222-222222222222';
    v_usuario_id UUID := '33333333-3333-3333-3333-333333333333';
    v_cat_tecnologia UUID := '44444444-4444-4444-4444-444444444444';
    v_cat_servicios UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
    -- Empresa Principal
    INSERT INTO public.empresas (id, razon_social, nombre_comercial, identificacion_fiscal, direccion, telefono, correo, moneda, simbolo_moneda)
    VALUES (v_empresa_id, 'FacturaPro Soluciones S.A.S.', 'FacturaPro Cloud', '901234567-8', 'Av. Central 100, Piso 5', '+57 300 1234567', 'contacto@facturapro360.com', 'USD', '$')
    ON CONFLICT (identificacion_fiscal) DO NOTHING;

    -- Sucursal Principal
    INSERT INTO public.sucursales (id, empresa_id, codigo, nombre, direccion, telefono, es_principal)
    VALUES (v_sucursal_id, v_empresa_id, 'SUC-01', 'Sede Central', 'Av. Central 100', '+57 300 1234567', TRUE)
    ON CONFLICT (empresa_id, codigo) DO NOTHING;

    -- Usuario Administrador Inicial
    INSERT INTO public.usuarios (id, empresa_id, sucursal_id, nombre_completo, email, rol, activo)
    VALUES (v_usuario_id, v_empresa_id, v_sucursal_id, 'Administrador FacturaPro', 'adminfactura@facturapro360.com', 'Administrador', TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Numeración de Folios
    INSERT INTO public.numeraciones (empresa_id, sucursal_id, tipo_documento, prefijo, siguiente_numero, longitud_numero)
    VALUES (v_empresa_id, v_sucursal_id, 'FACTURA', 'FAC', 1, 8)
    ON CONFLICT (empresa_id, sucursal_id, tipo_documento) DO NOTHING;

    -- Categorías
    INSERT INTO public.categorias (id, empresa_id, nombre, descripcion)
    VALUES 
        (v_cat_tecnologia, v_empresa_id, 'Hardware & Equipos', 'Laptops, impresoras y periféricos'),
        (v_cat_servicios, v_empresa_id, 'Servicios Profesionales', 'Soporte, consultoría e integraciones')
    ON CONFLICT DO NOTHING;

    -- Clientes Iniciales
    INSERT INTO public.clientes (id, empresa_id, tipo_documento, numero_documento, razon_social, nombre_contacto, email, telefono, direccion, limite_credito)
    VALUES 
        ('66666666-6666-6666-6666-666666666661', v_empresa_id, 'RUC/NIT', '900888777-1', 'Distribuidora del Norte C.A.', 'Carlos Mendoza', 'cmendoza@norte.com', '+57 311 9876543', 'Zona Industrial Manzana B', 5000.00),
        ('66666666-6666-6666-6666-666666666662', v_empresa_id, 'Cedula', '1098765432', 'Ana María Valenzuela', 'Ana Valenzuela', 'ana.valenzuela@gmail.com', '+57 320 5551234', 'Calle 45 # 12-34', 1200.00),
        ('66666666-6666-6666-6666-666666666663', v_empresa_id, 'ConsumidorFinal', '999999999', 'Cliente Mostrador / Venta Rápida', 'Venta Rápida', 'ventas@facturapro360.com', '0000000', 'Local Comercial', 0.00)
    ON CONFLICT (empresa_id, numero_documento) DO NOTHING;

    -- Productos Iniciales
    INSERT INTO public.productos (id, empresa_id, categoria_id, sku, codigo_barras, nombre, descripcion, tipo, unidad_medida, precio_venta, costo_promedio, stock_actual, stock_minimo, permite_stock_negativo, iva_porcentaje)
    VALUES 
        ('77777777-7777-7777-7777-777777777771', v_empresa_id, v_cat_tecnologia, 'PRD-LAP-001', '7891234567890', 'Laptop Lenovo ThinkPad 16GB', 'Intel Core i7 13va gen, SSD 512GB', 'Producto', 'UND', 1150.00, 850.00, 15.000, 3.000, FALSE, 16.00),
        ('77777777-7777-7777-7777-777777777772', v_empresa_id, v_cat_tecnologia, 'PRD-IMP-002', '7891234567891', 'Impresora Térmica 80mm ESC/POS USB', 'Impresora para recibos y facturas de alta velocidad', 'Producto', 'UND', 185.00, 110.00, 25.000, 5.000, FALSE, 16.00),
        ('77777777-7777-7777-7777-777777777773', v_empresa_id, v_cat_tecnologia, 'PRD-LEC-003', '7891234567892', 'Lector Código de Barras 1D/2D QR', 'Lector láser con base manos libres USB', 'Producto', 'UND', 65.00, 38.00, 40.000, 8.000, FALSE, 16.00),
        ('77777777-7777-7777-7777-777777777774', v_empresa_id, v_cat_servicios, 'SRV-POL-004', '7891234567893', 'Póliza Mensual Soporte IT y Servidores', 'Mantenimiento preventivo y correctivo 24/7', 'Servicio', 'UND', 250.00, 0.00, 999.000, 0.000, TRUE, 16.00)
    ON CONFLICT (empresa_id, sku) DO NOTHING;
END $$;

-- ------------------------------------------------------------------------------
-- FINALIZACIÓN EXITOSA
-- ------------------------------------------------------------------------------
SELECT 'FacturaPro 360 instalado con éxito en Supabase. Tablas, RLS, Procedimientos RPC y Datos Semilla listos.' AS resultado;
