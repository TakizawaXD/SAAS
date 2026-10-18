import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FacturasListComponent } from './components/facturas/facturas-list.component';
import { NuevaFacturaComponent } from './components/facturas/nueva-factura.component';
import { DetalleFacturaComponent } from './components/facturas/detalle-factura.component';
import { ClientesComponent } from './components/clientes/clientes.component';
import { ProductosComponent } from './components/productos/productos.component';
import { ComprasComponent } from './components/compras/compras.component';
import { CajaBancosComponent } from './components/caja-bancos/caja-bancos.component';
import { FinanzasComponent } from './components/finanzas/finanzas.component';
import { EmpleadosComponent } from './components/empleados/empleados.component';
import { SucursalesComponent } from './components/sucursales/sucursales.component';
import { ProyectosComponent } from './components/proyectos/proyectos.component';
import { DocumentosComponent } from './components/documentos/documentos.component';
import { InformesComponent } from './components/informes/informes.component';
import { AutomatizacionesComponent } from './components/automatizaciones/automatizaciones.component';
import { AuditoriaComponent } from './components/auditoria/auditoria.component';
import { IntegracionesComponent } from './components/integraciones/integraciones.component';
import { ConfiguracionComponent } from './components/configuracion/configuracion.component';
import { AdministracionComponent } from './components/administracion/administracion.component';
import { SeguridadLabComponent } from './components/seguridad/seguridad-lab.component';
import { Error404Component } from './components/errors/error-404.component';
import { Error403Component } from './components/errors/error-403.component';
import { Error500Component } from './components/errors/error-500.component';
import { LandingComponent } from './components/landing/landing.component';

export const routes: Routes = [
  // Página de presentación del sistema (Landing Page oficial)
  { path: '', component: LandingComponent },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Páginas explícitas de estado y error del sistema
  { path: '404', component: Error404Component },
  { path: '403', component: Error403Component },
  { path: '500', component: Error500Component },

  // Panel interno de control y Rutas protegidas con AuthGuard
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'app', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'facturas', component: FacturasListComponent, canActivate: [authGuard] },
  { path: 'nueva-factura', component: NuevaFacturaComponent, canActivate: [authGuard] },
  { path: 'facturas/:id', component: DetalleFacturaComponent, canActivate: [authGuard] },
  { path: 'clientes', component: ClientesComponent, canActivate: [authGuard] },
  { path: 'productos', component: ProductosComponent, canActivate: [authGuard] },
  { path: 'compras', component: ComprasComponent, canActivate: [authGuard] },
  { path: 'caja-bancos', component: CajaBancosComponent, canActivate: [authGuard] },
  { path: 'finanzas', component: FinanzasComponent, canActivate: [authGuard] },
  { path: 'empleados', component: EmpleadosComponent, canActivate: [authGuard] },
  { path: 'sucursales', component: SucursalesComponent, canActivate: [authGuard] },
  { path: 'proyectos', component: ProyectosComponent, canActivate: [authGuard] },
  { path: 'documentos', component: DocumentosComponent, canActivate: [authGuard] },
  { path: 'informes', component: InformesComponent, canActivate: [authGuard] },
  { path: 'automatizaciones', component: AutomatizacionesComponent, canActivate: [authGuard] },
  
  // Rutas con protección estricta de Roles (RoleGuard)
  { path: 'auditoria', component: AuditoriaComponent, canActivate: [authGuard, roleGuard] },
  { path: 'seguridad', component: SeguridadLabComponent, canActivate: [authGuard] },
  { path: 'integraciones', component: IntegracionesComponent, canActivate: [authGuard] },
  { path: 'configuracion', component: ConfiguracionComponent, canActivate: [authGuard, roleGuard] },
  { path: 'administracion', component: AdministracionComponent, canActivate: [authGuard, roleGuard] },
  
  // Wildcard para rutas inexistentes, absurdas o maliciosas -> Página Error 404
  { path: '**', component: Error404Component }
];

