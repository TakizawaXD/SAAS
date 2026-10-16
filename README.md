# FacturaPro 360 - Suite de Facturacion e Inventario
**Arquitectura Dual: Edicion Escritorio (.NET 8 + WPF) y Edicion Web (Angular + Supabase)**

Este repositorio contiene la implementacion del catalogo completo de funciones y pantallas de **FacturaPro 360**, disenado para soportar dos modalidades de negocio compartiendo el **mismo modelo logico y reglas de negocio transaccionales**:

1. **[FacturaPro360-Desktop](./FacturaPro360-Desktop/)**:
   - Para empresas sin internet que operan en 1 PC local o terminales en red local.
   - Desarrollado en **.NET 8 LTS**, **WPF** (patron MVVM con `CommunityToolkit.Mvvm`), **Entity Framework Core 8** con transacciones explicitas ACID, y soporte configurable para **SQL Server Express** y **SQLite**.
   - Incluye generador de respaldos (`.bak`), reportes, impresion A4 y termica ESC/POS, y suite de pruebas unitarias xUnit.

2. **[FacturaPro360-Web](./FacturaPro360-Web/)**:
   - Para empresas con internet con acceso multiusuario y multidispositivo (SaaS).
   - Desarrollado en **Angular** (Signals reactivos, componentes standalone, TypeScript estricto, Tailwind CSS).
   - Base de datos en la nube con **Supabase (PostgreSQL)**, aislamiento estricto por empresa mediante **Row Level Security (RLS)** y operaciones transaccionales criticas implementadas como **funciones RPC** (`rpc_emitir_factura`, `rpc_registrar_pago`, `rpc_anular_factura`).
   - Generacion y descarga directa de comprobantes en PDF con `jsPDF`.

---

## Estructura del Repositorio

```
SAAS/
├── FacturaPro360-Desktop/            # Edicion Escritorio (Offline)
│   ├── FacturaPro360.sln            # Solucion de Visual Studio
│   ├── src/
│   │   ├── FacturaPro360.Domain/         # Entidades, Enums y Excepciones de Dominio
│   │   ├── FacturaPro360.Application/    # DTOs, Casos de uso e Interfaces
│   │   ├── FacturaPro360.Infrastructure/ # EF Core DbContext, Servicios y Respaldo
│   │   └── FacturaPro360.Wpf/            # UI Moderna WPF (Vistas y ViewModels)
│   ├── tests/
│   │   └── FacturaPro360.Tests/          # Pruebas xUnit de operaciones ACID
│   └── README.md
│
├── FacturaPro360-Web/                # Edicion Web (SaaS)
│   ├── supabase/
│   │   └── migrations/
│   │       ├── 001_initial_schema.sql    # Tablas e indices relacionales
│   │       ├── 002_rls_policies.sql      # Seguridad multitenant RLS
│   │       ├── 003_rpc_transactions.sql  # Procedimientos transaccionales RPC
│   │       └── 004_seed_data.sql         # Datos demo iniciales
│   ├── src/                              # Codigo fuente Angular
│   │   └── app/
│   │       ├── components/               # Dashboard, Facturas, Clientes, Inventario
│   │       ├── models/                   # Tipos e interfaces compartidas
│   │       └── services/                 # FacturaProService (Signals + Supabase RPC)
│   ├── package.json
│   ├── angular.json
│   └── README.md
│
└── README.md
```

---

## Alcance del Flujo MVP Implementado
Ambos proyectos cubren el flujo nucleo estipulado en la documentacion de alcance:
- **Cliente**: Registro, asignacion de tipo de documento y saldos.
- **Producto**: Catalogo con SKU, precios, impuestos y stock en tiempo real con Kardex.
- **Factura**: Consecutivo seguro sin saltos ni duplicados, recalculacion exacta de totales (Subtotal, Descuentos, IVA, Total).
- **Pago**: Registro de pagos completos o parciales, clave de idempotencia y actualizacion de saldo.
- **Anulacion**: Reversion atomica de movimientos en inventario y saldos de clientes.
- **PDF**: Generacion de comprobante oficial de pago y factura.
- **Dashboard**: Indicadores financieros y alertas de inventario.

---

## Ejecucion Inmediata

### 1. Aplicacion de Escritorio (.NET 8 WPF AAA)
- **Ejecutable compilado directo**: Doble clic en [`Ejecutar-Desktop.bat`](file:///c:/Users/andre/OneDrive/Desktop/SAAS/Ejecutar-Desktop.bat) o ejecute directamente el binario autocontenido:
  ```powershell
  FacturaPro360-Desktop\FacturaPro360-Standalone\FacturaPro360.Wpf.exe
  ```
- **Pruebas de Integridad y Seguridad**:
  ```powershell
  dotnet test FacturaPro360-Desktop\tests\FacturaPro360.Tests\FacturaPro360.Tests.csproj
  ```

### 2. Aplicacion Web (Angular 19 SaaS)
- **Opcion A (Docker Containerizado - Recomendado)**:
  - Doble clic en [`Ejecutar-Web-Docker.bat`](file:///c:/Users/andre/OneDrive/Desktop/SAAS/Ejecutar-Web-Docker.bat) o ejecute:
    ```bash
    docker compose up -d --build
    ```
  - Acceso Web en: `http://localhost:8080/` (o puerto `80`)
  - Base de Datos PostgreSQL integrada: `localhost:5432` (con esquemas RLS y datos semilla automaticos)
  - Para detener los contenedores: [`Detener-Web-Docker.bat`](file:///c:/Users/andre/OneDrive/Desktop/SAAS/Detener-Web-Docker.bat)

- **Opcion B (Servidor Local Nativo)**:
  - Servidor de desarrollo activo en: `http://localhost:4200/`

- **Credenciales maestras de acceso**:
  - **Usuario**: `adminfactura`
  - **Contrasena**: `admin123`
