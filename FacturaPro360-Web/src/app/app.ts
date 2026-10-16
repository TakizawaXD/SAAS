import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FacturaProService } from './services/facturapro.service';
import { AuthService } from './services/auth.service';
import { ConfirmModalComponent } from './components/shared/confirm-modal.component';
import { HelpModalComponent } from './components/shared/help-modal.component';
import { InstallAppModalComponent } from './components/shared/install-app-modal.component';
import { PwaInstallService } from './services/pwa-install.service';
import { filter } from 'rxjs';

export interface ItemBusqueda {
  id: string;
  categoria: 'Facturas' | 'Clientes' | 'Productos' | 'Proveedores' | 'Órdenes de compra' | 'Pagos' | 'Empleados' | 'Documentos' | 'Proyectos';
  codigoBadge: string;
  badgeClase: string;
  titulo: string;
  subtitulo: string;
  monto?: number;
  estado?: string;
  estadoClase?: string;
  ruta: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, ConfirmModalComponent, HelpModalComponent, InstallAppModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private service = inject(FacturaProService);
  private router = inject(Router);
  auth = inject(AuthService);
  pwa = inject(PwaInstallService);

  empresa = this.service.empresa;
  modalBusquedaAbierto = signal<boolean>(false);
  terminoBusqueda = signal<string>('');
  categoriaFiltro = signal<string>('Todos');
  esRutaAutenticacion = signal<boolean>(false);
  menuUsuarioAbierto = signal<boolean>(false);
  menuNotificacionesAbierto = signal<boolean>(false);
  menuEmpresasAbierto = signal<boolean>(false);
  notificacionesLeidas = signal<boolean>(false);
  sidebarAbierto = signal<boolean>(false);

  notificacionesRecientes = () => this.service.eventosAuditoria().slice(0, 5);

  categorias = [
    'Todos', 'Facturas', 'Clientes', 'Productos', 'Proveedores', 
    'Órdenes de compra', 'Pagos', 'Empleados', 'Documentos', 'Proyectos'
  ];

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.esRutaAutenticacion.set(url.includes('/login') || url.includes('/register'));
      this.sidebarAbierto.set(false);
      this.menuUsuarioAbierto.set(false);
    });
  }

  // Colección de todos los datos reales del tenant
  todosLosItems = computed<ItemBusqueda[]>(() => {
    const empId = this.service.getEmpresaActualId();
    const items: ItemBusqueda[] = [];

    // 1. Facturas
    this.service.facturas().forEach(f => {
      items.push({
        id: f.id,
        categoria: 'Facturas',
        codigoBadge: 'FAC',
        badgeClase: 'bg-blue-50 text-blue-600 border border-blue-200',
        titulo: `${f.numero_factura} • ${f.cliente?.razon_social || 'Consumidor Final'}`,
        subtitulo: `Emisión: ${f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString() : 'Hoy'} • Saldo: $${(f.saldo_pendiente || 0).toFixed(2)}`,
        monto: f.total,
        estado: f.estado,
        estadoClase: f.estado === 'Pagada' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : (f.estado === 'Emitida' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-amber-700 bg-amber-50 border-amber-200'),
        ruta: `/facturas/${f.id}`
      });
    });

    // 2. Clientes
    this.service.clientes().forEach(c => {
      items.push({
        id: c.id,
        categoria: 'Clientes',
        codigoBadge: 'CLI',
        badgeClase: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
        titulo: c.razon_social,
        subtitulo: `${c.tipo_documento}: ${c.numero_documento} • ${c.direccion || c.email || 'Sin dirección registrada'}`,
        monto: c.saldo_actual,
        estado: c.saldo_actual > 0 ? 'Con saldo' : 'Al día',
        estadoClase: c.saldo_actual > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
        ruta: '/clientes'
      });
    });

    // 3. Productos
    this.service.productos().forEach(p => {
      items.push({
        id: p.id,
        categoria: 'Productos',
        codigoBadge: 'PRD',
        badgeClase: 'bg-amber-50 text-amber-700 border border-amber-200',
        titulo: p.nombre,
        subtitulo: `SKU: ${p.sku} • Tipo: ${p.tipo} • Stock: ${p.stock_actual} ${p.unidad_medida}`,
        monto: p.precio_venta,
        estado: p.activo ? (p.stock_actual <= p.stock_minimo ? 'Stock bajo' : 'Activo') : 'Inactivo',
        estadoClase: p.activo ? (p.stock_actual <= p.stock_minimo ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200') : 'text-slate-500 bg-slate-100 border-slate-200',
        ruta: '/productos'
      });
    });

    // 4. Compras y Proveedores
    try {
      const rawCompras = localStorage.getItem('facturapro_purchases_' + empId);
      if (rawCompras) {
        const ordenesRaw: any[] = JSON.parse(rawCompras);
        const proveedoresUnicos = Array.from(new Set(ordenesRaw.map(o => o.proveedor).filter(Boolean)));
        
        proveedoresUnicos.forEach((prv, idx) => {
          items.push({
            id: 'prv-' + idx,
            categoria: 'Proveedores',
            codigoBadge: 'PRV',
            badgeClase: 'bg-purple-50 text-purple-600 border border-purple-200',
            titulo: prv,
            subtitulo: 'Proveedor comercial registrado en órdenes',
            estado: 'Registrado',
            estadoClase: 'text-purple-700 bg-purple-50 border-purple-200',
            ruta: '/compras'
          });
        });

        ordenesRaw.forEach(o => {
          items.push({
            id: o.id || o.numero,
            categoria: 'Órdenes de compra',
            codigoBadge: 'OC',
            badgeClase: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
            titulo: `${o.numero} • ${o.proveedor}`,
            subtitulo: `Fecha: ${o.fecha} • Condición: ${o.condicion}`,
            monto: o.total,
            estado: o.estado || 'Emitida',
            estadoClase: 'text-indigo-700 bg-indigo-50 border-indigo-200',
            ruta: '/compras'
          });
        });
      }
    } catch {}

    // 5. Pagos
    this.service.pagos().forEach(p => {
      items.push({
        id: p.id,
        categoria: 'Pagos',
        codigoBadge: 'PAG',
        badgeClase: 'bg-teal-50 text-teal-600 border border-teal-200',
        titulo: `Recibo #${p.numero_recibo || p.id.slice(0, 8)} • ${p.metodo_pago}`,
        subtitulo: `Fecha: ${p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString() : 'Hoy'} • Ref: ${p.referencia_transaccion || 'Sin ref'}`,
        monto: p.monto,
        estado: 'Registrado',
        estadoClase: 'text-teal-700 bg-teal-50 border-teal-200',
        ruta: '/caja-bancos'
      });
    });

    // 6. Empleados
    try {
      const rawEmp = localStorage.getItem('facturapro_employees_' + empId);
      const user = this.auth.currentUser();
      const emps: any[] = [
        { id: 'usr-admin', nombre: user?.nombre || 'Administrador Principal', cargo: user?.rol || 'Administrador', sucursal: 'Matriz Principal', activo: true }
      ];
      if (rawEmp) {
        emps.push(...JSON.parse(rawEmp));
      }
      emps.forEach(e => {
        items.push({
          id: e.id,
          categoria: 'Empleados',
          codigoBadge: 'EMP',
          badgeClase: 'bg-cyan-50 text-cyan-600 border border-cyan-200',
          titulo: e.nombre,
          subtitulo: `Cargo: ${e.cargo} • Sucursal: ${e.sucursal || 'Matriz'}`,
          estado: e.activo !== false ? 'Activo' : 'Inactivo',
          estadoClase: e.activo !== false ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-100 border-slate-200',
          ruta: '/empleados'
        });
      });
    } catch {}

    // 7. Documentos
    try {
      const rawDocs = localStorage.getItem('facturapro_documents_' + empId);
      if (rawDocs) {
        const docs: any[] = JSON.parse(rawDocs);
        docs.forEach(d => {
          items.push({
            id: d.id,
            categoria: 'Documentos',
            codigoBadge: 'DOC',
            badgeClase: 'bg-slate-100 text-slate-700 border border-slate-200',
            titulo: d.nombre,
            subtitulo: `Categoría: ${d.categoria} • ${d.tamano || 'Documento'}`,
            estado: d.fecha || 'Archivo',
            estadoClase: 'text-slate-600 bg-slate-50 border-slate-200',
            ruta: '/documentos'
          });
        });
      }
    } catch {}

    // 8. Proyectos / Tareas
    try {
      const rawTasks = localStorage.getItem('facturapro_tasks_' + empId);
      if (rawTasks) {
        const tasks: any[] = JSON.parse(rawTasks);
        tasks.forEach(t => {
          items.push({
            id: t.id,
            categoria: 'Proyectos',
            codigoBadge: 'PRY',
            badgeClase: 'bg-rose-50 text-rose-600 border border-rose-200',
            titulo: t.titulo,
            subtitulo: `Etiqueta: ${t.etiqueta} • ${t.descripcion || 'Sin descripción'}`,
            estado: t.estado === 'done' ? 'Completada' : (t.estado === 'inprogress' ? 'En Proceso' : 'Por Hacer'),
            estadoClase: t.estado === 'done' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : (t.estado === 'inprogress' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-slate-600 bg-slate-100 border-slate-200'),
            ruta: '/proyectos'
          });
        });
      }
    } catch {}

    return items;
  });

  // Conteo dinámico de elementos por categoría
  conteoPorCategoria = computed<{ [key: string]: number }>(() => {
    const todos = this.todosLosItems();
    const conteos: { [key: string]: number } = {
      'Todos': todos.length
    };
    this.categorias.forEach(cat => {
      if (cat !== 'Todos') {
        conteos[cat] = todos.filter(it => it.categoria === cat).length;
      }
    });
    return conteos;
  });

  // Resultados filtrados según categoría y término de búsqueda
  resultadosFiltrados = computed<ItemBusqueda[]>(() => {
    let list = this.todosLosItems();
    const cat = this.categoriaFiltro();
    const q = this.terminoBusqueda().trim().toLowerCase();

    if (cat !== 'Todos') {
      list = list.filter(it => it.categoria === cat);
    }

    if (q) {
      list = list.filter(it => 
        it.titulo.toLowerCase().includes(q) ||
        it.subtitulo.toLowerCase().includes(q) ||
        it.codigoBadge.toLowerCase().includes(q) ||
        (it.estado && it.estado.toLowerCase().includes(q))
      );
    }

    return list;
  });

  toggleSidebar() {
    this.sidebarAbierto.update(v => !v);
  }

  cerrarSidebar() {
    this.sidebarAbierto.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.toggleBuscador();
    } else if (event.key === 'Escape' && this.modalBusquedaAbierto()) {
      this.modalBusquedaAbierto.set(false);
    }
  }

  toggleBuscador() {
    this.modalBusquedaAbierto.update(v => !v);
    if (this.modalBusquedaAbierto()) {
      this.terminoBusqueda.set('');
    }
  }

  cerrarModalBusqueda() {
    this.modalBusquedaAbierto.set(false);
  }

  seleccionarCategoria(cat: string) {
    this.categoriaFiltro.set(cat);
  }

  navegarA(item: ItemBusqueda) {
    this.modalBusquedaAbierto.set(false);
    this.router.navigateByUrl(item.ruta);
  }

  navegarRuta(ruta: string) {
    this.modalBusquedaAbierto.set(false);
    this.router.navigateByUrl(ruta);
  }

  toggleMenuUsuario() {
    this.menuUsuarioAbierto.update(v => !v);
    this.menuNotificacionesAbierto.set(false);
    this.menuEmpresasAbierto.set(false);
  }

  toggleMenuEmpresas() {
    this.menuEmpresasAbierto.update(v => !v);
    this.menuUsuarioAbierto.set(false);
    this.menuNotificacionesAbierto.set(false);
  }

  async conmutarEmpresa(empresaId: string) {
    try {
      await this.auth.cambiarEmpresaActiva(empresaId);
      this.menuEmpresasAbierto.set(false);
      this.router.navigate(['/']);
    } catch (err: any) {
      alert(err?.message || 'Error al cambiar de empresa');
    }
  }

  toggleNotificaciones() {
    this.menuNotificacionesAbierto.update(v => !v);
    this.menuUsuarioAbierto.set(false);
    this.menuEmpresasAbierto.set(false);
    this.notificacionesLeidas.set(true);
  }

  cerrarSesion() {
    this.menuUsuarioAbierto.set(false);
    this.menuEmpresasAbierto.set(false);
    this.auth.logout();
  }
}
