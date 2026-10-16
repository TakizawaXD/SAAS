import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpService } from '../../services/help.service';

@Component({
  selector: 'app-help-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="help.modalAbierto()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      
      <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        <!-- CABECERA DEL MODAL DE AYUDA -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shadow-blue-500/30">
              ?
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-900 tracking-tight">{{ help.ayudaActiva()?.titulo }}</h2>
              <p class="text-[11px] text-slate-500">{{ help.ayudaActiva()?.subtitulo }}</p>
            </div>
          </div>
          
          <button (click)="help.cerrarAyuda()" 
                  class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center font-bold text-base transition cursor-pointer"
                  aria-label="Cerrar ventana de ayuda">
            &times;
          </button>
        </div>

        <!-- CUERPO EXPLICATIVO SCROLLEABLE -->
        <div class="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          <!-- 1. PROPÓSITO -->
          <div class="space-y-1.5">
            <div class="text-[10px] font-bold uppercase tracking-wider text-blue-600">Proposito de la seccion</div>
            <p class="text-slate-800 leading-relaxed font-medium">
              {{ help.ayudaActiva()?.proposito }}
            </p>
          </div>

          <!-- 2. CÓMO SE UTILIZA PASO A PASO -->
          <div class="space-y-2" *ngIf="(help.ayudaActiva()?.pasos?.length || 0) > 0">
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Como utilizar esta seccion paso a paso</div>
            <div class="space-y-1.5">
              <div *ngFor="let paso of help.ayudaActiva()?.pasos; let i = index" 
                   class="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {{ i + 1 }}
                </span>
                <span class="leading-relaxed text-slate-700">{{ paso }}</span>
              </div>
            </div>
          </div>

          <!-- 3. CAMPOS IMPORTANTES EXPLICADOS -->
          <div class="space-y-2" *ngIf="(help.ayudaActiva()?.campos?.length || 0) > 0">
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Datos y campos importantes</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div *ngFor="let campo of help.ayudaActiva()?.campos" 
                   class="p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div class="font-bold text-slate-900 text-[11px]">{{ campo.nombre }}</div>
                <div class="text-[10px] text-slate-500 mt-0.5 leading-snug">{{ campo.descripcion }}</div>
              </div>
            </div>
          </div>

          <!-- 4. CONSEJOS ÚTILES PARA EL NEGOCIO -->
          <div class="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 space-y-1.5" *ngIf="(help.ayudaActiva()?.consejos?.length || 0) > 0">
            <div class="font-bold text-blue-900 text-xs flex items-center gap-1.5">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Recomendaciones operativas</span>
            </div>
            <ul class="space-y-1 text-[11px] text-blue-800 list-disc list-inside">
              <li *ngFor="let consejo of help.ayudaActiva()?.consejos">{{ consejo }}</li>
            </ul>
          </div>

        </div>

        <!-- PIE DEL MODAL CON BOTÓN DE CIERRE -->
        <div class="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span class="text-[10px] text-slate-400">FacturaPro 360 &bull; Asistencia Integrada en Espanol</span>
          <button (click)="help.cerrarAyuda()" 
                  class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition cursor-pointer">
            Entendido
          </button>
        </div>

      </div>

    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out forwards;
    }
  `]
})
export class HelpModalComponent {
  help = inject(HelpService);
}
