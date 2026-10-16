import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegistroEmpresaWizardData, TipoDocumentoResponsable } from '../../models/facturapro.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-900/95 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div class="max-w-xl md:max-w-5xl w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden md:grid md:grid-cols-12">
        
        <!-- ==================== BANNER LATERAL MULTI-TENANT (MD+) ==================== -->
        <div class="hidden md:flex md:col-span-4 lg:col-span-4 relative bg-slate-950 p-6 lg:p-8 flex-col justify-between overflow-hidden">
          <img src="/assets/images/login_hero.jpg" alt="FacturaPro 360 Analytics" 
               class="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity filter contrast-125" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>

          <!-- LOGO DE MARCA -->
          <div class="relative z-10 flex items-center gap-3">
            <img src="/assets/images/logo.jpg" alt="Logo FacturaPro 360" class="w-10 h-10 rounded-xl object-cover shadow-lg border border-blue-500/30" />
            <div>
              <div class="text-white font-bold text-base tracking-tight">FacturaPro <span class="text-blue-400 font-normal">360</span></div>
              <div class="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase">Plataforma Multi-Tenant SaaS</div>
            </div>
          </div>

          <!-- RESUMEN PASO A PASO -->
          <div class="relative z-10 space-y-3">
            <div class="text-xs font-bold text-white uppercase tracking-wider text-slate-400">Etapas del Registro</div>
            
            <div class="space-y-2">
              <div class="flex items-center gap-2.5 p-2 rounded-xl transition"
                   [ngClass]="pasoActual() === 1 ? 'bg-blue-600/20 border border-blue-500/40 text-white' : 'text-slate-400'">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      [ngClass]="pasoActual() > 1 ? 'bg-emerald-500 text-white' : (pasoActual() === 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400')">
                  1
                </span>
                <span class="text-xs font-medium">Responsable de la cuenta</span>
              </div>

              <div class="flex items-center gap-2.5 p-2 rounded-xl transition"
                   [ngClass]="pasoActual() === 2 ? 'bg-blue-600/20 border border-blue-500/40 text-white' : 'text-slate-400'">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      [ngClass]="pasoActual() > 2 ? 'bg-emerald-500 text-white' : (pasoActual() === 2 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400')">
                  2
                </span>
                <span class="text-xs font-medium">Informacion de la tienda</span>
              </div>

              <div class="flex items-center gap-2.5 p-2 rounded-xl transition"
                   [ngClass]="pasoActual() === 3 ? 'bg-blue-600/20 border border-blue-500/40 text-white' : 'text-slate-400'">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      [ngClass]="pasoActual() > 3 ? 'bg-emerald-500 text-white' : (pasoActual() === 3 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400')">
                  3
                </span>
                <span class="text-xs font-medium">Configuracion comercial</span>
              </div>

              <div class="flex items-center gap-2.5 p-2 rounded-xl transition"
                   [ngClass]="pasoActual() === 4 ? 'bg-blue-600/20 border border-blue-500/40 text-white' : 'text-slate-400'">
                <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      [ngClass]="pasoActual() === 4 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'">
                  4
                </span>
                <span class="text-xs font-medium">Revision y confirmacion</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-300 leading-relaxed">
              Aislamiento total por particion de base de datos (PostgreSQL RLS). Sus datos jamas se cruzaran con los de otra empresa.
            </div>
          </div>
        </div>

        <!-- ==================== FORMULARIO WIZARD EN 4 ETAPAS ==================== -->
        <div class="md:col-span-8 lg:col-span-8 p-5 sm:p-8 flex flex-col justify-between space-y-4">
          
          <!-- ENCABEZADO Y STEPPER HORIZONTAL (VISIBLE EN TODAS LAS PANTALLAS) -->
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h1 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Registro de Nueva Organizacion</h1>
                <p class="text-xs text-slate-500">Paso {{ pasoActual() }} de 4 &bull; {{ getTituloPaso() }}</p>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                {{ Math.round((pasoActual() / 4) * 100) }}%
              </span>
            </div>

            <!-- BARRA DE PROGRESO VISUAL -->
            <div class="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div class="bg-blue-600 h-full transition-all duration-300"
                   [style.width.%]="(pasoActual() / 4) * 100"></div>
            </div>
          </div>

          <!-- MENSAJE DE ERROR -->
          <div *ngIf="errorMensaje()" class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 shadow-xs">
            <svg class="w-4 h-4 shrink-0 text-rose-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>{{ errorMensaje() }}</span>
          </div>

          <!-- ==================== CONTENIDO DEL PASO 1: RESPONSABLE ==================== -->
          <div *ngIf="pasoActual() === 1" class="space-y-3.5 animate-fadeIn">
            <div class="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
              1. Datos del Responsable de la Cuenta
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nombres *</label>
                <input type="text" [(ngModel)]="formData.nombres" placeholder="Juan Carlos" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Apellidos *</label>
                <input type="text" [(ngModel)]="formData.apellidos" placeholder="Perez Gomez" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Tipo de Documento *</label>
                <select [(ngModel)]="formData.tipo_documento_responsable"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="CedulaCiudadania">Cedula de Ciudadania</option>
                  <option value="CedulaExtranjeria">Cedula de Extranjeria</option>
                  <option value="NIT">NIT / Identificacion Tributaria</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Numero de Documento *</label>
                <input type="text" [(ngModel)]="formData.numero_documento_responsable" placeholder="1020304050" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Correo Electronico (Login) *</label>
                <input type="email" [(ngModel)]="formData.email" placeholder="responsable@tienda.com" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Telefono Movil *</label>
                <input type="text" [(ngModel)]="formData.telefono_responsable" placeholder="+57 300 1234567" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Usuario de Acceso *</label>
                <input type="text" [(ngModel)]="formData.username" placeholder="jperez" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Contrasena (Min. 8 car.) *</label>
                <input type="password" [(ngModel)]="formData.password" placeholder="••••••••" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Confirmar Contrasena *</label>
                <input type="password" [(ngModel)]="formData.confirm_password" placeholder="••••••••" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>
          </div>

          <!-- ==================== CONTENIDO DEL PASO 2: INFORMACIÓN DE TIENDA ==================== -->
          <div *ngIf="pasoActual() === 2" class="space-y-3.5 animate-fadeIn">
            <div class="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
              2. Informacion Comercial y Ubicacion de la Tienda
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nombre Comercial de la Tienda *</label>
                <input type="text" [(ngModel)]="formData.nombre_comercial" placeholder="Supermercado El Sol" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Razon Social (Facturacion Legal)</label>
                <input type="text" [(ngModel)]="formData.razon_social" placeholder="Inversiones El Sol S.A.S."
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Identificacion Fiscal (RUC / NIT / CIF) *</label>
                <input type="text" [(ngModel)]="formData.identificacion_fiscal" placeholder="900.123.456-7" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Tipo de Negocio *</label>
                <select [(ngModel)]="formData.tipo_negocio"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="Comercio Minorista / Tienda">Comercio Minorista / Tienda</option>
                  <option value="Mayorista y Distribucion">Mayorista y Distribucion</option>
                  <option value="Servicios Profesionales">Servicios Profesionales</option>
                  <option value="Restaurante y Gastronomia">Restaurante y Gastronomia</option>
                  <option value="Tecnologia y Electronica">Tecnologia y Electronica</option>
                  <option value="Salud y Farmacia">Salud y Farmacia</option>
                  <option value="Manufactura y Produccion">Manufactura y Produccion</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Pais *</label>
                <input type="text" [(ngModel)]="formData.pais" placeholder="Colombia" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Departamento / Estado *</label>
                <input type="text" [(ngModel)]="formData.departamento_estado" placeholder="Antioquia" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Ciudad / Municipio *</label>
                <input type="text" [(ngModel)]="formData.ciudad" placeholder="Medellin" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-slate-700 mb-1">Direccion Completa *</label>
                <input type="text" [(ngModel)]="formData.direccion" placeholder="Carrera 43A # 1-50, Local 102" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Barrio o Zona</label>
                <input type="text" [(ngModel)]="formData.barrio_zona" placeholder="El Poblado"
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Telefono Comercial *</label>
                <input type="text" [(ngModel)]="formData.telefono_tienda" placeholder="+57 604 4440000" required
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Correo de Contacto Comercial</label>
                <input type="email" [(ngModel)]="formData.correo_comercial" placeholder="contacto@tienda.com"
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>
            </div>
          </div>

          <!-- ==================== CONTENIDO DEL PASO 3: CONFIGURACIÓN OPERATIVA ==================== -->
          <div *ngIf="pasoActual() === 3" class="space-y-3.5 animate-fadeIn">
            <div class="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
              3. Configuracion Operativa y Moneda
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Moneda Principal *</label>
                <select [(ngModel)]="formData.moneda" (change)="actualizarSimboloMoneda()"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="USD">USD - Dolar Estadounidense</option>
                  <option value="CRC">CRC - Colon Costarricense</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="PEN">PEN - Sol Peruano</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Simbolo Monetario</label>
                <input type="text" [(ngModel)]="formData.simbolo_moneda" readonly
                       class="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-bold" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Zona Horaria *</label>
                <select [(ngModel)]="formData.zona_horaria"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="America/Bogota">America/Bogota (UTC-5)</option>
                  <option value="America/Costa_Rica">America/Costa_Rica (UTC-6)</option>
                  <option value="America/Mexico_City">America/Mexico_City (UTC-6)</option>
                  <option value="America/Lima">America/Lima (UTC-5)</option>
                  <option value="America/Santiago">America/Santiago (UTC-3)</option>
                  <option value="America/New_York">America/New_York (UTC-4)</option>
                  <option value="Europe/Madrid">Europe/Madrid (UTC+1)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Idioma de la Interfaz</label>
                <select [(ngModel)]="formData.idioma"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="es-CO">Espanol (Latinoamerica)</option>
                  <option value="es-ES">Espanol (Espana)</option>
                  <option value="en-US">English (United States)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Formato de Fecha</label>
                <select [(ngModel)]="formData.formato_fecha"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Ej. 16/10/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (USA)</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Formato de Numeros</label>
                <select [(ngModel)]="formData.formato_numero"
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="1.234,56">1.234,56 (Punto miles, coma decimal)</option>
                  <option value="1,234.56">1,234.56 (Coma miles, punto decimal)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Descripcion del Negocio</label>
              <textarea [(ngModel)]="formData.descripcion_negocio" rows="2" placeholder="Venta de abarrotes, viveres y productos de consumo masivo..."
                        class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"></textarea>
            </div>
          </div>

          <!-- ==================== CONTENIDO DEL PASO 4: REVISIÓN Y CONFIRMACIÓN ==================== -->
          <div *ngIf="pasoActual() === 4" class="space-y-4 animate-fadeIn">
            <div class="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
              4. Revision de Datos y Creacion de la Organizacion
            </div>

            <!-- FICHA RESUMEN DE COMPROBACIÓN -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div class="space-y-1.5">
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Responsable de la Cuenta</span>
                <div class="font-bold text-slate-900">{{ formData.nombres }} {{ formData.apellidos }}</div>
                <div class="text-slate-600">{{ formData.tipo_documento_responsable }}: {{ formData.numero_documento_responsable }}</div>
                <div class="text-slate-600">Usuario: <span class="font-mono text-blue-600 font-bold">{{ formData.username }}</span></div>
                <div class="text-slate-600">Correo: {{ formData.email }}</div>
                <div class="text-slate-600">Tel: {{ formData.telefono_responsable }}</div>
              </div>

              <div class="space-y-1.5">
                <span class="text-[10px] font-bold uppercase text-slate-400 block">Tienda / Organizacion</span>
                <div class="font-bold text-slate-900">{{ formData.nombre_comercial }}</div>
                <div class="text-slate-600">Razon Social: {{ formData.razon_social || formData.nombre_comercial }}</div>
                <div class="text-slate-600">Identificacion: {{ formData.identificacion_fiscal }}</div>
                <div class="text-slate-600">Ubicacion: {{ formData.ciudad }}, {{ formData.departamento_estado }}, {{ formData.pais }}</div>
                <div class="text-slate-600">Moneda: {{ formData.moneda }} ({{ formData.simbolo_moneda }}) &bull; {{ formData.zona_horaria }}</div>
              </div>
            </div>

            <!-- ACEPTACIÓN LEGAL -->
            <div class="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-2.5">
              <label class="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" [(ngModel)]="formData.acepta_terminos" class="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                <span class="text-xs text-slate-700 leading-snug">
                  Acepto los <span class="font-semibold text-blue-700 hover:underline">Terminos y Condiciones de Uso del Software</span> y declaro ser el representante legal autorizado de la tienda.
                </span>
              </label>

              <label class="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" [(ngModel)]="formData.acepta_privacidad" class="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                <span class="text-xs text-slate-700 leading-snug">
                  Acepto la <span class="font-semibold text-blue-700 hover:underline">Politica de Privacidad y Tratamiento de Datos Personales</span> con cifrado seguro y aislamiento por empresa.
                </span>
              </label>
            </div>
          </div>

          <!-- BOTONES DE NAVEGACIÓN ENTRE PASOS -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <div>
              <button *ngIf="pasoActual() > 1" (click)="pasoAnterior()" type="button"
                      class="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5">
                &larr; Paso anterior
              </button>
            </div>

            <div class="flex items-center gap-3">
              <a routerLink="/login" class="text-xs text-slate-500 hover:text-slate-800 font-medium">
                ¿Ya tienes cuenta? Iniciar sesion
              </a>

              <button *ngIf="pasoActual() < 4" (click)="pasoSiguiente()" type="button"
                      class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-1.5">
                <span>Continuar</span>
                <span>&rarr;</span>
              </button>

              <button *ngIf="pasoActual() === 4" (click)="finalizarRegistro()" [disabled]="guardando()" type="button"
                      class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-2">
                <svg *ngIf="guardando()" class="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                <span>{{ guardando() ? 'Creando espacio de trabajo...' : 'Finalizar y Crear Organizacion' }}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fadeIn {
      animation: fadeIn 0.25s ease-out forwards;
    }
  `]
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  Math = Math;

  pasoActual = signal<number>(1);
  guardando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  formData: RegistroEmpresaWizardData = {
    nombres: '',
    apellidos: '',
    tipo_documento_responsable: 'CedulaCiudadania',
    numero_documento_responsable: '',
    email: '',
    telefono_responsable: '',
    username: '',
    password: '',
    confirm_password: '',
    acepta_terminos: false,
    acepta_privacidad: false,
    nombre_comercial: '',
    razon_social: '',
    tipo_negocio: 'Comercio Minorista / Tienda',
    descripcion_negocio: '',
    identificacion_fiscal: '',
    pais: 'Colombia',
    departamento_estado: '',
    ciudad: '',
    direccion: '',
    barrio_zona: '',
    codigo_postal: '',
    telefono_tienda: '',
    telefono_secundario: '',
    correo_comercial: '',
    sitio_web: '',
    moneda: 'COP',
    simbolo_moneda: '$',
    zona_horaria: 'America/Bogota',
    idioma: 'es-CO',
    formato_fecha: 'DD/MM/YYYY',
    formato_numero: '1.234,56'
  };

  getTituloPaso(): string {
    switch (this.pasoActual()) {
      case 1: return 'Responsable de la cuenta';
      case 2: return 'Datos comerciales y ubicacion';
      case 3: return 'Configuracion operativa';
      case 4: return 'Confirmacion y politicas';
      default: return '';
    }
  }

  actualizarSimboloMoneda() {
    switch (this.formData.moneda) {
      case 'COP': this.formData.simbolo_moneda = '$'; break;
      case 'USD': this.formData.simbolo_moneda = '$'; break;
      case 'CRC': this.formData.simbolo_moneda = '₡'; break;
      case 'EUR': this.formData.simbolo_moneda = '€'; break;
      case 'MXN': this.formData.simbolo_moneda = '$'; break;
      case 'PEN': this.formData.simbolo_moneda = 'S/'; break;
      default: this.formData.simbolo_moneda = '$';
    }
  }

  pasoAnterior() {
    this.errorMensaje.set(null);
    if (this.pasoActual() > 1) {
      this.pasoActual.update(p => p - 1);
    }
  }

  pasoSiguiente() {
    this.errorMensaje.set(null);

    // Validaciones por paso
    if (this.pasoActual() === 1) {
      if (!this.formData.nombres.trim() || !this.formData.apellidos.trim()) {
        this.errorMensaje.set('Debe ingresar los nombres y apellidos del responsable.');
        return;
      }
      if (!this.formData.numero_documento_responsable.trim()) {
        this.errorMensaje.set('Debe indicar el numero de documento del responsable.');
        return;
      }
      if (!this.formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email.trim())) {
        this.errorMensaje.set('Debe proporcionar un correo electronico valido.');
        return;
      }
      if (!this.formData.telefono_responsable.trim()) {
        this.errorMensaje.set('Debe ingresar el telefono de contacto del responsable.');
        return;
      }
      if (!this.formData.username.trim() || this.formData.username.trim().length < 3) {
        this.errorMensaje.set('El usuario de acceso debe tener al menos 3 caracteres.');
        return;
      }
      if (!this.formData.password || this.formData.password.length < 8) {
        this.errorMensaje.set('La contrasena debe tener un minimo de 8 caracteres.');
        return;
      }
      if (this.formData.password !== this.formData.confirm_password) {
        this.errorMensaje.set('Las contrasenas no coinciden.');
        return;
      }
    } else if (this.pasoActual() === 2) {
      if (!this.formData.nombre_comercial.trim()) {
        this.errorMensaje.set('Debe indicar el nombre comercial de la tienda.');
        return;
      }
      if (!this.formData.identificacion_fiscal.trim()) {
        this.errorMensaje.set('Debe ingresar el identificador fiscal (RUC / NIT / CIF).');
        return;
      }
      if (!this.formData.pais.trim() || !this.formData.ciudad.trim() || !this.formData.direccion.trim()) {
        this.errorMensaje.set('Debe completar los datos de ubicacion (Pais, Ciudad y Direccion).');
        return;
      }
      if (!this.formData.telefono_tienda.trim()) {
        this.formData.telefono_tienda = this.formData.telefono_responsable;
      }
      if (!this.formData.correo_comercial.trim()) {
        this.formData.correo_comercial = this.formData.email;
      }
    }

    if (this.pasoActual() < 4) {
      this.pasoActual.update(p => p + 1);
    }
  }

  async finalizarRegistro() {
    this.errorMensaje.set(null);
    if (!this.formData.acepta_terminos || !this.formData.acepta_privacidad) {
      this.errorMensaje.set('Debe aceptar los Terminos y Condiciones y la Politica de Privacidad para continuar.');
      return;
    }

    this.guardando.set(true);
    try {
      await this.auth.registerWizard(this.formData);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.errorMensaje.set(err?.message || 'Error al aprovisionar la organizacion.');
    } finally {
      this.guardando.set(false);
    }
  }
}
