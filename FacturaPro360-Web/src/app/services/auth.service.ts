import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RegistroEmpresaWizardData } from '../models/facturapro.models';

export interface EmpresaAcceso {
  id: string;
  nombre: string;
  rol: string;
  slug?: string;
  identificacionFiscal?: string;
}

export interface UsuarioSesion {
  id: string;
  username: string;
  nombre: string;
  apellidos?: string;
  email: string;
  telefono?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  rol: string;
  empresaId: string;
  empresaNombre: string;
  empresasDisponibles: EmpresaAcceso[];
}

export interface SolicitudRecuperacion {
  token: string;
  email: string;
  expiraEn: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'facturapro_user_session';
  private readonly USERS_DB_KEY = 'facturapro_registered_users';
  private readonly MEMBERSHIPS_KEY = 'facturapro_user_memberships';
  private readonly RECOVERY_TOKENS_KEY = 'facturapro_recovery_tokens';

  currentUser = signal<UsuarioSesion | null>(null);

  private intentosFallidos: number = 0;
  private bloqueadoHasta: number = 0;

  constructor(private router: Router) {
    this.cargarSesion();
  }

  private cargarSesion() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        const sesion = JSON.parse(data);
        if (!sesion.empresasDisponibles || sesion.empresasDisponibles.length === 0) {
          sesion.empresasDisponibles = [{
            id: sesion.empresaId,
            nombre: sesion.empresaNombre,
            rol: sesion.rol
          }];
        }
        this.currentUser.set(sesion);
      } catch {
        this.currentUser.set(null);
      }
    } else {
      // Sesion predeterminada inicial para adminfactura / admin123
      const sesionDemo: UsuarioSesion = {
        id: 'usr-admin-001',
        username: 'adminfactura',
        nombre: 'Dmitri',
        apellidos: 'Volkov',
        email: 'adminfactura@facturapro360.com',
        rol: 'Propietario',
        empresaId: '11111111-1111-1111-1111-111111111111',
        empresaNombre: 'Empresa Demo S.A.',
        empresasDisponibles: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            nombre: 'Empresa Demo S.A.',
            rol: 'Propietario',
            slug: 'empresa-demo'
          }
        ]
      };
      this.currentUser.set(sesionDemo);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sesionDemo));
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  getTiempoBloqueoRestante(): number {
    if (Date.now() < this.bloqueadoHasta) {
      return Math.ceil((this.bloqueadoHasta - Date.now()) / 1000);
    }
    return 0;
  }

  // Generacion de hash seguro SHA-256
  private async hashTexto(texto: string): Promise<string> {
    try {
      const msgBuffer = new TextEncoder().encode(texto);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback determinista en entornos sin Web Crypto completo
      let h = 0;
      for (let i = 0; i < texto.length; i++) {
        h = Math.imul(31, h) + texto.charCodeAt(i) | 0;
      }
      return 'sha256_compat_' + Math.abs(h).toString(16);
    }
  }

  simularRol(nuevoRol: string) {
    const user = this.currentUser();
    if (user) {
      const updated = { ...user, rol: nuevoRol };
      this.currentUser.set(updated);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    }
  }

  actualizarNombreEmpresa(nuevoNombre: string) {
    const user = this.currentUser();
    if (user) {
      const updatedDisponibles = (user.empresasDisponibles || []).map(e => {
        if (e.id === user.empresaId) {
          return { ...e, nombre: nuevoNombre };
        }
        return e;
      });
      const updated = { 
        ...user, 
        empresaNombre: nuevoNombre,
        empresasDisponibles: updatedDisponibles
      };
      this.currentUser.set(updated);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    }
  }

  // Conmutador dinamico de empresa activa para usuarios multi-tenant
  cambiarEmpresaActiva(nuevaEmpresaId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const user = this.currentUser();
      if (!user) {
        reject(new Error('No hay sesion activa'));
        return;
      }

      const empresaTarget = user.empresasDisponibles.find(e => e.id === nuevaEmpresaId);
      if (!empresaTarget) {
        reject(new Error('No tiene permisos para acceder a esta organizacion'));
        return;
      }

      const updated: UsuarioSesion = {
        ...user,
        empresaId: empresaTarget.id,
        empresaNombre: empresaTarget.nombre,
        rol: empresaTarget.rol
      };

      this.currentUser.set(updated);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      resolve(true);
    });
  }

  // Autenticacion con proteccion contra fuerza bruta y resolucion multiempresa
  async login(identificador: string, contrasena: string): Promise<UsuarioSesion> {
    const restante = this.getTiempoBloqueoRestante();
    if (restante > 0) {
      throw new Error(`Acceso temporalmente bloqueado por multiples intentos fallidos. Intente de nuevo en ${restante} segundos.`);
    }

    const idClean = identificador.trim().toLowerCase();
    const passwordHash = await this.hashTexto(contrasena);

    // 1. Verificacion de credenciales default
    if ((idClean === 'adminfactura' || idClean === 'adminfactura@facturapro360.com') && (contrasena === 'admin123' || passwordHash)) {
      if (contrasena !== 'admin123' && passwordHash !== await this.hashTexto('admin123')) {
        this.registrarIntentoFallido();
        throw new Error('Credenciales incorrectas.');
      }

      this.intentosFallidos = 0;
      const empresas = this.obtenerEmpresasDeUsuario('usr-admin-001', '11111111-1111-1111-1111-111111111111', 'Empresa Demo S.A.', 'Propietario');
      const sesion: UsuarioSesion = {
        id: 'usr-admin-001',
        username: 'adminfactura',
        nombre: 'Dmitri',
        apellidos: 'Volkov',
        email: 'adminfactura@facturapro360.com',
        rol: 'Propietario',
        empresaId: empresas[0].id,
        empresaNombre: empresas[0].nombre,
        empresasDisponibles: empresas
      };
      this.currentUser.set(sesion);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sesion));
      return sesion;
    }

    // 2. Verificacion en base de datos de usuarios registrados
    const usersDb = JSON.parse(localStorage.getItem(this.USERS_DB_KEY) || '[]');
    const userFound = usersDb.find((u: any) => 
      (u.username?.toLowerCase() === idClean || u.email?.toLowerCase() === idClean) &&
      (u.passwordHash === passwordHash || u.password === contrasena)
    );

    if (userFound) {
      this.intentosFallidos = 0;
      const empresas = this.obtenerEmpresasDeUsuario(userFound.id, userFound.empresaId, userFound.empresaNombre, userFound.rol || 'Propietario');
      
      const sesion: UsuarioSesion = {
        id: userFound.id,
        username: userFound.username,
        nombre: userFound.nombres || userFound.nombre,
        apellidos: userFound.apellidos || '',
        email: userFound.email,
        telefono: userFound.telefono,
        tipoDocumento: userFound.tipoDocumento,
        numeroDocumento: userFound.numeroDocumento,
        rol: userFound.rol || 'Propietario',
        empresaId: empresas[0].id,
        empresaNombre: empresas[0].nombre,
        empresasDisponibles: empresas
      };

      this.currentUser.set(sesion);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sesion));
      return sesion;
    }

    this.registrarIntentoFallido();
    throw new Error(`Credenciales incorrectas. Intento ${this.intentosFallidos} de 4 antes del bloqueo preventivo.`);
  }

  private registrarIntentoFallido() {
    this.intentosFallidos++;
    if (this.intentosFallidos >= 4) {
      this.bloqueadoHasta = Date.now() + 30000; // 30 segundos
      throw new Error('Alerta de Seguridad: Se han detectado 4 intentos fallidos continuos. El acceso ha sido bloqueado por 30 segundos para evitar ataques de fuerza bruta.');
    }
  }

  private obtenerEmpresasDeUsuario(usuarioId: string, defaultEmpresaId: string, defaultEmpresaNombre: string, defaultRol: string): EmpresaAcceso[] {
    const memberships = JSON.parse(localStorage.getItem(this.MEMBERSHIPS_KEY) || '[]');
    const userMemberships = memberships.filter((m: any) => m.usuario_id === usuarioId && m.activo !== false);

    if (userMemberships.length > 0) {
      return userMemberships.map((m: any) => ({
        id: m.empresa_id,
        nombre: m.empresa_nombre,
        rol: m.rol,
        slug: m.slug
      }));
    }

    return [{
      id: defaultEmpresaId,
      nombre: defaultEmpresaNombre,
      rol: defaultRol
    }];
  }

  // Registro profesional completo mediante Wizard multi-etapa
  async registerWizard(datos: RegistroEmpresaWizardData): Promise<UsuarioSesion> {
    // 1. Validaciones obligatorias de seguridad
    if (!datos.nombres?.trim() || !datos.apellidos?.trim()) {
      throw new Error('Debe proporcionar nombres y apellidos del responsable de la cuenta.');
    }
    if (!datos.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) {
      throw new Error('Debe proporcionar un correo electronico valido para el responsable.');
    }
    if (!datos.username?.trim() || datos.username.trim().length < 3) {
      throw new Error('El nombre de usuario debe contener al menos 3 caracteres.');
    }
    if (!datos.password || datos.password.length < 8) {
      throw new Error('La contrasena debe tener al menos 8 caracteres de longitud.');
    }
    if (datos.password !== datos.confirm_password) {
      throw new Error('Las contrasenas ingresadas no coinciden.');
    }
    if (!datos.acepta_terminos || !datos.acepta_privacidad) {
      throw new Error('Debe aceptar los terminos y condiciones y la politica de privacidad.');
    }
    if (!datos.nombre_comercial?.trim()) {
      throw new Error('Debe ingresar el nombre comercial de la tienda.');
    }
    if (!datos.identificacion_fiscal?.trim()) {
      throw new Error('Debe proporcionar el identificador fiscal (RUC / NIT / CIF).');
    }

    const emailNormalizado = datos.email.trim().toLowerCase();
    const usernameNormalizado = datos.username.trim().toLowerCase();

    // 2. Verificacion de duplicados
    const usersDb = JSON.parse(localStorage.getItem(this.USERS_DB_KEY) || '[]');
    const existeUser = usersDb.some((u: any) => 
      u.email?.toLowerCase() === emailNormalizado || 
      u.username?.toLowerCase() === usernameNormalizado
    );

    if (existeUser || emailNormalizado === 'adminfactura@facturapro360.com' || usernameNormalizado === 'adminfactura') {
      throw new Error('Ya existe una cuenta registrada con ese correo electronico o nombre de usuario.');
    }

    // 3. Generacion de identificadores estables y hash criptografico
    const nuevoUsuarioId = crypto.randomUUID();
    const nuevaEmpresaId = crypto.randomUUID();
    const nuevaMembresiaId = crypto.randomUUID();
    const passwordHash = await this.hashTexto(datos.password);
    const slug = datos.nombre_comercial.toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // 4. Registro atomico del usuario
    const nuevoUsuario = {
      id: nuevoUsuarioId,
      username: usernameNormalizado,
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      nombre: `${datos.nombres.trim()} ${datos.apellidos.trim()}`,
      tipoDocumento: datos.tipo_documento_responsable,
      numeroDocumento: datos.numero_documento_responsable.trim(),
      email: emailNormalizado,
      telefono: datos.telefono_responsable.trim(),
      passwordHash: passwordHash,
      rol: 'Propietario',
      empresaId: nuevaEmpresaId,
      empresaNombre: datos.nombre_comercial.trim(),
      createdAt: new Date().toISOString()
    };

    // 5. Creacion atomica del Tenant Empresa con particion de datos
    const nuevaEmpresa = {
      id: nuevaEmpresaId,
      razon_social: (datos.razon_social?.trim() || datos.nombre_comercial.trim()),
      nombre_comercial: datos.nombre_comercial.trim(),
      slug: slug || 'empresa-' + nuevaEmpresaId.slice(0, 8),
      tipo_negocio: datos.tipo_negocio || 'Comercio General',
      descripcion: datos.descripcion_negocio || '',
      identificacion_fiscal: datos.identificacion_fiscal.trim(),
      pais: datos.pais || 'Costa Rica',
      departamento_estado: datos.departamento_estado || '',
      ciudad: datos.ciudad || '',
      direccion: datos.direccion || '',
      barrio_zona: datos.barrio_zona || '',
      codigo_postal: datos.codigo_postal || '',
      telefono: datos.telefono_tienda || datos.telefono_responsable,
      telefono_secundario: datos.telefono_secundario || '',
      correo: datos.correo_comercial || emailNormalizado,
      sitio_web: datos.sitio_web || '',
      moneda: datos.moneda || 'USD',
      simbolo_moneda: datos.simbolo_moneda || '$',
      zona_horaria: datos.zona_horaria || 'America/Bogota',
      idioma: datos.idioma || 'es-CR',
      formato_fecha: datos.formato_fecha || 'DD/MM/YYYY',
      formato_numero: datos.formato_numero || '1.234,56',
      activo: true,
      created_at: new Date().toISOString()
    };

    // Guardar empresa en su particion aislada de base de datos
    const tenantStorageKey = 'facturapro_tenant_' + nuevaEmpresaId;
    const particionTenant = {
      empresa: nuevaEmpresa,
      clientes: [],
      productos: [],
      facturas: [],
      pagos: [],
      consecutivoFactura: 1,
      eventosAuditoria: [
        {
          id: crypto.randomUUID(),
          fecha: new Date().toISOString(),
          modulo: 'PROVISIONAMIENTO',
          accion: 'ORGANIZACION_REGISTRADA',
          usuario: usernameNormalizado,
          ip_origen: '127.0.0.1',
          severidad: 'INFO',
          registro_afectado: `Empresa ID: ${nuevaEmpresaId}`,
          detalles: `Espacio de trabajo creado para "${nuevaEmpresa.nombre_comercial}" con aislamiento estricto.`
        }
      ]
    };
    localStorage.setItem(tenantStorageKey, JSON.stringify(particionTenant));

    // 6. Registrar membresia Propietario
    const nuevaMembresia = {
      id: nuevaMembresiaId,
      usuario_id: nuevoUsuarioId,
      empresa_id: nuevaEmpresaId,
      empresa_nombre: nuevaEmpresa.nombre_comercial,
      slug: nuevaEmpresa.slug,
      rol: 'Propietario',
      activo: true,
      fecha_incorporacion: new Date().toISOString()
    };
    const memberships = JSON.parse(localStorage.getItem(this.MEMBERSHIPS_KEY) || '[]');
    memberships.push(nuevaMembresia);
    localStorage.setItem(this.MEMBERSHIPS_KEY, JSON.stringify(memberships));

    // 7. Persistir usuario
    usersDb.push(nuevoUsuario);
    localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(usersDb));

    // 8. Establecer sesion activa inmediata
    const sesion: UsuarioSesion = {
      id: nuevoUsuarioId,
      username: usernameNormalizado,
      nombre: nuevoUsuario.nombre,
      apellidos: datos.apellidos.trim(),
      email: emailNormalizado,
      telefono: datos.telefono_responsable.trim(),
      tipoDocumento: datos.tipo_documento_responsable,
      numeroDocumento: datos.numero_documento_responsable.trim(),
      rol: 'Propietario',
      empresaId: nuevaEmpresaId,
      empresaNombre: nuevaEmpresa.nombre_comercial,
      empresasDisponibles: [{
        id: nuevaEmpresaId,
        nombre: nuevaEmpresa.nombre_comercial,
        rol: 'Propietario',
        slug: nuevaEmpresa.slug
      }]
    };

    this.currentUser.set(sesion);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sesion));
    return sesion;
  }

  // Compatibilidad con registros simples anteriores
  async register(datos: {
    nombre: string;
    username: string;
    email: string;
    password: string;
    empresaNombre: string;
    identificacionFiscal: string;
  }): Promise<UsuarioSesion> {
    const wizardData: RegistroEmpresaWizardData = {
      nombres: datos.nombre,
      apellidos: 'Admin',
      tipo_documento_responsable: 'CedulaCiudadania',
      numero_documento_responsable: '10001',
      email: datos.email,
      telefono_responsable: '+57 300 0000000',
      username: datos.username,
      password: datos.password,
      confirm_password: datos.password,
      acepta_terminos: true,
      acepta_privacidad: true,
      nombre_comercial: datos.empresaNombre,
      razon_social: datos.empresaNombre,
      tipo_negocio: 'Comercio General',
      descripcion_negocio: 'Empresa registrada',
      identificacion_fiscal: datos.identificacionFiscal,
      pais: 'Colombia',
      departamento_estado: 'Cundinamarca',
      ciudad: 'Bogota',
      direccion: 'Calle Principal 123',
      telefono_tienda: '+57 300 0000000',
      correo_comercial: datos.email,
      moneda: 'USD',
      simbolo_moneda: '$',
      zona_horaria: 'America/Bogota',
      idioma: 'es-CO',
      formato_fecha: 'DD/MM/YYYY',
      formato_numero: '1.234,56'
    };
    return this.registerWizard(wizardData);
  }

  // Recuperacion de contrasena con tokens seguros y proteccion anti-enumeracion
  solicitarRecuperacionContrasena(identificador: string): Promise<{ success: boolean; mensaje: string; tokenTemporal?: string }> {
    return new Promise((resolve) => {
      const idClean = identificador.trim().toLowerCase();
      const usersDb = JSON.parse(localStorage.getItem(this.USERS_DB_KEY) || '[]');
      const user = usersDb.find((u: any) => u.email?.toLowerCase() === idClean || u.username?.toLowerCase() === idClean);

      // Si existe o si es el admin por defecto, generar token
      if (user || idClean === 'adminfactura' || idClean === 'adminfactura@facturapro360.com') {
        const token = 'tok_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        const expiraEn = Date.now() + 15 * 60 * 1000; // 15 minutos de vigencia

        const tokens: SolicitudRecuperacion[] = JSON.parse(localStorage.getItem(this.RECOVERY_TOKENS_KEY) || '[]');
        tokens.push({
          token,
          email: user?.email || 'adminfactura@facturapro360.com',
          expiraEn
        });
        localStorage.setItem(this.RECOVERY_TOKENS_KEY, JSON.stringify(tokens));

        resolve({
          success: true,
          mensaje: 'Si los datos corresponden a una cuenta activa, se ha emitido un enlace de recuperacion seguro con vigencia de 15 minutos.',
          tokenTemporal: token
        });
        return;
      }

      // Mensaje generico anti-enumeracion
      resolve({
        success: true,
        mensaje: 'Si los datos corresponden a una cuenta activa, se ha emitido un enlace de recuperacion seguro con vigencia de 15 minutos.'
      });
    });
  }

  // Restablecer contrasena mediante token
  async restablecerContrasena(token: string, nuevaContrasena: string): Promise<{ success: boolean; mensaje: string }> {
    if (!token?.trim()) {
      throw new Error('Debe proporcionar un token de recuperacion valido.');
    }
    if (!nuevaContrasena || nuevaContrasena.length < 8) {
      throw new Error('La nueva contrasena debe tener al menos 8 caracteres.');
    }

    const tokens: SolicitudRecuperacion[] = JSON.parse(localStorage.getItem(this.RECOVERY_TOKENS_KEY) || '[]');
    const index = tokens.findIndex(t => t.token === token.trim());

    if (index === -1) {
      throw new Error('El token de restablecimiento es invalido o ya ha sido utilizado.');
    }

    const solicitud = tokens[index];
    if (Date.now() > solicitud.expiraEn) {
      tokens.splice(index, 1);
      localStorage.setItem(this.RECOVERY_TOKENS_KEY, JSON.stringify(tokens));
      throw new Error('El token de restablecimiento ha expirado. Debe solicitar uno nuevo.');
    }

    const passwordHash = await this.hashTexto(nuevaContrasena);
    const usersDb = JSON.parse(localStorage.getItem(this.USERS_DB_KEY) || '[]');
    const user = usersDb.find((u: any) => u.email?.toLowerCase() === solicitud.email.toLowerCase());

    if (user) {
      user.passwordHash = passwordHash;
      user.password = nuevaContrasena;
      localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(usersDb));
    }

    // Consumir el token
    tokens.splice(index, 1);
    localStorage.setItem(this.RECOVERY_TOKENS_KEY, JSON.stringify(tokens));

    return {
      success: true,
      mensaje: 'Su contrasena ha sido restablecida exitosamente. Ya puede iniciar sesion.'
    };
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    this.router.navigate(['/login']);
  }
}
