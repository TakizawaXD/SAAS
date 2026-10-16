import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FacturaProService } from '../../services/facturapro.service';
import { ConfirmService } from '../../services/confirm.service';
import { HelpService } from '../../services/help.service';
import { EstadoFactura, Factura } from '../../models/facturapro.models';

@Component({
  selector: 'app-facturas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      
      <!-- ENCABEZADO Y BREADCRUMB -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Facturacion</h1>
            <button (click)="help.mostrarAyuda('facturas')" 
                    class="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    title="Explicacion y ayuda sobre este modulo">
              ?
            </button>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a routerLink="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Facturacion</span>
          </div>
        </div>

        <div>
          <a routerLink="/nueva-factura" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Nueva factura
          </a>
        </div>
      </div>

      <!-- BARRA DE BÚSQUEDA Y FILTRO DE ESTADOS -->
      <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button (click)="filtroEstado.set(null)" [ngClass]="filtroEstado() === null ? 'bg-[#2563EB] text-white font-semibold' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'" class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition cursor-pointer">
            Todas
          </button>
          <button (click)="filtroEstado.set('Emitida')" [ngClass]="filtroEstado() === 'Emitida' ? 'bg-[#2563EB] text-white font-semibold' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'" class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition cursor-pointer">
            Emitidas
          </button>
          <button (click)="filtroEstado.set('Parcial')" [ngClass]="filtroEstado() === 'Parcial' ? 'bg-[#2563EB] text-white font-semibold' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'" class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition cursor-pointer">
            Parciales
          </button>
          <button (click)="filtroEstado.set('Pagada')" [ngClass]="filtroEstado() === 'Pagada' ? 'bg-[#2563EB] text-white font-semibold' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'" class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition cursor-pointer">
            Pagadas
          </button>
          <button (click)="filtroEstado.set('Anulada')" [ngClass]="filtroEstado() === 'Anulada' ? 'bg-[#2563EB] text-white font-semibold' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'" class="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition cursor-pointer">
            Anuladas
          </button>
        </div>

        <div class="relative w-full md:w-64">
          <input type="text" [(ngModel)]="busqueda" placeholder="Buscar por N° o cliente..." 
                 class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
          <div class="absolute left-2.5 top-2 text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
      </div>

      <!-- TABLA PRINCIPAL DE FACTURAS -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs min-w-[720px]">
            <thead class="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">N° Factura</th>
                <th class="py-3 px-4">Emisión</th>
                <th class="py-3 px-4">Cliente</th>
                <th class="py-3 px-4 text-right">Total</th>
                <th class="py-3 px-4 text-right">Saldo Pendiente</th>
                <th class="py-3 px-4 text-center">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr *ngFor="let f of facturasPaginadas()" class="hover:bg-slate-50/70 transition">
                <td class="py-3.5 px-4 font-bold text-slate-900">{{ f.numero_factura }}</td>
                <td class="py-3.5 px-4 text-slate-400">{{ f.fecha_emision | date:'dd/MM/yyyy HH:mm' }}</td>
                <td class="py-3.5 px-4 font-medium text-slate-800">{{ f.cliente?.razon_social || 'Cliente Registrado' }}</td>
                <td class="py-3.5 px-4 text-right font-bold text-slate-900">\${{ f.total | number:'1.2-2' }}</td>
                <td class="py-3.5 px-4 text-right font-medium" [class.text-amber-600]="f.saldo_pendiente > 0">
                  \${{ f.saldo_pendiente | number:'1.2-2' }}
                </td>
                <td class="py-3.5 px-4 text-center">
                  <span [ngClass]="{
                    'bg-emerald-50 text-emerald-600 border-emerald-200': f.estado === 'Pagada',
                    'bg-sky-50 text-sky-600 border-sky-200': f.estado === 'Emitida',
                    'bg-amber-50 text-amber-600 border-amber-200': f.estado === 'Parcial',
                    'bg-rose-50 text-rose-600 border-rose-200': f.estado === 'Anulada'
                  }" class="px-2 py-0.5 rounded-full text-[10px] font-semibold border">
                    {{ f.estado }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <a [routerLink]="['/facturas', f.id]" class="text-xs font-semibold text-blue-600 hover:text-blue-700">
                      Detalle &rarr;
                    </a>

                    <!-- BOTÓN ELIMINAR CON CONFIRMACIÓN SEGURA -->
                    <button (click)="solicitarEliminar(f)" title="Eliminar factura" 
                            class="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="facturasFiltradas().length === 0">
                <td colspan="7" class="text-center py-10 px-4">
                  <div class="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <img src="/assets/images/empty_invoices.jpg" alt="Sin facturas" class="w-36 h-36 object-cover rounded-2xl shadow-sm border border-slate-200 mb-3" />
                    <h3 class="text-sm font-bold text-slate-800">No se encontraron facturas</h3>
                    <p class="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">No hay comprobantes que coincidan con la búsqueda o el filtro de estado actual.</p>
                    <a routerLink="/nueva-factura" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                      Emitir nueva factura
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACIÓN FUNCIONAL -->
        <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Página {{ paginaActual() }} de {{ totalPaginas() }} (Total: {{ facturasFiltradas().length }} facturas)</span>
          <div class="flex items-center gap-1">
            <button (click)="cambiarPagina(-1)" [disabled]="paginaActual() <= 1" class="w-7 h-7 rounded border border-slate-200 bg-white disabled:opacity-40 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-50">&larr;</button>
            <span class="w-7 h-7 rounded bg-[#2563EB] text-white font-bold flex items-center justify-center shadow-xs">{{ paginaActual() }}</span>
            <button (click)="cambiarPagina(1)" [disabled]="paginaActual() >= totalPaginas()" class="w-7 h-7 rounded border border-slate-200 bg-white disabled:opacity-40 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-50">&rarr;</button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class FacturasListComponent {
  private service = inject(FacturaProService);
  private confirmService = inject(ConfirmService);
  help = inject(HelpService);

  filtroEstado = signal<EstadoFactura | null>(null);
  busqueda = '';

  paginaActual = signal<number>(1);
  itemsPorPagina = 8;

  facturasFiltradas = computed(() => {
    let list = this.service.facturas();
    const filtro = this.filtroEstado();
    if (filtro) {
      list = list.filter(f => f.estado === filtro);
    }
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      list = list.filter(f => 
        f.numero_factura.toLowerCase().includes(q) ||
        (f.cliente?.razon_social && f.cliente.razon_social.toLowerCase().includes(q))
      );
    }
    return list;
  });

  totalPaginas = computed(() => {
    const total = this.facturasFiltradas().length;
    return Math.max(1, Math.ceil(total / this.itemsPorPagina));
  });

  facturasPaginadas = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.facturasFiltradas().slice(inicio, inicio + this.itemsPorPagina);
  });

  cambiarPagina(delta: number) {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) {
      this.paginaActual.set(nueva);
    }
  }

  async solicitarEliminar(f: Factura) {
    const confirmado = await this.confirmService.confirm({
      title: '¿Estás seguro de eliminar esta factura?',
      message: `Esta acción anulará el documento y eliminará el registro contable de ${f.numero_factura}. Si la factura estaba activa, se revertirán los saldos pendientes y el stock. Se guardará un registro de auditoría estricto.`,
      itemNombre: `${f.numero_factura} — Total: $${f.total.toFixed(2)} (${f.cliente?.razon_social || 'Cliente'})`,
      confirmText: 'Sí, eliminar factura',
      cancelText: 'Cancelar',
      tipo: 'danger'
    });

    if (confirmado) {
      this.service.eliminarFactura(f.id);
    }
  }
}
