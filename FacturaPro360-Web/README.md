# FacturaPro 360 - Edición Web (Angular + Supabase)
**Plataforma de Facturación e Inventario SaaS Multiempresa con Aislamiento RLS**

Diseñado para empresas con conexión a internet y acceso multidispositivo, conforme a las especificaciones de arquitectura de **FacturaPro 360**.

---

## Arquitectura

- **Frontend:**
  - **Angular** (Standalone Components, Signals reactivos, TypeScript estricto).
  - Interfaz SaaS moderna con **Tailwind CSS**, diseño dark/indigo ultra pulido.
  - Generación de facturas oficiales y exportación a PDF directa desde el cliente con `jsPDF`.
  - Módulos del MVP:
    - **Dashboard:** Métricas financieras en tiempo real (Ventas acumuladas, Cobrado, Por cobrar, Alertas de stock bajo).
    - **Ventas y Facturación:** Listado general con badges de estado (`Emitida`, `Parcial`, `Pagada`, `Anulada`), filtros dinámicos.
    - **Nueva Factura:** Asistente interactivo con cálculo automático con decimales exactos, selección de cliente, validación de stock y emisión atómica.
    - **Detalle de Factura:** Visor integral de factura, módulo de abonos y pagos parciales/totales, anulación con motivo y descarga de PDF.
    - **Clientes:** Directorio de clientes con saldos adeudados y registro modal.
    - **Inventario:** Catálogo de productos y servicios con indicadores de stock mínimo.
- **Backend & Base de Datos (Supabase / PostgreSQL):**
  - **`supabase/migrations/001_initial_schema.sql`**: Esquema relacional unificado (empresas, sucursales, usuarios, clientes, productos, facturas, ítems, pagos, numeraciones, auditoría).
  - **`supabase/migrations/002_rls_policies.sql`**: Políticas de **Row Level Security (RLS)** por empresa para aislamiento total multitenant.
  - **`supabase/migrations/003_rpc_transactions.sql`**: Funciones PostgreSQL transaccionales críticas:
    - `rpc_emitir_factura`: Bloqueo consultivo de numeración (`SELECT FOR UPDATE`), validación y descuento de stock, inserción en Kardex, cálculo decimal exacto y auditoría inmutable.
    - `rpc_registrar_pago`: Bloqueo de factura, prevención de sobrepago, clave de idempotencia, actualización de saldo/estado (`Parcial` / `Pagada`).
    - `rpc_anular_factura`: Reversión atómica de inventario y saldos.
  - **`supabase/migrations/004_seed_data.sql`**: Datos semilla iniciales para pruebas.

---

## Despliegue con Docker (Producción Lista)

La aplicación incluye configuración de contenedores de nivel de producción con **Multi-Stage Build** y servidor web **Nginx hardened**:

### 1. Despliegue con un solo clic:
Doble clic en el archivo raíz:
```cmd
Ejecutar-Web-Docker.bat
```
O directamente por terminal:
```bash
docker compose up -d --build
```

### 2. Acceso a los Servicios:
- **Frontend Web FacturaPro 360**: `http://localhost:8080/` (o `http://localhost/`)
- **Base de Datos PostgreSQL (con RLS y Seed)**: `localhost:5432`
- **Para detener los servicios**:
  ```bash
  docker compose down
  ```
  O doble clic en `Detener-Web-Docker.bat`.

---

## Cómo Ejecutar en Desarrollo Local (Sin Docker)

### 1. Iniciar el Servidor de Desarrollo
```bash
npm start
# O alternativamente:
npx ng serve --open
```
La aplicación estará disponible en `http://localhost:4200/`.

> **Nota:** La aplicación cuenta con un modo de demostración reactivo local listo para usar de inmediato sin necesidad de credenciales remotas iniciales.

### 2. Conectar tu Proyecto de Supabase
1. Copia `.env.example` a `.env`.
2. Ejecuta las migraciones contenidas en `supabase/migrations/` en tu panel de Supabase SQL Editor (en orden: 001, 002, 003 y 004).
3. Configura tus variables en `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     supabaseUrl: 'https://TU-PROYECTO.supabase.co',
     supabaseAnonKey: 'TU-ANON-KEY-AQUI',
     demoEmpresaId: '11111111-1111-1111-1111-111111111111',
     demoSucursalId: '22222222-2222-2222-2222-222222222222'
   };
   ```

---

## Compilación para Producción
```bash
npm run build
```
Los archivos de distribución optimizados se generarán en la carpeta `dist/facturapro-web`.
