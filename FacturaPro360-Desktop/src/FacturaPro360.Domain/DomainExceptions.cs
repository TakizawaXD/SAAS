namespace FacturaPro360.Domain;

public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
}

public class StockInsuficienteException : DomainException
{
    public StockInsuficienteException(string producto, decimal disponible, decimal solicitado)
        : base($"Stock insuficiente para '{producto}'. Disponible: {disponible}, Solicitado: {solicitado}") { }
}

public class SaldoExcedidoException : DomainException
{
    public SaldoExcedidoException(decimal monto, decimal saldoPendiente)
        : base($"El monto del pago ({monto:N2}) excede el saldo pendiente ({saldoPendiente:N2})") { }
}

public class FacturaYaAnuladaException : DomainException
{
    public FacturaYaAnuladaException(string numeroFactura)
        : base($"La factura '{numeroFactura}' ya ha sido anulada.") { }
}
