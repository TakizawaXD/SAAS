using FacturaPro360.Domain;
using Microsoft.EntityFrameworkCore;

namespace FacturaPro360.Infrastructure;

public class FacturaProDbContext : DbContext
{
    public FacturaProDbContext(DbContextOptions<FacturaProDbContext> options) : base(options) { }

    public DbSet<Empresa> Empresas => Set<Empresa>();
    public DbSet<Sucursal> Sucursales => Set<Sucursal>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();
    public DbSet<Numeracion> Numeraciones => Set<Numeracion>();
    public DbSet<Factura> Facturas => Set<Factura>();
    public DbSet<FacturaItem> FacturaItems => Set<FacturaItem>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Auditoria> Auditorias => Set<Auditoria>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Precisiones numéricas estándar
        foreach (var property in modelBuilder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetPrecision(18);
            property.SetScale(2);
        }

        // Especificar escala 3 para cantidades de inventario
        modelBuilder.Entity<Producto>().Property(p => p.StockActual).HasPrecision(18, 3);
        modelBuilder.Entity<Producto>().Property(p => p.StockMinimo).HasPrecision(18, 3);
        modelBuilder.Entity<FacturaItem>().Property(i => i.Cantidad).HasPrecision(18, 3);
        modelBuilder.Entity<MovimientoInventario>().Property(m => m.Cantidad).HasPrecision(18, 3);

        // Empresa
        modelBuilder.Entity<Empresa>()
            .HasIndex(e => e.IdentificacionFiscal)
            .IsUnique();

        // Numeración
        modelBuilder.Entity<Numeracion>()
            .HasIndex(n => new { n.EmpresaId, n.SucursalId, n.TipoDocumento })
            .IsUnique();

        // Concurrencia
        modelBuilder.Entity<Numeracion>()
            .Property(n => n.RowVersion)
            .IsRowVersion();

        modelBuilder.Entity<Factura>()
            .Property(f => f.RowVersion)
            .IsRowVersion();

        // Factura
        modelBuilder.Entity<Factura>()
            .HasIndex(f => new { f.EmpresaId, f.NumeroFactura })
            .IsUnique();

        // Cliente
        modelBuilder.Entity<Cliente>()
            .HasIndex(c => new { c.EmpresaId, c.NumeroDocumento })
            .IsUnique();

        // Producto
        modelBuilder.Entity<Producto>()
            .HasIndex(p => new { p.EmpresaId, p.SKU })
            .IsUnique();

        // Pago
        modelBuilder.Entity<Pago>()
            .HasIndex(p => p.IdempotencyKey)
            .IsUnique();
    }

    public void SeedInitialData()
    {
        if (Empresas.Any()) return;

        var empresa = new Empresa
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            RazonSocial = "FacturaPro Soluciones S.A.S.",
            NombreComercial = "FacturaPro Desktop Local",
            IdentificacionFiscal = "901234567-8",
            Direccion = "Av. Central 100, Piso 5",
            Telefono = "+57 300 1234567",
            Correo = "contacto@facturapro360.com",
            Moneda = "USD",
            SimboloMoneda = "$"
        };
        Empresas.Add(empresa);

        var sucursal = new Sucursal
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            EmpresaId = empresa.Id,
            Codigo = "SUC-01",
            Nombre = "Sede Principal Local",
            EsPrincipal = true
        };
        Sucursales.Add(sucursal);

        var usuario = new Usuario
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            EmpresaId = empresa.Id,
            SucursalId = sucursal.Id,
            NombreCompleto = "Administrador del Sistema",
            Email = "admin@facturapro360.com",
            Rol = RolUsuario.SuperAdmin,
            PasswordHash = "admin123"
        };
        Usuarios.Add(usuario);

        var numeracion = new Numeracion
        {
            EmpresaId = empresa.Id,
            SucursalId = sucursal.Id,
            TipoDocumento = "FACTURA",
            Prefijo = "FAC",
            SiguienteNumero = 1,
            LongitudNumero = 8
        };
        Numeraciones.Add(numeracion);

        var clientes = new List<Cliente>
        {
            new() { EmpresaId = empresa.Id, TipoDocumento = TipoDocumentoCliente.RucNit, NumeroDocumento = "900888777-1", RazonSocial = "Distribuidora del Norte C.A.", NombreContacto = "Carlos Mendoza", Email = "cmendoza@norte.com", Telefono = "+57 311 9876543", LimiteCredito = 5000 },
            new() { EmpresaId = empresa.Id, TipoDocumento = TipoDocumentoCliente.Cedula, NumeroDocumento = "1098765432", RazonSocial = "Ana María Valenzuela", Email = "ana.valenzuela@gmail.com", Telefono = "+57 320 5551234", LimiteCredito = 1200 },
            new() { EmpresaId = empresa.Id, TipoDocumento = TipoDocumentoCliente.ConsumidorFinal, NumeroDocumento = "999999999", RazonSocial = "Cliente Mostrador / Venta Rápida", Email = "ventas@facturapro360.com" }
        };
        Clientes.AddRange(clientes);

        var productos = new List<Producto>
        {
            new() { EmpresaId = empresa.Id, SKU = "PRD-LAP-001", CodigoBarras = "7891234567890", Nombre = "Laptop Lenovo ThinkPad 16GB", PrecioVenta = 1150.00m, CostoPromedio = 850.00m, StockActual = 15.000m, StockMinimo = 3.000m, IvaPorcentaje = 16.00m },
            new() { EmpresaId = empresa.Id, SKU = "PRD-IMP-002", CodigoBarras = "7891234567891", Nombre = "Impresora Térmica 80mm ESC/POS USB", PrecioVenta = 185.00m, CostoPromedio = 110.00m, StockActual = 25.000m, StockMinimo = 5.000m, IvaPorcentaje = 16.00m },
            new() { EmpresaId = empresa.Id, SKU = "PRD-LEC-003", CodigoBarras = "7891234567892", Nombre = "Lector Código de Barras 1D/2D QR", PrecioVenta = 65.00m, CostoPromedio = 38.00m, StockActual = 40.000m, StockMinimo = 8.000m, IvaPorcentaje = 16.00m },
            new() { EmpresaId = empresa.Id, SKU = "SRV-POL-004", CodigoBarras = "7891234567893", Nombre = "Póliza Mensual Soporte IT y Servidores", Tipo = TipoProducto.Servicio, PrecioVenta = 250.00m, StockActual = 999.000m, PermiteStockNegativo = true, IvaPorcentaje = 16.00m }
        };
        Productos.AddRange(productos);

        SaveChanges();
    }
}
