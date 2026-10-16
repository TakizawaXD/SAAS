import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';
import { AuthService } from '../../services/auth.service';
import { HelpService } from '../../services/help.service';
import { EventoAuditoria } from '../../models/facturapro.models';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Registro de Auditoria Inmutable</h1>
            <button (click)="help.mostrarAyuda('auditoria')" 
                    class="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    title="Explicacion y ayuda sobre trazabilidad y auditoria">
              ?
            </button>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
              Encriptacion Activa
            </span>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Auditoría y Trazabilidad</span>
          </div>
        </div>

        <button (click)="exportarLogs()" class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer">
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Exportar Pista de Auditoría (.CSV)
        </button>
      </div>

      <!-- FILTROS Y ESTADÍSTICAS RÁPIDAS -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Eventos</div>
          <div class="text-xl font-bold text-slate-900 mt-1">{{ totalEventos() }}</div>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Acciones Críticas (DANGER)</div>
          <div class="text-xl font-bold text-rose-600 mt-1">{{ eventosDanger() }}</div>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Modificaciones (WARN)</div>
          <div class="text-xl font-bold text-amber-600 mt-1">{{ eventosWarn() }}</div>
        </div>
        <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Usuario Principal</div>
          <div class="text-xl font-bold text-blue-600 mt-1 font-mono">{{ auth.currentUser()?.username || 'admin' }}</div>
        </div>
      </div>

      <!-- BARRA DE BÚSQUEDA Y FILTRO -->
      <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button (click)="filtroSeveridad.set('TODAS')" [ngClass]="filtroSeveridad() === 'TODAS' ? 'bg-[#2563EB] text-white font-semibold' : 'bg-slate-50 text-slate-600 border border-slate-200'" class="px-3 py-1.5 rounded-lg text-xs cursor-pointer">
            Todas
          </button>
          <button (click)="filtroSeveridad.set('DANGER')" [ngClass]="filtroSeveridad() === 'DANGER' ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-50 text-slate-600 border border-slate-200'" class="px-3 py-1.5 rounded-lg text-xs cursor-pointer">
            Eliminaciones (DANGER)
          </button>
          <button (click)="filtroSeveridad.set('WARN')" [ngClass]="filtroSeveridad() === 'WARN' ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-50 text-slate-600 border border-slate-200'" class="px-3 py-1.5 rounded-lg text-xs cursor-pointer">
            Ediciones (WARN)
          </button>
          <button (click)="filtroSeveridad.set('INFO')" [ngClass]="filtroSeveridad() === 'INFO' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-50 text-slate-600 border border-slate-200'" class="px-3 py-1.5 rounded-lg text-xs cursor-pointer">
            Creaciones (INFO)
          </button>
        </div>

        <div class="relative w-64">
          <input type="text" [(ngModel)]="busqueda" placeholder="Buscar por acción o registro..." 
                 class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
          <div class="absolute left-2.5 top-2 text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
      </div>

      <!-- TABLA DE LOGS EN VIVO -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Fecha / Hora</th>
                <th class="py-3 px-4">Usuario</th>
                <th class="py-3 px-4">Módulo</th>
                <th class="py-3 px-4">Acción</th>
                <th class="py-3 px-4">Registro Afectado</th>
                <th class="py-3 px-4">Detalles</th>
                <th class="py-3 px-4 text-center">Severidad</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700 font-mono">
              <tr *ngFor="let ev of eventosPaginados()" class="hover:bg-slate-50/70 transition">
                <td class="py-3 px-4 text-slate-400 font-sans whitespace-nowrap">{{ ev.fecha | date:'dd/MM/yyyy HH:mm:ss' }}</td>
                <td class="py-3 px-4 font-bold text-slate-900 font-sans">{{ ev.usuario }}</td>
                <td class="py-3 px-4 font-sans font-semibold text-blue-600">{{ ev.modulo }}</td>
                <td class="py-3 px-4 font-bold text-slate-800">{{ ev.accion }}</td>
                <td class="py-3 px-4 font-sans text-slate-900 font-medium">{{ ev.registro_afectado }}</td>
                <td class="py-3 px-4 font-sans text-slate-500 text-[11px] max-w-xs truncate">{{ ev.detalles || '—' }}</td>
                <td class="py-3 px-4 text-center">
                  <span [ngClass]="{
                    'bg-rose-50 text-rose-600 border-rose-200': ev.severidad === 'DANGER',
                    'bg-amber-50 text-amber-600 border-amber-200': ev.severidad === 'WARN',
                    'bg-blue-50 text-blue-600 border-blue-200': ev.severidad === 'INFO'
                  }" class="px-2 py-0.5 rounded-full text-[10px] font-bold border">
                    {{ ev.severidad }}
                  </span>
                </td>
              </tr>

              <tr *ngIf="eventosFiltrados().length === 0">
                <td colspan="7" class="text-center py-8 text-slate-400 font-sans">
                  No se registran eventos de auditoría con los filtros actuales.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-sans">
          <span>Página {{ paginaActual() }} de {{ totalPaginas() }} (Total: {{ eventosFiltrados().length }} registros inmutables)</span>
          <div class="flex items-center gap-1">
            <button (click)="cambiarPagina(-1)" [disabled]="paginaActual() <= 1" class="w-7 h-7 rounded border border-slate-200 bg-white disabled:opacity-40 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-50">&larr;</button>
            <span class="w-7 h-7 rounded bg-[#2563EB] text-white font-bold flex items-center justify-center shadow-xs">{{ paginaActual() }}</span>
            <button (click)="cambiarPagina(1)" [disabled]="paginaActual() >= totalPaginas()" class="w-7 h-7 rounded border border-slate-200 bg-white disabled:opacity-40 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-50">&rarr;</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuditoriaComponent {
  private service = inject(FacturaProService);
  auth = inject(AuthService);
  help = inject(HelpService);

  busqueda = '';
  filtroSeveridad = signal<string>('TODAS');

  paginaActual = signal<number>(1);
  itemsPorPagina = 10;

  eventos = this.service.eventosAuditoria;

  totalEventos = computed(() => this.eventos().length);
  eventosDanger = computed(() => this.eventos().filter(e => e.severidad === 'DANGER').length);
  eventosWarn = computed(() => this.eventos().filter(e => e.severidad === 'WARN').length);

  eventosFiltrados = computed(() => {
    let list = this.eventos();
    const sev = this.filtroSeveridad();
    if (sev !== 'TODAS') {
      list = list.filter(e => e.severidad === sev);
    }
    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      list = list.filter(e => 
        e.accion.toLowerCase().includes(q) ||
        e.modulo.toLowerCase().includes(q) ||
        e.registro_afectado.toLowerCase().includes(q) ||
        (e.detalles && e.detalles.toLowerCase().includes(q))
      );
    }
    return list;
  });

  totalPaginas = computed(() => {
    const total = this.eventosFiltrados().length;
    return Math.max(1, Math.ceil(total / this.itemsPorPagina));
  });

  eventosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.eventosFiltrados().slice(inicio, inicio + this.itemsPorPagina);
  });

  cambiarPagina(delta: number) {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) {
      this.paginaActual.set(nueva);
    }
  }

  exportarLogs() {
    const list = this.eventos();
    const headers = 'ID,Fecha,Usuario,Modulo,Accion,Registro,Severidad,Detalles\n';
    const rows = list.map(e => 
      `"${e.id}","${e.fecha}","${e.usuario}","${e.modulo}","${e.accion}","${e.registro_afectado}","${e.severidad}","${e.detalles || ''}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_facturapro_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
