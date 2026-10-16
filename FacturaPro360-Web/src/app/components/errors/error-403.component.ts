import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FacturaProService } from '../../services/facturapro.service';

@Component({
  selector: 'app-error-403',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center p-6">
      <div class="max-w-xl w-full bg-white rounded-2xl border border-rose-200/80 shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden">
        
        <!-- DECORACIÓN SUPERIOR DE PELIGRO -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600"></div>

        <!-- INSIGNIA DE ESTADO HTTP -->
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold mb-6">
          <span class="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
          <span>HTTP 403 &bull; ACCESO DENEGADO / PRIVILEGIOS INSUFICIENTES</span>
        </div>

        <!-- ESCUDO DE BLOQUEO (0 EMOJIS, 100% SVG) -->
        <div class="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-6 shadow-sm">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>

        <!-- TÍTULO Y DESCRIPCIÓN -->
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Restricción de Seguridad Activa</h1>
        <p class="text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-6">
          Tu cuenta o rol actual no cuenta con autorización para visualizar o ejecutar operaciones sobre este recurso corporativo restringido.
        </p>

        <!-- CAJA DE DIAGNÓSTICO DE CREDENCIALES -->
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left mb-6 text-xs space-y-2">
          <div class="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span class="text-slate-500">Usuario autenticado:</span>
            <span class="font-bold text-slate-800 font-mono">{{ auth.currentUser()?.username || 'Anónimo' }}</span>
          </div>
          <div class="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <span class="text-slate-500">Rol asignado:</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">{{ auth.currentUser()?.rol || 'Invitado' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500">Nivel de autorización exigido:</span>
            <span class="font-mono text-rose-600 font-bold">SUPERADMIN_PRIVILEGE</span>
          </div>
        </div>

        <!-- ACCIONES RÁPIDAS -->
        <div class="flex flex-wrap items-center justify-center gap-3">
          <button (click)="volverAtras()" class="px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition flex items-center gap-2 cursor-pointer shadow-xs">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Volver a la vista autorizada
          </button>

          <a routerLink="/" class="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-md transition flex items-center gap-2 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            Panel Principal
          </a>
        </div>

        <!-- FOOTER DE SEGURIDAD -->
        <div class="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <svg class="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <span>Intento de elevación o acceso no autorizado registrado en la bitácora</span>
        </div>

      </div>
    </div>
  `
})
export class Error403Component implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  private service = inject(FacturaProService);

  ngOnInit() {
    this.service.registrarEventoAuditoria(
      'SEGURIDAD',
      'UNAUTHORIZED_ACCESS_BLOCKED',
      `Ruta 403: ${this.router.url}`,
      'DANGER',
      `Bloqueado acceso por falta de privilegios requeridos para el usuario ${this.auth.currentUser()?.username || 'Anónimo'}`
    );
  }

  volverAtras() {
    window.history.back();
  }
}
