import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';

interface Documento {
  id: string;
  nombre: string;
  categoria: string;
  fecha: string;
  tamano: string;
}

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Gestor Documental</h1>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Documentos</span>
          </div>
        </div>

        <button (click)="mostrarModal = true" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          Subir Archivo o Contrato
        </button>
      </div>

      <!-- LISTA DE ARCHIVOS (100% DINÁMICA POR EMPRESA) -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 font-bold text-xs text-slate-800">
          Archivos Registrados en Repositorio ({{ documentos().length }})
        </div>

        <div *ngIf="documentos().length === 0" class="py-12 text-center">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          </div>
          <h3 class="text-xs font-bold text-slate-800">Repositorio documental en blanco</h3>
          <p class="text-[11px] text-slate-400 mt-1 mb-4 max-w-sm mx-auto">
            Aún no has subido contratos ni comprobantes escaneados para esta empresa.
          </p>
          <button (click)="mostrarModal = true" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs">
            + Subir primer documento
          </button>
        </div>

        <div *ngIf="documentos().length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Documento</th>
                <th class="py-3 px-4">Categoría</th>
                <th class="py-3 px-4">Fecha de Carga</th>
                <th class="py-3 px-4">Tamaño</th>
                <th class="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr *ngFor="let doc of documentos()" class="hover:bg-slate-50/70">
                <td class="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                  <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                  <span>{{ doc.nombre }}</span>
                </td>
                <td class="py-3.5 px-4 text-slate-500">{{ doc.categoria }}</td>
                <td class="py-3.5 px-4 text-slate-400">{{ doc.fecha }}</td>
                <td class="py-3.5 px-4 text-slate-500">{{ doc.tamano }}</td>
                <td class="py-3.5 px-4 text-right">
                  <span class="text-emerald-600 font-semibold text-[11px]">Disponible</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL SUBIR DOCUMENTO -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Registrar Documento o Contrato</h3>
            <button (click)="mostrarModal = false" class="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nombre del Archivo *</label>
              <input type="text" [(ngModel)]="nuevoNombre" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Contrato_Comercial_2026.pdf" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Categoría</label>
              <select [(ngModel)]="nuevaCategoria" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2">
                <option value="Legal y Contratos">Legal y Contratos</option>
                <option value="Tributario y Fiscal">Tributario y Fiscal</option>
                <option value="Manuales y Operaciones">Manuales y Operaciones</option>
                <option value="Listas de Precios">Listas de Precios</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="mostrarModal = false" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button (click)="guardarDocumento()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Registrar Archivo</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DocumentosComponent {
  private service = inject(FacturaProService);

  mostrarModal = false;
  nuevoNombre = '';
  nuevaCategoria = 'Legal y Contratos';

  private storageKey = computed(() => 'facturapro_documents_' + this.service.getEmpresaActualId());
  documentos = signal<Documento[]>([]);

  constructor() {
    this.cargarDocumentos();
  }

  cargarDocumentos() {
    const raw = localStorage.getItem(this.storageKey());
    if (raw) {
      try {
        this.documentos.set(JSON.parse(raw));
      } catch {
        this.documentos.set([]);
      }
    }
  }

  guardarDocumento() {
    if (!this.nuevoNombre.trim()) return;

    const nuevo: Documento = {
      id: crypto.randomUUID(),
      nombre: this.nuevoNombre.trim(),
      categoria: this.nuevaCategoria,
      fecha: new Date().toLocaleDateString('es-ES'),
      tamano: '520 KB'
    };

    const actualizados = [nuevo, ...this.documentos()];
    this.documentos.set(actualizados);
    localStorage.setItem(this.storageKey(), JSON.stringify(actualizados));

    this.service.registrarEventoAuditoria(
      'DOCUMENTOS',
      'CARGAR_DOCUMENTO',
      nuevo.nombre,
      'INFO',
      `Categoría: ${nuevo.categoria}`
    );

    this.nuevoNombre = '';
    this.mostrarModal = false;
  }
}
