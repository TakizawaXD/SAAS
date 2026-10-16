using System.Windows;
using FacturaPro360.Application;
using FacturaPro360.Infrastructure;
using FacturaPro360.Infrastructure.Services;
using FacturaPro360.Wpf.ViewModels;
using FacturaPro360.Wpf.Views;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace FacturaPro360.Wpf;

public partial class App : System.Windows.Application
{
    private readonly IHost _host;

    public App()
    {
        _host = Host.CreateDefaultBuilder()
            .ConfigureAppConfiguration((context, config) =>
            {
                config.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
            })
            .ConfigureServices((context, services) =>
            {
                var config = context.Configuration;
                string provider = config.GetValue<string>("DatabaseProvider") ?? "Sqlite";

                if (provider.Equals("Supabase", StringComparison.OrdinalIgnoreCase) || provider.Equals("PostgreSql", StringComparison.OrdinalIgnoreCase))
                {
                    string connStr = config.GetConnectionString("SupabaseConnection") 
                        ?? "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=admin;";
                    services.AddDbContext<FacturaProDbContext>(options => options.UseNpgsql(connStr));
                }
                else if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
                {
                    string connStr = config.GetConnectionString("SqlServerConnection") 
                        ?? "Server=localhost;Database=FacturaPro360Db;Trusted_Connection=True;TrustServerCertificate=True;";
                    services.AddDbContext<FacturaProDbContext>(options => options.UseSqlServer(connStr));
                }
                else
                {
                    string connStr = config.GetConnectionString("DefaultConnection") ?? "Data Source=facturapro360_local.db";
                    services.AddDbContext<FacturaProDbContext>(options => options.UseSqlite(connStr));
                }

                // Servicios de aplicación
                services.AddScoped<IFacturacionService, FacturacionService>();
                services.AddScoped<IPagoService, PagoService>();
                services.AddScoped<IDashboardService, DashboardService>();
                services.AddScoped<IBackupService, BackupService>();
                services.AddScoped<IPdfService, SimplePdfService>();

                // ViewModels
                services.AddSingleton<MainViewModel>();
                services.AddTransient<DashboardViewModel>();
                services.AddTransient<FacturasViewModel>();
                services.AddTransient<NuevaFacturaViewModel>();
                services.AddTransient<DetalleFacturaViewModel>();
                services.AddTransient<ClientesViewModel>();
                services.AddTransient<ProductosViewModel>();
                services.AddSingleton<BackupViewModel>();

                // Vistas
                services.AddSingleton<MainWindow>();
            })
            .Build();
    }

    protected override async void OnStartup(StartupEventArgs e)
    {
        await _host.StartAsync();

        // Inicializar y sembrar base de datos si es nueva con optimizaciones de alta velocidad
        using (var scope = _host.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FacturaProDbContext>();
            db.Database.EnsureCreated();
            try
            {
                // Optimización SQLite AAA: Modo WAL (Write-Ahead Logging) + Cache en memoria
                db.Database.ExecuteSqlRaw("PRAGMA journal_mode = WAL;");
                db.Database.ExecuteSqlRaw("PRAGMA synchronous = NORMAL;");
                db.Database.ExecuteSqlRaw("PRAGMA cache_size = -64000;");
                db.Database.ExecuteSqlRaw("PRAGMA temp_store = MEMORY;");
            }
            catch
            {
                // Ignorar en proveedores que no sean SQLite
            }
            db.SeedInitialData();
        }

        // Iniciar servicio guardián de auto-respaldo continuo
        _ = _host.Services.GetRequiredService<BackupViewModel>();

        var mainWindow = _host.Services.GetRequiredService<MainWindow>();
        mainWindow.Show();

        base.OnStartup(e);
    }

    protected override async void OnExit(ExitEventArgs e)
    {
        using (_host)
        {
            await _host.StopAsync();
        }
        base.OnExit(e);
    }
}
