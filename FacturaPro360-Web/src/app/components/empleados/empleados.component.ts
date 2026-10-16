import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FacturaProService } from '../../services/facturapro.service';

interface Empleado {
  id: string;
  nombre: string;
  rol: string;
  correo: string;
  sucursal: string;
  comision: number;
  estado: string;
}

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Empleados y Vendedores</h1>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Empleados</span>
          </div>
        </div>

        <button (click)="mostrarModal = true" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Nuevo Empleado
        </button>
      </div>

      <!-- TABLA DE EMPLEADOS (100% DINÁMICA POR EMPRESA) -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Nombre Completo</th>
                <th class="py-3 px-4">Rol / Cargo</th>
                <th class="py-3 px-4">Correo</th>
                <th class="py-3 px-4">Sucursal</th>
                <th class="py-3 px-4 text-center">Comisión</th>
                <th class="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr *ngFor="let emp of listaEmpleados()" class="hover:bg-slate-50/70">
                <td class="py-3.5 px-4 font-bold text-slate-900">{{ emp.nombre }}</td>
                <td class="py-3.5 px-4">{{ emp.rol }}</td>
                <td class="py-3.5 px-4 text-slate-500">{{ emp.correo }}</td>
                <td class="py-3.5 px-4">{{ emp.sucursal }}</td>
                <td class="py-3.5 px-4 text-center font-mono font-medium">{{ emp.comision }}%</td>
                <td class="py-3.5 px-4 text-center">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    {{ emp.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Total en nómina: {{ listaEmpleados().length }} empleado(s)</span>
        </div>
      </div>

      <!-- MODAL CREAR EMPLEADO -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Registrar Nuevo Empleado</h3>
            <button (click)="mostrarModal = false" class="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
              <input type="text" [(ngModel)]="nuevoNombre" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Carlos Ramírez" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Cargo o Rol *</label>
              <input type="text" [(ngModel)]="nuevoCargo" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Vendedor de Mostrador" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <input type="email" [(ngModel)]="nuevoCorreo" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="ejemplo@empresa.com" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Comisión (%)</label>
                <input type="number" [(ngModel)]="nuevaComision" min="0" max="100" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" />
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Sucursal</label>
                <input type="text" [(ngModel)]="nuevaSucursal" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" />
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="mostrarModal = false" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button (click)="guardarEmpleado()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Guardar Empleado</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EmpleadosComponent {
  private auth = inject(AuthService);
  private service = inject(FacturaProService);

  mostrarModal = false;
  nuevoNombre = '';
  nuevoCargo = 'Vendedor';
  nuevoCorreo = '';
  nuevaComision = 2.5;
  nuevaSucursal = 'Sucursal Matriz';

  private storageKey = computed(() => 'facturapro_employees_' + this.service.getEmpresaActualId());

  empleadosAdicionales = signal<Empleado[]>([]);

  constructor() {
    this.cargarEmpleados();
  }

  cargarEmpleados() {
    const raw = localStorage.getItem(this.storageKey());
    if (raw) {
      try {
        this.empleadosAdicionales.set(JSON.parse(raw));
      } catch {
        this.empleadosAdicionales.set([]);
      }
    }
  }

  listaEmpleados = computed(() => {
    const currentUser = this.auth.currentUser();
    const adminPrincipal: Empleado = {
      id: currentUser?.id || 'emp-adm-01',
      nombre: currentUser?.nombre || 'Administrador General',
      rol: currentUser?.rol || 'Administrador de empresa',
      correo: currentUser?.email || 'admin@facturapro360.com',
      sucursal: 'Sucursal Matriz',
      comision: 0.0,
      estado: 'Activo'
    };

    return [adminPrincipal, ...this.empleadosAdicionales()];
  });

  guardarEmpleado() {
    if (!this.nuevoNombre.trim()) return;

    const nuevo: Empleado = {
      id: crypto.randomUUID(),
      nombre: this.nuevoNombre.trim(),
      rol: this.nuevoCargo.trim() || 'Vendedor',
      correo: this.nuevoCorreo.trim() || 'contacto@empresa.com',
      sucursal: this.nuevaSucursal.trim() || 'Sucursal Matriz',
      comision: this.nuevaComision,
      estado: 'Activo'
    };

    const actualizados = [...this.empleadosAdicionales(), nuevo];
    this.empleadosAdicionales.set(actualizados);
    localStorage.setItem(this.storageKey(), JSON.stringify(actualizados));

    this.service.registrarEventoAuditoria(
      'EMPLEADOS',
      'CREAR_EMPLEADO',
      `${nuevo.nombre} (${nuevo.rol})`,
      'INFO',
      `Empleado dado de alta con ${nuevo.comision}% de comisión.`
    );

    this.nuevoNombre = '';
    this.nuevoCorreo = '';
    this.mostrarModal = false;
  }
}
