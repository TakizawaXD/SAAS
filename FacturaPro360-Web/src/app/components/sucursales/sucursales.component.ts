import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';

interface Sucursal {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  telefono: string;
  almacen: string;
  esPrincipal: boolean;
  estado: string;
}

@Component({
  selector: 'app-sucursales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Sucursales y Almacenes</h1>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Sucursales y almacenes</span>
          </div>
        </div>

        <button (click)="mostrarModal = true" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Nueva Sucursal
        </button>
      </div>

      <!-- LISTA DE SUCURSALES (100% DINÁMICA POR EMPRESA) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let suc of listaSucursales()" class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold text-slate-900">{{ suc.nombre }}</h3>
                <span *ngIf="suc.esPrincipal" class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">Principal</span>
              </div>
              <span class="text-xs text-slate-400">Código: {{ suc.codigo }}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              {{ suc.estado }}
            </span>
          </div>
          <div class="mt-3 text-xs text-slate-600 space-y-1">
            <div><span class="font-medium text-slate-700">Dirección:</span> {{ suc.direccion || 'Domicilio fiscal de la empresa' }}</div>
            <div><span class="font-medium text-slate-700">Teléfono:</span> {{ suc.telefono || 'Sin teléfono asignado' }}</div>
            <div><span class="font-medium text-slate-700">Almacén vinculado:</span> {{ suc.almacen }}</div>
          </div>
        </div>
      </div>

      <!-- MODAL CREAR SUCURSAL -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Registrar Nueva Sucursal / Almacén</h3>
            <button (click)="mostrarModal = false" class="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-1">
                <label class="block font-semibold text-slate-700 mb-1">Código *</label>
                <input type="text" [(ngModel)]="nuevoCodigo" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="SUC-02" />
              </div>
              <div class="col-span-2">
                <label class="block font-semibold text-slate-700 mb-1">Nombre de Sucursal *</label>
                <input type="text" [(ngModel)]="nuevoNombre" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Sucursal Norte" />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Dirección Completa</label>
              <input type="text" [(ngModel)]="nuevaDireccion" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Calle / Avenida comercial" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Teléfono</label>
                <input type="text" [(ngModel)]="nuevoTelefono" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="+1 234 5678" />
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Nombre de Bodega / Almacén</label>
                <input type="text" [(ngModel)]="nuevoAlmacen" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Bodega Principal" />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="mostrarModal = false" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button (click)="guardarSucursal()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Guardar Sucursal</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SucursalesComponent {
  private service = inject(FacturaProService);

  mostrarModal = false;
  nuevoCodigo = 'SUC-02';
  nuevoNombre = '';
  nuevaDireccion = '';
  nuevoTelefono = '';
  nuevoAlmacen = 'Almacén General';

  private storageKey = computed(() => 'facturapro_branches_' + this.service.getEmpresaActualId());
  sucursalesAdicionales = signal<Sucursal[]>([]);

  constructor() {
    this.cargarSucursales();
  }

  cargarSucursales() {
    const raw = localStorage.getItem(this.storageKey());
    if (raw) {
      try {
        this.sucursalesAdicionales.set(JSON.parse(raw));
      } catch {
        this.sucursalesAdicionales.set([]);
      }
    }
  }

  listaSucursales = computed(() => {
    const emp = this.service.empresa();
    const matriz: Sucursal = {
      id: 'suc-matriz-01',
      codigo: 'MAT-01',
      nombre: `Sede Matriz (${emp.nombre_comercial || emp.razon_social})`,
      direccion: emp.direccion || 'Dirección de la empresa registrada',
      telefono: emp.telefono || '',
      almacen: 'Bodega Central de Despacho',
      esPrincipal: true,
      estado: 'Operativa'
    };

    return [matriz, ...this.sucursalesAdicionales()];
  });

  guardarSucursal() {
    if (!this.nuevoNombre.trim()) return;

    const nueva: Sucursal = {
      id: crypto.randomUUID(),
      codigo: this.nuevoCodigo.trim() || 'SUC-0' + (this.sucursalesAdicionales().length + 2),
      nombre: this.nuevoNombre.trim(),
      direccion: this.nuevaDireccion.trim(),
      telefono: this.nuevoTelefono.trim(),
      almacen: this.nuevoAlmacen.trim() || 'Bodega de Despacho',
      esPrincipal: false,
      estado: 'Operativa'
    };

    const actualizadas = [...this.sucursalesAdicionales(), nueva];
    this.sucursalesAdicionales.set(actualizadas);
    localStorage.setItem(this.storageKey(), JSON.stringify(actualizadas));

    this.service.registrarEventoAuditoria(
      'SUCURSALES',
      'CREAR_SUCURSAL',
      `${nueva.nombre} (${nueva.codigo})`,
      'INFO',
      'Sucursal y bodega registradas en el catálogo.'
    );

    this.nuevoNombre = '';
    this.nuevaDireccion = '';
    this.nuevoTelefono = '';
    this.mostrarModal = false;
  }
}
