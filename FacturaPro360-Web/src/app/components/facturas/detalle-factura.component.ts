import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';
import { AuthService } from '../../services/auth.service';
import { ConfirmService } from '../../services/confirm.service';
import { HelpService } from '../../services/help.service';
import { Factura, MetodoPago } from '../../models/facturapro.models';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-detalle-factura',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6" *ngIf="factura(); else noEncontrada">
      <!-- HEADER CON ACCIONES -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div class="flex items-center gap-3">
          <a routerLink="/facturas" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">&larr;</a>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-white tracking-tight">{{ factura()!.numero_factura }}</h1>
              <button (click)="help.mostrarAyuda('detalle-factura')" 
                      class="w-6 h-6 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                      title="Explicacion sobre las acciones disponibles en este comprobante">
                ?
              </button>
              <span [ngClass]="{
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': factura()!.estado === 'Pagada',
                'bg-sky-500/10 text-sky-400 border-sky-500/20': factura()!.estado === 'Emitida',
                'bg-amber-500/10 text-amber-400 border-amber-500/20': factura()!.estado === 'Parcial',
                'bg-rose-500/10 text-rose-400 border-rose-500/20': factura()!.estado === 'Anulada'
              }" class="px-2.5 py-0.5 rounded-full text-xs font-semibold border">
                {{ factura()!.estado }}
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Emitida el {{ factura()!.fecha_emision | date:'dd/MM/yyyy HH:mm' }} &bull; Vence: {{ factura()!.fecha_vencimiento | date:'dd/MM/yyyy' }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button (click)="imprimirPdf()" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 shadow-sm transition flex items-center gap-1.5 cursor-pointer">
            <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Descargar PDF Oficial
          </button>

          <button *ngIf="factura()!.estado !== 'Pagada' && factura()!.estado !== 'Anulada'" 
                  (click)="mostrarModalPago.set(true)" 
                  class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            Registrar Pago
          </button>

          <button *ngIf="factura()!.estado !== 'Anulada'" 
                  (click)="mostrarModalAnulacion.set(true)" 
                  class="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/20 transition cursor-pointer">
            Anular Factura
          </button>

          <button (click)="solicitarEliminarFactura()" 
                  class="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition cursor-pointer flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Eliminar
          </button>
        </div>
      </div>

      <!-- DATOS DE EMPRESA Y CLIENTE -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Emisor -->
        <div class="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-lg">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Emisor</span>
          <div class="text-base font-bold text-white">{{ factura()!.empresa_nombre || nombreEmisor() }}</div>
          <div class="text-xs text-slate-300 mt-1">Identificación Fiscal: {{ empresa().identificacion_fiscal }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ empresa().direccion }}</div>
          <div class="text-xs text-slate-400 mt-1">Correo: {{ empresa().correo }} | Tel: {{ empresa().telefono }}</div>
        </div>

        <!-- Receptor / Cliente -->
        <div class="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-lg">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Cliente / Receptor</span>
          <div class="text-base font-bold text-white">{{ factura()!.cliente?.razon_social }}</div>
          <div class="text-xs text-slate-300 mt-1">{{ factura()!.cliente?.tipo_documento }}: {{ factura()!.cliente?.numero_documento }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ factura()!.cliente?.direccion || 'Sin dirección registrada' }}</div>
          <div class="text-xs text-slate-400 mt-1">Contacto: {{ factura()!.cliente?.nombre_contacto || 'N/A' }}</div>
        </div>
      </div>

      <!-- ÍTEMS FACTURADOS -->
      <div class="rounded-xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-800 font-semibold text-sm text-white">Líneas de la Factura</div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="text-xs uppercase bg-slate-800/80 text-slate-400">
              <tr>
                <th class="py-3 px-4">Descripción</th>
                <th class="py-3 px-4 text-center">Cantidad</th>
                <th class="py-3 px-4 text-right">Precio Unit.</th>
                <th class="py-3 px-4 text-center">IVA %</th>
                <th class="py-3 px-4 text-right">Subtotal</th>
                <th class="py-3 px-4 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let it of factura()!.items">
                <td class="py-3 px-4 font-medium text-white">{{ it.descripcion }}</td>
                <td class="py-3 px-4 text-center">{{ it.cantidad }}</td>
                <td class="py-3 px-4 text-right">\${{ it.precio_unitario | number:'1.2-2' }}</td>
                <td class="py-3 px-4 text-center">{{ it.iva_porcentaje }}%</td>
                <td class="py-3 px-4 text-right">\${{ it.subtotal | number:'1.2-2' }}</td>
                <td class="py-3 px-4 text-right font-bold text-white">\${{ it.total | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- RESUMEN DE TOTALES -->
        <div class="p-6 bg-slate-900/60 border-t border-slate-800 flex justify-end">
          <div class="w-72 space-y-2">
            <div class="flex justify-between text-xs text-slate-400">
              <span>Subtotal:</span>
              <span class="font-medium text-white">\${{ factura()!.subtotal | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between text-xs text-slate-400">
              <span>Descuento:</span>
              <span class="font-medium text-white">-\${{ factura()!.descuento_total | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between text-xs text-slate-400">
              <span>IVA (Impuestos):</span>
              <span class="font-medium text-white">+\${{ factura()!.impuesto_total | number:'1.2-2' }}</span>
            </div>
            <div class="border-t border-slate-700 pt-2 flex justify-between text-base font-bold text-white">
              <span>Total Facturado:</span>
              <span class="text-indigo-400">\${{ factura()!.total | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between text-sm font-bold text-amber-400 pt-1">
              <span>Saldo Pendiente:</span>
              <span>\${{ factura()!.saldo_pendiente | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- HISTORIAL DE PAGOS APLICADOS -->
      <div class="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
        <h3 class="text-sm font-semibold text-white mb-3">Historial de Pagos y Abonos</h3>
        <div *ngIf="pagosFactura().length === 0" class="text-xs text-slate-500 py-3">
          No se registran pagos aún para esta factura.
        </div>
        <div *ngIf="pagosFactura().length > 0" class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300">
            <thead class="uppercase bg-slate-800/60 text-slate-400">
              <tr>
                <th class="py-2.5 px-3">Recibo</th>
                <th class="py-2.5 px-3">Fecha</th>
                <th class="py-2.5 px-3">Método</th>
                <th class="py-2.5 px-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr *ngFor="let p of pagosFactura()">
                <td class="py-2.5 px-3 font-semibold text-white">{{ p.numero_recibo }}</td>
                <td class="py-2.5 px-3 text-slate-400">{{ p.fecha_pago | date:'dd/MM/yyyy HH:mm' }}</td>
                <td class="py-2.5 px-3">{{ p.metodo_pago }}</td>
                <td class="py-2.5 px-3 text-right font-bold text-emerald-400">\${{ p.monto | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL PARA REGISTRAR PAGO -->
      <div *ngIf="mostrarModalPago()" class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
          <h3 class="text-lg font-bold text-white mb-1">Registrar Pago a Factura</h3>
          <p class="text-xs text-slate-400 mb-4">Saldo pendiente actual: \${{ factura()!.saldo_pendiente | number:'1.2-2' }}</p>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Monto a Pagar *</label>
              <input type="number" step="0.01" [(ngModel)]="montoPago" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Método de Pago</label>
              <select [(ngModel)]="metodoPago" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                <option value="Efectivo">Efectivo</option>
                <option value="TarjetaCredito">Tarjeta de Crédito</option>
                <option value="TarjetaDebito">Tarjeta de Débito</option>
                <option value="Transferencia">Transferencia Bancaria</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div class="flex justify-end gap-3 pt-3">
              <button (click)="mostrarModalPago.set(false)" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
                Cancelar
              </button>
              <button (click)="aplicarPago()" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer">
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL PARA ANULAR FACTURA -->
      <div *ngIf="mostrarModalAnulacion()" class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <div class="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
          <h3 class="text-lg font-bold text-rose-400 mb-1">Anular Factura</h3>
          <p class="text-xs text-slate-400 mb-4">Esta acción revertirá los movimientos en el Kardex y el saldo del cliente.</p>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Motivo de Anulación *</label>
              <input type="text" [(ngModel)]="motivoAnulacion" placeholder="Ej: Error en cantidad o desistimiento de cliente" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500" />
            </div>

            <div class="flex justify-end gap-3 pt-3">
              <button (click)="mostrarModalAnulacion.set(false)" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
                Cancelar
              </button>
              <button (click)="aplicarAnulacion()" class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer">
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #noEncontrada>
      <div class="py-16 text-center flex flex-col items-center justify-center max-w-sm mx-auto">
        <img src="/assets/images/empty_invoices.jpg" alt="Factura no encontrada" class="w-36 h-36 object-cover rounded-2xl shadow-sm border border-slate-200 mb-3" />
        <h3 class="text-base font-bold text-slate-800">Factura no encontrada</h3>
        <p class="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">El comprobante solicitado no existe o fue removido del sistema.</p>
        <a routerLink="/facturas" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs">
          &larr; Volver a la lista de facturas
        </a>
      </div>
    </ng-template>
  `
})
export class DetalleFacturaComponent implements OnInit {
  private service = inject(FacturaProService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmService = inject(ConfirmService);
  help = inject(HelpService);

  empresa = this.service.empresa;
  nombreEmisor = computed(() => {
    return this.auth.currentUser()?.empresaNombre || this.empresa().razon_social || this.empresa().nombre_comercial || 'FacturaPro 360';
  });
  facturaId = signal<string>('');
  
  factura = computed(() => {
    const id = this.facturaId();
    return this.service.facturas().find(f => f.id === id);
  });

  pagosFactura = computed(() => {
    const id = this.facturaId();
    return this.service.pagos().filter(p => p.factura_id === id);
  });

  mostrarModalPago = signal<boolean>(false);
  montoPago = signal<number>(0);
  metodoPago = signal<MetodoPago>('Efectivo');

  mostrarModalAnulacion = signal<boolean>(false);
  motivoAnulacion = signal<string>('Error de emisión / Cambio de orden');

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.facturaId.set(id);
        const f = this.factura();
        if (f) this.montoPago.set(f.saldo_pendiente);
      }
    });
  }

  async aplicarPago() {
    if (this.montoPago() <= 0) return;
    try {
      await this.service.registrarPago(this.facturaId(), this.montoPago(), this.metodoPago());
      this.mostrarModalPago.set(false);
      const f = this.factura();
      if (f) this.montoPago.set(f.saldo_pendiente);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async aplicarAnulacion() {
    if (!this.motivoAnulacion()) {
      alert('Debe indicar un motivo de anulación');
      return;
    }

    const confirmado = await this.confirmService.confirm({
      title: '¿Estás seguro de anular esta factura?',
      message: `Esta acción anulará el documento fiscal ${this.factura()?.numero_factura}. Las existencias vendidas se repondrán al stock y se cancelará el saldo pendiente del cliente.`,
      itemNombre: `${this.factura()?.numero_factura} — Motivo: ${this.motivoAnulacion()}`,
      confirmText: 'Sí, anular factura',
      cancelText: 'Cancelar',
      tipo: 'warning'
    });

    if (!confirmado) return;

    try {
      await this.service.anularFactura(this.facturaId(), this.motivoAnulacion());
      this.mostrarModalAnulacion.set(false);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async solicitarEliminarFactura() {
    const f = this.factura();
    if (!f) return;

    const confirmado = await this.confirmService.confirm({
      title: '¿Estás seguro de eliminar esta factura?',
      message: `Esta acción eliminará de forma irreversible el registro fiscal de ${f.numero_factura} de la base de datos contable y quedará auditado.`,
      itemNombre: `${f.numero_factura} (Total: $${f.total.toFixed(2)})`,
      confirmText: 'Sí, eliminar factura',
      cancelText: 'Cancelar',
      tipo: 'danger'
    });

    if (confirmado) {
      this.service.eliminarFactura(f.id);
      this.router.navigate(['/facturas']);
    }
  }

  imprimirPdf() {
    const f = this.factura();
    if (!f) return;
    const emp = this.empresa();

    const doc = new jsPDF();
    doc.setFontSize(16);
    const nombreEmpresaPdf = f.empresa_nombre || this.nombreEmisor();
    doc.text(nombreEmpresaPdf, 14, 20);
    doc.setFontSize(10);
    doc.text(`Identificación Fiscal: ${emp.identificacion_fiscal || 'N/D'}`, 14, 26);
    doc.text(`${emp.direccion || ''} | Tel: ${emp.telefono || ''}`, 14, 32);

    doc.line(14, 36, 196, 36);

    doc.setFontSize(14);
    doc.text(`FACTURA N°: ${f.numero_factura}`, 14, 46);
    doc.setFontSize(10);
    doc.text(`Fecha Emisión: ${new Date(f.fecha_emision).toLocaleDateString()}`, 14, 52);
    doc.text(`Vence: ${new Date(f.fecha_vencimiento).toLocaleDateString()}`, 14, 58);
    doc.text(`Estado: ${f.estado}`, 14, 64);

    doc.text(`Cliente: ${f.cliente?.razon_social}`, 120, 46);
    doc.text(`Documento: ${f.cliente?.numero_documento}`, 120, 52);
    doc.text(`Teléfono: ${f.cliente?.telefono || 'N/A'}`, 120, 58);

    doc.line(14, 70, 196, 70);

    let y = 80;
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción', 14, y);
    doc.text('Cant', 110, y);
    doc.text('Precio', 130, y);
    doc.text('Total', 170, y);
    doc.setFont('helvetica', 'normal');

    y += 6;
    doc.line(14, y, 196, y);
    y += 8;

    if (f.items) {
      for (const it of f.items) {
        doc.text(it.descripcion.substring(0, 40), 14, y);
        doc.text(String(it.cantidad), 110, y);
        doc.text(`$${it.precio_unitario.toFixed(2)}`, 130, y);
        doc.text(`$${it.total.toFixed(2)}`, 170, y);
        y += 8;
      }
    }

    doc.line(14, y, 196, y);
    y += 10;

    doc.text(`Subtotal: $${f.subtotal.toFixed(2)}`, 140, y);
    y += 6;
    doc.text(`IVA / Impuestos: $${f.impuesto_total.toFixed(2)}`, 140, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: $${f.total.toFixed(2)}`, 140, y);
    y += 6;
    doc.text(`Saldo Pendiente: $${f.saldo_pendiente.toFixed(2)}`, 140, y);

    doc.save(`${f.numero_factura}.pdf`);
  }
}
