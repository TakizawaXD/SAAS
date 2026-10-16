import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="confirmService.isOpen()" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div class="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
        
        <!-- ENCABEZADO CON ICONO -->
        <div class="flex items-start gap-4">
          <div [ngClass]="{
            'bg-rose-50 border-rose-200 text-rose-600': confirmService.options().tipo === 'danger',
            'bg-amber-50 border-amber-200 text-amber-600': confirmService.options().tipo === 'warning',
            'bg-blue-50 border-blue-200 text-blue-600': confirmService.options().tipo === 'info'
          }" class="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0">
            <svg *ngIf="confirmService.options().tipo === 'danger'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <svg *ngIf="confirmService.options().tipo !== 'danger'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>

          <div class="flex-1">
            <h3 class="text-lg font-bold text-slate-900 tracking-tight">
              {{ confirmService.options().title || '¿Estás seguro?' }}
            </h3>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              {{ confirmService.options().message }}
            </p>
          </div>
        </div>

        <!-- RECUADRO DE ELEMENTO AFECTADO -->
        <div *ngIf="confirmService.options().itemNombre" class="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span class="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-0.5">Elemento a procesar:</span>
          <span class="text-xs font-bold text-slate-800 break-all">{{ confirmService.options().itemNombre }}</span>
        </div>

        <!-- VERIFICACIÓN DE SEGURIDAD (OPCIONAL) -->
        <div *ngIf="confirmService.options().requiereTextoConfirmacion" class="mt-4">
          <label class="block text-xs font-semibold text-slate-700 mb-1">
            Para confirmar, escribe <span class="font-mono text-rose-600 font-bold">ELIMINAR</span>:
          </label>
          <input type="text" [(ngModel)]="textoVerificacion" placeholder="Escribe ELIMINAR"
                 class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-rose-500" />
        </div>

        <!-- BOTONES DE ACCIÓN -->
        <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button (click)="confirmService.handleCancel()"
                  class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer">
            {{ confirmService.options().cancelText || 'Cancelar' }}
          </button>

          <button (click)="onConfirm()"
                  [disabled]="confirmService.options().requiereTextoConfirmacion && textoVerificacion !== 'ELIMINAR'"
                  [ngClass]="{
                    'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20': confirmService.options().tipo === 'danger',
                    'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20': confirmService.options().tipo === 'warning',
                    'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20': confirmService.options().tipo === 'info',
                    'opacity-50 cursor-not-allowed': confirmService.options().requiereTextoConfirmacion && textoVerificacion !== 'ELIMINAR'
                  }"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            {{ confirmService.options().confirmText || 'Sí, confirmar' }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class ConfirmModalComponent {
  confirmService = inject(ConfirmService);
  textoVerificacion = '';

  onConfirm() {
    this.textoVerificacion = '';
    this.confirmService.handleConfirm();
  }
}
