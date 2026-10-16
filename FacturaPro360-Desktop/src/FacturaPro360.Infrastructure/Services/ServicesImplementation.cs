using FacturaPro360.Application;
using FacturaPro360.Domain;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text.Json;

namespace FacturaPro360.Infrastructure.Services;

public class FacturacionService : IFacturacionService
{
    private readonly FacturaProDbContext _context;

    public FacturacionService(FacturaProDbContext context)
    {
        _context = context;
    }

    public async Task<Factura> EmitirFacturaAsync(CrearFacturaRequest request, CancellationToken ct = default)
    {
        if (request.Items == null || !request.Items.Any())
            throw new DomainException("La factura debe tener al menos un ítem.");

        using var tx = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            // 1. Obtener y bloquear numeración de la sucursal
            var numeracion = await _context.Numeraciones
                .FirstOrDefaultAsync(n => n.EmpresaId == request.EmpresaId && n.SucursalId == request.SucursalId && n.TipoDocumento == "FACTURA" && n.Activo, ct);

            if (numeracion == null)
            {
                numeracion = new Numeracion
                {
                    EmpresaId = request.EmpresaId,
                    SucursalId = request.SucursalId,
                    TipoDocumento = "FACTURA",
                    Prefijo = "FAC",
                    SiguienteNumero = 1,
                    LongitudNumero = 8
                };
                _context.Numeraciones.Add(numeracion);
                await _context.SaveChangesAsync(ct);
            }

            int consecutivo = numeracion.SiguienteNumero;
            numeracion.SiguienteNumero++;
            numeracion.UpdatedAt = DateTime.UtcNow;

            string numeroFactura = $"{numeracion.Prefijo}-{consecutivo.ToString().PadLeft(numeracion.LongitudNumero, '0')}";

            // 2. Crear entidad factura
            var factura = new Factura
            {
                EmpresaId = request.EmpresaId,
                SucursalId = request.SucursalId,
                UsuarioId = request.UsuarioId,
                ClienteId = request.ClienteId,
                NumeroFactura = numeroFactura,
                Prefijo = numeracion.Prefijo,
                Consecutivo = consecutivo,
                FechaEmision = DateTime.UtcNow,
                FechaVencimiento = request.FechaVencimiento,
                Notas = request.Notas,
                Estado = EstadoFactura.Emitida
            };

            decimal subtotal = 0;
            decimal descuentoTotal = 0;
            decimal impuestoTotal = 0;
            decimal total = 0;

            // 3. Procesar ítems, validar stock y generar kardex
            foreach (var itemReq in request.Items)
            {
                if (itemReq.Cantidad <= 0)
                    throw new DomainException("La cantidad debe ser mayor a 0.");

                if (itemReq.PrecioUnitario < 0)
                    throw new DomainException("El precio unitario no puede ser negativo.");

                if (itemReq.DescuentoPorcentaje < 0 || itemReq.DescuentoPorcentaje > 100)
                    throw new DomainException("El descuento debe estar entre 0% y 100%.");

                var producto = await _context.Productos
                    .FirstOrDefaultAsync(p => p.Id == itemReq.ProductoId && p.EmpresaId == request.EmpresaId, ct)
                    ?? throw new DomainException($"Producto no encontrado: {itemReq.ProductoId}");

                if (!producto.PermiteStockNegativo && producto.StockActual - itemReq.Cantidad < 0)
                {
                    throw new StockInsuficienteException(producto.Nombre, producto.StockActual, itemReq.Cantidad);
                }

                decimal itemSubtotal = Math.Round(itemReq.Cantidad * itemReq.PrecioUnitario, 2);
                decimal itemDesc = Math.Round(itemSubtotal * (itemReq.DescuentoPorcentaje / 100m), 2);
                decimal itemBase = itemSubtotal - itemDesc;
                decimal itemImpuesto = Math.Round(itemBase * (itemReq.IvaPorcentaje / 100m), 2);
                decimal itemTotal = itemBase + itemImpuesto;

                subtotal += itemSubtotal;
                descuentoTotal += itemDesc;
                impuestoTotal += itemImpuesto;
                total += itemTotal;

                var facturaItem = new FacturaItem
                {
                    Factura = factura,
                    ProductoId = producto.Id,
                    Descripcion = producto.Nombre,
                    Cantidad = itemReq.Cantidad,
                    PrecioUnitario = itemReq.PrecioUnitario,
                    DescuentoPorcentaje = itemReq.DescuentoPorcentaje,
                    IvaPorcentaje = itemReq.IvaPorcentaje,
                    Subtotal = itemSubtotal,
                    Impuesto = itemImpuesto,
                    Total = itemTotal
                };
                factura.Items.Add(facturaItem);

                // Descontar inventario
                producto.StockActual -= itemReq.Cantidad;
                producto.UpdatedAt = DateTime.UtcNow;

                // Registrar en Kardex
                var movKardex = new MovimientoInventario
                {
                    EmpresaId = request.EmpresaId,
                    ProductoId = producto.Id,
                    SucursalId = request.SucursalId,
                    Tipo = TipoMovimientoInventario.SalidaVenta,
                    Cantidad = itemReq.Cantidad,
                    CostoUnitario = producto.CostoPromedio,
                    ReferenciaDocumento = numeroFactura,
                    Observaciones = $"Venta Factura {numeroFactura}",
                    UsuarioId = request.UsuarioId,
                    Fecha = DateTime.UtcNow
                };
                _context.MovimientosInventario.Add(movKardex);
            }

            factura.Subtotal = subtotal;
            factura.DescuentoTotal = descuentoTotal;
            factura.ImpuestoTotal = impuestoTotal;
            factura.Total = total;
            factura.SaldoPendiente = total;

            _context.Facturas.Add(factura);

            // 4. Actualizar saldo del cliente
            var cliente = await _context.Clientes.FirstOrDefaultAsync(c => c.Id == request.ClienteId && c.EmpresaId == request.EmpresaId, ct)
                ?? throw new DomainException("Cliente no encontrado");

            if (cliente.LimiteCredito > 0 && (cliente.SaldoActual + total) > cliente.LimiteCredito)
            {
                throw new DomainException($"Riesgo de crédito bloqueado: La factura por ${total} supera el límite de crédito disponible (${cliente.LimiteCredito}). Saldo actual: ${cliente.SaldoActual}.");
            }

            cliente.SaldoActual += total;
            cliente.UpdatedAt = DateTime.UtcNow;

            // 5. Auditoría
            _context.Auditorias.Add(new Auditoria
            {
                EmpresaId = request.EmpresaId,
                UsuarioId = request.UsuarioId,
                Modulo = "FACTURAS",
                Accion = "EMITIR_FACTURA",
                RegistroId = factura.Id.ToString(),
                DatosNuevos = JsonSerializer.Serialize(new { factura.NumeroFactura, factura.Total, factura.ClienteId }),
                Fecha = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return factura;
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<Factura> AnularFacturaAsync(AnularFacturaRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Motivo))
            throw new DomainException("El motivo de anulación es obligatorio.");

        using var tx = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var factura = await _context.Facturas
                .Include(f => f.Items)
                .Include(f => f.Cliente)
                .FirstOrDefaultAsync(f => f.Id == request.FacturaId, ct)
                ?? throw new DomainException("Factura no encontrada.");

            if (factura.Estado == EstadoFactura.Anulada)
                throw new FacturaYaAnuladaException(factura.NumeroFactura);

            // Revertir inventario
            foreach (var item in factura.Items)
            {
                var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == item.ProductoId, ct);
                if (producto != null)
                {
                    producto.StockActual += item.Cantidad;
                    producto.UpdatedAt = DateTime.UtcNow;

                    _context.MovimientosInventario.Add(new MovimientoInventario
                    {
                        EmpresaId = factura.EmpresaId,
                        ProductoId = producto.Id,
                        SucursalId = factura.SucursalId,
                        Tipo = TipoMovimientoInventario.AnulacionVenta,
                        Cantidad = item.Cantidad,
                        CostoUnitario = item.PrecioUnitario,
                        ReferenciaDocumento = factura.NumeroFactura,
                        Observaciones = $"Anulación Factura {factura.NumeroFactura}: {request.Motivo}",
                        UsuarioId = request.UsuarioId,
                        Fecha = DateTime.UtcNow
                    });
                }
            }

            // Revertir saldo del cliente
            factura.Cliente.SaldoActual = Math.Max(0, factura.Cliente.SaldoActual - factura.SaldoPendiente);
            factura.Cliente.UpdatedAt = DateTime.UtcNow;

            factura.Estado = EstadoFactura.Anulada;
            factura.SaldoPendiente = 0;
            factura.MotivoAnulacion = request.Motivo;
            factura.FechaAnulacion = DateTime.UtcNow;
            factura.AnuladoPor = request.UsuarioId;
            factura.UpdatedAt = DateTime.UtcNow;

            _context.Auditorias.Add(new Auditoria
            {
                EmpresaId = factura.EmpresaId,
                UsuarioId = request.UsuarioId,
                Modulo = "FACTURAS",
                Accion = "ANULAR_FACTURA",
                RegistroId = factura.Id.ToString(),
                DatosNuevos = JsonSerializer.Serialize(new { factura.NumeroFactura, request.Motivo }),
                Fecha = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return factura;
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<List<FacturaDto>> ObtenerFacturasAsync(Guid empresaId, EstadoFactura? estado = null, CancellationToken ct = default)
    {
        var query = _context.Facturas
            .AsNoTracking()
            .Include(f => f.Cliente)
            .Include(f => f.Items)
            .Where(f => f.EmpresaId == empresaId);

        if (estado.HasValue)
            query = query.Where(f => f.Estado == estado.Value);

        var list = await query.OrderByDescending(f => f.FechaEmision).ToListAsync(ct);

        return list.Select(f => new FacturaDto(
            f.Id,
            f.NumeroFactura,
            f.FechaEmision,
            f.FechaVencimiento,
            f.Cliente.RazonSocial,
            f.Cliente.NumeroDocumento,
            f.Subtotal,
            f.DescuentoTotal,
            f.ImpuestoTotal,
            f.Total,
            f.SaldoPendiente,
            f.Estado,
            f.Notas,
            f.Items.Select(i => new FacturaItemDto(
                i.Id,
                i.ProductoId,
                i.Descripcion,
                "",
                i.Cantidad,
                i.PrecioUnitario,
                i.DescuentoPorcentaje,
                i.IvaPorcentaje,
                i.Subtotal,
                i.Impuesto,
                i.Total
            )).ToList()
        )).ToList();
    }

    public async Task<FacturaDto?> ObtenerFacturaPorIdAsync(Guid facturaId, CancellationToken ct = default)
    {
        var f = await _context.Facturas
            .AsNoTracking()
            .Include(x => x.Cliente)
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == facturaId, ct);

        if (f == null) return null;

        return new FacturaDto(
            f.Id,
            f.NumeroFactura,
            f.FechaEmision,
            f.FechaVencimiento,
            f.Cliente.RazonSocial,
            f.Cliente.NumeroDocumento,
            f.Subtotal,
            f.DescuentoTotal,
            f.ImpuestoTotal,
            f.Total,
            f.SaldoPendiente,
            f.Estado,
            f.Notas,
            f.Items.Select(i => new FacturaItemDto(
                i.Id,
                i.ProductoId,
                i.Descripcion,
                "",
                i.Cantidad,
                i.PrecioUnitario,
                i.DescuentoPorcentaje,
                i.IvaPorcentaje,
                i.Subtotal,
                i.Impuesto,
                i.Total
            )).ToList()
        );
    }
}

public class PagoService : IPagoService
{
    private readonly FacturaProDbContext _context;

    public PagoService(FacturaProDbContext context)
    {
        _context = context;
    }

    public async Task<Pago> RegistrarPagoAsync(RegistrarPagoRequest request, CancellationToken ct = default)
    {
        if (request.Monto <= 0)
            throw new DomainException("El monto del pago debe ser mayor que 0.");

        string idempotency = string.IsNullOrWhiteSpace(request.IdempotencyKey) 
            ? Guid.NewGuid().ToString() 
            : request.IdempotencyKey;

        if (await _context.Pagos.AnyAsync(p => p.IdempotencyKey == idempotency, ct))
            throw new DomainException("Pago duplicado detectado (Idempotency Key ya procesada).");

        using var tx = await _context.Database.BeginTransactionAsync(ct);
        try
        {
            var factura = await _context.Facturas
                .Include(f => f.Cliente)
                .FirstOrDefaultAsync(f => f.Id == request.FacturaId, ct)
                ?? throw new DomainException("Factura no encontrada.");

            if (factura.Estado == EstadoFactura.Anulada)
                throw new DomainException("No se pueden registrar pagos a una factura anulada.");

            if (factura.Estado == EstadoFactura.Pagada || factura.SaldoPendiente <= 0)
                throw new DomainException("La factura ya se encuentra totalmente pagada.");

            if (request.Monto > factura.SaldoPendiente)
                throw new SaldoExcedidoException(request.Monto, factura.SaldoPendiente);

            string reciboNum = $"REC-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

            var pago = new Pago
            {
                EmpresaId = factura.EmpresaId,
                FacturaId = factura.Id,
                UsuarioId = request.UsuarioId,
                NumeroRecibo = reciboNum,
                Monto = request.Monto,
                MetodoPago = request.MetodoPago,
                ReferenciaTransaccion = request.Referencia,
                Notas = request.Notas,
                IdempotencyKey = idempotency,
                FechaPago = DateTime.UtcNow
            };
            _context.Pagos.Add(pago);

            factura.SaldoPendiente -= request.Monto;
            if (factura.SaldoPendiente <= 0.005m)
            {
                factura.SaldoPendiente = 0;
                factura.Estado = EstadoFactura.Pagada;
            }
            else
            {
                factura.Estado = EstadoFactura.Parcial;
            }
            factura.UpdatedAt = DateTime.UtcNow;

            factura.Cliente.SaldoActual = Math.Max(0, factura.Cliente.SaldoActual - request.Monto);
            factura.Cliente.UpdatedAt = DateTime.UtcNow;

            _context.Auditorias.Add(new Auditoria
            {
                EmpresaId = factura.EmpresaId,
                UsuarioId = request.UsuarioId,
                Modulo = "PAGOS",
                Accion = "REGISTRAR_PAGO",
                RegistroId = pago.Id.ToString(),
                DatosNuevos = JsonSerializer.Serialize(new { pago.NumeroRecibo, pago.Monto, factura.SaldoPendiente }),
                Fecha = DateTime.UtcNow
            });

            await _context.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return pago;
        }
        catch
        {
            await tx.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<List<Pago>> ObtenerPagosPorFacturaAsync(Guid facturaId, CancellationToken ct = default)
    {
        return await _context.Pagos
            .AsNoTracking()
            .Where(p => p.FacturaId == facturaId)
            .OrderByDescending(p => p.FechaPago)
            .ToListAsync(ct);
    }
}

public class DashboardService : IDashboardService
{
    private readonly FacturaProDbContext _context;

    public DashboardService(FacturaProDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardKpisDto> ObtenerKpisAsync(Guid empresaId, CancellationToken ct = default)
    {
        var inicioMes = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

        var facturas = await _context.Facturas
            .AsNoTracking()
            .Where(f => f.EmpresaId == empresaId && f.Estado != EstadoFactura.Anulada)
            .ToListAsync(ct);

        decimal ventasMes = facturas.Where(f => f.FechaEmision >= inicioMes).Sum(f => f.Total);
        decimal totalPorCobrar = facturas.Sum(f => f.SaldoPendiente);
        int emitidasMes = facturas.Count(f => f.FechaEmision >= inicioMes);
        int vencidas = facturas.Count(f => f.SaldoPendiente > 0 && f.FechaVencimiento < DateTime.UtcNow.Date);

        var pagos = await _context.Pagos
            .AsNoTracking()
            .Where(p => p.EmpresaId == empresaId && p.FechaPago >= inicioMes)
            .ToListAsync(ct);
        decimal cobradoMes = pagos.Sum(p => p.Monto);

        int stockBajo = await _context.Productos
            .AsNoTracking()
            .CountAsync(p => p.EmpresaId == empresaId && p.Activo && p.StockActual <= p.StockMinimo, ct);

        return new DashboardKpisDto(
            ventasMes,
            cobradoMes,
            totalPorCobrar,
            emitidasMes,
            vencidas,
            stockBajo
        );
    }
}

public class BackupService : IBackupService
{
    private readonly FacturaProDbContext _context;

    public BackupService(FacturaProDbContext context)
    {
        _context = context;
    }

    public async Task EjecutarCheckpointWalAsync(CancellationToken ct = default)
    {
        try
        {
            string proveedor = _context.Database.ProviderName ?? "";
            if (proveedor.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                await _context.Database.ExecuteSqlRawAsync("PRAGMA wal_checkpoint(FULL);", ct);
            }
        }
        catch
        {
            // Ignorar en entornos de test InMemory o sin soporte WAL
        }
    }

    public async Task<string> CrearRespaldoManualAsync(string rutaDestino, CancellationToken ct = default)
    {
        return await GenerarCopiaRespaldoAsync(rutaDestino, "MANUAL", ct);
    }

    public async Task<string> CrearRespaldoAutomaticoAsync(string rutaDestino, CancellationToken ct = default)
    {
        string archivoGenerado = await GenerarCopiaRespaldoAsync(rutaDestino, "AUTO", ct);

        // Política de retención: Mantener los últimos 30 respaldos automáticos
        try
        {
            var dir = new DirectoryInfo(rutaDestino);
            if (dir.Exists)
            {
                var autos = dir.GetFiles("*_AUTO_*.bak")
                               .OrderByDescending(f => f.CreationTimeUtc)
                               .Skip(30)
                               .ToList();

                foreach (var viejo in autos)
                {
                    try 
                    { 
                        viejo.Delete(); 
                        string shaFile = viejo.FullName + ".sha256";
                        if (File.Exists(shaFile)) File.Delete(shaFile);
                    } 
                    catch { }
                }
            }
        }
        catch
        {
            // No interrumpir si la rotación falla
        }

        return archivoGenerado;
    }

    private async Task<string> GenerarCopiaRespaldoAsync(string rutaDestino, string prefijo, CancellationToken ct)
    {
        Directory.CreateDirectory(rutaDestino);
        await EjecutarCheckpointWalAsync(ct);

        string timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        string nombreArchivo = $"FacturaPro360_{prefijo}_{timestamp}.bak";
        string rutaCompleta = Path.Combine(rutaDestino, nombreArchivo);

        string proveedor = _context.Database.ProviderName ?? "";

        if (_context.Database.IsRelational() && proveedor.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            var connection = _context.Database.GetDbConnection();
            string dbFile = connection.DataSource;
            if (File.Exists(dbFile))
            {
                File.Copy(dbFile, rutaCompleta, true);
                await GuardarChecksumSha256Async(rutaCompleta, ct);
                return rutaCompleta;
            }
        }

        // Respaldo de contingencia estructurado
        var backupDump = new
        {
            Version = "1.0",
            GeneradoUtc = DateTime.UtcNow,
            Tipo = prefijo,
            Empresas = await _context.Empresas.AsNoTracking().ToListAsync(ct),
            Sucursales = await _context.Sucursales.AsNoTracking().ToListAsync(ct),
            Usuarios = await _context.Usuarios.AsNoTracking().ToListAsync(ct),
            Clientes = await _context.Clientes.AsNoTracking().ToListAsync(ct),
            Productos = await _context.Productos.AsNoTracking().ToListAsync(ct),
            Facturas = await _context.Facturas.Include(f => f.Items).AsNoTracking().ToListAsync(ct),
            Pagos = await _context.Pagos.AsNoTracking().ToListAsync(ct)
        };

        string jsonDump = JsonSerializer.Serialize(backupDump, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(rutaCompleta, jsonDump, ct);
        await GuardarChecksumSha256Async(rutaCompleta, ct);

        return rutaCompleta;
    }

    private async Task GuardarChecksumSha256Async(string rutaArchivo, CancellationToken ct)
    {
        try
        {
            using var sha256 = SHA256.Create();
            await using var stream = File.OpenRead(rutaArchivo);
            byte[] hashBytes = await sha256.ComputeHashAsync(stream, ct);
            string hashStr = Convert.ToHexString(hashBytes);
            await File.WriteAllTextAsync(rutaArchivo + ".sha256", hashStr, ct);
        }
        catch
        {
            // Opcional si no se puede escribir el checksum
        }
    }

    public List<RespaldoInfo> ListarRespaldos(string rutaDestino)
    {
        var lista = new List<RespaldoInfo>();
        if (!Directory.Exists(rutaDestino))
            return lista;

        var di = new DirectoryInfo(rutaDestino);
        var files = di.GetFiles("FacturaPro360_*.bak")
                      .OrderByDescending(f => f.CreationTimeUtc);

        foreach (var file in files)
        {
            string tipo = "MANUAL";
            if (file.Name.Contains("_AUTO_", StringComparison.OrdinalIgnoreCase))
                tipo = "AUTOMÁTICO";
            else if (file.Name.Contains("_PreRestore_", StringComparison.OrdinalIgnoreCase))
                tipo = "PRE-RESTAURACIÓN";

            string hash = "";
            string shaFile = file.FullName + ".sha256";
            if (File.Exists(shaFile))
            {
                try { hash = File.ReadAllText(shaFile).Trim(); } catch { }
            }

            lista.Add(new RespaldoInfo(
                file.Name,
                file.FullName,
                file.LastWriteTime,
                file.Length,
                tipo,
                hash
            ));
        }

        return lista;
    }

    public async Task RestaurarRespaldoAsync(string rutaArchivo, CancellationToken ct = default)
    {
        if (!File.Exists(rutaArchivo))
            throw new FileNotFoundException($"El archivo de respaldo no fue encontrado en: {rutaArchivo}");

        string proveedor = _context.Database.ProviderName ?? "";

        if (_context.Database.IsRelational() && proveedor.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
        {
            var connection = _context.Database.GetDbConnection();
            string dbFile = connection.DataSource;
            string dirDestino = Path.GetDirectoryName(rutaArchivo) ?? "";

            // 1. Crear respaldo preventivo del estado actual antes de sobrescribir
            await GenerarCopiaRespaldoAsync(dirDestino, "PreRestore_Safety", ct);

            // 2. Liberar conexiones abiertas para evitar bloqueos de archivo
            Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
            await connection.CloseAsync();

            // 3. Sobrescribir base de datos principal
            File.Copy(rutaArchivo, dbFile, true);

            // 4. Limpiar journals WAL y SHM remanentes para consistencia
            string walFile = dbFile + "-wal";
            string shmFile = dbFile + "-shm";
            if (File.Exists(walFile)) { try { File.Delete(walFile); } catch { } }
            if (File.Exists(shmFile)) { try { File.Delete(shmFile); } catch { } }
        }
        else
        {
            throw new NotSupportedException("La restauración directa solo está soportada para la base de datos local SQLite.");
        }
    }
}

public class SimplePdfService : IPdfService
{
    public byte[] GenerarFacturaPdf(FacturaDto factura, Empresa empresa)
    {
        // Generador de formato imprimible / texto estructurado de contingencia
        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms);
        writer.WriteLine("==================================================================");
        writer.WriteLine($"        {empresa.RazonSocial.ToUpper()}");
        writer.WriteLine($"        RUC / NIT: {empresa.IdentificacionFiscal}");
        writer.WriteLine($"        {empresa.Direccion} | Tel: {empresa.Telefono}");
        writer.WriteLine("==================================================================");
        writer.WriteLine($"FACTURA N°: {factura.NumeroFactura}");
        writer.WriteLine($"Fecha Emisión: {factura.FechaEmision:dd/MM/yyyy HH:mm}   Vence: {factura.FechaVencimiento:dd/MM/yyyy}");
        writer.WriteLine($"Cliente: {factura.ClienteNombre} (Doc: {factura.ClienteDocumento})");
        writer.WriteLine($"Estado: {factura.Estado}");
        writer.WriteLine("------------------------------------------------------------------");
        writer.WriteLine(string.Format("{0,-30} {1,8} {2,12} {3,12}", "DESCRIPCION", "CANT", "PRECIO", "TOTAL"));
        writer.WriteLine("------------------------------------------------------------------");
        foreach (var item in factura.Items)
        {
            string desc = item.ProductoNombre.Length > 28 ? item.ProductoNombre[..28] : item.ProductoNombre;
            writer.WriteLine(string.Format("{0,-30} {1,8:N2} {2,12:C2} {3,12:C2}", desc, item.Cantidad, item.PrecioUnitario, item.Total));
        }
        writer.WriteLine("------------------------------------------------------------------");
        writer.WriteLine(string.Format("{0,52} {1,12:C2}", "Subtotal:", factura.Subtotal));
        writer.WriteLine(string.Format("{0,52} {1,12:C2}", "Descuento:", factura.DescuentoTotal));
        writer.WriteLine(string.Format("{0,52} {1,12:C2}", "IVA / Impuestos:", factura.ImpuestoTotal));
        writer.WriteLine(string.Format("{0,52} {1,12:C2}", "TOTAL:", factura.Total));
        writer.WriteLine(string.Format("{0,52} {1,12:C2}", "Saldo Pendiente:", factura.SaldoPendiente));
        writer.WriteLine("==================================================================");
        writer.WriteLine("          Gracias por su compra - FacturaPro 360");
        writer.Flush();
        return ms.ToArray();
    }
}
