using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using FacturaPro360.Application;
using FacturaPro360.Domain;
using FacturaPro360.Infrastructure;
using Microsoft.EntityFrameworkCore;
using System.Collections.ObjectModel;
using System.IO;
using System.Windows;

namespace FacturaPro360.Wpf.ViewModels;

public abstract class ViewModelBase : ObservableObject
{
}

public partial class MainViewModel : ViewModelBase
{
    private readonly IServiceProvider _serviceProvider;

    [ObservableProperty]
    private ViewModelBase _currentView = null!;

    [ObservableProperty]
    private string _activeViewTitle = "Dashboard";

    [ObservableProperty]
    private string _empresaNombre = "FacturaPro Soluciones S.A.S.";

    [ObservableProperty]
    private string _usuarioNombre = "Admin (Sede Central)";

    public MainViewModel(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
        NavegarADashboard();
    }

    [RelayCommand]
    public void NavegarADashboard()
    {
        CurrentView = (ViewModelBase)_serviceProvider.GetService(typeof(DashboardViewModel))!;
        ActiveViewTitle = "Panel de Control / Dashboard";
    }

    [RelayCommand]
    public void NavegarAFacturas()
    {
        CurrentView = (ViewModelBase)_serviceProvider.GetService(typeof(FacturasViewModel))!;
        ActiveViewTitle = "Ventas y Facturación";
    }

    [RelayCommand]
    public void NavegarANuevaFactura()
    {
        CurrentView = (ViewModelBase)_serviceProvider.GetService(typeof(NuevaFacturaViewModel))!;
        ActiveViewTitle = "Emitir Nueva Factura";
    }

    [RelayCommand]
    public void NavegarAClientes()
    {
        CurrentView = (ViewModelBase)_serviceProvider.GetService(typeof(ClientesViewModel))!;
        ActiveViewTitle = "Gestión de Clientes";
    }

    [RelayCommand]
    public void NavegarAProductos()
    {
        CurrentView = (ViewModelBase)_serviceProvider.GetService(typeof(ProductosViewModel))!;
        ActiveViewTitle = "Inventario y Productos";
    }

    [RelayCommand]
    public void NavegarABackup()
    {
        CurrentView = (ViewModelBase)_serviceProvider.GetService(typeof(BackupViewModel))!;
        ActiveViewTitle = "Respaldo y Seguridad de BD";
    }

    public void MostrarDetalleFactura(Guid facturaId)
    {
        var vm = (DetalleFacturaViewModel)_serviceProvider.GetService(typeof(DetalleFacturaViewModel))!;
        vm.CargarFactura(facturaId);
        CurrentView = vm;
        ActiveViewTitle = "Detalle de Factura";
    }
}

public partial class DashboardViewModel : ViewModelBase
{
    private readonly IDashboardService _dashboardService;
    private readonly Guid _empresaId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [ObservableProperty]
    private decimal _ventasMes;

    [ObservableProperty]
    private decimal _cobradoMes;

    [ObservableProperty]
    private decimal _totalPorCobrar;

    [ObservableProperty]
    private int _facturasEmitidasMes;

    [ObservableProperty]
    private int _facturasVencidas;

    [ObservableProperty]
    private int _productosStockBajo;

    public DashboardViewModel(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
        _ = CargarDatosAsync();
    }

    [RelayCommand]
    public async Task CargarDatosAsync()
    {
        try
        {
            var kpis = await _dashboardService.ObtenerKpisAsync(_empresaId);
            VentasMes = kpis.TotalVentasMes;
            CobradoMes = kpis.TotalCobradoMes;
            TotalPorCobrar = kpis.TotalPorCobrar;
            FacturasEmitidasMes = kpis.FacturasEmitidasMes;
            FacturasVencidas = kpis.FacturasVencidas;
            ProductosStockBajo = kpis.ProductosStockBajo;
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Error al cargar dashboard: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }
}

public partial class FacturasViewModel : ViewModelBase
{
    private readonly IFacturacionService _facturacionService;
    private readonly MainViewModel _mainViewModel;
    private readonly Guid _empresaId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [ObservableProperty]
    private ObservableCollection<FacturaDto> _facturas = new();

    [ObservableProperty]
    private FacturaDto? _facturaSeleccionada;

    public FacturasViewModel(IFacturacionService facturacionService, MainViewModel mainViewModel)
    {
        _facturacionService = facturacionService;
        _mainViewModel = mainViewModel;
        _ = CargarFacturasAsync();
    }

    [RelayCommand]
    public async Task CargarFacturasAsync()
    {
        var lista = await _facturacionService.ObtenerFacturasAsync(_empresaId);
        Facturas = new ObservableCollection<FacturaDto>(lista);
    }

    [RelayCommand]
    public void IrANuevaFactura()
    {
        _mainViewModel.NavegarANuevaFactura();
    }

    [RelayCommand]
    public void VerDetalle(FacturaDto? factura)
    {
        var target = factura ?? FacturaSeleccionada;
        if (target != null)
        {
            _mainViewModel.MostrarDetalleFactura(target.Id);
        }
    }
}

public partial class ItemFacturaEdicion : ObservableObject
{
    public Producto Producto { get; set; } = null!;

    [ObservableProperty]
    private decimal _cantidad = 1;

    [ObservableProperty]
    private decimal _precioUnitario;

    [ObservableProperty]
    private decimal _descuentoPorcentaje = 0;

    [ObservableProperty]
    private decimal _ivaPorcentaje = 16;

    public decimal Subtotal => Math.Round(Cantidad * PrecioUnitario, 2);
    public decimal Descuento => Math.Round(Subtotal * (DescuentoPorcentaje / 100m), 2);
    public decimal BaseImponible => Subtotal - Descuento;
    public decimal Impuesto => Math.Round(BaseImponible * (IvaPorcentaje / 100m), 2);
    public decimal Total => BaseImponible + Impuesto;

    partial void OnCantidadChanged(decimal value) => NotificarTotales();
    partial void OnPrecioUnitarioChanged(decimal value) => NotificarTotales();
    partial void OnDescuentoPorcentajeChanged(decimal value) => NotificarTotales();

    private void NotificarTotales()
    {
        OnPropertyChanged(nameof(Subtotal));
        OnPropertyChanged(nameof(Descuento));
        OnPropertyChanged(nameof(BaseImponible));
        OnPropertyChanged(nameof(Impuesto));
        OnPropertyChanged(nameof(Total));
    }
}

public partial class NuevaFacturaViewModel : ViewModelBase
{
    private readonly IFacturacionService _facturacionService;
    private readonly FacturaProDbContext _db;
    private readonly MainViewModel _mainViewModel;

    private readonly Guid _empresaId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private readonly Guid _sucursalId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private readonly Guid _usuarioId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [ObservableProperty]
    private ObservableCollection<Cliente> _clientes = new();

    [ObservableProperty]
    private Cliente? _clienteSeleccionado;

    [ObservableProperty]
    private ObservableCollection<Producto> _catalogoProductos = new();

    [ObservableProperty]
    private Producto? _productoSeleccionado;

    [ObservableProperty]
    private ObservableCollection<ItemFacturaEdicion> _items = new();

    [ObservableProperty]
    private DateTime _fechaVencimiento = DateTime.Today.AddDays(15);

    [ObservableProperty]
    private string? _notas;

    [ObservableProperty]
    private decimal _subtotal;

    [ObservableProperty]
    private decimal _descuentoTotal;

    [ObservableProperty]
    private decimal _impuestoTotal;

    [ObservableProperty]
    private decimal _total;

    public NuevaFacturaViewModel(IFacturacionService facturacionService, FacturaProDbContext db, MainViewModel mainViewModel)
    {
        _facturacionService = facturacionService;
        _db = db;
        _mainViewModel = mainViewModel;
        _ = CargarCatalogosAsync();
    }

    private async Task CargarCatalogosAsync()
    {
        var clientesList = await _db.Clientes.Where(c => c.EmpresaId == _empresaId && c.Activo).ToListAsync();
        Clientes = new ObservableCollection<Cliente>(clientesList);
        if (Clientes.Any()) ClienteSeleccionado = Clientes.First();

        var prodList = await _db.Productos.Where(p => p.EmpresaId == _empresaId && p.Activo).ToListAsync();
        CatalogoProductos = new ObservableCollection<Producto>(prodList);
        if (CatalogoProductos.Any()) ProductoSeleccionado = CatalogoProductos.First();
    }

    [RelayCommand]
    public void AgregarProducto()
    {
        if (ProductoSeleccionado == null) return;

        var existente = Items.FirstOrDefault(i => i.Producto.Id == ProductoSeleccionado.Id);
        if (existente != null)
        {
            existente.Cantidad++;
        }
        else
        {
            var item = new ItemFacturaEdicion
            {
                Producto = ProductoSeleccionado,
                Cantidad = 1,
                PrecioUnitario = ProductoSeleccionado.PrecioVenta,
                IvaPorcentaje = ProductoSeleccionado.IvaPorcentaje
            };
            item.PropertyChanged += (s, e) => RecalcularTotales();
            Items.Add(item);
        }

        RecalcularTotales();
    }

    [RelayCommand]
    public void EliminarItem(ItemFacturaEdicion item)
    {
        Items.Remove(item);
        RecalcularTotales();
    }

    public void RecalcularTotales()
    {
        Subtotal = Items.Sum(i => i.Subtotal);
        DescuentoTotal = Items.Sum(i => i.Descuento);
        ImpuestoTotal = Items.Sum(i => i.Impuesto);
        Total = Items.Sum(i => i.Total);
    }

    [RelayCommand]
    public async Task EmitirFacturaAsync()
    {
        if (ClienteSeleccionado == null)
        {
            MessageBox.Show("Seleccione un cliente.", "Validación", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (!Items.Any())
        {
            MessageBox.Show("Agregue al menos un producto a la factura.", "Validación", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        try
        {
            var request = new CrearFacturaRequest(
                _empresaId,
                _sucursalId,
                _usuarioId,
                ClienteSeleccionado.Id,
                FechaVencimiento,
                Items.Select(i => new CrearFacturaItemRequest(
                    i.Producto.Id,
                    i.Cantidad,
                    i.PrecioUnitario,
                    i.DescuentoPorcentaje,
                    i.IvaPorcentaje
                )).ToList(),
                Notas
            );

            var factura = await _facturacionService.EmitirFacturaAsync(request);

            MessageBox.Show($"¡Factura {factura.NumeroFactura} emitida exitosamente por un total de {factura.Total:C2}!", 
                "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);

            _mainViewModel.MostrarDetalleFactura(factura.Id);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Error al emitir factura: {ex.Message}", "Error Transaccional", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }
}

public partial class DetalleFacturaViewModel : ViewModelBase
{
    private readonly IFacturacionService _facturacionService;
    private readonly IPagoService _pagoService;
    private readonly IPdfService _pdfService;
    private readonly FacturaProDbContext _db;

    [ObservableProperty]
    private FacturaDto? _factura;

    [ObservableProperty]
    private ObservableCollection<Pago> _pagos = new();

    [ObservableProperty]
    private decimal _montoPago;

    [ObservableProperty]
    private MetodoPago _metodoPago = MetodoPago.Efectivo;

    public DetalleFacturaViewModel(IFacturacionService facturacionService, IPagoService pagoService, IPdfService pdfService, FacturaProDbContext db)
    {
        _facturacionService = facturacionService;
        _pagoService = pagoService;
        _pdfService = pdfService;
        _db = db;
    }

    public async void CargarFactura(Guid facturaId)
    {
        Factura = await _facturacionService.ObtenerFacturaPorIdAsync(facturaId);
        if (Factura != null)
        {
            MontoPago = Factura.SaldoPendiente;
            var listaPagos = await _pagoService.ObtenerPagosPorFacturaAsync(facturaId);
            Pagos = new ObservableCollection<Pago>(listaPagos);
        }
    }

    [RelayCommand]
    public async Task RegistrarPagoAsync()
    {
        if (Factura == null || MontoPago <= 0) return;

        try
        {
            var req = new RegistrarPagoRequest(
                Factura.Id,
                Guid.Parse("33333333-3333-3333-3333-333333333333"),
                MontoPago,
                MetodoPago,
                "Pago Ventanilla"
            );

            var pago = await _pagoService.RegistrarPagoAsync(req);
            MessageBox.Show($"Pago registrado exitosamente con recibo {pago.NumeroRecibo}.", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
            CargarFactura(Factura.Id);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Error", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    [RelayCommand]
    public async Task AnularFacturaAsync()
    {
        if (Factura == null) return;

        var confirm = MessageBox.Show($"¿Está seguro de anular la factura {Factura.NumeroFactura}? Esta acción revertirá inventarios y saldos.", 
            "Confirmar Anulación", MessageBoxButton.YesNo, MessageBoxImage.Warning);

        if (confirm != MessageBoxResult.Yes) return;

        try
        {
            var req = new AnularFacturaRequest(
                Factura.Id,
                Guid.Parse("33333333-3333-3333-3333-333333333333"),
                "Anulación solicitada por el usuario"
            );

            await _facturacionService.AnularFacturaAsync(req);
            MessageBox.Show("Factura anulada correctamente.", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
            CargarFactura(Factura.Id);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Error", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    [RelayCommand]
    public void ImprimirPdf()
    {
        if (Factura == null) return;
        var empresa = _db.Empresas.FirstOrDefault(e => e.Id == Guid.Parse("11111111-1111-1111-1111-111111111111"));
        if (empresa == null) return;

        var bytes = _pdfService.GenerarFacturaPdf(Factura, empresa);
        string tempPath = Path.Combine(Path.GetTempPath(), $"{Factura.NumeroFactura}.txt");
        File.WriteAllBytes(tempPath, bytes);

        System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(tempPath) { UseShellExecute = true });
    }
}

public partial class ClientesViewModel : ViewModelBase
{
    private readonly FacturaProDbContext _db;
    private readonly Guid _empresaId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [ObservableProperty]
    private ObservableCollection<Cliente> _clientes = new();

    [ObservableProperty]
    private string _nuevoDocumento = "";

    [ObservableProperty]
    private string _nuevaRazonSocial = "";

    [ObservableProperty]
    private string _nuevoTelefono = "";

    [ObservableProperty]
    private string _nuevoEmail = "";

    [ObservableProperty]
    private Cliente? _clienteSeleccionado;

    public ClientesViewModel(FacturaProDbContext db)
    {
        _db = db;
        _ = CargarClientesAsync();
    }

    public async Task CargarClientesAsync()
    {
        var list = await _db.Clientes.AsNoTracking()
            .Where(c => c.EmpresaId == _empresaId)
            .OrderBy(c => c.RazonSocial)
            .ToListAsync();
        Clientes = new ObservableCollection<Cliente>(list);
    }

    [RelayCommand]
    public async Task CrearClienteAsync()
    {
        if (string.IsNullOrWhiteSpace(NuevoDocumento) || string.IsNullOrWhiteSpace(NuevaRazonSocial))
        {
            MessageBox.Show("El documento y la razón social son obligatorios.", "Validación", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var cliente = new Cliente
        {
            EmpresaId = _empresaId,
            TipoDocumento = TipoDocumentoCliente.RucNit,
            NumeroDocumento = NuevoDocumento.Trim(),
            RazonSocial = NuevaRazonSocial.Trim(),
            Telefono = NuevoTelefono.Trim(),
            Email = NuevoEmail.Trim(),
            LimiteCredito = 2000m,
            SaldoActual = 0m,
            Activo = true
        };

        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync();

        NuevoDocumento = "";
        NuevaRazonSocial = "";
        NuevoTelefono = "";
        NuevoEmail = "";

        await CargarClientesAsync();
        MessageBox.Show("Cliente creado con éxito en la base de datos local.", "Operación Exitosa", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    [RelayCommand]
    public async Task EliminarClienteAsync(Cliente? cliente)
    {
        var target = cliente ?? ClienteSeleccionado;
        if (target == null) return;

        // Modal de confirmación obligatoria "¿Estás seguro?"
        var confirm = MessageBox.Show(
            $"¿Estás seguro de que deseas eliminar permanentemente al cliente \"{target.RazonSocial}\" ({target.NumeroDocumento})?\n\nEsta acción no se puede deshacer.",
            "¿Estás seguro?",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (confirm != MessageBoxResult.Yes) return;

        // Validación estricta de seguridad financiera: No eliminar deudores
        if (target.SaldoActual > 0)
        {
            MessageBox.Show(
                $"Acción Bloqueada por Seguridad Financiera:\n\nNo se puede eliminar a \"{target.RazonSocial}\" porque mantiene una deuda pendiente de {target.SaldoActual:C2}.\n\nDebe registrar sus cobros o anular facturas antes de retirarlo del sistema.",
                "Bloqueo Financiero",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
            return;
        }

        var entidad = await _db.Clientes.FindAsync(target.Id);
        if (entidad != null)
        {
            _db.Clientes.Remove(entidad);
            await _db.SaveChangesAsync();
            await CargarClientesAsync();
            MessageBox.Show("Cliente eliminado satisfactoriamente.", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
        }
    }
}

public partial class ProductosViewModel : ViewModelBase
{
    private readonly FacturaProDbContext _db;
    private readonly Guid _empresaId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [ObservableProperty]
    private ObservableCollection<Producto> _productos = new();

    [ObservableProperty]
    private Producto? _productoSeleccionado;

    [ObservableProperty]
    private string _nuevoSku = "";

    [ObservableProperty]
    private string _nuevoNombre = "";

    [ObservableProperty]
    private decimal _nuevoPrecioVenta = 100;

    [ObservableProperty]
    private decimal _nuevoCosto = 60;

    [ObservableProperty]
    private decimal _nuevoStock = 10;

    public ProductosViewModel(FacturaProDbContext db)
    {
        _db = db;
        _ = CargarProductosAsync();
    }

    public async Task CargarProductosAsync()
    {
        var list = await _db.Productos.AsNoTracking()
            .Where(p => p.EmpresaId == _empresaId && p.Activo)
            .OrderBy(p => p.Nombre)
            .ToListAsync();
        Productos = new ObservableCollection<Producto>(list);
    }

    [RelayCommand]
    public async Task CrearProductoAsync()
    {
        if (string.IsNullOrWhiteSpace(NuevoSku) || string.IsNullOrWhiteSpace(NuevoNombre))
        {
            MessageBox.Show("El SKU y el nombre del producto son obligatorios.", "Validación", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        if (NuevoPrecioVenta < 0 || NuevoCosto < 0 || NuevoStock < 0)
        {
            MessageBox.Show("Los valores de precio, costo y stock no pueden ser negativos.", "Validación Financiera", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        var producto = new Producto
        {
            EmpresaId = _empresaId,
            SKU = NuevoSku.Trim().ToUpper(),
            Nombre = NuevoNombre.Trim(),
            PrecioVenta = NuevoPrecioVenta,
            CostoPromedio = NuevoCosto,
            StockActual = NuevoStock,
            StockMinimo = 2,
            IvaPorcentaje = 16,
            Activo = true
        };

        _db.Productos.Add(producto);
        await _db.SaveChangesAsync();

        NuevoSku = "";
        NuevoNombre = "";
        NuevoPrecioVenta = 100;
        NuevoCosto = 60;
        NuevoStock = 10;

        await CargarProductosAsync();
        MessageBox.Show("Producto registrado exitosamente en el catálogo.", "Operación Exitosa", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    [RelayCommand]
    public async Task EliminarProductoAsync(Producto? producto)
    {
        var target = producto ?? ProductoSeleccionado;
        if (target == null) return;

        // Modal de confirmación obligatoria "¿Estás seguro?"
        var confirm = MessageBox.Show(
            $"¿Estás seguro de que deseas eliminar el producto \"{target.Nombre}\" (SKU: {target.SKU})?\n\nEsta acción afectará los registros de inventario.",
            "¿Estás seguro?",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (confirm != MessageBoxResult.Yes) return;

        var entidad = await _db.Productos.FindAsync(target.Id);
        if (entidad == null) return;

        // Verificación de integridad contable:
        bool tieneFacturas = await _db.FacturaItems.AnyAsync(fi => fi.ProductoId == target.Id);
        if (tieneFacturas)
        {
            entidad.Activo = false;
            entidad.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await CargarProductosAsync();
            MessageBox.Show(
                $"Protección Contable Activa:\n\nEl producto \"{target.Nombre}\" figura en facturas históricas emitidas. Se desactivó del catálogo para proteger los balances contables sin corromper reportes fiscales.",
                "Catálogo Actualizado",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
            return;
        }

        _db.Productos.Remove(entidad);
        await _db.SaveChangesAsync();
        await CargarProductosAsync();
        MessageBox.Show("Producto eliminado definitivamente del inventario.", "Éxito", MessageBoxButton.OK, MessageBoxImage.Information);
    }
}

public partial class BackupViewModel : ViewModelBase
{
    private readonly IBackupService _backupService;
    private readonly System.Timers.Timer _autoBackupTimer;

    [ObservableProperty]
    private string _rutaDestino = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "FacturaPro360_Respaldos");

    [ObservableProperty]
    private string _mensajeResultado = "";

    [ObservableProperty]
    private string _ultimoRespaldo = "Iniciando sistema de protección...";

    [ObservableProperty]
    private int _intervaloMinutos = 15;

    [ObservableProperty]
    private bool _autoBackupActivo = true;

    [ObservableProperty]
    private int _totalRespaldos;

    [ObservableProperty]
    private string _espacioTotalOcupado = "0 KB";

    [ObservableProperty]
    private ObservableCollection<RespaldoInfo> _historialRespaldos = new();

    [ObservableProperty]
    private RespaldoInfo? _respaldoSeleccionado;

    public BackupViewModel(IBackupService backupService)
    {
        _backupService = backupService;

        // Configurar timer de respaldo automático en segundo plano
        _autoBackupTimer = new System.Timers.Timer(IntervaloMinutos * 60 * 1000);
        _autoBackupTimer.Elapsed += async (_, _) => await EjecutarRespaldoAutomaticoProgramadoAsync();
        _autoBackupTimer.AutoReset = true;
        _autoBackupTimer.Start();

        // Cargar historial y realizar primer respaldo protector al inicio
        _ = IniciarProteccionAsync();
    }

    private async Task IniciarProteccionAsync()
    {
        try
        {
            Directory.CreateDirectory(RutaDestino);
            await _backupService.CrearRespaldoAutomaticoAsync(RutaDestino);
            UltimoRespaldo = $"{DateTime.Now:dd/MM/yyyy HH:mm:ss} (Arranque Seguro)";
            await CargarHistorialAsync();
        }
        catch (Exception ex)
        {
            MensajeResultado = $"Alerta en auto-respaldo inicial: {ex.Message}";
        }
    }

    private async Task EjecutarRespaldoAutomaticoProgramadoAsync()
    {
        if (!AutoBackupActivo) return;

        try
        {
            await _backupService.CrearRespaldoAutomaticoAsync(RutaDestino);
            System.Windows.Application.Current?.Dispatcher.Invoke(() =>
            {
                UltimoRespaldo = $"{DateTime.Now:dd/MM/yyyy HH:mm:ss} (Automático WAL)";
                CargarHistorial();
            });
        }
        catch (Exception ex)
        {
            System.Windows.Application.Current?.Dispatcher.Invoke(() =>
            {
                MensajeResultado = $"Error en respaldo automático: {ex.Message}";
            });
        }
    }

    [RelayCommand]
    public void CargarHistorial()
    {
        try
        {
            var items = _backupService.ListarRespaldos(RutaDestino);
            HistorialRespaldos.Clear();
            long totalBytes = 0;

            foreach (var item in items)
            {
                HistorialRespaldos.Add(item);
                totalBytes += item.TamanoBytes;
            }

            TotalRespaldos = HistorialRespaldos.Count;
            EspacioTotalOcupado = totalBytes < 1024 * 1024
                ? $"{totalBytes / 1024.0:F1} KB"
                : $"{totalBytes / (1024.0 * 1024.0):F2} MB";
        }
        catch (Exception ex)
        {
            MensajeResultado = $"Error al leer respaldos: {ex.Message}";
        }
    }

    public Task CargarHistorialAsync()
    {
        CargarHistorial();
        return Task.CompletedTask;
    }

    [RelayCommand]
    public async Task RealizarRespaldoManualAsync()
    {
        try
        {
            string archivoGenerado = await _backupService.CrearRespaldoManualAsync(RutaDestino);
            MensajeResultado = $"Respaldo manual generado con éxito:\n{Path.GetFileName(archivoGenerado)}";
            UltimoRespaldo = $"{DateTime.Now:dd/MM/yyyy HH:mm:ss} (Manual)";
            CargarHistorial();
            MessageBox.Show(MensajeResultado, "Respaldo Creado", MessageBoxButton.OK, MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MensajeResultado = $"Error al generar respaldo: {ex.Message}";
            MessageBox.Show(MensajeResultado, "Error", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    [RelayCommand]
    public async Task RestaurarRespaldoAsync()
    {
        if (RespaldoSeleccionado == null)
        {
            MessageBox.Show("Por favor seleccione un archivo de respaldo de la lista para restaurar.", "Seleccionar Respaldo", MessageBoxButton.OK, MessageBoxImage.Information);
            return;
        }

        var confirmacion = MessageBox.Show(
            $"¿Estás seguro de que deseas restaurar la base de datos desde este respaldo?\n\n" +
            $"Archivo: {RespaldoSeleccionado.NombreArchivo}\n" +
            $"Fecha: {RespaldoSeleccionado.FechaCreacion:dd/MM/yyyy HH:mm:ss}\n" +
            $"Tipo: {RespaldoSeleccionado.Tipo}\n\n" +
            $"ADVERTENCIA DE SEGURIDAD:\n" +
            $"Se creará automáticamente una copia preventiva del estado actual antes de sobrescribir los datos.",
            "Confirmar Restauración de Emergencia",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (confirmacion != MessageBoxResult.Yes) return;

        try
        {
            await _backupService.RestaurarRespaldoAsync(RespaldoSeleccionado.RutaCompleta);
            CargarHistorial();
            MessageBox.Show(
                "Base de datos restaurada exitosamente.\n\n" +
                "Se generó una copia preventiva previa con prefijo 'PreRestore_Safety' para máxima seguridad.",
                "Restauración Completada",
                MessageBoxButton.OK,
                MessageBoxImage.Information);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Error crítico al restaurar la base de datos: {ex.Message}", "Error de Restauración", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }

    [RelayCommand]
    public void AbrirCarpetaRespaldos()
    {
        try
        {
            Directory.CreateDirectory(RutaDestino);
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = RutaDestino,
                UseShellExecute = true,
                Verb = "open"
            });
        }
        catch (Exception ex)
        {
            MessageBox.Show($"No se pudo abrir la carpeta: {ex.Message}", "Aviso", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    [RelayCommand]
    public void EliminarRespaldo()
    {
        if (RespaldoSeleccionado == null) return;

        var confirmacion = MessageBox.Show(
            $"¿Estás seguro de que deseas eliminar permanentemente el archivo de respaldo:\n{RespaldoSeleccionado.NombreArchivo}?",
            "Confirmar Eliminación de Respaldo",
            MessageBoxButton.YesNo,
            MessageBoxImage.Warning);

        if (confirmacion == MessageBoxResult.Yes)
        {
            try
            {
                if (File.Exists(RespaldoSeleccionado.RutaCompleta))
                    File.Delete(RespaldoSeleccionado.RutaCompleta);

                string sha = RespaldoSeleccionado.RutaCompleta + ".sha256";
                if (File.Exists(sha)) File.Delete(sha);

                CargarHistorial();
                MessageBox.Show("Archivo de respaldo eliminado.", "Operación Correcta", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Error al eliminar el archivo: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }
}
