using FacturaPro360.Application;
using FacturaPro360.Domain;
using FacturaPro360.Infrastructure;
using FacturaPro360.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace FacturaPro360.Tests;

public class FacturacionTests
{
    private FacturaProDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<FacturaProDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        var context = new FacturaProDbContext(options);
        context.SeedInitialData();
        return context;
    }

    [Fact]
    public async Task EmitirFactura_CalculaTotalesYDescuentaStock_Correctamente()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new FacturacionService(context);

        var empresa = await context.Empresas.FirstAsync();
        var sucursal = await context.Sucursales.FirstAsync();
        var usuario = await context.Usuarios.FirstAsync();
        var cliente = await context.Clientes.FirstAsync();
        var producto = await context.Productos.FirstAsync(p => p.SKU == "PRD-LAP-001");

        decimal stockInicial = producto.StockActual;

        var request = new CrearFacturaRequest(
            empresa.Id,
            sucursal.Id,
            usuario.Id,
            cliente.Id,
            DateTime.UtcNow.AddDays(15),
            new List<CrearFacturaItemRequest>
            {
                new(producto.Id, 2, producto.PrecioVenta, 0, 16)
            }
        );

        // Act
        var factura = await service.EmitirFacturaAsync(request);

        // Assert
        Assert.NotNull(factura);
        Assert.StartsWith("FAC-", factura.NumeroFactura);
        Assert.Equal(2 * producto.PrecioVenta * 1.16m, factura.Total);
        Assert.Equal(factura.Total, factura.SaldoPendiente);

        // Verificar descuento en stock
        var productoActualizado = await context.Productos.FindAsync(producto.Id);
        Assert.Equal(stockInicial - 2, productoActualizado!.StockActual);
    }

    [Fact]
    public async Task EmitirFactura_LanzaExcepcion_SiStockInsuficiente()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new FacturacionService(context);

        var empresa = await context.Empresas.FirstAsync();
        var sucursal = await context.Sucursales.FirstAsync();
        var usuario = await context.Usuarios.FirstAsync();
        var cliente = await context.Clientes.FirstAsync();
        var producto = await context.Productos.FirstAsync(p => p.SKU == "PRD-LAP-001");

        var request = new CrearFacturaRequest(
            empresa.Id,
            sucursal.Id,
            usuario.Id,
            cliente.Id,
            DateTime.UtcNow.AddDays(15),
            new List<CrearFacturaItemRequest>
            {
                new(producto.Id, 9999, producto.PrecioVenta, 0, 16)
            }
        );

        // Act & Assert
        await Assert.ThrowsAsync<StockInsuficienteException>(() => service.EmitirFacturaAsync(request));
    }

    [Fact]
    public async Task RegistrarPago_ActualizaSaldoYEstado_Pagada()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var factService = new FacturacionService(context);
        var pagoService = new PagoService(context);

        var empresa = await context.Empresas.FirstAsync();
        var sucursal = await context.Sucursales.FirstAsync();
        var usuario = await context.Usuarios.FirstAsync();
        var cliente = await context.Clientes.FirstAsync();
        var producto = await context.Productos.FirstAsync(p => p.SKU == "PRD-IMP-002");

        var factura = await factService.EmitirFacturaAsync(new CrearFacturaRequest(
            empresa.Id, sucursal.Id, usuario.Id, cliente.Id, DateTime.UtcNow.AddDays(10),
            new List<CrearFacturaItemRequest> { new(producto.Id, 1, producto.PrecioVenta, 0, 16) }
        ));

        // Act (Pago completo)
        var pago = await pagoService.RegistrarPagoAsync(new RegistrarPagoRequest(
            factura.Id, usuario.Id, factura.Total, MetodoPago.Efectivo, "Pago Completo"
        ));

        // Assert
        Assert.NotNull(pago);
        var facturaActualizada = await context.Facturas.FindAsync(factura.Id);
        Assert.Equal(0, facturaActualizada!.SaldoPendiente);
        Assert.Equal(EstadoFactura.Pagada, facturaActualizada.Estado);
    }

    [Fact]
    public async Task RegistrarPago_LanzaExcepcion_SiMontoExcedeSaldo()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var factService = new FacturacionService(context);
        var pagoService = new PagoService(context);

        var empresa = await context.Empresas.FirstAsync();
        var sucursal = await context.Sucursales.FirstAsync();
        var usuario = await context.Usuarios.FirstAsync();
        var cliente = await context.Clientes.FirstAsync();
        var producto = await context.Productos.FirstAsync(p => p.SKU == "PRD-LEC-003");

        var factura = await factService.EmitirFacturaAsync(new CrearFacturaRequest(
            empresa.Id, sucursal.Id, usuario.Id, cliente.Id, DateTime.UtcNow.AddDays(10),
            new List<CrearFacturaItemRequest> { new(producto.Id, 1, producto.PrecioVenta, 0, 16) }
        ));

        // Act & Assert
        await Assert.ThrowsAsync<SaldoExcedidoException>(() => pagoService.RegistrarPagoAsync(new RegistrarPagoRequest(
            factura.Id, usuario.Id, factura.Total + 500, MetodoPago.Efectivo
        )));
    }

    [Fact]
    public async Task AnularFactura_RevierteInventarioYSaldo()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var factService = new FacturacionService(context);

        var empresa = await context.Empresas.FirstAsync();
        var sucursal = await context.Sucursales.FirstAsync();
        var usuario = await context.Usuarios.FirstAsync();
        var cliente = await context.Clientes.FirstAsync();
        var producto = await context.Productos.FirstAsync(p => p.SKU == "PRD-LAP-001");
        decimal stockOriginal = producto.StockActual;

        var factura = await factService.EmitirFacturaAsync(new CrearFacturaRequest(
            empresa.Id, sucursal.Id, usuario.Id, cliente.Id, DateTime.UtcNow.AddDays(10),
            new List<CrearFacturaItemRequest> { new(producto.Id, 1, producto.PrecioVenta, 0, 16) }
        ));

        // Act
        var anulada = await factService.AnularFacturaAsync(new AnularFacturaRequest(
            factura.Id, usuario.Id, "Cliente canceló el pedido"
        ));

        // Assert
        Assert.Equal(EstadoFactura.Anulada, anulada.Estado);
        Assert.Equal(0, anulada.SaldoPendiente);

        var productoRestaurado = await context.Productos.FindAsync(producto.Id);
        Assert.Equal(stockOriginal, productoRestaurado!.StockActual);
    }

    [Fact]
    public async Task EmitirFactura_LanzaExcepcion_SiCantidadEsNegativaOZero()
    {
        using var context = CreateInMemoryDbContext();
        var service = new FacturacionService(context);

        var empresa = await context.Empresas.FirstAsync();
        var sucursal = await context.Sucursales.FirstAsync();
        var usuario = await context.Usuarios.FirstAsync();
        var cliente = await context.Clientes.FirstAsync();
        var producto = await context.Productos.FirstAsync();

        // Intento absurdo de cantidad negativa (-50)
        var requestNegativo = new CrearFacturaRequest(
            empresa.Id, sucursal.Id, usuario.Id, cliente.Id, DateTime.UtcNow.AddDays(15),
            new List<CrearFacturaItemRequest> { new(producto.Id, -50, producto.PrecioVenta, 0, 16) }
        );

        await Assert.ThrowsAsync<DomainException>(() => service.EmitirFacturaAsync(requestNegativo));

        // Intento de cantidad cero (0)
        var requestCero = new CrearFacturaRequest(
            empresa.Id, sucursal.Id, usuario.Id, cliente.Id, DateTime.UtcNow.AddDays(15),
            new List<CrearFacturaItemRequest> { new(producto.Id, 0, producto.PrecioVenta, 0, 16) }
        );

        await Assert.ThrowsAsync<DomainException>(() => service.EmitirFacturaAsync(requestCero));
    }

    [Fact]
    public async Task EmitirFactura_LanzaExcepcion_SiPrecioUnitarioEsNegativo()
    {
        using var context = CreateInMemoryDbContext();
        var service = new FacturacionService(context);

        var empresa = await context.Empresas.FirstAsync();
        var sucursal = await context.Sucursales.FirstAsync();
        var usuario = await context.Usuarios.FirstAsync();
        var cliente = await context.Clientes.FirstAsync();
        var producto = await context.Productos.FirstAsync();

        // Intento malicioso de precio negativo (-5000)
        var request = new CrearFacturaRequest(
            empresa.Id, sucursal.Id, usuario.Id, cliente.Id, DateTime.UtcNow.AddDays(15),
            new List<CrearFacturaItemRequest> { new(producto.Id, 1, -5000m, 0, 16) }
        );

        await Assert.ThrowsAsync<DomainException>(() => service.EmitirFacturaAsync(request));
    }

    [Fact]
    public async Task EmitirFactura_LanzaExcepcion_SiDescuentoEsInvalido()
    {
        using var context = CreateInMemoryDbContext();
        var service = new FacturacionService(context);

        var empresa = await context.Empresas.FirstAsync();
        var sucursal = await context.Sucursales.FirstAsync();
        var usuario = await context.Usuarios.FirstAsync();
        var cliente = await context.Clientes.FirstAsync();
        var producto = await context.Productos.FirstAsync();

        // Intento de descuento absurdo del 195%
        var requestMayor100 = new CrearFacturaRequest(
            empresa.Id, sucursal.Id, usuario.Id, cliente.Id, DateTime.UtcNow.AddDays(15),
            new List<CrearFacturaItemRequest> { new(producto.Id, 1, producto.PrecioVenta, 195m, 16) }
        );

        await Assert.ThrowsAsync<DomainException>(() => service.EmitirFacturaAsync(requestMayor100));

        // Intento de descuento negativo (-20%)
        var requestNegativo = new CrearFacturaRequest(
            empresa.Id, sucursal.Id, usuario.Id, cliente.Id, DateTime.UtcNow.AddDays(15),
            new List<CrearFacturaItemRequest> { new(producto.Id, 1, producto.PrecioVenta, -20m, 16) }
        );

        await Assert.ThrowsAsync<DomainException>(() => service.EmitirFacturaAsync(requestNegativo));
    }

    [Fact]
    public async Task EmitirFactura_LanzaExcepcion_SiItemsVacio()
    {
        using var context = CreateInMemoryDbContext();
        var service = new FacturacionService(context);

        var empresa = await context.Empresas.FirstAsync();
        var sucursal = await context.Sucursales.FirstAsync();
        var usuario = await context.Usuarios.FirstAsync();
        var cliente = await context.Clientes.FirstAsync();

        var requestVacio = new CrearFacturaRequest(
            empresa.Id, sucursal.Id, usuario.Id, cliente.Id, DateTime.UtcNow.AddDays(15),
            new List<CrearFacturaItemRequest>()
        );

        await Assert.ThrowsAsync<DomainException>(() => service.EmitirFacturaAsync(requestVacio));
    }

    [Fact]
    public async Task EmitirFactura_LanzaExcepcion_SiExcedeLimiteDeCredito()
    {
        using var context = CreateInMemoryDbContext();
        var service = new FacturacionService(context);

        var empresa = await context.Empresas.FirstAsync();
        var sucursal = await context.Sucursales.FirstAsync();
        var usuario = await context.Usuarios.FirstAsync();
        var cliente = await context.Clientes.FirstAsync();
        var producto = await context.Productos.FirstAsync();

        // Asignar límite estricto de crédito de $100
        cliente.LimiteCredito = 100m;
        cliente.SaldoActual = 0m;
        await context.SaveChangesAsync();

        // Intentar facturar producto de $1500 (> $100)
        var request = new CrearFacturaRequest(
            empresa.Id, sucursal.Id, usuario.Id, cliente.Id, DateTime.UtcNow.AddDays(15),
            new List<CrearFacturaItemRequest> { new(producto.Id, 1, 1500m, 0, 16) }
        );

        await Assert.ThrowsAsync<DomainException>(() => service.EmitirFacturaAsync(request));
    }

    [Fact]
    public async Task BackupService_CrearRespaldo_GeneraArchivoBakYSha256()
    {
        using var context = CreateInMemoryDbContext();
        var backupService = new BackupService(context);
        string tempDir = Path.Combine(Path.GetTempPath(), "FacturaPro360_TestBackups_" + Guid.NewGuid().ToString("N"));

        try
        {
            // Generar respaldo manual
            string rutaManual = await backupService.CrearRespaldoManualAsync(tempDir);
            Assert.True(File.Exists(rutaManual), "El archivo .bak manual debe existir.");
            Assert.True(File.Exists(rutaManual + ".sha256"), "El checksum .sha256 debe existir.");

            // Generar respaldo automático
            string rutaAuto = await backupService.CrearRespaldoAutomaticoAsync(tempDir);
            Assert.True(File.Exists(rutaAuto), "El archivo .bak automático debe existir.");
            Assert.True(File.Exists(rutaAuto + ".sha256"), "El checksum .sha256 automático debe existir.");

            // Listar respaldos
            var lista = backupService.ListarRespaldos(tempDir);
            Assert.Equal(2, lista.Count);
            Assert.Contains(lista, r => r.Tipo == "MANUAL");
            Assert.Contains(lista, r => r.Tipo == "AUTOMÁTICO");
            Assert.All(lista, r => Assert.False(string.IsNullOrEmpty(r.HashSha256)));
        }
        finally
        {
            if (Directory.Exists(tempDir))
            {
                Directory.Delete(tempDir, true);
            }
        }
    }
}
