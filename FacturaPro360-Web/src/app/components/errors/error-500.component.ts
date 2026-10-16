import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FacturaProService } from '../../services/facturapro.service';

@Component({
  selector: 'app-error-500',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center p-6">
      <div class="max-w-xl w-full bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden">
        
        <!-- DECORACIÓN SUPERIOR -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600"></div>

        <!-- INSIGNIA DE ESTADO HTTP -->
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold mb-6">
          <span class="w-2 h-2 rounded-full bg-amber-600"></span>
          <span>HTTP 500 &bull; EXCEPCIÓN INTERNA CAPTURADA</span>
        </div>

        <!-- ÍCONO VECTORIAL DE SERVIDOR / FALLO -->
        <div class="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-6 shadow-sm">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
          </svg>
        </div>

        <!-- TÍTULO Y DESCRIPCIÓN -->
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Interrupción de Servicio Controlada</h1>
        <p class="text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
          El motor de FacturaPro 360 detectó una condición inesperada. Por salvaguarda de la integridad de los libros fiscales, la transacción fue pausada sin pérdida de información.
        </p>

        <!-- CAJA DE CÓDIGO DE INCIDENCIA -->
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6 font-mono text-xs space-y-1.5">
          <div class="flex items-center justify-between text-slate-500">
            <span>Ticket de Incidencia:</span>
            <span class="text-blue-600 font-bold">{{ codigoIncidente }}</span>
          </div>
          <div class="flex items-center justify-between text-slate-500">
            <span>Estado de Transacción:</span>
            <span class="text-emerald-600 font-bold">ROLLBACK EXITOSO (SIN PÉRDIDAS)</span>
          </div>
          <div class="flex items-center justify-between text-slate-500">
            <span>Capa de Protección:</span>
            <span class="text-slate-800">Fault-Tolerance Memory Guard</span>
          </div>
        </div>

        <!-- ACCIONES RÁPIDAS -->
        <div class="flex flex-wrap items-center justify-center gap-3">
          <button (click)="reintentar()" class="px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-2 cursor-pointer shadow-xs">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Reintentar Operación
          </button>

          <a routerLink="/" class="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-md transition flex items-center gap-2 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Recuperar Sesión Segura
          </a>
        </div>

      </div>
    </div>
  `
})
export class Error500Component implements OnInit {
  private service = inject(FacturaProService);
  codigoIncidente = 'INC-' + Math.floor(100000 + Math.random() * 900000);

  ngOnInit() {
    this.service.registrarEventoAuditoria(
      'MOTOR_TRANSACCIONAL',
      'SYSTEM_FAULT_INTERCEPTED',
      `Incidente: ${this.codigoIncidente}`,
      'DANGER',
      `Excepción interceptada por el subsistema de contención de fallos. Código asignado: ${this.codigoIncidente}`
    );
  }

  reintentar() {
    window.location.reload();
  }
}
