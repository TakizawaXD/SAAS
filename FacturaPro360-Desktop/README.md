# FacturaPro 360 - Edicion Escritorio (Offline)
**Plataforma de Facturacion e Inventario Local Transaccional (ACID)**

Disenado especificamente para empresas sin internet con 1 PC o terminales en red local, conforme a las especificaciones de arquitectura de **FacturaPro 360**.

---

## Arquitectura Limpia (Clean Architecture)

- **`FacturaPro360.Domain`**:
  - Entidades de negocio: `Empresa`, `Sucursal`, `Usuario`, `Cliente`, `Producto`, `MovimientoInventario` (Kardex), `Numeracion`, `Factura`, `FacturaItem`, `Pago`, `Auditoria`.
  - Enums y excepciones de dominio (`StockInsuficienteException`, `SaldoExcedidoException`).
- **`FacturaPro360.Application`**:
  - DTOs, casos de uso e interfaces de servicio (`IFacturacionService`, `IPagoService`, `IDashboardService`, `IBackupService`, `IPdfService`).
- **`FacturaPro360.Infrastructure`**:
  - `FacturaProDbContext` con Entity Framework Core 8.
  - Soporte conmutable: **SQLite** (listo para ejecutar de inmediato sin instalacion previa) o **SQL Server Express**.
  - Transacciones atomicas explicitas (`BeginTransactionAsync` / `CommitAsync`), bloqueo de concurrencia y prevencion de duplicados.
  - Implementaciones de servicio de facturacion, emision de recibos y exportacion.
- **`FacturaPro360.Wpf`**:
  - Interfaz grafica moderna con patron **MVVM** (`CommunityToolkit.Mvvm`).
  - Navegacion lateral reactiva, diseno en modo oscuro/indigo, calculo en tiempo real con decimales exactos.
  - Vistas: Dashboard con KPIs, Catalogo de Facturas con estados de color, Asistente de Nueva Factura, Detalle con pagos e impresion, Clientes, Productos y Respaldo de BD.
- **`FacturaPro360.Tests`**:
  - Pruebas xUnit que validan las operaciones transaccionales criticas (emision con descuento de stock, invalidacion de sobrepagos y reversion integra al anular).

---

## Como Ejecutar

### Requisitos
- Windows 10/11
- .NET 8 SDK instalado (o Visual Studio 2022 con la carga de trabajo de Escritorio .NET).

### Compilacion y Ejecucion
1. Abrir la solucion `FacturaPro360.sln` en Visual Studio 2022, o ejecutar por consola:
   ```powershell
   dotnet build
   dotnet run --project src/FacturaPro360.Wpf/FacturaPro360.Wpf.csproj
   ```
2. Al iniciar por primera vez, el sistema crea automaticamente la base de datos local y carga datos demo iniciales (empresa, clientes, productos, numeracion).

### Cambiar entre SQLite y SQL Server
En `src/FacturaPro360.Wpf/appsettings.json`:
- Para SQLite local (predeterminado):
   ```json
   "DatabaseProvider": "Sqlite",
   "ConnectionStrings": {
     "DefaultConnection": "Data Source=facturapro360_local.db"
   }
   ```
- Para Microsoft SQL Server Express:
   ```json
   "DatabaseProvider": "SqlServer",
   "ConnectionStrings": {
     "SqlServerConnection": "Server=localhost\\SQLEXPRESS;Database=FacturaPro360Db;Trusted_Connection=True;TrustServerCertificate=True;"
   }
   ```

---

## Ejecutar Pruebas
```powershell
dotnet test tests/FacturaPro360.Tests/FacturaPro360.Tests.csproj
```
