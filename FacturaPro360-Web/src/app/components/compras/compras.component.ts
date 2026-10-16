import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';
import { HelpService } from '../../services/help.service';

interface OrdenCompra {
  id: string;
  numero: string;
  fecha: string;
  proveedor: string;
  condicion: string;
  total: number;
  estado: string;
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Compras y Proveedores</h1>
            <button (click)="help.mostrarAyuda('compras')" 
                    class="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    title="Explicacion y ayuda sobre compras y proveedores">
              ?
            </button>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Compras y proveedores</span>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <button (click)="mostrarModal = true" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer transition">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Nueva Orden de Compra
          </button>
        </div>
      </div>

      <!-- TABLA DE ORDENES (100% DINÁMICA POR EMPRESA) -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 font-bold text-xs text-slate-800">
          Órdenes de Compra Registradas ({{ ordenes().length }})
        </div>

        <div *ngIf="ordenes().length === 0" class="py-12 text-center">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </div>
          <h3 class="text-xs font-bold text-slate-800">No hay órdenes de compra registradas</h3>
          <p class="text-[11px] text-slate-400 mt-1 mb-4 max-w-sm mx-auto">
            Registra tus pedidos a proveedores para controlar costos de adquisición y cuentas por pagar.
          </p>
          <button (click)="mostrarModal = true" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs">
            + Crear primera orden de compra
          </button>
        </div>

        <div *ngIf="ordenes().length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">N° Orden</th>
                <th class="py-3 px-4">Fecha</th>
                <th class="py-3 px-4">Proveedor</th>
                <th class="py-3 px-4">Condición</th>
                <th class="py-3 px-4 text-right">Total</th>
                <th class="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr *ngFor="let ord of ordenes()" class="hover:bg-slate-50/70 transition">
                <td class="py-3.5 px-4 font-bold text-slate-900">{{ ord.numero }}</td>
                <td class="py-3.5 px-4 text-slate-400">{{ ord.fecha }}</td>
                <td class="py-3.5 px-4 font-medium text-slate-800">{{ ord.proveedor }}</td>
                <td class="py-3.5 px-4 text-slate-500">{{ ord.condicion }}</td>
                <td class="py-3.5 px-4 text-right font-bold text-slate-900">\${{ ord.total | number:'1.2-2' }}</td>
                <td class="py-3.5 px-4 text-center">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    {{ ord.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL NUEVA ORDEN DE COMPRA -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Registrar Orden de Compra</h3>
            <button (click)="mostrarModal = false" class="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nombre del Proveedor *</label>
              <input type="text" [(ngModel)]="nuevoProveedor" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Mayorista Distribuidor S.A." />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Condición de Pago</label>
                <select [(ngModel)]="nuevaCondicion" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2">
                  <option value="Contado">Contado</option>
                  <option value="Crédito 15 días">Crédito 15 días</option>
                  <option value="Crédito 30 días">Crédito 30 días</option>
                  <option value="Crédito 60 días">Crédito 60 días</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Total de la Orden ($) *</label>
                <input type="number" [(ngModel)]="nuevoTotal" min="0.01" step="0.01" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="mostrarModal = false" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button (click)="guardarOrden()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Crear Orden</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ComprasComponent {
  private service = inject(FacturaProService);
  help = inject(HelpService);

  mostrarModal = false;
  nuevoProveedor = '';
  nuevaCondicion = 'Contado';
  nuevoTotal = 0;

  private storageKey = computed(() => 'facturapro_purchases_' + this.service.getEmpresaActualId());
  ordenes = signal<OrdenCompra[]>([]);

  constructor() {
    this.cargarOrdenes();
  }

  cargarOrdenes() {
    const raw = localStorage.getItem(this.storageKey());
    if (raw) {
      try {
        this.ordenes.set(JSON.parse(raw));
      } catch {
        this.ordenes.set([]);
      }
    }
  }

  guardarOrden() {
    if (!this.nuevoProveedor.trim() || this.nuevoTotal <= 0) return;

    const nueva: OrdenCompra = {
      id: crypto.randomUUID(),
      numero: `OC-${Date.now().toString().slice(-6)}`,
      fecha: new Date().toLocaleDateString('es-ES'),
      proveedor: this.nuevoProveedor.trim(),
      condicion: this.nuevaCondicion,
      total: this.nuevoTotal,
      estado: 'Aprobada'
    };

    const actualizadas = [nueva, ...this.ordenes()];
    this.ordenes.set(actualizadas);
    localStorage.setItem(this.storageKey(), JSON.stringify(actualizadas));

    this.service.registrarEventoAuditoria(
      'COMPRAS',
      'CREAR_ORDEN_COMPRA',
      `${nueva.numero} ($${this.nuevoTotal.toFixed(2)})`,
      'INFO',
      `Proveedor: ${nueva.proveedor} (${nueva.condicion})`
    );

    this.nuevoProveedor = '';
    this.nuevoTotal = 0;
    this.mostrarModal = false;
  }
}
