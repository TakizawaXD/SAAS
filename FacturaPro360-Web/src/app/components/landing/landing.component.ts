import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface ModuloInfo {
  id: string;
  tag: string;
  titulo: string;
  descripcion: string;
  puntos: string[];
  icono: string;
  metricas: { valor: string; label: string }[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent {
  menuMovilAbierto = signal<boolean>(false);
  faqAbierto = signal<number | null>(0);
  tabActivo = signal<string>('facturacion');
  tabHeroActivo = signal<'dashboard' | 'facturacion' | 'kardex' | 'escritorio'>('dashboard');
  frecuenciaPago = signal<'mensual' | 'anual'>('mensual');

  setTabHero(tab: 'dashboard' | 'facturacion' | 'kardex' | 'escritorio'): void {
    this.tabHeroActivo.set(tab);
  }

  modulos: ModuloInfo[] = [
    {
      id: 'facturacion',
      tag: 'VENTAS & EMISIÓN',
      titulo: 'Facturación Electrónica Ultra Rápida y Segura',
      descripcion: 'Emite facturas, boletas, cotizaciones y notas de crédito en segundos. Cumplimiento fiscal garantizado con motor transaccional ACID en PostgreSQL y descarga instantánea de PDF.',
      puntos: [
        'Generación de comprobantes en menos de 2 segundos',
        'Impresión térmica (58mm/80mm) y formatos A4 corporativos',
        'Validaciones matemáticas de impuestos y retenciones automáticas',
        'Numeración correlativa con bloqueos SELECT FOR UPDATE a prueba de duplicados'
      ],
      icono: 'document-text',
      metricas: [
        { valor: '< 1.8s', label: 'Tiempo de emisión' },
        { valor: '100%', label: 'Garantía anti-duplicados' }
      ]
    },
    {
      id: 'kardex',
      tag: 'STOCK & BODEGAS',
      titulo: 'Inventario Kardex y Control Multibodega',
      descripcion: 'Conoce con exactitud milimétrica el valor y existencia de tus productos. Sistema de valorización por Costo Promedio Ponderado y FIFO con trazabilidad completa de movimientos.',
      puntos: [
        'Kardex valorizado en tiempo real con entradas, salidas y mermas',
        'Alertas inteligentes de stock mínimo para evitar desabastecimiento',
        'Manejo de códigos de barra, SKU, categorías y lotes',
        'Transferencias entre sucursales con hoja de remisión'
      ],
      icono: 'cube',
      metricas: [
        { valor: '0%', label: 'Descuadres de inventario' },
        { valor: 'Real-time', label: 'Sincronización multi-sede' }
      ]
    },
    {
      id: 'clientes',
      tag: 'CRM & COBRANZAS',
      titulo: 'Directorio 360° de Clientes y Gestión de Cobranzas',
      descripcion: 'Ten el control absoluto de tus cuentas por cobrar. Historial de compras, estado de deuda al instante, límites de crédito y registro de pagos parciales o totales.',
      puntos: [
        'Ficha completa de cliente con RUC/NIT, contacto y datos fiscales',
        'Cuentas corrientes con cálculo automático de saldos vencidos',
        'Envío directo de estados de cuenta y comprobantes por correo',
        'Auditoría y conciliación de abonos con validación idempotente'
      ],
      icono: 'users',
      metricas: [
        { valor: '45%', label: 'Reducción en mora de cobro' },
        { valor: '360°', label: 'Visibilidad de cliente' }
      ]
    },
    {
      id: 'finanzas',
      tag: 'TESORERÍA & CAJA',
      titulo: 'Caja Chica, Flujo de Fondos y Bancos',
      descripcion: 'Controla el dinero real que entra y sale de tu negocio. Arqueos de caja por turno de vendedor, conciliación bancaria y reportes ejecutivos de rentabilidad.',
      puntos: [
        'Apertura y cierre de caja con control estricto de sobrantes y faltantes',
        'Registro ordenado de egresos operativos y compras a proveedores',
        'Visualización de balance diario, semanal y mensual en vivo',
        'Reportes exportables para tu contador en formato Excel y PDF'
      ],
      icono: 'currency-dollar',
      metricas: [
        { valor: '1 Clic', label: 'Arqueo de turno' },
        { valor: '100%', label: 'Trazabilidad de egresos' }
      ]
    },
    {
      id: 'dual',
      tag: 'ARQUITECTURA EXCLUSIVA',
      titulo: 'Dualidad Tecnológica: Nube SaaS + Escritorio Offline',
      descripcion: 'Lo mejor de dos mundos. Administra tu empresa desde cualquier lugar del mundo vía Web, mientras tus cajeros en tienda operan a máxima velocidad sin depender del internet con la app nativa de Escritorio (.NET 8).',
      puntos: [
        'Terminal de escritorio con motor local SQLite/SQL Server de cero latencia',
        'Continuidad operativa ininterrumpida si se corta la conexión a internet',
        'Sincronización automática a la nube Supabase cuando hay señal',
        'Aislamiento de datos con Row Level Security (RLS) bancario'
      ],
      icono: 'computer-desktop',
      metricas: [
        { valor: 'Offline', label: 'Sin depender de red' },
        { valor: '.NET 8', label: 'Motor nativo ultrarrápido' }
      ]
    }
  ];

  faqs = [
    {
      pregunta: '¿Puedo seguir facturando en mi negocio si se cae el servicio de internet?',
      respuesta: '¡Totalmente sí! FacturaPro 360 cuenta con una arquitectura dual única. Además de la plataforma Web en la nube, dispones de una aplicación nativa de Escritorio (.NET 8 WPF) que almacena tus datos localmente. Tus cajeros pueden seguir emitiendo comprobantes sin interrupción y los datos se sincronizan cuando vuelva la conexión.'
    },
    {
      pregunta: '¿Cómo garantizan que la información de mi empresa esté protegida y separada de otras?',
      respuesta: 'Utilizamos aislamiento estricto multi-tenant mediante políticas Row Level Security (RLS) directamente a nivel de base de datos en PostgreSQL. Cada consulta y transacción está firmada con el identificador único de tu empresa (empresa_id), haciendo matemáticamente imposible el acceso cruzado entre tenants.'
    },
    {
      pregunta: '¿Es compatible con impresoras de tickets térmicas y lectores de código de barras?',
      respuesta: 'Sí. FacturaPro 360 soporta formatos térmicos de 58mm y 80mm tanto para facturas rápidas como boletas, así como formato clásico A4 corporativo en PDF de alta fidelidad. También es 100% plug & play con cualquier lector de código de barras USB o Bluetooth.'
    },
    {
      pregunta: '¿Puedo probar el sistema antes de contratar un plan?',
      respuesta: '¡Por supuesto! Puedes acceder inmediatamente a nuestro entorno interactivo de demostración con un solo clic, sin necesidad de ingresar tarjeta de crédito, y explorar los módulos de ventas, inventario, clientes y caja con datos de ejemplo.'
    },
    {
      pregunta: '¿Cómo funciona la descarga del Manual de Usuario?',
      respuesta: 'Dispones de un manual integral de 16 páginas en formato PDF incluido directamente en la plataforma, con capturas de pantalla, explicaciones paso a paso de cada módulo, flujo de facturación y configuración de sucursales.'
    }
  ];

  constructor(
    private router: Router,
    public auth: AuthService
  ) {}

  toggleMenuMovil(): void {
    this.menuMovilAbierto.update(v => !v);
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  toggleFaq(index: number): void {
    if (this.faqAbierto() === index) {
      this.faqAbierto.set(null);
    } else {
      this.faqAbierto.set(index);
    }
  }

  setTab(tab: string): void {
    this.tabActivo.set(tab);
  }

  moduloSeleccionado(): ModuloInfo {
    return this.modulos.find(m => m.id === this.tabActivo()) || this.modulos[0];
  }

  irAlPanel(): void {
    this.router.navigate(['/dashboard']);
  }

  cambiarFrecuencia(f: 'mensual' | 'anual'): void {
    this.frecuenciaPago.set(f);
  }
}
