-- ==============================================================================
-- FACTURAPRO 360 - SUPABASE / POSTGRESQL MIGRATION 001: ESQUEMA INICIAL
-- Modelado unificado y compartido con la edición .NET de Escritorio
-- ==============================================================================

-- Extensiones recomendadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA: EMPRESAS (Tenant principal para RLS)
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    identificacion_fiscal VARCHAR(50) NOT NULL UNIQUE,
    direccion TEXT,
    telefono VARCHAR(50),
    correo VARCHAR(150),
    moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
    simbolo_moneda VARCHAR(5) NOT NULL DEFAULT '$',
    zona_horaria VARCHAR(50) NOT NULL DEFAULT 'America/Bogota',
    logo_url TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TABLA: SUCURSALES
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

-- 3. TABLA: PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY, -- Corresponde a auth.users(id) de Supabase Auth
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'Vendedor' CHECK (rol IN ('SuperAdmin', 'Administrador', 'Vendedor', 'Cajero', 'Contador')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA: CLIENTES
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
    limite_credito NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    saldo_actual NUMERIC(14,2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_cliente_documento_empresa UNIQUE (empresa_id, numero_documento)
);

-- 5. TABLA: CATEGORÍAS DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_categoria_nombre_empresa UNIQUE (empresa_id, nombre)
);

-- 6. TABLA: PRODUCTOS Y SERVICIOS
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

-- 7. TABLA: KARDEX / MOVIMIENTOS DE INVENTARIO
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

-- 8. TABLA: NUMERACIONES Y SECUENCIAS CONCURRENTES
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

-- 9. TABLA: FACTURAS DE VENTA
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

-- 10. TABLA: ÍTEMS DE FACTURA
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

-- 11. TABLA: PAGOS Y RECIBOS
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

-- 12. TABLA: AUDITORÍA INMUTABLE
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

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_facturas_empresa_fecha ON public.facturas (empresa_id, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON public.facturas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON public.facturas (empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON public.productos (empresa_id, sku);
CREATE INDEX IF NOT EXISTS idx_kardex_producto ON public.movimientos_inventario (producto_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_pagos_factura ON public.pagos (factura_id);
