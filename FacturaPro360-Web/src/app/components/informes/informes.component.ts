import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturaProService } from '../../services/facturapro.service';
import { HelpService } from '../../services/help.service';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Centro de Informes y Reportes</h1>
            <button (click)="help.mostrarAyuda('informes')" 
                    class="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    title="Explicacion y ayuda sobre reportes e informes">
              ?
            </button>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Informes</span>
          </div>
        </div>

        <button (click)="exportarReporteCsv()" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Exportar Resumen (CSV)
        </button>
      </div>

      <!-- ALERTA DE REPORTE GENERADO -->
      <div *ngIf="mensajeReporte()" class="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium flex items-center justify-between shadow-xs">
        <span>{{ mensajeReporte() }}</span>
        <button (click)="mensajeReporte.set('')" class="text-blue-600 font-bold">&times;</button>
      </div>

      <!-- CARDS DE REPORTES PRECONFIGURADOS CON CÁLCULO REAL -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- 1. VENTAS -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <h3 class="text-sm font-bold text-slate-900">Ventas y Facturación Emitida</h3>
            <p class="text-xs text-slate-500 mt-1">Total de {{ service.facturas().length }} facturas registradas en la organización.</p>
            <div class="mt-3 text-lg font-bold text-slate-900">$ {{ totalVentas() | number:'1.2-2' }}</div>
          </div>
          <button (click)="verDetalleReporte('ventas')" class="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer pt-2 border-t border-slate-100 text-left">
            Ver detalle de facturación &rarr;
          </button>
        </div>

        <!-- 2. INVENTARIO -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <h3 class="text-sm font-bold text-slate-900">Valoración de Inventario</h3>
            <p class="text-xs text-slate-500 mt-1">Cálculo de costo y valor comercial de {{ service.productos().length }} productos.</p>
            <div class="mt-3 text-lg font-bold text-slate-900">$ {{ valorInventario() | number:'1.2-2' }}</div>
          </div>
          <button (click)="verDetalleReporte('inventario')" class="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer pt-2 border-t border-slate-100 text-left">
            Ver catálogo valorado &rarr;
          </button>
        </div>

        <!-- 3. CARTERA -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="text-sm font-bold text-slate-900">Antigüedad de Cuentas por Cobrar</h3>
            <p class="text-xs text-slate-500 mt-1">Saldo pendiente de cobro distribuido en {{ facturasConSaldo().length }} comprobantes.</p>
            <div class="mt-3 text-lg font-bold text-slate-900" [ngClass]="totalPorCobrar() > 0 ? 'text-amber-600' : 'text-emerald-600'">
              $ {{ totalPorCobrar() | number:'1.2-2' }}
            </div>
          </div>
          <button (click)="verDetalleReporte('cartera')" class="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer pt-2 border-t border-slate-100 text-left">
            Ver detalle de saldos &rarr;
          </button>
        </div>

      </div>

      <!-- DETALLE EXPANDIDO DEL REPORTE SELECCIONADO -->
      <div *ngIf="reporteActivo()" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="text-sm font-bold text-slate-900">
            Detalle del Reporte: {{ reporteActivo() === 'ventas' ? 'Facturación' : reporteActivo() === 'inventario' ? 'Inventario' : 'Cartera de Cobro' }}
          </h3>
          <button (click)="reporteActivo.set(null)" class="text-xs text-slate-400 hover:text-slate-600 font-bold">&times; Cerrar</button>
        </div>

        <div *ngIf="reporteActivo() === 'ventas'">
          <div *ngIf="service.facturas().length === 0" class="py-6 text-center text-slate-400 text-xs">
            Sin facturas emitidas en esta empresa.
          </div>
          <table *ngIf="service.facturas().length > 0" class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="p-2">Factura</th>
                <th class="p-2">Cliente</th>
                <th class="p-2 text-right">Total</th>
                <th class="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of service.facturas()" class="border-b border-slate-100">
                <td class="p-2 font-bold">{{ f.numero_factura }}</td>
                <td class="p-2">{{ f.cliente?.razon_social }}</td>
                <td class="p-2 text-right font-bold">\${{ f.total | number:'1.2-2' }}</td>
                <td class="p-2 text-center">{{ f.estado }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="reporteActivo() === 'inventario'">
          <div *ngIf="service.productos().length === 0" class="py-6 text-center text-slate-400 text-xs">
            Sin productos en catálogo para esta empresa.
          </div>
          <table *ngIf="service.productos().length > 0" class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="p-2">SKU</th>
                <th class="p-2">Producto</th>
                <th class="p-2 text-right">Stock</th>
                <th class="p-2 text-right">Precio Venta</th>
                <th class="p-2 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of service.productos()" class="border-b border-slate-100">
                <td class="p-2 font-mono">{{ p.sku }}</td>
                <td class="p-2 font-medium">{{ p.nombre }}</td>
                <td class="p-2 text-right font-bold">{{ p.stock_actual }}</td>
                <td class="p-2 text-right">\${{ p.precio_venta | number:'1.2-2' }}</td>
                <td class="p-2 text-right font-bold text-emerald-600">\${{ (p.stock_actual * p.precio_venta) | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="reporteActivo() === 'cartera'">
          <div *ngIf="facturasConSaldo().length === 0" class="py-6 text-center text-emerald-600 text-xs font-semibold">
            Excelente: No hay facturas pendientes de cobro. Cartera 100% al dia.
          </div>
          <table *ngIf="facturasConSaldo().length > 0" class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="p-2">Factura</th>
                <th class="p-2">Cliente</th>
                <th class="p-2">Vencimiento</th>
                <th class="p-2 text-right">Saldo Deudor</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let f of facturasConSaldo()" class="border-b border-slate-100">
                <td class="p-2 font-bold">{{ f.numero_factura }}</td>
                <td class="p-2">{{ f.cliente?.razon_social }}</td>
                <td class="p-2 text-slate-500">{{ f.fecha_vencimiento }}</td>
                <td class="p-2 text-right font-bold text-amber-600">\${{ f.saldo_pendiente | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class InformesComponent {
  service = inject(FacturaProService);
  help = inject(HelpService);

  reporteActivo = signal<'ventas' | 'inventario' | 'cartera' | null>(null);
  mensajeReporte = signal<string>('');

  totalVentas = computed(() => 
    this.service.facturas()
      .filter(f => f.estado !== 'Anulada')
      .reduce((acc, f) => acc + f.total, 0)
  );

  valorInventario = computed(() => 
    this.service.productos()
      .reduce((acc, p) => acc + (p.stock_actual * p.precio_venta), 0)
  );

  totalPorCobrar = computed(() => 
    this.service.facturas()
      .filter(f => f.estado !== 'Anulada')
      .reduce((acc, f) => acc + f.saldo_pendiente, 0)
  );

  facturasConSaldo = computed(() => 
    this.service.facturas().filter(f => f.estado !== 'Anulada' && f.saldo_pendiente > 0)
  );

  verDetalleReporte(tipo: 'ventas' | 'inventario' | 'cartera') {
    this.reporteActivo.set(tipo);
  }

  exportarReporteCsv() {
    const facturas = this.service.facturas();
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Numero,Fecha,Cliente,Total,SaldoPendiente,Estado\n';
    
    facturas.forEach(f => {
      csvContent += `"${f.numero_factura}","${f.fecha_emision}","${f.cliente?.razon_social || ''}",${f.total},${f.saldo_pendiente},"${f.estado}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Ventas_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.mensajeReporte.set('Reporte exportado exitosamente en formato CSV descargable.');
  }
}
