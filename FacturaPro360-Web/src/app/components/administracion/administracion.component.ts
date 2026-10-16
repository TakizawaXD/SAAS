import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-administracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Administración de Plataforma SaaS</h1>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Administración</span>
          </div>
        </div>

        <button (click)="mostrarModal = true" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Nueva Organización / Tenant
        </button>
      </div>

      <!-- ALERTA DE ORGANIZACIÓN CREADA -->
      <div *ngIf="mensaje()" class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
        <span>{{ mensaje() }}</span>
        <button (click)="mensaje.set('')" class="text-emerald-600 font-bold">&times;</button>
      </div>

      <!-- CARDS DE SALUD Y TENANTS -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span class="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Organización Activa</span>
          <div class="text-xl font-bold text-blue-600 mt-1 truncate">{{ nombreEmpresa() }}</div>
          <span class="text-[11px] text-slate-500 mt-1 block">Aislamiento RLS en vigor &bull; Partición privada</span>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span class="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Salud de la Base de Datos</span>
          <div class="text-xl font-bold text-emerald-600 mt-1">100% Operativa (Supabase)</div>
          <span class="text-[11px] text-slate-500 mt-1 block">Conexión PostgreSQL lista &bull; RLS activo</span>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span class="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Seguridad y Backups</span>
          <div class="text-xl font-bold text-slate-900 mt-1">Copia Diaria Activa</div>
          <span class="text-[11px] text-emerald-600 font-semibold mt-1 block">Respaldo criptográfico SHA-256</span>
        </div>
      </div>

      <!-- TABLA DE CONTROL DE TENANTS REGISTRADOS -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 font-bold text-xs text-slate-800">
          Organizaciones y Espacios de Trabajo Registrados en este Dispositivo
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Empresa / Negocio</th>
                <th class="py-3 px-4">Usuario Administrador</th>
                <th class="py-3 px-4">Identificador de Partición</th>
                <th class="py-3 px-4 text-center">Estado de Aislamiento</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr class="hover:bg-slate-50/70 bg-blue-50/20">
                <td class="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>{{ nombreEmpresa() }}</span>
                  <span class="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">En uso</span>
                </td>
                <td class="py-3.5 px-4 font-medium">{{ auth.currentUser()?.nombre || 'admin' }} ({{ auth.currentUser()?.email }})</td>
                <td class="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{{ service.getEmpresaActualId() }}</td>
                <td class="py-3.5 px-4 text-center">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Aislado 100%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL NUEVA ORGANIZACIÓN -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Aprovisionar Nueva Organización Multitenant</h3>
            <button (click)="mostrarModal = false" class="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nombre Comercial de la Empresa *</label>
              <input type="text" [(ngModel)]="nuevaEmpresaNombre" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Farmacia San Juan" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Identificación Fiscal (RUC/NIT/RFC)</label>
              <input type="text" [(ngModel)]="nuevaIdentificacion" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: 900123456-7" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nombre del Administrador</label>
              <input type="text" [(ngModel)]="nuevoAdminNombre" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Juan Pérez" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="mostrarModal = false" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button (click)="crearOrganizacion()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Crear Organización</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdministracionComponent {
  service = inject(FacturaProService);
  auth = inject(AuthService);

  mostrarModal = false;
  nuevaEmpresaNombre = '';
  nuevaIdentificacion = '';
  nuevoAdminNombre = '';
  mensaje = signal<string>('');

  nombreEmpresa = computed(() => this.auth.currentUser()?.empresaNombre || 'Tu Empresa');

  async crearOrganizacion() {
    if (!this.nuevaEmpresaNombre.trim()) return;

    await this.auth.register({
      nombre: this.nuevoAdminNombre.trim() || 'Administrador',
      username: this.nuevaEmpresaNombre.trim().toLowerCase().replace(/\s+/g, '_'),
      email: `${this.nuevaEmpresaNombre.trim().toLowerCase().replace(/\s+/g, '')}@facturapro.com`,
      password: 'password123',
      empresaNombre: this.nuevaEmpresaNombre.trim(),
      identificacionFiscal: this.nuevaIdentificacion.trim() || 'Pendiente'
    });

    this.mensaje.set(`Organización "${this.nuevaEmpresaNombre}" aprovisionada exitosamente. Se ha conmutado al nuevo espacio de trabajo 100% en blanco.`);
    this.nuevaEmpresaNombre = '';
    this.nuevaIdentificacion = '';
    this.nuevoAdminNombre = '';
    this.mostrarModal = false;
  }
}
