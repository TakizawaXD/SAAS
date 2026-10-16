-- ==============================================================================
-- FACTURAPRO 360 - SUPABASE / POSTGRESQL MIGRATION 003: OPERACIONES TRANSACCIONALES (RPC)
-- Implementación estricta de la Sección C del Catálogo de FacturaPro 360
-- ==============================================================================

-- 1. FUNCIÓN TRANSACCIONAL: EMITIR FACTURA (Atómica con bloqueo)
CREATE OR REPLACE FUNCTION public.rpc_emitir_factura(
    p_sucursal_id UUID,
    p_cliente_id UUID,
    p_fecha_vencimiento DATE,
    p_items JSONB, -- Array de objetos: [{ "producto_id": "...", "cantidad": 2, "precio_unitario": 50, "descuento_porcentaje": 0, "iva_porcentaje": 16 }]
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
BEGIN
    -- 1. Identificar empresa del usuario autenticado
    SELECT empresa_id INTO v_empresa_id 
    FROM public.usuarios 
    WHERE id = v_usuario_id AND activo = TRUE;
    
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado o no pertenece a una empresa activa';
    END IF;

    -- 2. Bloquear la numeración correspondiente para evitar duplicados y huecos (SELECT FOR UPDATE)
    SELECT prefijo, siguiente_numero, longitud_numero
    INTO v_prefijo, v_siguiente_num, v_longitud
    FROM public.numeraciones
    WHERE empresa_id = v_empresa_id 
      AND sucursal_id = p_sucursal_id 
      AND tipo_documento = 'FACTURA'
      AND activo = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Si no existe numeración configurada para la sucursal, usar valores predeterminados
        v_prefijo := 'FAC';
        v_siguiente_num := 1;
        v_longitud := 8;
        
        INSERT INTO public.numeraciones (empresa_id, sucursal_id, tipo_documento, prefijo, siguiente_numero, longitud_numero)
        VALUES (v_empresa_id, p_sucursal_id, 'FACTURA', v_prefijo, 2, v_longitud);
    ELSE
        UPDATE public.numeraciones
        SET siguiente_numero = siguiente_numero + 1,
            updated_at = timezone('utc'::text, now())
        WHERE empresa_id = v_empresa_id 
          AND sucursal_id = p_sucursal_id 
          AND tipo_documento = 'FACTURA';
    END IF;

    -- Formatear número de factura (ej: FAC-00000001)
    v_numero_factura := v_prefijo || '-' || LPAD(v_siguiente_num::TEXT, v_longitud, '0');

    -- 3. Crear cabecera de la factura provisional
    INSERT INTO public.facturas (
        empresa_id, sucursal_id, usuario_id, cliente_id,
        numero_factura, prefijo, consecutivo, fecha_vencimiento,
        subtotal, descuento_total, impuesto_total, total, saldo_pendiente,
        estado, notas
    ) VALUES (
        v_empresa_id, p_sucursal_id, v_usuario_id, p_cliente_id,
        v_numero_factura, v_prefijo, v_siguiente_num, p_fecha_vencimiento,
        0, 0, 0, 0, 0,
        'Emitida', p_notas
    ) RETURNING id INTO v_factura_id;

    -- 4. Iterar sobre los ítems, recalcular totales de forma exacta y descontar inventario
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_producto_id := (v_item->>'producto_id')::UUID;
        v_item_cantidad    := (v_item->>'cantidad')::NUMERIC(14,3);
        v_item_precio      := (v_item->>'precio_unitario')::NUMERIC(14,2);
        v_item_desc_pct    := COALESCE((v_item->>'descuento_porcentaje')::NUMERIC(5,2), 0.00);
        v_item_iva_pct     := COALESCE((v_item->>'iva_porcentaje')::NUMERIC(5,2), 16.00);

        IF v_item_cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad del ítem debe ser mayor a cero';
        END IF;

        -- Bloquear producto para validar stock
        SELECT nombre, stock_actual, permite_stock_negativo
        INTO v_producto_nombre, v_stock_actual, v_permite_negativo
        FROM public.productos
        WHERE id = v_item_producto_id AND empresa_id = v_empresa_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto con ID % no encontrado', v_item_producto_id;
        END IF;

        IF NOT v_permite_negativo AND (v_stock_actual - v_item_cantidad < 0) THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto "%" (Actual: %, Solicitado: %)', 
                v_producto_nombre, v_stock_actual, v_item_cantidad;
        END IF;

        -- Cálculos matemáticos precisos
        v_item_subtotal   := ROUND(v_item_cantidad * v_item_precio, 2);
        v_item_desc_monto := ROUND(v_item_subtotal * (v_item_desc_pct / 100.0), 2);
        v_item_base       := v_item_subtotal - v_item_desc_monto;
        v_item_impuesto   := ROUND(v_item_base * (v_item_iva_pct / 100.0), 2);
        v_item_total      := v_item_base + v_item_impuesto;

        -- Acumular totales
        v_subtotal        := v_subtotal + v_item_subtotal;
        v_descuento_total := v_descuento_total + v_item_desc_monto;
        v_impuesto_total  := v_impuesto_total + v_item_impuesto;
        v_total           := v_total + v_item_total;

        -- Insertar línea de factura
        INSERT INTO public.factura_items (
            factura_id, producto_id, descripcion, cantidad, precio_unitario,
            descuento_porcentaje, iva_porcentaje, subtotal, impuesto, total
        ) VALUES (
            v_factura_id, v_item_producto_id, v_producto_nombre, v_item_cantidad, v_item_precio,
            v_item_desc_pct, v_item_iva_pct, v_item_subtotal, v_item_impuesto, v_item_total
        );

        -- Descontar inventario
        UPDATE public.productos
        SET stock_actual = stock_actual - v_item_cantidad,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_item_producto_id;

        -- Registrar movimiento en Kardex
        INSERT INTO public.movimientos_inventario (
            empresa_id, producto_id, sucursal_id, tipo, cantidad,
            costo_unitario, referencia_documento, observaciones, usuario_id
        ) VALUES (
            v_empresa_id, v_item_producto_id, p_sucursal_id, 'SALIDA_VENTA', v_item_cantidad,
            v_item_precio, v_numero_factura, 'Emisión de Factura ' || v_numero_factura, v_usuario_id
        );
    END LOOP;

    -- 5. Actualizar totales calculados en la factura y saldo por cobrar
    UPDATE public.facturas
    SET subtotal = v_subtotal,
        descuento_total = v_descuento_total,
        impuesto_total = v_impuesto_total,
        total = v_total,
        saldo_pendiente = v_total
    WHERE id = v_factura_id;

    -- Actualizar saldo deudor del cliente
    UPDATE public.clientes
    SET saldo_actual = saldo_actual + v_total,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_cliente_id;

    -- 6. Auditoría inmutable
    INSERT INTO public.auditorias (
        empresa_id, usuario_id, modulo, accion, registro_id, datos_nuevos
    ) VALUES (
        v_empresa_id, v_usuario_id, 'FACTURAS', 'EMITIR_FACTURA', v_factura_id::TEXT,
        jsonb_build_object('numero', v_numero_factura, 'total', v_total, 'cliente_id', p_cliente_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'factura_id', v_factura_id,
        'numero_factura', v_numero_factura,
        'total', v_total,
        'saldo_pendiente', v_total
    );
END;
$$;


-- 2. FUNCIÓN TRANSACCIONAL: REGISTRAR PAGO
CREATE OR REPLACE FUNCTION public.rpc_registrar_pago(
    p_factura_id UUID,
    p_monto NUMERIC(14,2),
    p_metodo_pago VARCHAR(30),
    p_referencia VARCHAR(100) DEFAULT NULL,
    p_notas TEXT DEFAULT NULL,
    p_idempotency_key VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_usuario_id UUID := auth.uid();
    v_cliente_id UUID;
    v_saldo_actual NUMERIC(14,2);
    v_total_factura NUMERIC(14,2);
    v_numero_factura VARCHAR(50);
    v_estado_actual VARCHAR(30);
    v_pago_id UUID;
    v_nuevo_saldo NUMERIC(14,2);
    v_nuevo_estado VARCHAR(30);
    v_recibo_num VARCHAR(50);
    v_key VARCHAR(100);
BEGIN
    IF p_monto <= 0 THEN
        RAISE EXCEPTION 'El monto del pago debe ser mayor que cero';
    END IF;

    -- Verificar idempotencia si se proporcionó clave
    v_key := COALESCE(p_idempotency_key, gen_random_uuid()::TEXT);
    IF EXISTS (SELECT 1 FROM public.pagos WHERE idempotency_key = v_key) THEN
        RAISE EXCEPTION 'Transacción duplicada detectada (Idempotency Key ya procesada)';
    END IF;

    -- 1. Bloquear factura con SELECT FOR UPDATE
    SELECT empresa_id, cliente_id, saldo_pendiente, total, numero_factura, estado
    INTO v_empresa_id, v_cliente_id, v_saldo_actual, v_total_factura, v_numero_factura, v_estado_actual
    FROM public.facturas
    WHERE id = p_factura_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Factura no encontrada';
    END IF;

    IF v_estado_actual = 'Anulada' THEN
        RAISE EXCEPTION 'No se pueden registrar pagos a una factura anulada';
    END IF;

    IF v_estado_actual = 'Pagada' OR v_saldo_actual <= 0 THEN
        RAISE EXCEPTION 'La factura ya se encuentra totalmente pagada';
    END IF;

    IF p_monto > v_saldo_actual THEN
        RAISE EXCEPTION 'El monto del pago (%) excede el saldo pendiente (%)', p_monto, v_saldo_actual;
    END IF;

    v_recibo_num := 'REC-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || SUBSTRING(v_key FROM 1 FOR 6);

    -- 2. Registrar el pago
    INSERT INTO public.pagos (
        empresa_id, factura_id, usuario_id, numero_recibo,
        monto, metodo_pago, referencia_transaccion, notas, idempotency_key
    ) VALUES (
        v_empresa_id, p_factura_id, v_usuario_id, v_recibo_num,
        p_monto, p_metodo_pago, p_referencia, p_notas, v_key
    ) RETURNING id INTO v_pago_id;

    -- 3. Calcular nuevo saldo y estado
    v_nuevo_saldo := v_saldo_actual - p_monto;
    IF v_nuevo_saldo <= 0.005 THEN
        v_nuevo_saldo := 0.00;
        v_nuevo_estado := 'Pagada';
    ELSE
        v_nuevo_estado := 'Parcial';
    END IF;

    UPDATE public.facturas
    SET saldo_pendiente = v_nuevo_saldo,
        estado = v_nuevo_estado,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_factura_id;

    -- 4. Actualizar saldo del cliente
    UPDATE public.clientes
    SET saldo_actual = GREATEST(0, saldo_actual - p_monto),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_cliente_id;

    -- 5. Auditoría
    INSERT INTO public.auditorias (
        empresa_id, usuario_id, modulo, accion, registro_id, datos_nuevos
    ) VALUES (
        v_empresa_id, v_usuario_id, 'PAGOS', 'REGISTRAR_PAGO', v_pago_id::TEXT,
        jsonb_build_object('factura_id', p_factura_id, 'monto', p_monto, 'nuevo_saldo', v_nuevo_saldo, 'nuevo_estado', v_nuevo_estado)
    );

    RETURN jsonb_build_object(
        'success', true,
        'pago_id', v_pago_id,
        'numero_recibo', v_recibo_num,
        'nuevo_saldo', v_nuevo_saldo,
        'estado_factura', v_nuevo_estado
    );
END;
$$;


-- 3. FUNCIÓN TRANSACCIONAL: ANULAR FACTURA (Reversión atómica)
CREATE OR REPLACE FUNCTION public.rpc_anular_factura(
    p_factura_id UUID,
    p_motivo TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_usuario_id UUID := auth.uid();
    v_cliente_id UUID;
    v_numero_factura VARCHAR(50);
    v_estado_actual VARCHAR(30);
    v_saldo_pendiente NUMERIC(14,2);
    v_total NUMERIC(14,2);
    v_sucursal_id UUID;
    v_item RECORD;
BEGIN
    IF TRIM(COALESCE(p_motivo, '')) = '' THEN
        RAISE EXCEPTION 'El motivo de anulación es obligatorio';
    END IF;

    -- 1. Bloquear factura para anulación
    SELECT empresa_id, sucursal_id, cliente_id, numero_factura, estado, saldo_pendiente, total
    INTO v_empresa_id, v_sucursal_id, v_cliente_id, v_numero_factura, v_estado_actual, v_saldo_pendiente, v_total
    FROM public.facturas
    WHERE id = p_factura_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Factura no encontrada';
    END IF;

    IF v_estado_actual = 'Anulada' THEN
        RAISE EXCEPTION 'La factura ya se encuentra anulada';
    END IF;

    -- 2. Revertir inventario para cada ítem facturado
    FOR v_item IN 
        SELECT producto_id, cantidad, precio_unitario 
        FROM public.factura_items 
        WHERE factura_id = p_factura_id
    LOOP
        UPDATE public.productos
        SET stock_actual = stock_actual + v_item.cantidad,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_item.producto_id;

        INSERT INTO public.movimientos_inventario (
            empresa_id, producto_id, sucursal_id, tipo, cantidad,
            costo_unitario, referencia_documento, observaciones, usuario_id
        ) VALUES (
            v_empresa_id, v_item.producto_id, v_sucursal_id, 'ANULACION_VENTA', v_item.cantidad,
            v_item.precio_unitario, v_numero_factura, 'Anulación de Factura ' || v_numero_factura || ': ' || p_motivo, v_usuario_id
        );
    END LOOP;

    -- 3. Revertir saldo pendiente del cliente
    UPDATE public.clientes
    SET saldo_actual = GREATEST(0, saldo_actual - v_saldo_pendiente),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_cliente_id;

    -- 4. Marcar factura como Anulada (sin borrado físico)
    UPDATE public.facturas
    SET estado = 'Anulada',
        saldo_pendiente = 0,
        motivo_anulacion = p_motivo,
        fecha_anulacion = timezone('utc'::text, now()),
        anulado_por = v_usuario_id,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_factura_id;

    -- 5. Auditoría
    INSERT INTO public.auditorias (
        empresa_id, usuario_id, modulo, accion, registro_id, datos_nuevos
    ) VALUES (
        v_empresa_id, v_usuario_id, 'FACTURAS', 'ANULAR_FACTURA', p_factura_id::TEXT,
        jsonb_build_object('numero', v_numero_factura, 'motivo', p_motivo)
    );

    RETURN jsonb_build_object(
        'success', true,
        'factura_id', p_factura_id,
        'numero_factura', v_numero_factura,
        'estado', 'Anulada'
    );
END;
$$;
