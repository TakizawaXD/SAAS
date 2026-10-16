import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FacturaProService } from '../../services/facturapro.service';
import { AuthService } from '../../services/auth.service';
import { HelpService } from '../../services/help.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      
      <!-- ==================== BANNER DE BIENVENIDA Y CABECERA ==================== -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <!-- SALUDO Y DATOS DE LA TIENDA -->
          <div class="flex items-start sm:items-center gap-4">
            <!-- LOGOTIPO O INICIALES DE LA TIENDA -->
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20 shrink-0 border border-blue-400/30">
              <img *ngIf="service.empresa().logo_url" [src]="service.empresa().logo_url" alt="Logo de la tienda" class="w-full h-full object-cover rounded-2xl" />
              <span *ngIf="!service.empresa().logo_url">{{ inicialesTienda() }}</span>
            </div>

            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Hola, {{ nombreUsuario() }}
                </h1>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {{ auth.currentUser()?.rol || 'Administrador' }}
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {{ nombreEmpresa() }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Panel centralizado de operaciones comerciales y facturacion. Gestiona tus ventas, inventario y cuentas con aislamiento estricto de datos.
              </p>
            </div>
          </div>

          <!-- ACCIONES DE CABECERA Y BOTÓN DE AYUDA "?" -->
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <!-- BOTÓN DE AYUDA "?" DEL DASHBOARD -->
            <button (click)="help.mostrarAyuda('dashboard')" 
                    class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 shadow-2xs transition cursor-pointer"
                    title="Explicacion detallada sobre como usar este panel">
              <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">?</span>
              <span>Como usar el panel</span>
            </button>

            <!-- FECHA ACTUAL -->
            <div class="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z"/></svg>
              <span>{{ rangoFechasActual() }}</span>
            </div>

            <a routerLink="/configuracion" class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer">
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>Ajustes</span>
            </a>
          </div>

        </div>

        <!-- ACCESOS DIRECTOS PRINCIPALES (BARRA DE TAREAS RAPIDAS) -->
        <div class="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Accesos directos:</span>
          
          <a routerLink="/nueva-factura" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span>Nueva factura</span>
          </a>

          <a routerLink="/productos" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <span>Agregar producto</span>
          </a>

          <a routerLink="/clientes" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            <span>Nuevo cliente</span>
          </a>

          <a routerLink="/compras" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            <span>Registrar compra</span>
          </a>

          <a routerLink="/caja-bancos" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <span>Caja y cobros</span>
          </a>

          <a routerLink="/informes" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>Informes</span>
          </a>
        </div>
      </div>

      <!-- ==================== NOTIFICACIONES IMPORTANTES DEL SISTEMA ==================== -->
      <div *ngIf="notificaciones().length > 0" class="space-y-2">
        <div *ngFor="let notif of notificaciones()" 
             class="p-4 rounded-xl border flex items-center justify-between gap-4 transition"
             [ngClass]="notif.tipo === 'warning' ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-blue-50/80 border-blue-200 text-blue-900'">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 [ngClass]="notif.tipo === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <div class="font-bold text-xs">{{ notif.titulo }}</div>
              <div class="text-[11px] opacity-90 mt-0.5">{{ notif.mensaje }}</div>
            </div>
          </div>
          <a [routerLink]="notif.ruta" class="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-2xs shrink-0 cursor-pointer">
            {{ notif.accionTexto }}
          </a>
        </div>
      </div>

      <!-- ==================== 4 TARJETAS MÉTRICAS (DATOS REALES DEL TENANT) ==================== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- 1. Ventas del período -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500">Ventas facturadas</span>
            <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
          </div>

          <div class="mt-4">
            <div class="text-2xl font-bold text-slate-900 tracking-tight">
              $ {{ kpis().ventasMes | number:'1.2-2' }}
            </div>
            <div class="flex items-center gap-1.5 mt-2 text-[11px]" [ngClass]="kpis().ventasMes > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-400'">
              <span *ngIf="kpis().ventasMes > 0">Ingresos registrados</span>
              <span *ngIf="kpis().ventasMes === 0">Sin ventas registradas</span>
              <span class="text-slate-400 font-normal">({{ kpis().facturasEmitidasMes }} emitidas)</span>
            </div>
          </div>
        </div>

        <!-- 2. Cobros recibidos -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500">Cobros recibidos</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>

          <div class="mt-4">
            <div class="text-2xl font-bold text-slate-900 tracking-tight">
              $ {{ kpis().cobradoMes | number:'1.2-2' }}
            </div>
            <div class="flex items-center gap-1.5 mt-2 text-[11px]" [ngClass]="kpis().cobradoMes > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-400'">
              <span *ngIf="kpis().cobradoMes > 0">Fondos en cuenta</span>
              <span *ngIf="kpis().cobradoMes === 0">Sin cobros ingresados</span>
              <span class="text-slate-400 font-normal">({{ service.pagos().length }} recibos)</span>
            </div>
          </div>
        </div>

        <!-- 3. Cuentas por cobrar -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500">Cuentas por cobrar</span>
            <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </div>

          <div class="mt-4">
            <div class="text-2xl font-bold text-slate-900 tracking-tight">
              $ {{ kpis().totalPorCobrar | number:'1.2-2' }}
            </div>
            <div class="flex items-center gap-1.5 mt-2 text-[11px]" [ngClass]="kpis().totalPorCobrar > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'">
              <span *ngIf="kpis().totalPorCobrar > 0">{{ kpis().facturasVencidas }} con saldo pendiente</span>
              <span *ngIf="kpis().totalPorCobrar === 0">Cartera al dia</span>
            </div>
          </div>
        </div>

        <!-- 4. Inventario y productos -->
        <div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500">Inventario activo</span>
            <div class="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
          </div>

          <div class="mt-4">
            <div class="text-2xl font-bold text-slate-900 tracking-tight">
              {{ service.productos().length }}
            </div>
            <div class="flex items-center gap-1.5 mt-2 text-[11px]" [ngClass]="productosBajoStock().length > 0 ? 'text-amber-700 font-semibold' : 'text-slate-500'">
              <span *ngIf="productosBajoStock().length > 0">{{ productosBajoStock().length }} con stock bajo</span>
              <span *ngIf="productosBajoStock().length === 0">Stock en niveles optimos</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ==================== GUÍA DE INICIO PARA USUARIOS NUEVOS ==================== -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 class="text-sm font-bold text-slate-900">Guia de inicio rapido</h2>
            <p class="text-xs text-slate-500 mt-0.5">Pasos esenciales para comenzar a operar con tu tienda en FacturaPro 360.</p>
          </div>
          <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
            {{ pasosCompletados() }} de 4 completados
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          
          <!-- PASO 1: DATOS DE LA TIENDA -->
          <div class="p-4 rounded-xl border transition flex flex-col justify-between"
               [ngClass]="pasoEmpresaConfigurada() ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'">
            <div>
              <div class="flex items-center justify-between">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      [ngClass]="pasoEmpresaConfigurada() ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'">
                  1
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider"
                      [ngClass]="pasoEmpresaConfigurada() ? 'text-emerald-700' : 'text-slate-400'">
                  {{ pasoEmpresaConfigurada() ? 'Completado' : 'Pendiente' }}
                </span>
              </div>
              <h3 class="font-bold text-xs text-slate-900 mt-3">Configurar tu tienda</h3>
              <p class="text-[11px] text-slate-500 mt-1 leading-snug">
                Define el nombre comercial, RUT fiscal, direccion y logo en la configuracion.
              </p>
            </div>
            <a routerLink="/configuracion" class="mt-4 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <span>Ir a configuracion</span>
              <span>&rarr;</span>
            </a>
          </div>

          <!-- PASO 2: PRODUCTOS -->
          <div class="p-4 rounded-xl border transition flex flex-col justify-between"
               [ngClass]="service.productos().length > 0 ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'">
            <div>
              <div class="flex items-center justify-between">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      [ngClass]="service.productos().length > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'">
                  2
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider"
                      [ngClass]="service.productos().length > 0 ? 'text-emerald-700' : 'text-slate-400'">
                  {{ service.productos().length > 0 ? 'Completado' : 'Pendiente' }}
                </span>
              </div>
              <h3 class="font-bold text-xs text-slate-900 mt-3">Catalogo de productos</h3>
              <p class="text-[11px] text-slate-500 mt-1 leading-snug">
                Agrega los articulos o servicios con sus precios de venta y control de existencias.
              </p>
            </div>
            <a routerLink="/productos" class="mt-4 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <span>Gestionar productos</span>
              <span>&rarr;</span>
            </a>
          </div>

          <!-- PASO 3: CLIENTES -->
          <div class="p-4 rounded-xl border transition flex flex-col justify-between"
               [ngClass]="service.clientes().length > 0 ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'">
            <div>
              <div class="flex items-center justify-between">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      [ngClass]="service.clientes().length > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'">
                  3
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider"
                      [ngClass]="service.clientes().length > 0 ? 'text-emerald-700' : 'text-slate-400'">
                  {{ service.clientes().length > 0 ? 'Completado' : 'Pendiente' }}
                </span>
              </div>
              <h3 class="font-bold text-xs text-slate-900 mt-3">Directorio de clientes</h3>
              <p class="text-[11px] text-slate-500 mt-1 leading-snug">
                Registra a tus compradores recurrentes para facturarles de forma inmediata.
              </p>
            </div>
            <a routerLink="/clientes" class="mt-4 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <span>Registrar clientes</span>
              <span>&rarr;</span>
            </a>
          </div>

          <!-- PASO 4: FACTURACIÓN -->
          <div class="p-4 rounded-xl border transition flex flex-col justify-between"
               [ngClass]="service.facturas().length > 0 ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'">
            <div>
              <div class="flex items-center justify-between">
                <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      [ngClass]="service.facturas().length > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'">
                  4
                </span>
                <span class="text-[10px] font-bold uppercase tracking-wider"
                      [ngClass]="service.facturas().length > 0 ? 'text-emerald-700' : 'text-slate-400'">
                  {{ service.facturas().length > 0 ? 'Completado' : 'Pendiente' }}
                </span>
              </div>
              <h3 class="font-bold text-xs text-slate-900 mt-3">Primera factura</h3>
              <p class="text-[11px] text-slate-500 mt-1 leading-snug">
                Genera tu primer comprobante de venta e imprime o descarga el documento PDF.
              </p>
            </div>
            <a routerLink="/nueva-factura" class="mt-4 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <span>Emitir factura</span>
              <span>&rarr;</span>
            </a>
          </div>

        </div>
      </div>

      <!-- ==================== FILA: ACTIVIDAD RECIENTE Y STOCK CRÍTICO ==================== -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- 1. ACTIVIDAD / FACTURAS RECIENTES (7 cols) -->
        <div class="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 class="text-sm font-bold text-slate-900">Ultimas transacciones</h2>
              <a routerLink="/facturas" class="text-xs font-semibold text-blue-600 hover:text-blue-800">Ver todas &rarr;</a>
            </div>

            <!-- SI NO HAY FACTURAS REGISTRADAS -->
            <div *ngIf="service.facturas().length === 0" class="py-10 flex flex-col items-center justify-center text-center">
              <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <h3 class="text-xs font-bold text-slate-800">Sin movimientos registrados</h3>
              <p class="text-[11px] text-slate-400 max-w-xs mt-1 mb-4 leading-relaxed">
                Cuando emitas facturas o registres pagos en {{ nombreEmpresa() }}, apareceran detallados aqui.
              </p>
              <a routerLink="/nueva-factura" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition">
                + Crear primera factura
              </a>
            </div>

            <!-- LISTA DE FACTURAS RECIENTES REALES -->
            <div *ngIf="service.facturas().length > 0" class="overflow-x-auto mt-2">
              <table class="w-full text-left text-xs">
                <thead class="text-slate-400 font-semibold border-b border-slate-100">
                  <tr>
                    <th class="py-2.5">Factura</th>
                    <th class="py-2.5">Cliente</th>
                    <th class="py-2.5 text-right">Total</th>
                    <th class="py-2.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let f of facturasRecientes()" class="hover:bg-slate-50/60 transition">
                    <td class="py-2.5">
                      <a [routerLink]="['/facturas', f.id]" class="font-bold text-blue-600 hover:underline">
                        {{ f.numero_factura }}
                      </a>
                    </td>
                    <td class="py-2.5 text-slate-700">{{ f.cliente?.razon_social || 'Consumidor Final' }}</td>
                    <td class="py-2.5 text-right font-bold text-slate-900">$ {{ f.total | number:'1.2-2' }}</td>
                    <td class="py-2.5 text-center">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                            [ngClass]="f.estado === 'Pagada' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'">
                        {{ f.estado }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Informacion actualizada en tiempo real para {{ nombreEmpresa() }}
          </div>
        </div>

        <!-- 2. PRODUCTOS CON STOCK BAJO (5 cols) -->
        <div class="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 class="text-sm font-bold text-slate-900">Alertas de inventario</h2>
              <a routerLink="/productos" class="text-xs font-semibold text-blue-600 hover:text-blue-800">Ver inventario &rarr;</a>
            </div>

            <!-- INVENTARIO EN ORDEN -->
            <div *ngIf="productosBajoStock().length === 0" class="py-10 flex flex-col items-center justify-center text-center">
              <div class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h3 class="text-xs font-bold text-slate-800">Inventario al dia</h3>
              <p class="text-[11px] text-slate-400 mt-0.5 mb-3">
                {{ service.productos().length === 0 ? 'Aun no has registrado productos en tu catalogo.' : 'Todos los productos cuentan con existencias superiores al minimo.' }}
              </p>
              <a *ngIf="service.productos().length === 0" routerLink="/productos" class="text-xs font-bold text-blue-600 hover:underline">
                + Agregar primer producto
              </a>
            </div>

            <!-- TABLA DE ARTÍCULOS CON STOCK BAJO -->
            <div *ngIf="productosBajoStock().length > 0" class="overflow-x-auto mt-2">
              <table class="w-full text-left text-xs">
                <thead class="text-slate-400 font-semibold border-b border-slate-100">
                  <tr>
                    <th class="py-2.5">Producto</th>
                    <th class="py-2.5 text-center">Stock</th>
                    <th class="py-2.5 text-right">Minimo</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let p of productosBajoStock()" class="hover:bg-slate-50/60">
                    <td class="py-2.5 font-medium text-slate-800">{{ p.nombre }}</td>
                    <td class="py-2.5 text-center font-bold" [ngClass]="p.stock_actual === 0 ? 'text-rose-600' : 'text-amber-600'">
                      {{ p.stock_actual }}
                    </td>
                    <td class="py-2.5 text-right text-slate-500">{{ p.stock_minimo }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            {{ productosBajoStock().length > 0 ? 'Se recomienda generar orden de compra a proveedores' : 'Monitoreo de existencias activo' }}
          </div>
        </div>

      </div>

    </div>
  `
})
export class DashboardComponent {
  service = inject(FacturaProService);
  auth = inject(AuthService);
  help = inject(HelpService);

  nombreUsuario = computed(() => this.auth.currentUser()?.nombre || 'Usuario');
  nombreEmpresa = computed(() => this.auth.currentUser()?.empresaNombre || 'Tu Empresa');

  inicialesTienda = computed(() => {
    const nombre = this.nombreEmpresa().trim();
    if (!nombre) return 'FP';
    const partes = nombre.split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  });

  kpis = computed(() => this.service.getKpis());

  productosBajoStock = computed(() => 
    this.service.productos().filter(p => p.activo && p.stock_actual <= p.stock_minimo)
  );

  facturasRecientes = computed(() => 
    this.service.facturas().slice(0, 5)
  );

  pasoEmpresaConfigurada = computed(() => {
    const emp = this.service.empresa();
    return Boolean(emp && (emp.identificacion_fiscal || emp.razon_social || emp.direccion));
  });

  pasosCompletados = computed(() => {
    let count = 0;
    if (this.pasoEmpresaConfigurada()) count++;
    if (this.service.productos().length > 0) count++;
    if (this.service.clientes().length > 0) count++;
    if (this.service.facturas().length > 0) count++;
    return count;
  });

  notificaciones = computed(() => {
    const list: Array<{ tipo: 'warning' | 'info'; titulo: string; mensaje: string; ruta: string; accionTexto: string }> = [];

    if (this.productosBajoStock().length > 0) {
      list.push({
        tipo: 'warning',
        titulo: 'Alerta de existencias criticas',
        mensaje: `Hay ${this.productosBajoStock().length} productos que requieren reposicion inmediata en inventario.`,
        ruta: '/productos',
        accionTexto: 'Ver productos'
      });
    }

    if (this.kpis().totalPorCobrar > 0) {
      list.push({
        tipo: 'info',
        titulo: 'Cuentas pendientes por recaudar',
        mensaje: `Tienes un saldo pendiente acumulado de $${this.kpis().totalPorCobrar.toFixed(2)} por cobrar a clientes.`,
        ruta: '/facturas',
        accionTexto: 'Ver facturas'
      });
    }

    return list;
  });

  rangoFechasActual = computed(() => {
    const hoy = new Date();
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;
  });
}
