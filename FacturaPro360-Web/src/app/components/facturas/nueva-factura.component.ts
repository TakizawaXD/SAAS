import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FacturaProService } from '../../services/facturapro.service';
import { AuthService } from '../../services/auth.service';
import { HelpService } from '../../services/help.service';
import { Producto } from '../../models/facturapro.models';

interface ItemEdicion {
  producto: Producto;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  iva_porcentaje: number;
}

@Component({
  selector: 'app-nueva-factura',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">

      <!-- ENCABEZADO Y BREADCRUMB -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Nueva factura</h1>
            <button (click)="help.mostrarAyuda('nueva-factura')" 
                    class="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    title="Explicacion paso a paso sobre como emitir esta factura">
              ?
            </button>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a routerLink="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <a routerLink="/facturas" class="hover:text-slate-600">Facturacion</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Nueva factura</span>
          </div>
        </div>
      </div>

      <!-- STEPPER WIZARD -->
      <div class="bg-white border border-slate-200 rounded-xl px-6 py-3 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-2 text-xs font-bold text-blue-600">
          <span class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
          <span>Datos generales</span>
        </div>
        <div class="h-px bg-slate-200 flex-1 min-w-[20px] hidden sm:block"></div>

        <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">2</span>
          <span>Productos y servicios</span>
        </div>
        <div class="h-px bg-slate-200 flex-1 min-w-[20px] hidden sm:block"></div>

        <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">3</span>
          <span>Impuestos y totales</span>
        </div>
        <div class="h-px bg-slate-200 flex-1 min-w-[20px] hidden sm:block"></div>

        <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">4</span>
          <span>Pago</span>
        </div>
        <div class="h-px bg-slate-200 flex-1 min-w-[20px] hidden sm:block"></div>

        <div class="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">5</span>
          <span>Confirmación</span>
        </div>
      </div>

      <!-- DOS COLUMNAS: FORMULARIO A LA IZQUIERDA Y VISTA PREVIA EN HOJA REALISTA A LA DERECHA -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <!-- ==================== COLUMNA IZQUIERDA: FORMULARIO ==================== -->
        <div class="lg:col-span-7 space-y-6">
          <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <h2 class="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Datos generales</h2>

            <!-- CLIENTE -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">Cliente *</label>
              <div class="relative">
                <select [(ngModel)]="clienteSeleccionadoId" class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition">
                  <option *ngFor="let c of clientes()" [value]="c.id">
                    {{ c.razon_social }}
                  </option>
                </select>
                <div class="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
              </div>
            </div>

            <!-- FECHA DE EMISIÓN Y CONDICIÓN DE PAGO -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">Fecha de emisión *</label>
                <input type="date" [(ngModel)]="fechaEmision" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">Condición de pago *</label>
                <select [(ngModel)]="condicionPago" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="Contado">Contado</option>
                  <option value="Crédito 15 días">Crédito 15 días</option>
                  <option value="Crédito 30 días">Crédito 30 días</option>
                </select>
              </div>
            </div>

            <!-- VENCIMIENTO, MONEDA, SUCURSAL -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">Vencimiento</label>
                <input type="date" [(ngModel)]="fechaVencimiento" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">Moneda</label>
                <select [(ngModel)]="moneda" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option value="USD - Dólar estadounidense">USD - Dólar ($)</option>
                  <option value="CRC - Colón costarricense">CRC - Colón (₡)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">Sucursal</label>
                <select class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
                  <option>Matriz</option>
                  <option>Sucursal Norte</option>
                </select>
              </div>
            </div>

            <!-- OBSERVACIONES -->
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">Notas / Observaciones</label>
              <textarea [(ngModel)]="notas" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"></textarea>
            </div>

            <!-- SELECTOR RÁPIDO DE ÍTEMS -->
            <div class="pt-3 border-t border-slate-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-slate-800">Agregar Producto a la Factura</span>
                <span class="text-[11px] text-slate-400">Descuento de stock automático</span>
              </div>
              <div class="flex items-center gap-2">
                <select [(ngModel)]="productoParaAgregarId" class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500">
                  <option *ngFor="let p of productos()" [value]="p.id">
                    {{ p.nombre }} — \${{ p.precio_venta | number:'1.2-2' }} (Stock: {{ p.stock_actual }})
                  </option>
                </select>
                <button (click)="agregarItem()" class="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  Agregar
                </button>
              </div>
            </div>
          </div>

          <!-- ALERTA DE SEGURIDAD / BLOQUEO FINANCIERO -->
          <div *ngIf="errorSeguridad()" class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5 shadow-xs">
            <svg class="w-4 h-4 shrink-0 text-rose-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <div>
              <div class="font-bold text-rose-800">Alerta de Seguridad e Integridad:</div>
              <div>{{ errorSeguridad() }}</div>
            </div>
          </div>

          <!-- ALERTA BORRADOR GUARDADO -->
          <div *ngIf="mensajeBorrador()" class="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center justify-between shadow-xs">
            <span>{{ mensajeBorrador() }}</span>
            <button (click)="mensajeBorrador.set(null)" class="text-emerald-500 hover:text-emerald-700 font-bold">&times;</button>
          </div>

          <!-- BOTONES DE ACCIÓN INFERIORES -->
          <div class="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div class="flex items-center gap-2">
              <button (click)="guardarBorrador()" class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                Guardar borrador
              </button>

              <button (click)="abrirVistaPreviaPdf()" class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs cursor-pointer">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                Vista previa PDF
              </button>
            </div>

            <div class="flex items-center gap-3">
              <a routerLink="/facturas" class="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">Cancelar</a>
              <button (click)="emitirFactura()" [disabled]="guardando()" class="px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center gap-2">
                <svg *ngIf="guardando()" class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                <span>{{ guardando() ? 'Verificando seguridad...' : 'Generar factura' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ==================== COLUMNA DERECHA: HOJA DE VISTA PREVIA REALISTA ==================== -->
        <div class="lg:col-span-5">
          <div class="flex items-center justify-between pb-2">
            <span class="text-xs font-bold text-slate-700">Vista previa</span>
            <span class="text-[10px] text-slate-400">Formato factura estándar A4</span>
          </div>

          <!-- HOJA DE PAPEL REALISTA -->
          <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-md text-[11px] text-slate-800 space-y-4 font-sans">
            <!-- CABECERA FACTURA CON NOMBRE DINÁMICO DE LA EMPRESA -->
            <div class="flex justify-between items-start pb-4 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                  {{ inicialesEmpresa() }}
                </div>
                <div>
                  <div class="font-bold text-slate-900 text-xs">{{ nombreEmpresa() }}</div>
                  <div class="text-[9px] text-slate-400 font-mono">RUC / ID: {{ identificacionFiscal() }} &bull; {{ direccionEmpresa() }}</div>
                </div>
              </div>

              <div class="text-right">
                <div class="font-bold text-slate-900 text-xs">Factura</div>
                <div class="text-[10px] font-mono text-slate-500">No. {{ siguienteNumeroFactura() }}</div>
              </div>
            </div>

            <!-- DATOS DEL CLIENTE -->
            <div class="grid grid-cols-2 gap-2 text-[10px] pb-3 border-b border-slate-100">
              <div>
                <span class="text-slate-400 block">Cliente:</span>
                <span class="font-bold text-slate-900">{{ clienteActual()?.razon_social || 'Consumidor Final' }}</span>
                <span class="text-slate-500 block">{{ clienteActual()?.tipo_documento || 'RUC' }}: {{ clienteActual()?.numero_documento || 'CF-000' }}</span>
              </div>
              <div class="text-right">
                <span class="text-slate-400 block">Fecha: {{ fechaEmision }}</span>
                <span class="text-slate-400 block">Vencimiento: {{ fechaVencimiento }}</span>
              </div>
            </div>

            <!-- TABLA DE LÍNEAS -->
            <div class="overflow-x-auto">
              <table class="w-full text-left text-[10px]">
                <thead class="text-slate-400 border-b border-slate-100 font-semibold">
                  <tr>
                    <th class="py-1">Producto / Servicio</th>
                    <th class="py-1 text-center">Cant.</th>
                    <th class="py-1 text-right">P. Unitario</th>
                    <th class="py-1 text-center">Desc.</th>
                    <th class="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let it of items()">
                    <td class="py-1.5 font-medium text-slate-900">{{ it.producto.nombre }}</td>
                    <td class="py-1.5 text-center">{{ it.cantidad }}</td>
                    <td class="py-1.5 text-right">\${{ it.precio_unitario | number:'1.2-2' }}</td>
                    <td class="py-1.5 text-center">{{ it.descuento_porcentaje }}%</td>
                    <td class="py-1.5 text-right font-semibold">\${{ calcularTotalFila(it) | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- TOTALES -->
            <div class="pt-3 border-t border-slate-100 flex justify-end">
              <div class="w-44 space-y-1 text-[10px]">
                <div class="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span class="text-slate-800 font-medium">\${{ totales().subtotal | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between text-slate-500">
                  <span>Impuestos (13%):</span>
                  <span class="text-slate-800 font-medium">\${{ totales().impuesto | number:'1.2-2' }}</span>
                </div>
                <div class="flex justify-between font-bold text-xs text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total:</span>
                  <span class="text-blue-600">\${{ totales().total | number:'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- PIE DE HOJA: CONDICIÓN Y QR CODE REALISTA -->
            <div class="pt-4 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
              <div class="flex items-center gap-2">
                <!-- QR CODE MOCK -->
                <div class="w-10 h-10 bg-slate-900 p-1 rounded flex flex-col justify-between">
                  <div class="flex justify-between"><span class="w-2 h-2 bg-white rounded-xs"></span><span class="w-2 h-2 bg-white rounded-xs"></span></div>
                  <div class="flex justify-between"><span class="w-2 h-2 bg-white rounded-xs"></span><span class="w-1.5 h-1.5 bg-blue-400 rounded-full"></span></div>
                </div>
                <div>
                  <div class="font-medium text-slate-700">Condiciones de pago: {{ condicionPago }}</div>
                  <div>{{ notas }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- MODAL VISTA PREVIA PDF -->
      <div *ngIf="mostrarModalVistaPrevia()" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 class="text-sm font-bold text-slate-900">Vista Previa del Documento Tributario</h3>
              <p class="text-[11px] text-slate-400">Verificación de formato antes de emisión fiscal</p>
            </div>
            <button (click)="cerrarVistaPreviaPdf()" class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">&times;</button>
          </div>

          <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-mono text-xs text-slate-700">
            <div class="flex justify-between border-b border-slate-200 pb-2">
              <div>
                <span class="font-bold text-slate-900 text-sm block font-sans">{{ nombreEmpresa() }}</span>
                <span class="text-[11px] text-slate-500 font-sans">Identificación Fiscal: {{ identificacionFiscal() }} &bull; {{ direccionEmpresa() }}</span>
              </div>
              <div class="text-right">
                <span class="font-bold text-slate-900 block font-sans">Factura No. {{ siguienteNumeroFactura() }}</span>
                <span class="text-[11px] text-slate-400">Fecha: {{ fechaEmision }}</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div><strong>Receptor:</strong> {{ clienteActual()?.razon_social || 'Consumidor Final' }}</div>
              <div><strong>Identificación:</strong> {{ clienteActual()?.numero_documento || 'Sin ID' }}</div>
              <div><strong>Condición:</strong> {{ condicionPago }}</div>
              <div><strong>Moneda:</strong> {{ moneda }}</div>
            </div>
            <div class="pt-2">
              <div class="font-bold text-slate-900 mb-1">Líneas de Detalle:</div>
              <div *ngFor="let it of items()" class="flex justify-between text-[11px] py-1 border-b border-slate-100">
                <span>{{ it.cantidad }}x {{ it.producto.nombre }}</span>
                <span>\${{ (it.cantidad * it.precio_unitario) | number:'1.2-2' }}</span>
              </div>
            </div>
            <div class="pt-2 flex justify-between font-bold text-sm text-slate-900">
              <span>TOTAL A COBRAR:</span>
              <span class="text-blue-600">\${{ totales().total | number:'1.2-2' }}</span>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button (click)="cerrarVistaPreviaPdf()" class="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
              Cerrar
            </button>
            <button (click)="imprimirPdf()" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">
              Imprimir / Guardar en PDF
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class NuevaFacturaComponent {
  private service = inject(FacturaProService);
  private auth = inject(AuthService);
  private router = inject(Router);
  help = inject(HelpService);

  clientes = this.service.clientes;
  productos = this.service.productos;
  empresa = this.service.empresa;

  nombreEmpresa = computed(() => {
    return this.auth.currentUser()?.empresaNombre || this.empresa().razon_social || this.empresa().nombre_comercial || 'FacturaPro 360';
  });

  identificacionFiscal = computed(() => {
    return this.empresa().identificacion_fiscal || '3-101-123456';
  });

  direccionEmpresa = computed(() => {
    return this.empresa().direccion || 'San José, Costa Rica';
  });

  telefonoEmpresa = computed(() => {
    return this.empresa().telefono || '';
  });

  inicialesEmpresa = computed(() => {
    const n = this.nombreEmpresa().trim();
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (n.slice(0, 2) || 'FP').toUpperCase();
  });

  siguienteNumeroFactura = computed(() => {
    return '001-' + String(this.service.consecutivoFactura()).padStart(6, '0');
  });

  clienteSeleccionadoId = signal<string>('');
  fechaEmision = '16/10/2025';
  fechaVencimiento = '16/10/2025';
  condicionPago = 'Contado';
  moneda = 'CRC - Colón costarricense';
  notas = 'Gracias por su preferencia.';
  productoParaAgregarId = signal<string>('');

  mensajeBorrador = signal<string | null>(null);
  mostrarModalVistaPrevia = signal<boolean>(false);

  items = signal<ItemEdicion[]>([]);

  clienteActual = computed(() => {
    return this.clientes().find(c => c.id === this.clienteSeleccionadoId()) || this.clientes()[0];
  });

  constructor() {
    if (this.clientes().length > 0) {
      this.clienteSeleccionadoId.set(this.clientes()[0].id);
    }

    const p1 = this.productos()[0];
    const p2 = this.productos()[1];
    if (p1 && p2) {
      this.items.set([
        { producto: p1, cantidad: 1, precio_unitario: p1.precio_venta, descuento_porcentaje: 0, iva_porcentaje: p1.iva_porcentaje ?? 13 },
        { producto: p2, cantidad: 2, precio_unitario: p2.precio_venta, descuento_porcentaje: 0, iva_porcentaje: p2.iva_porcentaje ?? 13 }
      ]);
    }
    if (this.productos().length > 0) {
      this.productoParaAgregarId.set(this.productos()[0].id);
    }
  }

  agregarItem() {
    const prodId = this.productoParaAgregarId();
    if (!prodId) return;
    const prod = this.productos().find(p => p.id === prodId);
    if (!prod) return;

    const list = [...this.items()];
    list.push({
      producto: prod,
      cantidad: 1,
      precio_unitario: prod.precio_venta,
      descuento_porcentaje: 0,
      iva_porcentaje: prod.iva_porcentaje ?? 13
    });
    this.items.set(list);
  }

  eliminarItem(index: number) {
    const list = [...this.items()];
    list.splice(index, 1);
    this.items.set(list);
  }

  calcularTotalFila(it: ItemEdicion): number {
    const base = it.cantidad * it.precio_unitario * (1 - (it.descuento_porcentaje || 0) / 100);
    return Math.round(base * 100) / 100;
  }

  totales = computed(() => {
    const subtotal = this.items().reduce((acc, it) => {
      const base = it.cantidad * it.precio_unitario * (1 - (it.descuento_porcentaje || 0) / 100);
      return acc + base;
    }, 0);
    const impuesto = this.items().reduce((acc, it) => {
      const base = it.cantidad * it.precio_unitario * (1 - (it.descuento_porcentaje || 0) / 100);
      return acc + (base * ((it.iva_porcentaje || 0) / 100));
    }, 0);
    const sub = Math.round(subtotal * 100) / 100;
    const imp = Math.round(impuesto * 100) / 100;
    return {
      subtotal: sub,
      impuesto: imp,
      total: Math.round((sub + imp) * 100) / 100
    };
  });

  errorSeguridad = signal<string | null>(null);
  guardando = signal<boolean>(false);

  async emitirFactura() {
    this.errorSeguridad.set(null);
    if (this.items().length === 0) {
      this.errorSeguridad.set('Debe agregar al menos un producto o servicio antes de emitir la factura.');
      return;
    }
    const clienteId = this.clienteSeleccionadoId() || (this.clientes()[0]?.id);
    if (!clienteId) {
      this.errorSeguridad.set('Debe registrar o seleccionar un cliente para emitir la factura.');
      return;
    }

    this.guardando.set(true);
    try {
      const factura = await this.service.emitirFactura({
        cliente_id: clienteId,
        fecha_vencimiento: new Date().toISOString(),
        notas: this.notas,
        items: this.items().map(i => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          descuento_porcentaje: i.descuento_porcentaje,
          iva_porcentaje: i.iva_porcentaje
        }))
      });

      this.router.navigate(['/facturas', factura.id]);
    } catch (err: any) {
      this.errorSeguridad.set(err?.message || 'Error al emitir factura por fallo de seguridad.');
    } finally {
      this.guardando.set(false);
    }
  }

  guardarBorrador() {
    const borrador = {
      clienteId: this.clienteSeleccionadoId(),
      items: this.items(),
      notas: this.notas,
      guardadoEn: new Date().toLocaleTimeString()
    };
    try {
      localStorage.setItem('facturapro_borrador_temp', JSON.stringify(borrador));
      this.mensajeBorrador.set('Borrador guardado localmente con éxito a las ' + borrador.guardadoEn);
    } catch {
      this.mensajeBorrador.set('Borrador actualizado.');
    }
    setTimeout(() => this.mensajeBorrador.set(null), 4000);
  }

  abrirVistaPreviaPdf() {
    this.mostrarModalVistaPrevia.set(true);
  }

  cerrarVistaPreviaPdf() {
    this.mostrarModalVistaPrevia.set(false);
  }

  imprimirPdf() {
    window.print();
  }
}
