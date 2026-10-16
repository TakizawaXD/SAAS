import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';
import { ConfirmService } from '../../services/confirm.service';
import { HelpService } from '../../services/help.service';
import { Cliente, TipoDocumentoCliente } from '../../models/facturapro.models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">

      <!-- ENCABEZADO Y BREADCRUMB -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Clientes y CRM</h1>
            <button (click)="help.mostrarAyuda('clientes')" 
                    class="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    title="Explicacion y ayuda sobre el modulo de clientes">
              ?
            </button>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Clientes y CRM</span>
          </div>
        </div>

        <!-- ACCIONES PRINCIPALES -->
        <div class="flex flex-wrap items-center gap-2">
          <button (click)="abrirModalNuevo()" class="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Nuevo cliente
          </button>

          <button (click)="abrirModalImportar()" class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Importar
          </button>

          <button (click)="exportarCsv()" class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Exportar
          </button>
        </div>
      </div>

      <!-- BARRA DE BÚSQUEDA Y FILTROS -->
      <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 w-full">
          <div class="relative flex-1 w-full">
            <input type="text" [(ngModel)]="filtroTexto" placeholder="Buscar por nombre, documento o teléfono..." 
                   class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
            <div class="absolute left-2.5 top-2 text-slate-400">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>

          <select [(ngModel)]="filtroEstado" class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none w-full sm:w-auto">
            <option value="Todos">Todos los estados</option>
            <option value="ConSaldo">Con saldo pendiente</option>
            <option value="AlDia">Al día ($0.00)</option>
          </select>
        </div>
      </div>

      <!-- TABLA DE CLIENTES EN TIEMPO REAL -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs min-w-[760px]">
            <thead class="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Cliente / Razón Social</th>
                <th class="py-3 px-4">Tipo Doc.</th>
                <th class="py-3 px-4">Identificación</th>
                <th class="py-3 px-4">Contacto</th>
                <th class="py-3 px-4">Teléfono</th>
                <th class="py-3 px-4 text-right">Saldo Actual</th>
                <th class="py-3 px-4 text-right">Límite Crédito</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr *ngFor="let c of clientesPaginados()" class="hover:bg-slate-50/70 transition">
                <td class="py-3 px-4">
                  <div class="font-bold text-slate-900">{{ c.razon_social }}</div>
                  <div class="text-[11px] text-slate-400 font-normal">{{ c.direccion || 'Sin dirección' }}</div>
                </td>
                <td class="py-3 px-4 font-mono text-slate-500">{{ c.tipo_documento }}</td>
                <td class="py-3 px-4 font-mono font-medium text-slate-700">{{ c.numero_documento }}</td>
                <td class="py-3 px-4 text-slate-600">{{ c.email || '—' }}</td>
                <td class="py-3 px-4 text-slate-600 font-mono">{{ c.telefono || '—' }}</td>
                <td class="py-3 px-4 text-right font-bold">
                  <span [ngClass]="c.saldo_actual > 0 ? 'text-amber-600' : 'text-emerald-600'">
                    \${{ c.saldo_actual | number:'1.2-2' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right text-slate-500 font-mono">\${{ c.limite_credito | number:'1.2-2' }}</td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end gap-1.5">
                    <!-- EDITAR -->
                    <button (click)="abrirModalEditar(c)" title="Editar cliente" 
                            class="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>

                    <!-- ELIMINAR (CON CONFIRMACIÓN "¿ESTÁS SEGURO?") -->
                    <button (click)="solicitarEliminar(c)" title="Eliminar cliente" 
                            class="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>

              <tr *ngIf="clientesFiltrados().length === 0">
                <td colspan="8" class="text-center py-8 text-slate-400">
                  No se encontraron clientes con los filtros aplicados.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINACIÓN FUNCIONAL -->
        <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Página {{ paginaActual() }} de {{ totalPaginas() }} (Total: {{ clientesFiltrados().length }} clientes)</span>
          <div class="flex items-center gap-1">
            <button (click)="cambiarPagina(-1)" [disabled]="paginaActual() <= 1" class="w-7 h-7 rounded border border-slate-200 bg-white disabled:opacity-40 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-50">&larr;</button>
            <span class="w-7 h-7 rounded bg-[#2563EB] text-white font-bold flex items-center justify-center shadow-xs">{{ paginaActual() }}</span>
            <button (click)="cambiarPagina(1)" [disabled]="paginaActual() >= totalPaginas()" class="w-7 h-7 rounded border border-slate-200 bg-white disabled:opacity-40 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-50">&rarr;</button>
          </div>
        </div>
      </div>

      <!-- MODAL IMPORTAR CLIENTES -->
      <div *ngIf="mostrarModalImportar()" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Importar Clientes Masivamente</h3>
            <button (click)="cerrarModalImportar()" class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">&times;</button>
          </div>

          <p class="text-xs text-slate-500">Pega los datos de tus clientes en formato separado por comas (CSV) o pulsa para cargar un ejemplo:</p>

          <textarea [(ngModel)]="textoImportar" rows="5" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-800" placeholder="TipoDoc,NumeroDoc,RazonSocial,Contacto,Email,Telefono,Direccion,LimiteCredito"></textarea>

          <div class="flex items-center justify-between pt-2">
            <button (click)="cargarEjemplosImportacion()" class="text-xs text-blue-600 font-semibold hover:underline">
              Cargar ejemplo CSV
            </button>
            <div class="flex items-center gap-2">
              <button (click)="cerrarModalImportar()" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button (click)="procesarImportacion()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Importar Clientes</button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL NUEVO / EDITAR CLIENTE -->
      <div *ngIf="mostrarModal()" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl animate-fade-in max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 class="text-base font-bold text-slate-900">
              {{ modoEdicion() ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente' }}
            </h3>
            <button (click)="cerrarModal()" class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">&times;</button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Tipo de Documento</label>
                <select [(ngModel)]="formCliente.tipo_documento" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500">
                  <option value="RUC/NIT">RUC / NIT</option>
                  <option value="Cedula">Cédula Física</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="ConsumidorFinal">Consumidor Final</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Identificación Fiscal *</label>
                <input type="text" [(ngModel)]="formCliente.numero_documento" placeholder="Ej: 3-101-567834" 
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Razón Social o Nombre Completo *</label>
              <input type="text" [(ngModel)]="formCliente.razon_social" placeholder="Ej: Comercial López S.R.L." 
                     class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                <input type="text" [(ngModel)]="formCliente.telefono" placeholder="+506 2233-3333" 
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input type="email" [(ngModel)]="formCliente.email" placeholder="contacto@empresa.com" 
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Límite de Crédito ($)</label>
                <input type="number" min="0" [(ngModel)]="formCliente.limite_credito" 
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Dirección Física</label>
                <input type="text" [(ngModel)]="formCliente.direccion" placeholder="Ciudad, País" 
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button (click)="cerrarModal()" class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer">
                Cancelar
              </button>
              <button (click)="guardarCliente()" [disabled]="!formCliente.razon_social || !formCliente.numero_documento" 
                      class="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold shadow-sm cursor-pointer">
                {{ modoEdicion() ? 'Actualizar Cliente' : 'Guardar Cliente' }}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class ClientesComponent {
  private service = inject(FacturaProService);
  private confirmService = inject(ConfirmService);
  help = inject(HelpService);

  filtroTexto = '';
  filtroEstado = 'Todos';

  mostrarModal = signal<boolean>(false);
  modoEdicion = signal<boolean>(false);
  clienteEnEdicionId: string | null = null;

  paginaActual = signal<number>(1);
  itemsPorPagina = 8;
  mostrarModalImportar = signal<boolean>(false);
  textoImportar = '';

  formCliente = {
    tipo_documento: 'RUC/NIT' as TipoDocumentoCliente,
    numero_documento: '',
    razon_social: '',
    nombre_contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    limite_credito: 1000
  };

  clientesFiltrados = computed(() => {
    let list = this.service.clientes();

    if (this.filtroEstado === 'ConSaldo') {
      list = list.filter(c => c.saldo_actual > 0);
    } else if (this.filtroEstado === 'AlDia') {
      list = list.filter(c => c.saldo_actual === 0);
    }

    if (this.filtroTexto.trim()) {
      const q = this.filtroTexto.toLowerCase();
      list = list.filter(c => 
        c.razon_social.toLowerCase().includes(q) ||
        c.numero_documento.toLowerCase().includes(q) ||
        (c.telefono && c.telefono.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    }

    return list;
  });

  totalPaginas = computed(() => {
    const total = this.clientesFiltrados().length;
    return Math.max(1, Math.ceil(total / this.itemsPorPagina));
  });

  clientesPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.clientesFiltrados().slice(inicio, inicio + this.itemsPorPagina);
  });

  cambiarPagina(delta: number) {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) {
      this.paginaActual.set(nueva);
    }
  }

  abrirModalImportar() {
    this.mostrarModalImportar.set(true);
  }

  cerrarModalImportar() {
    this.mostrarModalImportar.set(false);
  }

  cargarEjemplosImportacion() {
    this.textoImportar = `RUC/NIT,3-101-998877,Corporacion Global SA,Carlos Mendoza,carlos@global.com,+506 2200-1122,San Jose Central,5000\nCedula,1-1234-0567,Mariana Gomez Soto,Mariana Gomez,mgomez@correo.com,+506 8899-7766,Heredia,1500`;
  }

  procesarImportacion() {
    if (!this.textoImportar.trim()) return;
    const lineas = this.textoImportar.trim().split('\n');
    for (const linea of lineas) {
      const partes = linea.split(',').map(s => s.trim());
      if (partes.length >= 3) {
        this.service.agregarCliente({
          tipo_documento: (partes[0] || 'RUC/NIT') as TipoDocumentoCliente,
          numero_documento: partes[1] || '0-000-000',
          razon_social: partes[2],
          nombre_contacto: partes[3] || '',
          email: partes[4] || '',
          telefono: partes[5] || '',
          direccion: partes[6] || '',
          limite_credito: Number(partes[7]) || 1000
        });
      }
    }
    this.textoImportar = '';
    this.cerrarModalImportar();
  }

  exportarCsv() {
    const clientes = this.clientesFiltrados();
    let csv = 'TipoDoc,Identificacion,RazonSocial,Contacto,Email,Telefono,Direccion,SaldoActual,LimiteCredito\r\n';
    clientes.forEach(c => {
      csv += `"${c.tipo_documento}","${c.numero_documento}","${c.razon_social}","${c.nombre_contacto || ''}","${c.email || ''}","${c.telefono || ''}","${c.direccion || ''}",${c.saldo_actual},${c.limite_credito}\r\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  abrirModalNuevo() {
    this.modoEdicion.set(false);
    this.clienteEnEdicionId = null;
    this.formCliente = {
      tipo_documento: 'RUC/NIT',
      numero_documento: '',
      razon_social: '',
      nombre_contacto: '',
      email: '',
      telefono: '',
      direccion: '',
      limite_credito: 1000
    };
    this.mostrarModal.set(true);
  }

  abrirModalEditar(c: Cliente) {
    this.modoEdicion.set(true);
    this.clienteEnEdicionId = c.id;
    this.formCliente = {
      tipo_documento: c.tipo_documento,
      numero_documento: c.numero_documento,
      razon_social: c.razon_social,
      nombre_contacto: c.nombre_contacto || '',
      email: c.email || '',
      telefono: c.telefono || '',
      direccion: c.direccion || '',
      limite_credito: c.limite_credito
    };
    this.mostrarModal.set(true);
  }

  cerrarModal() {
    this.mostrarModal.set(false);
  }

  guardarCliente() {
    if (!this.formCliente.razon_social || !this.formCliente.numero_documento) return;

    if (this.modoEdicion() && this.clienteEnEdicionId) {
      this.service.actualizarCliente(this.clienteEnEdicionId, {
        tipo_documento: this.formCliente.tipo_documento,
        numero_documento: this.formCliente.numero_documento,
        razon_social: this.formCliente.razon_social,
        nombre_contacto: this.formCliente.nombre_contacto,
        email: this.formCliente.email,
        telefono: this.formCliente.telefono,
        direccion: this.formCliente.direccion,
        limite_credito: Number(this.formCliente.limite_credito)
      });
    } else {
      this.service.agregarCliente({
        tipo_documento: this.formCliente.tipo_documento,
        numero_documento: this.formCliente.numero_documento,
        razon_social: this.formCliente.razon_social,
        nombre_contacto: this.formCliente.nombre_contacto,
        email: this.formCliente.email,
        telefono: this.formCliente.telefono,
        direccion: this.formCliente.direccion,
        limite_credito: Number(this.formCliente.limite_credito)
      });
    }

    this.cerrarModal();
  }

  async solicitarEliminar(c: Cliente) {
    if (c.saldo_actual > 0) {
      await this.confirmService.confirm({
        title: 'Acción bloqueada por seguridad financiera',
        message: `No es posible eliminar al cliente "${c.razon_social}" porque tiene una deuda activa pendiente de $${c.saldo_actual.toFixed(2)}. Debe saldar o anular sus facturas antes de proceder.`,
        itemNombre: `${c.razon_social} — Deuda: $${c.saldo_actual.toFixed(2)}`,
        confirmText: 'Entendido',
        tipo: 'warning'
      });
      return;
    }

    const confirmado = await this.confirmService.confirm({
      title: '¿Estás seguro de eliminar este cliente?',
      message: `Esta acción eliminará al cliente comercial y todo su historial de contacto de forma permanente en la base de datos. Se generará un registro de auditoría estricto.`,
      itemNombre: `${c.razon_social} (${c.numero_documento})`,
      confirmText: 'Sí, eliminar cliente',
      cancelText: 'Cancelar',
      tipo: 'danger'
    });

    if (confirmado) {
      this.service.eliminarCliente(c.id);
    }
  }
}
