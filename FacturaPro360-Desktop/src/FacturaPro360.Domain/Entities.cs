namespace FacturaPro360.Domain;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Empresa : BaseEntity
{
    public string RazonSocial { get; set; } = string.Empty;
    public string? NombreComercial { get; set; }
    public string IdentificacionFiscal { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string Moneda { get; set; } = "USD";
    public string SimboloMoneda { get; set; } = "$";
    public string ZonaHoraria { get; set; } = "America/Bogota";
    public string? LogoUrl { get; set; }
    public bool Activo { get; set; } = true;

    public ICollection<Sucursal> Sucursales { get; set; } = new List<Sucursal>();
    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}

public class Sucursal : BaseEntity
{
    public Guid EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Direccion { get; set; }
    public string? Telefono { get; set; }
    public bool EsPrincipal { get; set; } = false;
    public bool Activo { get; set; } = true;
}

public class Usuario : BaseEntity
{
    public Guid EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;
    public Guid? SucursalId { get; set; }
    public Sucursal? Sucursal { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public RolUsuario Rol { get; set; } = RolUsuario.Vendedor;
    public bool Activo { get; set; } = true;
}

public class Cliente : BaseEntity
{
    public Guid EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;
    public TipoDocumentoCliente TipoDocumento { get; set; } = TipoDocumentoCliente.RucNit;
    public string NumeroDocumento { get; set; } = string.Empty;
    public string RazonSocial { get; set; } = string.Empty;
    public string? NombreContacto { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? Direccion { get; set; }
    public decimal LimiteCredito { get; set; } = 0.00m;
    public decimal SaldoActual { get; set; } = 0.00m;
    public bool Activo { get; set; } = true;
}

public class Categoria : BaseEntity
{
    public Guid EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
}

public class Producto : BaseEntity
{
    public Guid EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;
    public Guid? CategoriaId { get; set; }
    public Categoria? Categoria { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string? CodigoBarras { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public TipoProducto Tipo { get; set; } = TipoProducto.Producto;
    public string UnidadMedida { get; set; } = "UND";
    public decimal PrecioVenta { get; set; } = 0.00m;
    public decimal CostoPromedio { get; set; } = 0.00m;
    public decimal StockActual { get; set; } = 0.000m;
    public decimal StockMinimo { get; set; } = 5.000m;
    public bool PermiteStockNegativo { get; set; } = false;
    public decimal IvaPorcentaje { get; set; } = 16.00m;
    public bool Activo { get; set; } = true;
}

public class MovimientoInventario : BaseEntity
{
    public Guid EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;
    public Guid ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;
    public Guid? SucursalId { get; set; }
    public Sucursal? Sucursal { get; set; }
    public TipoMovimientoInventario Tipo { get; set; }
    public decimal Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
    public string? ReferenciaDocumento { get; set; }
    public string? Observaciones { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public Guid? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
}

public class Numeracion : BaseEntity
{
    public Guid EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;
    public Guid SucursalId { get; set; }
    public Sucursal Sucursal { get; set; } = null!;
    public string TipoDocumento { get; set; } = "FACTURA";
    public string Prefijo { get; set; } = "FAC";
    public int SiguienteNumero { get; set; } = 1;
    public int LongitudNumero { get; set; } = 8;
    public bool Activo { get; set; } = true;
    public byte[]? RowVersion { get; set; }
}

public class Factura : BaseEntity
{
    public Guid EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;
    public Guid SucursalId { get; set; }
    public Sucursal Sucursal { get; set; } = null!;
    public Guid UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public Guid ClienteId { get; set; }
    public Cliente Cliente { get; set; } = null!;

    public string NumeroFactura { get; set; } = string.Empty;
    public string Prefijo { get; set; } = "FAC";
    public int Consecutivo { get; set; }
    public DateTime FechaEmision { get; set; } = DateTime.UtcNow;
    public DateTime FechaVencimiento { get; set; }
    
    public decimal Subtotal { get; set; } = 0.00m;
    public decimal DescuentoTotal { get; set; } = 0.00m;
    public decimal ImpuestoTotal { get; set; } = 0.00m;
    public decimal Total { get; set; } = 0.00m;
    public decimal SaldoPendiente { get; set; } = 0.00m;

    public EstadoFactura Estado { get; set; } = EstadoFactura.Emitida;
    public string? Notas { get; set; }
    public string? MotivoAnulacion { get; set; }
    public DateTime? FechaAnulacion { get; set; }
    public Guid? AnuladoPor { get; set; }

    public byte[]? RowVersion { get; set; }

    public ICollection<FacturaItem> Items { get; set; } = new List<FacturaItem>();
    public ICollection<Pago> Pagos { get; set; } = new List<Pago>();
}

public class FacturaItem : BaseEntity
{
    public Guid FacturaId { get; set; }
    public Factura Factura { get; set; } = null!;
    public Guid ProductoId { get; set; }
    public Producto Producto { get; set; } = null!;

    public string Descripcion { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal DescuentoPorcentaje { get; set; } = 0.00m;
    public decimal IvaPorcentaje { get; set; } = 16.00m;
    public decimal Subtotal { get; set; }
    public decimal Impuesto { get; set; }
    public decimal Total { get; set; }
}

public class Pago : BaseEntity
{
    public Guid EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;
    public Guid FacturaId { get; set; }
    public Factura Factura { get; set; } = null!;
    public Guid UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;

    public string NumeroRecibo { get; set; } = string.Empty;
    public DateTime FechaPago { get; set; } = DateTime.UtcNow;
    public decimal Monto { get; set; }
    public MetodoPago MetodoPago { get; set; } = MetodoPago.Efectivo;
    public string? ReferenciaTransaccion { get; set; }
    public string? Notas { get; set; }
    public string IdempotencyKey { get; set; } = string.Empty;
}

public class Auditoria
{
    public long Id { get; set; }
    public Guid EmpresaId { get; set; }
    public Guid? UsuarioId { get; set; }
    public string Modulo { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string? RegistroId { get; set; }
    public string? DatosAnteriores { get; set; }
    public string? DatosNuevos { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
}
