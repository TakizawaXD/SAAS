import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-900/95 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div class="max-w-md md:max-w-4xl w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden md:grid md:grid-cols-12">
        
        <!-- ==================== BANNER VISUAL LATERAL (TABLET Y DESKTOP) ==================== -->
        <div class="hidden md:flex md:col-span-5 lg:col-span-6 relative bg-slate-950 p-8 flex-col justify-between overflow-hidden">
          <img src="/assets/images/login_hero.jpg" alt="FacturaPro 360 Analytics" 
               class="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity filter contrast-125" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>

          <!-- CABECERA DE MARCA -->
          <div class="relative z-10 flex items-center gap-3">
            <img src="/assets/images/logo.jpg" alt="Logo FacturaPro 360" class="w-10 h-10 rounded-xl object-cover shadow-lg border border-blue-500/30" />
            <div>
              <div class="text-white font-bold text-lg tracking-tight">FacturaPro <span class="text-blue-400 font-normal">360</span></div>
              <div class="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Plataforma Empresarial Multi-Tenant</div>
            </div>
          </div>

          <!-- BENEFICIOS Y SEGURIDAD -->
          <div class="relative z-10 space-y-4">
            <div class="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-2.5">
              <div class="flex items-center gap-2 text-xs font-bold text-white">
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                <span>Aislamiento Criptografico Multiempresa</span>
              </div>
              <p class="text-[11px] text-slate-300 leading-relaxed">
                Cada organizacion dispone de particiones de datos independientes, tokens con expiracion y proteccion automatica contra ataques de fuerza bruta.
              </p>
            </div>

            <div class="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
              <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Base PostgreSQL</span>
              <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Cifrado SHA-256</span>
            </div>
          </div>
        </div>

        <!-- ==================== FORMULARIO PRINCIPAL (RESPONSIVE) ==================== -->
        <div class="md:col-span-7 lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-center space-y-5">
          
          <div class="text-center md:text-left">
            <div class="flex items-center justify-center md:justify-start gap-3 mb-2">
              <img src="/assets/images/logo.jpg" alt="Logo FacturaPro 360" class="w-10 h-10 rounded-xl object-cover shadow-md md:hidden border border-slate-200" />
              <div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight">Iniciar Sesion</h1>
                <p class="text-xs text-slate-500">Acceso seguro a su espacio de trabajo</p>
              </div>
            </div>
          </div>

          <!-- ALERTA DE ERROR -->
          <div *ngIf="errorMensaje()" class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 shadow-xs">
            <svg class="w-4 h-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>{{ errorMensaje() }}</span>
          </div>

          <!-- MENSAJE DE ÉXITO O RECUPERACIÓN -->
          <div *ngIf="mensajeExito()" class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 shadow-xs">
            <svg class="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>{{ mensajeExito() }}</span>
          </div>

          <!-- FORMULARIO DE INICIO DE SESIÓN -->
          <form (ngSubmit)="iniciarSesion()" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">Usuario o Correo Electronico</label>
              <div class="relative">
                <input type="text" [(ngModel)]="usuario" name="usuario" required placeholder="adminfactura"
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition" />
                <div class="absolute left-3 top-3 text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-bold text-slate-700">Contrasena</label>
                <button type="button" (click)="abrirModalRecuperacion()" class="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0">
                  ¿Olvidaste tu contrasena?
                </button>
              </div>
              <div class="relative">
                <input type="password" [(ngModel)]="contrasena" name="contrasena" required placeholder="••••••••"
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition" />
                <div class="absolute left-3 top-3 text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
              </div>
            </div>

            <!-- CREDENCIALES DEMO RÁPIDAS -->
            <div class="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 space-y-1">
              <div class="font-bold flex items-center justify-between">
                <span>Acceso Rapido de Demostracion:</span>
                <span class="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-mono">ACTIVO</span>
              </div>
              <div class="flex flex-wrap gap-x-4">
                <div>Usuario: <code class="font-mono font-bold bg-white px-1 py-0.2 rounded border border-blue-200">adminfactura</code></div>
                <div>Clave: <code class="font-mono font-bold bg-white px-1 py-0.2 rounded border border-blue-200">admin123</code></div>
              </div>
            </div>

            <button type="submit" [disabled]="cargando()" 
                    class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition cursor-pointer flex items-center justify-center gap-2">
              <svg *ngIf="cargando()" class="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
              <span>{{ cargando() ? 'Autenticando...' : 'Iniciar Sesion' }}</span>
            </button>
          </form>

          <div class="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            ¿Deseas registrar un nuevo negocio independiente? 
            <a routerLink="/register" class="font-bold text-blue-600 hover:underline">Registrar Empresa</a>
          </div>
        </div>

      </div>

      <!-- ==================== MODAL DE RECUPERACIÓN DE CONTRASEÑA ==================== -->
      <div *ngIf="mostrarModalRecuperacion()" class="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Recuperacion de Contrasena</h3>
            <button (click)="cerrarModalRecuperacion()" class="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
          </div>

          <!-- ETAPA 1: SOLICITAR TOKEN -->
          <div *ngIf="etapaRecuperacion() === 1" class="space-y-3">
            <p class="text-xs text-slate-600 leading-relaxed">
              Ingrese el correo electronico o nombre de usuario asociado a su cuenta. Se generara un token de seguridad temporal con 15 minutos de vigencia.
            </p>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Correo o Usuario</label>
              <input type="text" [(ngModel)]="identificadorRecuperacion" placeholder="adminfactura@facturapro360.com"
                     class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button (click)="cerrarModalRecuperacion()" class="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                Cancelar
              </button>
              <button (click)="solicitarToken()" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">
                Generar Token
              </button>
            </div>
          </div>

          <!-- ETAPA 2: APLICAR TOKEN Y NUEVA CLAVE -->
          <div *ngIf="etapaRecuperacion() === 2" class="space-y-3">
            <div *ngIf="tokenGeneradoDemostracion()" class="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
              <div class="font-bold">Token de seguridad generado:</div>
              <code class="font-mono font-bold bg-white px-2 py-0.5 rounded text-blue-700 block mt-1">{{ tokenGeneradoDemostracion() }}</code>
              <div class="text-[10px] text-blue-600 mt-1">Copia y pega este token a continuacion para restablecer la clave.</div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Token de Seguridad *</label>
              <input type="text" [(ngModel)]="tokenIngresado" placeholder="tok_..."
                     class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Nueva Contrasena (Min. 8 caracteres) *</label>
              <input type="password" [(ngModel)]="nuevaContrasena" placeholder="••••••••"
                     class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button (click)="etapaRecuperacion.set(1)" class="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                Atras
              </button>
              <button (click)="ejecutarRestablecimiento()" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer">
                Guardar Nueva Clave
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  usuario = 'adminfactura';
  contrasena = 'admin123';
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  mostrarModalRecuperacion = signal<boolean>(false);
  etapaRecuperacion = signal<number>(1);
  identificadorRecuperacion = '';
  tokenIngresado = '';
  nuevaContrasena = '';
  tokenGeneradoDemostracion = signal<string | null>(null);

  async iniciarSesion() {
    this.cargando.set(true);
    this.errorMensaje.set(null);
    try {
      await this.auth.login(this.usuario, this.contrasena);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMensaje.set(err?.message || 'Error al iniciar sesion');
    } finally {
      this.cargando.set(false);
    }
  }

  abrirModalRecuperacion() {
    this.identificadorRecuperacion = this.usuario;
    this.tokenIngresado = '';
    this.nuevaContrasena = '';
    this.tokenGeneradoDemostracion.set(null);
    this.etapaRecuperacion.set(1);
    this.mostrarModalRecuperacion.set(true);
  }

  cerrarModalRecuperacion() {
    this.mostrarModalRecuperacion.set(false);
  }

  async solicitarToken() {
    if (!this.identificadorRecuperacion.trim()) {
      alert('Debe ingresar un correo electronico o usuario.');
      return;
    }
    const res = await this.auth.solicitarRecuperacionContrasena(this.identificadorRecuperacion);
    if (res.tokenTemporal) {
      this.tokenGeneradoDemostracion.set(res.tokenTemporal);
      this.tokenIngresado = res.tokenTemporal;
    }
    this.etapaRecuperacion.set(2);
  }

  async ejecutarRestablecimiento() {
    try {
      const res = await this.auth.restablecerContrasena(this.tokenIngresado, this.nuevaContrasena);
      this.cerrarModalRecuperacion();
      this.mensajeExito.set(res.mensaje);
      this.contrasena = this.nuevaContrasena;
    } catch (err: any) {
      alert(err?.message || 'Error al restablecer la contrasena');
    }
  }
}
