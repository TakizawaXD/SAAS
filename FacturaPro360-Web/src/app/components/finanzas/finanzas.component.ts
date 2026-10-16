import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';

interface AsientoContable {
  id: string;
  numero: string;
  fecha: string;
  cuenta: string;
  descripcion: string;
  debe: number;
  haber: number;
}

@Component({
  selector: 'app-finanzas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Finanzas y Contabilidad</h1>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Finanzas y contabilidad</span>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <button (click)="mostrarModal = true" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Nuevo Asiento Contable
          </button>
        </div>
      </div>

      <!-- TABS -->
      <div class="border-b border-slate-200 flex flex-wrap gap-4 sm:gap-6 text-xs font-semibold">
        <button (click)="tabActiva = 'pyg'" [ngClass]="tabActiva === 'pyg' ? 'text-blue-600 border-b-2 border-blue-600 pb-3' : 'text-slate-400 hover:text-slate-600 pb-3'" class="cursor-pointer">
          Estado de Resultados (P&amp;L)
        </button>
        <button (click)="tabActiva = 'asientos'" [ngClass]="tabActiva === 'asientos' ? 'text-blue-600 border-b-2 border-blue-600 pb-3' : 'text-slate-400 hover:text-slate-600 pb-3'" class="cursor-pointer">
          Libro Diario y Asientos
        </button>
      </div>

      <!-- VISTA P&L DINÁMICA -->
      <div *ngIf="tabActiva === 'pyg'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- INGRESOS OPERATIVOS -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Ingresos Operativos Reales</h3>
          <div class="flex justify-between text-xs py-2 border-b border-slate-100">
            <span class="text-slate-600">Ventas Facturadas</span>
            <span class="font-bold text-slate-900">$ {{ totalFacturado() | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between text-xs py-2 border-b border-slate-100">
            <span class="text-slate-600">Recaudos y Pagos Recibidos</span>
            <span class="font-bold text-slate-900">$ {{ totalCobrado() | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between text-xs py-2 border-b border-slate-100">
            <span class="text-slate-600">Otros Ingresos Contables</span>
            <span class="font-bold text-slate-900">$ {{ otrosIngresos() | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between text-xs font-bold text-slate-900 pt-2">
            <span>Total Ingresos Brutos:</span>
            <span class="text-emerald-600">$ {{ (totalFacturado() + otrosIngresos()) | number:'1.2-2' }}</span>
          </div>
        </div>

        <!-- COSTOS Y GASTOS -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Estructura de Gastos</h3>
          <div class="flex justify-between text-xs py-2 border-b border-slate-100">
            <span class="text-slate-600">Gastos Registrados en Libro</span>
            <span class="font-bold text-slate-900">$ {{ totalGastos() | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between text-xs py-2 border-b border-slate-100">
            <span class="text-slate-600">Impuestos Facturados (IVA)</span>
            <span class="font-bold text-slate-900">$ {{ totalIva() | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between text-xs font-bold text-slate-900 pt-2">
            <span>Resultado Neto Estimado:</span>
            <span [ngClass]="(totalFacturado() - totalGastos()) >= 0 ? 'text-blue-600' : 'text-rose-600'">
              $ {{ (totalFacturado() - totalGastos()) | number:'1.2-2' }}
            </span>
          </div>
        </div>
      </div>

      <!-- TABLA DE ASIENTOS CONTABLES -->
      <div *ngIf="tabActiva === 'asientos'" class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 font-bold text-xs text-slate-800">
          Libro Diario Contable ({{ listaAsientos().length }} asientos registrados)
        </div>

        <div *ngIf="listaAsientos().length === 0" class="py-10 text-center text-slate-400 text-xs">
          No hay asientos contables registrados aún. Haz clic en "Nuevo Asiento Contable" para crear uno.
        </div>

        <div *ngIf="listaAsientos().length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">N° Asiento</th>
                <th class="py-3 px-4">Fecha</th>
                <th class="py-3 px-4">Cuenta Contable</th>
                <th class="py-3 px-4">Descripción / Glosa</th>
                <th class="py-3 px-4 text-right">Debe ($)</th>
                <th class="py-3 px-4 text-right">Haber ($)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr *ngFor="let a of listaAsientos()" class="hover:bg-slate-50/70">
                <td class="py-3.5 px-4 font-mono font-bold text-slate-900">{{ a.numero }}</td>
                <td class="py-3.5 px-4 text-slate-400">{{ a.fecha }}</td>
                <td class="py-3.5 px-4 font-medium">{{ a.cuenta }}</td>
                <td class="py-3.5 px-4">{{ a.descripcion }}</td>
                <td class="py-3.5 px-4 text-right font-medium">{{ a.debe > 0 ? ('$' + (a.debe | number:'1.2-2')) : '-' }}</td>
                <td class="py-3.5 px-4 text-right font-medium">{{ a.haber > 0 ? ('$' + (a.haber | number:'1.2-2')) : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL NUEVO ASIENTO -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Registrar Asiento Contable</h3>
            <button (click)="mostrarModal = false" class="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Cuenta Contable *</label>
              <input type="text" [(ngModel)]="nuevaCuenta" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: 5105 - Gastos de Operación" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Descripción / Concepto *</label>
              <input type="text" [(ngModel)]="nuevaDescripcion" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Pago de servicios públicos" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Tipo de Movimiento</label>
                <select [(ngModel)]="tipoAsiento" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <option value="DEBE">Debe (Gasto / Activo)</option>
                  <option value="HABER">Haber (Ingreso / Pasivo)</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Monto ($) *</label>
                <input type="number" [(ngModel)]="nuevoMonto" min="0.01" step="0.01" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="mostrarModal = false" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button (click)="guardarAsiento()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Registrar Asiento</button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class FinanzasComponent {
  private service = inject(FacturaProService);

  tabActiva: 'pyg' | 'asientos' = 'pyg';
  mostrarModal = false;

  nuevaCuenta = '5105 - Gastos Generales';
  nuevaDescripcion = '';
  tipoAsiento: 'DEBE' | 'HABER' = 'DEBE';
  nuevoMonto = 0;

  private storageKey = computed(() => 'facturapro_accounting_' + this.service.getEmpresaActualId());
  asientosManuales = signal<AsientoContable[]>([]);

  constructor() {
    this.cargarAsientos();
  }

  cargarAsientos() {
    const raw = localStorage.getItem(this.storageKey());
    if (raw) {
      try {
        this.asientosManuales.set(JSON.parse(raw));
      } catch {
        this.asientosManuales.set([]);
      }
    }
  }

  totalFacturado = computed(() => 
    this.service.facturas()
      .filter(f => f.estado !== 'Anulada')
      .reduce((acc, f) => acc + f.subtotal, 0)
  );

  totalIva = computed(() => 
    this.service.facturas()
      .filter(f => f.estado !== 'Anulada')
      .reduce((acc, f) => acc + f.impuesto_total, 0)
  );

  totalCobrado = computed(() => 
    this.service.pagos().reduce((acc, p) => acc + p.monto, 0)
  );

  otrosIngresos = computed(() => 
    this.asientosManuales()
      .filter(a => a.haber > 0)
      .reduce((acc, a) => acc + a.haber, 0)
  );

  totalGastos = computed(() => 
    this.asientosManuales()
      .filter(a => a.debe > 0)
      .reduce((acc, a) => acc + a.debe, 0)
  );

  listaAsientos = computed(() => {
    // Generar asientos automáticos basados en facturas reales
    const automaticos: AsientoContable[] = this.service.facturas()
      .filter(f => f.estado !== 'Anulada')
      .map(f => ({
        id: f.id,
        numero: `AST-${f.numero_factura}`,
        fecha: new Date(f.fecha_emision).toLocaleDateString('es-ES'),
        cuenta: '4135 - Ingresos por Ventas',
        descripcion: `Venta según Factura ${f.numero_factura}`,
        debe: 0,
        haber: f.total
      }));

    return [...automaticos, ...this.asientosManuales()];
  });

  guardarAsiento() {
    if (!this.nuevaDescripcion.trim() || this.nuevoMonto <= 0) return;

    const nuevo: AsientoContable = {
      id: crypto.randomUUID(),
      numero: `AST-${Date.now().toString().slice(-6)}`,
      fecha: new Date().toLocaleDateString('es-ES'),
      cuenta: this.nuevaCuenta.trim(),
      descripcion: this.nuevaDescripcion.trim(),
      debe: this.tipoAsiento === 'DEBE' ? this.nuevoMonto : 0,
      haber: this.tipoAsiento === 'HABER' ? this.nuevoMonto : 0
    };

    const actualizados = [nuevo, ...this.asientosManuales()];
    this.asientosManuales.set(actualizados);
    localStorage.setItem(this.storageKey(), JSON.stringify(actualizados));

    this.service.registrarEventoAuditoria(
      'CONTABILIDAD',
      'ASIENTO_CONTABLE',
      `${nuevo.numero} ($${this.nuevoMonto.toFixed(2)})`,
      'INFO',
      `${this.tipoAsiento}: ${nuevo.descripcion}`
    );

    this.nuevaDescripcion = '';
    this.nuevoMonto = 0;
    this.mostrarModal = false;
  }
}
