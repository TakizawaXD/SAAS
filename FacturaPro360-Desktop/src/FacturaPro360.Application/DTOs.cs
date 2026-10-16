using FacturaPro360.Domain;

namespace FacturaPro360.Application;

public record CrearFacturaItemRequest(
    Guid ProductoId,
    decimal Cantidad,
    decimal PrecioUnitario,
    decimal DescuentoPorcentaje = 0.00m,
    decimal IvaPorcentaje = 16.00m
);

public record CrearFacturaRequest(
    Guid EmpresaId,
    Guid SucursalId,
    Guid UsuarioId,
    Guid ClienteId,
    DateTime FechaVencimiento,
    List<CrearFacturaItemRequest> Items,
    string? Notas = null
);

public record RegistrarPagoRequest(
    Guid FacturaId,
    Guid UsuarioId,
    decimal Monto,
    MetodoPago MetodoPago,
    string? Referencia = null,
    string? Notas = null,
    string? IdempotencyKey = null
);

public record AnularFacturaRequest(
    Guid FacturaId,
    Guid UsuarioId,
    string Motivo
);

public record FacturaItemDto(
    Guid Id,
    Guid ProductoId,
    string ProductoNombre,
    string Sku,
    decimal Cantidad,
    decimal PrecioUnitario,
    decimal DescuentoPorcentaje,
    decimal IvaPorcentaje,
    decimal Subtotal,
    decimal Impuesto,
    decimal Total
);

public record FacturaDto(
    Guid Id,
    string NumeroFactura,
    DateTime FechaEmision,
    DateTime FechaVencimiento,
    string ClienteNombre,
    string ClienteDocumento,
    decimal Subtotal,
    decimal DescuentoTotal,
    decimal ImpuestoTotal,
    decimal Total,
    decimal SaldoPendiente,
    EstadoFactura Estado,
    string? Notas,
    List<FacturaItemDto> Items
);

public record DashboardKpisDto(
    decimal TotalVentasMes,
    decimal TotalCobradoMes,
    decimal TotalPorCobrar,
    int FacturasEmitidasMes,
    int FacturasVencidas,
    int ProductosStockBajo
);
