import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';
import { HelpService } from '../../services/help.service';

interface MovimientoManual {
  id: string;
  referencia: string;
  fecha: string;
  cuenta: string;
  concepto: string;
  ingreso: number;
  egreso: number;
}

@Component({
  selector: 'app-caja-bancos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Caja y Bancos</h1>
            <button (click)="help.mostrarAyuda('caja-bancos')" 
                    class="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    title="Explicacion y ayuda sobre tesoreria y cuentas">
              ?
            </button>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Caja y bancos</span>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <button (click)="mostrarModal = true" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Nuevo Movimiento
          </button>
        </div>
      </div>

      <!-- CARDS DE SALDOS REALES DE TESORERÍA (100% DINÁMICO) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span class="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Caja Chica / Ventanilla</span>
          <div class="text-2xl font-bold text-slate-900 mt-2">$ {{ saldoEfectivo() | number:'1.2-2' }}</div>
          <span class="text-[11px] font-medium block mt-1" [ngClass]="saldoEfectivo() > 0 ? 'text-emerald-600' : 'text-slate-400'">
            {{ saldoEfectivo() > 0 ? 'Cobros en efectivo liquidados' : 'Sin efectivo acumulado' }}
          </span>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span class="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Bancos y Cuentas Corrientes</span>
          <div class="text-2xl font-bold text-slate-900 mt-2">$ {{ saldoBancos() | number:'1.2-2' }}</div>
          <span class="text-[11px] font-medium block mt-1" [ngClass]="saldoBancos() > 0 ? 'text-emerald-600' : 'text-slate-400'">
            {{ saldoBancos() > 0 ? 'Transferencias y pasarelas' : 'Sin depósitos registrados' }}
          </span>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span class="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Tesorería Disponible</span>
          <div class="text-2xl font-bold text-blue-600 mt-2">$ {{ totalDisponible() | number:'1.2-2' }}</div>
          <span class="text-[11px] text-slate-500 block mt-1">Disponibilidad líquida inmediata</span>
        </div>
      </div>

      <!-- LIBRO DE MOVIMIENTOS -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 font-bold text-xs text-slate-800">
          Libro de Movimientos de Tesorería ({{ todosLosMovimientos().length }} registros)
        </div>

        <div *ngIf="todosLosMovimientos().length === 0" class="py-12 text-center">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
          <h3 class="text-xs font-bold text-slate-800">No hay movimientos de tesorería registrados</h3>
          <p class="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            Los cobros de tus facturas y los movimientos manuales de caja aparecerán aquí automáticamente.
          </p>
        </div>

        <div *ngIf="todosLosMovimientos().length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Referencia</th>
                <th class="py-3 px-4">Fecha</th>
                <th class="py-3 px-4">Cuenta / Caja</th>
                <th class="py-3 px-4">Concepto</th>
                <th class="py-3 px-4 text-right">Ingreso</th>
                <th class="py-3 px-4 text-right">Egreso</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr *ngFor="let m of todosLosMovimientos()" class="hover:bg-slate-50/70">
                <td class="py-3.5 px-4 font-mono font-bold text-slate-900">{{ m.referencia }}</td>
                <td class="py-3.5 px-4 text-slate-400">{{ m.fecha }}</td>
                <td class="py-3.5 px-4 font-medium">{{ m.cuenta }}</td>
                <td class="py-3.5 px-4">{{ m.concepto }}</td>
                <td class="py-3.5 px-4 text-right font-bold text-emerald-600">
                  {{ m.ingreso > 0 ? ('+$' + (m.ingreso | number:'1.2-2')) : '-' }}
                </td>
                <td class="py-3.5 px-4 text-right font-bold text-rose-500">
                  {{ m.egreso > 0 ? ('-$' + (m.egreso | number:'1.2-2')) : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL NUEVO MOVIMIENTO -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Registrar Movimiento de Caja</h3>
            <button (click)="mostrarModal = false" class="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Tipo de Movimiento</label>
              <select [(ngModel)]="nuevoTipo" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2">
                <option value="INGRESO">Ingreso de Dinero (+)</option>
                <option value="EGRESO">Egreso / Gasto de Caja (-)</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Cuenta o Destino</label>
              <select [(ngModel)]="nuevaCuenta" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2">
                <option value="Caja Chica">Caja Chica / Ventanilla</option>
                <option value="Banco Principal">Banco Principal (Cta. Corriente)</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Concepto o Detalle *</label>
              <input type="text" [(ngModel)]="nuevoConcepto" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Pago de flete, aporte inicial, etc." />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Monto ($) *</label>
              <input type="number" [(ngModel)]="nuevoMonto" min="0.01" step="0.01" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="0.00" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="mostrarModal = false" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button (click)="guardarMovimiento()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Registrar</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CajaBancosComponent {
  private service = inject(FacturaProService);
  help = inject(HelpService);

  mostrarModal = false;
  nuevoTipo: 'INGRESO' | 'EGRESO' = 'INGRESO';
  nuevaCuenta = 'Caja Chica';
  nuevoConcepto = '';
  nuevoMonto = 0;

  private storageKey = computed(() => 'facturapro_cash_' + this.service.getEmpresaActualId());
  movimientosManuales = signal<MovimientoManual[]>([]);

  constructor() {
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    const raw = localStorage.getItem(this.storageKey());
    if (raw) {
      try {
        this.movimientosManuales.set(JSON.parse(raw));
      } catch {
        this.movimientosManuales.set([]);
      }
    }
  }

  saldoEfectivo = computed(() => {
    const cobrosEfectivo = this.service.pagos()
      .filter(p => p.metodo_pago === 'Efectivo')
      .reduce((acc, p) => acc + p.monto, 0);

    const manualesEfectivo = this.movimientosManuales()
      .filter(m => m.cuenta === 'Caja Chica')
      .reduce((acc, m) => acc + m.ingreso - m.egreso, 0);

    return Math.max(0, cobrosEfectivo + manualesEfectivo);
  });

  saldoBancos = computed(() => {
    const cobrosBancos = this.service.pagos()
      .filter(p => p.metodo_pago === 'Transferencia' || p.metodo_pago === 'TarjetaCredito' || p.metodo_pago === 'TarjetaDebito')
      .reduce((acc, p) => acc + p.monto, 0);

    const manualesBancos = this.movimientosManuales()
      .filter(m => m.cuenta === 'Banco Principal')
      .reduce((acc, m) => acc + m.ingreso - m.egreso, 0);

    return Math.max(0, cobrosBancos + manualesBancos);
  });

  totalDisponible = computed(() => this.saldoEfectivo() + this.saldoBancos());

  todosLosMovimientos = computed(() => {
    const cobrosDeFacturas: MovimientoManual[] = this.service.pagos().map(p => ({
      id: p.id,
      referencia: p.numero_recibo,
      fecha: new Date(p.fecha_pago).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      cuenta: p.metodo_pago === 'Efectivo' ? 'Caja Chica' : 'Banco Principal',
      concepto: `Cobro Factura (${p.metodo_pago})`,
      ingreso: p.monto,
      egreso: 0
    }));

    return [...cobrosDeFacturas, ...this.movimientosManuales()];
  });

  guardarMovimiento() {
    if (!this.nuevoConcepto.trim() || this.nuevoMonto <= 0) return;

    const nuevo: MovimientoManual = {
      id: crypto.randomUUID(),
      referencia: `MOV-${Date.now().toString().slice(-6)}`,
      fecha: new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      cuenta: this.nuevaCuenta,
      concepto: this.nuevoConcepto.trim(),
      ingreso: this.nuevoTipo === 'INGRESO' ? this.nuevoMonto : 0,
      egreso: this.nuevoTipo === 'EGRESO' ? this.nuevoMonto : 0
    };

    const actualizados = [nuevo, ...this.movimientosManuales()];
    this.movimientosManuales.set(actualizados);
    localStorage.setItem(this.storageKey(), JSON.stringify(actualizados));

    this.service.registrarEventoAuditoria(
      'TESORERIA',
      'MOVIMIENTO_CAJA',
      `${nuevo.referencia} ($${this.nuevoMonto.toFixed(2)})`,
      'INFO',
      `${this.nuevoTipo}: ${nuevo.concepto}`
    );

    this.nuevoConcepto = '';
    this.nuevoMonto = 0;
    this.mostrarModal = false;
  }
}
