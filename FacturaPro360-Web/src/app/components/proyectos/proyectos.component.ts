import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';

interface Tarea {
  id: string;
  columna: 'todo' | 'inprogress' | 'done';
  etiqueta: string;
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Proyectos y Tareas</h1>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Proyectos y tareas</span>
          </div>
        </div>

        <button (click)="mostrarModal = true" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Nueva Tarea
        </button>
      </div>

      <!-- KANBAN BOARD DE TAREAS Y ENTREGABLES (100% DINÁMICO) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- POR HACER -->
        <div class="bg-slate-100/70 border border-slate-200 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between font-bold text-xs text-slate-700 pb-2 border-b border-slate-200">
            <span>Por Hacer ({{ tareasPorHacer().length }})</span>
            <span class="w-2 h-2 rounded-full bg-slate-400"></span>
          </div>

          <div *ngIf="tareasPorHacer().length === 0" class="py-6 text-center text-slate-400 text-xs">
            Sin tareas pendientes
          </div>

          <div *ngFor="let t of tareasPorHacer()" class="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600">{{ t.etiqueta }}</span>
              <button (click)="moverTarea(t.id, 'inprogress')" title="Mover a En Progreso" class="text-blue-600 hover:underline text-[10px] font-bold">&rarr;</button>
            </div>
            <div class="text-xs font-bold text-slate-900">{{ t.titulo }}</div>
            <div class="text-[11px] text-slate-500">{{ t.descripcion }}</div>
          </div>
        </div>

        <!-- EN PROGRESO -->
        <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between font-bold text-xs text-blue-900 pb-2 border-b border-blue-200">
            <span>En Progreso ({{ tareasEnProgreso().length }})</span>
            <span class="w-2 h-2 rounded-full bg-blue-600"></span>
          </div>

          <div *ngIf="tareasEnProgreso().length === 0" class="py-6 text-center text-slate-400 text-xs">
            Sin tareas en curso
          </div>

          <div *ngFor="let t of tareasEnProgreso()" class="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-2">
            <div class="flex items-center justify-between">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600">{{ t.etiqueta }}</span>
              <button (click)="moverTarea(t.id, 'done')" title="Mover a Completado" class="text-emerald-600 hover:underline text-[10px] font-bold">&check;</button>
            </div>
            <div class="text-xs font-bold text-slate-900">{{ t.titulo }}</div>
            <div class="text-[11px] text-slate-500">{{ t.descripcion }}</div>
          </div>
        </div>

        <!-- COMPLETADO -->
        <div class="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between font-bold text-xs text-emerald-900 pb-2 border-b border-emerald-200">
            <span>Completado ({{ tareasCompletadas().length }})</span>
            <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
          </div>

          <div *ngIf="tareasCompletadas().length === 0" class="py-6 text-center text-slate-400 text-xs">
            Sin tareas completadas
          </div>

          <div *ngFor="let t of tareasCompletadas()" class="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">{{ t.etiqueta }}</span>
            <div class="text-xs font-bold text-slate-900 line-through text-slate-400">{{ t.titulo }}</div>
            <div class="text-[11px] text-slate-400">{{ t.descripcion }}</div>
          </div>
        </div>

      </div>

      <!-- MODAL NUEVA TAREA -->
      <div *ngIf="mostrarModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
        <div class="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Crear Tarea en Tablero</h3>
            <button (click)="mostrarModal = false" class="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Título de la Tarea *</label>
              <input type="text" [(ngModel)]="nuevoTitulo" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Revisión de inventario físico" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Categoría / Etiqueta</label>
              <input type="text" [(ngModel)]="nuevaEtiqueta" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Ej: Facturación, Ventas, TI" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Descripción</label>
              <textarea [(ngModel)]="nuevaDescripcion" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2" placeholder="Detalle de los entregables..."></textarea>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button (click)="mostrarModal = false" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button (click)="guardarTarea()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Guardar Tarea</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProyectosComponent {
  private service = inject(FacturaProService);

  mostrarModal = false;
  nuevoTitulo = '';
  nuevaEtiqueta = 'Operaciones';
  nuevaDescripcion = '';

  private storageKey = computed(() => 'facturapro_tasks_' + this.service.getEmpresaActualId());
  tareas = signal<Tarea[]>([]);

  constructor() {
    this.cargarTareas();
  }

  cargarTareas() {
    const raw = localStorage.getItem(this.storageKey());
    if (raw) {
      try {
        this.tareas.set(JSON.parse(raw));
      } catch {
        this.tareas.set([]);
      }
    } else {
      // Tarea inicial sugerida para la nueva empresa
      const empNombre = this.service.getEmpresaActualNombre();
      const inicial: Tarea = {
        id: crypto.randomUUID(),
        columna: 'todo',
        etiqueta: 'Configuración',
        titulo: `Completar perfil de ${empNombre}`,
        descripcion: 'Verificar datos tributarios, teléfono y dirección en el menú de Configuración.'
      };
      this.tareas.set([inicial]);
      localStorage.setItem(this.storageKey(), JSON.stringify([inicial]));
    }
  }

  tareasPorHacer = computed(() => this.tareas().filter(t => t.columna === 'todo'));
  tareasEnProgreso = computed(() => this.tareas().filter(t => t.columna === 'inprogress'));
  tareasCompletadas = computed(() => this.tareas().filter(t => t.columna === 'done'));

  moverTarea(id: string, nuevaColumna: 'todo' | 'inprogress' | 'done') {
    const actualizadas = this.tareas().map(t => t.id === id ? { ...t, columna: nuevaColumna } : t);
    this.tareas.set(actualizadas);
    localStorage.setItem(this.storageKey(), JSON.stringify(actualizadas));
  }

  guardarTarea() {
    if (!this.nuevoTitulo.trim()) return;

    const nueva: Tarea = {
      id: crypto.randomUUID(),
      columna: 'todo',
      etiqueta: this.nuevaEtiqueta.trim() || 'General',
      titulo: this.nuevoTitulo.trim(),
      descripcion: this.nuevaDescripcion.trim()
    };

    const actualizadas = [nueva, ...this.tareas()];
    this.tareas.set(actualizadas);
    localStorage.setItem(this.storageKey(), JSON.stringify(actualizadas));

    this.nuevoTitulo = '';
    this.nuevaDescripcion = '';
    this.mostrarModal = false;
  }
}
