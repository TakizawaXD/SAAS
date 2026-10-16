import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';
import { HelpService } from '../../services/help.service';
import { Empresa } from '../../models/facturapro.models';

type TabConfig = 'empresa' | 'impuestos' | 'apariencia' | 'plantillas';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">
      
      <!-- ENCABEZADO Y BOTÓN GUARDAR -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Configuracion del Sistema</h1>
            <button (click)="help.mostrarAyuda('configuracion')" 
                    class="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    title="Explicacion y ayuda sobre ajustes de la empresa">
              ?
            </button>
          </div>
          <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <a href="/" class="hover:text-slate-600">Inicio</a>
            <span>&gt;</span>
            <span class="text-slate-700 font-medium">Configuracion</span>
          </div>
        </div>

        <button (click)="guardarCambios()" class="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          <span>Guardar Cambios</span>
        </button>
      </div>

      <!-- ALERTA / TOAST DE ÉXITO -->
      <div *ngIf="mensajeExito()" class="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>{{ mensajeExito() }}</span>
        </div>
        <button (click)="mensajeExito.set('')" class="text-emerald-600 hover:text-emerald-900 font-bold">&times;</button>
      </div>

      <!-- TABS NAVEGABLES FUNCIONALES -->
      <div class="border-b border-slate-200 flex flex-wrap gap-4 sm:gap-8 text-xs font-semibold">
        <button (click)="tabActiva.set('empresa')" 
                [ngClass]="tabActiva() === 'empresa' ? 'text-blue-600 border-b-2 border-blue-600 pb-3' : 'text-slate-400 hover:text-slate-600 pb-3'" 
                class="transition cursor-pointer">
          Empresa e Identidad
        </button>
        <button (click)="tabActiva.set('impuestos')" 
                [ngClass]="tabActiva() === 'impuestos' ? 'text-blue-600 border-b-2 border-blue-600 pb-3' : 'text-slate-400 hover:text-slate-600 pb-3'" 
                class="transition cursor-pointer">
          Impuestos y Numeraciones
        </button>
        <button (click)="tabActiva.set('apariencia')" 
                [ngClass]="tabActiva() === 'apariencia' ? 'text-blue-600 border-b-2 border-blue-600 pb-3' : 'text-slate-400 hover:text-slate-600 pb-3'" 
                class="transition cursor-pointer">
          Apariencia y Colores
        </button>
        <button (click)="tabActiva.set('plantillas')" 
                [ngClass]="tabActiva() === 'plantillas' ? 'text-blue-600 border-b-2 border-blue-600 pb-3' : 'text-slate-400 hover:text-slate-600 pb-3'" 
                class="transition cursor-pointer">
          Plantillas de Factura
        </button>
      </div>

      <!-- TAB 1: EMPRESA E IDENTIDAD -->
      <div *ngIf="tabActiva() === 'empresa'" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div>
          <h3 class="text-sm font-bold text-slate-900 pb-1">Datos Legales y Comerciales</h3>
          <p class="text-xs text-slate-400">Esta información aparecerá automáticamente en el encabezado de todas las facturas y comprobantes emitidos.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Razón Social o Nombre Legal *</label>
            <input type="text" [(ngModel)]="empresaEdit.razon_social" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nombre Comercial (Marca)</label>
            <input type="text" [(ngModel)]="empresaEdit.nombre_comercial" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Identificación Fiscal (RUC / NIT / RFC / CIF) *</label>
            <input type="text" [(ngModel)]="empresaEdit.identificacion_fiscal" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico de Facturación</label>
            <input type="email" [(ngModel)]="empresaEdit.correo" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Teléfono Principal de Contacto</label>
            <input type="text" [(ngModel)]="empresaEdit.telefono" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Moneda Principal</label>
            <select [(ngModel)]="empresaEdit.moneda" (change)="onMonedaChange()" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
              <option value="USD">USD - Dólar Estadounidense ($)</option>
              <option value="COP">COP - Peso Colombiano ($)</option>
              <option value="MXN">MXN - Peso Mexicano ($)</option>
              <option value="CRC">CRC - Colón Costarricense (₡)</option>
              <option value="EUR">EUR - Euro (€)</option>
              <option value="PEN">PEN - Sol Peruano (S/)</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1">Direccion Fisica o Domicilio Tributario *</label>
            <input type="text" [(ngModel)]="empresaEdit.direccion" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Pais</label>
            <input type="text" [(ngModel)]="empresaEdit.pais" placeholder="Colombia" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Departamento / Estado</label>
            <input type="text" [(ngModel)]="empresaEdit.departamento_estado" placeholder="Antioquia" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Ciudad / Municipio</label>
            <input type="text" [(ngModel)]="empresaEdit.ciudad" placeholder="Medellin" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Barrio o Zona</label>
            <input type="text" [(ngModel)]="empresaEdit.barrio_zona" placeholder="Zona Industrial" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Telefono Secundario</label>
            <input type="text" [(ngModel)]="empresaEdit.telefono_secundario" placeholder="+57 604 0000000" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Sitio Web</label>
            <input type="text" [(ngModel)]="empresaEdit.sitio_web" placeholder="https://mitienda.com" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Zona Horaria</label>
            <select [(ngModel)]="empresaEdit.zona_horaria" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
              <option value="America/Bogota">America/Bogota (UTC-5)</option>
              <option value="America/Costa_Rica">America/Costa_Rica (UTC-6)</option>
              <option value="America/Mexico_City">America/Mexico_City (UTC-6)</option>
              <option value="America/Lima">America/Lima (UTC-5)</option>
              <option value="America/Santiago">America/Santiago (UTC-3)</option>
              <option value="Europe/Madrid">Europe/Madrid (UTC+1)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Formato de Fecha</label>
            <select [(ngModel)]="empresaEdit.formato_fecha" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </div>
        </div>
      </div>

      <!-- TAB 2: IMPUESTOS Y NUMERACIONES -->
      <div *ngIf="tabActiva() === 'impuestos'" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div>
          <h3 class="text-sm font-bold text-slate-900 pb-1">Control de Folios Fiscales e Impuestos</h3>
          <p class="text-xs text-slate-400">Configura la serie consecutiva de comprobantes y las reglas impositivas predeterminadas.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Prefijo de Factura Predeterminado</label>
            <input type="text" [(ngModel)]="prefijoFactura" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" placeholder="FAC" />
            <span class="text-[10px] text-slate-400 mt-1 block">Ejemplo: FAC-00000001</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Siguiente Consecutivo de Factura</label>
            <input type="number" [(ngModel)]="consecutivoNumero" min="1" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" />
            <span class="text-[10px] text-slate-400 mt-1 block">Puedes ajustar el número de inicio según tu correlativo anterior</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tasa de IVA / Impuesto General (%)</label>
            <select [(ngModel)]="ivaPredeterminado" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
              <option [value]="0">0% (Exento / Tasa Cero)</option>
              <option [value]="13">13% (Costa Rica / General)</option>
              <option [value]="16">16% (México / General)</option>
              <option [value]="19">19% (Colombia / General)</option>
              <option [value]="21">21% (España / IVA General)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Días de Vencimiento de Facturas a Crédito</label>
            <select [(ngModel)]="diasCreditoPredeterminado" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white">
              <option [value]="0">Contado (Vencimiento el mismo día)</option>
              <option [value]="15">15 Días calendario</option>
              <option [value]="30">30 Días calendario</option>
              <option [value]="45">45 Días calendario</option>
              <option [value]="60">60 Días calendario</option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1">Términos Legales al Pie de Factura</label>
            <textarea [(ngModel)]="terminosFactura" rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white" placeholder="Esta factura de venta constituye título ejecutivo conforme a la legislación mercantil vigente..."></textarea>
          </div>
        </div>
      </div>

      <!-- TAB 3: APARIENCIA Y COLORES -->
      <div *ngIf="tabActiva() === 'apariencia'" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div>
          <h3 class="text-sm font-bold text-slate-900 pb-1">Personalización Visual del Entorno</h3>
          <p class="text-xs text-slate-400">Ajusta los colores corporativos y la densidad de información en pantalla.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-2">Tema de Color Principal</label>
            <div class="grid grid-cols-2 gap-3">
              <button (click)="temaColor = 'blue'" [ngClass]="temaColor === 'blue' ? 'ring-2 ring-blue-600 bg-blue-50/50' : 'border border-slate-200'" class="p-3 rounded-lg flex items-center gap-2.5 text-left text-xs font-semibold text-slate-700 cursor-pointer">
                <span class="w-4 h-4 rounded-full bg-blue-600"></span>
                Azul Ejecutivo
              </button>
              <button (click)="temaColor = 'emerald'" [ngClass]="temaColor === 'emerald' ? 'ring-2 ring-emerald-600 bg-emerald-50/50' : 'border border-slate-200'" class="p-3 rounded-lg flex items-center gap-2.5 text-left text-xs font-semibold text-slate-700 cursor-pointer">
                <span class="w-4 h-4 rounded-full bg-emerald-600"></span>
                Esmeralda
              </button>
              <button (click)="temaColor = 'purple'" [ngClass]="temaColor === 'purple' ? 'ring-2 ring-purple-600 bg-purple-50/50' : 'border border-slate-200'" class="p-3 rounded-lg flex items-center gap-2.5 text-left text-xs font-semibold text-slate-700 cursor-pointer">
                <span class="w-4 h-4 rounded-full bg-purple-600"></span>
                Púrpura Royal
              </button>
              <button (click)="temaColor = 'slate'" [ngClass]="temaColor === 'slate' ? 'ring-2 ring-slate-800 bg-slate-50' : 'border border-slate-200'" class="p-3 rounded-lg flex items-center gap-2.5 text-left text-xs font-semibold text-slate-700 cursor-pointer">
                <span class="w-4 h-4 rounded-full bg-slate-800"></span>
                Grafito Oscuro
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-2">Densidad de la Interfaz</label>
            <div class="space-y-2">
              <label class="flex items-center gap-2 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input type="radio" [(ngModel)]="densidadInterfaz" value="normal" name="densidad" class="text-blue-600" />
                <div>
                  <div class="text-xs font-bold text-slate-800">Espaciado Estándar</div>
                  <div class="text-[11px] text-slate-400">Diseño amplio optimizado para pantallas táctiles y escritorios.</div>
                </div>
              </label>

              <label class="flex items-center gap-2 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                <input type="radio" [(ngModel)]="densidadInterfaz" value="compacta" name="densidad" class="text-blue-600" />
                <div>
                  <div class="text-xs font-bold text-slate-800">Modo Compacto</div>
                  <div class="text-[11px] text-slate-400">Mayor densidad de filas en tablas para terminales de facturación rápida.</div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: PLANTILLAS DE FACTURA -->
      <div *ngIf="tabActiva() === 'plantillas'" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div>
          <h3 class="text-sm font-bold text-slate-900 pb-1">Diseño y Formato de Comprobantes PDF</h3>
          <p class="text-xs text-slate-400">Selecciona el diseño predeterminado para la descarga e impresión de documentos.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div (click)="plantillaSeleccionada = 'ejecutiva'" [ngClass]="plantillaSeleccionada === 'ejecutiva' ? 'border-2 border-blue-600 bg-blue-50/20' : 'border border-slate-200 hover:border-slate-300'" class="p-4 rounded-xl cursor-pointer transition flex flex-col justify-between">
            <div>
              <div class="w-full h-24 bg-slate-100 rounded-lg border border-slate-200 flex flex-col p-2 space-y-1 mb-3">
                <div class="w-16 h-3 bg-blue-600 rounded-xs"></div>
                <div class="w-full h-1.5 bg-slate-300 rounded-xs"></div>
                <div class="w-3/4 h-1.5 bg-slate-300 rounded-xs"></div>
                <div class="mt-auto w-full h-6 bg-white border border-slate-200 rounded-xs"></div>
              </div>
              <div class="text-xs font-bold text-slate-900">Formato Ejecutivo</div>
              <div class="text-[11px] text-slate-500 mt-0.5">Encabezado formal azul corporativo, tabla detallada y pie bancario.</div>
            </div>
            <div class="mt-3 text-[10px] font-bold text-blue-600" *ngIf="plantillaSeleccionada === 'ejecutiva'">[Seleccionada]</div>
          </div>

          <div (click)="plantillaSeleccionada = 'minimalista'" [ngClass]="plantillaSeleccionada === 'minimalista' ? 'border-2 border-blue-600 bg-blue-50/20' : 'border border-slate-200 hover:border-slate-300'" class="p-4 rounded-xl cursor-pointer transition flex flex-col justify-between">
            <div>
              <div class="w-full h-24 bg-slate-100 rounded-lg border border-slate-200 flex flex-col p-2 space-y-1 mb-3">
                <div class="w-20 h-2 bg-slate-800 rounded-xs"></div>
                <div class="w-full h-1 bg-slate-300 rounded-xs"></div>
                <div class="w-full h-1 bg-slate-300 rounded-xs"></div>
                <div class="mt-auto w-full h-6 bg-white border border-slate-200 rounded-xs"></div>
              </div>
              <div class="text-xs font-bold text-slate-900">Moderna Minimalista</div>
              <div class="text-[11px] text-slate-500 mt-0.5">Líneas limpias, tipografía moderna y ahorro de tinta para impresión.</div>
            </div>
            <div class="mt-3 text-[10px] font-bold text-blue-600" *ngIf="plantillaSeleccionada === 'minimalista'">[Seleccionada]</div>
          </div>

          <div (click)="plantillaSeleccionada = 'termica'" [ngClass]="plantillaSeleccionada === 'termica' ? 'border-2 border-blue-600 bg-blue-50/20' : 'border border-slate-200 hover:border-slate-300'" class="p-4 rounded-xl cursor-pointer transition flex flex-col justify-between">
            <div>
              <div class="w-full h-24 bg-slate-100 rounded-lg border border-slate-200 flex flex-col items-center p-2 space-y-1 mb-3">
                <div class="w-16 h-20 bg-white border border-slate-300 p-1 space-y-1">
                  <div class="w-8 h-1 bg-slate-600 mx-auto"></div>
                  <div class="w-12 h-0.5 bg-slate-400 mx-auto"></div>
                  <div class="w-10 h-0.5 bg-slate-400 mx-auto"></div>
                  <div class="w-8 h-3 bg-slate-200 mx-auto mt-2"></div>
                </div>
              </div>
              <div class="text-xs font-bold text-slate-900">Ticket Térmico POS (80mm)</div>
              <div class="text-[11px] text-slate-500 mt-0.5">Comprobante angosto para impresoras térmicas de punto de venta.</div>
            </div>
            <div class="mt-3 text-[10px] font-bold text-blue-600" *ngIf="plantillaSeleccionada === 'termica'">[Seleccionada]</div>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 space-y-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="mostrarQrFiscal" class="rounded text-blue-600" />
            <span class="text-xs font-semibold text-slate-700">Incluir código QR de validación fiscal en el pie del PDF</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="mostrarDatosBancarios" class="rounded text-blue-600" />
            <span class="text-xs font-semibold text-slate-700">Incluir cuenta bancaria IBAN / CLABE para transferencias</span>
          </label>
        </div>
      </div>

    </div>
  `
})
export class ConfiguracionComponent {
  private service = inject(FacturaProService);
  help = inject(HelpService);

  tabActiva = signal<TabConfig>('empresa');
  mensajeExito = signal<string>('');

  empresaEdit: Empresa = { ...this.service.empresa() };

  prefijoFactura: string = 'FAC';
  consecutivoNumero: number = this.service.consecutivoFactura();
  ivaPredeterminado: number = 16;
  diasCreditoPredeterminado: number = 30;
  terminosFactura: string = 'Esta factura constituye título ejecutivo conforme a la legislación comercial. El pago debe efectuarse en el plazo estipulado.';

  temaColor: 'blue' | 'emerald' | 'purple' | 'slate' = 'blue';
  densidadInterfaz: 'normal' | 'compacta' = 'normal';

  plantillaSeleccionada: 'ejecutiva' | 'minimalista' | 'termica' = 'ejecutiva';
  mostrarQrFiscal: boolean = true;
  mostrarDatosBancarios: boolean = true;

  onMonedaChange() {
    const simbolos: Record<string, string> = {
      'USD': '$',
      'COP': '$',
      'MXN': '$',
      'CRC': '₡',
      'EUR': '€',
      'PEN': 'S/'
    };
    this.empresaEdit.simbolo_moneda = simbolos[this.empresaEdit.moneda] || '$';
  }

  guardarCambios() {
    this.service.actualizarConfiguracionEmpresa(this.empresaEdit, this.consecutivoNumero);
    this.mensajeExito.set('Configuración guardada exitosamente. Los datos de la empresa, numeraciones y apariencia han sido actualizados.');
    setTimeout(() => {
      this.mensajeExito.set('');
    }, 4000);
  }
}
