import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FacturaProService } from '../../services/facturapro.service';

@Component({
  selector: 'app-error-404',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center p-6">
      <div class="max-w-xl w-full bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 sm:p-10 text-center relative overflow-hidden">
        
        <!-- DECORACIÓN SUPERIOR -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-rose-500"></div>

        <!-- INSIGNIA DE ESTADO HTTP -->
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold mb-6">
          <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>HTTP 404 &bull; RECURSO NO LOCALIZADO</span>
        </div>

        <!-- GRÁFICO VECTORIAL DE SEGURIDAD (0 EMOJIS) -->
        <div class="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-6 shadow-inner">
          <svg class="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>

        <!-- TÍTULO Y DESCRIPCIÓN -->
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Página o recurso no encontrado</h1>
        <p class="text-sm text-slate-500 leading-relaxed max-w-md mx-auto mb-6">
          La dirección a la que intentas acceder no existe, ha sido reubicada o tu solicitud fue interceptada por las políticas de protección de rutas seguras.
        </p>

        <!-- CAJA DE DIAGNÓSTICO DE RUTA INTENTADA -->
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left mb-6 font-mono text-xs">
          <div class="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider mb-1">Ruta consultada:</div>
          <div class="text-slate-800 break-all select-all flex items-center gap-2">
            <span class="text-rose-500 font-bold">&gt;</span>
            <span>{{ rutaActual }}</span>
          </div>
        </div>

        <!-- ACCIONES RÁPIDAS -->
        <div class="flex flex-wrap items-center justify-center gap-3">
          <button (click)="volverAtras()" class="px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-2 cursor-pointer shadow-xs">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Volver a la pantalla anterior
          </button>

          <a routerLink="/" class="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Ir al Dashboard seguro
          </a>
        </div>

        <!-- FOOTER DE SEGURIDAD -->
        <div class="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <svg class="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          <span>FacturaPro 360 Shield &bull; Evento de navegación anómala registrado en auditoría</span>
        </div>

      </div>
    </div>
  `
})
export class Error404Component implements OnInit {
  private router = inject(Router);
  private service = inject(FacturaProService);

  rutaActual = '';

  ngOnInit() {
    this.rutaActual = this.router.url || 'Ruta desconocida';
    
    // Registrar evento de seguridad si la ruta tiene patrones de ataque o anomalías
    const esSospechosa = /([.]{2}|script|<|>|eval|admin_pass|config|etc|passwd|drop|table|select|null|undefined)/i.test(this.rutaActual);
    this.service.registrarEventoAuditoria(
      'SEGURIDAD',
      esSospechosa ? 'ATTACK_PROBE_BLOCKED' : 'ROUTE_NOT_FOUND',
      `Ruta 404: ${this.rutaActual}`,
      esSospechosa ? 'DANGER' : 'WARN',
      esSospechosa ? 'Detectado patrón de sondeo o inyección sospechosa en la URL.' : 'Navegación a página inexistente.'
    );
  }

  volverAtras() {
    window.history.back();
  }
}
