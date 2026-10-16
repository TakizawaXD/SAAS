import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-install-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- CONTENEDOR MODAL DE INSTALACION PWA (ESCRITORIO Y TELEFONO) -->
    <div *ngIf="pwa.modalVisible()" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      
      <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        <!-- CABECERA DEL MODAL CON LOGO Y BOTON CERRAR -->
        <div class="p-6 bg-slate-50 border-b border-slate-100 flex items-start justify-between">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-[#0B192C] flex items-center justify-center shadow-md p-1 border border-slate-700/40 shrink-0">
              <img src="/favicon.png" alt="FacturaPro 360" class="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    [ngClass]="pwa.esMovil() ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'">
                {{ pwa.esMovil() ? 'Aplicacion para Telefono' : 'Aplicacion de Escritorio' }}
              </span>
              <h2 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
                {{ pwa.esMovil() ? 'Instalar FacturaPro 360 en tu Telefono' : 'Instalar FacturaPro 360 en el Escritorio' }}
              </h2>
            </div>
          </div>

          <button (click)="pwa.cerrarModal()" 
                  class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center font-bold text-base transition cursor-pointer"
                  aria-label="Cerrar">
            &times;
          </button>
        </div>

        <!-- CUERPO PRINCIPAL DEL MODAL -->
        <div class="p-6 space-y-5 text-xs text-slate-600">
          
          <!-- DESCRIPCION GENERAL -->
          <p class="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
            {{ pwa.esMovil() 
               ? 'Accede a tu negocio directamente desde la pantalla de inicio de tu telefono movil, con interfaz en pantalla completa y carga inmediata.' 
               : 'Instala la aplicacion directamente en tu ordenador. Se abrira en una ventana independiente en tu escritorio de Windows o Mac sin barras de navegador.' }}
          </p>

          <!-- BENEFICIOS CLAVE -->
          <div class="space-y-2.5">
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ventajas de la instalacion</div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <div class="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5">
                <div class="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-[11px]">Acceso directo en 1 clic</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">
                    {{ pwa.esMovil() ? 'Icono en la pantalla de inicio de tu movil' : 'Icono en tu escritorio y barra de tareas' }}
                  </div>
                </div>
              </div>

              <div class="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5">
                <div class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-[11px]">Ventana independiente</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">Experiencia nativa sin pestanas de navegador</div>
                </div>
              </div>

              <div class="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5">
                <div class="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-[11px]">Adaptabilidad total</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">Disenado para pantallas tactiles y teclados</div>
                </div>
              </div>

              <div class="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start gap-2.5">
                <div class="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z"/></svg>
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-[11px]">Datos protegidos</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">Seguridad y cifrado multi-tenant intactos</div>
                </div>
              </div>

            </div>
          </div>

          <!-- GUIA ESPECIFICA PARA IPHONE / IPAD (IOS) -->
          <div *ngIf="pwa.esIos()" class="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2.5">
            <div class="font-bold text-blue-900 text-xs">Instrucciones para instalar en iPhone o iPad:</div>
            
            <div class="space-y-2">
              <div class="flex items-start gap-2.5 text-[11px] text-blue-800">
                <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <span>Pulsa el boton <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra inferior de Safari.</span>
              </div>
              <div class="flex items-start gap-2.5 text-[11px] text-blue-800">
                <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <span>Desplaza las opciones y selecciona <strong>Agregar a pantalla de inicio</strong>.</span>
              </div>
              <div class="flex items-start gap-2.5 text-[11px] text-blue-800">
                <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <span>Toca <strong>Agregar</strong> arriba a la derecha. La aplicacion quedara instalada en tu telefono.</span>
              </div>
            </div>
          </div>

          <!-- AYUDA PARA NAVEGADORES DE ESCRITORIO SIN PROMPT DIRECTO -->
          <div *ngIf="!pwa.esIos() && !pwa.puedeInstalarNativamente() && pwa.esDesktop()" class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
            <span>Si tu navegador no muestra la confirmacion automatica, pulsa el boton <strong>Instalar aplicacion</strong> o el icono <strong>(+)</strong> que aparece en el extremo derecho de tu barra de direcciones.</span>
          </div>

        </div>

        <!-- PIE DEL MODAL CON BOTONES DE ACCION -->
        <div class="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3 shrink-0">
          
          <button (click)="pwa.cerrarModal()" 
                  class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer">
            {{ pwa.esIos() ? 'Cerrar' : 'Mas tarde' }}
          </button>

          <button *ngIf="!pwa.esIos()" 
                  (click)="pwa.ejecutarInstalacion()" 
                  class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-2 transition cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            <span>{{ pwa.esMovil() ? 'Instalar en Telefono' : 'Instalar en Escritorio' }}</span>
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
export class InstallAppModalComponent {
  pwa = inject(PwaInstallService);
}
