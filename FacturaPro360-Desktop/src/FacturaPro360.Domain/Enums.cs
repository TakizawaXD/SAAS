namespace FacturaPro360.Domain;

public enum RolUsuario
{
    SuperAdmin,
    Administrador,
    Vendedor,
    Cajero,
    Contador
}

public enum TipoDocumentoCliente
{
    RucNit,
    Cedula,
    Pasaporte,
    ConsumidorFinal
}

public enum TipoProducto
{
    Producto,
    Servicio
}

public enum EstadoFactura
{
    Borrador,
    Emitida,
    Parcial,
    Pagada,
    Anulada
}

public enum MetodoPago
{
    Efectivo,
    TarjetaCredito,
    TarjetaDebito,
    Transferencia,
    Cheque,
    Otro
}

public enum TipoMovimientoInventario
{
    EntradaCompra,
    SalidaVenta,
    AnulacionVenta,
    AjustePositivo,
    AjusteNegativo
}
