using FacturaPro360.Domain;

namespace FacturaPro360.Application;

public interface IFacturacionService
{
    Task<Factura> EmitirFacturaAsync(CrearFacturaRequest request, CancellationToken ct = default);
    Task<Factura> AnularFacturaAsync(AnularFacturaRequest request, CancellationToken ct = default);
    Task<List<FacturaDto>> ObtenerFacturasAsync(Guid empresaId, EstadoFactura? estado = null, CancellationToken ct = default);
    Task<FacturaDto?> ObtenerFacturaPorIdAsync(Guid facturaId, CancellationToken ct = default);
}

public interface IPagoService
{
    Task<Pago> RegistrarPagoAsync(RegistrarPagoRequest request, CancellationToken ct = default);
    Task<List<Pago>> ObtenerPagosPorFacturaAsync(Guid facturaId, CancellationToken ct = default);
}

public interface IDashboardService
{
    Task<DashboardKpisDto> ObtenerKpisAsync(Guid empresaId, CancellationToken ct = default);
}

public record RespaldoInfo(
    string NombreArchivo,
    string RutaCompleta,
    DateTime FechaCreacion,
    long TamanoBytes,
    string Tipo,
    string HashSha256
)
{
    public string TamanoFormateado => TamanoBytes < 1024 * 1024 
        ? $"{TamanoBytes / 1024.0:F1} KB" 
        : $"{TamanoBytes / (1024.0 * 1024.0):F2} MB";

    public string HashCorto => string.IsNullOrEmpty(HashSha256) || HashSha256.Length < 16 
        ? "N/A" 
        : HashSha256[..16] + "...";
}

public interface IBackupService
{
    Task<string> CrearRespaldoManualAsync(string rutaDestino, CancellationToken ct = default);
    Task<string> CrearRespaldoAutomaticoAsync(string rutaDestino, CancellationToken ct = default);
    List<RespaldoInfo> ListarRespaldos(string rutaDestino);
    Task RestaurarRespaldoAsync(string rutaArchivo, CancellationToken ct = default);
    Task EjecutarCheckpointWalAsync(CancellationToken ct = default);
}

public interface IPdfService
{
    byte[] GenerarFacturaPdf(FacturaDto factura, Empresa empresa);
}
