import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FacturaProService } from '../../services/facturapro.service';

interface ReglaAutomatizacion {
  id: string;
  nombre: string;
  disparador: string;
  accion: string;
  activa: boolean;
}

@Component({
  selector: 'app-automatizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Reglas de Automatización</h1>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Automatizaciones</span>
          </div>
        </div>

        <button (click)="mostrarModal = true" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Nueva Regla
        </button>
      </div>

      <!-- LISTADO DE REGLAS (100% DINÁMICO) -->
      <div class="space-y-4">
        <div *ngFor="let r of reglas()" class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <div>
              <div class="font-bold text-sm text-slate-900">{{ r.nombre }}</div>
              <div class="text-xs text-slate-500 mt-0.5">
                <span class="font-medium text-slate-700">Disparador:</span> {{ r.disparador }} &rarr; <span class="font-medium text-slate-700">Acción:</span> {{ r.accion }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 self-end sm:self-auto">
            <button (click)="toggleRegla(r.id)" [ngClass]="r.activa ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-400 border-slate-200'" class="px-3 py-1 rounded-full text-xs font-bold border cursor-pointer">
              {{ r.activa ? 'Activa' : 'Pausada' }}
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL NUEVA REGLA -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Crear Regla de Automatización</h3>
            <button (click)="mostrarModal = false" class="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nombre de la Regla *</label>
              <input type="text" [(ngModel)]="nuevoNombre" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Aviso de cobro vencido por email" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Evento Disparador</label>
              <select [(ngModel)]="nuevoDisparador" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2">
                <option value="Factura con saldo a 3 días de vencer">Factura con saldo a 3 días de vencer</option>
                <option value="Producto alcanza el stock mínimo">Producto alcanza el stock mínimo</option>
                <option value="Pago total registrado por cliente">Pago total registrado por cliente</option>
                <option value="Factura emitida superior a $1,000">Factura emitida superior a $1,000</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Acción Automática</label>
              <input type="text" [(ngModel)]="nuevaAccion" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Notificar al correo de administración" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="mostrarModal = false" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button (click)="guardarRegla()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Crear Regla</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AutomatizacionesComponent {
  private auth = inject(AuthService);
  private service = inject(FacturaProService);

  mostrarModal = false;
  nuevoNombre = '';
  nuevoDisparador = 'Factura con saldo a 3 días de vencer';
  nuevaAccion = '';

  private storageKey = computed(() => 'facturapro_automations_' + this.service.getEmpresaActualId());
  reglas = signal<ReglaAutomatizacion[]>([]);

  constructor() {
    this.cargarReglas();
  }

  cargarReglas() {
    const raw = localStorage.getItem(this.storageKey());
    if (raw) {
      try {
        this.reglas.set(JSON.parse(raw));
      } catch {
        this.reglas.set([]);
      }
    } else {
      const emailEmpresa = this.auth.currentUser()?.email || 'admin@empresa.com';
      const iniciales: ReglaAutomatizacion[] = [
        {
          id: '1',
          nombre: 'Alerta automática de stock bajo a compras',
          disparador: 'Cuando producto.stock <= producto.stock_minimo',
          accion: `Enviar notificación al correo: ${emailEmpresa}`,
          activa: true
        },
        {
          id: '2',
          nombre: 'Recordatorio preventivo de vencimiento de factura (3 días antes)',
          disparador: '3 días antes de factura.fecha_vencimiento con saldo > 0',
          accion: 'Generar estado de cuenta y notificar al cliente',
          activa: true
        }
      ];
      this.reglas.set(iniciales);
      localStorage.setItem(this.storageKey(), JSON.stringify(iniciales));
    }
  }

  toggleRegla(id: string) {
    const actualizadas = this.reglas().map(r => r.id === id ? { ...r, activa: !r.activa } : r);
    this.reglas.set(actualizadas);
    localStorage.setItem(this.storageKey(), JSON.stringify(actualizadas));
  }

  guardarRegla() {
    if (!this.nuevoNombre.trim()) return;

    const nueva: ReglaAutomatizacion = {
      id: crypto.randomUUID(),
      nombre: this.nuevoNombre.trim(),
      disparador: this.nuevoDisparador,
      accion: this.nuevaAccion.trim() || 'Notificar al panel de control',
      activa: true
    };

    const actualizadas = [nueva, ...this.reglas()];
    this.reglas.set(actualizadas);
    localStorage.setItem(this.storageKey(), JSON.stringify(actualizadas));

    this.service.registrarEventoAuditoria(
      'AUTOMATIZACIONES',
      'CREAR_REGLA',
      nueva.nombre,
      'INFO',
      `Disparador: ${nueva.disparador}`
    );

    this.nuevoNombre = '';
    this.nuevaAccion = '';
    this.mostrarModal = false;
  }
}
