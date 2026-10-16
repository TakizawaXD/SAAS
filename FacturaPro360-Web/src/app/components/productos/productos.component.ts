import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from '../../services/facturapro.service';
import { ConfirmService } from '../../services/confirm.service';
import { HelpService } from '../../services/help.service';
import { Producto } from '../../models/facturapro.models';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto">

      <!-- ENCABEZADO Y ACCIONES -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Productos e inventario</h1>
            <button (click)="help.mostrarAyuda('productos')" 
                    class="w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                    title="Explicacion y ayuda sobre el catalogo e inventario">
              ?
            </button>
          </div>
          <p class="text-xs text-slate-500 mt-1">Gestion del catalogo, control de existencias kardex y fijacion de precios.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button (click)="abrirModalNuevo()" class="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Nuevo producto
          </button>

          <button (click)="abrirModalImportar()" class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Importar
          </button>

          <button (click)="exportarCsv()" class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer">
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Exportar
          </button>
        </div>
      </div>

      <!-- TABS DE NAVEGACIÓN -->
      <div class="border-b border-slate-200 flex gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto pb-0.5">
        <button (click)="tabActiva.set('productos')" [ngClass]="tabActiva() === 'productos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'" class="pb-3 cursor-pointer shrink-0">Productos</button>
        <button (click)="tabActiva.set('categorias')" [ngClass]="tabActiva() === 'categorias' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'" class="pb-3 cursor-pointer shrink-0">Categorías ({{ categorias().length }})</button>
        <button (click)="tabActiva.set('marcas')" [ngClass]="tabActiva() === 'marcas' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'" class="pb-3 cursor-pointer shrink-0">Marcas ({{ marcas().length }})</button>
        <button (click)="tabActiva.set('almacenes')" [ngClass]="tabActiva() === 'almacenes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'" class="pb-3 cursor-pointer shrink-0">Almacenes ({{ almacenes().length }})</button>
        <button (click)="tabActiva.set('movimientos')" [ngClass]="tabActiva() === 'movimientos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'" class="pb-3 cursor-pointer shrink-0">Movimientos Kardex</button>
      </div>

      <!-- TAB 1: PRODUCTOS PRINCIPAL -->
      <div *ngIf="tabActiva() === 'productos'" class="space-y-6">
        <!-- FILTROS Y BÚSQUEDA -->
        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2 sm:gap-3">
            <select [(ngModel)]="filtroTipo" class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none">
              <option value="Todos">Todos los tipos</option>
              <option value="Producto">Producto</option>
              <option value="Servicio">Servicio</option>
            </select>

            <select [(ngModel)]="filtroEstado" class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 focus:outline-none">
              <option value="Todos">Todos los estados</option>
              <option value="Activo">Activos</option>
              <option value="StockBajo">Stock Bajo</option>
              <option value="Inactivo">Inactivos</option>
            </select>
          </div>

          <div class="relative w-full md:w-64">
            <input type="text" [(ngModel)]="busqueda" placeholder="Buscar por nombre o SKU..." 
                   class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500" />
            <div class="absolute left-2.5 top-2 text-slate-400">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
          </div>
        </div>

        <!-- TABLA DE PRODUCTOS CON CONEXIÓN EN TIEMPO REAL -->
        <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs min-w-[760px]">
              <thead class="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4 w-12">Ítem</th>
                  <th class="py-3 px-4">Nombre</th>
                  <th class="py-3 px-4">SKU</th>
                  <th class="py-3 px-4">Tipo</th>
                  <th class="py-3 px-4 text-center">Stock Actual</th>
                  <th class="py-3 px-4 text-right">Precio Venta</th>
                  <th class="py-3 px-4 text-center">Estado</th>
                  <th class="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr *ngFor="let p of productosPaginados()" class="hover:bg-slate-50/70 transition">
                  <td class="py-3 px-4">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </td>
                  <td class="py-3 px-4 font-semibold text-slate-900">
                    {{ p.nombre }}
                    <span *ngIf="p.descripcion" class="block text-[11px] text-slate-400 font-normal">{{ p.descripcion }}</span>
                  </td>
                  <td class="py-3 px-4 font-mono text-slate-500">{{ p.sku }}</td>
                  <td class="py-3 px-4 text-slate-500">{{ p.tipo }}</td>
                  <td class="py-3 px-4 text-center">
                    <span [ngClass]="p.stock_actual <= p.stock_minimo ? 'text-amber-600 font-bold' : 'text-slate-800 font-semibold'">
                      {{ p.stock_actual }}
                    </span>
                    <span class="text-[10px] text-slate-400 block">Mín: {{ p.stock_minimo }}</span>
                  </td>
                  <td class="py-3 px-4 text-right font-medium text-slate-900">\${{ p.precio_venta | number:'1.2-2' }}</td>
                  <td class="py-3 px-4 text-center">
                    <span *ngIf="!p.activo" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                      Inactivo
                    </span>
                    <span *ngIf="p.activo && p.stock_actual <= p.stock_minimo" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                      Stock bajo
                    </span>
                    <span *ngIf="p.activo && p.stock_actual > p.stock_minimo" class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Activo
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                      <!-- EDITAR -->
                      <button (click)="abrirModalEditar(p)" title="Editar producto" 
                              class="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      <!-- ELIMINAR (CON CONFIRMACIÓN "¿ESTÁS SEGURO?") -->
                      <button (click)="solicitarEliminar(p)" title="Eliminar producto" 
                              class="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="productosFiltrados().length === 0">
                  <td colspan="8" class="text-center py-8 text-slate-400">
                    No se encontraron productos registrados con los filtros seleccionados.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- PAGINACIÓN FUNCIONAL -->
          <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Página {{ paginaActual() }} de {{ totalPaginas() }} (Total: {{ productosFiltrados().length }} productos)</span>
            <div class="flex items-center gap-1">
              <button (click)="cambiarPagina(-1)" [disabled]="paginaActual() <= 1" class="w-7 h-7 rounded border border-slate-200 bg-white disabled:opacity-40 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-50">&larr;</button>
              <span class="w-7 h-7 rounded bg-[#2563EB] text-white font-bold flex items-center justify-center shadow-xs">{{ paginaActual() }}</span>
              <button (click)="cambiarPagina(1)" [disabled]="paginaActual() >= totalPaginas()" class="w-7 h-7 rounded border border-slate-200 bg-white disabled:opacity-40 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-50">&rarr;</button>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: CATEGORÍAS -->
      <div *ngIf="tabActiva() === 'categorias'" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-xs text-slate-500">Clasifica tus productos y servicios por líneas de negocio.</p>
          <div class="flex gap-2">
            <input type="text" [(ngModel)]="nuevaCategoriaNombre" placeholder="Nueva categoría..." class="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800" />
            <button (click)="agregarCategoria()" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">Agregar</button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div *ngFor="let cat of categorias()" class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h4 class="text-xs font-bold text-slate-900">{{ cat }}</h4>
              <p class="text-[11px] text-slate-400">Categoría del catálogo</p>
            </div>
            <button (click)="eliminarCategoria(cat)" class="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer">Eliminar</button>
          </div>
        </div>
      </div>

      <!-- TAB 3: MARCAS -->
      <div *ngIf="tabActiva() === 'marcas'" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-xs text-slate-500">Fabricantes y marcas registradas de tus artículos.</p>
          <div class="flex gap-2">
            <input type="text" [(ngModel)]="nuevaMarcaNombre" placeholder="Nueva marca..." class="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800" />
            <button (click)="agregarMarca()" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">Agregar</button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div *ngFor="let m of marcas()" class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h4 class="text-xs font-bold text-slate-900">{{ m }}</h4>
              <p class="text-[11px] text-slate-400">Marca certificada</p>
            </div>
            <button (click)="eliminarMarca(m)" class="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer">Eliminar</button>
          </div>
        </div>
      </div>

      <!-- TAB 4: ALMACENES -->
      <div *ngIf="tabActiva() === 'almacenes'" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-xs text-slate-500">Bodegas y centros de distribución donde guardas inventario.</p>
          <div class="flex gap-2">
            <input type="text" [(ngModel)]="nuevoAlmacenNombre" placeholder="Nuevo almacén..." class="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800" />
            <button (click)="agregarAlmacen()" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">Agregar</button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div *ngFor="let a of almacenes()" class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h4 class="text-xs font-bold text-slate-900">{{ a }}</h4>
              <p class="text-[11px] text-slate-400">Bodega activa</p>
            </div>
            <button (click)="eliminarAlmacen(a)" class="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer">Eliminar</button>
          </div>
        </div>
      </div>

      <!-- TAB 5: MOVIMIENTOS KARDEX -->
      <div *ngIf="tabActiva() === 'movimientos'" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-xs text-slate-500">Pista histórica de entradas, salidas y ajustes de existencias en tiempo real.</p>
          <button (click)="registrarAjusteRapido()" class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer">
            + Registrar Entrada / Ajuste
          </button>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th class="py-2.5 px-4">Fecha y Hora</th>
                <th class="py-2.5 px-4">Tipo Movimiento</th>
                <th class="py-2.5 px-4">Producto / SKU</th>
                <th class="py-2.5 px-4 text-center">Cantidad</th>
                <th class="py-2.5 px-4">Referencia / Motivo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr *ngFor="let mov of movimientosKardex()" class="hover:bg-slate-50/70">
                <td class="py-2.5 px-4 font-mono text-slate-500">{{ mov.fecha }}</td>
                <td class="py-2.5 px-4">
                  <span [ngClass]="mov.tipo === 'Entrada' ? 'text-emerald-600 bg-emerald-50 border border-emerald-200' : 'text-amber-600 bg-amber-50 border border-amber-200'" class="px-2 py-0.5 rounded text-[10px] font-bold">
                    {{ mov.tipo }}
                  </span>
                </td>
                <td class="py-2.5 px-4 font-semibold text-slate-800">{{ mov.producto }}</td>
                <td class="py-2.5 px-4 text-center font-mono font-bold" [ngClass]="mov.tipo === 'Entrada' ? 'text-emerald-600' : 'text-slate-800'">
                  {{ mov.tipo === 'Entrada' ? '+' : '-' }}{{ mov.cantidad }}
                </td>
                <td class="py-2.5 px-4 text-slate-500">{{ mov.motivo }}</td>
              </tr>
              <tr *ngIf="movimientosKardex().length === 0">
                <td colspan="5" class="text-center py-6 text-slate-400">No hay movimientos kardex registrados aún.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- MODAL IMPORTAR PRODUCTOS -->
      <div *ngIf="mostrarModalImportar()" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 class="text-sm font-bold text-slate-900">Importar Productos Masivamente</h3>
            <button (click)="cerrarModalImportar()" class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">&times;</button>
          </div>

          <p class="text-xs text-slate-500">Pega los datos de tus productos en formato CSV o pulsa para cargar un ejemplo:</p>

          <textarea [(ngModel)]="textoImportar" rows="5" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-800" placeholder="SKU,Nombre,Tipo,PrecioVenta,Costo,StockActual,StockMinimo"></textarea>

          <div class="flex items-center justify-between pt-2">
            <button (click)="cargarEjemploImportacion()" class="text-xs text-blue-600 font-semibold hover:underline cursor-pointer">
              Cargar ejemplo CSV
            </button>
            <div class="flex items-center gap-2">
              <button (click)="cerrarModalImportar()" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancelar</button>
              <button (click)="procesarImportacion()" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">Importar Productos</button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL CREAR / EDITAR PRODUCTO -->
      <div *ngIf="modalAbierto()" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl animate-fade-in max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h3 class="text-base font-bold text-slate-900">
              {{ modoEdicion() ? 'Editar Producto' : 'Nuevo Producto en Inventario' }}
            </h3>
            <button (click)="cerrarModal()" class="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">&times;</button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nombre del Producto *</label>
                <input type="text" [(ngModel)]="formProducto.nombre" placeholder="Ej: Laptop Pro 15"
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Código SKU *</label>
                <input type="text" [(ngModel)]="formProducto.sku" placeholder="Ej: LP-15-001"
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Tipo de Ítem</label>
                <select [(ngModel)]="formProducto.tipo" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500">
                  <option value="Producto">Producto Físico</option>
                  <option value="Servicio">Servicio</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Unidad de Medida</label>
                <input type="text" [(ngModel)]="formProducto.unidad_medida" placeholder="UND, KG, HRS"
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Precio de Venta ($) *</label>
                <input type="number" min="0" step="0.01" [(ngModel)]="formProducto.precio_venta"
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Costo Unitario ($)</label>
                <input type="number" min="0" step="0.01" [(ngModel)]="formProducto.costo_promedio"
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Stock Actual</label>
                <input type="number" min="0" [(ngModel)]="formProducto.stock_actual"
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Stock Mínimo (Alerta)</label>
                <input type="number" min="0" [(ngModel)]="formProducto.stock_minimo"
                       class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
              <textarea [(ngModel)]="formProducto.descripcion" rows="2" placeholder="Detalles técnicos o notas internas..."
                        class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"></textarea>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <input type="checkbox" id="chkActivo" [(ngModel)]="formProducto.activo" class="rounded text-blue-600 focus:ring-0">
              <label for="chkActivo" class="text-xs text-slate-700 font-medium">Producto activo para facturación</label>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button (click)="cerrarModal()" class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer">
                Cancelar
              </button>
              <button (click)="guardarProducto()" [disabled]="!formProducto.nombre || !formProducto.sku" 
                      class="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-xs font-bold shadow-sm cursor-pointer">
                {{ modoEdicion() ? 'Actualizar Producto' : 'Guardar en Base de Datos' }}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `
})
export class ProductosComponent {
  private service = inject(FacturaProService);
  private confirmService = inject(ConfirmService);
  help = inject(HelpService);

  busqueda = '';
  filtroTipo = 'Todos';
  filtroEstado = 'Todos';

  tabActiva = signal<'productos' | 'categorias' | 'marcas' | 'almacenes' | 'movimientos'>('productos');
  paginaActual = signal<number>(1);
  itemsPorPagina = 8;
  mostrarModalImportar = signal<boolean>(false);
  textoImportar = '';

  categorias = signal<string[]>(['Tecnología y Equipos', 'Servicios Profesionales', 'Suministros y Accesorios']);
  nuevaCategoriaNombre = '';

  marcas = signal<string[]>(['Apple', 'Dell', 'HP', 'Logitech', 'Genérico']);
  nuevaMarcaNombre = '';

  almacenes = signal<string[]>(['Almacén Principal Central', 'Bodega San José Este', 'Punto de Venta Local']);
  nuevoAlmacenNombre = '';

  movimientosKardex = signal<Array<{ fecha: string; tipo: 'Entrada' | 'Salida'; producto: string; cantidad: number; motivo: string }>>([
    { fecha: '2026-10-15 09:30', tipo: 'Entrada', producto: 'Inventario Inicial', cantidad: 50, motivo: 'Apertura de catálogo y balance' }
  ]);

  modalAbierto = signal<boolean>(false);
  modoEdicion = signal<boolean>(false);
  productoEnEdicionId: string | null = null;

  formProducto: {
    nombre: string;
    sku: string;
    tipo: 'Producto' | 'Servicio';
    unidad_medida: string;
    precio_venta: number;
    costo_promedio: number;
    stock_actual: number;
    stock_minimo: number;
    descripcion: string;
    activo: boolean;
  } = {
    nombre: '',
    sku: '',
    tipo: 'Producto',
    unidad_medida: 'UND',
    precio_venta: 0,
    costo_promedio: 0,
    stock_actual: 0,
    stock_minimo: 5,
    descripcion: '',
    activo: true
  };

  productosFiltrados = computed(() => {
    let prods = this.service.productos();

    if (this.filtroTipo !== 'Todos') {
      prods = prods.filter(p => p.tipo === this.filtroTipo);
    }

    if (this.filtroEstado === 'Activo') {
      prods = prods.filter(p => p.activo && p.stock_actual > p.stock_minimo);
    } else if (this.filtroEstado === 'StockBajo') {
      prods = prods.filter(p => p.activo && p.stock_actual <= p.stock_minimo);
    } else if (this.filtroEstado === 'Inactivo') {
      prods = prods.filter(p => !p.activo);
    }

    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase();
      prods = prods.filter(p => 
        p.nombre.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q)
      );
    }

    return prods;
  });

  totalPaginas = computed(() => {
    const total = this.productosFiltrados().length;
    return Math.max(1, Math.ceil(total / this.itemsPorPagina));
  });

  productosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.productosFiltrados().slice(inicio, inicio + this.itemsPorPagina);
  });

  cambiarPagina(delta: number) {
    const nueva = this.paginaActual() + delta;
    if (nueva >= 1 && nueva <= this.totalPaginas()) {
      this.paginaActual.set(nueva);
    }
  }

  abrirModalImportar() {
    this.mostrarModalImportar.set(true);
  }

  cerrarModalImportar() {
    this.mostrarModalImportar.set(false);
  }

  cargarEjemploImportacion() {
    this.textoImportar = `SKU-1001,Laptop Dell Inspiron 15,Producto,750.00,520.00,12,3\nSKU-1002,Monitor LG 27 Pulgadas 4K,Producto,320.00,210.00,8,2\nSKU-1003,Mantenimiento Preventivo Servidor,Servicio,150.00,45.00,99,0`;
  }

  procesarImportacion() {
    if (!this.textoImportar.trim()) return;
    const lineas = this.textoImportar.trim().split('\n');
    for (const linea of lineas) {
      const partes = linea.split(',').map(s => s.trim());
      if (partes.length >= 4) {
        this.service.agregarProducto({
          sku: partes[0] || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
          nombre: partes[1] || 'Producto Importado',
          tipo: (partes[2] === 'Servicio' ? 'Servicio' : 'Producto'),
          unidad_medida: 'UND',
          precio_venta: Number(partes[3]) || 0,
          costo_promedio: Number(partes[4]) || 0,
          stock_actual: Number(partes[5]) || 0,
          stock_minimo: Number(partes[6]) || 5,
          permite_stock_negativo: false,
          iva_porcentaje: 13.00,
          descripcion: 'Importado masivamente vía CSV',
          activo: true
        });
      }
    }
    this.textoImportar = '';
    this.cerrarModalImportar();
  }

  exportarCsv() {
    const productos = this.productosFiltrados();
    let csv = 'SKU,Nombre,Tipo,UnidadMedida,PrecioVenta,CostoPromedio,StockActual,StockMinimo,Activo\r\n';
    productos.forEach(p => {
      csv += `"${p.sku}","${p.nombre}","${p.tipo}","${p.unidad_medida}",${p.precio_venta},${p.costo_promedio},${p.stock_actual},${p.stock_minimo},${p.activo}\r\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  agregarCategoria() {
    if (!this.nuevaCategoriaNombre.trim()) return;
    this.categorias.update(arr => [...arr, this.nuevaCategoriaNombre.trim()]);
    this.nuevaCategoriaNombre = '';
  }

  eliminarCategoria(cat: string) {
    this.categorias.update(arr => arr.filter(c => c !== cat));
  }

  agregarMarca() {
    if (!this.nuevaMarcaNombre.trim()) return;
    this.marcas.update(arr => [...arr, this.nuevaMarcaNombre.trim()]);
    this.nuevaMarcaNombre = '';
  }

  eliminarMarca(marca: string) {
    this.marcas.update(arr => arr.filter(m => m !== marca));
  }

  agregarAlmacen() {
    if (!this.nuevoAlmacenNombre.trim()) return;
    this.almacenes.update(arr => [...arr, this.nuevoAlmacenNombre.trim()]);
    this.nuevoAlmacenNombre = '';
  }

  eliminarAlmacen(alm: string) {
    this.almacenes.update(arr => arr.filter(a => a !== alm));
  }

  registrarAjusteRapido() {
    const fecha = new Date().toISOString().replace('T', ' ').slice(0, 16);
    this.movimientosKardex.update(arr => [
      {
        fecha,
        tipo: 'Entrada',
        producto: 'Ajuste manual de inventario',
        cantidad: 5,
        motivo: 'Recuento físico y verificación de almacén'
      },
      ...arr
    ]);
  }

  abrirModalNuevo() {
    this.modoEdicion.set(false);
    this.productoEnEdicionId = null;
    this.formProducto = {
      nombre: '',
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      tipo: 'Producto',
      unidad_medida: 'UND',
      precio_venta: 50.00,
      costo_promedio: 30.00,
      stock_actual: 10,
      stock_minimo: 5,
      descripcion: '',
      activo: true
    };
    this.modalAbierto.set(true);
  }

  abrirModalEditar(p: Producto) {
    this.modoEdicion.set(true);
    this.productoEnEdicionId = p.id;
    this.formProducto = {
      nombre: p.nombre,
      sku: p.sku,
      tipo: p.tipo,
      unidad_medida: p.unidad_medida,
      precio_venta: p.precio_venta,
      costo_promedio: p.costo_promedio,
      stock_actual: p.stock_actual,
      stock_minimo: p.stock_minimo,
      descripcion: p.descripcion || '',
      activo: p.activo
    };
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  guardarProducto() {
    if (!this.formProducto.nombre || !this.formProducto.sku) return;

    if (this.modoEdicion() && this.productoEnEdicionId) {
      this.service.actualizarProducto(this.productoEnEdicionId, {
        nombre: this.formProducto.nombre,
        sku: this.formProducto.sku,
        tipo: this.formProducto.tipo,
        unidad_medida: this.formProducto.unidad_medida,
        precio_venta: Number(this.formProducto.precio_venta),
        costo_promedio: Number(this.formProducto.costo_promedio),
        stock_actual: Number(this.formProducto.stock_actual),
        stock_minimo: Number(this.formProducto.stock_minimo),
        descripcion: this.formProducto.descripcion,
        activo: this.formProducto.activo
      });
    } else {
      this.service.agregarProducto({
        nombre: this.formProducto.nombre,
        sku: this.formProducto.sku,
        tipo: this.formProducto.tipo,
        unidad_medida: this.formProducto.unidad_medida,
        precio_venta: Number(this.formProducto.precio_venta),
        costo_promedio: Number(this.formProducto.costo_promedio),
        stock_actual: Number(this.formProducto.stock_actual),
        stock_minimo: Number(this.formProducto.stock_minimo),
        permite_stock_negativo: false,
        iva_porcentaje: 13.00,
        descripcion: this.formProducto.descripcion,
        activo: this.formProducto.activo
      });
    }

    this.cerrarModal();
  }

  async solicitarEliminar(p: Producto) {
    const confirmado = await this.confirmService.confirm({
      title: '¿Estás seguro de eliminar este producto?',
      message: `Esta acción eliminará el producto del inventario activo y quedará registrada en la pista de auditoría inmutable. Si posee facturas previas, será desactivado para proteger los registros contables.`,
      itemNombre: `${p.nombre} (SKU: ${p.sku})`,
      confirmText: 'Sí, eliminar producto',
      cancelText: 'Cancelar',
      tipo: 'danger'
    });

    if (confirmado) {
      this.service.eliminarProducto(p.id);
    }
  }
}
