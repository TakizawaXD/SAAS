-- ==============================================================================
-- FACTURAPRO 360 - SUPABASE / POSTGRESQL MIGRATION 002: ROW LEVEL SECURITY (RLS)
-- Aislamiento estricto multitenant por empresa
-- ==============================================================================

-- Función auxiliar para obtener el empresa_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.get_auth_empresa_id()
RETURNS UUID AS $$
    SELECT empresa_id FROM public.usuarios WHERE id = auth.uid() AND activo = TRUE LIMIT 1;
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

-- 1. Políticas para EMPRESAS
CREATE POLICY "Usuarios ven su propia empresa" ON public.empresas
    FOR SELECT USING (id = public.get_auth_empresa_id());

CREATE POLICY "Solo SuperAdmin actualiza su empresa" ON public.empresas
    FOR UPDATE USING (id = public.get_auth_empresa_id() AND EXISTS (
        SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('SuperAdmin', 'Administrador')
    ));

-- 2. Políticas para SUCURSALES
CREATE POLICY "Usuarios ven sucursales de su empresa" ON public.sucursales
    FOR SELECT USING (empresa_id = public.get_auth_empresa_id());

CREATE POLICY "Administradores gestionan sucursales" ON public.sucursales
    FOR ALL USING (empresa_id = public.get_auth_empresa_id() AND EXISTS (
        SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('SuperAdmin', 'Administrador')
    ));

-- 3. Políticas para USUARIOS
CREATE POLICY "Usuarios ven miembros de su empresa" ON public.usuarios
    FOR SELECT USING (empresa_id = public.get_auth_empresa_id());

CREATE POLICY "Administradores gestionan usuarios" ON public.usuarios
    FOR ALL USING (empresa_id = public.get_auth_empresa_id() AND EXISTS (
        SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('SuperAdmin', 'Administrador')
    ));

-- 4. Políticas para CLIENTES
CREATE POLICY "Usuarios acceden a clientes de su empresa" ON public.clientes
    FOR ALL USING (empresa_id = public.get_auth_empresa_id());

-- 5. Políticas para CATEGORIAS
CREATE POLICY "Usuarios acceden a categorias de su empresa" ON public.categorias
    FOR ALL USING (empresa_id = public.get_auth_empresa_id());

-- 6. Políticas para PRODUCTOS
CREATE POLICY "Usuarios acceden a productos de su empresa" ON public.productos
    FOR ALL USING (empresa_id = public.get_auth_empresa_id());

-- 7. Políticas para MOVIMIENTOS DE INVENTARIO
CREATE POLICY "Usuarios ven kardex de su empresa" ON public.movimientos_inventario
    FOR SELECT USING (empresa_id = public.get_auth_empresa_id());

CREATE POLICY "Usuarios autorizados insertan movimientos" ON public.movimientos_inventario
    FOR INSERT WITH CHECK (empresa_id = public.get_auth_empresa_id());

-- 8. Políticas para NUMERACIONES
CREATE POLICY "Usuarios ven numeraciones de su empresa" ON public.numeraciones
    FOR SELECT USING (empresa_id = public.get_auth_empresa_id());

-- 9. Políticas para FACTURAS
CREATE POLICY "Usuarios ven facturas de su empresa" ON public.facturas
    FOR SELECT USING (empresa_id = public.get_auth_empresa_id());

-- 10. Políticas para FACTURA_ITEMS
CREATE POLICY "Usuarios ven items de facturas de su empresa" ON public.factura_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.facturas f 
            WHERE f.id = factura_items.factura_id AND f.empresa_id = public.get_auth_empresa_id()
        )
    );

-- 11. Políticas para PAGOS
CREATE POLICY "Usuarios ven pagos de su empresa" ON public.pagos
    FOR SELECT USING (empresa_id = public.get_auth_empresa_id());

-- 12. Políticas para AUDITORIAS
CREATE POLICY "Administradores y contadores ven auditorías" ON public.auditorias
    FOR SELECT USING (empresa_id = public.get_auth_empresa_id() AND EXISTS (
        SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('SuperAdmin', 'Administrador', 'Contador')
    ));
