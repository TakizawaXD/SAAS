import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacturaProService } from '../../services/facturapro.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-integraciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Integraciones y Conexiones</h1>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Integraciones</span>
          </div>
        </div>

        <button (click)="generarApiKey()" class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Generar Nueva API Key
        </button>
      </div>

      <!-- TOAST / AVISO DE API KEY -->
      <div *ngIf="mensaje()" class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
        <span>{{ mensaje() }}</span>
        <button (click)="mensaje.set('')" class="text-emerald-600 font-bold">&times;</button>
      </div>

      <!-- CARDS DE INTEGRACIONES -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Conectado</span>
          </div>
          <h3 class="text-sm font-bold text-slate-900">Supabase Cloud Database</h3>
          <p class="text-xs text-slate-500">PostgreSQL gestionado con funciones RPC transaccionales y Row Level Security activado.</p>
          <div class="text-[10px] text-slate-400 font-mono truncate">Endpoint: {{ supabaseUrl }}</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              .NET
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">Sincronizado</span>
          </div>
          <h3 class="text-sm font-bold text-slate-900">FacturaPro .NET Desktop Client</h3>
          <p class="text-xs text-slate-500">Conexión con la aplicación de escritorio offline (.NET 8 + WPF) mediante modelo relacional unificado.</p>
          <div class="text-[10px] text-slate-400 font-mono">Tenant ID: {{ empresaId() }}</div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <div class="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              API
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200">v1.0 Activa</span>
          </div>
          <h3 class="text-sm font-bold text-slate-900">Webhooks y REST API Pública</h3>
          <p class="text-xs text-slate-500">Emisión de comprobantes y consulta de catálogo mediante token REST seguro.</p>
          <div class="text-[10px] text-purple-700 font-mono bg-purple-50 p-1.5 rounded truncate">Token: {{ apiKey() }}</div>
        </div>
      </div>
    </div>
  `
})
export class IntegracionesComponent {
  private service = inject(FacturaProService);

  supabaseUrl = environment.supabaseUrl;
  empresaId = computed(() => this.service.getEmpresaActualId());

  apiKey = signal<string>('fpro_live_' + this.service.getEmpresaActualId().slice(0, 18));
  mensaje = signal<string>('');

  generarApiKey() {
    const nuevoToken = 'fpro_live_' + crypto.randomUUID().replace(/-/g, '');
    this.apiKey.set(nuevoToken);
    this.mensaje.set(`Nueva clave API generada exitosamente: ${nuevoToken.slice(0, 24)}...`);

    this.service.registrarEventoAuditoria(
      'SEGURIDAD',
      'GENERAR_API_KEY',
      'API Token REST',
      'WARN',
      'Nueva clave API emitida para integración externa.'
    );
  }
}
