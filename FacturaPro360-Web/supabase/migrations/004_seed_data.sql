-- ==============================================================================
-- FACTURAPRO 360 - SUPABASE / POSTGRESQL MIGRATION 004: DATOS SEMILLA (SEED DATA)
-- Datos de prueba para iniciar de inmediato en desarrollo y pruebas
-- ==============================================================================

DO $$
DECLARE
    v_empresa_id UUID := '11111111-1111-1111-1111-111111111111';
    v_sucursal_id UUID := '22222222-2222-2222-2222-222222222222';
    v_cat_tecnologia UUID := gen_random_uuid();
    v_cat_servicios UUID := gen_random_uuid();
BEGIN
    -- 1. Empresa Principal
    INSERT INTO public.empresas (id, razon_social, nombre_comercial, identificacion_fiscal, direccion, telefono, correo, moneda, simbolo_moneda)
    VALUES (v_empresa_id, 'FacturaPro Soluciones S.A.S.', 'FacturaPro Cloud', '901234567-8', 'Av. Central 100, Piso 5', '+57 300 1234567', 'contacto@facturapro360.com', 'USD', '$')
    ON CONFLICT (identificacion_fiscal) DO NOTHING;

    -- 2. Sucursal Principal
    INSERT INTO public.sucursales (id, empresa_id, codigo, nombre, direccion, telefono, es_principal)
    VALUES (v_sucursal_id, v_empresa_id, 'SUC-01', 'Sede Central', 'Av. Central 100', '+57 300 1234567', TRUE)
    ON CONFLICT (empresa_id, codigo) DO NOTHING;

    -- 3. Numeración inicial de facturación
    INSERT INTO public.numeraciones (empresa_id, sucursal_id, tipo_documento, prefijo, siguiente_numero, longitud_numero)
    VALUES (v_empresa_id, v_sucursal_id, 'FACTURA', 'FAC', 1, 8)
    ON CONFLICT (empresa_id, sucursal_id, tipo_documento) DO NOTHING;

    -- 4. Categorías
    INSERT INTO public.categorias (id, empresa_id, nombre, descripcion)
    VALUES 
        (v_cat_tecnologia, v_empresa_id, 'Hardware & Equipos', 'Laptops, impresoras y periféricos'),
        (v_cat_servicios, v_empresa_id, 'Servicios Profesionales', 'Soporte, consultoría e integraciones')
    ON CONFLICT DO NOTHING;

    -- 5. Clientes Iniciales
    INSERT INTO public.clientes (empresa_id, tipo_documento, numero_documento, razon_social, nombre_contacto, email, telefono, direccion, limite_credito)
    VALUES 
        (v_empresa_id, 'RUC/NIT', '900888777-1', 'Distribuidora del Norte C.A.', 'Carlos Mendoza', 'cmendoza@norte.com', '+57 311 9876543', 'Zona Industrial Manzana B', 5000.00),
        (v_empresa_id, 'Cedula', '1098765432', 'Ana María Valenzuela', 'Ana Valenzuela', 'ana.valenzuela@gmail.com', '+57 320 5551234', 'Calle 45 # 12-34', 1200.00),
        (v_empresa_id, 'ConsumidorFinal', '999999999', 'Cliente Mostrador / Venta Rápida', 'Venta Rápida', 'ventas@facturapro360.com', '0000000', 'Local Comercial', 0.00)
    ON CONFLICT (empresa_id, numero_documento) DO NOTHING;

    -- 6. Productos Iniciales
    INSERT INTO public.productos (empresa_id, categoria_id, sku, codigo_barras, nombre, descripcion, tipo, unidad_medida, precio_venta, costo_promedio, stock_actual, stock_minimo, permite_stock_negativo, iva_porcentaje)
    VALUES 
        (v_empresa_id, v_cat_tecnologia, 'PRD-LAP-001', '7891234567890', 'Laptop Lenovo ThinkPad 16GB', 'Intel Core i7 13va gen, SSD 512GB', 'Producto', 'UND', 1150.00, 850.00, 15.000, 3.000, FALSE, 16.00),
        (v_empresa_id, v_cat_tecnologia, 'PRD-IMP-002', '7891234567891', 'Impresora Térmica 80mm ESC/POS USB', 'Impresora para recibos y facturas de alta velocidad', 'Producto', 'UND', 185.00, 110.00, 25.000, 5.000, FALSE, 16.00),
        (v_empresa_id, v_cat_tecnologia, 'PRD-LEC-003', '7891234567892', 'Lector Código de Barras 1D/2D QR', 'Lector láser con base manos libres USB', 'Producto', 'UND', 65.00, 38.00, 40.000, 8.000, FALSE, 16.00),
        (v_empresa_id, v_cat_servicios, 'SRV-POL-004', '7891234567893', 'Póliza Mensual Soporte IT y Servidores', 'Mantenimiento preventivo y correctivo 24/7', 'Servicio', 'UND', 250.00, 0.00, 999.000, 0.000, TRUE, 16.00)
    ON CONFLICT (empresa_id, sku) DO NOTHING;
END $$;
